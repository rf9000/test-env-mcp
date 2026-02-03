/**
 * Compilation Service
 *
 * Phase 2.5: Compilation and Publishing
 *
 * Handles AL code compilation using Microsoft AL Language extension CLI:
 * - Verifies AL CLI tools are installed
 * - Resolves analyzer paths (CodeCop, AppSourceCop, UICop)
 * - Executes `al compile` command with proper flags
 * - Parses compiler diagnostics (errors and warnings)
 * - Validates app.json and output paths
 * - Orchestrates compile-and-publish workflow
 *
 * Publishing now uses PowerShell script (Publish-BCApp.ps1) for:
 * - Deterministic, debuggable behavior
 * - Proven pattern matching knowledge base exactly
 * - Isolation from MCP server (failures don't crash server)
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { DeveloperEndpointClient } from '@/api/developerEndpointClient.js';
import type { CredentialsService } from '@/services/credentialsService.js';
import type { ConfigurationService } from '@/services/configurationService.js';
import { PowerShellPublishService } from '@/services/powershellPublishService.js';
import { CompileError, ValidationError, AuthError } from '@/errors/errors.js';

/**
 * Schema for app.json validation
 */
const AppJsonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  publisher: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/)
});

export type AppJson = z.infer<typeof AppJsonSchema>;

/**
 * Compiler diagnostic (error or warning)
 */
export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

/**
 * Parameters for compile-and-publish operation
 */
export interface CompileAndPublishParams {
  /** Absolute path to AL project workspace */
  workspacePath: string;
  /** Environment ID to publish to */
  environmentId: string;
  /** Optional package cache path (default: workspacePath/.alpackages) */
  packageCachePath?: string | undefined;
  /** Optional ruleset path (default: workspacePath/.ruleset.json) */
  rulesetPath?: string | undefined;
  /** Schema update mode for publishing */
  schemaUpdateMode?: 'synchronize' | 'recreate' | 'forcesync' | undefined;
  /** Dependency publishing option: default, strict (enforce all), ignore (skip missing) */
  dependencyPublishingOption?: 'default' | 'strict' | 'ignore' | undefined;
}

/**
 * Result of compilation
 */
export interface CompileResult {
  success: boolean;
  appPath: string;
  appSize: number;
  app: AppJson;
  diagnostics: Diagnostic[];
  compilerOutput: string;
  testAppDetected?: boolean;
  estimatedTestCount?: number;
  testCodeunits?: string[];
}

/**
 * Result of compile-and-publish operation
 */
export interface CompileAndPublishResult {
  type: 'compile_and_publish_result';
  compile: CompileResult;
  publish: {
    success: boolean;
    status: string;
    schemaUpdateMode: string;
    user: string;
  };
  fetchedAt: string;
  verificationStatus?: {
    verified: boolean;
    testsAvailable?: number;
    message: string;
  };
}

/**
 * Parameters for publish-only operation (no compilation)
 */
export interface PublishAppParams {
  /** Absolute path to existing .app file */
  appPath: string;
  /** Environment ID to publish to */
  environmentId: string;
  /** Schema update mode for publishing */
  schemaUpdateMode?: 'synchronize' | 'recreate' | 'forcesync' | undefined;
  /** Dependency publishing option: default, strict (enforce all), ignore (skip missing) */
  dependencyPublishingOption?: 'default' | 'strict' | 'ignore' | undefined;
}

/**
 * Result of publish-only operation
 */
export interface PublishAppResult {
  type: 'publish_result';
  publish: {
    success: boolean;
    status: string;
    schemaUpdateMode: string;
    user: string;
    url?: string;
  };
  app: {
    path: string;
    fileName: string;
    size: number;
  };
  fetchedAt: string;
}

/**
 * Service for compiling AL code and publishing to BC
 *
 * Responsibilities:
 * - Verify AL CLI tools installation
 * - Compile AL projects using `al compile`
 * - Parse compiler diagnostics
 * - Orchestrate compile → get environment → publish workflow
 *
 * Publishing uses PowerShell script (Publish-BCApp.ps1) for reliability.
 * The HTTP-based DeveloperEndpointClient is kept as a fallback/reference.
 */
export class CompilationService {
  private readonly powershellPublishService: PowerShellPublishService;
  /** HTTP-based endpoint client - kept as fallback option if PowerShell fails */
  private readonly devEndpointClient: DeveloperEndpointClient;

  constructor(
    private readonly demoPortalClient: DemoPortalClient,
    devEndpointClient: DeveloperEndpointClient,
    private readonly credentialsService: CredentialsService,
    private readonly configService: ConfigurationService
  ) {
    this.powershellPublishService = new PowerShellPublishService();
    this.devEndpointClient = devEndpointClient;
  }

  /**
   * Get the HTTP-based developer endpoint client (for fallback publishing)
   *
   * @returns DeveloperEndpointClient instance
   */
  getDevEndpointClient(): DeveloperEndpointClient {
    return this.devEndpointClient;
  }

  /**
   * Publish an existing .app file to BC environment (no compilation)
   *
   * Workflow:
   * 1. Validate .app file exists
   * 2. Get environment details from Demo Portal
   * 3. Publish .app file to Developer Endpoint
   *
   * @param params - Publishing parameters
   * @returns Publishing result with app details
   * @throws {ValidationError} If .app file doesn't exist or environment invalid
   * @throws {AuthError} If publishing authentication fails
   */
  async publishApp(params: PublishAppParams): Promise<PublishAppResult> {
    // Phase 1: Validate .app file exists
    const appStats = await this.validateAppFile(params.appPath);

    // Phase 2: Get environment details from Demo Portal
    const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(
      params.environmentId
    );

    // Extract environment URL (handle different possible field names)
    const environmentUrl =
      (environmentResponse as { url?: string }).url ??
      (environmentResponse as { serverInstance?: string }).serverInstance ??
      '';

    if (!environmentUrl) {
      throw new ValidationError(
        `Environment '${params.environmentId}' does not have a valid URL. Cannot publish app.`,
        { environmentId: params.environmentId }
      );
    }

    const authMethod =
      (environmentResponse as { authenticationMethod?: string }).authenticationMethod ?? 'NavUserPassword';

    // Phase 3: Get credentials for publishing
    const authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: authMethod
    });

    // Get configuration for publishing
    const tenant = this.configService.get('auth.devTenant', 'default') as string;
    const allowInsecureCerts = this.configService.get('auth.allowInsecureCertificates', false) as boolean;

    console.error(`[CompilationService] Publishing existing app using PowerShell script`);
    console.error(`[CompilationService] App: ${params.appPath}`);
    console.error(`[CompilationService] Environment: ${params.environmentId}`);
    console.error(`[CompilationService] URL: ${environmentUrl}`);
    console.error(`[CompilationService] User: ${authResult.user.username}`);

    // Phase 4: Execute PowerShell publishing script
    const psResult = await this.powershellPublishService.publishApp({
      appPath: params.appPath,
      environmentId: params.environmentId,
      environmentUrl,
      username: authResult.user.username,
      password: authResult.user.password,
      schemaUpdateMode: params.schemaUpdateMode ?? 'synchronize',
      dependencyPublishingOption: params.dependencyPublishingOption,
      tenant,
      allowInsecureCertificates: allowInsecureCerts
    });

    // Handle publish failures
    if (!psResult.success) {
      // Check for auth failure
      if (psResult.error?.includes('Authentication failed') || psResult.error?.includes('401')) {
        this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);
        throw new AuthError(
          `Publishing failed: ${psResult.error}. Credentials have been invalidated for retry.`,
          {
            environmentId: params.environmentId,
            user: authResult.user.username,
            url: psResult.url
          }
        );
      }
      // Other failures - throw with details
      throw new ValidationError(
        `Publishing failed: ${psResult.error}`,
        {
          environmentId: params.environmentId,
          url: psResult.url,
          schemaUpdateMode: psResult.schemaUpdateMode
        }
      );
    }

    // Build result
    const result: PublishAppResult = {
      type: 'publish_result',
      publish: {
        success: psResult.success,
        status: psResult.status,
        schemaUpdateMode: psResult.schemaUpdateMode,
        user: psResult.user,
        url: psResult.url
      },
      app: {
        path: params.appPath,
        fileName: path.basename(params.appPath),
        size: appStats.size
      },
      fetchedAt: new Date().toISOString()
    };

    return result;
  }

  /**
   * Validate that a .app file exists and return its stats
   *
   * @param appPath - Path to the .app file
   * @returns File stats
   * @throws {ValidationError} If file doesn't exist or isn't a .app file
   */
  private async validateAppFile(appPath: string): Promise<{ size: number }> {
    // Check file extension
    if (!appPath.toLowerCase().endsWith('.app')) {
      throw new ValidationError(
        `Invalid app file: '${appPath}'. File must have .app extension.`,
        { appPath }
      );
    }

    // Check file exists
    try {
      const stats = await fs.stat(appPath);
      if (!stats.isFile()) {
        throw new ValidationError(
          `Invalid app path: '${appPath}' is not a file.`,
          { appPath }
        );
      }
      return { size: stats.size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ValidationError(
          `App file not found: '${appPath}'. Ensure the path is correct and the file exists.`,
          { appPath }
        );
      }
      throw error;
    }
  }

  /**
   * Compile AL project and publish to BC environment
   *
   * Workflow:
   * 1. Verify AL CLI tools installed
   * 2. Compile AL project
   * 3. Get environment details from Demo Portal
   * 4. Publish .app file to Developer Endpoint
   *
   * @param params - Compilation and publishing parameters
   * @returns Complete result with compile and publish details
   * @throws {ValidationError} If AL tools not installed or invalid config
   * @throws {CompileError} If compilation fails
   * @throws {AuthError} If publishing authentication fails
   * @throws {ConflictError} If schema conflict occurs
   */
  async compileAndPublish(
    params: CompileAndPublishParams
  ): Promise<CompileAndPublishResult> {
    // Phase 1: Verify AL CLI tools are installed
    await this.verifyAlCliTools();

    // Phase 2: Compile AL project
    // Resolve package cache path with monorepo support
    const resolvedPackageCachePath = await this.resolvePackageCachePath(
      params.workspacePath,
      params.packageCachePath
    );

    const compileResult = await this.compile({
      projectPath: params.workspacePath,
      packageCachePath: resolvedPackageCachePath,
      rulesetPath: params.rulesetPath
    });

    // Phase 3: Get environment details from Demo Portal
    const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(
      params.environmentId
    );

    // Extract environment URL (handle different possible field names)
    const environmentUrl =
      (environmentResponse as { url?: string }).url ??
      (environmentResponse as { serverInstance?: string }).serverInstance ??
      '';

    if (!environmentUrl) {
      throw new ValidationError(
        `Environment '${params.environmentId}' does not have a valid URL. Cannot publish app.`,
        { environmentId: params.environmentId }
      );
    }

    const authMethod =
      (environmentResponse as { authenticationMethod?: string }).authenticationMethod ?? 'NavUserPassword';

    // Phase 4: Publish to Developer Endpoint using PowerShell script
    // Get credentials for PowerShell script
    const authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: authMethod
    });

    // Get configuration for publishing
    const tenant = this.configService.get('auth.devTenant', 'default') as string;
    const allowInsecureCerts = this.configService.get('auth.allowInsecureCertificates', false) as boolean;

    console.error(`[CompilationService] Publishing app using PowerShell script`);
    console.error(`[CompilationService] App: ${compileResult.appPath}`);
    console.error(`[CompilationService] Environment: ${params.environmentId}`);
    console.error(`[CompilationService] URL: ${environmentUrl}`);
    console.error(`[CompilationService] User: ${authResult.user.username}`);

    // Execute PowerShell publishing script
    const psResult = await this.powershellPublishService.publishApp({
      appPath: compileResult.appPath,
      environmentId: params.environmentId,
      environmentUrl,
      username: authResult.user.username,
      password: authResult.user.password,
      schemaUpdateMode: params.schemaUpdateMode ?? 'synchronize',
      dependencyPublishingOption: params.dependencyPublishingOption,
      tenant,
      allowInsecureCertificates: allowInsecureCerts
    });

    // Convert PowerShell result to expected format
    const publishResult = {
      success: psResult.success,
      status: psResult.status as 'completed' | 'failed',
      schemaUpdateMode: psResult.schemaUpdateMode,
      user: psResult.user,
      response: psResult.response,
      error: psResult.error
    };

    // Handle publish failures
    if (!publishResult.success) {
      // Check for auth failure
      if (psResult.error?.includes('Authentication failed') || psResult.error?.includes('401')) {
        // Invalidate credentials and provide actionable error
        this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);
        throw new AuthError(
          `Publishing failed: ${psResult.error}. Credentials have been invalidated for retry.`,
          {
            environmentId: params.environmentId,
            user: authResult.user.username,
            url: psResult.url
          }
        );
      }
      // Other failures - throw with details
      throw new ValidationError(
        `Publishing failed: ${psResult.error}`,
        {
          environmentId: params.environmentId,
          url: psResult.url,
          schemaUpdateMode: psResult.schemaUpdateMode
        }
      );
    }

    // Phase 5: Verify publication (optional, only if publish succeeded)
    let verificationStatus: CompileAndPublishResult['verificationStatus'] = undefined;
    if (publishResult.success) {
      const isTestApp = compileResult.testAppDetected ?? false;
      verificationStatus = await this.verifyPublishedApp(
        params.environmentId,
        compileResult.app,
        isTestApp
      );
    }

    const result: CompileAndPublishResult = {
      type: 'compile_and_publish_result',
      compile: compileResult,
      publish: publishResult,
      fetchedAt: new Date().toISOString()
    };

    if (verificationStatus) {
      result.verificationStatus = verificationStatus;
    }

    return result;
  }

  /**
   * Diagnose publishing configuration without actually publishing
   *
   * Useful for debugging publish failures. Shows:
   * - Constructed URL
   * - Credentials (password redacted)
   * - Connectivity test results
   * - Environment configuration
   *
   * @param params - Parameters for diagnosis
   * @returns Diagnostic information
   */
  async diagnosePublish(params: {
    workspacePath: string;
    environmentId: string;
  }): Promise<{
    type: 'publish_diagnostics';
    environment: {
      id: string;
      url: string;
      authMethod: string;
    };
    credentials: {
      username: string;
      passwordRedacted: string;
    };
    url: {
      constructed: string;
      tenant: string;
      schemaUpdateMode: string;
    };
    connectivity: {
      reachable: boolean;
      statusCode?: number;
      error?: string;
    };
    powershellScript: {
      path: string;
      exists: boolean;
    };
    timestamp: string;
  }> {
    // Get environment details
    const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(
      params.environmentId
    );

    const environmentUrl =
      (environmentResponse as { url?: string }).url ??
      (environmentResponse as { serverInstance?: string }).serverInstance ??
      '';

    const authMethod =
      (environmentResponse as { authenticationMethod?: string }).authenticationMethod ?? 'NavUserPassword';

    // Get credentials
    const authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: authMethod
    });

    // Redact password for display
    const password = authResult.user.password;
    const passwordRedacted = password.length <= 4
      ? '****'
      : password.substring(0, 2) + '*'.repeat(password.length - 4) + password.substring(password.length - 2);

    // Get configuration
    const tenant = this.configService.get('auth.devTenant', 'default') as string;
    const schemaUpdateMode = 'synchronize';

    // Construct URL (same logic as PowerShell script)
    const baseUrl = new URL(environmentUrl);
    const constructedUrl = `${baseUrl.origin}/${params.environmentId}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;

    // Check PowerShell script exists
    const scriptPath = this.powershellPublishService.getScriptPath();
    let scriptExists = false;
    try {
      await fs.access(scriptPath);
      scriptExists = true;
    } catch {
      scriptExists = false;
    }

    // Test connectivity
    let connectivity: { reachable: boolean; statusCode?: number; error?: string } = {
      reachable: false
    };

    try {
      // Use PowerShell diagnose mode for connectivity test
      const diagResult = await this.powershellPublishService.diagnose({
        appPath: path.join(params.workspacePath, 'app.json'), // Just need a file that exists
        environmentId: params.environmentId,
        environmentUrl,
        username: authResult.user.username,
        password: authResult.user.password,
        tenant
      });

      if (diagResult.diagnostics?.connectivity) {
        connectivity = diagResult.diagnostics.connectivity;
      }
    } catch (error) {
      connectivity = {
        reachable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return {
      type: 'publish_diagnostics',
      environment: {
        id: params.environmentId,
        url: environmentUrl,
        authMethod
      },
      credentials: {
        username: authResult.user.username,
        passwordRedacted
      },
      url: {
        constructed: constructedUrl,
        tenant,
        schemaUpdateMode
      },
      connectivity,
      powershellScript: {
        path: scriptPath,
        exists: scriptExists
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify AL CLI tools are installed
   *
   * Checks that `microsoft.dynamics.businesscentral.development.tools` is installed
   * using `dotnet tool list -g`.
   *
   * @throws {ValidationError} If AL CLI tools not found
   */
  private async verifyAlCliTools(): Promise<void> {
    const result = await this.executeCommand('dotnet tool list -g');

    if (!result.stdout.includes('microsoft.dynamics.businesscentral.development.tools')) {
      throw new ValidationError(
        'AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools',
        {
          command: 'dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools',
          documentation: 'https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview'
        }
      );
    }
  }

  /**
   * Detect if an app is a test app based on its app.json
   *
   * Test apps are identified by:
   * - Name containing "Test" or "Test Suite"
   * - ID ranges in test range [94999..95999] or [50000..99999]
   * - Dependencies on Microsoft Test libraries
   *
   * @param appJsonRaw - Raw app.json object
   * @returns true if this is a test app
   */
  private isTestApp(appJsonRaw: any): boolean {
    // Check if name contains "Test" as a word or phrase
    const name = appJsonRaw.name as string;
    if (name) {
      const nameLower = name.toLowerCase();
      // Check for "test" as a word boundary or common test app patterns
      // Use regex for better word boundary detection
      const testPatterns = [
        /\btest\b/,      // "test" as a whole word
        /\btests\b/,     // "tests" as a whole word
        /\btesting\b/,   // "testing" as a whole word
        /\bmock\b/       // "mock" as a whole word
      ];

      if (testPatterns.some(pattern => pattern.test(nameLower))) {
        return true;
      }
    }

    // Check if any ID range is in test range
    const idRanges = appJsonRaw.idRanges as Array<{ from: number; to: number }>;
    if (idRanges && Array.isArray(idRanges)) {
      for (const range of idRanges) {
        // Test apps typically use ranges starting at 50000+ or specifically 94999-95999
        if (range.from >= 94999 && range.to <= 95999) {
          return true;
        }
        // Also check for broader test ranges
        if (range.from >= 50000 && range.from < 100000) {
          // If using customer object range and has test dependencies, it's likely a test app
          const dependencies = appJsonRaw.dependencies as Array<{ name: string }>;
          if (dependencies && Array.isArray(dependencies)) {
            const hasTestDependencies = dependencies.some(dep =>
              dep.name && (
                dep.name.includes('Test') ||
                dep.name.includes('Library Assert') ||
                dep.name.includes('Test Runner')
              )
            );
            if (hasTestDependencies) {
              return true;
            }
          }
        }
      }
    }

    // Check for test-specific dependencies
    const dependencies = appJsonRaw.dependencies as Array<{ name: string; publisher: string }>;
    if (dependencies && Array.isArray(dependencies)) {
      const testLibraries = [
        'Test Runner',
        'Library Assert',
        'Tests-TestLibraries',
        'System Application Test Library',
        'Library Variable Storage'
      ];

      const hasTestDependency = dependencies.some(dep =>
        testLibraries.some(lib => dep.name && dep.name.includes(lib))
      );

      if (hasTestDependency) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify that a published app is available in the environment
   *
   * Attempts to check if the published app is queryable by:
   * 1. Running a diagnostic test job if it's a test app
   * 2. Checking for available tests in the environment
   *
   * @param environmentId - Environment ID
   * @param appJson - App metadata
   * @param isTestApp - Whether this is a test app
   * @returns Verification status
   */
  private async verifyPublishedApp(
    environmentId: string,
    _appJson: AppJson,
    isTestApp: boolean
  ): Promise<{
    verified: boolean;
    testsAvailable?: number;
    message: string;
  }> {
    try {
      // If it's a test app, try to verify by checking test availability
      if (isTestApp) {
        // Create a diagnostic test job to check test availability
        const testParams = {};
        const { jobId } = await this.demoPortalClient.createTestJob(
          environmentId,
          testParams
        );

        // Poll for test results (short timeout for verification)
        const maxAttempts = 10;
        let attempts = 0;
        let testsAvailable = 0;

        while (attempts < maxAttempts) {
          await new Promise<void>(resolve => setTimeout(resolve, 2000));

          try {
            const result = await this.demoPortalClient.getTestResultsXml(
              environmentId,
              jobId
            );

            if (result?.xml) {
              // Parse the XML to count available tests
              const testCountMatch = result.xml.match(/<testcase/g);
              testsAvailable = testCountMatch ? testCountMatch.length : 0;

              return {
                verified: true,
                testsAvailable,
                message: testsAvailable > 0
                  ? `Verified: ${testsAvailable} test(s) available in environment`
                  : 'App published but no tests detected in environment'
              };
            }
          } catch (pollError) {
            // Continue polling
          }

          attempts++;
        }

        return {
          verified: false,
          testsAvailable: 0,
          message: 'Unable to verify app publication - test job did not complete'
        };
      }

      // For non-test apps, we can only confirm the publish operation succeeded
      return {
        verified: true,
        message: 'App published successfully (non-test app, verification limited)'
      };
    } catch (error) {
      return {
        verified: false,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Detect test codeunits in AL source files
   *
   * Scans .al files for:
   * - Codeunits with Subtype = Test
   * - Methods with [Test] attribute
   *
   * @param projectPath - Path to AL project
   * @returns Test detection information
   */
  private async detectTestCodeunits(projectPath: string): Promise<{
    testCodeunits: string[];
    estimatedTestCount: number;
    isTestApp: boolean;
  }> {
    const testCodeunits: string[] = [];
    let estimatedTestCount = 0;

    try {
      // Find all .al files recursively
      const alFiles: string[] = [];
      const scanDirectory = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== '.alpackages' && entry.name !== 'build') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.al')) {
            alFiles.push(fullPath);
          }
        }
      };

      await scanDirectory(projectPath);

      // Scan each file for test codeunits and methods
      for (const filePath of alFiles) {
        const content = await fs.readFile(filePath, 'utf8');

        // Check for test codeunit
        const codeunitMatch = content.match(/codeunit\s+(\d+)\s+"?([^"{\n]+)"?\s*{/i);
        if (codeunitMatch?.[2]) {
          const codeunitName = codeunitMatch[2];

          // Check if it has Subtype = Test
          const subtypeMatch = content.match(/Subtype\s*=\s*Test/i);
          if (subtypeMatch) {
            testCodeunits.push(codeunitName);

            // Count [Test] methods
            const testMethodMatches = content.matchAll(/\[Test\]/gi);
            let methodCount = 0;
            for (const _ of testMethodMatches) {
              methodCount++;
            }
            estimatedTestCount += methodCount;
          }
        }
      }
    } catch (error) {
      // If we can't scan the files, we'll just return empty results
      // Silent failure - test detection is not critical for compilation
    }

    return {
      testCodeunits,
      estimatedTestCount,
      isTestApp: testCodeunits.length > 0
    };
  }

  /**
   * Get path to AL analyzer DLLs
   *
   * Resolves path based on installed version:
   * Windows: ~/.dotnet/tools/.store/microsoft.dynamics.businesscentral.development.tools/{version}/...
   *
   * @returns Base path to analyzer DLLs
   * @throws {ValidationError} If version cannot be determined or path doesn't exist
   */
  private async getAnalyzerPath(): Promise<string> {
    // Get AL CLI tool version
    const result = await this.executeCommand('dotnet tool list -g');
    const match = result.stdout.match(
      /microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d\.-]+[a-z]*)/i
    );

    if (!match?.[1]) {
      throw new ValidationError('Could not determine AL CLI tools version', {
        hint: 'Run "dotnet tool list -g" manually to verify installation'
      });
    }

    const version = match[1];
    const userProfile = process.env.USERPROFILE ?? process.env.HOME ?? '';

    // Only Windows is supported for AL compilation
    if (process.platform !== 'win32') {
      throw new ValidationError(
        'AL compilation is only supported on Windows. Use a Windows host or Windows container.',
        { platform: process.platform }
      );
    }

    const analyzerPath = path.join(
      userProfile,
      '.dotnet',
      'tools',
      '.store',
      'microsoft.dynamics.businesscentral.development.tools',
      version,
      'microsoft.dynamics.businesscentral.development.tools',
      version,
      'lib',
      'net8.0',
      'win-x64'
    );

    return analyzerPath;
  }

  /**
   * Compile AL project
   *
   * Executes `al compile` with:
   * - All three analyzers (CodeCop, AppSourceCop, UICop) for regular apps
   * - Only CodeCop and UICop for test apps (AppSourceCop blocks test ID ranges)
   * - Continue build on error flag
   * - Optional ruleset
   *
   * @param params - Compilation parameters
   * @returns Compilation result with diagnostics
   * @throws {CompileError} If compilation fails
   * @throws {ValidationError} If app.json invalid or output not created
   */
  private async compile(params: {
    projectPath: string;
    packageCachePath: string;
    rulesetPath?: string | undefined;
  }): Promise<CompileResult> {
    // Read and validate app.json
    const appJsonPath = path.join(params.projectPath, 'app.json');
    const appJsonContent = await fs.readFile(appJsonPath, 'utf-8');
    const appJsonRaw = JSON.parse(appJsonContent);
    const appJson = AppJsonSchema.parse(appJsonRaw);

    // Detect if this is a test app
    const isTestApp = this.isTestApp(appJsonRaw);

    // Prepare output directory and filename
    const outputDir = path.join(params.projectPath, 'build');
    await fs.mkdir(outputDir, { recursive: true });

    const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
    const outputPath = path.join(outputDir, appFileName);

    // Get analyzer path
    const analyzerBasePath = await this.getAnalyzerPath();

    // Configure analyzers based on app type
    const analyzers = isTestApp
      ? [
          // Exclude AppSourceCop for test apps (it blocks test ID ranges)
          path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.CodeCop.dll'),
          path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.UICop.dll')
        ]
      : [
          // Include all analyzers for regular apps
          path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.CodeCop.dll'),
          path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.AppSourceCop.dll'),
          path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.UICop.dll')
        ];

    // Log analyzer configuration (Note: We'd need to inject a logger for proper logging)
    // For now, we'll include this info in the compiler output

    // Build al compile command
    const args = [
      'compile',
      `/project:"${params.projectPath}"`,
      `/packagecachepath:"${params.packageCachePath}"`,
      `/out:"${outputPath}"`,
      `/analyzer:"${analyzers.join(';')}"`,
      '/continuebuildonerror:+'
    ];

    // Add ruleset if provided or exists
    const rulesetPath = params.rulesetPath ?? path.join(params.projectPath, '.ruleset.json');
    if (await this.fileExists(rulesetPath)) {
      args.push(`/ruleset:"${rulesetPath}"`);
    }

    // Execute al compile command
    return new Promise((resolve, reject) => {
      const child = spawn('al', args, {
        cwd: params.projectPath,
        shell: true,
        windowsVerbatimArguments: true
      });

      let stdout = '';
      let stderr = '';
      const diagnostics: Diagnostic[] = [];

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        this.parseDiagnostics(text, diagnostics);
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', (error: Error) => {
        reject(
          new CompileError(
            `Failed to start AL compiler: ${error.message}. Ensure AL CLI tools are installed.`,
            []
          )
        );
      });

      child.on('exit', async (code: number | null) => {
        // With /continuebuildonerror:+, exit code 0 even with errors
        // Check for actual compilation failure vs warnings
        const hasErrors = diagnostics.some((d) => d.severity === 'error');

        if (code !== 0 && hasErrors) {
          reject(
            new CompileError(
              `Compilation failed with ${diagnostics.filter((d) => d.severity === 'error').length} errors`,
              diagnostics,
              { exitCode: code, stdout, stderr }
            )
          );
          return;
        }

        // Verify output exists
        try {
          const stats = await fs.stat(outputPath);

          // Detect test codeunits in the compiled app
          const testInfo = await this.detectTestCodeunits(params.projectPath);

          // Log test app detection for diagnostics
          const testAppStatus = isTestApp
            ? `Test app detected (by app.json metadata)`
            : testInfo.isTestApp
            ? `Test app detected (found ${testInfo.testCodeunits.length} test codeunit(s) with ${testInfo.estimatedTestCount} test method(s))`
            : 'Regular app (no test codeunits found)';

          // Include test detection info in the compiler output for diagnostics
          const testDiagnostics = `
=== Test App Detection ===
App Name: ${appJson.name}
App Version: ${appJson.version}
Status: ${testAppStatus}
Test Codeunits: ${testInfo.testCodeunits.length > 0 ? testInfo.testCodeunits.join(', ') : 'None'}
Estimated Test Count: ${testInfo.estimatedTestCount}
`;

          resolve({
            success: true,
            appPath: outputPath,
            appSize: stats.size,
            app: appJson,
            diagnostics,
            compilerOutput: stdout + testDiagnostics,
            testAppDetected: isTestApp || testInfo.isTestApp,
            estimatedTestCount: testInfo.estimatedTestCount,
            testCodeunits: testInfo.testCodeunits
          });
        } catch {
          reject(
            new CompileError(
              'Compilation command completed but .app file was not created',
              diagnostics
            )
          );
        }
      });
    });
  }

  /**
   * Execute a shell command and capture output
   *
   * @param command - Command to execute
   * @returns stdout and stderr
   * @throws {Error} If command fails
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], { shell: true });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('exit', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code ?? 'null'}: ${stderr}`));
        } else {
          resolve({ stdout, stderr });
        }
      });

      child.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse diagnostics from AL compiler output
   *
   * Pattern: file(line,column): severity code: message
   * Example: HelloWorld.al(10,5): error AL0118: The name 'Foo' does not exist
   *
   * @param output - Compiler output text
   * @param diagnostics - Array to append diagnostics to
   */
  private parseDiagnostics(output: string, diagnostics: Diagnostic[]): void {
    const lines = output.split('\n');
    const diagnosticPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)$/;

    for (const line of lines) {
      const match = diagnosticPattern.exec(line.trim());
      if (match?.[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
        diagnostics.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] as 'error' | 'warning',
          code: match[5],
          message: match[6]
        });
      }
    }
  }

  /**
   * Check if a file exists
   *
   * @param filePath - Path to check
   * @returns true if file exists, false otherwise
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolve package cache path with monorepo support
   *
   * Priority:
   * 1. Explicitly provided path (always used if provided)
   * 2. Workspace-local .alpackages (if exists)
   * 3. Search parent directories for shared .alpackages (monorepo pattern)
   * 4. Fallback to workspace-local (will be created if needed)
   *
   * @param workspacePath - AL project workspace path
   * @param providedPath - User-provided package cache path (optional)
   * @returns Resolved package cache path
   */
  private async resolvePackageCachePath(
    workspacePath: string,
    providedPath?: string
  ): Promise<string> {
    // Priority 1: If explicitly provided, always use it
    if (providedPath) {
      const exists = await this.fileExists(providedPath);
      console.error(`[compile] Using provided packageCachePath: ${providedPath} (exists: ${exists})`);
      return providedPath;
    }

    // Priority 2: Check workspace-local .alpackages
    const localPath = path.join(workspacePath, '.alpackages');
    if (await this.fileExists(localPath)) {
      console.error(`[compile] Using workspace-local package cache: ${localPath}`);
      return localPath;
    }

    // Priority 3: Search parent directories for monorepo shared .alpackages
    let currentDir = path.dirname(workspacePath);
    const root = path.parse(workspacePath).root;
    const maxDepth = 5; // Limit search depth for performance
    let depth = 0;

    while (currentDir !== root && depth < maxDepth) {
      const parentPackages = path.join(currentDir, '.alpackages');
      if (await this.fileExists(parentPackages)) {
        console.error(`[compile] Found monorepo package cache: ${parentPackages}`);
        return parentPackages;
      }
      currentDir = path.dirname(currentDir);
      depth++;
    }

    // Priority 4: Fallback to workspace-local (will be created if needed)
    console.error(`[compile] No existing package cache found, using default: ${localPath}`);
    return localPath;
  }
}
