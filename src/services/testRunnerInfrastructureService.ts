/**
 * Test Runner Infrastructure Service
 *
 * Ensures the Continia Test Runner BC app is installed on target environments.
 * This service handles:
 * - Detection of Test Runner installation status
 * - Automatic compilation and publication of Test Runner app
 * - Symbol download for Test Runner dependencies
 * - Caching of installation status per environment
 */

/* eslint-disable no-undef */

import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import axios from 'axios';
import https from 'https';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { DeveloperEndpointClient } from '@/api/developerEndpointClient.js';
import type { ConfigurationService } from '@/services/configurationService.js';
import type { CredentialsService } from '@/services/credentialsService.js';
import { TestRunnerInfrastructureError } from '@/errors/errors.js';
import { Logger } from '@/utils/logger.js';

/**
 * Status of Test Runner installation
 */
export interface TestRunnerStatus {
  installed: boolean;
  version?: string;
  detectionMethod: 'test_probe' | 'cached';
  checkedAt: string;
}

/**
 * Result of Test Runner installation
 */
export interface InstallResult {
  success: boolean;
  compilation: {
    success: boolean;
    appPath: string;
    diagnostics: Array<{
      file: string;
      line: number;
      column: number;
      severity: 'error' | 'warning';
      code: string;
      message: string;
    }>;
  };
  publication: {
    success: boolean;
    status: string;
  };
  elapsedMs: number;
}

/**
 * Result of ensureTestRunnerInstalled
 */
export interface EnsureResult {
  status: 'already_installed' | 'newly_installed' | 'installation_failed';
  message: string;
  installResult?: InstallResult;
}

/**
 * Cached status entry
 */
interface CachedStatus {
  status: TestRunnerStatus;
  expiresAt: number;
}

/**
 * Test Runner Infrastructure Service
 *
 * Automatically detects and installs the Continia Test Runner BC app
 * when it is missing from target environments.
 */
export class TestRunnerInfrastructureService {
  private readonly logger: Logger;
  private readonly statusCache: Map<string, CachedStatus> = new Map();

  /** Default source path for Test Runner BC app */
  private static readonly DEFAULT_SOURCE_PATH =
    'C:\\GeneralDev\\MCPDevelopment\\AL Developer Tools - Continia AL Test Runner\\bc-app';

  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly demoPortalClient: DemoPortalClient,
    // eslint-disable-next-line no-unused-vars
    private readonly devEndpointClient: DeveloperEndpointClient,
    // eslint-disable-next-line no-unused-vars
    private readonly credentialsService: CredentialsService,
    // eslint-disable-next-line no-unused-vars
    private readonly config: ConfigurationService
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Ensure Test Runner is installed on the target environment
   *
   * Main entry point - orchestrates detection and conditional installation.
   *
   * @param environmentId - Environment ID to check/install
   * @returns Ensure result with status and optional install details
   */
  async ensureTestRunnerInstalled(environmentId: string): Promise<EnsureResult> {
    this.logger.info('Checking Test Runner infrastructure', {
      details: { environmentId }
    });

    // Check if auto-install is enabled
    const autoInstall = this.config.get('testRunner.autoInstall', true);
    if (!autoInstall) {
      this.logger.info('Test Runner auto-install is disabled');
      return {
        status: 'already_installed',
        message: 'Auto-install disabled, skipping Test Runner check'
      };
    }

    // Detect current status
    const status = await this.detectStatus(environmentId);

    if (status.installed) {
      this.logger.info('Test Runner already installed', {
        details: { environmentId, version: status.version, method: status.detectionMethod }
      });
      return {
        status: 'already_installed',
        message: `Test Runner is installed (detected via ${status.detectionMethod})`
      };
    }

    // Not installed - attempt installation
    this.logger.info('Test Runner not detected, attempting installation', {
      details: { environmentId }
    });

    try {
      const installResult = await this.installTestRunner(environmentId);

      if (installResult.success) {
        // Invalidate cache after installation
        this.statusCache.delete(environmentId);

        this.logger.info('Test Runner installation successful', {
          details: { environmentId, elapsedMs: installResult.elapsedMs }
        });

        return {
          status: 'newly_installed',
          message: `Test Runner installed successfully in ${installResult.elapsedMs}ms`,
          installResult
        };
      } else {
        return {
          status: 'installation_failed',
          message: 'Test Runner installation failed',
          installResult
        };
      }
    } catch (error) {
      this.logger.error('Test Runner installation failed', error as Error, {
        details: { environmentId }
      });

      return {
        status: 'installation_failed',
        message: error instanceof Error ? error.message : 'Unknown installation error'
      };
    }
  }

  /**
   * Detect Test Runner installation status
   *
   * Uses a "test probe" approach:
   * 1. Check cache first
   * 2. Create a test job with no filters
   * 3. Analyze the result to determine if Test Runner is installed
   *
   * @param environmentId - Environment ID to check
   * @returns Detection status
   */
  async detectStatus(environmentId: string): Promise<TestRunnerStatus> {
    // Check cache first
    const cached = this.statusCache.get(environmentId);
    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug('Using cached Test Runner status', {
        details: { environmentId, installed: cached.status.installed }
      });
      return {
        ...cached.status,
        detectionMethod: 'cached'
      };
    }

    this.logger.info('Probing for Test Runner installation', {
      details: { environmentId }
    });

    try {
      // Create a test job with no filters to probe for Test Runner
      const { jobId } = await this.demoPortalClient.createTestJob(
        environmentId,
        {},
        { signal: AbortSignal.timeout(30000) }
      );

      // Poll for results with short timeout
      const result = await this.pollTestProbe(environmentId, jobId);

      // Analyze result
      const installed = result.testsFound > 0 || result.apiSuccess;
      const status: TestRunnerStatus = installed
        ? {
            installed: true,
            version: 'detected',
            detectionMethod: 'test_probe',
            checkedAt: new Date().toISOString()
          }
        : {
            installed: false,
            detectionMethod: 'test_probe',
            checkedAt: new Date().toISOString()
          };

      // Cache the result
      const cacheDurationMs = this.config.get('testRunner.statusCacheDurationMs', 300000);
      this.statusCache.set(environmentId, {
        status,
        expiresAt: Date.now() + cacheDurationMs
      });

      return status;
    } catch (error) {
      this.logger.warn('Test probe failed, assuming Test Runner not installed', {
        details: {
          environmentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // On error, assume not installed
      return {
        installed: false,
        detectionMethod: 'test_probe',
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Install Test Runner on the target environment
   *
   * Workflow:
   * 1. Ensure symbols are available
   * 2. Compile the Test Runner app
   * 3. Publish to the environment
   * 4. Verify installation
   *
   * @param environmentId - Environment ID to install to
   * @returns Installation result
   */
  async installTestRunner(environmentId: string): Promise<InstallResult> {
    const startTime = Date.now();

    const sourcePath = this.config.get(
      'testRunner.sourcePath',
      TestRunnerInfrastructureService.DEFAULT_SOURCE_PATH
    );

    // Verify source path exists
    try {
      await fs.access(sourcePath);
    } catch {
      throw new TestRunnerInfrastructureError(
        `Test Runner source path does not exist: ${sourcePath}`,
        'compilation',
        { sourcePath }
      );
    }

    // Step 1: Ensure symbols are available
    await this.ensureSymbolsAvailable(environmentId, sourcePath);

    // Step 2: Compile the Test Runner app
    const compilation = await this.compileTestRunnerApp(sourcePath);

    if (!compilation.success) {
      return {
        success: false,
        compilation,
        publication: { success: false, status: 'skipped' },
        elapsedMs: Date.now() - startTime
      };
    }

    // Step 3: Publish to environment
    const publication = await this.publishTestRunnerApp(
      environmentId,
      compilation.appPath
    );

    return {
      success: compilation.success && publication.success,
      compilation,
      publication,
      elapsedMs: Date.now() - startTime
    };
  }

  /**
   * Poll test probe for results
   *
   * @param environmentId - Environment ID
   * @param jobId - Test job ID
   * @returns Probe results
   */
  private async pollTestProbe(
    environmentId: string,
    jobId: string
  ): Promise<{ testsFound: number; apiSuccess: boolean }> {
    const maxAttempts = 15;
    let attempts = 0;
    let delayMs = 2000;

    while (attempts < maxAttempts) {
      await this.delay(delayMs);

      try {
        const result = await this.demoPortalClient.getTestResultsXml(
          environmentId,
          jobId,
          { signal: AbortSignal.timeout(10000) }
        );

        if (result.statusCode === 200 && result.xml) {
          // Parse XML to count tests
          const testCountMatch = result.xml.match(/<testcase/g);
          const testsFound = testCountMatch ? testCountMatch.length : 0;

          return { testsFound, apiSuccess: true };
        }
      } catch {
        // Continue polling
      }

      attempts++;
      delayMs = Math.min(delayMs * 1.5, 10000);
    }

    return { testsFound: 0, apiSuccess: false };
  }

  /**
   * Ensure symbols are available for compilation
   *
   * Downloads required dependencies from the BC environment.
   *
   * @param environmentId - Environment ID
   * @param projectPath - Path to the Test Runner project
   */
  private async ensureSymbolsAvailable(
    environmentId: string,
    projectPath: string
  ): Promise<void> {
    const packagesPath = path.join(projectPath, '.alpackages');

    // Create packages directory if it doesn't exist
    await fs.mkdir(packagesPath, { recursive: true });

    // Read app.json to get dependencies
    const appJsonPath = path.join(projectPath, 'app.json');
    const appJsonContent = await fs.readFile(appJsonPath, 'utf-8');
    const appJson = JSON.parse(appJsonContent);

    // Get environment details for symbol download
    const environment = await this.demoPortalClient.getEnvironmentRaw(environmentId);
    const environmentUrl = (environment as { url?: string }).url ?? '';

    if (!environmentUrl) {
      this.logger.warn('Environment URL not available, skipping symbol download', {
        details: { environmentId }
      });
      return;
    }

    // Get credentials for symbol download
    const auth = await this.credentialsService.getDeveloperEndpointAuth({
      id: environmentId,
      authenticationMethod: (environment as { authenticationMethod?: string }).authenticationMethod
    });

    // Download platform dependencies
    const platformVersion = appJson.platform || '23.0.0.0';
    const platformDeps = [
      { name: 'System', publisher: 'Microsoft', version: platformVersion, id: '8874ed3a-0643-4247-9ced-7a7002f7135d' },
      { name: 'Application', publisher: 'Microsoft', version: platformVersion, id: '00000000-0000-0000-0000-000000000000' }
    ];

    // Download app dependencies (including Test Runner from Microsoft)
    const dependencies = appJson.dependencies || [];

    const allDeps = [...platformDeps, ...dependencies];

    for (const dep of allDeps) {
      try {
        await this.downloadSymbol(environmentUrl, auth.authorization, dep, packagesPath);
      } catch (error) {
        this.logger.warn(`Failed to download symbol: ${dep.publisher}_${dep.name}`, {
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }
  }

  /**
   * Download a symbol from the BC environment
   *
   * @param environmentUrl - Environment URL
   * @param authorization - Authorization header value
   * @param dep - Dependency to download
   * @param packagesPath - Path to save the symbol
   */
  private async downloadSymbol(
    environmentUrl: string,
    authorization: string,
    dep: { name: string; publisher: string; version: string; id?: string },
    packagesPath: string
  ): Promise<void> {
    // Check if already downloaded
    const existingFiles = await fs.readdir(packagesPath);
    const pattern = `${dep.publisher}_${dep.name}_`;
    if (existingFiles.some(f => f.startsWith(pattern))) {
      this.logger.debug(`Symbol already exists: ${dep.publisher}_${dep.name}`);
      return;
    }

    // Build download URL
    let url = `${environmentUrl.replace(/\/$/, '')}/dev/packages?publisher=${encodeURIComponent(dep.publisher)}&appName=${encodeURIComponent(dep.name)}&versionText=${dep.version}`;
    if (dep.id) {
      url += `&appId=${dep.id}`;
    }

    this.logger.info(`Downloading symbol: ${dep.publisher}_${dep.name}`, {
      details: { version: dep.version }
    });

    try {
      const response = await axios({
        method: 'get',
        url,
        headers: {
          Authorization: authorization,
          Accept: 'application/octet-stream'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: !this.config.get('auth.allowInsecureCertificates', false)
        }),
        responseType: 'arraybuffer',
        timeout: 60000
      });

      // Extract filename from content-disposition
      const contentDisposition = response.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = filenameMatch
        ? filenameMatch[1].replace(/['"]/g, '')
        : `${dep.publisher}_${dep.name}_${dep.version}.app`;

      const filePath = path.join(packagesPath, filename);
      await fs.writeFile(filePath, Buffer.from(response.data));

      this.logger.info(`Downloaded symbol: ${filename}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn(`Symbol not found: ${dep.publisher}_${dep.name}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Compile the Test Runner app
   *
   * @param projectPath - Path to the Test Runner project
   * @returns Compilation result
   */
  private async compileTestRunnerApp(projectPath: string): Promise<{
    success: boolean;
    appPath: string;
    diagnostics: Array<{
      file: string;
      line: number;
      column: number;
      severity: 'error' | 'warning';
      code: string;
      message: string;
    }>;
  }> {
    this.logger.info('Compiling Test Runner app', { details: { projectPath } });

    // Verify AL CLI tools
    const toolCheck = await this.executeCommand('dotnet tool list -g');
    if (!toolCheck.stdout.includes('microsoft.dynamics.businesscentral.development.tools')) {
      throw new TestRunnerInfrastructureError(
        'AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools',
        'compilation'
      );
    }

    // Read app.json
    const appJsonPath = path.join(projectPath, 'app.json');
    const appJsonContent = await fs.readFile(appJsonPath, 'utf-8');
    const appJson = JSON.parse(appJsonContent);

    // Prepare output
    const outputDir = path.join(projectPath, 'build');
    await fs.mkdir(outputDir, { recursive: true });

    const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
    const outputPath = path.join(outputDir, appFileName);

    // Get analyzer path
    const analyzerPath = await this.getAnalyzerPath();

    // Build compile command (only CodeCop and UICop for test runner app)
    const analyzers = [
      path.join(analyzerPath, 'Microsoft.Dynamics.Nav.CodeCop.dll'),
      path.join(analyzerPath, 'Microsoft.Dynamics.Nav.UICop.dll')
    ];

    const args = [
      'compile',
      `/project:"${projectPath}"`,
      `/packagecachepath:"${path.join(projectPath, '.alpackages')}"`,
      `/out:"${outputPath}"`,
      `/analyzer:"${analyzers.join(';')}"`,
      '/continuebuildonerror:+'
    ];

    // Execute compilation
    return new Promise((resolve) => {
      const child = spawn('al', args, {
        cwd: projectPath,
        shell: true,
        windowsVerbatimArguments: true
      });

      const diagnostics: Array<{
        file: string;
        line: number;
        column: number;
        severity: 'error' | 'warning';
        code: string;
        message: string;
      }> = [];

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        this.parseDiagnostics(text, diagnostics);
      });

      child.stderr.on('data', () => {
        // Stderr is captured but not used - diagnostics parsed from stdout
      });

      child.on('error', (error: Error) => {
        resolve({
          success: false,
          appPath: '',
          diagnostics: [{
            file: 'compile',
            line: 0,
            column: 0,
            severity: 'error',
            code: 'COMPILE_START_FAILED',
            message: error.message
          }]
        });
      });

      child.on('exit', async (code: number | null) => {
        const hasErrors = diagnostics.some(d => d.severity === 'error');

        if (code !== 0 || hasErrors) {
          resolve({
            success: false,
            appPath: outputPath,
            diagnostics
          });
          return;
        }

        // Verify output exists
        try {
          await fs.access(outputPath);
          this.logger.info('Test Runner compilation successful', {
            details: { appPath: outputPath }
          });
          resolve({
            success: true,
            appPath: outputPath,
            diagnostics
          });
        } catch {
          resolve({
            success: false,
            appPath: outputPath,
            diagnostics: [{
              file: 'output',
              line: 0,
              column: 0,
              severity: 'error',
              code: 'OUTPUT_NOT_FOUND',
              message: 'Compilation completed but .app file was not created'
            }]
          });
        }
      });
    });
  }

  /**
   * Publish the Test Runner app to the environment
   *
   * @param environmentId - Environment ID
   * @param appPath - Path to the compiled .app file
   * @returns Publication result
   */
  private async publishTestRunnerApp(
    environmentId: string,
    appPath: string
  ): Promise<{ success: boolean; status: string }> {
    this.logger.info('Publishing Test Runner app', {
      details: { environmentId, appPath }
    });

    try {
      // Get environment details
      const environment = await this.demoPortalClient.getEnvironmentRaw(environmentId);
      const environmentUrl = (environment as { url?: string }).url ?? '';

      if (!environmentUrl) {
        throw new TestRunnerInfrastructureError(
          `Environment '${environmentId}' does not have a valid URL`,
          'publication',
          { environmentId }
        );
      }

      const authMethod = (environment as { authenticationMethod?: string }).authenticationMethod ?? 'NavUserPassword';
      const schemaUpdateMode = this.config.get('testRunner.schemaUpdateMode', 'forcesync') as 'synchronize' | 'recreate' | 'forcesync';

      // Publish using developer endpoint
      const result = await this.devEndpointClient.publishApp({
        appPath,
        appFileName: path.basename(appPath),
        environmentId,
        environmentUrl,
        authenticationMethod: authMethod,
        schemaUpdateMode
      });

      return {
        success: result.success,
        status: result.status
      };
    } catch (error) {
      this.logger.error('Test Runner publication failed', error as Error, {
        details: { environmentId }
      });

      return {
        success: false,
        status: error instanceof Error ? error.message : 'Publication failed'
      };
    }
  }

  /**
   * Get path to AL analyzer DLLs
   */
  private async getAnalyzerPath(): Promise<string> {
    const result = await this.executeCommand('dotnet tool list -g');
    const match = result.stdout.match(
      /microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d.-]+[a-z]*)/i
    );

    if (!match?.[1]) {
      throw new TestRunnerInfrastructureError(
        'Could not determine AL CLI tools version',
        'compilation'
      );
    }

    const version = match[1];
    const userProfile = process.env.USERPROFILE ?? process.env.HOME ?? '';

    return path.join(
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
  }

  /**
   * Execute a shell command
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
   */
  private parseDiagnostics(
    output: string,
    diagnostics: Array<{
      file: string;
      line: number;
      column: number;
      severity: 'error' | 'warning';
      code: string;
      message: string;
    }>
  ): void {
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
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
