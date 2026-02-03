/**
 * Continia Environment MCP Server
 *
 * Model Context Protocol server for managing Business Central environments
 * and executing automated tests through the Continia Demo Portal API.
 *
 * Features:
 * - List, get, start, and stop Business Central environments
 * - Execute automated AL tests with optional code coverage
 * - Compile and publish AL apps to Business Central
 * - Real-time environment status monitoring
 * - Idempotent operations with proper error handling
 * - Secret redaction for security
 *
 * Configuration:
 * - DEMO_PORTAL_TOKEN: Required API token for Demo Portal access
 * - DEMO_PORTAL_BASE_URL: Optional API base URL (defaults to production)
 * - LOG_LEVEL: Optional logging level (debug, info, warn, error)
 *
 * Usage:
 * - Designed to run as an MCP server via stdio transport
 * - Connect via MCP clients (Claude Desktop, etc.)
 * - Configure in claude_desktop_config.json
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Import configuration and services
import { ConfigurationService } from './services/configurationService.js';
import { createClientFromConfig } from './api/httpClient.js';
import { DemoPortalClient } from './api/demoPortalClient.js';
import { DeveloperEndpointClient } from './api/developerEndpointClient.js';
import { EnvironmentService } from './services/environmentService.js';
import { TestRunnerService } from './services/testRunnerService.js';
import { CredentialsService } from './services/credentialsService.js';
import { CompilationService } from './services/compilationService.js';
import { TestRunnerInfrastructureService } from './services/testRunnerInfrastructureService.js';

// Import tools
import {
  listEnvironmentsTool,
  executeListEnvironments
} from './tools/listEnvironments.js';
import {
  getEnvironmentTool,
  executeGetEnvironment
} from './tools/getEnvironment.js';
import {
  startEnvironmentTool,
  executeStartEnvironment
} from './tools/startEnvironment.js';
import {
  stopEnvironmentTool,
  executeStopEnvironment
} from './tools/stopEnvironment.js';
import {
  runTestsToolDefinition,
  executeRunTests
} from './tools/runTests.js';
import {
  compileAndPublishToolDefinition,
  executeCompileAndPublish
} from './tools/compileAndPublish.js';
import {
  diagnosePublishToolDefinition,
  executeDiagnosePublish
} from './tools/diagnosePublish.js';
import { DiagnoseTestsTool } from './tools/diagnoseTests.js';
import { CheckTestAppStatusTool } from './tools/checkTestAppStatus.js';
import {
  listTestsToolDefinition,
  executeListTests
} from './tools/listTests.js';
import {
  listAvailableAppsTool,
  executeListAvailableApps
} from './tools/listAvailableApps.js';
import {
  installAppTool,
  executeInstallApp
} from './tools/installApp.js';
import { TestRegistry } from './testRegistry.js';
import { Logger } from './logger.js';

/**
 * Main server initialization and setup
 */
async function main(): Promise<void> {
  // Check for diagnostic/test mode
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.error('Continia Environment MCP Server');
    console.error('');
    console.error('Usage:');
    console.error('  node dist/index.js          Start MCP server (normal mode)');
    console.error('  node dist/index.js --test   Run diagnostic test');
    console.error('  node dist/index.js --version Show version');
    console.error('  node dist/index.js --help    Show this help message');
    console.error('');
    console.error('Environment Variables:');
    console.error('  DEMO_PORTAL_TOKEN     Required: API token for Demo Portal');
    console.error('  DEMO_PORTAL_BASE_URL  Optional: Override API endpoint');
    console.error('  LOG_LEVEL             Optional: debug, info, warn, error');
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    // Try to read version from package.json
    try {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
      console.error(`Continia Environment MCP Server v${packageJson.version}`);
    } catch {
      console.error('Continia Environment MCP Server v0.1.0');
    }
    process.exit(0);
  }

  if (args.includes('--test') || args.includes('-t')) {
    console.error('========================================');
    console.error('Continia MCP Server - Diagnostic Test');
    console.error('========================================');
    console.error('');
    console.error('System Information:');
    console.error('  Node Version:', process.version);
    console.error('  Platform:', process.platform);
    console.error('  Working Dir:', process.cwd());
    console.error('');

    console.error('Configuration Check:');
    try {
      const config = ConfigurationService.getInstance();
      console.error('  ✓ Configuration loaded successfully');
      console.error('  API URL:', config.getApiUrl());
      console.error('  Token Present:', config.hasValidToken() ? 'Yes' : 'No');

      if (!config.hasValidToken()) {
        console.error('');
        console.error('  ⚠ Warning: DEMO_PORTAL_TOKEN not configured');
        console.error('  Set it in your Claude Desktop config or environment');
      }
    } catch (error) {
      console.error('  ✗ Configuration failed:', error instanceof Error ? error.message : error);
    }

    console.error('');
    console.error('Dependencies Check:');

    // Check for critical dependencies
    const deps = [
      { name: '@modelcontextprotocol/sdk/server/index.js', display: 'MCP SDK' },
      { name: 'axios', display: 'Axios' },
      { name: 'zod', display: 'Zod' },
      { name: 'fast-xml-parser', display: 'XML Parser' },
      { name: 'csv-parse', display: 'CSV Parser' }
    ];

    for (const dep of deps) {
      try {
        await import(dep.name);
        console.error(`  ✓ ${dep.display} installed`);
      } catch (err) {
        console.error(`  ✗ ${dep.display} not found`);
      }
    }

    console.error('');
    console.error('========================================');
    console.error('Diagnostic test complete');
    console.error('========================================');
    process.exit(0);
  }

  try {
    // Initialize configuration (validates env vars and loads config file)
    const config = ConfigurationService.getInstance();

    // Create HTTP client with configuration
    const httpClient = createClientFromConfig(config);

    // Initialize API clients
    const demoPortalClient = new DemoPortalClient(httpClient);

    // Initialize test registry for local test discovery
    const logger = new Logger('Main');
    const testRegistry = new TestRegistry(logger);

    // Initialize services
    const environmentService = new EnvironmentService(demoPortalClient);
    const credentialsService = new CredentialsService(demoPortalClient, config);
    const devEndpointClient = new DeveloperEndpointClient(credentialsService);
    const compilationService = new CompilationService(
      demoPortalClient,
      devEndpointClient,
      credentialsService,
      config
    );

    // Initialize Test Runner infrastructure service
    const testRunnerInfrastructureService = new TestRunnerInfrastructureService(
      demoPortalClient,
      devEndpointClient,
      credentialsService,
      config
    );

    // Initialize Test Runner service with infrastructure support
    const testRunnerService = new TestRunnerService(
      demoPortalClient,
      config,
      testRegistry,
      testRunnerInfrastructureService
    );

    const diagnoseTestsTool = new DiagnoseTestsTool(testRunnerService, testRegistry);
    const checkTestAppStatusTool = new CheckTestAppStatusTool(demoPortalClient);

    // Create diagnostic tool definition
    const diagnoseTestsToolDefinition = {
      name: 'diagnose_tests',
      description: 'Diagnose why tests are not running or returning 0 results. Runs tests with and without filters to identify issues. Can compare source tests with environment tests.',
      inputSchema: {
        type: 'object',
        properties: {
          environmentId: {
            type: 'string',
            description: 'The ID of the environment to diagnose'
          },
          codeunitId: {
            type: 'number',
            description: 'Optional codeunit ID to test filtering'
          },
          workspacePath: {
            type: 'string',
            description: 'Optional workspace path for source file comparison'
          },
          verbose: {
            type: 'boolean',
            description: 'Include detailed API logs',
            default: true
          }
        },
        required: ['environmentId']
      }
    };

    // Create check test app status tool definition
    const checkTestAppStatusToolDefinition = {
      name: checkTestAppStatusTool.name,
      description: checkTestAppStatusTool.description,
      inputSchema: checkTestAppStatusTool.schema
    };

    // Create MCP server
    const server = new Server(
      {
        name: 'continia-environment-mcp',
        version: '0.1.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    /**
     * Handler for listing available tools
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          listEnvironmentsTool,
          getEnvironmentTool,
          startEnvironmentTool,
          stopEnvironmentTool,
          runTestsToolDefinition,
          compileAndPublishToolDefinition,
          diagnosePublishToolDefinition,
          diagnoseTestsToolDefinition,
          checkTestAppStatusToolDefinition,
          listTestsToolDefinition,
          listAvailableAppsTool,
          installAppTool
        ]
      };
    });

    /**
     * Handler for tool execution
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Route to appropriate tool handler
        // Note: args comes from MCP as Record<string, unknown>
        // Each tool function will validate using Zod schemas
        let result: unknown;

        switch (name) {
          case 'list_environments':
            result = await executeListEnvironments(
              environmentService,
              (args || {}) as never
            );
            break;

          case 'get_environment':
            result = await executeGetEnvironment(
              environmentService,
              (args || {}) as never
            );
            break;

          case 'start_environment':
            result = await executeStartEnvironment(
              environmentService,
              (args || {}) as never
            );
            break;

          case 'stop_environment':
            result = await executeStopEnvironment(
              environmentService,
              (args || {}) as never
            );
            break;

          case 'run_tests':
            result = await executeRunTests(
              testRunnerService,
              (args || {}) as never
            );
            break;

          case 'compile_and_publish':
            result = await executeCompileAndPublish(
              compilationService,
              (args || {}) as never
            );
            break;

          case 'diagnose_publish':
            result = await executeDiagnosePublish(
              compilationService,
              (args || {}) as never
            );
            break;

          case 'diagnose_tests':
            result = await diagnoseTestsTool.execute(args || {});
            break;

          case 'check_test_app_status':
            result = await checkTestAppStatusTool.execute((args || {}) as never);
            break;

          case 'list_tests':
            result = await executeListTests(
              testRegistry,
              (args || {}) as never
            );
            break;

          case 'list_available_apps':
            result = await executeListAvailableApps(
              demoPortalClient,
              (args || {}) as never
            );
            break;

          case 'install_app':
            result = await executeInstallApp(
              demoPortalClient,
              (args || {}) as never
            );
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Return result wrapped in content array
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        // Handle unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  type: 'error',
                  kind: 'internal_error',
                  message: errorMessage,
                  retryable: false
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    });

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    // Log startup message to stderr (stdout is used for MCP protocol)
    console.error('========================================');
    console.error('Continia Environment MCP Server started successfully');
    console.error('========================================');
    console.error(`API URL: ${config.getApiUrl()}`);
    console.error(`Token Status: ${config.hasValidToken() ? '✓ Configured' : '⚠ Not configured (tools will fail)'}`);
    console.error('Ready to accept connections via stdio');
    console.error('========================================');
  } catch (error) {
    // Log initialization errors to stderr with detailed information
    console.error('========================================');
    console.error('Failed to start Continia Environment MCP Server');
    console.error('========================================');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Node Version:', process.version);
    console.error('Platform:', process.platform);
    console.error('Working Directory:', process.cwd());
    console.error('');

    // Log error details
    if (error instanceof Error) {
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      if (error.stack) {
        console.error('Stack Trace:');
        console.error(error.stack);
      }

      // Check for specific error types
      if (error.name === 'ValidationError') {
        console.error('');
        console.error('Configuration Issue Detected!');
        console.error('Please check your Claude Desktop configuration.');
      }
    } else {
      console.error('Error (non-Error object):', JSON.stringify(error, null, 2));
    }

    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Ensure DEMO_PORTAL_TOKEN is set in your Claude Desktop config');
    console.error('2. Check that all dependencies are installed');
    console.error('3. Verify Node.js version is 18 or higher');
    console.error('========================================');

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('========================================');
  console.error('Unhandled error in main():');
  console.error('========================================');

  if (error instanceof Error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error('Error:', error);
  }

  console.error('========================================');
  process.exit(1);
});
