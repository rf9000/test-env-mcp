import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
/**
 * Input schema for get_environment tool
 */
export declare const GetEnvironmentInputSchema: z.ZodObject<{
    environmentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    environmentId: string;
}, {
    environmentId: string;
}>;
export type GetEnvironmentInput = z.infer<typeof GetEnvironmentInputSchema>;
/**
 * Tool definition for MCP server
 */
export declare const getEnvironmentTool: {
    readonly name: "get_environment";
    readonly description: "Get detailed information about a specific Business Central environment.\n\nReturns comprehensive environment details including:\n- Basic info: id, name, status, bcVersion\n- Additional details: URL, authentication method, and other metadata\n- Real-time status information\n\nParameters:\n- environmentId (required): The unique environment identifier\n  Example: \"env-abc123\" or \"12345-67890-abcde\"\n  Get valid IDs by calling list_environments first\n\nUse Cases:\n- Check current status before starting/stopping an environment\n- Get environment URL for Developer Endpoint operations\n- Verify authentication method before publishing apps\n- Retrieve full environment configuration details\n- Confirm environment exists before performing operations\n\nExample Response:\n{\n  \"type\": \"get_environment_result\",\n  \"environment\": {\n    \"id\": \"env-abc123\",\n    \"name\": \"Development BC25\",\n    \"status\": \"Running\",\n    \"bcVersion\": \"25.0\",\n    \"details\": {\n      \"bcVersion\": \"25.0\",\n      \"url\": \"https://bc-env.continiaonline.com/BC250\",\n      \"authenticationMethod\": \"NavUserPassword\"\n    }\n  },\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\",\n  \"elapsedMs\": 180\n}\n\nStatus Values:\n- Running: Environment is active and ready for use\n- Stopped: Environment is not running (can be started)\n- Starting: Environment is in the process of starting up\n- Stopping: Environment is in the process of shutting down\n- Draft: Environment is not yet fully configured\n\nError Handling:\n- NOT_FOUND: Environment ID doesn't exist - use list_environments to find valid IDs\n- AUTH_ERROR: Invalid or expired API token\n- NETWORK_ERROR: Connection issues - retry after brief delay\n\nPerformance:\n- Typical response time: 150-300ms\n- Returns real-time status (no caching)\n- Use this before start/stop operations to check current state";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly environmentId: {
                readonly type: "string";
                readonly description: "The unique identifier of the environment to retrieve. Use list_environments to find valid IDs.";
            };
        };
        readonly required: readonly ["environmentId"];
    };
};
/**
 * Execute get_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId
 * @returns Environment details or error
 */
export declare function executeGetEnvironment(environmentService: EnvironmentService, input: GetEnvironmentInput): Promise<unknown>;
//# sourceMappingURL=getEnvironment.d.ts.map