import { z } from 'zod';
import { AppError, NotFoundError } from '../errors/errors.js';
/**
 * Input schema for get_environment tool
 */
export const GetEnvironmentInputSchema = z.object({
    environmentId: z
        .string()
        .min(1, 'Environment ID is required')
        .describe('The unique identifier of the environment to retrieve. Use list_environments to find valid IDs.')
});
/**
 * Tool definition for MCP server
 */
export const getEnvironmentTool = {
    name: 'get_environment',
    description: `Get detailed information about a specific Business Central environment.

Returns comprehensive environment details including:
- Basic info: id, name, status, bcVersion
- Additional details: URL, authentication method, and other metadata
- Real-time status information

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123" or "12345-67890-abcde"
  Get valid IDs by calling list_environments first

Use Cases:
- Check current status before starting/stopping an environment
- Get environment URL for Developer Endpoint operations
- Verify authentication method before publishing apps
- Retrieve full environment configuration details
- Confirm environment exists before performing operations

Example Response:
{
  "type": "get_environment_result",
  "environment": {
    "id": "env-abc123",
    "name": "Development BC25",
    "status": "Running",
    "bcVersion": "25.0",
    "details": {
      "bcVersion": "25.0",
      "url": "https://bc-env.continiaonline.com/BC250",
      "authenticationMethod": "NavUserPassword"
    }
  },
  "fetchedAt": "2024-01-15T10:30:00Z",
  "elapsedMs": 180
}

Status Values:
- Running: Environment is active and ready for use
- Stopped: Environment is not running (can be started)
- Starting: Environment is in the process of starting up
- Stopping: Environment is in the process of shutting down
- Draft: Environment is not yet fully configured

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments to find valid IDs
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Performance:
- Typical response time: 150-300ms
- Returns real-time status (no caching)
- Use this before start/stop operations to check current state`,
    inputSchema: {
        type: 'object',
        properties: {
            environmentId: {
                type: 'string',
                description: 'The unique identifier of the environment to retrieve. Use list_environments to find valid IDs.'
            }
        },
        required: ['environmentId']
    }
};
/**
 * Execute get_environment tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input with environmentId
 * @returns Environment details or error
 */
export async function executeGetEnvironment(environmentService, input) {
    try {
        // Validate input
        const validated = GetEnvironmentInputSchema.parse(input);
        // Execute service method
        const result = await environmentService.getEnvironment(validated.environmentId);
        return result;
    }
    catch (error) {
        // Handle not found errors with helpful guidance
        if (error instanceof NotFoundError) {
            return {
                type: 'error',
                kind: 'not_found',
                message: error.message,
                retryable: false,
                details: error.details,
                remediation: 'Use list_environments tool to see all available environments and their IDs. Verify the environment ID is correct and the environment exists.'
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
function getRemediation(error) {
    switch (error.code) {
        case 'AUTH_ERROR':
            return 'Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.';
        case 'NETWORK_ERROR':
            return 'Check network connection and Demo Portal API availability. Retry after a brief delay.';
        case 'VALIDATION_ERROR':
            return 'Ensure environmentId parameter is provided and is a valid non-empty string.';
        default:
            return 'Review error details and try again. Contact support if issue persists.';
    }
}
//# sourceMappingURL=getEnvironment.js.map