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
import { z } from 'zod';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { DeveloperEndpointClient } from '@/api/developerEndpointClient.js';
/**
 * Schema for app.json validation
 */
declare const AppJsonSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    publisher: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    version: string;
    publisher: string;
}, {
    name: string;
    id: string;
    version: string;
    publisher: string;
}>;
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
}
/**
 * Service for compiling AL code and publishing to BC
 *
 * Responsibilities:
 * - Verify AL CLI tools installation
 * - Compile AL projects using `al compile`
 * - Parse compiler diagnostics
 * - Orchestrate compile → get environment → publish workflow
 */
export declare class CompilationService {
    private readonly demoPortalClient;
    private readonly devEndpointClient;
    constructor(demoPortalClient: DemoPortalClient, devEndpointClient: DeveloperEndpointClient);
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
    compileAndPublish(params: CompileAndPublishParams): Promise<CompileAndPublishResult>;
    /**
     * Verify AL CLI tools are installed
     *
     * Checks that `microsoft.dynamics.businesscentral.development.tools` is installed
     * using `dotnet tool list -g`.
     *
     * @throws {ValidationError} If AL CLI tools not found
     */
    private verifyAlCliTools;
    /**
     * Get path to AL analyzer DLLs
     *
     * Resolves path based on installed version:
     * Windows: ~/.dotnet/tools/.store/microsoft.dynamics.businesscentral.development.tools/{version}/...
     *
     * @returns Base path to analyzer DLLs
     * @throws {ValidationError} If version cannot be determined or path doesn't exist
     */
    private getAnalyzerPath;
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
    private compile;
    /**
     * Execute a shell command and capture output
     *
     * @param command - Command to execute
     * @returns stdout and stderr
     * @throws {Error} If command fails
     */
    private executeCommand;
    /**
     * Parse diagnostics from AL compiler output
     *
     * Pattern: file(line,column): severity code: message
     * Example: HelloWorld.al(10,5): error AL0118: The name 'Foo' does not exist
     *
     * @param output - Compiler output text
     * @param diagnostics - Array to append diagnostics to
     */
    private parseDiagnostics;
    /**
     * Check if a file exists
     *
     * @param filePath - Path to check
     * @returns true if file exists, false otherwise
     */
    private fileExists;
}
export {};
//# sourceMappingURL=compilationService.d.ts.map