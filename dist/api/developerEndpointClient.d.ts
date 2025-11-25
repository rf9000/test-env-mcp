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
import type { CredentialsService } from '@/services/credentialsService.js';
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
export declare class DeveloperEndpointClient {
    private readonly credentialsService;
    constructor(credentialsService: CredentialsService);
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
    publishApp(params: PublishAppParams): Promise<PublishResult>;
    /**
     * Build Developer Endpoint URL
     *
     * Format: {baseUrl}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}
     *
     * @param environmentUrl - Base environment URL
     * @param schemaUpdateMode - Schema update mode
     * @returns Complete Developer Endpoint URL
     */
    private buildDeveloperEndpointUrl;
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
    private createHttpsAgent;
}
//# sourceMappingURL=developerEndpointClient.d.ts.map