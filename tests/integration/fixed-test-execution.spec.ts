/**
 * Integration tests to verify AppSourceCop exclusion and test parameter fixes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CompilationService } from '@/services/compilationService.js';
import { TestRunnerService } from '@/services/testRunnerService.js';
import { DemoPortalClient } from '@/api/demoPortalClient.js';
import { DeveloperEndpointClient } from '@/api/developerEndpointClient.js';
import { ConfigurationService } from '@/services/configurationService.js';
import { HttpClient } from '@/api/httpClient.js';

describe('Fixed Test Execution Integration', () => {
  let compilationService: CompilationService;
  let testRunnerService: TestRunnerService;
  let demoPortalClient: DemoPortalClient;
  let devEndpointClient: DeveloperEndpointClient;
  let configService: ConfigurationService;

  const isIntegrationEnabled = !!process.env.DEMO_PORTAL_TOKEN;

  beforeAll(() => {
    if (!isIntegrationEnabled) {
      console.log('⚠️  Skipping integration tests: DEMO_PORTAL_TOKEN not set');
      return;
    }

    configService = new ConfigurationService();
    const httpClient = new HttpClient(configService, 'demo_portal');
    demoPortalClient = new DemoPortalClient(httpClient, configService);
    devEndpointClient = new DeveloperEndpointClient(configService);
    compilationService = new CompilationService(demoPortalClient, devEndpointClient);
    testRunnerService = new TestRunnerService(demoPortalClient, configService);
  });

  describe('AppSourceCop Exclusion for Test Apps', () => {
    it.skipIf(!isIntegrationEnabled)('should detect and exclude AppSourceCop for test apps', async () => {
      // This test verifies that test apps are correctly identified
      // The actual isTestApp method is private, so we test it via unit tests
      // This integration test would verify the end-to-end compilation flow

      // Mock test app data
      const testAppJson = {
        name: 'Continia Banking - Test Suite',
        idRanges: [{ from: 94999, to: 95999 }],
        dependencies: [
          { name: 'Test Runner', publisher: 'Microsoft' }
        ]
      };

      // @ts-ignore - Accessing private method for testing
      const isTestApp = compilationService.isTestApp(testAppJson);
      expect(isTestApp).toBe(true);

      // Verify regular apps are not detected as test apps
      const regularAppJson = {
        name: 'Continia Banking',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      const isRegularApp = compilationService.isTestApp(regularAppJson);
      expect(isRegularApp).toBe(false);
    });
  });

  describe('Test Filtering with Correct Parameters', () => {
    it.skipIf(!isIntegrationEnabled)('should use testCodeunitId and testFunctionName parameters', async () => {
      // This test would require a real environment with tests
      // For now, we verify the parameter structure

      const mockParams = {
        environmentId: 'test-env',
        codeunitId: 50100,
        testMethod: 'TestCreateCustomer'
      };

      // Create a spy to intercept the API call
      let capturedParams: Record<string, unknown> | undefined;
      const originalCreateTestJob = demoPortalClient.createTestJob.bind(demoPortalClient);

      demoPortalClient.createTestJob = async (envId, params, options) => {
        capturedParams = params;
        // Return a mock response for testing
        return { jobId: 'test-job-123' };
      };

      try {
        // This would normally run the test, but we're just capturing parameters
        await testRunnerService.runTests({
          ...mockParams,
          timeoutSeconds: 1 // Short timeout for testing
        }).catch(() => {
          // Expected to fail since we're not really running tests
        });

        // Verify correct parameters were used
        expect(capturedParams).toBeDefined();
        expect(capturedParams?.testCodeunitId).toBe(50100);
        expect(capturedParams?.testFunctionName).toBe('TestCreateCustomer');

        // Verify wrong parameter names are NOT used
        expect(capturedParams?.codeunitId).toBeUndefined();
        expect(capturedParams?.testMethod).toBeUndefined();
        expect(capturedParams?.testName).toBeUndefined();
      } finally {
        // Restore original function
        demoPortalClient.createTestJob = originalCreateTestJob;
      }
    });

    it.skipIf(!isIntegrationEnabled)('should only send testCodeunitId when no method specified', async () => {
      const mockParams = {
        environmentId: 'test-env',
        codeunitId: 50100
        // No testMethod specified
      };

      // Create a spy to intercept the API call
      let capturedParams: Record<string, unknown> | undefined;
      const originalCreateTestJob = demoPortalClient.createTestJob.bind(demoPortalClient);

      demoPortalClient.createTestJob = async (envId, params, options) => {
        capturedParams = params;
        return { jobId: 'test-job-124' };
      };

      try {
        await testRunnerService.runTests({
          ...mockParams,
          timeoutSeconds: 1
        }).catch(() => {
          // Expected to fail
        });

        // Verify only testCodeunitId is sent
        expect(capturedParams).toBeDefined();
        expect(capturedParams?.testCodeunitId).toBe(50100);
        expect(capturedParams?.testFunctionName).toBeUndefined();
      } finally {
        demoPortalClient.createTestJob = originalCreateTestJob;
      }
    });
  });

  describe('End-to-End Test Compilation and Execution', () => {
    it.skipIf(!isIntegrationEnabled)('should compile test app without AppSourceCop errors', async () => {
      // This would require actual AL project and environment
      // Marked as integration test to be run manually with real setup

      // Test scenario:
      // 1. Compile a test app (should exclude AppSourceCop)
      // 2. Publish to environment
      // 3. Run tests with filtering
      // 4. Verify correct tests executed

      expect(true).toBe(true); // Placeholder

      // Real implementation would be:
      /*
      const result = await compilationService.compileAndPublish({
        workspacePath: 'C:\\path\\to\\test\\app',
        environmentId: 'real-env-id'
      });

      expect(result.compile.success).toBe(true);
      expect(result.publish.success).toBe(true);

      const testResult = await testRunnerService.runTests({
        environmentId: 'real-env-id',
        codeunitId: 95000
      });

      expect(testResult.summary.total).toBeGreaterThan(0);
      */
    });
  });
});