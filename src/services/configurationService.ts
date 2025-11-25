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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ValidationError } from '../errors/errors.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  }),
  testRunner: z.object({
    /** Path to the Test Runner BC app source */
    sourcePath: z.string().default('C:\\GeneralDev\\MCPDevelopment\\AL Developer Tools - Continia AL Test Runner\\bc-app'),
    /** Enable auto-installation of Test Runner when missing */
    autoInstall: z.boolean().default(true),
    /** Schema update mode for Test Runner publication */
    schemaUpdateMode: z.enum(['synchronize', 'forcesync']).default('forcesync'),
    /** Duration to cache Test Runner status per environment (ms) */
    statusCacheDurationMs: z.number().min(0).max(3600000).default(300000)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Deep partial type for configuration overrides
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

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
  private static instance: ConfigurationService | null = null;
  private config: Config;
  private apiToken: string | null;

  private constructor() {
    const { config, token } = this.loadConfiguration();
    this.config = config;
    this.apiToken = token;
  }

  /**
   * Get singleton instance
   *
   * Creates instance on first call, returns cached instance thereafter.
   */
  static getInstance(): ConfigurationService {
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
  static resetInstance(): void {
    ConfigurationService.instance = null;
  }

  /**
   * Load configuration from multiple sources with priority:
   * 1. Default values (from schema)
   * 2. Config file (mcp-config.json if exists)
   * 3. Environment variables (highest priority)
   *
   * @returns Validated configuration and API token (token may be null)
   * @throws ValidationError if config is invalid (but not for missing token)
   */
  private loadConfiguration(): { config: Config; token: string | null } {
    // Step 1: Load API token with fallback strategy (returns null if missing)
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
      },
      testRunner: {
        ...fileConfig.testRunner,
        ...envOverrides.testRunner
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
   * @returns API token or null if not found
   */
  private loadApiToken(): string | null {
    // Try VS Code settings first (for extension compatibility)
    // In MCP context, this would come from MCP settings
    const vsCodeToken = process.env.VSCODE_API_TOKEN;

    // Fall back to environment variable (standard for CLI/MCP)
    const envToken = process.env.DEMO_PORTAL_TOKEN;

    const token = vsCodeToken || envToken;

    // Return null instead of throwing - allows server to start without token
    if (!token || token.trim().length === 0) {
      console.warn('DEMO_PORTAL_TOKEN not set. API operations will fail until token is configured.');
      return null;
    }

    return token.trim();
  }

  /**
   * Load configuration from mcp-config.json if it exists
   *
   * @returns Partial configuration from file, or empty object if file doesn't exist
   */
  private loadConfigFile(): Partial<Config> {
    const configPaths = [
      './mcp-config.json',
      join(process.cwd(), 'mcp-config.json'),
      join(__dirname, '../../mcp-config.json')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(content) as Partial<Config>;
          return parsed;
        } catch (error) {
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
  private loadEnvironmentOverrides(): DeepPartial<Config> {
    const overrides: DeepPartial<Config> = {};

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
        overrides.logging.level = process.env.LOG_LEVEL as Config['logging']['level'];
      }
      if (process.env.LOG_FORMAT) {
        overrides.logging.format = process.env.LOG_FORMAT as Config['logging']['format'];
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
        defaultAuthMethod: process.env.DEFAULT_AUTH_METHOD as Config['environment']['defaultAuthMethod']
      };
    }

    // Test Runner overrides
    if (process.env.TEST_RUNNER_SOURCE_PATH || process.env.TEST_RUNNER_AUTO_INSTALL !== undefined) {
      overrides.testRunner = {};
      if (process.env.TEST_RUNNER_SOURCE_PATH) {
        overrides.testRunner.sourcePath = process.env.TEST_RUNNER_SOURCE_PATH;
      }
      if (process.env.TEST_RUNNER_AUTO_INSTALL !== undefined) {
        overrides.testRunner.autoInstall = process.env.TEST_RUNNER_AUTO_INSTALL === 'true';
      }
    }

    return overrides;
  }

  /**
   * Check if a valid API token is configured
   *
   * @returns true if token is configured, false otherwise
   */
  hasValidToken(): boolean {
    return this.apiToken !== null && this.apiToken.length > 0;
  }

  /**
   * Get Demo Portal API token
   *
   * @returns Bearer token for Demo Portal API authentication
   * @throws ValidationError if token is not configured
   */
  getApiToken(): string {
    if (!this.apiToken) {
      throw new ValidationError(
        'DEMO_PORTAL_TOKEN not set. Set it via environment variable:\n' +
        '  export DEMO_PORTAL_TOKEN=your_token_here\n\n' +
        'Or add it to your Claude Desktop configuration:\n' +
        '  "env": { "DEMO_PORTAL_TOKEN": "your_token_here" }',
        {
          missingVariable: 'DEMO_PORTAL_TOKEN',
          suggestedActions: ['SetEnvironmentVariable', 'UpdateClaudeConfig']
        }
      );
    }
    return this.apiToken;
  }

  /**
   * Get Demo Portal API base URL
   *
   * @returns Base URL for Demo Portal API (without trailing slash)
   */
  getApiUrl(): string {
    return this.config.api.url;
  }

  /**
   * Get full configuration object
   *
   * @returns Complete validated configuration
   */
  getConfig(): Config {
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
  get<T>(path: string, defaultValue?: T): T {
    const parts = path.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }
}
