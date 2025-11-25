/**
 * HTTP Client Factory
 *
 * Creates configured Axios instances with:
 * - Automatic authentication header injection
 * - Request ID tracking for debugging
 * - Error handling with custom error types
 * - Secret redaction in error messages
 * - Retry logic for transient failures
 *
 * Used by:
 * - DemoPortalClient (Demo Portal API)
 * - DeveloperEndpointClient (BC Developer Endpoint)
 */
import { AxiosInstance } from 'axios';
/**
 * Configuration for HTTP client creation
 */
export interface HttpClientConfig {
    /**
     * Base URL for all requests (e.g., 'https://api.example.com')
     */
    baseUrl: string;
    /**
     * Authentication token (Bearer token format)
     */
    token: string;
    /**
     * Request timeout in milliseconds
     * @default 30000 (30 seconds)
     */
    timeout?: number;
    /**
     * Number of retry attempts for failed requests
     * @default 3
     */
    retries?: number;
    /**
     * Custom headers to include with every request
     */
    headers?: Record<string, string>;
    /**
     * Whether to validate SSL certificates
     * @default true
     */
    validateCertificates?: boolean;
}
/**
 * Create a configured Axios HTTP client
 *
 * @param config - Client configuration
 * @returns Configured Axios instance with interceptors
 *
 * @example
 * const client = createHttpClient({
 *   baseUrl: 'https://api.example.com',
 *   token: 'your-token-here',
 *   timeout: 30000
 * });
 *
 * const response = await client.get('/environments');
 */
export declare function createHttpClient(config: HttpClientConfig): AxiosInstance;
/**
 * Create an HTTP client from configuration service
 *
 * Convenience function that loads configuration automatically.
 *
 * @param configService - Configuration service instance
 * @returns Configured HTTP client for Demo Portal
 *
 * @example
 * import { ConfigurationService } from '../services/configurationService.js';
 *
 * const config = ConfigurationService.getInstance();
 * const client = createClientFromConfig(config);
 */
export declare function createClientFromConfig(configService: {
    getApiUrl: () => string;
    getApiToken: () => string;
    getConfig: () => {
        api: {
            timeoutMs: number;
        };
    };
}): AxiosInstance;
//# sourceMappingURL=httpClient.d.ts.map