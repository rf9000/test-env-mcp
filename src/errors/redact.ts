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
export class ErrorService {
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
  private static readonly REDACTION_PATTERNS: Array<RegExp> = [
    // Authorization headers with Bearer token
    /Authorization:\s*Bearer\s+[^\s]+/gi,

    // Authorization headers with Basic auth
    /Authorization:\s*Basic\s+[^\s]+/gi,

    // API key patterns (various formats)
    /\b(api[_-]?key|apikey|token|secret|password)\s*[=:]\s*[^\s&,;]+/gi,

    // Base64 encoded credentials (after Basic keyword)
    /Basic\s+[A-Za-z0-9+/]+=*/g,

    // Query parameter tokens
    /([?&])(token|key|secret|password|apikey|api_key)=([^&\s]*)/gi
  ];

  /**
   * Field names that should always be redacted in objects
   */
  private static readonly SENSITIVE_FIELD_NAMES: Set<string> = new Set([
    'password',
    'token',
    'apikey',
    'api_key',
    'api-key',
    'secret',
    'authorization',
    'auth',
    'bearer',
    'credentials'
  ]);

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
  static redact(text: string): string {
    if (typeof text !== 'string') {
      return text;
    }

    let redacted = text;

    for (const pattern of this.REDACTION_PATTERNS) {
      redacted = redacted.replace(pattern, (match, group1, group2) => {
        // For patterns with capture groups (like key=value)
        if (group1 && group2) {
          // group1 is the field name, group2 might be present
          return `${group1}=[REDACTED]`;
        } else if (group1) {
          // Only one capture group
          return `${group1}=[REDACTED]`;
        }

        // For patterns without capture groups, replace the secret part
        const colonIndex = match.indexOf(':');
        if (colonIndex !== -1) {
          return match.substring(0, colonIndex + 1) + ' [REDACTED]';
        }

        const equalsIndex = match.indexOf('=');
        if (equalsIndex !== -1) {
          return match.substring(0, equalsIndex + 1) + '[REDACTED]';
        }

        // Default: replace everything after whitespace
        return match.replace(/[^\s:=]+$/, '[REDACTED]');
      });
    }

    return redacted;
  }

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
  static redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field name is sensitive
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
      const isSensitiveField = this.SENSITIVE_FIELD_NAMES.has(normalizedKey) ||
        Array.from(this.SENSITIVE_FIELD_NAMES).some(field =>
          normalizedKey.includes(field.toLowerCase())
        );

      // If field name is sensitive AND value is a primitive string, redact it
      if (isSensitiveField && typeof value === 'string') {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        // Redact string values even if field name isn't sensitive (check for patterns)
        result[key] = this.redact(value);
      } else if (Array.isArray(value)) {
        // Recursively process arrays (even if field name is sensitive)
        result[key] = value.map(item => {
          if (typeof item === 'string') {
            return this.redact(item);
          } else if (item && typeof item === 'object') {
            return this.redactObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects (even if field name is sensitive)
        result[key] = this.redactObject(value as Record<string, unknown>);
      } else {
        // Keep primitive values as-is (numbers, booleans, null, undefined)
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Check if a string contains any sensitive patterns
   *
   * Useful for logging decisions - avoid logging entirely if sensitive
   *
   * @param text - Text to check
   * @returns true if text contains sensitive information
   */
  static containsSensitiveData(text: string): boolean {
    if (typeof text !== 'string') {
      return false;
    }

    return this.REDACTION_PATTERNS.some(pattern => pattern.test(text));
  }
}
