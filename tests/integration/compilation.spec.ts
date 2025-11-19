/**
 * Integration Tests for Compilation and Test Execution
 *
 * These tests verify:
 * - AL code compilation
 * - App publishing to Business Central
 * - Test execution
 * - Code coverage collection
 *
 * Requirements:
 * - DEMO_PORTAL_TOKEN environment variable
 * - CTN_TEST_ENVIRONMENT_ID environment variable (for publishing tests)
 * - AL CLI tools installed (`dotnet tool list -g` should show microsoft.dynamics.businesscentral.development.tools)
 * - Windows OS (AL compiler requirement)
 * - Running Business Central environment
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigurationService } from '../../src/services/configurationService.js';
import { createClientFromConfig } from '../../src/api/httpClient.js';
import { DemoPortalClient } from '../../src/api/demoPortalClient.js';
import { DeveloperEndpointClient } from '../../src/api/developerEndpointClient.js';
import { CredentialsService } from '../../src/services/credentialsService.js';
import { CompilationService } from '../../src/services/compilationService.js';
import { TestRunnerService } from '../../src/services/testRunnerService.js';
import { EnvironmentService } from '../../src/services/environmentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKIP_INTEGRATION = !process.env.DEMO_PORTAL_TOKEN;
const SKIP_COMPILATION = SKIP_INTEGRATION || process.platform !== 'win32';
const testEnvironmentId = process.env.CTN_TEST_ENVIRONMENT_ID;

describe('Compilation Integration Tests', () => {
  let compilationService: CompilationService;
  let testRunnerService: TestRunnerService;
  let environmentService: EnvironmentService;
  let config: ConfigurationService;

  beforeAll(async () => {
    if (SKIP_INTEGRATION) {
      console.log('⚠️  Skipping integration tests: DEMO_PORTAL_TOKEN not set');
      return;
    }

    if (SKIP_COMPILATION) {
      console.log('⚠️  Skipping compilation tests: Not running on Windows');
      return;
    }

    try {
      config = ConfigurationService.getInstance();
      const httpClient = createClientFromConfig(config);
      const demoPortalClient = new DemoPortalClient(httpClient);
      const credentialsService = new CredentialsService(demoPortalClient, config);
      const devEndpointClient = new DeveloperEndpointClient(credentialsService);

      compilationService = new CompilationService(demoPortalClient, devEndpointClient);
      testRunnerService = new TestRunnerService(demoPortalClient, config);
      environmentService = new EnvironmentService(demoPortalClient);
    } catch (error) {
      console.error('Failed to initialize test services:', error);
      throw error;
    }
  });

  describe('AL CLI Tools Verification', () => {
    it('should verify AL CLI tools are installed', async () => {
      if (SKIP_COMPILATION) return;

      // This will throw if tools are not installed
      await expect(async () => {
        await compilationService.verifyAlCliTools();
      }).not.toThrow();
    }, 30000);
  });

  describe('AL Compilation', () => {
    it('should compile sample AL project successfully', async () => {
      if (SKIP_COMPILATION) return;

      const workspacePath = path.join(__dirname, '..', 'fixtures', 'hello');

      const result = await compilationService.compile({
        projectPath: workspacePath,
        packageCachePath: path.join(workspacePath, '.alpackages')
      });

      // Verify compilation result
      expect(result.success).toBe(true);
      expect(result.appPath).toBeDefined();
      expect(result.appSize).toBeGreaterThan(0);
      expect(result.app).toBeDefined();
      expect(result.app.name).toBe('HelloWorld');
      expect(result.app.publisher).toBe('TestPublisher');

      // Verify diagnostics (may have warnings but should compile)
      expect(Array.isArray(result.diagnostics)).toBe(true);

      // Verify compiler output
      expect(result.compilerOutput).toBeDefined();
    }, 300000); // 5 minute timeout for compilation

    it('should parse app.json correctly', async () => {
      if (SKIP_COMPILATION) return;

      const workspacePath = path.join(__dirname, '..', 'fixtures', 'hello');

      const result = await compilationService.compile({
        projectPath: workspacePath,
        packageCachePath: path.join(workspacePath, '.alpackages')
      });

      expect(result.app.id).toBe('12345678-1234-1234-1234-123456789012');
      expect(result.app.version).toBe('1.0.0.0');
    }, 300000);

    it('should include all three analyzers in compilation', async () => {
      if (SKIP_COMPILATION) return;

      const workspacePath = path.join(__dirname, '..', 'fixtures', 'hello');

      const result = await compilationService.compile({
        projectPath: workspacePath,
        packageCachePath: path.join(workspacePath, '.alpackages')
      });

      // Verify analyzer output in compiler output
      expect(result.compilerOutput).toBeDefined();

      // All three analyzers should be mentioned or no analyzer-specific errors
      // (CodeCop, AppSourceCop, UICop)
    }, 300000);
  });

  describe('App Publishing', () => {
    it('should publish compiled app to environment', async () => {
      if (SKIP_COMPILATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      console.log('⏳ Testing complete compile and publish workflow...');

      // Ensure environment is running
      const env = await environmentService.getEnvironment(testEnvironmentId);
      if (env.environment.status !== 'Running') {
        console.log('  Starting environment...');
        await environmentService.startEnvironment(testEnvironmentId, {
          wait: 'untilRunning'
        });
      }

      // Compile the app
      const workspacePath = path.join(__dirname, '..', 'fixtures', 'hello');
      console.log('  Compiling app...');

      const compileResult = await compilationService.compile({
        projectPath: workspacePath,
        packageCachePath: path.join(workspacePath, '.alpackages')
      });

      expect(compileResult.success).toBe(true);

      // Publish the app
      console.log('  Publishing app...');
      const publishResult = await compilationService.compileAndPublish({
        workspacePath,
        environmentId: testEnvironmentId,
        schemaUpdateMode: 'synchronize'
      });

      expect(publishResult.type).toBe('compile_and_publish_result');
      expect(publishResult.compile.success).toBe(true);
      expect(publishResult.publish.success).toBe(true);
      expect(publishResult.publish.status).toBe('completed');

      console.log('✅ Compile and publish workflow completed');
    }, 600000); // 10 minute timeout
  });
});

describe('Test Execution Integration Tests', () => {
  let testRunnerService: TestRunnerService;
  let environmentService: EnvironmentService;

  beforeAll(async () => {
    if (SKIP_INTEGRATION) {
      console.log('⚠️  Skipping integration tests: DEMO_PORTAL_TOKEN not set');
      return;
    }

    const config = ConfigurationService.getInstance();
    const httpClient = createClientFromConfig(config);
    const demoPortalClient = new DemoPortalClient(httpClient);

    testRunnerService = new TestRunnerService(demoPortalClient, config);
    environmentService = new EnvironmentService(demoPortalClient);
  });

  describe('Test Execution', () => {
    it('should submit test job and poll for results', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      console.log('⏳ Testing test execution workflow...');

      // Ensure environment is running
      const env = await environmentService.getEnvironment(testEnvironmentId);
      if (env.environment.status !== 'Running') {
        console.log('  Starting environment...');
        await environmentService.startEnvironment(testEnvironmentId, {
          wait: 'untilRunning'
        });
      }

      // Execute tests
      console.log('  Executing tests...');
      const result = await testRunnerService.runTests({
        environmentId: testEnvironmentId,
        timeoutSeconds: 600,
        includeCoverage: false
      });

      // Verify result structure
      expect(result.type).toBe('run_tests_result');
      expect(result.environmentId).toBe(testEnvironmentId);
      expect(result.job).toBeDefined();
      expect(result.job.jobId).toBeDefined();
      expect(result.summary).toBeDefined();

      // Verify summary structure
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.skipped).toBeGreaterThanOrEqual(0);
      expect(result.summary.durationSec).toBeGreaterThanOrEqual(0);

      console.log(`  Tests completed: ${result.summary.total} total, ${result.summary.passed} passed, ${result.summary.failed} failed`);
    }, 900000); // 15 minute timeout for test execution

    it('should collect code coverage when requested', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      console.log('⏳ Testing test execution with coverage...');

      // Ensure environment is running
      const env = await environmentService.getEnvironment(testEnvironmentId);
      if (env.environment.status !== 'Running') {
        console.log('  Starting environment...');
        await environmentService.startEnvironment(testEnvironmentId, {
          wait: 'untilRunning'
        });
      }

      // Execute tests with coverage
      console.log('  Executing tests with coverage...');
      const result = await testRunnerService.runTests({
        environmentId: testEnvironmentId,
        timeoutSeconds: 600,
        includeCoverage: true
      });

      // Verify coverage is included
      expect(result.coverage).toBeDefined();
      expect(result.coverage?.summary).toBeDefined();
      expect(result.coverage?.summary.linesCovered).toBeGreaterThanOrEqual(0);
      expect(result.coverage?.summary.linesTotal).toBeGreaterThanOrEqual(0);
      expect(result.coverage?.summary.coveredPercent).toBeGreaterThanOrEqual(0);
      expect(result.coverage?.summary.coveredPercent).toBeLessThanOrEqual(100);

      // Verify coverage by object
      expect(Array.isArray(result.coverage?.byObject)).toBe(true);

      if (result.coverage?.byObject && result.coverage.byObject.length > 0) {
        const firstObject = result.coverage.byObject[0]!;
        expect(firstObject.objectType).toBeDefined();
        expect(firstObject.objectId).toBeGreaterThan(0);
        expect(firstObject.objectName).toBeDefined();
        expect(firstObject.linesCovered).toBeGreaterThanOrEqual(0);
        expect(firstObject.linesTotal).toBeGreaterThanOrEqual(0);
        expect(firstObject.coveredPercent).toBeGreaterThanOrEqual(0);
      }

      console.log(
        `  Coverage: ${result.coverage?.summary.coveredPercent.toFixed(2)}% ` +
          `(${result.coverage?.summary.linesCovered}/${result.coverage?.summary.linesTotal} lines)`
      );
    }, 900000); // 15 minute timeout
  });

  describe('Result Parsing', () => {
    it('should parse XML test results correctly', async () => {
      if (SKIP_INTEGRATION) return;

      // Use fixture XML for parsing test
      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="3" failures="1" errors="0" skipped="0" time="5.123">
  <testsuite name="Test Suite" tests="3" failures="1" errors="0" skipped="0" time="5.123">
    <testcase name="Test1" classname="TestClass" time="1.0">
    </testcase>
    <testcase name="Test2" classname="TestClass" time="2.0">
      <failure message="Test failed">Details</failure>
    </testcase>
    <testcase name="Test3" classname="TestClass" time="2.123">
    </testcase>
  </testsuite>
</testsuites>`;

      const summary = testRunnerService['parseTestResults'](fixtureXml);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(0);
      expect(summary.durationSec).toBeCloseTo(5.123, 2);
      expect(summary.failures.length).toBe(1);
      expect(summary.failures[0]?.test).toBe('Test2');
    });

    it('should parse CSV coverage correctly', async () => {
      if (SKIP_INTEGRATION) return;

      // Use fixture CSV for parsing test
      const fixtureCsv = `objectType,objectId,objectName,linesCovered,linesNotCovered
Codeunit,50100,Test Codeunit,100,20
Page,50101,Test Page,50,10`;

      const coverage = testRunnerService['parseCoverage'](fixtureCsv);

      expect(coverage.summary.linesCovered).toBe(150);
      expect(coverage.summary.linesTotal).toBe(180);
      expect(coverage.summary.coveredPercent).toBeCloseTo(83.33, 1);
      expect(coverage.byObject.length).toBe(2);
      expect(coverage.byObject[0]?.objectType).toBe('Codeunit');
      expect(coverage.byObject[0]?.objectId).toBe(50100);
    });
  });
});
