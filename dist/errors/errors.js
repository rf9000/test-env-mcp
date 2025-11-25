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
export class AppError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Serialize error to JSON with secret redaction
     * Must dynamically import ErrorService to avoid circular dependencies
     */
    async toJSON() {
        const { ErrorService } = await import('./redact.js');
        return {
            name: this.name,
            code: this.code,
            message: ErrorService.redact(this.message),
            retryable: this.retryable,
            details: this.details ? ErrorService.redactObject(this.details) : undefined
        };
    }
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
export class AuthError extends AppError {
    code = 'AUTH_ERROR';
    retryable = false;
}
/**
 * API rate limit exceeded
 *
 * Used when Demo Portal or Developer Endpoint returns 429
 * Includes retry-after duration when available
 *
 * IS retryable - wait and try again
 */
export class RateLimitError extends AppError {
    retryAfter;
    code = 'RATE_LIMIT';
    retryable = true;
    constructor(message, retryAfter, details) {
        super(message, details);
        this.retryAfter = retryAfter;
    }
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
export class NotFoundError extends AppError {
    code = 'NOT_FOUND';
    retryable = false;
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
export class NetworkError extends AppError {
    code = 'NETWORK_ERROR';
    retryable = true;
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
export class ValidationError extends AppError {
    code = 'VALIDATION_ERROR';
    retryable = false;
}
export class CompileError extends AppError {
    diagnostics;
    code = 'COMPILE_ERROR';
    retryable = false;
    constructor(message, diagnostics, details) {
        super(message, details);
        this.diagnostics = diagnostics;
    }
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
export class ConflictError extends AppError {
    code = 'CONFLICT_ERROR';
    retryable = false; // Usually requires parameter changes, not simple retry
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
export class TimeoutError extends AppError {
    timeoutMs;
    code = 'TIMEOUT_ERROR';
    retryable = true;
    constructor(message, timeoutMs, details) {
        super(message, details);
        this.timeoutMs = timeoutMs;
    }
}
//# sourceMappingURL=errors.js.map