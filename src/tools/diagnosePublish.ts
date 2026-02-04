/**
 * MCP Tool: diagnose_publish
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Diagnose publishing configuration and connectivity without actually publishing.
 * Useful for debugging publish failures.
 */

import type { CompilationService } from '@/services/compilationService.js';
import { AppError, ValidationError } from '@/errors/errors.js';

/**
 * Input type for diagnose_publish
 */
export interface DiagnosePublishInput {
  workspacePath: string;
  environmentId: string;
}

/**
 * MCP Tool Definition for diagnose_publish
 */
export const diagnosePublishToolDefinition = {
  name: 'diagnose_publish',
  description: `Diagnose publishing configuration and connectivity without actually publishing.

**Purpose:**
Debug publishing failures by showing:
- Constructed Developer Endpoint URL
- Credentials (password redacted)
- Connectivity test results
- Environment configuration
- PowerShell script location

**When to Use:**
- Publishing fails with unclear errors
- Verifying URL construction is correct
- Testing connectivity to Developer Endpoint
- Debugging authentication issues
- Before first publish to new environment

**Parameters:**
- workspacePath (required): Absolute path to AL project root (contains app.json)
- environmentId (required): Target environment ID from list_environments

**Response Format:**
Returns structured JSON with:
- environment: ID, URL, authentication method
- credentials: username and redacted password
- url: Constructed URL, tenant, schema mode
- connectivity: Whether endpoint is reachable
- powershellScript: Script path and existence check

**Example:**
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "d590df57-680e-43c0-9af0-3f97706d4663"
}
\`\`\`

**Response Example:**
\`\`\`json
{
  "type": "publish_diagnostics",
  "environment": {
    "id": "d590df57-680e-43c0-9af0-3f97706d4663",
    "url": "https://bcserver/BC/",
    "authMethod": "NavUserPassword"
  },
  "credentials": {
    "username": "BCUser123",
    "passwordRedacted": "Pa**********rd"
  },
  "url": {
    "constructed": "https://bcserver/d590df57-680e-43c0-9af0-3f97706d4663/dev/apps?tenant=default&SchemaUpdateMode=synchronize",
    "tenant": "default",
    "schemaUpdateMode": "synchronize"
  },
  "connectivity": {
    "reachable": true,
    "statusCode": 200
  },
  "powershellScript": {
    "path": "C:/path/to/scripts/Publish-BCApp.ps1",
    "exists": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Troubleshooting:**

If connectivity.reachable is false:
- Check environment URL is correct
- Verify environment is Running
- Check network connectivity

If credentials show wrong username:
- Verify NavUserPassword user exists
- Check user permissions in BC

If URL looks wrong:
- Compare with expected pattern: {scheme}://{host}/{environmentId}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}
- Verify environmentId is correct`,
  inputSchema: {
    type: 'object',
    properties: {
      workspacePath: {
        type: 'string',
        description: 'Absolute path to AL project workspace containing app.json'
      },
      environmentId: {
        type: 'string',
        description: 'Environment ID to diagnose publishing for (from list_environments)'
      }
    },
    required: ['workspacePath', 'environmentId']
  }
};

/**
 * Execute the diagnose_publish tool
 *
 * @param compilationService - Compilation service instance
 * @param input - Validated input from MCP client
 * @returns Diagnostic information or error response
 */
export async function executeDiagnosePublish(
  compilationService: CompilationService,
  input: unknown
): Promise<unknown> {
  try {
    // Extract and validate input
    const inputObj = input as Record<string, unknown>;
    const workspacePath = inputObj?.workspacePath;
    const environmentId = inputObj?.environmentId;

    // Validate required fields
    if (typeof workspacePath !== 'string' || workspacePath.length === 0) {
      throw new ValidationError('workspacePath is required and must be a non-empty string');
    }
    if (typeof environmentId !== 'string' || environmentId.length === 0) {
      throw new ValidationError('environmentId is required and must be a non-empty string');
    }

    // Execute diagnostics
    const result = await compilationService.diagnosePublish({
      workspacePath,
      environmentId
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return {
        type: 'error',
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}
