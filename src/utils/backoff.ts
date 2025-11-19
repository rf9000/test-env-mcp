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
export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  factor: 2.0,
  jitter: 0.5
};

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
export function calculateBackoff(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): number {
  // Calculate exponential delay: initialDelay * (factor ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(config.factor, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Apply jitter to prevent thundering herd
  // Jitter formula: delay * (jitter + random * (1 - jitter))
  // Example with jitter=0.5: delay ranges from 50% to 100% of calculated delay
  const jitterFactor = config.jitter + Math.random() * (1 - config.jitter);
  const delayWithJitter = Math.floor(cappedDelay * jitterFactor);

  return delayWithJitter;
}

/**
 * Wait for specified number of milliseconds
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 *
 * @example
 * await delay(1000); // Wait 1 second
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  maxAttempts: number = 3,
  shouldRetry?: (error: unknown) => boolean
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Don't wait after last attempt
      if (attempt < maxAttempts - 1) {
        const delayMs = calculateBackoff(attempt, config);
        await delay(delayMs);
      }
    }
  }

  // All attempts failed
  throw lastError;
}

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
export async function pollWithBackoff<T>(
  fn: () => Promise<T | null | undefined>,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  timeoutMs: number,
  timeoutError: Error
): Promise<T> {
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < timeoutMs) {
    // Try to get result
    const result = await fn();

    // Return if we got a result
    if (result !== null && result !== undefined) {
      return result;
    }

    // Calculate next delay with backoff
    const delayMs = calculateBackoff(attempt, config);

    // Check if delay would exceed timeout
    const elapsed = Date.now() - startTime;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0) {
      break;
    }

    // Wait for shorter of: calculated delay or remaining time
    await delay(Math.min(delayMs, remaining));

    attempt++;
  }

  // Timeout reached
  throw timeoutError;
}

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
export function* backoffSequence(
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): Generator<number, void, unknown> {
  let attempt = 0;

  while (true) {
    yield calculateBackoff(attempt, config);
    attempt++;
  }
}

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
export function createBackoffConfig(
  overrides: Partial<BackoffConfig>
): BackoffConfig {
  return {
    ...DEFAULT_BACKOFF_CONFIG,
    ...overrides
  };
}
