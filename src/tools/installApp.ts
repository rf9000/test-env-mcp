/**
 * MCP Tool: install_app
 *
 * Install a pre-built app from the Demo Portal catalog to a Business Central environment.
 */

import { z } from 'zod';
import type { DemoPortalClient, CatalogApp } from '../api/demoPortalClient.js';
import { AppError, RateLimitError, NotFoundError, ValidationError } from '../errors/errors.js';

/**
 * Input schema for install_app tool
 */
export const InstallAppInputSchema = z
  .object({
    environmentId: z
      .string()
      .min(1, 'environmentId is required')
      .describe('Environment ID to install the app to'),
    appId: z
      .string()
      .optional()
      .describe('App ID from the catalog (use list_available_apps to find)'),
    appName: z
      .string()
      .optional()
      .describe('App name to search for (used if appId not provided)'),
    publisher: z
      .string()
      .optional()
      .describe('Publisher name to filter by (used with appName)')
  })
  .strict()
  .refine(
    data => data.appId || data.appName,
    { message: 'Either appId or appName must be provided' }
  );

export type InstallAppInput = z.infer<typeof InstallAppInputSchema>;

/**
 * Tool definition for MCP server
 */
export const installAppTool = {
  name: 'install_app',
  description: `Install a pre-built app from the Demo Portal catalog to an environment.

**Purpose:**
Install apps from the Demo Portal catalog to your Business Central environment.
You can specify the app by ID (exact match) or by name (search).

**When to Use:**
- Install a specific app by ID from list_available_apps results
- Search and install an app by name
- Add Continia extensions to your environment
- Set up test environments with required apps

**Parameters:**
- environmentId (required): Target environment ID
- appId (optional): Exact app ID from the catalog
- appName (optional): App name to search for (if appId not provided)
- publisher (optional): Publisher filter (used with appName)

**Note:** Either appId or appName must be provided.

**Response Format:**
\`\`\`json
{
  "type": "install_app_result",
  "success": true,
  "app": {
    "id": "app-123",
    "name": "Continia Document Capture",
    "publisher": "Continia Software",
    "version": "14.0.0.0"
  },
  "environmentId": "env-abc123",
  "installedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**
- NOT_FOUND: Environment or app doesn't exist
- VALIDATION_ERROR: Neither appId nor appName provided, or multiple matches found
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues

**Usage Flow:**
1. Use list_available_apps to find the app you want to install
2. Call install_app with either:
   - appId: Install exact app by ID
   - appName: Search and install by name (must be unique match)
3. Check the response for success status

**Examples:**

Install by ID:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appId": "app-456"
}
\`\`\`

Install by name:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appName": "Document Capture"
}
\`\`\`

Install by name and publisher:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appName": "Document Capture",
  "publisher": "Continia"
}
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      environmentId: {
        type: 'string',
        description: 'Environment ID to install the app to'
      },
      appId: {
        type: 'string',
        description: 'App ID from the catalog (use list_available_apps to find)'
      },
      appName: {
        type: 'string',
        description: 'App name to search for (used if appId not provided)'
      },
      publisher: {
        type: 'string',
        description: 'Publisher name to filter by (used with appName)'
      }
    },
    required: ['environmentId']
  }
} as const;

/**
 * Result type for install_app
 */
interface InstallAppResult {
  type: 'install_app_result';
  success: boolean;
  app: {
    id: string;
    name: string;
    publisher: string;
    version: string;
    appId: string;
  };
  environmentId: string;
  installedAt: string;
}

/**
 * Execute install_app tool
 *
 * @param demoPortalClient - Demo Portal API client
 * @param input - Tool input with environmentId and app selection criteria
 * @returns Installation result or error
 */
export async function executeInstallApp(
  demoPortalClient: DemoPortalClient,
  input: unknown
): Promise<InstallAppResult | { type: 'error'; kind: string; message: string; retryable: boolean; details?: unknown; remediation: string }> {
  try {
    // Validate input
    const validated = InstallAppInputSchema.parse(input);

    // Get environment to determine BC version and target
    const environment = await demoPortalClient.getEnvironmentRaw(validated.environmentId) as {
      bcVersion?: string;
      platform?: string;
    };

    const bcVersion = environment.bcVersion ?? '24.0';
    const target = environment.platform === 'onprem' ? 'onprem' : 'cloud';

    // Fetch available apps to find the one to install
    const availableApps = await demoPortalClient.getAvailableApps(bcVersion, target);

    // Find the app to install
    let appToInstall: CatalogApp | undefined;

    if (validated.appId) {
      // Find by exact ID
      appToInstall = availableApps.find(app => app.id === validated.appId);
      if (!appToInstall) {
        throw new NotFoundError(
          `App with ID '${validated.appId}' not found in catalog for BC ${bcVersion} (${target})`,
          { appId: validated.appId, bcVersion, target }
        );
      }
    } else if (validated.appName) {
      // Search by name (case-insensitive)
      const nameLower = validated.appName.toLowerCase();
      let matches = availableApps.filter(app =>
        app.name.toLowerCase().includes(nameLower)
      );

      // Filter by publisher if provided
      if (validated.publisher && matches.length > 1) {
        const publisherLower = validated.publisher.toLowerCase();
        matches = matches.filter(app =>
          app.publisher.toLowerCase().includes(publisherLower)
        );
      }

      if (matches.length === 0) {
        throw new NotFoundError(
          `No app found matching name '${validated.appName}'${validated.publisher ? ` from publisher '${validated.publisher}'` : ''} in catalog for BC ${bcVersion} (${target})`,
          { appName: validated.appName, publisher: validated.publisher, bcVersion, target }
        );
      }

      if (matches.length > 1) {
        throw new ValidationError(
          `Multiple apps found matching '${validated.appName}'. Please specify appId or add publisher filter. Found: ${matches.map(a => `${a.name} (${a.publisher})`).join(', ')}`,
          { matches: matches.map(a => ({ id: a.id, name: a.name, publisher: a.publisher })) }
        );
      }

      appToInstall = matches[0];
    }

    if (!appToInstall) {
      throw new ValidationError(
        'Either appId or appName must be provided',
        { input: validated }
      );
    }

    // Install the app
    const success = await demoPortalClient.installApps(validated.environmentId, [appToInstall]);

    if (!success) {
      throw new Error(`Failed to install app '${appToInstall.name}' to environment`);
    }

    // Return success result
    const result: InstallAppResult = {
      type: 'install_app_result',
      success: true,
      app: {
        id: appToInstall.id,
        name: appToInstall.name,
        publisher: appToInstall.publisher,
        version: appToInstall.version,
        appId: appToInstall.appId
      },
      environmentId: validated.environmentId,
      installedAt: new Date().toISOString()
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
      if (error.message.includes('App')) {
        return 'Use list_available_apps to see available apps for your environment.';
      }
      return 'Environment not found. Use list_environments to see available environments.';
    case 'VALIDATION_ERROR':
      if (error.message.includes('Multiple apps')) {
        return 'Multiple apps matched your search. Use appId for exact match or add publisher filter.';
      }
      return 'Provide either appId (exact) or appName (search) to identify the app.';
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
