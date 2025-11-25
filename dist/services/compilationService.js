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
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { CompileError, ValidationError } from '@/errors/errors.js';
/**
 * Schema for app.json validation
 */
const AppJsonSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    publisher: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/)
});
/**
 * Service for compiling AL code and publishing to BC
 *
 * Responsibilities:
 * - Verify AL CLI tools installation
 * - Compile AL projects using `al compile`
 * - Parse compiler diagnostics
 * - Orchestrate compile → get environment → publish workflow
 */
export class CompilationService {
    demoPortalClient;
    devEndpointClient;
    constructor(demoPortalClient, devEndpointClient) {
        this.demoPortalClient = demoPortalClient;
        this.devEndpointClient = devEndpointClient;
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
    async compileAndPublish(params) {
        // Phase 1: Verify AL CLI tools are installed
        await this.verifyAlCliTools();
        // Phase 2: Compile AL project
        const compileResult = await this.compile({
            projectPath: params.workspacePath,
            packageCachePath: params.packageCachePath ?? path.join(params.workspacePath, '.alpackages'),
            rulesetPath: params.rulesetPath
        });
        // Phase 3: Get environment details from Demo Portal
        const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(params.environmentId);
        // Extract environment URL (handle different possible field names)
        const environmentUrl = environmentResponse.url ??
            environmentResponse.serverInstance ??
            '';
        if (!environmentUrl) {
            throw new ValidationError(`Environment '${params.environmentId}' does not have a valid URL. Cannot publish app.`, { environmentId: params.environmentId });
        }
        const authMethod = environmentResponse.authenticationMethod ?? 'NavUserPassword';
        // Phase 4: Publish to Developer Endpoint
        const publishResult = await this.devEndpointClient.publishApp({
            appPath: compileResult.appPath,
            appFileName: path.basename(compileResult.appPath),
            environmentId: params.environmentId,
            environmentUrl,
            authenticationMethod: authMethod,
            schemaUpdateMode: params.schemaUpdateMode ?? 'synchronize'
        });
        return {
            type: 'compile_and_publish_result',
            compile: compileResult,
            publish: publishResult,
            fetchedAt: new Date().toISOString()
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
    async verifyAlCliTools() {
        const result = await this.executeCommand('dotnet tool list -g');
        if (!result.stdout.includes('microsoft.dynamics.businesscentral.development.tools')) {
            throw new ValidationError('AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools', {
                command: 'dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools',
                documentation: 'https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview'
            });
        }
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
    async getAnalyzerPath() {
        // Get AL CLI tool version
        const result = await this.executeCommand('dotnet tool list -g');
        const match = result.stdout.match(/microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d\.-]+[a-z]*)/i);
        if (!match || !match[1]) {
            throw new ValidationError('Could not determine AL CLI tools version', {
                hint: 'Run "dotnet tool list -g" manually to verify installation'
            });
        }
        const version = match[1];
        const userProfile = process.env.USERPROFILE ?? process.env.HOME ?? '';
        // Only Windows is supported for AL compilation
        if (process.platform !== 'win32') {
            throw new ValidationError('AL compilation is only supported on Windows. Use a Windows host or Windows container.', { platform: process.platform });
        }
        const analyzerPath = path.join(userProfile, '.dotnet', 'tools', '.store', 'microsoft.dynamics.businesscentral.development.tools', version, 'microsoft.dynamics.businesscentral.development.tools', version, 'lib', 'net8.0', 'win-x64');
        return analyzerPath;
    }
    /**
     * Compile AL project
     *
     * Executes `al compile` with:
     * - All three analyzers (CodeCop, AppSourceCop, UICop)
     * - Continue build on error flag
     * - Optional ruleset
     *
     * @param params - Compilation parameters
     * @returns Compilation result with diagnostics
     * @throws {CompileError} If compilation fails
     * @throws {ValidationError} If app.json invalid or output not created
     */
    async compile(params) {
        // Read and validate app.json
        const appJsonPath = path.join(params.projectPath, 'app.json');
        const appJsonContent = await fs.readFile(appJsonPath, 'utf-8');
        const appJson = AppJsonSchema.parse(JSON.parse(appJsonContent));
        // Prepare output directory and filename
        const outputDir = path.join(params.projectPath, 'build');
        await fs.mkdir(outputDir, { recursive: true });
        const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
        const outputPath = path.join(outputDir, appFileName);
        // Get analyzer path
        const analyzerBasePath = await this.getAnalyzerPath();
        const analyzers = [
            path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.CodeCop.dll'),
            path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.AppSourceCop.dll'),
            path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.UICop.dll')
        ];
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
            const diagnostics = [];
            child.stdout.on('data', (data) => {
                const text = data.toString();
                stdout += text;
                this.parseDiagnostics(text, diagnostics);
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('error', (error) => {
                reject(new CompileError(`Failed to start AL compiler: ${error.message}. Ensure AL CLI tools are installed.`, []));
            });
            child.on('exit', async (code) => {
                // With /continuebuildonerror:+, exit code 0 even with errors
                // Check for actual compilation failure vs warnings
                const hasErrors = diagnostics.some((d) => d.severity === 'error');
                if (code !== 0 && hasErrors) {
                    reject(new CompileError(`Compilation failed with ${diagnostics.filter((d) => d.severity === 'error').length} errors`, diagnostics, { exitCode: code, stdout, stderr }));
                    return;
                }
                // Verify output exists
                try {
                    const stats = await fs.stat(outputPath);
                    resolve({
                        success: true,
                        appPath: outputPath,
                        appSize: stats.size,
                        app: appJson,
                        diagnostics,
                        compilerOutput: stdout
                    });
                }
                catch {
                    reject(new CompileError('Compilation command completed but .app file was not created', diagnostics));
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
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, [], { shell: true });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Command failed with exit code ${code ?? 'null'}: ${stderr}`));
                }
                else {
                    resolve({ stdout, stderr });
                }
            });
            child.on('error', (error) => {
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
    parseDiagnostics(output, diagnostics) {
        const lines = output.split('\n');
        const diagnosticPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)$/;
        for (const line of lines) {
            const match = diagnosticPattern.exec(line.trim());
            if (match && match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
                diagnostics.push({
                    file: match[1],
                    line: parseInt(match[2]),
                    column: parseInt(match[3]),
                    severity: match[4],
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
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=compilationService.js.map