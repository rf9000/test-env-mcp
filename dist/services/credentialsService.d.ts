/**
 * Credentials Service
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Manages authentication credentials for Business Central Developer Endpoint:
 * - Fetches users from Demo Portal API
 * - Implements intelligent user selection with session caching
 * - Creates Basic Authentication headers
 * - Supports credential invalidation on auth failures
 * - Non-interactive mode for MCP usage
 */
import { z } from 'zod';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { ConfigurationService } from '@/services/configurationService.js';
/**
 * Schema for BC User response from Demo Portal
 */
declare const BcUserSchema: z.ZodObject<{
    id: z.ZodString;
    environmentId: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fullName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    environmentId: string;
    id: string;
    username: string;
    description?: string | undefined;
    fullName?: string | undefined;
}, {
    password: string;
    environmentId: string;
    id: string;
    username: string;
    description?: string | undefined;
    fullName?: string | undefined;
}>;
export type BcUser = z.infer<typeof BcUserSchema>;
/**
 * Authentication result with header and user details
 */
export interface AuthResult {
    /** Basic authentication header value */
    authorization: string;
    /** Selected BC user */
    user: BcUser;
}
/**
 * Service for managing Developer Endpoint credentials
 *
 * Responsibilities:
 * - Fetch users from Demo Portal for an environment
 * - Select appropriate user (first user in MCP mode)
 * - Generate Basic Auth headers
 * - Cache credentials per environment (session-scoped)
 * - Invalidate credentials on auth failures
 */
export declare class CredentialsService {
    private readonly demoPortalClient;
    private readonly configService;
    /** Session-scoped cache: environmentId → BcUser */
    private userCache;
    constructor(demoPortalClient: DemoPortalClient, configService: ConfigurationService);
    /**
     * Get Developer Endpoint authentication header and selected user
     *
     * Implements intelligent user selection with caching:
     * 1. Check cache first (session-scoped)
     * 2. Fetch users from Demo Portal if not cached
     * 3. Select first user (MCP non-interactive mode)
     * 4. Cache selection for session
     * 5. Create Basic Auth header
     *
     * @param environment - Environment details (id, optional authenticationMethod)
     * @returns Authentication result with header and user
     * @throws {AuthError} If no users found or unsupported auth method
     */
    getDeveloperEndpointAuth(environment: {
        id: string;
        authenticationMethod?: string | undefined;
    }): Promise<AuthResult>;
    /**
     * Invalidate cached credentials (called on 401/403 responses)
     *
     * Clears cached user for the environment to force re-fetch on next request.
     * Used by DeveloperEndpointClient when auth fails.
     *
     * @param environmentId - Environment ID to invalidate
     */
    invalidateDeveloperEndpointAuth(environmentId: string): void;
    /**
     * Get configured tenant for developer endpoint
     *
     * Defaults to 'default' if not configured.
     *
     * @returns Tenant name for Developer Endpoint URLs
     */
    getDevTenant(): string;
    /**
     * Fetch users for an environment from Demo Portal
     *
     * @param environmentId - Environment ID
     * @returns Array of BC users (validated against schema)
     * @throws {NotFoundError} If environment not found
     * @throws {NetworkError} If API request fails
     */
    private fetchEnvironmentUsers;
    /**
     * Create authentication result from user
     *
     * Generates Basic Authentication header: `Basic base64(username:password)`
     *
     * @param user - BC user
     * @returns Authentication result with header and user
     */
    private createAuthResult;
    /**
     * Handle case when no users exist for environment
     *
     * In MCP (non-interactive) mode:
     * - Check if auth method is NavUserPassword
     * - Return structured error with suggestedActions
     * - Provide actionable guidance for LLM
     *
     * @param environment - Environment details
     * @returns Never returns - always throws
     * @throws {AuthError} With structured error details
     */
    private handleNoUsers;
    /**
     * Create a new environment user (for future interactive mode)
     *
     * Creates a user with random username and secure password.
     * Currently not used in MCP mode but available for future extensions.
     *
     * @param environmentId - Environment ID
     * @returns Created user
     * @throws {NetworkError} If API request fails
     */
    createEnvironmentUser(environmentId: string): Promise<BcUser>;
    /**
     * Generate cryptographically secure password
     *
     * Generates 16-character password with mixed case, numbers, and symbols.
     *
     * @returns Secure random password
     */
    private generateSecurePassword;
}
export {};
//# sourceMappingURL=credentialsService.d.ts.map