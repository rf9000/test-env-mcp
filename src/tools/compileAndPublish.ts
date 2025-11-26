/**
 * MCP Tool: compile_and_publish
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Compile AL code and publish to Business Central environment.
 * Orchestrates: AL compilation → environment lookup → app publishing.
 */

import { z } from 'zod';
import type { CompilationService } from '@/services/compilationService.js';
import { AppError, ValidationError, CompileError, AuthError, ConflictError } from '@/errors/errors.js';

/**
 * Zod schema for compile_and_publish input validation
 */
export const CompileAndPublishInputSchema = z
  .object({
    workspacePath: z
      .string()
      .min(1, 'workspacePath is required')
      .describe('Absolute path to AL project workspace containing app.json'),
    environmentId: z
      .string()
      .min(1, 'environmentId is required')
      .describe('Environment ID to publish to (from list_environments)'),
    packageCachePath: z
      .string()
      .optional()
      .describe('Optional path to AL package cache directory (default: workspacePath/.alpackages)'),
    rulesetPath: z
      .string()
      .optional()
      .describe('Optional path to .ruleset.json file (default: workspacePath/.ruleset.json)'),
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

export type CompileAndPublishInput = z.infer<typeof CompileAndPublishInputSchema>;

/**
 * MCP Tool Definition for compile_and_publish
 */
export const compileAndPublishToolDefinition = {
  name: 'compile_and_publish',
  description: `Compile AL code and publish to Business Central environment.

**Purpose:**
Orchestrates the complete workflow for deploying AL apps:
1. Verify AL CLI tools installed (dotnet tool)
2. Compile AL project using 'al compile' command
3. Get environment details from Demo Portal
4. Publish .app file to BC Developer Endpoint

**When to Use:**
- Deploy new AL app to environment
- Update existing AL app after code changes
- Test app changes on specific environment
- Automated deployment workflows

**Prerequisites:**
- AL CLI tools installed: \`dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
- Valid AL project with app.json
- Environment must be Running (use start_environment first)
- NavUserPassword user exists for environment (created via Demo Portal)
- Windows OS (AL compilation requires Windows)

**Parameters:**
- workspacePath (required): Absolute path to AL project root (contains app.json)
- environmentId (required): Target environment ID from list_environments
- packageCachePath (optional): AL dependencies location (default: workspacePath/.alpackages)
- rulesetPath (optional): Code analysis rules (default: workspacePath/.ruleset.json)
- schemaUpdateMode (optional): How to update database schema
  - synchronize (default): Safe incremental update
  - recreate: Drop and recreate tables (data loss!)
  - forcesync: Force synchronization on conflicts

**Response Format:**
Returns structured JSON with:
- compile: Compilation results (success, app details, diagnostics, output)
- publish: Publishing results (success, status, schema mode, user)

**Examples:**

Example 1: Basic compile and publish
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123"
}
\`\`\`

Example 2: With custom package cache
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "packageCachePath": "C:/ALPackages"
}
\`\`\`

Example 3: Force schema sync (resolve conflicts)
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "schemaUpdateMode": "forcesync"
}
\`\`\`

Example 4: With custom ruleset
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "rulesetPath": "C:/Projects/MyALApp/custom.ruleset.json"
}
\`\`\`

**Response Example (Success):**
\`\`\`json
{
  "type": "compile_and_publish_result",
  "compile": {
    "success": true,
    "appPath": "C:/Projects/MyALApp/build/Publisher_MyApp_1.0.0.0.app",
    "appSize": 245760,
    "app": {
      "id": "12345678-1234-1234-1234-123456789012",
      "name": "MyApp",
      "publisher": "Publisher",
      "version": "1.0.0.0"
    },
    "diagnostics": [
      {
        "file": "HelloWorld.al",
        "line": 10,
        "column": 5,
        "severity": "warning",
        "code": "AL0432",
        "message": "Variable 'x' is declared but never used"
      }
    ],
    "compilerOutput": "..."
  },
  "publish": {
    "success": true,
    "status": "completed",
    "schemaUpdateMode": "synchronize",
    "user": "BCUser123"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**

- VALIDATION_ERROR: AL tools not installed → Install: \`dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
- COMPILE_ERROR: Compilation failed → Check diagnostics array for errors
- NOT_FOUND: Environment doesn't exist → Use list_environments
- NO_USERS: No BC users for environment → Create user via Demo Portal
- AUTH_ERROR: Publishing authentication failed → Verify user permissions
- CONFLICT_ERROR: Schema conflict (409) → Retry with schemaUpdateMode="forcesync"
- NETWORK_ERROR: Connection failed → Verify environment is Running, check network

**Performance Notes:**
- Compilation: 10-60 seconds depending on project size
- Publishing: 5-30 seconds depending on app size and network
- Total: Typically 15-90 seconds end-to-end
- Large projects (100+ objects): May take 2-3 minutes

**Best Practices:**
1. Ensure environment is Running before compile/publish
2. Start with schemaUpdateMode="synchronize" (safest)
3. Use "forcesync" only for development/test environments
4. Never use "recreate" on environments with data (causes data loss)
5. Check diagnostics even on successful compilation (warnings)
6. Verify .alpackages directory has all dependencies
7. Keep AL CLI tools updated: \`dotnet tool update -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
8. Windows OS required - use Windows container if on Linux/Mac

**Troubleshooting:**

Compilation Errors:
- "AL tools not installed" → Install dotnet tools
- "Could not determine AL CLI tools version" → Verify installation
- "app.json not found" → Check workspacePath is correct
- Dependency errors → Verify .alpackages has required symbols

Publishing Errors:
- "No users found" → Create NavUserPassword user via Portal
- "Invalid credentials" → User may lack permissions
- Schema conflicts → Use forcesync or recreate
- "Environment not found" → Verify environmentId
- Connection timeout → Ensure environment Running`,
  inputSchema: {
    type: 'object',
    properties: {
      workspacePath: {
        type: 'string',
        description: 'Absolute path to AL project workspace containing app.json'
      },
      environmentId: {
        type: 'string',
        description: 'Environment ID to publish to (from list_environments)'
      },
      packageCachePath: {
        type: 'string',
        description: 'Optional path to AL package cache directory (default: workspacePath/.alpackages)'
      },
      rulesetPath: {
        type: 'string',
        description: 'Optional path to .ruleset.json file (default: workspacePath/.ruleset.json)'
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
    required: ['workspacePath', 'environmentId']
  }
};

/**
 * Execute the compile_and_publish tool
 *
 * @param compilationService - Compilation service instance
 * @param input - Validated input from MCP client
 * @returns Compilation and publishing results or error response
 */
export async function executeCompileAndPublish(
  compilationService: CompilationService,
  input: unknown
): Promise<unknown> {
  try {
    // Debug: Log received input to stderr (visible in MCP server logs)
    console.error('[compile_and_publish] Received input type:', typeof input);
    console.error('[compile_and_publish] Received input:', JSON.stringify(input, null, 2));

    // Validate input
    const validated = CompileAndPublishInputSchema.parse(input);

    // Execute compile and publish
    const result = await compilationService.compileAndPublish({
      workspacePath: validated.workspacePath,
      environmentId: validated.environmentId,
      packageCachePath: validated.packageCachePath,
      rulesetPath: validated.rulesetPath,
      schemaUpdateMode: validated.schemaUpdateMode,
      dependencyPublishingOption: validated.dependencyPublishingOption
    });

    return result;
  } catch (error) {
    // Handle Zod validation errors with detailed debugging
    if (error instanceof z.ZodError) {
      const inputKeys = input && typeof input === 'object' ? Object.keys(input) : [];
      console.error('[compile_and_publish] Validation failed. Received keys:', inputKeys);
      console.error('[compile_and_publish] Validation errors:', JSON.stringify(error.errors, null, 2));

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
    if (error.message.includes('AL CLI tools not installed')) {
      return 'Install AL CLI tools: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools';
    }
    if (error.message.includes('Windows')) {
      return 'AL compilation requires Windows OS. Use a Windows machine or Windows container.';
    }
    return 'Check input parameters and project configuration. Verify app.json exists.';
  }

  if (error instanceof CompileError) {
    return (
      'Compilation failed. Check diagnostics for specific errors:\n' +
      '1. Review error messages in diagnostics array\n' +
      '2. Fix code errors in indicated files\n' +
      '3. Verify all dependencies in .alpackages\n' +
      '4. Check ruleset configuration if using custom rules'
    );
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
