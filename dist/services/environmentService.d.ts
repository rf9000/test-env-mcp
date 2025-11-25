import type { DemoPortalClient } from '../api/demoPortalClient.js';
/**
 * Type definitions for service responses
 */
export interface ListEnvironmentsResult {
    type: 'list_environments_result';
    environments: Array<{
        id: string;
        name: string;
        status: string;
        bcVersion: string;
    }>;
    count: number;
    source: {
        baseUrl: string;
    };
    fetchedAt: string;
    elapsedMs: number;
}
export interface GetEnvironmentResult {
    type: 'get_environment_result';
    environment: {
        id: string;
        name: string;
        status: string;
        bcVersion: string;
        details: {
            bcVersion: string;
            url?: string;
            authenticationMethod?: string;
            [key: string]: unknown;
        };
    };
    source: {
        baseUrl: string;
    };
    fetchedAt: string;
    elapsedMs: number;
}
export interface StartEnvironmentResult {
    type: 'start_environment_result';
    environmentId: string;
    previousStatus: string;
    newStatus: string;
    status: 'no_op' | 'conflict_in_progress' | 'accepted' | 'completed';
    message: string;
    transition?: {
        requested: 'start';
        from: string;
        to: string;
        intermediate?: string;
    };
    fetchedAt: string;
    elapsedMs?: number;
}
export interface StopEnvironmentResult {
    type: 'stop_environment_result';
    environmentId: string;
    previousStatus: string;
    newStatus: string;
    status: 'no_op' | 'accepted' | 'completed';
    message: string;
    transition?: {
        requested: 'stop';
        from: string;
        to: string;
        intermediate?: string;
    };
    fetchedAt: string;
    elapsedMs?: number;
}
/**
 * Service for managing Business Central environments
 *
 * Provides high-level operations for:
 * - Listing environments with transformation
 * - Getting environment details
 * - Starting/stopping environments with idempotency
 * - Polling for state transitions
 */
export declare class EnvironmentService {
    private readonly demoPortalClient;
    constructor(demoPortalClient: DemoPortalClient);
    /**
     * List all environments from Demo Portal
     *
     * Fetches raw environment data, validates, transforms, and sorts by name.
     *
     * @returns Structured result with environment array and metadata
     * @throws {AuthError} If authentication fails
     * @throws {RateLimitError} If rate limit exceeded
     * @throws {NetworkError} If network request fails
     */
    listEnvironments(): Promise<ListEnvironmentsResult>;
    /**
     * Get a single environment by ID with full details
     *
     * @param environmentId - The environment ID to fetch
     * @returns Structured result with environment and extra details
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    getEnvironment(environmentId: string): Promise<GetEnvironmentResult>;
    /**
     * Start an environment
     *
     * Implements idempotency: if already running, returns no-op status.
     * Handles conflicts: if transitioning, returns conflict status.
     * Optionally waits for environment to reach Running status.
     *
     * @param environmentId - The environment ID to start
     * @param options - Optional wait behavior ('none' or 'untilRunning')
     * @returns Result indicating outcome of start operation
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {TimeoutError} If wait timeout exceeded
     */
    startEnvironment(environmentId: string, options?: {
        wait?: 'none' | 'untilRunning';
    }): Promise<StartEnvironmentResult>;
    /**
     * Stop an environment
     *
     * Implements idempotency: if already stopped, returns no-op status.
     * Optionally waits for environment to reach Stopped status.
     *
     * @param environmentId - The environment ID to stop
     * @param options - Optional wait behavior ('none' or 'untilStopped')
     * @returns Result indicating outcome of stop operation
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {TimeoutError} If wait timeout exceeded
     */
    stopEnvironment(environmentId: string, options?: {
        wait?: 'none' | 'untilStopped';
    }): Promise<StopEnvironmentResult>;
    /**
     * Transform raw API environment to normalized format
     *
     * Handles various name fields (displayName, name, environmentName)
     * and version fields (applicationVersion, bcVersion, version).
     *
     * @private
     */
    private transformEnvironment;
    /**
     * Extract additional details from raw environment
     *
     * Preserves extra fields from API response for detailed view.
     *
     * @private
     */
    private extractDetails;
    /**
     * Wait for environment to reach Running status with polling
     *
     * Uses exponential backoff with max delay of 30 seconds.
     * Throws TimeoutError if target status not reached within timeout.
     *
     * @private
     */
    private waitForStartStatus;
    /**
     * Wait for environment to reach Stopped status with polling
     *
     * Uses exponential backoff with max delay of 30 seconds.
     * Throws TimeoutError if target status not reached within timeout.
     *
     * @private
     */
    private waitForStopStatus;
    /**
     * Delay helper for polling
     *
     * @private
     */
    private delay;
}
//# sourceMappingURL=environmentService.d.ts.map