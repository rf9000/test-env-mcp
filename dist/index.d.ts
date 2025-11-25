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
export {};
//# sourceMappingURL=index.d.ts.map