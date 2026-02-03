/**
 * MCP Tool: publish_app
 *
 * Publish an existing .app file to Business Central environment without compilation.
 * Useful for apps already compiled by VS Code, CI/CD pipelines, or other tools.
 */

import { z } from 'zod';
import type { CompilationService } from '@/services/compilationService.js';
import { AppError, ValidationError, AuthError, ConflictError } from '@/errors/errors.js';

/**
 * Zod schema for publish_app input validation
 */
export const PublishAppInputSchema = z
  .object({
    appPath: z
      .string()
      .min(1, 'appPath is required')
      .describe('Absolute path to the .app file to publish'),
    environmentId: z
      .string()
      .min(1, 'environmentId is required')
      .describe('Environment ID to publish to (from list_environments)'),
    schemaUpdateMode: z
      .enum(['synchronize', 'recreate', 'forcesync'])
      .optional()
      .default('synchronize')
      .describe(
        'Schema update mode: synchronize (default) = safe update, recreate = drop+recreate tables, forcesync = force synchronization'
      ),
    dependencyPublishingOption: z
      .enum(['default', 'strict', 'ignore'])
      .optional()
      .describe(
        'Dependency publishing option: default = standard handling, strict = enforce all dependencies, ignore = skip missing dependencies'
      )
  })
  .strict();

export type PublishAppInput = z.infer<typeof PublishAppInputSchema>;

/**
 * MCP Tool Definition for publish_app
 */
export const publishAppToolDefinition = {
  name: 'publish_app',
  description: `Publish an existing .app file to Business Central environment without compilation.

**Purpose:**
Publish pre-compiled .app files directly to BC environments. Useful when:
- Apps are compiled by VS Code or other editors
- Apps are built by CI/CD pipelines
- Apps are located in project root (not build/ folder)
- Re-publishing an existing app without recompilation

**When to Use:**
- You have an existing .app file ready to deploy
- App was compiled externally (VS Code, CI/CD, etc.)
- App file is in project root or non-standard location
- You want to skip compilation and publish directly

**Use compile_and_publish Instead When:**
- You need to compile source code first
- You want the full compile + publish workflow

**Prerequisites:**
- Valid .app file exists at the specified path
- Environment must be Running (use start_environment first)
- NavUserPassword user exists for environment (created via Demo Portal)

**Parameters:**
- appPath (required): Absolute path to the .app file
- environmentId (required): Target environment ID from list_environments
- schemaUpdateMode (optional): How to update database schema
  - synchronize (default): Safe incremental update
  - recreate: Drop and recreate tables (data loss!)
  - forcesync: Force synchronization on conflicts
- dependencyPublishingOption (optional): How to handle dependencies
  - default: Standard dependency handling
  - strict: Enforce all dependencies exist
  - ignore: Skip missing dependencies

**Response Format:**
Returns structured JSON with:
- publish: Publishing results (success, status, schema mode, user)
- app: App file details (path, fileName, size)

**Examples:**

Example 1: Publish app from project root
\`\`\`json
{
  "appPath": "C:/Projects/MyApp/Publisher_MyApp_1.0.0.0.app",
  "environmentId": "abc-123"
}
\`\`\`

Example 2: Force schema sync
\`\`\`json
{
  "appPath": "C:/Projects/MyApp/Publisher_MyApp_1.0.0.0.app",
  "environmentId": "abc-123",
  "schemaUpdateMode": "forcesync"
}
\`\`\`

Example 3: Ignore missing dependencies
\`\`\`json
{
  "appPath": "C:/Projects/MyApp/Publisher_MyApp_1.0.0.0.app",
  "environmentId": "abc-123",
  "dependencyPublishingOption": "ignore"
}
\`\`\`

**Response Example (Success):**
\`\`\`json
{
  "type": "publish_result",
  "publish": {
    "success": true,
    "status": "completed",
    "schemaUpdateMode": "synchronize",
    "user": "BCUser123",
    "url": "https://..."
  },
  "app": {
    "path": "C:/Projects/MyApp/Publisher_MyApp_1.0.0.0.app",
    "fileName": "Publisher_MyApp_1.0.0.0.app",
    "size": 245760
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**

- VALIDATION_ERROR: File not found, invalid path, or not a .app file
- NOT_FOUND: Environment doesn't exist -> Use list_environments
- NO_USERS: No BC users for environment -> Create user via Demo Portal
- AUTH_ERROR: Publishing authentication failed -> Verify user permissions
- CONFLICT_ERROR: Schema conflict (409) -> Retry with schemaUpdateMode="forcesync"
- NETWORK_ERROR: Connection failed -> Verify environment is Running`,
  inputSchema: {
    type: 'object',
    properties: {
      appPath: {
        type: 'string',
        description: 'Absolute path to the .app file to publish'
      },
      environmentId: {
        type: 'string',
        description: 'Environment ID to publish to (from list_environments)'
      },
      schemaUpdateMode: {
        type: 'string',
        enum: ['synchronize', 'recreate', 'forcesync'],
        description:
          'Schema update mode: synchronize (default) = safe update, recreate = drop+recreate tables, forcesync = force synchronization'
      },
      dependencyPublishingOption: {
        type: 'string',
        enum: ['default', 'strict', 'ignore'],
        description:
          'Dependency publishing option: default = standard handling, strict = enforce all dependencies, ignore = skip missing dependencies'
      }
    },
    required: ['appPath', 'environmentId']
  }
};

/**
 * Execute the publish_app tool
 *
 * @param compilationService - Compilation service instance
 * @param input - Validated input from MCP client
 * @returns Publishing result or error response
 */
export async function executePublishApp(
  compilationService: CompilationService,
  input: unknown
): Promise<unknown> {
  try {
    // Debug: Log received input to stderr (visible in MCP server logs)
    console.error('[publish_app] Received input type:', typeof input);
    console.error('[publish_app] Received input:', JSON.stringify(input, null, 2));

    // Validate input
    const validated = PublishAppInputSchema.parse(input);

    // Execute publish
    const result = await compilationService.publishApp({
      appPath: validated.appPath,
      environmentId: validated.environmentId,
      schemaUpdateMode: validated.schemaUpdateMode,
      dependencyPublishingOption: validated.dependencyPublishingOption
    });

    return result;
  } catch (error) {
    // Handle Zod validation errors with detailed debugging
    if (error instanceof z.ZodError) {
      const inputKeys = input && typeof input === 'object' ? Object.keys(input) : [];
      console.error('[publish_app] Validation failed. Received keys:', inputKeys);
      console.error('[publish_app] Validation errors:', JSON.stringify(error.errors, null, 2));

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
        remediation: 'Check that all required parameters are provided. Required: appPath, environmentId. ' +
          'The tool received: ' + (inputKeys.length > 0 ? inputKeys.join(', ') : typeof input)
      };
    }

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
 *
 * @param error - Application error
 * @returns Actionable remediation steps
 */
function getRemediation(error: AppError): string {
  if (error instanceof ValidationError) {
    if (error.message.includes('not found')) {
      return 'Verify the app file path is correct and the file exists. Use an absolute path.';
    }
    if (error.message.includes('.app extension')) {
      return 'The file must have a .app extension. Verify you are pointing to the compiled app file.';
    }
    if (error.message.includes('not a file')) {
      return 'The path points to a directory, not a file. Provide the full path to the .app file.';
    }
    return 'Check input parameters. Verify the app file exists and is accessible.';
  }

  if (error instanceof AuthError) {
    if (error.details?.code === 'NO_USERS') {
      return 'Create a NavUserPassword user for this environment via Demo Portal web interface.';
    }
    return 'Verify BC user exists and has permissions. Check environment authentication settings.';
  }

  if (error instanceof ConflictError) {
    return (
      'Schema conflict detected. Options:\n' +
      '1. Use schemaUpdateMode="forcesync" to force synchronization\n' +
      '2. Use schemaUpdateMode="recreate" for clean slate (CAUTION: Data loss!)\n' +
      '3. Manually resolve schema conflicts in BC client'
    );
  }

  switch (error.code) {
    case 'NOT_FOUND':
      return 'Environment not found. Use list_environments to see available environments.';

    case 'RATE_LIMIT':
      return `Wait ${(error as { retryAfter?: number }).retryAfter ?? 60} seconds before retrying.`;

    case 'NETWORK_ERROR':
      return (
        'Check network connection and environment status:\n' +
        '1. Verify environment is Running (use get_environment)\n' +
        '2. Check network connectivity\n' +
        '3. Verify environment URL is accessible'
      );

    default:
      return 'Check error details and try again. Consult BC documentation for specific error codes.';
  }
}
