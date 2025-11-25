/**
 * MCP Tool: run_tests
 *
 * Phase 3: Test Execution
 *
 * Execute automated AL tests on a Business Central environment via Demo Portal API.
 * Supports filtering by codeunit/test method and optional code coverage collection.
 */
import { z } from 'zod';
import { AppError, NotFoundError, TimeoutError } from '@/errors/errors.js';
/**
 * Zod schema for run_tests input validation
 */
export const RunTestsInputSchema = z
    .object({
    environmentId: z
        .string()
        .min(1, 'environmentId is required')
        .describe('The ID of the environment to run tests on'),
    codeunitId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Optional codeunit ID to filter tests (e.g., 50100)'),
    testMethod: z
        .string()
        .optional()
        .describe('Optional test method name to run specific test (e.g., "TestCreateCustomer")'),
    includeCoverage: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to collect code coverage data (default: false). Note: Increases execution time.'),
    timeoutSeconds: z
        .number()
        .int()
        .min(10, 'Timeout must be at least 10 seconds')
        .max(3600, 'Timeout cannot exceed 3600 seconds (1 hour)')
        .optional()
        .default(600)
        .describe('Maximum time to wait for test completion in seconds (default: 600 = 10 minutes)')
})
    .strict();
/**
 * MCP Tool Definition for run_tests
 */
export const runTestsToolDefinition = {
    name: 'run_tests',
    description: `Execute automated AL tests on a Business Central environment.

**Purpose:**
Run automated tests on a Business Central environment via Demo Portal API. Tests are executed asynchronously - the tool submits the test job, polls for completion, and returns results with pass/fail details and optional code coverage.

**When to Use:**
- Execute all tests in an environment (no filters)
- Run tests from a specific test codeunit (codeunitId filter)
- Run a single test method (codeunitId + testMethod filters)
- Collect code coverage metrics (includeCoverage: true)
- Verify app functionality after deployment
- Validate changes during development

**Parameters:**
- environmentId (required): Environment ID from list_environments
- codeunitId (optional): Filter to specific test codeunit (e.g., 50100)
- testMethod (optional): Run single test method (requires codeunitId)
- includeCoverage (optional): Collect code coverage data (default: false)
- timeoutSeconds (optional): Max wait time in seconds (default: 600)

**Response Format:**
Returns structured JSON with:
- job: Job metadata (jobId, timing, duration)
- summary: Test totals (total, passed, failed, skipped, duration)
- failures: Array of test failures with details (only if failed > 0)
- coverage: Code coverage summary and per-object breakdown (if includeCoverage: true)

**Examples:**

Example 1: Run all tests
\`\`\`json
{
  "environmentId": "abc-123"
}
\`\`\`

Example 2: Run specific test codeunit
\`\`\`json
{
  "environmentId": "abc-123",
  "codeunitId": 50100
}
\`\`\`

Example 3: Run single test with coverage
\`\`\`json
{
  "environmentId": "abc-123",
  "codeunitId": 50100,
  "testMethod": "TestCreateCustomer",
  "includeCoverage": true
}
\`\`\`

Example 4: Run with extended timeout
\`\`\`json
{
  "environmentId": "abc-123",
  "timeoutSeconds": 1200
}
\`\`\`

**Response Example (Success):**
\`\`\`json
{
  "type": "run_tests_result",
  "environmentId": "abc-123",
  "job": {
    "jobId": "12345",
    "submittedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "elapsedMs": 135000
  },
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "skipped": 0,
    "durationSec": 120.5
  },
  "failures": [
    {
      "suite": "Customer Management Tests",
      "test": "TestCreateCustomer",
      "message": "Expected: 1, Actual: 0",
      "details": "Customer was not created...",
      "timeSec": 1.2
    }
  ]
}
\`\`\`

**Error Handling:**

- NOT_FOUND: Environment doesn't exist → Use list_environments to find valid IDs
- TIMEOUT_ERROR: Tests exceeded timeout → Increase timeoutSeconds or check environment status
- NETWORK_ERROR: API connection failed → Retry after brief delay
- AUTH_ERROR: Invalid credentials → Verify DEMO_PORTAL_TOKEN

**Performance Notes:**
- Typical test suite: 2-5 minutes
- With coverage: +30-50% execution time
- Polling starts at 2s, backs off to max 30s
- Use timeoutSeconds appropriately for large test suites

**Best Practices:**
1. Start without coverage for faster feedback
2. Use filters (codeunitId/testMethod) during development
3. Run full test suite before deployment
4. Set longer timeout for comprehensive test suites
5. Check environment is 'Running' before executing tests
6. Parse failures array for debugging information`,
    inputSchema: {
        type: 'object',
        properties: {
            environmentId: {
                type: 'string',
                description: 'The ID of the environment to run tests on'
            },
            codeunitId: {
                type: 'number',
                description: 'Optional codeunit ID to filter tests (e.g., 50100)'
            },
            testMethod: {
                type: 'string',
                description: 'Optional test method name to run specific test (e.g., "TestCreateCustomer")'
            },
            includeCoverage: {
                type: 'boolean',
                description: 'Whether to collect code coverage data (default: false). Note: Increases execution time.'
            },
            timeoutSeconds: {
                type: 'number',
                description: 'Maximum time to wait for test completion in seconds (default: 600 = 10 minutes)'
            }
        },
        required: ['environmentId']
    }
};
/**
 * Execute the run_tests tool
 *
 * @param testRunnerService - Test runner service instance
 * @param input - Validated input from MCP client
 * @returns Test execution results or error response
 */
export async function executeRunTests(testRunnerService, input) {
    try {
        // Validate input
        const validated = RunTestsInputSchema.parse(input);
        // Execute tests
        const result = await testRunnerService.runTests({
            environmentId: validated.environmentId,
            codeunitId: validated.codeunitId,
            testMethod: validated.testMethod,
            includeCoverage: validated.includeCoverage,
            timeoutSeconds: validated.timeoutSeconds
        });
        return result;
    }
    catch (error) {
        if (error instanceof AppError) {
            return {
                type: 'error',
                kind: error.code.toLowerCase(),
                message: error.message,
                retryable: error.retryable,
                details: error.details,
                remediation: getRemediation(error)
            };
        }
        // Re-throw unexpected errors
        throw error;
    }
}
/**
 * Get remediation guidance for common errors
 *
 * @param error - Application error
 * @returns Actionable remediation steps
 */
function getRemediation(error) {
    if (error instanceof NotFoundError) {
        return 'Environment not found. Use list_environments to see available environments.';
    }
    if (error instanceof TimeoutError) {
        return ('Test execution timed out. Possible solutions:\n' +
            '1. Increase timeoutSeconds parameter\n' +
            '2. Check environment status with get_environment\n' +
            '3. Verify environment is running and not overloaded\n' +
            '4. Try running smaller test subset with codeunitId filter');
    }
    switch (error.code) {
        case 'AUTH_ERROR':
            return 'Verify DEMO_PORTAL_TOKEN is valid and has necessary permissions.';
        case 'RATE_LIMIT':
            return `Wait ${error.retryAfter ?? 60} seconds before retrying.`;
        case 'NETWORK_ERROR':
            return 'Check network connection and API availability. Retry after brief delay.';
        case 'VALIDATION_ERROR':
            return 'Check input parameters match schema requirements.';
        default:
            return 'Check error details and try again.';
    }
}
//# sourceMappingURL=runTests.js.map