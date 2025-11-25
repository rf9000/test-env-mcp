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
import crypto from 'crypto';
import { AuthError } from '@/errors/errors.js';
/**
 * Schema for BC User response from Demo Portal
 */
const BcUserSchema = z.object({
    id: z.string(),
    environmentId: z.string(),
    username: z.string(),
    password: z.string(),
    description: z.string().optional(),
    fullName: z.string().optional()
});
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
export class CredentialsService {
    demoPortalClient;
    configService;
    /** Session-scoped cache: environmentId → BcUser */
    userCache = new Map();
    constructor(demoPortalClient, configService) {
        this.demoPortalClient = demoPortalClient;
        this.configService = configService;
    }
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
    async getDeveloperEndpointAuth(environment) {
        // Check cache first
        const cachedUser = this.userCache.get(environment.id);
        if (cachedUser) {
            return this.createAuthResult(cachedUser);
        }
        // Fetch users from Demo Portal
        const users = await this.fetchEnvironmentUsers(environment.id);
        // Handle no users case
        if (users.length === 0) {
            return this.handleNoUsers(environment);
        }
        // Select user (first user in MCP non-interactive mode)
        const selectedUser = users[0];
        if (!selectedUser) {
            // Should never happen because we check length === 0 above, but TypeScript needs this
            throw new AuthError('No users available after fetch', { environmentId: environment.id });
        }
        // Cache selection for session
        this.userCache.set(environment.id, selectedUser);
        return this.createAuthResult(selectedUser);
    }
    /**
     * Invalidate cached credentials (called on 401/403 responses)
     *
     * Clears cached user for the environment to force re-fetch on next request.
     * Used by DeveloperEndpointClient when auth fails.
     *
     * @param environmentId - Environment ID to invalidate
     */
    invalidateDeveloperEndpointAuth(environmentId) {
        this.userCache.delete(environmentId);
    }
    /**
     * Get configured tenant for developer endpoint
     *
     * Defaults to 'default' if not configured.
     *
     * @returns Tenant name for Developer Endpoint URLs
     */
    getDevTenant() {
        return this.configService.get('auth.devTenant', 'default');
    }
    /**
     * Fetch users for an environment from Demo Portal
     *
     * @param environmentId - Environment ID
     * @returns Array of BC users (validated against schema)
     * @throws {NotFoundError} If environment not found
     * @throws {NetworkError} If API request fails
     */
    async fetchEnvironmentUsers(environmentId) {
        const response = await this.demoPortalClient.getEnvironmentUsers(environmentId);
        // Validate and parse each user
        return response.map((user) => BcUserSchema.parse(user));
    }
    /**
     * Create authentication result from user
     *
     * Generates Basic Authentication header: `Basic base64(username:password)`
     *
     * @param user - BC user
     * @returns Authentication result with header and user
     */
    createAuthResult(user) {
        const credentials = `${user.username}:${user.password}`;
        const encoded = Buffer.from(credentials).toString('base64');
        return {
            authorization: `Basic ${encoded}`,
            user
        };
    }
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
    handleNoUsers(environment) {
        const authMethod = environment.authenticationMethod ?? 'NavUserPassword';
        // Check if auth method is supported
        if (authMethod !== 'NavUserPassword') {
            throw new AuthError('Developer Endpoint publishing requires NavUserPassword authentication. ' +
                `Current method: ${authMethod}. Please create a NavUserPassword user first.`, {
                code: 'UNSUPPORTED_AUTH_METHOD',
                suggestedActions: ['CreateNavUserPasswordUser'],
                currentAuthMethod: authMethod,
                supportedAuthMethods: ['NavUserPassword']
            });
        }
        // Non-interactive mode (MCP): return structured error
        throw new AuthError('No users found for environment. Create a NavUserPassword user via Demo Portal to proceed.', {
            code: 'NO_USERS',
            suggestedActions: ['CreateUserViaPortal', 'CheckEnvironmentSettings'],
            environmentId: environment.id,
            hint: 'Users can be created via the Demo Portal web interface'
        });
    }
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
    async createEnvironmentUser(environmentId) {
        const username = `User${Date.now()}`;
        const password = this.generateSecurePassword();
        const response = await this.demoPortalClient.createEnvironmentUser(environmentId, {
            username,
            password
        });
        return BcUserSchema.parse(response);
    }
    /**
     * Generate cryptographically secure password
     *
     * Generates 16-character password with mixed case, numbers, and symbols.
     *
     * @returns Secure random password
     */
    generateSecurePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            const randomIndex = crypto.randomInt(0, chars.length);
            password += chars[randomIndex];
        }
        return password;
    }
}
//# sourceMappingURL=credentialsService.js.map