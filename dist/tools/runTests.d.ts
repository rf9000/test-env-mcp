/**
 * MCP Tool: run_tests
 *
 * Phase 3: Test Execution
 *
 * Execute automated AL tests on a Business Central environment via Demo Portal API.
 * Supports filtering by codeunit/test method and optional code coverage collection.
 */
import { z } from 'zod';
import type { TestRunnerService } from '@/services/testRunnerService.js';
/**
 * Zod schema for run_tests input validation
 */
export declare const RunTestsInputSchema: z.ZodObject<{
    environmentId: z.ZodString;
    codeunitId: z.ZodOptional<z.ZodNumber>;
    testMethod: z.ZodOptional<z.ZodString>;
    includeCoverage: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    timeoutSeconds: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    environmentId: string;
    includeCoverage: boolean;
    timeoutSeconds: number;
    codeunitId?: number | undefined;
    testMethod?: string | undefined;
}, {
    environmentId: string;
    codeunitId?: number | undefined;
    testMethod?: string | undefined;
    includeCoverage?: boolean | undefined;
    timeoutSeconds?: number | undefined;
}>;
export type RunTestsInput = z.infer<typeof RunTestsInputSchema>;
/**
 * MCP Tool Definition for run_tests
 */
export declare const runTestsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            environmentId: {
                type: string;
                description: string;
            };
            codeunitId: {
                type: string;
                description: string;
            };
            testMethod: {
                type: string;
                description: string;
            };
            includeCoverage: {
                type: string;
                description: string;
            };
            timeoutSeconds: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
/**
 * Execute the run_tests tool
 *
 * @param testRunnerService - Test runner service instance
 * @param input - Validated input from MCP client
 * @returns Test execution results or error response
 */
export declare function executeRunTests(testRunnerService: TestRunnerService, input: unknown): Promise<unknown>;
//# sourceMappingURL=runTests.d.ts.map