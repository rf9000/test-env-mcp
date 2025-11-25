import { NotFoundError } from '../errors/errors.js';
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
export class DemoPortalClient {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Get the base URL for this client (for logging/debugging)
     */
    getBaseUrl() {
        return this.httpClient.defaults.baseURL || '';
    }
    /**
     * List all environments from Demo Portal
     *
     * @returns Raw array of environment objects from API
     * @throws {AuthError} If authentication fails
     * @throws {RateLimitError} If rate limit exceeded
     * @throws {NetworkError} If network request fails
     */
    async listEnvironmentsRaw() {
        const response = await this.httpClient.get('/environments.json');
        // API returns array directly
        if (!Array.isArray(response.data)) {
            throw new Error('Expected array response from /environments.json');
        }
        return response.data;
    }
    /**
     * Get a single environment by ID
     *
     * @param environmentId - The environment ID to fetch
     * @returns Raw environment object from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    async getEnvironmentRaw(environmentId) {
        try {
            const response = await this.httpClient.get(`/environments/${environmentId}.json`);
            return response.data;
        }
        catch (error) {
            // Convert 404 errors to NotFoundError
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Environment '${environmentId}' not found`, { environmentId });
                }
            }
            throw error;
        }
    }
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
    async patchEnvironment(environmentId, data) {
        try {
            const response = await this.httpClient.patch(`/environments/${environmentId}.json`, data);
            return response.data;
        }
        catch (error) {
            // Convert 404 errors to NotFoundError
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Environment '${environmentId}' not found`, { environmentId });
                }
            }
            throw error;
        }
    }
    /**
     * Get users for an environment (used for Developer Endpoint authentication)
     *
     * @param environmentId - The environment ID
     * @returns Raw array of user objects from API
     * @throws {NotFoundError} If environment doesn't exist
     * @throws {AuthError} If authentication fails
     * @throws {NetworkError} If network request fails
     */
    async getEnvironmentUsers(environmentId) {
        try {
            const response = await this.httpClient.get(`/environments/${environmentId}/users.json`);
            if (!Array.isArray(response.data)) {
                throw new Error('Expected array response from users endpoint');
            }
            return response.data;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Environment '${environmentId}' not found`, { environmentId });
                }
            }
            throw error;
        }
    }
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
    async createEnvironmentUser(environmentId, userData) {
        try {
            const response = await this.httpClient.post(`/environments/${environmentId}/users.json`, userData);
            return response.data;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Environment '${environmentId}' not found`, { environmentId });
                }
            }
            throw error;
        }
    }
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
    async createTestJob(environmentId, testParams, options) {
        try {
            const response = await this.httpClient.post(`/environments/${environmentId}/tests/jobs.json`, testParams, options?.signal ? { signal: options.signal } : undefined);
            // API returns object with numeric jobId
            if (!response.data || typeof response.data.jobId === 'undefined') {
                throw new Error('Expected jobId in response from test job creation');
            }
            return {
                jobId: String(response.data.jobId)
            };
        }
        catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Environment '${environmentId}' not found`, { environmentId });
                }
            }
            throw error;
        }
    }
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
    async getTestResultsXml(environmentId, jobId, options) {
        try {
            const config = {
                // Don't throw on 404 - it means job is still running
                validateStatus: (status) => status === 200 || status === 404,
                ...(options?.signal ? { signal: options.signal } : {})
            };
            const response = await this.httpClient.get(`/environments/${environmentId}/tests/jobs/${jobId}.xml`, config);
            return {
                statusCode: response.status,
                xml: response.status === 200 ? response.data : undefined
            };
        }
        catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    // Job not found (different from job still running)
                    throw new NotFoundError(`Test job '${jobId}' not found for environment '${environmentId}'`, { environmentId, jobId });
                }
            }
            throw error;
        }
    }
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
    async getCoverageCsv(environmentId, jobId) {
        try {
            const response = await this.httpClient.get(`/environments/${environmentId}/tests/jobs/${jobId}/codecoverage.csv`, {
                // CSV response, not JSON
                responseType: 'text'
            });
            return response.data;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    throw new NotFoundError(`Code coverage data not found for test job '${jobId}'`, { environmentId, jobId });
                }
            }
            throw error;
        }
    }
}
//# sourceMappingURL=demoPortalClient.js.map