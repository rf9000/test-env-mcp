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
import { NotFoundError, TimeoutError, ValidationError } from '@/errors/errors.js';
import { Logger } from '@/utils/logger.js';
import { TestRegistry } from '@/testRegistry.js';

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
  /** Optional workspace path for test discovery/validation */
  workspacePath?: string | undefined;
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
  private testRegistry: TestRegistry | null = null;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly demoPortalClient: DemoPortalClient,
    // eslint-disable-next-line no-unused-vars
    private readonly config: ConfigurationService,
     
    testRegistry?: TestRegistry
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

    // Store test registry if provided
    this.testRegistry = testRegistry || null;
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

    // Validate tests exist in workspace if registry is available
    if (this.testRegistry && params.workspacePath) {
      await this.validateTestsExist(params);
    }

    // Submit test job
    // Build test parameters using the EXACT format from Environment Explorer
    const testParams: Record<string, unknown> = {};

    // Use the correct parameter names as discovered from Environment Explorer source
    if (params.codeunitId !== undefined) {
      // MUST be 'testCodeunitId' as a number (not codeunitId or other variations)
      testParams.testCodeunitId = params.codeunitId;
    }

    if (params.testMethod) {
      // MUST be 'testFunctionName' (not testMethod or other variations)
      testParams.testFunctionName = params.testMethod;
    }

    this.logger.info('Creating test job with standard BC parameters', {
      details: {
        environmentId: params.environmentId,
        testCodeunitId: params.codeunitId,
        testFunctionName: params.testMethod,
        parameterCount: Object.keys(testParams).length,
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
                   '1) The codeunit does not exist in the environment (verify app is published), ' +
                   '2) The codeunit is not a test codeunit (missing Subtype = Test), ' +
                   '3) The codeunit has no test methods (missing [Test] attribute), ' +
                   '4) The test app was compiled but not published to this environment, ' +
                   '5) The API might not be applying the codeunit filter correctly (testCodeunitId parameter)',
          diagnosticHint: 'Use the diagnose_tests tool to verify test availability in the environment'
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
   * Diagnostic method to troubleshoot test execution issues
   * Runs tests without filters and with various parameter combinations
   */
  async runTestDiagnostics(
    environmentId: string,
    codeunitId?: number
  ): Promise<{
    withoutFilter: RunTestsResult;
    withFilter?: RunTestsResult;
    analysis: Record<string, unknown>;
  }> {
    const diagnosticResults: any = {
      analysis: {
        environmentId,
        requestedCodeunitId: codeunitId,
        timestamp: new Date().toISOString()
      }
    };

    this.logger.info('Starting test diagnostics', {
      details: { environmentId, codeunitId }
    });

    try {
      // Step 1: Run without any filter to see all available tests
      this.logger.info('Step 1: Running tests WITHOUT any filter');
      const withoutFilter = await this.runTests({
        environmentId,
        timeoutSeconds: 60
      });

      diagnosticResults.withoutFilter = withoutFilter;
      diagnosticResults.analysis.totalTestsAvailable = withoutFilter.summary.total;
      diagnosticResults.analysis.testsFound = withoutFilter.summary.total > 0;

      // Analyze the XML to find available codeunits
      if (withoutFilter.summary.total > 0) {
        this.logger.info('Tests found without filter', {
          details: {
            total: withoutFilter.summary.total,
            passed: withoutFilter.summary.passed,
            failed: withoutFilter.summary.failed
          }
        });
      } else {
        this.logger.warn('NO tests found even without filter!', {
          details: {
            message: 'This suggests no test codeunits are available in the environment'
          }
        });
      }

      // Step 2: If a codeunit was specified, try with filter
      if (codeunitId !== undefined) {
        this.logger.info('Step 2: Running tests WITH codeunit filter', {
          details: { codeunitId }
        });

        try {
          const withFilter = await this.runTests({
            environmentId,
            codeunitId,
            timeoutSeconds: 60
          });

          diagnosticResults.withFilter = withFilter;
          diagnosticResults.analysis.filterWorking = withFilter.summary.total > 0;
          diagnosticResults.analysis.testsFoundWithFilter = withFilter.summary.total;

          if (withFilter.summary.total === 0) {
            this.logger.warn('Filter returned 0 tests', {
              details: {
                codeunitId,
                message: 'The filter is not working or the codeunit has no tests'
              }
            });
          }
        } catch (error) {
          diagnosticResults.analysis.filterError = error instanceof Error ? error.message : String(error);
          this.logger.error('Error running with filter', error as Error, {
            details: { codeunitId }
          });
        }
      }

      // Step 3: Analysis and recommendations
      diagnosticResults.analysis.recommendations = this.generateRecommendations(diagnosticResults);

      return diagnosticResults;
    } catch (error) {
      this.logger.error('Diagnostic test failed', error as Error);
      throw error;
    }
  }

  private generateRecommendations(diagnosticResults: any): string[] {
    const recommendations: string[] = [];

    if (diagnosticResults.analysis.totalTestsAvailable === 0) {
      recommendations.push('No tests available in environment. This indicates the test app is NOT published to this environment.');
      recommendations.push('Action required: Run compile_and_publish to publish your test app to this environment.');
      recommendations.push('Alternative causes: Test runner codeunit not installed, or environment has no test suites configured.');
      recommendations.push('Verify: Use compile_app tool to check if test codeunits were detected during compilation.');
    } else if (diagnosticResults.withFilter?.summary.total === 0) {
      recommendations.push(`Codeunit ${diagnosticResults.analysis.requestedCodeunitId} not found or has no tests.`);
      recommendations.push('Verify the codeunit ID is correct and exists in the published app.');
      recommendations.push('Check that the codeunit has Subtype = Test in its definition.');
      recommendations.push('Ensure test methods have the [Test] attribute.');
      recommendations.push('Note: The test app may be an older version - recompile and republish if changes were made.');
      recommendations.push('Known issue: The Demo Portal API may have issues with the testCodeunitId filtering parameter.');
    }

    return recommendations;
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
      if (!suite) {continue;}

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
      if (!suite) {continue;}

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
   * Validate that requested tests exist in the workspace
   *
   * @param params - Test parameters including workspace path
   * @throws {ValidationError} If tests are not found in workspace
   */
  private async validateTestsExist(params: RunTestsParams): Promise<void> {
    if (!this.testRegistry || !params.workspacePath) {
      return; // Skip validation if registry or workspace not available
    }

    const validation = await this.testRegistry.validateTestParameters(
      params.workspacePath,
      params.codeunitId,
      params.testMethod
    );

    if (!validation.valid) {
      this.logger.error('Test validation failed', validation.message, {
        details: {
          codeunitId: params.codeunitId,
          testMethod: params.testMethod,
          availableCodeunits: validation.availableCodeunits,
          availableMethods: validation.availableMethods
        }
      });

      // Build helpful error message
      let errorMessage = validation.message;

      if (validation.availableCodeunits && validation.availableCodeunits.length > 0) {
        errorMessage += `\n\nAvailable test codeunits in workspace:\n`;
        const testCodeunits = await this.testRegistry.getTestCodeunits(params.workspacePath);
        for (const tc of testCodeunits) {
          errorMessage += `  - Codeunit ${tc.file.object.id} "${tc.file.object.name}" (${tc.testMethods.length} tests)\n`;
        }
        errorMessage += `\nUse the 'list_tests' tool to see all available tests.`;
      } else if (validation.availableMethods && validation.availableMethods.length > 0) {
        errorMessage += `\n\nAvailable test methods in codeunit ${params.codeunitId}:\n`;
        for (const method of validation.availableMethods) {
          errorMessage += `  - ${method}\n`;
        }
      } else {
        errorMessage += `\n\nNo test codeunits found in workspace. Please ensure:\n`;
        errorMessage += `  1. Test codeunits have 'Subtype = Test'\n`;
        errorMessage += `  2. Test methods have [Test] attribute\n`;
        errorMessage += `  3. Workspace path is correct\n`;
        errorMessage += `\nUse the 'list_tests' tool to discover available tests.`;
      }

      throw new ValidationError(errorMessage);
    }

    // Log successful validation
    this.logger.info(`Test validation successful: ${validation.message}`, {
      details: {
        codeunitId: params.codeunitId,
        testMethod: params.testMethod
      }
    });
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
