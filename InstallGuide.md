# Continia Environment MCP - Installation Guide

## Overview
The Continia Environment MCP (Model Context Protocol) server enables AI assistants to interact with Continia environments, execute tests, and run terminal commands programmatically.

## Prerequisites

Before installing, ensure you have:
- **Node.js** v18 or higher installed ([Download Node.js](https://nodejs.org/))
- **Claude Desktop** application ([Download Claude](https://claude.ai/download))
- **Continia Demo Portal API Token** (obtain from your Continia account)
- **Internet connection** (required for npx to download the package)

## Quick Setup (2 Minutes)

### Step 1: Configure Claude Desktop

1. **Locate your Claude Desktop configuration file:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Open the configuration file** in a text editor

3. **Add the MCP server configuration:**

```json
{
  "mcpServers": {
    "continia-env": {
      "command": "npx",
      "args": ["github:rf9000/test-env-mcp"],
      "env": {
        "DEMO_PORTAL_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

**Important:**
- Replace `your-api-token-here` with your actual Continia Demo Portal API token
- The API token is used to authenticate with the Demo Portal
- Business Central user credentials are fetched automatically from the API
- Ensure proper JSON formatting (watch for trailing commas)

### Step 2: Restart Claude Desktop

1. **Completely quit Claude Desktop** (not just close the window)
   - Windows: Right-click system tray icon → Quit
   - Mac: Claude → Quit Claude
   - Linux: Close all Claude processes

2. **Start Claude Desktop** again

### Step 3: Verify Installation

1. Open a new conversation in Claude
2. Type: "Can you list my Continia environments?"
3. Claude should now have access to Continia environment tools

## Alternative Setup: Local Installation

If you prefer faster startup times or work offline frequently:

### Step 1: Install Locally

```bash
# Create directory and install
mkdir continia-mcp
cd continia-mcp
npm init -y
npm install github:rf9000/test-env-mcp
```

### Step 2: Configure for Local Installation

```json
{
  "mcpServers": {
    "continia-env": {
      "command": "node",
      "args": ["./node_modules/test-env-mcp/dist/index.js"],
      "cwd": "C:\\path\\to\\continia-mcp",
      "env": {
        "DEMO_PORTAL_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

Replace `C:\\path\\to\\continia-mcp` with your actual installation path and `your-api-token-here` with your actual API token.

## Configuration Options

### API Endpoint Configuration

The MCP server connects to the Continia Demo Portal API with these options:

**Default Endpoint (Production)**
- URL: `https://demoportaldev.continiaonline.com/api/v1.0`
- This is hardcoded as the default - no configuration needed for standard use

**Custom Endpoint (Optional)**
- Set `DEMO_PORTAL_BASE_URL` in your configuration to override the default
- Use cases:
  - Connecting to a test/staging Demo Portal instance
  - Using an on-premises Demo Portal deployment
  - Development and testing scenarios

Example with custom endpoint:
```json
{
  "mcpServers": {
    "continia-env": {
      "command": "npx",
      "args": ["github:rf9000/test-env-mcp"],
      "env": {
        "DEMO_PORTAL_TOKEN": "your-api-token-here",
        "DEMO_PORTAL_BASE_URL": "https://staging.demoportal.com/api/v1.0"
      }
    }
  }
}
```

### Using Environment Variables

Instead of hardcoding the API token in the config file, you can use system environment variables:

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("DEMO_PORTAL_TOKEN", "your-api-token", "User")
```

**Mac/Linux:**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export DEMO_PORTAL_TOKEN="your-api-token"
```

Then in your config, simply omit the token:
```json
{
  "mcpServers": {
    "continia-env": {
      "command": "npx",
      "args": ["github:rf9000/test-env-mcp"]
    }
  }
}
```

### Advanced Configuration

```json
{
  "mcpServers": {
    "continia-env": {
      "command": "npx",
      "args": ["github:rf9000/test-env-mcp"],
      "env": {
        "DEMO_PORTAL_TOKEN": "your-api-token-here",
        "DEMO_PORTAL_BASE_URL": "https://custom-api.com/api/v1.0",  // Optional: Override default API endpoint
        "LOG_LEVEL": "debug",  // Optional: Enable debug logging
        "NODE_ENV": "production"  // Optional: Environment setting
      }
    }
  }
}
```

**Note:** The default base URL is `https://demoportaldev.continiaonline.com/api/v1.0`. Only set `DEMO_PORTAL_BASE_URL` if you need to connect to a different Demo Portal instance.

## Troubleshooting

### MCP Server Not Appearing

**Problem:** Claude doesn't show Continia tools
**Solutions:**
1. Ensure Claude Desktop is fully restarted
2. Check JSON syntax in configuration file (use a JSON validator)
3. Open Claude's Developer Console (Ctrl+Shift+I / Cmd+Option+I) to check for errors
4. Verify Node.js is installed: `node --version` in terminal

### Authentication Errors

**Problem:** "DEMO_PORTAL_TOKEN not set" or authentication failure
**Solutions:**
1. Verify your API token is correct and valid
2. Obtain a fresh token from the Continia Demo Portal settings page
3. Check for special characters in the token that need JSON escaping:
   - `"` → `\"`
   - `\` → `\\`
4. Ensure no trailing spaces in the token
5. Test the token by accessing the Demo Portal API directly

### NPX Download Issues

**Problem:** "Cannot find package" or network errors
**Solutions:**
1. Check internet connection
2. Clear npm cache: `npm cache clean --force`
3. Try with explicit registry: `npx --registry https://registry.npmjs.org/ github:rf9000/test-env-mcp`
4. If behind proxy, configure npm proxy settings

### First Run is Slow

**Problem:** Initial startup takes a long time
**Solutions:**
1. This is normal - npx downloads the package on first run
2. Subsequent runs use cached version (faster)
3. Consider local installation for faster startup

## How Authentication Works

The MCP server uses a streamlined authentication flow:

1. **API Token Authentication**: Your `DEMO_PORTAL_TOKEN` authenticates with the Demo Portal API
2. **Automatic User Retrieval**: The API returns available Business Central users for each environment
3. **Automatic User Selection**: The MCP server automatically selects the appropriate user for operations
4. **No Manual Credentials**: You don't need to configure Business Central usernames or passwords

This means you only need to provide the API token - all other credentials are handled automatically.

## Available Tools

Once configured, ask Claude to use these capabilities:

| Tool | Description | Example Request |
|------|-------------|-----------------|
| **list_environments** | List all environments | "Show me all Continia environments" |
| **get_environment** | Get environment details | "Get details for environment ENV-123" |
| **create_environment** | Create new environment | "Create a new test environment" |
| **delete_environment** | Delete environment | "Delete environment ENV-456" |
| **start_environment** | Start environment | "Start the development environment" |
| **stop_environment** | Stop environment | "Stop environment ENV-789" |
| **execute_tests** | Run AL tests | "Run tests on my environment" |
| **run_terminal_command** | Execute commands | "Run dir command on the environment" |

## Security Best Practices

1. **Never share your config file** containing credentials
2. **Use environment variables** for credentials when possible
3. **Rotate credentials** regularly
4. **Restrict file permissions** on configuration files:
   - Windows: Right-click → Properties → Security
   - Mac/Linux: `chmod 600 ~/.config/Claude/claude_desktop_config.json`

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Visit the [GitHub repository](https://github.com/rf9000/test-env-mcp)
3. Open an issue with:
   - Operating system and version
   - Node.js version (`node --version`)
   - Error messages from Claude's console
   - Config file (without credentials)

## Next Steps

1. **Test the installation** - Follow the [Test Guide](TestGuide.md)
2. **Explore capabilities** - Ask Claude about available Continia operations
3. **Integrate with workflow** - Use for automated testing and environment management

## Updating

The npx approach always uses the latest version. To force an update:

1. Clear npm cache: `npm cache clean --force`
2. Restart Claude Desktop

For local installation:
```bash
cd continia-mcp
npm update test-env-mcp
```