import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
/**
 * Input schema for start_environment tool
 */
export declare const StartEnvironmentInputSchema: z.ZodObject<{
    environmentId: z.ZodString;
    wait: z.ZodDefault<z.ZodOptional<z.ZodEnum<["none", "untilRunning"]>>>;
}, "strip", z.ZodTypeAny, {
    environmentId: string;
    wait: "none" | "untilRunning";
}, {
    environmentId: string;
    wait?: "none" | "untilRunning" | undefined;
}>;
export type StartEnvironmentInput = z.infer<typeof StartEnvironmentInputSchema>;
/**
 * Tool definition for MCP server
 */
export declare const startEnvironmentTool: {
    readonly name: "start_environment";
    readonly description: "Start a stopped Business Central environment.\n\nThis tool initiates the startup process for an environment. Environments typically take 2-5 minutes to fully start.\n\nParameters:\n- environmentId (required): The unique environment identifier\n  Example: \"env-abc123\"\n  Get valid IDs using list_environments\n\n- wait (optional): Wait behavior after issuing start command\n  - \"none\" (default): Return immediately after issuing command\n    * Use this for non-blocking operations\n    * Check status later with get_environment\n    * Faster response, but environment may not be ready yet\n\n  - \"untilRunning\": Wait until environment is fully running\n    * Polls status every 2-30 seconds (exponential backoff)\n    * Returns when status becomes \"Running\"\n    * Timeout after 5 minutes\n    * Use when you need the environment ready immediately\n\nIdempotency:\nThis tool is fully idempotent - safe to call multiple times:\n- If environment is already \"Running\": Returns no-op status, no action taken\n- If environment is \"Starting\": Returns accepted status (already in progress)\n- If environment is \"Stopping\": Returns conflict error (wait for stop to complete)\n\nResponse Types:\n1. no_op: Environment already running, no action needed\n2. accepted: Start command issued, environment is starting\n3. completed: Environment successfully started (only with wait=\"untilRunning\")\n4. conflict_in_progress: Environment is stopping, cannot start yet\n\nExample Responses:\n\nImmediate Return (wait=\"none\"):\n{\n  \"type\": \"start_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"Stopped\",\n  \"newStatus\": \"Starting\",\n  \"status\": \"accepted\",\n  \"message\": \"Environment is starting. This may take several minutes.\",\n  \"transition\": {\n    \"requested\": \"start\",\n    \"from\": \"Stopped\",\n    \"to\": \"Running\",\n    \"intermediate\": \"Starting\"\n  },\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\"\n}\n\nAlready Running (idempotent):\n{\n  \"type\": \"start_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"Running\",\n  \"newStatus\": \"Running\",\n  \"status\": \"no_op\",\n  \"message\": \"Environment already running; no action taken.\",\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\"\n}\n\nConflict (environment stopping):\n{\n  \"type\": \"start_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"Stopping\",\n  \"newStatus\": \"Stopping\",\n  \"status\": \"conflict_in_progress\",\n  \"message\": \"Environment is stopping. Wait for it to complete before starting.\",\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\"\n}\n\nWait Until Running (wait=\"untilRunning\"):\n{\n  \"type\": \"start_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"various\",\n  \"newStatus\": \"Running\",\n  \"status\": \"completed\",\n  \"message\": \"Environment successfully transitioned to Running\",\n  \"elapsedMs\": 145000,\n  \"fetchedAt\": \"2024-01-15T10:32:25Z\"\n}\n\nError Handling:\n- NOT_FOUND: Environment ID doesn't exist - use list_environments\n- TIMEOUT_ERROR: Environment didn't start within 5 minutes (only with wait=\"untilRunning\")\n- AUTH_ERROR: Invalid or expired API token\n- NETWORK_ERROR: Connection issues - retry after brief delay\n\nBest Practices:\n1. Check status first with get_environment to avoid unnecessary calls\n2. Use wait=\"none\" for better performance, poll status separately if needed\n3. Use wait=\"untilRunning\" when you need the environment ready immediately\n4. Handle conflict_in_progress by waiting for stop to complete\n5. Always check for no_op to detect already-running environments\n\nPerformance:\n- wait=\"none\": Returns in 200-400ms\n- wait=\"untilRunning\": 2-5 minutes (typical startup time)";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly environmentId: {
                readonly type: "string";
                readonly description: "The unique identifier of the environment to start. Use list_environments to find valid IDs.";
            };
            readonly wait: {
                readonly type: "string";
                readonly enum: readonly ["none", "untilRunning"];
                readonly description: "Wait behavior: \"none\" (return immediately) or \"untilRunning\" (wait until fully running). Default: \"none\"";
                readonly default: "none";
            };
        };
        readonly required: readonly ["environmentId"];
    };
};
/**
 * Execute start_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId and optional wait
 * @returns Start operation result or error
 */
export declare function executeStartEnvironment(environmentService: EnvironmentService, input: StartEnvironmentInput): Promise<unknown>;
//# sourceMappingURL=startEnvironment.d.ts.map