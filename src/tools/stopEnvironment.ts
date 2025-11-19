import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
import { AppError, NotFoundError, TimeoutError } from '../errors/errors.js';

/**
 * Input schema for stop_environment tool
 */
export const StopEnvironmentInputSchema = z.object({
  environmentId: z
    .string()
    .min(1, 'Environment ID is required')
    .describe(
      'The unique identifier of the environment to stop. Use list_environments to find valid IDs.'
    ),
  wait: z
    .enum(['none', 'untilStopped'])
    .optional()
    .default('none')
    .describe(
      'Wait behavior: "none" (return immediately after issuing command) or "untilStopped" (wait until environment is fully stopped). Default: "none"'
    )
});

export type StopEnvironmentInput = z.infer<typeof StopEnvironmentInputSchema>;

/**
 * Tool definition for MCP server
 */
export const stopEnvironmentTool = {
  name: 'stop_environment',
  description: `Stop a running Business Central environment.

This tool initiates the shutdown process for an environment. Environments typically take 30-90 seconds to fully stop.

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123"
  Get valid IDs using list_environments

- wait (optional): Wait behavior after issuing stop command
  - "none" (default): Return immediately after issuing command
    * Use this for non-blocking operations
    * Check status later with get_environment
    * Faster response, but environment may not be stopped yet

  - "untilStopped": Wait until environment is fully stopped
    * Polls status every 2-30 seconds (exponential backoff)
    * Returns when status becomes "Stopped"
    * Timeout after 5 minutes
    * Use when you need to ensure environment is stopped

Idempotency:
This tool is fully idempotent - safe to call multiple times:
- If environment is already "Stopped": Returns no-op status, no action taken
- If environment is "Stopping": Returns accepted status (already in progress)

Response Types:
1. no_op: Environment already stopped, no action needed
2. accepted: Stop command issued, environment is stopping
3. completed: Environment successfully stopped (only with wait="untilStopped")

Example Responses:

Immediate Return (wait="none"):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Running",
  "newStatus": "Stopping",
  "status": "accepted",
  "message": "Environment is stopping.",
  "transition": {
    "requested": "stop",
    "from": "Running",
    "to": "Stopped",
    "intermediate": "Stopping"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Already Stopped (idempotent):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopped",
  "newStatus": "Stopped",
  "status": "no_op",
  "message": "Environment already stopped; no action taken.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Wait Until Stopped (wait="untilStopped"):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "various",
  "newStatus": "Stopped",
  "status": "completed",
  "message": "Environment successfully transitioned to Stopped",
  "elapsedMs": 45000,
  "fetchedAt": "2024-01-15T10:30:45Z"
}

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments
- TIMEOUT_ERROR: Environment didn't stop within 5 minutes (only with wait="untilStopped")
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Best Practices:
1. Check status first with get_environment to avoid unnecessary calls
2. Use wait="none" for better performance, poll status separately if needed
3. Use wait="untilStopped" when you need to ensure environment is stopped
4. Always check for no_op to detect already-stopped environments
5. Stop environments when not in use to save resources

Use Cases:
- Stop environments after testing to save resources
- Prepare environment for configuration changes that require stopped state
- Stop environments before backup or maintenance operations
- Clean up after development work is complete
- Reduce costs by stopping unused environments

Performance:
- wait="none": Returns in 200-400ms
- wait="untilStopped": 30-90 seconds (typical shutdown time)`,
  inputSchema: {
    type: 'object',
    properties: {
      environmentId: {
        type: 'string',
        description:
          'The unique identifier of the environment to stop. Use list_environments to find valid IDs.'
      },
      wait: {
        type: 'string',
        enum: ['none', 'untilStopped'],
        description:
          'Wait behavior: "none" (return immediately) or "untilStopped" (wait until fully stopped). Default: "none"',
        default: 'none'
      }
    },
    required: ['environmentId']
  }
} as const;

/**
 * Execute stop_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId and optional wait
 * @returns Stop operation result or error
 */
export async function executeStopEnvironment(
  environmentService: EnvironmentService,
  input: StopEnvironmentInput
): Promise<unknown> {
  try {
    // Validate input
    const validated = StopEnvironmentInputSchema.parse(input);

    // Execute service method
    const result = await environmentService.stopEnvironment(
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

    // Handle timeout errors (from wait="untilStopped")
    if (error instanceof TimeoutError) {
      return {
        type: 'error',
        kind: 'timeout_error',
        message: error.message,
        retryable: true,
        details: error.details,
        remediation:
          'Environment shutdown is taking longer than expected. Use get_environment to check current status. The environment may still be stopping.'
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
      return 'Ensure environmentId is provided and wait parameter (if specified) is either "none" or "untilStopped".';
    default:
      return 'Review error details and try again. Check environment status with get_environment.';
  }
}
