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
import { NotFoundError, TimeoutError } from '@/errors/errors.js';
/**
 * Service for executing AL tests and retrieving results
 */
export class TestRunnerService {
    demoPortalClient;
    config;
    xmlParser;
    constructor(
    // eslint-disable-next-line no-unused-vars
    demoPortalClient, 
    // eslint-disable-next-line no-unused-vars
    config) {
        this.demoPortalClient = demoPortalClient;
        this.config = config;
        // Configure XML parser for JUnit format
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            allowBooleanAttributes: true,
            parseAttributeValue: true
        });
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
    async runTests(params) {
        const startTime = Date.now();
        const timeoutMs = (params.timeoutSeconds ?? 600) * 1000;
        const signal = params.signal ?? AbortSignal.timeout(timeoutMs);
        // Submit test job
        const { jobId } = await this.demoPortalClient.createTestJob(params.environmentId, {
            codeunitId: params.codeunitId,
            testMethod: params.testMethod
        }, { signal });
        // Poll for completion
        const result = await this.pollForResults(params.environmentId, jobId, signal, timeoutMs, startTime);
        // Parse XML results
        const summary = this.parseTestResults(result.xml);
        // Optionally fetch coverage
        let coverage;
        if (params.includeCoverage) {
            try {
                const csv = await this.demoPortalClient.getCoverageCsv(params.environmentId, jobId);
                coverage = this.parseCoverage(csv);
            }
            catch (error) {
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
    async pollForResults(environmentId, jobId, signal, timeoutMs, startTime) {
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
                const result = await this.demoPortalClient.getTestResultsXml(environmentId, jobId, { signal });
                // Check if job is complete (200 = complete, 404 = still pending)
                if (result.statusCode === 200 && result.xml) {
                    return { xml: result.xml };
                }
                // Still pending, continue polling
            }
            catch (error) {
                if (error instanceof NotFoundError) {
                    // Job not ready yet, continue polling
                }
                else {
                    throw error;
                }
            }
            // Exponential backoff with jitter
            attempts++;
            delayMs = Math.min(maxDelay, delayMs * backoffFactor);
            // Add jitter to prevent thundering herd (50-100% of delay)
            delayMs = Math.floor(delayMs * (0.5 + Math.random() * 0.5));
        }
        throw new TimeoutError(`Test execution timed out after ${timeoutMs / 1000} seconds. ` +
            `Check environment status with get_environment tool.`, timeoutMs, { environmentId, jobId, attempts });
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
    parseTestResults(xml) {
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
            if (!suite)
                continue;
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
    extractFailures(xml) {
        const parsed = this.xmlParser.parse(xml);
        const failures = [];
        // Handle different XML structures
        const testsuites = parsed.testsuites || parsed.testsuite || parsed;
        const suites = Array.isArray(testsuites.testsuite)
            ? testsuites.testsuite
            : [testsuites.testsuite || testsuites];
        for (const suite of suites) {
            if (!suite)
                continue;
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
    parseCoverage(csv) {
        // Remove BOM if present
        const cleanCsv = csv.replace(/^\uFEFF/, '');
        const records = parseCsv(cleanCsv, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        let linesCovered = 0;
        let linesTotal = 0;
        const byObject = [];
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
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=testRunnerService.js.map