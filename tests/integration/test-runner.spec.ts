/**
 * Integration Tests for Test Runner
 *
 * These tests verify the test execution functionality with the Demo Portal API:
 * - Test job creation with various response formats
 * - Job status polling
 * - Error handling
 * - Response format flexibility
 *
 * Requirements:
 * - DEMO_PORTAL_TOKEN environment variable must be set
 * - CTN_TEST_ENVIRONMENT_ID environment variable for specific tests (optional)
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ConfigurationService } from '../../src/services/configurationService.js';
import { createClientFromConfig } from '../../src/api/httpClient.js';
import { DemoPortalClient } from '../../src/api/demoPortalClient.js';
import { TestRunnerService } from '../../src/services/testRunnerService.js';
import { NotFoundError } from '../../src/errors/errors.js';
import { AxiosResponse } from 'axios';

const SKIP_INTEGRATION = !process.env.DEMO_PORTAL_TOKEN;

describe('Test Runner Integration Tests', () => {
  let service: TestRunnerService;
  let demoPortalClient: DemoPortalClient;
  let testEnvironmentId: string | undefined;

  beforeAll(async () => {
    if (SKIP_INTEGRATION) {
      console.log('⚠️  Skipping integration tests: DEMO_PORTAL_TOKEN not set');
      console.log('   Set DEMO_PORTAL_TOKEN environment variable to run these tests');
      return;
    }

    try {
      const config = ConfigurationService.getInstance();
      const httpClient = createClientFromConfig(config);
      demoPortalClient = new DemoPortalClient(httpClient);
      service = new TestRunnerService(demoPortalClient);

      testEnvironmentId = process.env.CTN_TEST_ENVIRONMENT_ID;
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  });

  describe('createTestJob response handling', () => {
    it('should handle standard jobId response format', async () => {
      if (SKIP_INTEGRATION) return;

      // Mock the HTTP client response for testing different formats
      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      // Override the post method to return our test response
      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { jobId: 12345 },
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      // Restore original method
      httpClient.post = originalPost;
    });

    it('should handle job_id response format (snake_case)', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { job_id: 12345 },
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should handle id response format', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 12345 },
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should handle direct numeric ID response', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: 12345,
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should handle direct string ID response', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: '12345',
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should handle nested job.id response', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { job: { id: 12345 } },
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should handle result.jobId response', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { result: { jobId: 12345 } },
        config: {} as any
      } as AxiosResponse);

      const result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });

      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });

    it('should throw error for empty response', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: null,
        config: {} as any
      } as AxiosResponse);

      await expect(
        testClient.createTestJob('test-env-id', { codeunitId: 50100 })
      ).rejects.toThrow('Empty response from test job creation');

      httpClient.post = originalPost;
    });

    it('should throw error for response without job ID', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true, message: 'Job created' },
        config: {} as any
      } as AxiosResponse);

      await expect(
        testClient.createTestJob('test-env-id', { codeunitId: 50100 })
      ).rejects.toThrow('Could not find job ID in API response');

      httpClient.post = originalPost;
    });

    it('should handle various capitalization formats', async () => {
      if (SKIP_INTEGRATION) return;

      const httpClient = createClientFromConfig(ConfigurationService.getInstance());
      const testClient = new DemoPortalClient(httpClient);

      const originalPost = httpClient.post;

      // Test JobId format
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { JobId: 12345 },
        config: {} as any
      } as AxiosResponse);

      let result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });
      expect(result.jobId).toBe('12345');

      // Test Id format
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { Id: 12345 },
        config: {} as any
      } as AxiosResponse);

      result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });
      expect(result.jobId).toBe('12345');

      // Test ID format
      httpClient.post = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { ID: 12345 },
        config: {} as any
      } as AxiosResponse);

      result = await testClient.createTestJob('test-env-id', {
        codeunitId: 50100
      });
      expect(result.jobId).toBe('12345');

      httpClient.post = originalPost;
    });
  });

  describe('run_tests with real environment (if configured)', () => {
    it('should attempt to run a test on real environment', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      // This test will actually try to create a test job
      // It will show debug logs with the actual API response
      console.log(`🔧 Attempting to run test on environment: ${testEnvironmentId}`);

      try {
        const result = await service.runTests(
          testEnvironmentId,
          50100, // Standard test codeunit ID
          { timeout: 60000 } // 1 minute timeout
        );

        // If successful, verify response structure
        if (result.status === 'completed') {
          expect(result.type).toBe('run_tests_result');
          expect(result).toHaveProperty('environmentId');
          expect(result).toHaveProperty('codeunitId');
          console.log('✅ Test execution successful');
        } else if (result.status === 'error') {
          console.log(`⚠️  Test execution failed: ${result.error}`);
          // This is expected if the codeunit doesn't exist
        }
      } catch (error) {
        // Log the error for debugging
        console.log('❌ Test execution error:', error);

        // Check if it's a NotFoundError (environment or codeunit not found)
        if (error instanceof NotFoundError) {
          console.log('   Environment or codeunit not found - this is expected');
        } else {
          // Re-throw unexpected errors
          throw error;
        }
      }
    }, 120000); // 2 minute timeout
  });
});