import type { AxiosInstance } from 'axios';
/**
 * Client for interacting with the Continia Demo Portal API
 *
 * Provides methods for:
 * - Environment management (list, get, patch)
 * - User management (list, create)
 * - Test execution (create jobs, get results, get coverage)
 *
 * All methods return raw API responses for transformation by service layer.
 */
export declare class DemoPortalClient {
    private readonly httpClient;
    constructor(httpClient: AxiosInstance);
    /**
     * Get the base URL for this client (for logging/debugging)
     */
    getBaseUrl(): string;
    /**
     * List all environments from Demo Portal
     *
     * @returns Raw array of environment objects from API
     * @throws {AuthError} If authentication fails
     * @throws {RateLimitError} If rate limit exceeded
     * @throws {NetworkError} If network request fails
     */
    listEnvironmentsRaw(): Promise<unknown[]>;
    /**
     * Get a single environment by ID
     *
     * @param environmentId - The environment ID to fetch
     * @returns Raw environment object from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    getEnvironmentRaw(environmentId: string): Promise<unknown>;
    /**
     * Update an environment (primarily used for start/stop operations)
     *
     * @param environmentId - The environment ID to update
     * @param data - Partial environment data (e.g., { status: 'Running' })
     * @returns Updated environment object from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     *
     * @example
     * // Start an environment
     * await client.patchEnvironment('env-123', { status: 'Running' });
     *
     * @example
     * // Stop an environment
     * await client.patchEnvironment('env-123', { status: 'Stopped' });
     */
    patchEnvironment(environmentId: string, data: Record<string, unknown>): Promise<unknown>;
    /**
     * Get users for an environment (used for Developer Endpoint authentication)
     *
     * @param environmentId - The environment ID
     * @returns Raw array of user objects from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    getEnvironmentUsers(environmentId: string): Promise<unknown[]>;
    /**
     * Create a user for an environment
     *
     * @param environmentId - The environment ID
     * @param userData - User data (username, password, etc.)
     * @returns Created user object from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {ValidationError} If user data is invalid
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    createEnvironmentUser(environmentId: string, userData: Record<string, unknown>): Promise<unknown>;
    /**
     * Create a test job for an environment
     *
     * Phase 3 implementation - Test execution
     *
     * @param environmentId - The environment ID
     * @param testParams - Test parameters (codeunitId, testMethod, etc.)
     * @param options - Request options (signal for cancellation)
     * @returns Test job object with jobId
     */
    createTestJob(environmentId: string, testParams: Record<string, unknown>, options?: {
        signal?: AbortSignal;
    }): Promise<{
        jobId: string;
    }>;
    /**
     * Get test results XML for a completed test job
     *
     * Phase 3 implementation - Test execution
     *
     * Note: Returns 404 while job is still running, 200 when complete
     *
     * @param environmentId - The environment ID
     * @param jobId - The test job ID
     * @param options - Request options (signal for cancellation)
     * @returns Object with statusCode and xml content
     */
    getTestResultsXml(environmentId: string, jobId: string, options?: {
        signal?: AbortSignal;
    }): Promise<{
        statusCode: number;
        xml?: string;
    }>;
    /**
     * Get code coverage CSV for a completed test job
     *
     * Phase 3 implementation - Test execution
     *
     * @param environmentId - The environment ID
     * @param jobId - The test job ID
     * @returns CSV content as string
     * @throws {NotFoundError} If job doesn't exist or has no coverage data
     */
    getCoverageCsv(environmentId: string, jobId: string): Promise<string>;
}
//# sourceMappingURL=demoPortalClient.d.ts.map