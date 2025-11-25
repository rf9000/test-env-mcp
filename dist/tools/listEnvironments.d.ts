import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
/**
 * Input schema for list_environments tool
 * No parameters required - lists all environments
 */
export declare const ListEnvironmentsInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type ListEnvironmentsInput = z.infer<typeof ListEnvironmentsInputSchema>;
/**
 * Tool definition for MCP server
 */
export declare const listEnvironmentsTool: {
    readonly name: "list_environments";
    readonly description: "List all available Business Central environments from the Demo Portal.\n\nReturns a JSON array of environments with:\n- id: Unique environment identifier\n- name: Human-readable environment name\n- status: Current status (Running, Stopped, Draft, Starting, Stopping)\n- bcVersion: Business Central version (e.g., \"25.0\", \"24.3\")\n\nThe results are sorted alphabetically by name for easy scanning.\n\nUse Cases:\n- Get an overview of all available environments\n- Find environment IDs for other operations (start, stop, get details)\n- Check which environments are currently running\n- Verify environment existence before performing operations\n\nExample Response:\n{\n  \"type\": \"list_environments_result\",\n  \"environments\": [\n    {\n      \"id\": \"env-abc123\",\n      \"name\": \"Development BC25\",\n      \"status\": \"Running\",\n      \"bcVersion\": \"25.0\"\n    },\n    {\n      \"id\": \"env-def456\",\n      \"name\": \"Testing BC24\",\n      \"status\": \"Stopped\",\n      \"bcVersion\": \"24.3\"\n    }\n  ],\n  \"count\": 2,\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\",\n  \"elapsedMs\": 245\n}\n\nError Handling:\n- AUTH_ERROR: Invalid or expired API token - verify DEMO_PORTAL_TOKEN\n- RATE_LIMIT: Too many requests - wait and retry after specified seconds\n- NETWORK_ERROR: Connection issues - check network and API availability\n\nPerformance:\n- Typical response time: 200-500ms\n- Returns all environments in a single request (no pagination needed)\n- Results are cached at the API level for ~1 minute";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly [];
    };
};
/**
 * Execute list_environments tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input (empty object)
 * @returns Environment list result or error
 */
export declare function executeListEnvironments(environmentService: EnvironmentService, input: ListEnvironmentsInput): Promise<unknown>;
//# sourceMappingURL=listEnvironments.d.ts.map