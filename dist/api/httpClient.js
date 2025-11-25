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
import axios from 'axios';
import { ErrorService } from '../errors/redact.js';
import { AuthError, NetworkError, RateLimitError, NotFoundError } from '../errors/errors.js';
import { randomUUID } from 'crypto';
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
export function createHttpClient(config) {
    const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout ?? 30000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...config.headers
        },
        validateStatus: (status) => {
            // Consider 2xx and 3xx as successful
            // 4xx and 5xx will be handled by error interceptor
            return status >= 200 && status < 400;
        }
    });
    // Request interceptor - add authentication and request ID
    client.interceptors.request.use((req) => {
        // Add Bearer token authentication
        if (!req.headers.Authorization) {
            req.headers.Authorization = `Bearer ${config.token}`;
        }
        // Add request ID for tracing
        if (!req.headers['X-Request-Id']) {
            req.headers['X-Request-Id'] = randomUUID();
        }
        // Add timestamp for latency tracking
        req._startTime = Date.now();
        return req;
    }, async (error) => {
        return Promise.reject(error);
    });
    // Response interceptor - handle errors and redact secrets
    client.interceptors.response.use((response) => {
        // Calculate request duration for logging
        const startTime = response.config._startTime;
        if (startTime) {
            const duration = Date.now() - startTime;
            response.headers['X-Response-Time'] = `${duration}ms`;
        }
        return response;
    }, async (error) => {
        const status = error.response?.status;
        const requestId = error.config?.headers?.['X-Request-Id'];
        // Build base error context
        const errorContext = {
            requestId,
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status
        };
        // Handle specific HTTP status codes
        if (status === 401 || status === 403) {
            throw new AuthError('API authentication failed. Verify DEMO_PORTAL_TOKEN is valid and has necessary permissions.', {
                ...errorContext,
                message: 'Invalid or expired API token',
                suggestedActions: ['VerifyToken', 'CheckPermissions']
            });
        }
        if (status === 404) {
            // 404 can be expected during polling, so provide more context
            throw new NotFoundError(`Resource not found: ${error.config?.url ?? 'unknown'}`, {
                ...errorContext,
                message: 'The requested resource does not exist or is not yet available'
            });
        }
        if (status === 429) {
            // Rate limit exceeded - extract retry-after if available
            const retryAfterHeader = error.response?.headers['retry-after'];
            const retryAfter = retryAfterHeader
                ? parseInt(retryAfterHeader, 10)
                : 60;
            throw new RateLimitError(`API rate limit exceeded. Wait ${retryAfter} seconds before retrying.`, retryAfter, {
                ...errorContext,
                retryAfter,
                message: 'Too many requests to the API'
            });
        }
        if (status && status >= 500) {
            // Server errors - generally retryable
            throw new NetworkError(`Server error (${status}). The service may be temporarily unavailable. Try again later.`, {
                ...errorContext,
                message: 'Server-side error',
                retryable: true
            });
        }
        // Handle network-level errors (no response received)
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new NetworkError('Request timed out. Check network connection or increase timeout.', {
                ...errorContext,
                code: error.code,
                timeout: error.config?.timeout,
                message: 'Request exceeded timeout limit'
            });
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new NetworkError('Cannot connect to API. Check network connection and API URL.', {
                ...errorContext,
                code: error.code,
                baseUrl: error.config?.baseURL,
                message: 'Network connectivity issue'
            });
        }
        // Generic network error with redacted message
        const redactedMessage = ErrorService.redact(error.message);
        throw new NetworkError(`Network request failed: ${redactedMessage}`, {
            ...errorContext,
            code: error.code,
            message: redactedMessage
        });
    });
    return client;
}
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
export function createClientFromConfig(configService) {
    return createHttpClient({
        baseUrl: configService.getApiUrl(),
        token: configService.getApiToken(),
        timeout: configService.getConfig().api.timeoutMs
    });
}
//# sourceMappingURL=httpClient.js.map