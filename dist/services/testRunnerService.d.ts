/**
 * Test Runner Service
 *
 * Phase 3: Test Execution
 *
 * Handles Business Central test execution via Demo Portal API:
 * - Submits test jobs with optional filtering (codeunit/test method)
 * - Polls for completion with exponential backoff and jitter
 * - Parses XML test results (JUnit format)
 * - Parses CSV code coverage data
 * - Supports cancellation via AbortSignal
 */
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { ConfigurationService } from '@/services/configurationService.js';
/**
 * Parameters for running tests
 */
export interface RunTestsParams {
    /** Environment ID to run tests on */
    environmentId: string;
    /** Optional codeunit ID to filter tests */
    codeunitId?: number | undefined;
    /** Optional test method name to filter tests */
    testMethod?: string | undefined;
    /** Whether to include code coverage data (default: false) */
    includeCoverage?: boolean | undefined;
    /** Timeout in seconds (default: 600 = 10 minutes) */
    timeoutSeconds?: number | undefined;
    /** Cancellation signal */
    signal?: AbortSignal | undefined;
}
/**
 * Result of running tests
 */
export interface RunTestsResult {
    type: 'run_tests_result';
    environmentId: string;
    job: {
        jobId: string;
        submittedAt: string;
        completedAt: string;
        elapsedMs: number;
    };
    summary: TestSummary;
    failures: TestFailure[];
    coverage?: CoverageSummary | undefined;
    fetchedAt: string;
}
/**
 * Summary of test results
 */
export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationSec: number;
}
/**
 * Individual test failure details
 */
export interface TestFailure {
    suite: string;
    test: string;
    classname?: string | undefined;
    message: string;
    details?: string | undefined;
    timeSec: number;
}
/**
 * Code coverage summary
 */
export interface CoverageSummary {
    summary: {
        linesCovered: number;
        linesTotal: number;
        coveredPercent: number;
    };
    byObject: CoverageObject[];
}
/**
 * Code coverage by object (table, codeunit, page, etc.)
 */
export interface CoverageObject {
    objectType: string;
    objectId: number;
    objectName: string;
    linesCovered: number;
    linesTotal: number;
    coveredPercent: number;
}
/**
 * Service for executing AL tests and retrieving results
 */
export declare class TestRunnerService {
    private readonly demoPortalClient;
    private readonly config;
    private xmlParser;
    constructor(demoPortalClient: DemoPortalClient, config: ConfigurationService);
    /**
     * Run tests on a Business Central environment
     *
     * Submits test job, polls for completion, parses results and optionally coverage.
     *
     * @param params - Test execution parameters
     * @returns Test results with summary, failures, and optional coverage
     * @throws {NotFoundError} If environment or job not found
     * @throws {TimeoutError} If test execution exceeds timeout
     */
    runTests(params: RunTestsParams): Promise<RunTestsResult>;
    /**
     * Poll for test results with exponential backoff
     *
     * Uses configured polling intervals from configuration service:
     * - initialPollIntervalMs (default: 2000ms)
     * - maxPollIntervalMs (default: 30000ms)
     * - backoffFactor (default: 2)
     *
     * @param environmentId - Environment ID
     * @param jobId - Test job ID
     * @param signal - Cancellation signal
     * @param timeoutMs - Total timeout in milliseconds
     * @param startTime - Start time for timeout calculation
     * @returns Test results XML
     * @throws {TimeoutError} If polling exceeds timeout
     */
    private pollForResults;
    /**
     * Parse JUnit XML test results
     *
     * Handles different XML structures:
     * - Single testsuite
     * - Multiple testsuites
     * - Nested structures
     *
     * @param xml - JUnit XML content
     * @returns Test summary with totals
     */
    private parseTestResults;
    /**
     * Extract test failure details from XML
     *
     * @param xml - JUnit XML content
     * @returns Array of test failures with details
     */
    private extractFailures;
    /**
     * Parse CSV code coverage data
     *
     * Expected CSV format:
     * objectType,objectId,objectName,linesCovered,linesNotCovered
     *
     * @param csv - CSV content
     * @returns Coverage summary with per-object breakdown
     */
    private parseCoverage;
    /**
     * Delay helper for polling
     *
     * @param ms - Milliseconds to wait
     * @returns Promise that resolves after delay
     */
    private delay;
}
//# sourceMappingURL=testRunnerService.d.ts.map