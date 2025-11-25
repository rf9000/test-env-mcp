/**
 * Error Taxonomy for Continia Environment MCP Server
 *
 * Provides a structured hierarchy of errors with:
 * - Consistent error codes for LLM consumption
 * - Retryable vs non-retryable classification
 * - Structured details for debugging
 * - Secret redaction integration
 */
/**
 * Abstract base class for all application errors
 *
 * Enforces consistent structure across all error types:
 * - Machine-readable error code
 * - Retryability flag for LLM decision making
 * - Structured details for context
 * - JSON serialization with secret redaction
 */
export declare abstract class AppError extends Error {
    readonly details?: Record<string, unknown> | undefined;
    abstract readonly code: string;
    abstract readonly retryable: boolean;
    constructor(message: string, details?: Record<string, unknown> | undefined);
    /**
     * Serialize error to JSON with secret redaction
     * Must dynamically import ErrorService to avoid circular dependencies
     */
    toJSON(): Promise<Record<string, unknown>>;
}
/**
 * Authentication and authorization errors
 *
 * Used for:
 * - Invalid API tokens
 * - Missing credentials
 * - Insufficient permissions
 * - Failed authentication attempts
 *
 * NOT retryable - requires user intervention to fix credentials
 */
export declare class AuthError extends AppError {
    readonly code = "AUTH_ERROR";
    readonly retryable = false;
}
/**
 * API rate limit exceeded
 *
 * Used when Demo Portal or Developer Endpoint returns 429
 * Includes retry-after duration when available
 *
 * IS retryable - wait and try again
 */
export declare class RateLimitError extends AppError {
    readonly retryAfter?: number | undefined;
    readonly code = "RATE_LIMIT";
    readonly retryable = true;
    constructor(message: string, retryAfter?: number | undefined, details?: Record<string, unknown>);
}
/**
 * Resource not found errors
 *
 * Used for:
 * - Environment not found
 * - Test job not found (404 during polling)
 * - User not found
 *
 * NOT retryable - resource doesn't exist
 */
export declare class NotFoundError extends AppError {
    readonly code = "NOT_FOUND";
    readonly retryable = false;
}
/**
 * Network and connectivity errors
 *
 * Used for:
 * - Connection timeouts
 * - DNS resolution failures
 * - Server errors (5xx)
 * - Network unreachable
 *
 * IS retryable - transient network issues
 */
export declare class NetworkError extends AppError {
    readonly code = "NETWORK_ERROR";
    readonly retryable = true;
}
/**
 * Input validation errors
 *
 * Used for:
 * - Invalid parameters from LLM
 * - Malformed requests
 * - Missing required configuration
 * - Schema validation failures
 *
 * NOT retryable - requires corrected input
 */
export declare class ValidationError extends AppError {
    readonly code = "VALIDATION_ERROR";
    readonly retryable = false;
}
/**
 * AL compilation errors
 *
 * Used when AL compiler fails with diagnostics
 * Includes structured diagnostic information for LLM
 *
 * NOT retryable - requires code fixes
 */
export interface Diagnostic {
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning';
    code: string;
    message: string;
}
export declare class CompileError extends AppError {
    readonly diagnostics: Diagnostic[];
    readonly code = "COMPILE_ERROR";
    readonly retryable = false;
    constructor(message: string, diagnostics: Diagnostic[], details?: Record<string, unknown>);
}
/**
 * Resource conflict errors
 *
 * Used for:
 * - Schema conflicts during publishing (409)
 * - Concurrent modification attempts
 * - State transition conflicts
 *
 * May be retryable with different parameters (e.g., forcesync)
 */
export declare class ConflictError extends AppError {
    readonly code = "CONFLICT_ERROR";
    readonly retryable = false;
}
/**
 * Operation timeout errors
 *
 * Used for:
 * - Test execution timeouts
 * - Environment start/stop timeouts
 * - Long-running operation timeouts
 *
 * May be retryable with longer timeout
 */
export declare class TimeoutError extends AppError {
    readonly timeoutMs: number;
    readonly code = "TIMEOUT_ERROR";
    readonly retryable = true;
    constructor(message: string, timeoutMs: number, details?: Record<string, unknown>);
}
//# sourceMappingURL=errors.d.ts.map