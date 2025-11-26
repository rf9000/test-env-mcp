/**
 * Developer Endpoint Client
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Handles publishing AL apps to Business Central Developer Endpoint:
 * - Multipart/form-data file upload
 * - Basic Authentication using CredentialsService
 * - Retry logic on authentication failures
 * - TLS configuration for localhost/self-signed certificates
 * - Schema update mode support (synchronize, recreate, forcesync)
 */

import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import https from 'https';
import type { CredentialsService } from '@/services/credentialsService.js';
import { AuthError, ConflictError } from '@/errors/errors.js';
import { ErrorService } from '@/errors/redact.js';

/**
 * Parameters for publishing an app
 */
export interface PublishAppParams {
  /** Absolute path to .app file */
  appPath: string;
  /** Filename to use in upload (e.g., "MyApp.app") */
  appFileName: string;
  /** Environment ID (for credential lookup) */
  environmentId: string;
  /** Full environment URL (e.g., "https://bcserver/BC/") */
  environmentUrl: string;
  /** Authentication method (e.g., "NavUserPassword") */
  authenticationMethod?: string | undefined;
  /** Schema update mode: synchronize (default), recreate, forcesync */
  schemaUpdateMode?: 'synchronize' | 'recreate' | 'forcesync' | undefined;
  /** Dependency publishing option: default, strict (enforce all), ignore (skip missing) */
  dependencyPublishingOption?: 'default' | 'strict' | 'ignore' | undefined;
}

/**
 * Result of publishing an app
 */
export interface PublishResult {
  success: boolean;
  status: 'completed' | 'failed';
  schemaUpdateMode: string;
  response?: unknown | undefined;
  user: string;
  error?: string | undefined;
}

/**
 * Client for Business Central Developer Endpoint operations
 *
 * Handles:
 * - App publishing via multipart/form-data upload
 * - Basic Authentication with credential caching
 * - Retry logic on auth failures (401/403)
 * - TLS configuration for localhost/self-signed certs
 */
export class DeveloperEndpointClient {
  constructor(private readonly credentialsService: CredentialsService) {}

  /**
   * Publish an AL app to Business Central Developer Endpoint
   *
   * Workflow:
   * 1. Get authenticated user credentials
   * 2. Build Developer Endpoint URL with tenant parameter
   * 3. Create multipart/form-data with .app file
   * 4. POST to Developer Endpoint with Basic Auth
   * 5. On 401/403: Invalidate credentials, retry once with fresh auth
   *
   * @param params - Publishing parameters
   * @returns Publishing result with status and user
   * @throws {AuthError} If authentication fails after retry
   * @throws {ConflictError} If schema conflict occurs (409)
   * @throws {NetworkError} If request fails
   */
  async publishApp(params: PublishAppParams): Promise<PublishResult> {
    // Maximum 2 attempts: initial + 1 retry on auth failure
    const maxAttempts = 2;
    let attempt = 0;

    // Get initial authentication
    let authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: params.authenticationMethod
    });

    while (attempt < maxAttempts) {
      attempt++;

      try {
        // Create form data with .app file
        const formData = new FormData();
        formData.append('file', createReadStream(params.appPath), {
          filename: params.appFileName
        });

        // Build Developer Endpoint URL
        const url = this.buildDeveloperEndpointUrl(
          params.environmentUrl,
          params.schemaUpdateMode ?? 'synchronize',
          params.dependencyPublishingOption
        );

        // Configure HTTPS agent
        const httpsAgent = this.createHttpsAgent(params.environmentUrl);

        // POST to Developer Endpoint
        const response = await axios.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: authResult.authorization,
            Accept: 'application/json',
            'X-Request-Id': crypto.randomUUID()
          },
          httpsAgent,
          timeout: 120000, // 2 minutes for upload + processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        return {
          success: true,
          status: 'completed',
          schemaUpdateMode: params.schemaUpdateMode ?? 'synchronize',
          response: response.data,
          user: authResult.user.username
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Handle auth failures with retry
          if ((status === 401 || status === 403) && attempt < maxAttempts) {
            // Invalidate cached credentials
            this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);

            // Get fresh credentials for retry
            authResult = await this.credentialsService.getDeveloperEndpointAuth({
              id: params.environmentId,
              authenticationMethod: params.authenticationMethod
            });

            // Continue to retry
            continue;
          }

          // Final auth failure after retry
          if (status === 401 || status === 403) {
            throw new AuthError(
              'Publishing failed: Invalid credentials after retry. Verify environment permissions and user access.',
              {
                environmentId: params.environmentId,
                user: ErrorService.redact(authResult.user.username),
                statusCode: status
              }
            );
          }

          // Schema conflict
          if (status === 409) {
            throw new ConflictError(
              'Publishing failed: Schema conflict detected. ' +
                'Try schemaUpdateMode="forcesync" to force schema synchronization.',
              {
                currentMode: params.schemaUpdateMode ?? 'synchronize',
                suggestedMode: 'forcesync'
              }
            );
          }

          // Other HTTP errors
          const errorMessage = ErrorService.redact(
            error.response?.data?.message ||
              error.response?.data?.error ||
              error.message ||
              'Unknown error'
          );

          throw new Error(
            `Publishing failed with HTTP ${status}: ${errorMessage}`
          );
        }

        // Non-Axios errors
        throw error;
      }
    }

    // Should never reach here, but TypeScript needs this
    throw new AuthError('Publishing failed: Maximum retry attempts exceeded');
  }

  /**
   * Build Developer Endpoint URL
   *
   * Format: {baseUrl}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}&DependencyPublishingOption={option}
   *
   * @param environmentUrl - Base environment URL
   * @param schemaUpdateMode - Schema update mode
   * @param dependencyPublishingOption - Optional dependency publishing option
   * @returns Complete Developer Endpoint URL
   */
  private buildDeveloperEndpointUrl(
    environmentUrl: string,
    schemaUpdateMode: string,
    dependencyPublishingOption?: string
  ): string {
    const baseUrl = new URL(environmentUrl);
    const tenant = this.credentialsService.getDevTenant();

    // Preserve pathname, remove trailing slash
    const basePath = `${baseUrl.origin}${baseUrl.pathname.replace(/\/$/, '')}`;

    let url = `${basePath}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;

    if (dependencyPublishingOption) {
      url += `&DependencyPublishingOption=${dependencyPublishingOption}`;
    }

    return url;
  }

  /**
   * Create HTTPS agent with conditional certificate validation
   *
   * - Localhost: Allow self-signed certificates (rejectUnauthorized: false)
   * - Configuration: Check allowInsecureCertificates setting
   * - Production: Validate certificates (default)
   *
   * @param environmentUrl - Environment URL to check
   * @returns Configured HTTPS agent
   */
  private createHttpsAgent(environmentUrl: string): https.Agent {
    const url = new URL(environmentUrl);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    // Check configuration
    const allowInsecure =
      (this.credentialsService['configService'].get(
        'auth.allowInsecureCertificates',
        false
      ) as boolean) || false;

    return new https.Agent({
      rejectUnauthorized: !(isLocalhost || allowInsecure)
    });
  }
}
