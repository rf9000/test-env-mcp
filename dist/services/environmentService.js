import { z } from 'zod';
import { NotFoundError, TimeoutError } from '../errors/errors.js';
/**
 * Raw environment schema from Demo Portal API
 * Uses passthrough() to preserve extra fields for details
 */
const RawEnvironmentSchema = z
    .object({
    id: z.string(),
    name: z.string().optional(),
    displayName: z.string().optional(),
    environmentName: z.string().optional(),
    status: z.string(), // API uses "status" field (Running, Stopped, Draft, Starting, Stopping)
    applicationVersion: z.string().optional(),
    bcVersion: z.string().optional(),
    version: z.string().optional(),
    url: z.string().optional(),
    authenticationMethod: z.string().optional()
})
    .passthrough(); // Preserve extra fields
/**
 * Normalized environment schema for MCP tools
 */
const EnvironmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    bcVersion: z.string()
});
/**
 * Service for managing Business Central environments
 *
 * Provides high-level operations for:
 * - Listing environments with transformation
 * - Getting environment details
 * - Starting/stopping environments with idempotency
 * - Polling for state transitions
 */
export class EnvironmentService {
    demoPortalClient;
    constructor(demoPortalClient) {
        this.demoPortalClient = demoPortalClient;
    }
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
    async listEnvironments() {
        const startTime = Date.now();
        // Fetch raw data from API
        const raw = await this.demoPortalClient.listEnvironmentsRaw();
        // Validate and transform each environment
        const rawEnvironments = z.array(RawEnvironmentSchema).parse(raw);
        const environments = rawEnvironments.map((env) => this.transformEnvironment(env));
        // Sort by name for deterministic output
        environments.sort((a, b) => a.name.localeCompare(b.name));
        return {
            type: 'list_environments_result',
            environments,
            count: environments.length,
            source: { baseUrl: this.demoPortalClient.getBaseUrl() },
            fetchedAt: new Date().toISOString(),
            elapsedMs: Date.now() - startTime
        };
    }
    /**
     * Get a single environment by ID with full details
     *
     * @param environmentId - The environment ID to fetch
     * @returns Structured result with environment and extra details
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    async getEnvironment(environmentId) {
        const startTime = Date.now();
        try {
            const raw = await this.demoPortalClient.getEnvironmentRaw(environmentId);
            const validated = RawEnvironmentSchema.parse(raw);
            const environment = {
                ...this.transformEnvironment(validated),
                details: this.extractDetails(validated)
            };
            return {
                type: 'get_environment_result',
                environment,
                source: { baseUrl: this.demoPortalClient.getBaseUrl() },
                fetchedAt: new Date().toISOString(),
                elapsedMs: Date.now() - startTime
            };
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError('Environment not found. Use list_environments to see available environments.', { environmentId });
            }
            throw error;
        }
    }
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
    async startEnvironment(environmentId, options) {
        // Get current status
        const current = await this.getEnvironment(environmentId);
        // Check if already running (idempotent)
        if (current.environment.status === 'Running') {
            return {
                type: 'start_environment_result',
                environmentId,
                previousStatus: 'Running',
                newStatus: 'Running',
                status: 'no_op',
                message: 'Environment already running; no action taken.',
                transition: { requested: 'start', from: 'Running', to: 'Running' },
                fetchedAt: new Date().toISOString()
            };
        }
        // Check for conflicts (environment transitioning)
        if (current.environment.status === 'Stopping') {
            return {
                type: 'start_environment_result',
                environmentId,
                previousStatus: current.environment.status,
                newStatus: current.environment.status,
                status: 'conflict_in_progress',
                message: 'Environment is stopping. Wait for it to complete before starting.',
                transition: {
                    requested: 'start',
                    from: current.environment.status,
                    to: 'Running'
                },
                fetchedAt: new Date().toISOString()
            };
        }
        // Issue start command via PATCH with { status: 'Running' }
        await this.demoPortalClient.patchEnvironment(environmentId, {
            status: 'Running'
        });
        // Handle wait option
        if (options?.wait === 'untilRunning') {
            return await this.waitForStartStatus(environmentId, 'Running');
        }
        return {
            type: 'start_environment_result',
            environmentId,
            previousStatus: current.environment.status,
            newStatus: 'Starting',
            status: 'accepted',
            message: 'Environment is starting. This may take several minutes.',
            transition: {
                requested: 'start',
                from: current.environment.status,
                to: 'Running',
                intermediate: 'Starting'
            },
            fetchedAt: new Date().toISOString()
        };
    }
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
    async stopEnvironment(environmentId, options) {
        // Get current status
        const current = await this.getEnvironment(environmentId);
        // Check if already stopped (idempotent)
        if (current.environment.status === 'Stopped') {
            return {
                type: 'stop_environment_result',
                environmentId,
                previousStatus: 'Stopped',
                newStatus: 'Stopped',
                status: 'no_op',
                message: 'Environment already stopped; no action taken.',
                fetchedAt: new Date().toISOString()
            };
        }
        // Issue stop command via PATCH with { status: 'Stopped' }
        await this.demoPortalClient.patchEnvironment(environmentId, {
            status: 'Stopped'
        });
        // Handle wait option
        if (options?.wait === 'untilStopped') {
            return await this.waitForStopStatus(environmentId, 'Stopped');
        }
        return {
            type: 'stop_environment_result',
            environmentId,
            previousStatus: current.environment.status,
            newStatus: 'Stopping',
            status: 'accepted',
            message: 'Environment is stopping.',
            transition: {
                requested: 'stop',
                from: current.environment.status,
                to: 'Stopped',
                intermediate: 'Stopping'
            },
            fetchedAt: new Date().toISOString()
        };
    }
    /**
     * Transform raw API environment to normalized format
     *
     * Handles various name fields (displayName, name, environmentName)
     * and version fields (applicationVersion, bcVersion, version).
     *
     * @private
     */
    transformEnvironment(raw) {
        return {
            id: raw.id,
            name: raw.displayName || raw.name || raw.environmentName || raw.id,
            status: raw.status, // Use status as-is from API (Running, Stopped, Draft, etc.)
            bcVersion: String(raw.applicationVersion || raw.bcVersion || raw.version || 'unknown')
        };
    }
    /**
     * Extract additional details from raw environment
     *
     * Preserves extra fields from API response for detailed view.
     *
     * @private
     */
    extractDetails(raw) {
        // Exclude fields already used in base environment structure
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, name, displayName, environmentName, status, applicationVersion, bcVersion, version, url, authenticationMethod, ...rest } = raw;
        const result = {
            bcVersion: this.transformEnvironment(raw).bcVersion,
            ...rest // Preserve extra fields first
        };
        // Only include optional fields if they exist (these override ...rest)
        if (raw.url) {
            result.url = raw.url;
        }
        if (raw.authenticationMethod) {
            result.authenticationMethod = raw.authenticationMethod;
        }
        return result;
    }
    /**
     * Wait for environment to reach Running status with polling
     *
     * Uses exponential backoff with max delay of 30 seconds.
     * Throws TimeoutError if target status not reached within timeout.
     *
     * @private
     */
    async waitForStartStatus(environmentId, targetStatus, timeoutMs = 300000 // 5 minutes default
    ) {
        const startTime = Date.now();
        let delayMs = 2000; // Start with 2 second delay
        while (Date.now() - startTime < timeoutMs) {
            await this.delay(delayMs);
            const current = await this.getEnvironment(environmentId);
            if (current.environment.status === targetStatus) {
                // Success! Environment reached target status
                return {
                    type: 'start_environment_result',
                    environmentId,
                    previousStatus: 'various',
                    newStatus: targetStatus,
                    status: 'completed',
                    message: `Environment successfully transitioned to ${targetStatus}`,
                    transition: {
                        requested: 'start',
                        from: 'various',
                        to: targetStatus
                    },
                    fetchedAt: new Date().toISOString(),
                    elapsedMs: Date.now() - startTime
                };
            }
            // Exponential backoff with max of 30 seconds
            delayMs = Math.min(30000, delayMs * 2);
        }
        // Timeout exceeded
        throw new TimeoutError(`Timeout waiting for environment to reach ${targetStatus} status after ${timeoutMs / 1000} seconds`, timeoutMs, {
            environmentId,
            targetStatus,
            elapsedMs: Date.now() - startTime
        });
    }
    /**
     * Wait for environment to reach Stopped status with polling
     *
     * Uses exponential backoff with max delay of 30 seconds.
     * Throws TimeoutError if target status not reached within timeout.
     *
     * @private
     */
    async waitForStopStatus(environmentId, targetStatus, timeoutMs = 300000 // 5 minutes default
    ) {
        const startTime = Date.now();
        let delayMs = 2000; // Start with 2 second delay
        while (Date.now() - startTime < timeoutMs) {
            await this.delay(delayMs);
            const current = await this.getEnvironment(environmentId);
            if (current.environment.status === targetStatus) {
                // Success! Environment reached target status
                return {
                    type: 'stop_environment_result',
                    environmentId,
                    previousStatus: 'various',
                    newStatus: targetStatus,
                    status: 'completed',
                    message: `Environment successfully transitioned to ${targetStatus}`,
                    transition: {
                        requested: 'stop',
                        from: 'various',
                        to: targetStatus
                    },
                    fetchedAt: new Date().toISOString(),
                    elapsedMs: Date.now() - startTime
                };
            }
            // Exponential backoff with max of 30 seconds
            delayMs = Math.min(30000, delayMs * 2);
        }
        // Timeout exceeded
        throw new TimeoutError(`Timeout waiting for environment to reach ${targetStatus} status after ${timeoutMs / 1000} seconds`, timeoutMs, {
            environmentId,
            targetStatus,
            elapsedMs: Date.now() - startTime
        });
    }
    /**
     * Delay helper for polling
     *
     * @private
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=environmentService.js.map