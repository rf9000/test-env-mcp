import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
import { AppError, NotFoundError, TimeoutError } from '../errors/errors.js';

/**
 * Input schema for start_environment tool
 */
export const StartEnvironmentInputSchema = z.object({
  environmentId: z
    .string()
    .min(1, 'Environment ID is required')
    .describe(
      'The unique identifier of the environment to start. Use list_environments to find valid IDs.'
    ),
  wait: z
    .enum(['none', 'untilRunning'])
    .optional()
    .default('none')
    .describe(
      'Wait behavior: "none" (return immediately after issuing command) or "untilRunning" (wait until environment is fully running). Default: "none"'
    )
});

export type StartEnvironmentInput = z.infer<
  typeof StartEnvironmentInputSchema
>;

/**
 * Tool definition for MCP server
 */
export const startEnvironmentTool = {
  name: 'start_environment',
  description: `Start a stopped Business Central environment.

This tool initiates the startup process for an environment. Environments typically take 2-5 minutes to fully start.

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123"
  Get valid IDs using list_environments

- wait (optional): Wait behavior after issuing start command
  - "none" (default): Return immediately after issuing command
    * Use this for non-blocking operations
    * Check status later with get_environment
    * Faster response, but environment may not be ready yet

  - "untilRunning": Wait until environment is fully running
    * Polls status every 2-30 seconds (exponential backoff)
    * Returns when status becomes "Running"
    * Timeout after 5 minutes
    * Use when you need the environment ready immediately

Idempotency:
This tool is fully idempotent - safe to call multiple times:
- If environment is already "Running": Returns no-op status, no action taken
- If environment is "Starting": Returns accepted status (already in progress)
- If environment is "Stopping": Returns conflict error (wait for stop to complete)

Response Types:
1. no_op: Environment already running, no action needed
2. accepted: Start command issued, environment is starting
3. completed: Environment successfully started (only with wait="untilRunning")
4. conflict_in_progress: Environment is stopping, cannot start yet

Example Responses:

Immediate Return (wait="none"):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopped",
  "newStatus": "Starting",
  "status": "accepted",
  "message": "Environment is starting. This may take several minutes.",
  "transition": {
    "requested": "start",
    "from": "Stopped",
    "to": "Running",
    "intermediate": "Starting"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Already Running (idempotent):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Running",
  "newStatus": "Running",
  "status": "no_op",
  "message": "Environment already running; no action taken.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Conflict (environment stopping):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopping",
  "newStatus": "Stopping",
  "status": "conflict_in_progress",
  "message": "Environment is stopping. Wait for it to complete before starting.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Wait Until Running (wait="untilRunning"):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "various",
  "newStatus": "Running",
  "status": "completed",
  "message": "Environment successfully transitioned to Running",
  "elapsedMs": 145000,
  "fetchedAt": "2024-01-15T10:32:25Z"
}

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments
- TIMEOUT_ERROR: Environment didn't start within 5 minutes (only with wait="untilRunning")
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Best Practices:
1. Check status first with get_environment to avoid unnecessary calls
2. Use wait="none" for better performance, poll status separately if needed
3. Use wait="untilRunning" when you need the environment ready immediately
4. Handle conflict_in_progress by waiting for stop to complete
5. Always check for no_op to detect already-running environments

Performance:
- wait="none": Returns in 200-400ms
- wait="untilRunning": 2-5 minutes (typical startup time)`,
  inputSchema: {
    type: 'object',
    properties: {
      environmentId: {
        type: 'string',
        description:
          'The unique identifier of the environment to start. Use list_environments to find valid IDs.'
      },
      wait: {
        type: 'string',
        enum: ['none', 'untilRunning'],
        description:
          'Wait behavior: "none" (return immediately) or "untilRunning" (wait until fully running). Default: "none"',
        default: 'none'
      }
    },
    required: ['environmentId']
  }
} as const;

/**
 * Execute start_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId and optional wait
 * @returns Start operation result or error
 */
export async function executeStartEnvironment(
  environmentService: EnvironmentService,
  input: StartEnvironmentInput
): Promise<unknown> {
  try {
    // Validate input
    const validated = StartEnvironmentInputSchema.parse(input);

    // Execute service method
    const result = await environmentService.startEnvironment(
      validated.environmentId,
      { wait: validated.wait }
    );

    return result;
  } catch (error) {
    // Handle not found errors
    if (error instanceof NotFoundError) {
      return {
        type: 'error',
        kind: 'not_found',
        message: error.message,
        retryable: false,
        details: error.details,
        remediation:
          'Use list_environments tool to see all available environments and their IDs.'
      };
    }

    // Handle timeout errors (from wait="untilRunning")
    if (error instanceof TimeoutError) {
      return {
        type: 'error',
        kind: 'timeout_error',
        message: error.message,
        retryable: true,
        details: error.details,
        remediation:
          'Environment startup is taking longer than expected. Use get_environment to check current status. The environment may still be starting.'
      };
    }

    // Handle other app errors
    if (error instanceof AppError) {
      return {
        type: 'error',
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation(error)
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Get remediation guidance for common errors
 */
function getRemediation(error: AppError): string {
  switch (error.code) {
    case 'AUTH_ERROR':
      return 'Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.';
    case 'NETWORK_ERROR':
      return 'Check network connection and Demo Portal API availability. Retry after a brief delay.';
    case 'VALIDATION_ERROR':
      return 'Ensure environmentId is provided and wait parameter (if specified) is either "none" or "untilRunning".';
    default:
      return 'Review error details and try again. Check environment status with get_environment.';
  }
}
