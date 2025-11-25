import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
/**
 * Input schema for stop_environment tool
 */
export declare const StopEnvironmentInputSchema: z.ZodObject<{
    environmentId: z.ZodString;
    wait: z.ZodDefault<z.ZodOptional<z.ZodEnum<["none", "untilStopped"]>>>;
}, "strip", z.ZodTypeAny, {
    environmentId: string;
    wait: "none" | "untilStopped";
}, {
    environmentId: string;
    wait?: "none" | "untilStopped" | undefined;
}>;
export type StopEnvironmentInput = z.infer<typeof StopEnvironmentInputSchema>;
/**
 * Tool definition for MCP server
 */
export declare const stopEnvironmentTool: {
    readonly name: "stop_environment";
    readonly description: "Stop a running Business Central environment.\n\nThis tool initiates the shutdown process for an environment. Environments typically take 30-90 seconds to fully stop.\n\nParameters:\n- environmentId (required): The unique environment identifier\n  Example: \"env-abc123\"\n  Get valid IDs using list_environments\n\n- wait (optional): Wait behavior after issuing stop command\n  - \"none\" (default): Return immediately after issuing command\n    * Use this for non-blocking operations\n    * Check status later with get_environment\n    * Faster response, but environment may not be stopped yet\n\n  - \"untilStopped\": Wait until environment is fully stopped\n    * Polls status every 2-30 seconds (exponential backoff)\n    * Returns when status becomes \"Stopped\"\n    * Timeout after 5 minutes\n    * Use when you need to ensure environment is stopped\n\nIdempotency:\nThis tool is fully idempotent - safe to call multiple times:\n- If environment is already \"Stopped\": Returns no-op status, no action taken\n- If environment is \"Stopping\": Returns accepted status (already in progress)\n\nResponse Types:\n1. no_op: Environment already stopped, no action needed\n2. accepted: Stop command issued, environment is stopping\n3. completed: Environment successfully stopped (only with wait=\"untilStopped\")\n\nExample Responses:\n\nImmediate Return (wait=\"none\"):\n{\n  \"type\": \"stop_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"Running\",\n  \"newStatus\": \"Stopping\",\n  \"status\": \"accepted\",\n  \"message\": \"Environment is stopping.\",\n  \"transition\": {\n    \"requested\": \"stop\",\n    \"from\": \"Running\",\n    \"to\": \"Stopped\",\n    \"intermediate\": \"Stopping\"\n  },\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\"\n}\n\nAlready Stopped (idempotent):\n{\n  \"type\": \"stop_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"Stopped\",\n  \"newStatus\": \"Stopped\",\n  \"status\": \"no_op\",\n  \"message\": \"Environment already stopped; no action taken.\",\n  \"fetchedAt\": \"2024-01-15T10:30:00Z\"\n}\n\nWait Until Stopped (wait=\"untilStopped\"):\n{\n  \"type\": \"stop_environment_result\",\n  \"environmentId\": \"env-abc123\",\n  \"previousStatus\": \"various\",\n  \"newStatus\": \"Stopped\",\n  \"status\": \"completed\",\n  \"message\": \"Environment successfully transitioned to Stopped\",\n  \"elapsedMs\": 45000,\n  \"fetchedAt\": \"2024-01-15T10:30:45Z\"\n}\n\nError Handling:\n- NOT_FOUND: Environment ID doesn't exist - use list_environments\n- TIMEOUT_ERROR: Environment didn't stop within 5 minutes (only with wait=\"untilStopped\")\n- AUTH_ERROR: Invalid or expired API token\n- NETWORK_ERROR: Connection issues - retry after brief delay\n\nBest Practices:\n1. Check status first with get_environment to avoid unnecessary calls\n2. Use wait=\"none\" for better performance, poll status separately if needed\n3. Use wait=\"untilStopped\" when you need to ensure environment is stopped\n4. Always check for no_op to detect already-stopped environments\n5. Stop environments when not in use to save resources\n\nUse Cases:\n- Stop environments after testing to save resources\n- Prepare environment for configuration changes that require stopped state\n- Stop environments before backup or maintenance operations\n- Clean up after development work is complete\n- Reduce costs by stopping unused environments\n\nPerformance:\n- wait=\"none\": Returns in 200-400ms\n- wait=\"untilStopped\": 30-90 seconds (typical shutdown time)";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly environmentId: {
                readonly type: "string";
                readonly description: "The unique identifier of the environment to stop. Use list_environments to find valid IDs.";
            };
            readonly wait: {
                readonly type: "string";
                readonly enum: readonly ["none", "untilStopped"];
                readonly description: "Wait behavior: \"none\" (return immediately) or \"untilStopped\" (wait until fully stopped). Default: \"none\"";
                readonly default: "none";
            };
        };
        readonly required: readonly ["environmentId"];
    };
};
/**
 * Execute stop_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId and optional wait
 * @returns Stop operation result or error
 */
export declare function executeStopEnvironment(environmentService: EnvironmentService, input: StopEnvironmentInput): Promise<unknown>;
//# sourceMappingURL=stopEnvironment.d.ts.map