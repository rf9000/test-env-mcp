/**
 * MCP Tool: diagnose_publish
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Diagnose publishing configuration and connectivity without actually publishing.
 * Useful for debugging publish failures.
 */

import { z } from 'zod';
import type { CompilationService } from '@/services/compilationService.js';
import { AppError } from '@/errors/errors.js';

/**
 * Zod schema for diagnose_publish input validation
 */
export const DiagnosePublishInputSchema = z
  .object({
    workspacePath: z
      .string()
      .min(1, 'workspacePath is required')
      .describe('Absolute path to AL project workspace containing app.json'),
    environmentId: z
      .string()
      .min(1, 'environmentId is required')
      .describe('Environment ID to diagnose publishing for (from list_environments)')
  })
  .strict();

export type DiagnosePublishInput = z.infer<typeof DiagnosePublishInputSchema>;

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
    // Debug: Log received input to stderr (visible in MCP server logs)
    console.error('[diagnose_publish] Received input type:', typeof input);
    console.error('[diagnose_publish] Received input:', JSON.stringify(input, null, 2));

    // Force a complete deep clone via JSON serialization to ensure Zod validation works
    // MCP SDK arguments may have unusual prototype/property/getter behavior
    const plainInput = JSON.parse(JSON.stringify(input));

    console.error('[diagnose_publish] Plain input type:', typeof plainInput);
    console.error('[diagnose_publish] Plain input keys:', plainInput && typeof plainInput === 'object' ? Object.keys(plainInput) : 'not an object');
    console.error('[diagnose_publish] Plain input environmentId:', plainInput?.environmentId);
    console.error('[diagnose_publish] Plain input workspacePath:', plainInput?.workspacePath);

    // Validate input
    const validated = DiagnosePublishInputSchema.parse(plainInput);

    // Execute diagnostics
    const result = await compilationService.diagnosePublish({
      workspacePath: validated.workspacePath,
      environmentId: validated.environmentId
    });

    return result;
  } catch (error) {
    // Handle Zod validation errors with detailed debugging
    if (error instanceof z.ZodError) {
      const inputKeys = input && typeof input === 'object' ? Object.keys(input) : [];
      console.error('[diagnose_publish] Validation failed. Received keys:', inputKeys);
      console.error('[diagnose_publish] Validation errors:', JSON.stringify(error.errors, null, 2));

      return {
        type: 'error',
        kind: 'validation_error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        retryable: false,
        details: {
          validationErrors: error.errors,
          receivedInputType: typeof input,
          receivedInputKeys: inputKeys.length > 0 ? inputKeys : 'not an object or empty',
          receivedInput: input
        },
        remediation: 'Check that all required parameters are provided. Required: workspacePath, environmentId. ' +
          'The tool received: ' + (inputKeys.length > 0 ? inputKeys.join(', ') : typeof input)
      };
    }

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
