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
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error to JSON with secret redaction
   * Must dynamically import ErrorService to avoid circular dependencies
   */
  async toJSON(): Promise<Record<string, unknown>> {
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
  readonly code = 'AUTH_ERROR';
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
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT';
  readonly retryable = true;

  constructor(
    message: string,
    public readonly retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(message, details);
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
  readonly code = 'NOT_FOUND';
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
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
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
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
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

export class CompileError extends AppError {
  readonly code = 'COMPILE_ERROR';
  readonly retryable = false;

  constructor(
    message: string,
    public readonly diagnostics: Diagnostic[],
    details?: Record<string, unknown>
  ) {
    super(message, details);
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
  readonly code = 'CONFLICT_ERROR';
  readonly retryable = false; // Usually requires parameter changes, not simple retry
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
  readonly code = 'TIMEOUT_ERROR';
  readonly retryable = true;

  constructor(
    message: string,
    public readonly timeoutMs: number,
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}
