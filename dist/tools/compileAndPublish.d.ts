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
/**
 * Zod schema for compile_and_publish input validation
 */
export declare const CompileAndPublishInputSchema: z.ZodObject<{
    workspacePath: z.ZodString;
    environmentId: z.ZodString;
    packageCachePath: z.ZodOptional<z.ZodString>;
    rulesetPath: z.ZodOptional<z.ZodString>;
    schemaUpdateMode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["synchronize", "recreate", "forcesync"]>>>;
}, "strict", z.ZodTypeAny, {
    environmentId: string;
    schemaUpdateMode: "synchronize" | "recreate" | "forcesync";
    workspacePath: string;
    packageCachePath?: string | undefined;
    rulesetPath?: string | undefined;
}, {
    environmentId: string;
    workspacePath: string;
    schemaUpdateMode?: "synchronize" | "recreate" | "forcesync" | undefined;
    packageCachePath?: string | undefined;
    rulesetPath?: string | undefined;
}>;
export type CompileAndPublishInput = z.infer<typeof CompileAndPublishInputSchema>;
/**
 * MCP Tool Definition for compile_and_publish
 */
export declare const compileAndPublishToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            workspacePath: {
                type: string;
                description: string;
            };
            environmentId: {
                type: string;
                description: string;
            };
            packageCachePath: {
                type: string;
                description: string;
            };
            rulesetPath: {
                type: string;
                description: string;
            };
            schemaUpdateMode: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
/**
 * Execute the compile_and_publish tool
 *
 * @param compilationService - Compilation service instance
 * @param input - Validated input from MCP client
 * @returns Compilation and publishing results or error response
 */
export declare function executeCompileAndPublish(compilationService: CompilationService, input: unknown): Promise<unknown>;
//# sourceMappingURL=compileAndPublish.d.ts.map