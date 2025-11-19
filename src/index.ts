#!/usr/bin/env node

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

/**
 * Main server initialization and setup
 */
async function main(): Promise<void> {
  try {
    // Initialize configuration (validates env vars and loads config file)
    const config = ConfigurationService.getInstance();

    // Create HTTP client with configuration
    const httpClient = createClientFromConfig(config);

    // Initialize API clients
    const demoPortalClient = new DemoPortalClient(httpClient);

    // Initialize services
    const environmentService = new EnvironmentService(demoPortalClient);
    const testRunnerService = new TestRunnerService(demoPortalClient, config);
    const credentialsService = new CredentialsService(demoPortalClient, config);
    const devEndpointClient = new DeveloperEndpointClient(credentialsService);
    const compilationService = new CompilationService(demoPortalClient, devEndpointClient);

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
          compileAndPublishToolDefinition
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
    console.error('Continia Environment MCP Server started successfully');
    console.error(`API URL: ${config.getApiUrl()}`);
    console.error('Ready to accept connections via stdio');
  } catch (error) {
    // Log initialization errors to stderr
    console.error('Failed to start Continia Environment MCP Server:');
    console.error(error);
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
  console.error('Unhandled error in main():');
  console.error(error);
  process.exit(1);
});
