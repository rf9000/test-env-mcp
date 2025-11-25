/**
 * Configuration Service
 *
 * Manages application configuration with multi-source loading:
 * 1. Default values (from schema)
 * 2. mcp-config.json file (optional)
 * 3. Environment variables (override)
 * 4. VS Code settings (for extension compatibility)
 *
 * Validates all configuration with Zod schemas for type safety.
 */
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ValidationError } from '../errors/errors.js';
/**
 * Configuration schema with validation and defaults
 *
 * All fields have sensible defaults for production use.
 * Environment variables can override any setting.
 */
const ConfigSchema = z.object({
    api: z.object({
        url: z.string().url().default('https://demoportaldev.continiaonline.com/api/v1.0'),
        timeoutMs: z.number().min(1000).max(300000).default(30000)
    }),
    test: z.object({
        defaultTimeoutSeconds: z.number().min(10).max(7200).default(600),
        initialPollIntervalMs: z.number().min(500).max(10000).default(2000),
        maxPollIntervalMs: z.number().min(1000).max(60000).default(30000),
        backoffFactor: z.number().min(1.1).max(5).default(2)
    }),
    logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        format: z.enum(['json', 'text']).default('json')
    }),
    auth: z.object({
        devTenant: z.string().default('default'),
        allowInsecureCertificates: z.boolean().default(false),
        interactivePrompts: z.boolean().default(false) // false for MCP, true for VS Code
    }),
    environment: z.object({
        defaultAuthMethod: z.enum(['NavUserPassword', 'Windows', 'AzureAd']).default('NavUserPassword')
    })
});
/**
 * Configuration service singleton
 *
 * Loads configuration once on first access, then caches it.
 * Thread-safe for Node.js single-threaded model.
 *
 * @example
 * const config = ConfigurationService.getInstance();
 * const apiUrl = config.getApiUrl();
 * const token = config.getApiToken();
 */
export class ConfigurationService {
    static instance = null;
    config;
    apiToken;
    constructor() {
        const { config, token } = this.loadConfiguration();
        this.config = config;
        this.apiToken = token;
    }
    /**
     * Get singleton instance
     *
     * Creates instance on first call, returns cached instance thereafter.
     */
    static getInstance() {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }
    /**
     * Reset singleton instance (for testing)
     *
     * Forces configuration reload on next getInstance() call.
     */
    static resetInstance() {
        ConfigurationService.instance = null;
    }
    /**
     * Load configuration from multiple sources with priority:
     * 1. Default values (from schema)
     * 2. Config file (mcp-config.json if exists)
     * 3. Environment variables (highest priority)
     *
     * @returns Validated configuration and API token
     * @throws ValidationError if token is missing or config is invalid
     */
    loadConfiguration() {
        // Step 1: Load API token with fallback strategy
        const token = this.loadApiToken();
        // Step 2: Load config file if exists
        const fileConfig = this.loadConfigFile();
        // Step 3: Build config with environment overrides
        const envOverrides = this.loadEnvironmentOverrides();
        // Step 4: Merge and validate
        const mergedConfig = {
            api: {
                ...fileConfig.api,
                ...envOverrides.api
            },
            test: {
                ...fileConfig.test,
                ...envOverrides.test
            },
            logging: {
                ...fileConfig.logging,
                ...envOverrides.logging
            },
            auth: {
                ...fileConfig.auth,
                ...envOverrides.auth
            },
            environment: {
                ...fileConfig.environment,
                ...envOverrides.environment
            }
        };
        // Validate and apply defaults
        const config = ConfigSchema.parse(mergedConfig);
        return { config, token };
    }
    /**
     * Load API token from VS Code settings or environment variable
     *
     * Priority:
     * 1. VS Code setting (for extension compatibility)
     * 2. DEMO_PORTAL_TOKEN environment variable
     *
     * @throws ValidationError if token not found
     */
    loadApiToken() {
        // Try VS Code settings first (for extension compatibility)
        // In MCP context, this would come from MCP settings
        const vsCodeToken = process.env.VSCODE_API_TOKEN;
        // Fall back to environment variable (standard for CLI/MCP)
        const envToken = process.env.DEMO_PORTAL_TOKEN;
        const token = vsCodeToken || envToken;
        if (!token || token.trim().length === 0) {
            throw new ValidationError('DEMO_PORTAL_TOKEN not set. Set it via environment variable:\n' +
                '  export DEMO_PORTAL_TOKEN=your_token_here\n\n' +
                'Or add it to your .env file:\n' +
                '  DEMO_PORTAL_TOKEN=your_token_here', {
                missingVariable: 'DEMO_PORTAL_TOKEN',
                suggestedActions: ['SetEnvironmentVariable', 'CreateDotEnvFile']
            });
        }
        return token.trim();
    }
    /**
     * Load configuration from mcp-config.json if it exists
     *
     * @returns Partial configuration from file, or empty object if file doesn't exist
     */
    loadConfigFile() {
        const configPaths = [
            './mcp-config.json',
            join(process.cwd(), 'mcp-config.json'),
            join(__dirname, '../../mcp-config.json')
        ];
        for (const configPath of configPaths) {
            if (existsSync(configPath)) {
                try {
                    const content = readFileSync(configPath, 'utf-8');
                    const parsed = JSON.parse(content);
                    return parsed;
                }
                catch (error) {
                    // Config file is optional, so we just skip invalid files
                    console.warn(`Failed to load config file ${configPath}:`, error);
                }
            }
        }
        return {};
    }
    /**
     * Load configuration overrides from environment variables
     *
     * Environment variables have highest priority and override file config.
     */
    loadEnvironmentOverrides() {
        const overrides = {};
        // API overrides
        if (process.env.DEMO_PORTAL_BASE_URL) {
            overrides.api = { url: process.env.DEMO_PORTAL_BASE_URL };
        }
        if (process.env.API_TIMEOUT_MS) {
            overrides.api = { ...overrides.api, timeoutMs: parseInt(process.env.API_TIMEOUT_MS, 10) };
        }
        // Test overrides
        if (process.env.TEST_TIMEOUT_SEC || process.env.POLL_INITIAL_MS || process.env.POLL_MAX_MS || process.env.POLL_BACKOFF) {
            overrides.test = {};
            if (process.env.TEST_TIMEOUT_SEC) {
                overrides.test.defaultTimeoutSeconds = parseInt(process.env.TEST_TIMEOUT_SEC, 10);
            }
            if (process.env.POLL_INITIAL_MS) {
                overrides.test.initialPollIntervalMs = parseInt(process.env.POLL_INITIAL_MS, 10);
            }
            if (process.env.POLL_MAX_MS) {
                overrides.test.maxPollIntervalMs = parseInt(process.env.POLL_MAX_MS, 10);
            }
            if (process.env.POLL_BACKOFF) {
                overrides.test.backoffFactor = parseFloat(process.env.POLL_BACKOFF);
            }
        }
        // Logging overrides
        if (process.env.LOG_LEVEL || process.env.LOG_FORMAT) {
            overrides.logging = {};
            if (process.env.LOG_LEVEL) {
                overrides.logging.level = process.env.LOG_LEVEL;
            }
            if (process.env.LOG_FORMAT) {
                overrides.logging.format = process.env.LOG_FORMAT;
            }
        }
        // Auth overrides
        if (process.env.DEV_TENANT || process.env.ALLOW_INSECURE_CERTS || process.env.INTERACTIVE_PROMPTS) {
            overrides.auth = {};
            if (process.env.DEV_TENANT) {
                overrides.auth.devTenant = process.env.DEV_TENANT;
            }
            if (process.env.ALLOW_INSECURE_CERTS !== undefined) {
                overrides.auth.allowInsecureCertificates = process.env.ALLOW_INSECURE_CERTS === 'true';
            }
            if (process.env.INTERACTIVE_PROMPTS !== undefined) {
                overrides.auth.interactivePrompts = process.env.INTERACTIVE_PROMPTS === 'true';
            }
        }
        // Environment overrides
        if (process.env.DEFAULT_AUTH_METHOD) {
            overrides.environment = {
                defaultAuthMethod: process.env.DEFAULT_AUTH_METHOD
            };
        }
        return overrides;
    }
    /**
     * Get Demo Portal API token
     *
     * @returns Bearer token for Demo Portal API authentication
     */
    getApiToken() {
        return this.apiToken;
    }
    /**
     * Get Demo Portal API base URL
     *
     * @returns Base URL for Demo Portal API (without trailing slash)
     */
    getApiUrl() {
        return this.config.api.url;
    }
    /**
     * Get full configuration object
     *
     * @returns Complete validated configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get a specific configuration value by path
     *
     * @param path - Dot-notation path to config value (e.g., 'api.url')
     * @param defaultValue - Default if path not found
     * @returns Configuration value at path
     *
     * @example
     * config.get('api.url') // 'https://...'
     * config.get('test.defaultTimeoutSeconds') // 600
     */
    get(path, defaultValue) {
        const parts = path.split('.');
        let current = this.config;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return defaultValue;
            }
        }
        return current;
    }
}
//# sourceMappingURL=configurationService.js.map