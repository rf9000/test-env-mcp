/**
 * Diagnose Tests Tool
 *
 * MCP tool for troubleshooting test execution issues.
 * Helps identify why tests might not be running or returning 0 results.
 *
 * This tool:
 * - Runs tests without any filter to see all available tests
 * - Runs tests with the specified filter to compare results
 * - Provides analysis and recommendations
 * - Shows the exact API parameters being sent
 */

import { z } from 'zod';
import type { TestRunnerService } from '@/services/testRunnerService.js';

/**
 * Input schema for the diagnose tests tool
 */
export const DiagnoseTestsInputSchema = z.object({
  environmentId: z.string().describe('The ID of the environment to diagnose'),
  codeunitId: z
    .number()
    .optional()
    .describe('Optional codeunit ID to test filtering'),
  verbose: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include detailed API request/response logs')
});

export type DiagnoseTestsInput = z.infer<typeof DiagnoseTestsInputSchema>;

/**
 * Diagnose test execution issues
 */
export class DiagnoseTestsTool {
  constructor(private readonly testRunnerService: TestRunnerService) {}

  /**
   * Execute the diagnostic
   */
  async execute(input: unknown): Promise<any> {
    // Validate input
    const params = DiagnoseTestsInputSchema.parse(input);

    try {
      // Enable verbose logging if requested
      if (params.verbose) {
        process.env.LOG_LEVEL = 'debug';
      }

      // Run diagnostics
      const diagnosticResults = await this.testRunnerService.runTestDiagnostics(
        params.environmentId,
        params.codeunitId
      );

      // Format the results for clear presentation
      const formatted = {
        type: 'diagnose_tests_result',
        environmentId: params.environmentId,
        diagnostics: {
          testsWithoutFilter: {
            found: diagnosticResults.withoutFilter.summary.total,
            passed: diagnosticResults.withoutFilter.summary.passed,
            failed: diagnosticResults.withoutFilter.summary.failed,
            message:
              diagnosticResults.withoutFilter.summary.total > 0
                ? `Found ${diagnosticResults.withoutFilter.summary.total} tests when running without filter`
                : 'NO TESTS FOUND in environment. This confirms the test app is NOT published. Action required: Run compile_and_publish to publish your test app.'
          },
          testsWithFilter: params.codeunitId
            ? {
                codeunitId: params.codeunitId,
                found: diagnosticResults.withFilter?.summary.total ?? 0,
                message:
                  diagnosticResults.withFilter?.summary.total ?? 0 > 0
                    ? `Found ${diagnosticResults.withFilter?.summary.total} tests for codeunit ${params.codeunitId}`
                    : `No tests found for codeunit ${params.codeunitId}. Either the codeunit doesn't exist in the published app, it's not a test codeunit (missing Subtype = Test), or the API filtering is not working correctly.`
              }
            : undefined,
          analysis: diagnosticResults.analysis,
          recommendations: diagnosticResults.analysis.recommendations
        },
        troubleshooting: {
          steps: [
            '1. Use check_test_app_status tool to verify compilation and publication status',
            '2. If app not published, run compile_and_publish to publish test app',
            '3. Check logs above for exact API parameters being sent',
            '4. Verify codeunit ID is correct and exists in the published app',
            '5. Ensure test codeunit has Subtype = Test and methods have [Test] attribute',
            '6. Confirm environment is in Running state before testing'
          ],
          nextActions: this.getNextActions(diagnosticResults)
        }
      };

      return formatted;
    } catch (error) {
      return {
        type: 'error',
        kind: 'diagnostic_error',
        message: error instanceof Error ? error.message : String(error),
        remediation: 'Check environment status and ensure it is running'
      };
    }
  }

  private getNextActions(diagnosticResults: any): string[] {
    const actions: string[] = [];

    if (diagnosticResults.analysis.totalTestsAvailable === 0) {
      actions.push('Use compile_and_publish tool to deploy your test app');
      actions.push('Verify test runner codeunit is installed in the environment');
    } else if (diagnosticResults.withFilter?.summary.total === 0) {
      actions.push('Try running with TEST_MINIMAL_PARAMS=true environment variable');
      actions.push('Check the XML response to see which codeunits are actually available');
      actions.push('Consider running tests without filter and parsing results client-side');
    } else {
      actions.push('Tests are working correctly!');
    }

    return actions;
  }
}