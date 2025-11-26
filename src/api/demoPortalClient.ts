import type { AxiosInstance } from 'axios';
import { NotFoundError } from '../errors/errors.js';
import { Logger } from '../utils/logger.js';

/**
 * App from the Demo Portal catalog
 *
 * Represents a pre-built app available for installation from the Demo Portal.
 */
export interface CatalogApp {
  /** Internal ID in Demo Portal */
  id: string;
  /** Target platform: 'cloud' or 'onprem' */
  target: string;
  /** Business Central version (e.g., "24.0") */
  bcVersion: string;
  /** App GUID from app.json */
  appId: string;
  /** App name */
  name: string;
  /** App publisher */
  publisher: string;
  /** App version (e.g., "1.0.0.0") */
  version: string;
  /** Download URL for the app */
  url: string;
  /** Product ID if applicable */
  productId: string;
}

/**
 * Client for interacting with the Continia Demo Portal API
 *
 * Provides methods for:
 * - Environment management (list, get, patch)
 * - User management (list, create)
 * - Test execution (create jobs, get results, get coverage)
 * - App catalog management (list available apps, install apps)
 *
 * All methods return raw API responses for transformation by service layer.
 */
export class DemoPortalClient {
  private readonly logger: Logger;

  constructor(private readonly httpClient: AxiosInstance) {
    // httpClient is used throughout the class methods
    this.logger = Logger.getInstance();
  }

  /**
   * Get the base URL for this client (for logging/debugging)
   */
  getBaseUrl(): string {
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
  async listEnvironmentsRaw(): Promise<unknown[]> {
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
  async getEnvironmentRaw(environmentId: string): Promise<unknown> {
    try {
      const response = await this.httpClient.get(`/environments/${environmentId}.json`);
      return response.data;
    } catch (error: unknown) {
      // Convert 404 errors to NotFoundError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
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
  async patchEnvironment(
    environmentId: string,
    data: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await this.httpClient.patch(
        `/environments/${environmentId}.json`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      // Convert 404 errors to NotFoundError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
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
  async getEnvironmentUsers(environmentId: string): Promise<unknown[]> {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/users.json`
      );

      if (!Array.isArray(response.data)) {
        throw new Error('Expected array response from users endpoint');
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
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
  async createEnvironmentUser(
    environmentId: string,
    userData: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await this.httpClient.post(
        `/environments/${environmentId}/users.json`,
        userData
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
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
  async createTestJob(
    environmentId: string,
    testParams: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<{ jobId: string }> {
    try {
      // Log the exact request being made
      const requestUrl = `/environments/${environmentId}/tests/jobs.json`;
      this.logger.info('Creating test job - API Request', {
        details: {
          url: requestUrl,
          environmentId,
          requestBody: JSON.stringify(testParams, null, 2),
          testParams,
          parameterKeys: Object.keys(testParams),
          parameterTypes: Object.entries(testParams).reduce((acc, [key, value]) => {
            acc[key] = typeof value;
            return acc;
          }, {} as Record<string, string>)
        }
      });

      const response = await this.httpClient.post(
        requestUrl,
        testParams,
        options?.signal ? { signal: options.signal } : undefined
      );

      // Log the actual response for troubleshooting
      this.logger.info('Test job creation - API Response', {
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          responseData: response.data,
          responseDataString: JSON.stringify(response.data, null, 2),
          dataType: typeof response.data,
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : []
        }
      });

      // Handle various possible response formats
      let jobIdValue: string | number | undefined;

      if (!response.data) {
        throw new Error(
          `Empty response from test job creation. ` +
          `Status: ${response.status}, StatusText: ${response.statusText}`
        );
      }

      // Check if response is directly the job ID (number or string)
      if (typeof response.data === 'number' || typeof response.data === 'string') {
        jobIdValue = response.data;
      }
      // Check for various field name possibilities in object response
      else if (typeof response.data === 'object') {
        // Try different field name variations
        jobIdValue = response.data.jobId ??
                    response.data.job_id ??
                    response.data.JobId ??
                    response.data.id ??
                    response.data.Id ??
                    response.data.ID;

        // Check for nested structures
        if (!jobIdValue && response.data.job && typeof response.data.job === 'object') {
          jobIdValue = response.data.job.id ?? response.data.job.Id ?? response.data.job.ID;
        }

        // Check if response contains a result field
        if (!jobIdValue && response.data.result) {
          if (typeof response.data.result === 'number' || typeof response.data.result === 'string') {
            jobIdValue = response.data.result;
          } else if (typeof response.data.result === 'object') {
            jobIdValue = response.data.result.jobId ??
                        response.data.result.job_id ??
                        response.data.result.id;
          }
        }
      }

      // Validate that we found a job ID
      if (jobIdValue === undefined || jobIdValue === null || jobIdValue === '') {
        throw new Error(
          `Could not find job ID in API response. ` +
          `Tried fields: jobId, job_id, JobId, id, Id, ID, job.id, result.jobId. ` +
          `Actual response: ${JSON.stringify(response.data)} ` +
          `(type: ${typeof response.data})`
        );
      }

      this.logger.debug('found_job_id', {
        details: {
          jobId: jobIdValue,
          jobIdType: typeof jobIdValue
        }
      });

      return {
        jobId: String(jobIdValue)
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
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
  async getTestResultsXml(
    environmentId: string,
    jobId: string,
    options?: { signal?: AbortSignal }
  ): Promise<{ statusCode: number; xml?: string }> {
    try {
      const config = {
        // Don't throw on 404 - it means job is still running
        validateStatus: (status: number) => status === 200 || status === 404,
        ...(options?.signal ? { signal: options.signal } : {})
      };

      const response = await this.httpClient.get(
        `/environments/${environmentId}/tests/jobs/${jobId}.xml`,
        config
      );

      return {
        statusCode: response.status,
        xml: response.status === 200 ? response.data : undefined
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          // Job not found (different from job still running)
          throw new NotFoundError(
            `Test job '${jobId}' not found for environment '${environmentId}'`,
            { environmentId, jobId }
          );
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
  async getCoverageCsv(
    environmentId: string,
    jobId: string
  ): Promise<string> {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/tests/jobs/${jobId}/codecoverage.csv`,
        {
          // CSV response, not JSON
          responseType: 'text'
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Code coverage data not found for test job '${jobId}'`,
            { environmentId, jobId }
          );
        }
      }
      throw error;
    }
  }

  // ============================================
  // App Catalog Management
  // ============================================

  /**
   * Get available apps from the Demo Portal catalog
   *
   * Retrieves a list of pre-built apps available for installation,
   * filtered by Business Central version and target platform.
   *
   * @param bcVersion - Business Central version (e.g., "24.0")
   * @param target - Target platform: 'cloud' or 'onprem'
   * @returns Array of available apps from the catalog
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getAvailableApps(bcVersion: string, target: string): Promise<CatalogApp[]> {
    const response = await this.httpClient.get('/apps.json', {
      params: {
        bc_version: bcVersion,
        target: target
      }
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Expected array response from /apps.json');
    }

    return response.data as CatalogApp[];
  }

  /**
   * Get apps installed on an environment
   *
   * Retrieves a list of apps currently installed on the specified environment.
   *
   * @param environmentId - The environment ID
   * @returns Array of installed apps
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getEnvironmentApps(environmentId: string): Promise<CatalogApp[]> {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/apps.json`
      );

      if (!Array.isArray(response.data)) {
        throw new Error('Expected array response from apps endpoint');
      }

      return response.data as CatalogApp[];
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }

  /**
   * Install apps to an environment
   *
   * Installs one or more apps from the Demo Portal catalog to the specified environment.
   *
   * @param environmentId - The environment ID
   * @param apps - Array of apps to install (from catalog)
   * @returns true if installation succeeded
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {ValidationError} If app data is invalid
   * @throws {NetworkError} If network request fails
   */
  async installApps(environmentId: string, apps: CatalogApp[]): Promise<boolean> {
    try {
      const response = await this.httpClient.post(
        `/environments/${environmentId}/apps.json`,
        apps
      );

      // Success is typically 200-299 status
      return response.status >= 200 && response.status < 300;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
}
