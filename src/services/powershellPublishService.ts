/**
 * PowerShell Publish Service
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Executes the PowerShell publishing script (Publish-BCApp.ps1) for
 * deterministic, debuggable app publishing to Business Central.
 *
 * Benefits over direct HTTP approach:
 * - Deterministic: Same script, same behavior every time
 * - Debuggable: Can run manually with verbose output
 * - Proven Pattern: Matches exact approach from knowledge base
 * - Isolation: Publishing failures don't crash the MCP server
 * - Testable: Easy to unit test the script independently
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Parameters for PowerShell publishing
 */
export interface PowerShellPublishParams {
  /** Absolute path to .app file */
  appPath: string;
  /** Environment ID (GUID) */
  environmentId: string;
  /** Full environment URL (e.g., "https://server.com/BC/") */
  environmentUrl: string;
  /** BC user username */
  username: string;
  /** BC user password */
  password: string;
  /** Schema update mode: synchronize (default), recreate, forcesync */
  schemaUpdateMode?: 'synchronize' | 'recreate' | 'forcesync' | undefined;
  /** Dependency publishing option: default, strict, ignore */
  dependencyPublishingOption?: 'default' | 'strict' | 'ignore' | undefined;
  /** Tenant name (default: "default") */
  tenant?: string | undefined;
  /** Allow insecure certificates (for self-signed certs) */
  allowInsecureCertificates?: boolean | undefined;
}

/**
 * Parameters for running diagnostics
 */
export interface PowerShellDiagnoseParams extends PowerShellPublishParams {
  /** Run in diagnose mode (no actual publish) */
  diagnose: true;
}

/**
 * Result from PowerShell publishing script
 */
export interface PowerShellPublishResult {
  success: boolean;
  status: 'completed' | 'failed' | 'diagnosed';
  schemaUpdateMode: string;
  user: string;
  url: string;
  response?: unknown;
  error?: string;
  diagnostics?: {
    appPath: string;
    appFileName: string;
    appFileSize: number;
    environmentId: string;
    environmentUrl: string;
    baseHost: string;
    baseScheme: string;
    constructedUrl: string;
    tenant: string;
    schemaUpdateMode: string;
    dependencyPublishingOption: string;
    username: string;
    passwordRedacted: string;
    timestamp: string;
    connectivity?: {
      reachable: boolean;
      statusCode?: number;
      error?: string;
    };
  };
}

/**
 * Service for executing PowerShell-based app publishing
 *
 * Executes the Publish-BCApp.ps1 script to publish AL apps to
 * Business Central Developer Endpoint. The script handles:
 * - URL construction following knowledge base patterns
 * - Multipart/form-data file upload
 * - Basic Authentication
 * - Error handling with clear messages
 * - JSON result output for MCP integration
 */
export class PowerShellPublishService {
  private readonly scriptPath: string;

  constructor() {
    // Resolve script path relative to this module
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.scriptPath = path.resolve(__dirname, '../../scripts/Publish-BCApp.ps1');
  }

  /**
   * Publish an AL app to Business Central using PowerShell
   *
   * Executes the Publish-BCApp.ps1 script with the provided parameters.
   * The script handles all the complexity of multipart upload and authentication.
   *
   * @param params - Publishing parameters
   * @returns Publishing result from PowerShell script
   * @throws Error if PowerShell execution fails
   */
  async publishApp(params: PowerShellPublishParams): Promise<PowerShellPublishResult> {
    return this.executeScript(params, false);
  }

  /**
   * Run diagnostics for publishing without actually publishing
   *
   * Useful for debugging publish failures. Shows:
   * - Constructed URL
   * - Credentials (redacted)
   * - Connectivity test results
   *
   * @param params - Publishing parameters
   * @returns Diagnostic information
   * @throws Error if PowerShell execution fails
   */
  async diagnose(params: PowerShellPublishParams): Promise<PowerShellPublishResult> {
    return this.executeScript(params, true);
  }

  /**
   * Execute the PowerShell script
   *
   * @param params - Publishing parameters
   * @param diagnose - Whether to run in diagnose mode
   * @returns Script result
   */
  private executeScript(
    params: PowerShellPublishParams,
    diagnose: boolean
  ): Promise<PowerShellPublishResult> {
    return new Promise((resolve, reject) => {
      // Build PowerShell arguments
      const args = this.buildPowerShellArgs(params, diagnose);

      console.error(`[PowerShellPublish] Executing script: ${this.scriptPath}`);
      console.error(`[PowerShellPublish] Parameters: ${JSON.stringify({
        ...params,
        password: '***REDACTED***'
      })}`);

      // Spawn PowerShell process
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-File', this.scriptPath,
        ...args
      ], {
        windowsHide: true,
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      ps.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      ps.stderr.on('data', (data: Buffer) => {
        const message = data.toString();
        stderr += message;
        // Forward diagnostic messages to our stderr
        process.stderr.write(message);
      });

      ps.on('error', (error) => {
        console.error(`[PowerShellPublish] Failed to spawn PowerShell: ${error.message}`);
        reject(new Error(`Failed to execute PowerShell script: ${error.message}`));
      });

      ps.on('close', (code) => {
        console.error(`[PowerShellPublish] Script exited with code: ${code}`);

        // Try to parse JSON output
        try {
          const trimmedOutput = stdout.trim();
          if (!trimmedOutput) {
            reject(new Error(
              `PowerShell script produced no output. Exit code: ${code}. ` +
              `Stderr: ${stderr.substring(0, 500)}`
            ));
            return;
          }

          const result = JSON.parse(trimmedOutput) as PowerShellPublishResult;
          resolve(result);
        } catch (parseError) {
          console.error(`[PowerShellPublish] Failed to parse JSON output: ${stdout}`);
          reject(new Error(
            `Failed to parse PowerShell output as JSON. ` +
            `Output: ${stdout.substring(0, 500)}. ` +
            `Stderr: ${stderr.substring(0, 500)}`
          ));
        }
      });
    });
  }

  /**
   * Build PowerShell command-line arguments
   *
   * @param params - Publishing parameters
   * @param diagnose - Whether to run in diagnose mode
   * @returns Array of command-line arguments
   */
  private buildPowerShellArgs(
    params: PowerShellPublishParams,
    diagnose: boolean
  ): string[] {
    const args: string[] = [
      '-AppPath', params.appPath,
      '-EnvironmentId', params.environmentId,
      '-EnvironmentUrl', params.environmentUrl,
      '-Username', params.username,
      '-Password', params.password
    ];

    if (params.schemaUpdateMode) {
      args.push('-SchemaUpdateMode', params.schemaUpdateMode);
    }

    if (params.dependencyPublishingOption) {
      args.push('-DependencyPublishingOption', params.dependencyPublishingOption);
    }

    if (params.tenant) {
      args.push('-Tenant', params.tenant);
    }

    if (params.allowInsecureCertificates) {
      args.push('-AllowInsecureCertificates');
    }

    if (diagnose) {
      args.push('-Diagnose');
    }

    return args;
  }

  /**
   * Get the path to the PowerShell script
   *
   * Useful for manual testing/debugging.
   *
   * @returns Absolute path to Publish-BCApp.ps1
   */
  getScriptPath(): string {
    return this.scriptPath;
  }
}
