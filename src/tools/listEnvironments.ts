import { z } from 'zod';
import type { EnvironmentService } from '../services/environmentService.js';
import { AppError } from '../errors/errors.js';

/**
 * Input schema for list_environments tool
 * No parameters required - lists all environments
 */
export const ListEnvironmentsInputSchema = z.object({});

export type ListEnvironmentsInput = z.infer<typeof ListEnvironmentsInputSchema>;

/**
 * Tool definition for MCP server
 */
export const listEnvironmentsTool = {
  name: 'list_environments',
  description: `List all available Business Central environments from the Demo Portal.

Returns a JSON array of environments with:
- id: Unique environment identifier
- name: Human-readable environment name
- status: Current status (Running, Stopped, Draft, Starting, Stopping)
- bcVersion: Business Central version (e.g., "25.0", "24.3")

The results are sorted alphabetically by name for easy scanning.

Use Cases:
- Get an overview of all available environments
- Find environment IDs for other operations (start, stop, get details)
- Check which environments are currently running
- Verify environment existence before performing operations

Example Response:
{
  "type": "list_environments_result",
  "environments": [
    {
      "id": "env-abc123",
      "name": "Development BC25",
      "status": "Running",
      "bcVersion": "25.0"
    },
    {
      "id": "env-def456",
      "name": "Testing BC24",
      "status": "Stopped",
      "bcVersion": "24.3"
    }
  ],
  "count": 2,
  "fetchedAt": "2024-01-15T10:30:00Z",
  "elapsedMs": 245
}

Error Handling:
- AUTH_ERROR: Invalid or expired API token - verify DEMO_PORTAL_TOKEN
- RATE_LIMIT: Too many requests - wait and retry after specified seconds
- NETWORK_ERROR: Connection issues - check network and API availability

Performance:
- Typical response time: 200-500ms
- Returns all environments in a single request (no pagination needed)
- Results are cached at the API level for ~1 minute`,
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
} as const;

/**
 * Execute list_environments tool
 *
 * @param environmentService - Service for environment operations
 * @param input - Tool input (empty object)
 * @returns Environment list result or error
 */
export async function executeListEnvironments(
  environmentService: EnvironmentService,
  input: ListEnvironmentsInput
): Promise<unknown> {
  try {
    // Validate input (should always pass for empty object)
    ListEnvironmentsInputSchema.parse(input);

    // Execute service method
    const result = await environmentService.listEnvironments();

    return result;
  } catch (error) {
    // Handle app errors with structured response
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
      return 'Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token. Check token permissions and expiration.';
    case 'RATE_LIMIT':
      const retryAfter =
        error instanceof RateLimitError ? error.retryAfter : 60;
      return `API rate limit exceeded. Wait ${retryAfter} seconds before retrying. Consider reducing request frequency.`;
    case 'NETWORK_ERROR':
      return 'Check network connection and Demo Portal API availability. Verify baseUrl is correct in configuration.';
    default:
      return 'Review error details and try again. Contact support if issue persists.';
  }
}

// Import RateLimitError for type checking
import { RateLimitError } from '../errors/errors.js';
