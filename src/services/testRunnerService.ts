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

import { XMLParser } from 'fast-xml-parser';
import { parse as parseCsv } from 'csv-parse/sync';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { ConfigurationService } from '@/services/configurationService.js';
import { NotFoundError, TimeoutError } from '@/errors/errors.js';
import { Logger } from '@/utils/logger.js';

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
  // eslint-disable-next-line no-undef
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
export class TestRunnerService {
  private xmlParser: XMLParser;
  private logger: Logger;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly demoPortalClient: DemoPortalClient,
    // eslint-disable-next-line no-unused-vars
    private readonly config: ConfigurationService
  ) {
    // Configure XML parser for JUnit format
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
      parseAttributeValue: true
    });

    // Initialize logger
    this.logger = Logger.getInstance();
  }

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
  async runTests(params: RunTestsParams): Promise<RunTestsResult> {
    const startTime = Date.now();
    const timeoutMs = (params.timeoutSeconds ?? 600) * 1000;
    const signal = params.signal ?? AbortSignal.timeout(timeoutMs);

    // Submit test job
    // Build test parameters with both field names for compatibility
    const testParams: Record<string, unknown> = {};

    // Use testCodeunitId as primary field name (matches AL Test Runner reference)
    // Also include codeunitId for backward compatibility
    if (params.codeunitId !== undefined) {
      testParams.testCodeunitId = params.codeunitId;
      testParams.codeunitId = params.codeunitId; // Fallback for older API versions
    }

    if (params.testMethod) {
      testParams.testMethod = params.testMethod;
      testParams.testName = params.testMethod; // Alternative field name
    }

    this.logger.debug('Submitting test job with parameters', {
      details: {
        environmentId: params.environmentId,
        testParams
      }
    });

    const { jobId } = await this.demoPortalClient.createTestJob(
      params.environmentId,
      testParams,
      { signal }
    );

    this.logger.info('Test job created successfully', {
      details: {
        jobId,
        environmentId: params.environmentId,
        codeunitId: params.codeunitId,
        testMethod: params.testMethod
      }
    });

    // Poll for completion
    const result = await this.pollForResults(
      params.environmentId,
      jobId,
      signal,
      timeoutMs,
      startTime
    );

    // Parse XML results
    const summary = this.parseTestResults(result.xml);

    // Log warning if no tests found despite filtering
    if (summary.total === 0 && params.codeunitId !== undefined) {
      this.logger.warn('No tests found for specified codeunit', {
        details: {
          codeunitId: params.codeunitId,
          testMethod: params.testMethod,
          jobId,
          message: 'The test job completed but found no tests to execute. Possible causes: ' +
                   '1) The codeunit does not exist in the environment, ' +
                   '2) The codeunit is not a test codeunit (missing Subtype = Test), ' +
                   '3) The codeunit has no test methods (missing [Test] attribute), ' +
                   '4) The API might not be applying the codeunit filter correctly'
        }
      });
    } else if (summary.total > 0) {
      this.logger.info('Test execution completed', {
        details: {
          jobId,
          totalTests: summary.total,
          passed: summary.passed,
          failed: summary.failed,
          skipped: summary.skipped,
          duration: summary.durationSec
        }
      });
    }

    // Optionally fetch coverage
    let coverage: CoverageSummary | undefined;
    if (params.includeCoverage) {
      try {
        const csv = await this.demoPortalClient.getCoverageCsv(
          params.environmentId,
          jobId
        );
        coverage = this.parseCoverage(csv);
      } catch (error) {
        // Coverage is optional - don't fail if not available
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
    }

    return {
      type: 'run_tests_result',
      environmentId: params.environmentId,
      job: {
        jobId,
        submittedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startTime
      },
      summary,
      failures: summary.failed > 0 ? this.extractFailures(result.xml) : [],
      coverage,
      fetchedAt: new Date().toISOString()
    };
  }

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
  private async pollForResults(
    environmentId: string,
    jobId: string,
    signal: AbortSignal,
    timeoutMs: number,
    startTime: number
  ): Promise<{ xml: string }> {
    let attempts = 0;
    const cfg = this.config.getConfig();
    let delayMs = cfg.test.initialPollIntervalMs;
    const maxDelay = cfg.test.maxPollIntervalMs;
    const backoffFactor = cfg.test.backoffFactor;

    while (Date.now() - startTime < timeoutMs) {
      // Check for cancellation
      if (signal.aborted) {
        throw new Error('Test execution cancelled');
      }

      // Wait with backoff (skip delay on first attempt)
      if (attempts > 0) {
        await this.delay(delayMs);
      }

      try {
        const result = await this.demoPortalClient.getTestResultsXml(
          environmentId,
          jobId,
          { signal }
        );

        // Check if job is complete (200 = complete, 404 = still pending)
        if (result.statusCode === 200 && result.xml) {
          return { xml: result.xml };
        }

        // Still pending, continue polling
      } catch (error) {
        if (error instanceof NotFoundError) {
          // Job not ready yet, continue polling
        } else {
          throw error;
        }
      }

      // Exponential backoff with jitter
      attempts++;
      delayMs = Math.min(maxDelay, delayMs * backoffFactor);

      // Add jitter to prevent thundering herd (50-100% of delay)
      delayMs = Math.floor(delayMs * (0.5 + Math.random() * 0.5));
    }

    throw new TimeoutError(
      `Test execution timed out after ${timeoutMs / 1000} seconds. ` +
        `Check environment status with get_environment tool.`,
      timeoutMs,
      { environmentId, jobId, attempts }
    );
  }

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
  private parseTestResults(xml: string): TestSummary {
    const parsed = this.xmlParser.parse(xml);

    // Handle different XML structures
    const testsuites = parsed.testsuites || parsed.testsuite || parsed;
    const suites = Array.isArray(testsuites.testsuite)
      ? testsuites.testsuite
      : [testsuites.testsuite || testsuites];

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let durationSec = 0;

    for (const suite of suites) {
      if (!suite) continue;

      // Parse numeric attributes
      const suiteTests = parseInt(String(suite.tests || '0'));
      const suiteFailures = parseInt(String(suite.failures || '0'));
      const suiteSkipped = parseInt(String(suite.skipped || '0'));
      const suiteTime = parseFloat(String(suite.time || '0'));

      total += suiteTests;
      failed += suiteFailures;
      skipped += suiteSkipped;
      durationSec += suiteTime;
    }

    passed = total - failed - skipped;

    return {
      total,
      passed,
      failed,
      skipped,
      durationSec
    };
  }

  /**
   * Extract test failure details from XML
   *
   * @param xml - JUnit XML content
   * @returns Array of test failures with details
   */
  private extractFailures(xml: string): TestFailure[] {
    const parsed = this.xmlParser.parse(xml);
    const failures: TestFailure[] = [];

    // Handle different XML structures
    const testsuites = parsed.testsuites || parsed.testsuite || parsed;
    const suites = Array.isArray(testsuites.testsuite)
      ? testsuites.testsuite
      : [testsuites.testsuite || testsuites];

    for (const suite of suites) {
      if (!suite) continue;

      const suiteName = String(suite.name || 'Unknown');

      // Extract test cases
      const testcases = Array.isArray(suite.testcase)
        ? suite.testcase
        : [suite.testcase].filter(Boolean);

      for (const testcase of testcases) {
        if (testcase?.failure) {
          const failure = testcase.failure;
          failures.push({
            suite: suiteName,
            test: String(testcase.name || 'Unknown'),
            classname: testcase.classname ? String(testcase.classname) : undefined,
            message: String(failure.message || failure || 'Test failed'),
            details: failure['#text'] ? String(failure['#text']) : undefined,
            timeSec: parseFloat(String(testcase.time || '0'))
          });
        }
      }
    }

    return failures;
  }

  /**
   * Parse CSV code coverage data
   *
   * Expected CSV format:
   * objectType,objectId,objectName,linesCovered,linesNotCovered
   *
   * @param csv - CSV content
   * @returns Coverage summary with per-object breakdown
   */
  private parseCoverage(csv: string): CoverageSummary {
    // Remove BOM if present
    const cleanCsv = csv.replace(/^\uFEFF/, '');

    const records = parseCsv(cleanCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Array<{
      objectType?: string;
      objectId?: string;
      objectName?: string;
      linesCovered?: string;
      linesNotCovered?: string;
    }>;

    let linesCovered = 0;
    let linesTotal = 0;
    const byObject: CoverageObject[] = [];

    for (const record of records) {
      const covered = parseInt(record.linesCovered || '0');
      const notCovered = parseInt(record.linesNotCovered || '0');
      const total = covered + notCovered;

      linesCovered += covered;
      linesTotal += total;

      if (record.objectType && record.objectId) {
        byObject.push({
          objectType: record.objectType,
          objectId: parseInt(record.objectId),
          objectName: record.objectName || 'Unknown',
          linesCovered: covered,
          linesTotal: total,
          coveredPercent: total > 0 ? (covered / total) * 100 : 0
        });
      }
    }

    return {
      summary: {
        linesCovered,
        linesTotal,
        coveredPercent: linesTotal > 0 ? (linesCovered / linesTotal) * 100 : 0
      },
      byObject
    };
  }

  /**
   * Delay helper for polling
   *
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
