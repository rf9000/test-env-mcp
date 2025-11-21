import { z } from 'zod';
import { TestRegistry } from '../testRegistry.js';
import { Logger } from '../logger.js';
import * as path from 'path';

/**
 * Input schema for list_tests tool
 */
export const ListTestsInputSchema = z.object({
  workspacePath: z.string().optional().describe('Path to the workspace containing AL test files. If not provided, uses current working directory.'),
  forceRefresh: z.boolean().optional().default(false).describe('Force a fresh scan of test files, bypassing cache'),
  includeDetails: z.boolean().optional().default(true).describe('Include test method details in the output'),
  filter: z.string().optional().describe('Optional filter to search for specific test codeunit names')
});

export type ListTestsInput = z.infer<typeof ListTestsInputSchema>;

/**
 * Tool definition for list_tests
 */
export const listTestsToolDefinition = {
  name: 'list_tests',
  description: 'List all test codeunits and their test methods found in the AL workspace by scanning source files',
  inputSchema: {
    type: 'object',
    properties: {
      workspacePath: {
        type: 'string',
        description: 'Path to the workspace containing AL test files. If not provided, uses current working directory.'
      },
      forceRefresh: {
        type: 'boolean',
        description: 'Force a fresh scan of test files, bypassing cache',
        default: false
      },
      includeDetails: {
        type: 'boolean',
        description: 'Include test method details in the output',
        default: true
      },
      filter: {
        type: 'string',
        description: 'Optional filter to search for specific test codeunit names'
      }
    },
    required: []
  }
};

/**
 * Result type for list_tests
 */
export interface ListTestsResult {
  type: 'success' | 'error';
  workspacePath: string;
  totalCodeunits: number;
  totalTests: number;
  testCodeunits?: Array<{
    id: number;
    name: string;
    path: string;
    testCount: number;
    testMethods?: Array<{
      name: string;
      lineNumber: number;
    }>;
  }>;
  message?: string;
  cached?: boolean;
  scanDuration?: number;
}

/**
 * Execute list_tests tool
 */
export async function executeListTests(
  registry: TestRegistry,
  input: unknown
): Promise<ListTestsResult> {
  const logger = new Logger('ListTestsTool');
  const startTime = Date.now();

  try {
    // Validate input
    const params = ListTestsInputSchema.parse(input || {});

    // Determine workspace path
    const workspacePath = params.workspacePath
      ? path.resolve(params.workspacePath)
      : process.cwd();

    logger.info(`Listing tests in workspace: ${workspacePath}`);
    logger.info(`Options: forceRefresh=${params.forceRefresh}, includeDetails=${params.includeDetails}`);

    // Get test codeunits from registry
    const testCodeunits = await registry.getTestCodeunits(workspacePath, params.forceRefresh);

    // Apply filter if provided
    let filteredCodeunits = testCodeunits;
    if (params.filter) {
      logger.info(`Applying filter: ${params.filter}`);
      const lowerFilter = params.filter.toLowerCase();
      filteredCodeunits = testCodeunits.filter(tc =>
        tc.file.object.name.toLowerCase().includes(lowerFilter)
      );
    }

    // Build result
    const result: ListTestsResult = {
      type: 'success',
      workspacePath: workspacePath,
      totalCodeunits: filteredCodeunits.length,
      totalTests: filteredCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0),
      testCodeunits: filteredCodeunits.map(tc => {
        const testMethods = params.includeDetails
          ? tc.testMethods.map(tm => ({
              name: tm.name,
              lineNumber: tm.lineNumber
            }))
          : undefined;

        return {
          id: tc.file.object.id,
          name: tc.file.object.name,
          path: tc.file.path,
          testCount: tc.testMethods.length,
          ...(testMethods && { testMethods })
        };
      }),
      cached: !params.forceRefresh,
      scanDuration: Date.now() - startTime
    };

    // Log summary
    logger.info(`Found ${result.totalCodeunits} test codeunits with ${result.totalTests} tests`);
    if (params.filter && filteredCodeunits.length !== testCodeunits.length) {
      logger.info(`Filter reduced from ${testCodeunits.length} to ${filteredCodeunits.length} codeunits`);
    }

    return result;

  } catch (error) {
    logger.error(`Failed to list tests: ${error}`);

    return {
      type: 'error',
      workspacePath: process.cwd(),
      totalCodeunits: 0,
      totalTests: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      scanDuration: Date.now() - startTime
    };
  }
}

/**
 * Create a formatted test list report
 */
export function formatTestListReport(result: ListTestsResult): string {
  let report = '';

  if (result.type === 'error') {
    report = `❌ Error listing tests: ${result.message}\n`;
    return report;
  }

  // Header
  report += '═══════════════════════════════════════════════════════\n';
  report += '                    TEST DISCOVERY REPORT                \n';
  report += '═══════════════════════════════════════════════════════\n\n';

  // Summary
  report += `📁 Workspace: ${result.workspacePath}\n`;
  report += `📊 Total Codeunits: ${result.totalCodeunits}\n`;
  report += `🧪 Total Tests: ${result.totalTests}\n`;
  report += `⏱️  Scan Duration: ${result.scanDuration}ms\n`;
  report += `💾 From Cache: ${result.cached ? 'Yes' : 'No'}\n\n`;

  // Test codeunits
  if (result.testCodeunits && result.testCodeunits.length > 0) {
    report += '─────────────────────────────────────────────────────────\n';
    report += '                     TEST CODEUNITS                      \n';
    report += '─────────────────────────────────────────────────────────\n\n';

    for (const tc of result.testCodeunits) {
      report += `📦 Codeunit ${tc.id} "${tc.name}"\n`;
      report += `   📍 Path: ${tc.path}\n`;
      report += `   🧪 Tests: ${tc.testCount}\n`;

      if (tc.testMethods && tc.testMethods.length > 0) {
        report += `   📝 Methods:\n`;
        for (const method of tc.testMethods) {
          report += `      • ${method.name} (line ${method.lineNumber})\n`;
        }
      }
      report += '\n';
    }
  } else {
    report += '⚠️  No test codeunits found in workspace\n\n';
    report += 'Possible reasons:\n';
    report += '• No AL files with Subtype = Test\n';
    report += '• Workspace path is incorrect\n';
    report += '• Test files are in a different location\n';
  }

  return report;
}