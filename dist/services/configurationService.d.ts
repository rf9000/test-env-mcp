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
/**
 * Configuration schema with validation and defaults
 *
 * All fields have sensible defaults for production use.
 * Environment variables can override any setting.
 */
declare const ConfigSchema: z.ZodObject<{
    api: z.ZodObject<{
        url: z.ZodDefault<z.ZodString>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        timeoutMs: number;
    }, {
        url?: string | undefined;
        timeoutMs?: number | undefined;
    }>;
    test: z.ZodObject<{
        defaultTimeoutSeconds: z.ZodDefault<z.ZodNumber>;
        initialPollIntervalMs: z.ZodDefault<z.ZodNumber>;
        maxPollIntervalMs: z.ZodDefault<z.ZodNumber>;
        backoffFactor: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        defaultTimeoutSeconds: number;
        initialPollIntervalMs: number;
        maxPollIntervalMs: number;
        backoffFactor: number;
    }, {
        defaultTimeoutSeconds?: number | undefined;
        initialPollIntervalMs?: number | undefined;
        maxPollIntervalMs?: number | undefined;
        backoffFactor?: number | undefined;
    }>;
    logging: z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        format: z.ZodDefault<z.ZodEnum<["json", "text"]>>;
    }, "strip", z.ZodTypeAny, {
        level: "error" | "debug" | "info" | "warn";
        format: "json" | "text";
    }, {
        level?: "error" | "debug" | "info" | "warn" | undefined;
        format?: "json" | "text" | undefined;
    }>;
    auth: z.ZodObject<{
        devTenant: z.ZodDefault<z.ZodString>;
        allowInsecureCertificates: z.ZodDefault<z.ZodBoolean>;
        interactivePrompts: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        devTenant: string;
        allowInsecureCertificates: boolean;
        interactivePrompts: boolean;
    }, {
        devTenant?: string | undefined;
        allowInsecureCertificates?: boolean | undefined;
        interactivePrompts?: boolean | undefined;
    }>;
    environment: z.ZodObject<{
        defaultAuthMethod: z.ZodDefault<z.ZodEnum<["NavUserPassword", "Windows", "AzureAd"]>>;
    }, "strip", z.ZodTypeAny, {
        defaultAuthMethod: "NavUserPassword" | "Windows" | "AzureAd";
    }, {
        defaultAuthMethod?: "NavUserPassword" | "Windows" | "AzureAd" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    auth: {
        devTenant: string;
        allowInsecureCertificates: boolean;
        interactivePrompts: boolean;
    };
    api: {
        url: string;
        timeoutMs: number;
    };
    test: {
        defaultTimeoutSeconds: number;
        initialPollIntervalMs: number;
        maxPollIntervalMs: number;
        backoffFactor: number;
    };
    logging: {
        level: "error" | "debug" | "info" | "warn";
        format: "json" | "text";
    };
    environment: {
        defaultAuthMethod: "NavUserPassword" | "Windows" | "AzureAd";
    };
}, {
    auth: {
        devTenant?: string | undefined;
        allowInsecureCertificates?: boolean | undefined;
        interactivePrompts?: boolean | undefined;
    };
    api: {
        url?: string | undefined;
        timeoutMs?: number | undefined;
    };
    test: {
        defaultTimeoutSeconds?: number | undefined;
        initialPollIntervalMs?: number | undefined;
        maxPollIntervalMs?: number | undefined;
        backoffFactor?: number | undefined;
    };
    logging: {
        level?: "error" | "debug" | "info" | "warn" | undefined;
        format?: "json" | "text" | undefined;
    };
    environment: {
        defaultAuthMethod?: "NavUserPassword" | "Windows" | "AzureAd" | undefined;
    };
}>;
export type Config = z.infer<typeof ConfigSchema>;
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
export declare class ConfigurationService {
    private static instance;
    private config;
    private apiToken;
    private constructor();
    /**
     * Get singleton instance
     *
     * Creates instance on first call, returns cached instance thereafter.
     */
    static getInstance(): ConfigurationService;
    /**
     * Reset singleton instance (for testing)
     *
     * Forces configuration reload on next getInstance() call.
     */
    static resetInstance(): void;
    /**
     * Load configuration from multiple sources with priority:
     * 1. Default values (from schema)
     * 2. Config file (mcp-config.json if exists)
     * 3. Environment variables (highest priority)
     *
     * @returns Validated configuration and API token
     * @throws ValidationError if token is missing or config is invalid
     */
    private loadConfiguration;
    /**
     * Load API token from VS Code settings or environment variable
     *
     * Priority:
     * 1. VS Code setting (for extension compatibility)
     * 2. DEMO_PORTAL_TOKEN environment variable
     *
     * @throws ValidationError if token not found
     */
    private loadApiToken;
    /**
     * Load configuration from mcp-config.json if it exists
     *
     * @returns Partial configuration from file, or empty object if file doesn't exist
     */
    private loadConfigFile;
    /**
     * Load configuration overrides from environment variables
     *
     * Environment variables have highest priority and override file config.
     */
    private loadEnvironmentOverrides;
    /**
     * Get Demo Portal API token
     *
     * @returns Bearer token for Demo Portal API authentication
     */
    getApiToken(): string;
    /**
     * Get Demo Portal API base URL
     *
     * @returns Base URL for Demo Portal API (without trailing slash)
     */
    getApiUrl(): string;
    /**
     * Get full configuration object
     *
     * @returns Complete validated configuration
     */
    getConfig(): Config;
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
    get<T>(path: string, defaultValue?: T): T;
}
export {};
//# sourceMappingURL=configurationService.d.ts.map