/**
 * Structured Logging Utility
 *
 * Provides centralized, structured logging with:
 * - Multiple log levels (debug, info, warn, error)
 * - JSON and text output formats
 * - Secret redaction integration
 * - Request correlation via requestId
 * - Duration tracking for operations
 * - Consistent log structure
 *
 * Usage:
 * ```typescript
 * const logger = Logger.getInstance();
 * logger.info('operation_name', {
 *   requestId: 'req-123',
 *   duration: 245,
 *   details: { environmentId: 'env-abc' }
 * });
 * ```
 */
import { ErrorService } from '../errors/redact.js';
/**
 * Log level enum
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
/**
 * Log output format
 */
export var LogFormat;
(function (LogFormat) {
    LogFormat["JSON"] = "json";
    LogFormat["TEXT"] = "text";
})(LogFormat || (LogFormat = {}));
/**
 * Structured logger with singleton pattern
 */
export class Logger {
    static instance;
    config;
    /**
     * Private constructor - use getInstance() instead
     */
    constructor(config) {
        this.config = {
            level: LogLevel.INFO,
            format: LogFormat.JSON,
            redactSecrets: true,
            ...config
        };
    }
    /**
     * Get singleton logger instance
     */
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    /**
     * Reset singleton instance (useful for testing)
     */
    static reset() {
        Logger.instance = undefined;
    }
    /**
     * Update logger configuration
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Log a debug message
     */
    debug(operation, context) {
        this.log({
            level: LogLevel.DEBUG,
            operation,
            ...context
        });
    }
    /**
     * Log an info message
     */
    info(operation, context) {
        this.log({
            level: LogLevel.INFO,
            operation,
            ...context
        });
    }
    /**
     * Log a warning message
     */
    warn(operation, context) {
        this.log({
            level: LogLevel.WARN,
            operation,
            ...context
        });
    }
    /**
     * Log an error message
     */
    error(operation, error, context) {
        this.log({
            level: LogLevel.ERROR,
            operation,
            outcome: 'error',
            error: error instanceof Error ? error.message : error,
            ...context
        });
    }
    /**
     * Log an entry with complete control
     */
    log(entry) {
        // Check if this level should be logged
        if (!this.shouldLog(entry.level)) {
            return;
        }
        // Create full log entry with timestamp
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...entry
        };
        // Redact secrets if enabled
        const sanitized = this.config.redactSecrets
            ? this.sanitizeEntry(logEntry)
            : logEntry;
        // Output based on format
        if (this.config.format === LogFormat.JSON) {
            this.logJson(sanitized);
        }
        else {
            this.logText(sanitized);
        }
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const configLevel = levels.indexOf(this.config.level);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= configLevel;
    }
    /**
     * Sanitize log entry to remove sensitive information
     */
    sanitizeEntry(entry) {
        const sanitized = {
            timestamp: entry.timestamp,
            level: entry.level,
            operation: entry.operation
        };
        // Only add optional properties if they exist
        if (entry.requestId)
            sanitized.requestId = entry.requestId;
        if (entry.duration !== undefined)
            sanitized.duration = entry.duration;
        if (entry.outcome)
            sanitized.outcome = entry.outcome;
        if (entry.error)
            sanitized.error = ErrorService.redact(entry.error);
        if (entry.details)
            sanitized.details = ErrorService.redactObject(entry.details);
        return sanitized;
    }
    /**
     * Output log entry as JSON
     */
    logJson(entry) {
        // Use stderr for logging to avoid interfering with stdio MCP transport
        // (stdout is reserved for MCP protocol messages)
        console.error(JSON.stringify(entry));
    }
    /**
     * Output log entry as human-readable text
     */
    logText(entry) {
        const parts = [];
        // Timestamp
        parts.push(`[${entry.timestamp}]`);
        // Level (uppercase and padded)
        parts.push(entry.level.toUpperCase().padEnd(5));
        // Operation
        parts.push(entry.operation);
        // Request ID if present
        if (entry.requestId) {
            parts.push(`[${entry.requestId}]`);
        }
        // Duration if present
        if (entry.duration !== undefined) {
            parts.push(`(${entry.duration}ms)`);
        }
        // Outcome if present
        if (entry.outcome) {
            const outcomeSymbol = entry.outcome === 'success'
                ? '✓'
                : entry.outcome === 'error'
                    ? '✗'
                    : '○';
            parts.push(outcomeSymbol);
        }
        // Join main parts
        let message = parts.join(' ');
        // Add error on new line if present
        if (entry.error) {
            message += `\n  Error: ${entry.error}`;
        }
        // Add details on new lines if present
        if (entry.details && Object.keys(entry.details).length > 0) {
            message += '\n  Details:';
            for (const [key, value] of Object.entries(entry.details)) {
                message += `\n    ${key}: ${JSON.stringify(value)}`;
            }
        }
        // Use stderr for logging to avoid interfering with stdio MCP transport
        console.error(message);
    }
    /**
     * Create a child logger with additional context
     * Useful for adding request-specific context to all logs
     */
    child(context) {
        return new ChildLogger(this, context);
    }
}
/**
 * Child logger that inherits parent logger config but adds context
 */
export class ChildLogger {
    parent;
    context;
    constructor(parent, context) {
        this.parent = parent;
        this.context = context;
    }
    /**
     * Log with inherited context
     */
    logWithContext(level, operation, additionalContext) {
        const logEntry = {
            level,
            operation
        };
        // Add context request ID if present
        if (this.context.requestId) {
            logEntry.requestId = this.context.requestId;
        }
        // Merge details from context and additional context
        const mergedDetails = {
            ...this.context.details,
            ...additionalContext?.details
        };
        if (Object.keys(mergedDetails).length > 0) {
            logEntry.details = mergedDetails;
        }
        // Add other properties from additional context
        if (additionalContext?.duration !== undefined) {
            logEntry.duration = additionalContext.duration;
        }
        if (additionalContext?.outcome) {
            logEntry.outcome = additionalContext.outcome;
        }
        if (additionalContext?.error) {
            logEntry.error = additionalContext.error;
        }
        if (additionalContext?.requestId) {
            logEntry.requestId = additionalContext.requestId;
        }
        this.parent.log(logEntry);
    }
    debug(operation, context) {
        this.logWithContext(LogLevel.DEBUG, operation, context);
    }
    info(operation, context) {
        this.logWithContext(LogLevel.INFO, operation, context);
    }
    warn(operation, context) {
        this.logWithContext(LogLevel.WARN, operation, context);
    }
    error(operation, error, context) {
        this.logWithContext(LogLevel.ERROR, operation, {
            ...context,
            outcome: 'error',
            error: error instanceof Error ? error.message : error
        });
    }
}
/**
 * Convenience function to get logger instance
 */
export function getLogger(config) {
    return Logger.getInstance(config);
}
//# sourceMappingURL=logger.js.map