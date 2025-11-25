/**
 * Backoff Utility
 *
 * Provides exponential backoff calculations with jitter for retry and polling operations.
 * Used for:
 * - Test result polling (wait for completion)
 * - Environment status polling (wait for state change)
 * - API retry logic (after rate limiting or transient errors)
 *
 * Features:
 * - Exponential backoff with configurable factor
 * - Jitter to prevent thundering herd
 * - Maximum delay cap
 * - Simple delay helper
 */
/**
 * Backoff configuration options
 */
export interface BackoffConfig {
    /** Initial delay in milliseconds */
    initialDelayMs: number;
    /** Maximum delay in milliseconds */
    maxDelayMs: number;
    /** Backoff multiplier (typically 1.5-3.0) */
    factor: number;
    /** Jitter percentage (0.0 to 1.0), 0.5 = 50-100% of calculated delay */
    jitter: number;
}
/**
 * Default backoff configuration
 * Starts at 2s, doubles each time, max 30s, with 50% jitter
 */
export declare const DEFAULT_BACKOFF_CONFIG: BackoffConfig;
/**
 * Calculate next delay using exponential backoff with jitter
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Backoff configuration
 * @returns Delay in milliseconds
 *
 * @example
 * // First attempt: 2000ms + jitter
 * calculateBackoff(0, DEFAULT_BACKOFF_CONFIG);
 *
 * // Second attempt: 4000ms + jitter
 * calculateBackoff(1, DEFAULT_BACKOFF_CONFIG);
 *
 * // Third attempt: 8000ms + jitter
 * calculateBackoff(2, DEFAULT_BACKOFF_CONFIG);
 */
export declare function calculateBackoff(attempt: number, config?: BackoffConfig): number;
/**
 * Wait for specified number of milliseconds
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 *
 * @example
 * await delay(1000); // Wait 1 second
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param config - Backoff configuration
 * @param maxAttempts - Maximum number of attempts
 * @param shouldRetry - Optional function to determine if error is retryable
 * @returns Promise with function result
 * @throws Last error if all attempts fail
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => await fetchData(),
 *   DEFAULT_BACKOFF_CONFIG,
 *   3,
 *   (error) => error.code === 'ECONNRESET'
 * );
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, config?: BackoffConfig, maxAttempts?: number, shouldRetry?: (error: unknown) => boolean): Promise<T>;
/**
 * Poll a function until it returns a truthy value or times out
 *
 * @param fn - Async function to poll (returns result or null/undefined)
 * @param config - Backoff configuration
 * @param timeoutMs - Maximum time to poll in milliseconds
 * @param timeoutError - Error to throw on timeout
 * @returns Promise with function result
 * @throws timeoutError if timeout is reached
 *
 * @example
 * const result = await pollWithBackoff(
 *   async () => {
 *     const status = await checkStatus();
 *     return status === 'complete' ? status : null;
 *   },
 *   DEFAULT_BACKOFF_CONFIG,
 *   300000, // 5 minutes
 *   new Error('Polling timed out')
 * );
 */
export declare function pollWithBackoff<T>(fn: () => Promise<T | null | undefined>, config: BackoffConfig | undefined, timeoutMs: number, timeoutError: Error): Promise<T>;
/**
 * Backoff sequence iterator for manual control
 *
 * @param config - Backoff configuration
 * @yields Delay in milliseconds for each iteration
 *
 * @example
 * const backoff = backoffSequence();
 * for (const delayMs of backoff) {
 *   await delay(delayMs);
 *   const result = await tryOperation();
 *   if (result) break;
 * }
 */
export declare function backoffSequence(config?: BackoffConfig): Generator<number, void, unknown>;
/**
 * Create a custom backoff configuration
 *
 * @param overrides - Configuration overrides
 * @returns Complete backoff configuration
 *
 * @example
 * const fastBackoff = createBackoffConfig({
 *   initialDelayMs: 500,
 *   maxDelayMs: 5000
 * });
 */
export declare function createBackoffConfig(overrides: Partial<BackoffConfig>): BackoffConfig;
//# sourceMappingURL=backoff.d.ts.map