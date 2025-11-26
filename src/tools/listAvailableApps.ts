/**
 * MCP Tool: list_available_apps
 *
 * List available apps from the Demo Portal catalog that can be installed
 * on a Business Central environment.
 */

import { z } from 'zod';
import type { DemoPortalClient } from '../api/demoPortalClient.js';
import { AppError, RateLimitError } from '../errors/errors.js';

/**
 * Input schema for list_available_apps tool
 */
export const ListAvailableAppsInputSchema = z
  .object({
    environmentId: z
      .string()
      .min(1, 'environmentId is required')
      .describe('Environment ID to determine BC version and target platform'),
    nameFilter: z
      .string()
      .optional()
      .describe('Optional filter to search apps by name (case-insensitive)')
  })
  .strict();

export type ListAvailableAppsInput = z.infer<typeof ListAvailableAppsInputSchema>;

/**
 * Tool definition for MCP server
 */
export const listAvailableAppsTool = {
  name: 'list_available_apps',
  description: `List available apps from the Demo Portal catalog that can be installed on an environment.

**Purpose:**
Browse the Demo Portal app catalog to find pre-built apps compatible with your environment.
The app list is filtered by the environment's Business Central version and target platform.

**When to Use:**
- Discover available apps before installation
- Search for specific apps by name
- Check app versions available for your BC version
- Find app IDs needed for the install_app tool

**Parameters:**
- environmentId (required): Environment ID to determine BC version and platform
- nameFilter (optional): Search filter for app names (case-insensitive)

**Response Format:**
Returns a JSON object with:
- apps: Array of available apps with id, name, publisher, version, appId
- count: Number of apps found
- bcVersion: The BC version used for filtering
- target: The target platform (cloud/onprem)
- fetchedAt: Timestamp of the response

**Example Response:**
\`\`\`json
{
  "type": "list_available_apps_result",
  "apps": [
    {
      "id": "app-123",
      "name": "Continia Document Capture",
      "publisher": "Continia Software",
      "version": "14.0.0.0",
      "appId": "12345678-1234-1234-1234-123456789012",
      "bcVersion": "24.0",
      "target": "cloud"
    }
  ],
  "count": 1,
  "bcVersion": "24.0",
  "target": "cloud",
  "fetchedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**
- NOT_FOUND: Environment doesn't exist - use list_environments to find valid IDs
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues

**Usage Flow:**
1. Use list_environments to find your environment ID
2. Call list_available_apps with the environment ID
3. Optionally filter by name to find specific apps
4. Use the app ID with install_app to install`,
  inputSchema: {
    type: 'object',
    properties: {
      environmentId: {
        type: 'string',
        description: 'Environment ID to determine BC version and target platform'
      },
      nameFilter: {
        type: 'string',
        description: 'Optional filter to search apps by name (case-insensitive)'
      }
    },
    required: ['environmentId']
  }
} as const;

/**
 * Result type for list_available_apps
 */
interface ListAvailableAppsResult {
  type: 'list_available_apps_result';
  apps: Array<{
    id: string;
    name: string;
    publisher: string;
    version: string;
    appId: string;
    bcVersion: string;
    target: string;
  }>;
  count: number;
  bcVersion: string;
  target: string;
  fetchedAt: string;
}

/**
 * Execute list_available_apps tool
 *
 * @param demoPortalClient - Demo Portal API client
 * @param input - Tool input with environmentId and optional nameFilter
 * @returns List of available apps or error
 */
export async function executeListAvailableApps(
  demoPortalClient: DemoPortalClient,
  input: unknown
): Promise<ListAvailableAppsResult | { type: 'error'; kind: string; message: string; retryable: boolean; details?: unknown; remediation: string }> {
  try {
    // Validate input
    const validated = ListAvailableAppsInputSchema.parse(input);

    // Get environment to determine BC version and target
    const environment = await demoPortalClient.getEnvironmentRaw(validated.environmentId) as {
      bcVersion?: string;
      platform?: string;
      profileId?: string;
    };

    // Extract BC version (handle different possible field names)
    const bcVersion = environment.bcVersion ?? '24.0';

    // Determine target platform (default to cloud for sandbox environments)
    const target = environment.platform === 'onprem' ? 'onprem' : 'cloud';

    // Fetch available apps
    let apps = await demoPortalClient.getAvailableApps(bcVersion, target);

    // Apply name filter if provided
    if (validated.nameFilter) {
      const filterLower = validated.nameFilter.toLowerCase();
      apps = apps.filter(app =>
        app.name.toLowerCase().includes(filterLower) ||
        app.publisher.toLowerCase().includes(filterLower)
      );
    }

    // Transform to result format
    const result: ListAvailableAppsResult = {
      type: 'list_available_apps_result',
      apps: apps.map(app => ({
        id: app.id,
        name: app.name,
        publisher: app.publisher,
        version: app.version,
        appId: app.appId,
        bcVersion: app.bcVersion,
        target: app.target
      })),
      count: apps.length,
      bcVersion,
      target,
      fetchedAt: new Date().toISOString()
    };

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
    case 'NOT_FOUND':
      return 'Environment not found. Use list_environments to see available environments.';
    case 'AUTH_ERROR':
      return 'Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.';
    case 'RATE_LIMIT': {
      const retryAfter = error instanceof RateLimitError ? error.retryAfter : 60;
      return `API rate limit exceeded. Wait ${retryAfter} seconds before retrying.`;
    }
    case 'NETWORK_ERROR':
      return 'Check network connection and Demo Portal API availability.';
    default:
      return 'Review error details and try again.';
  }
}
