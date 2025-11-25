/**
 * Secret Redaction Service
 *
 * Centralized utility for removing sensitive information from logs and error messages.
 * Prevents credential leakage through:
 * - Authorization headers (Bearer, Basic)
 * - API keys and tokens
 * - Passwords
 * - Base64-encoded credentials
 *
 * Applied automatically to all error messages via AppError.toJSON()
 */
/**
 * Static service for redacting secrets from strings and objects
 *
 * Usage:
 *   ErrorService.redact('Authorization: Bearer abc123') // 'Authorization: Bearer [REDACTED]'
 *   ErrorService.redactObject({ token: 'secret' }) // { token: '[REDACTED]' }
 */
export declare class ErrorService {
    /**
     * Patterns to match and redact sensitive information
     *
     * Covers:
     * - Authorization: Bearer <token>
     * - Authorization: Basic <base64>
     * - api_key=value, api-key=value, apikey=value
     * - token=value, secret=value, password=value
     * - Standalone Base64 strings after "Basic"
     */
    private static readonly REDACTION_PATTERNS;
    /**
     * Field names that should always be redacted in objects
     */
    private static readonly SENSITIVE_FIELD_NAMES;
    /**
     * Redact sensitive information from a string
     *
     * @param text - Input string that may contain secrets
     * @returns Redacted string with secrets replaced by [REDACTED]
     *
     * @example
     * ErrorService.redact('Authorization: Bearer abc123')
     * // Returns: 'Authorization: Bearer [REDACTED]'
     *
     * @example
     * ErrorService.redact('Connect to API with token=secret123')
     * // Returns: 'Connect to API with token=[REDACTED]'
     */
    static redact(text: string): string;
    /**
     * Redact sensitive fields in an object recursively
     *
     * @param obj - Object that may contain sensitive fields
     * @returns New object with sensitive fields redacted
     *
     * @example
     * ErrorService.redactObject({ username: 'user', password: 'secret' })
     * // Returns: { username: 'user', password: '[REDACTED]' }
     *
     * @example
     * ErrorService.redactObject({
     *   headers: { Authorization: 'Bearer token123' },
     *   data: { apiKey: 'secret' }
     * })
     * // Returns: {
     * //   headers: { Authorization: '[REDACTED]' },
     * //   data: { apiKey: '[REDACTED]' }
     * // }
     */
    static redactObject(obj: Record<string, unknown>): Record<string, unknown>;
    /**
     * Check if a string contains any sensitive patterns
     *
     * Useful for logging decisions - avoid logging entirely if sensitive
     *
     * @param text - Text to check
     * @returns true if text contains sensitive information
     */
    static containsSensitiveData(text: string): boolean;
}
//# sourceMappingURL=redact.d.ts.map