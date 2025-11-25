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
/**
 * Log level enum
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * Log output format
 */
export declare enum LogFormat {
    JSON = "json",
    TEXT = "text"
}
/**
 * Log entry structure
 */
export interface LogEntry {
    /** ISO 8601 timestamp */
    timestamp: string;
    /** Log level */
    level: LogLevel;
    /** Operation name or event being logged */
    operation: string;
    /** Unique request identifier for correlation */
    requestId?: string;
    /** Operation duration in milliseconds */
    duration?: number;
    /** Outcome of the operation */
    outcome?: 'success' | 'error' | 'pending';
    /** Additional context and metadata */
    details?: Record<string, unknown>;
    /** Error message if outcome is 'error' */
    error?: string;
}
/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    level: LogLevel;
    /** Output format (JSON or text) */
    format: LogFormat;
    /** Whether to redact sensitive information */
    redactSecrets: boolean;
}
/**
 * Structured logger with singleton pattern
 */
export declare class Logger {
    private static instance;
    private config;
    /**
     * Private constructor - use getInstance() instead
     */
    private constructor();
    /**
     * Get singleton logger instance
     */
    static getInstance(config?: Partial<LoggerConfig>): Logger;
    /**
     * Reset singleton instance (useful for testing)
     */
    static reset(): void;
    /**
     * Update logger configuration
     */
    configure(config: Partial<LoggerConfig>): void;
    /**
     * Log a debug message
     */
    debug(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    /**
     * Log an info message
     */
    info(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    /**
     * Log a warning message
     */
    warn(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    /**
     * Log an error message
     */
    error(operation: string, error: Error | string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'error'>): void;
    /**
     * Log an entry with complete control
     */
    log(entry: Omit<LogEntry, 'timestamp'>): void;
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Sanitize log entry to remove sensitive information
     */
    private sanitizeEntry;
    /**
     * Output log entry as JSON
     */
    private logJson;
    /**
     * Output log entry as human-readable text
     */
    private logText;
    /**
     * Create a child logger with additional context
     * Useful for adding request-specific context to all logs
     */
    child(context: {
        requestId?: string;
        details?: Record<string, unknown>;
    }): ChildLogger;
}
/**
 * Child logger that inherits parent logger config but adds context
 */
export declare class ChildLogger {
    private parent;
    private context;
    constructor(parent: Logger, context: {
        requestId?: string;
        details?: Record<string, unknown>;
    });
    /**
     * Log with inherited context
     */
    private logWithContext;
    debug(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    info(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    warn(operation: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation'>): void;
    error(operation: string, error: Error | string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'error'>): void;
}
/**
 * Convenience function to get logger instance
 */
export declare function getLogger(config?: Partial<LoggerConfig>): Logger;
//# sourceMappingURL=logger.d.ts.map