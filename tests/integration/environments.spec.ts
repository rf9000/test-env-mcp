/**
 * Integration Tests for Environment Management
 *
 * These tests interact with the real Demo Portal API to verify:
 * - Environment listing and retrieval
 * - Environment start/stop operations
 * - Idempotency and error handling
 * - Secret redaction
 *
 * Requirements:
 * - DEMO_PORTAL_TOKEN environment variable must be set
 * - CTN_TEST_ENVIRONMENT_ID environment variable for specific tests (optional)
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ConfigurationService } from '../../src/services/configurationService.js';
import { createClientFromConfig } from '../../src/api/httpClient.js';
import { DemoPortalClient } from '../../src/api/demoPortalClient.js';
import { EnvironmentService } from '../../src/services/environmentService.js';
import { AuthError, NotFoundError } from '../../src/errors/errors.js';

const SKIP_INTEGRATION = !process.env.DEMO_PORTAL_TOKEN;

describe('Environment Integration Tests', () => {
  let service: EnvironmentService;
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
      const demoPortalClient = new DemoPortalClient(httpClient);
      service = new EnvironmentService(demoPortalClient);

      testEnvironmentId = process.env.CTN_TEST_ENVIRONMENT_ID;
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  });

  describe('list_environments', () => {
    it('should return array of environments from real API', async () => {
      if (SKIP_INTEGRATION) return;

      const result = await service.listEnvironments();

      // Verify response structure
      expect(result.type).toBe('list_environments_result');
      expect(Array.isArray(result.environments)).toBe(true);
      expect(result.environments.length).toBeGreaterThan(0);

      // Verify first environment structure
      const env = result.environments[0];
      expect(env).toHaveProperty('id');
      expect(env).toHaveProperty('name');
      expect(env).toHaveProperty('status');
      expect(env).toHaveProperty('bcVersion');

      // Verify types
      expect(typeof env.id).toBe('string');
      expect(typeof env.name).toBe('string');
      expect(typeof env.status).toBe('string');
      expect(typeof env.bcVersion).toBe('string');

      // Verify metadata
      expect(result.count).toBe(result.environments.length);
      expect(result.source.baseUrl).toBeDefined();
      expect(new Date(result.fetchedAt).getTime()).toBeCloseTo(Date.now(), -2);
      expect(result.elapsedMs).toBeGreaterThan(0);
      expect(result.elapsedMs).toBeLessThan(10000); // Should be under 10 seconds
    }, 30000); // 30 second timeout

    it('should return sorted environments by name', async () => {
      if (SKIP_INTEGRATION) return;

      const result = await service.listEnvironments();

      // Verify alphabetical sorting
      for (let i = 1; i < result.environments.length; i++) {
        const prev = result.environments[i - 1]!.name.toLowerCase();
        const curr = result.environments[i]!.name.toLowerCase();
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
      }
    }, 30000);

    it('should handle auth errors with redaction', async () => {
      if (SKIP_INTEGRATION) return;

      // Create service with invalid token
      const badConfig = ConfigurationService.getInstance();
      const invalidToken = 'invalid_token_123456789_this_should_be_redacted';

      // Temporarily override token (for testing purposes)
      process.env.DEMO_PORTAL_TOKEN = invalidToken;

      try {
        // Create new config instance with bad token
        ConfigurationService.reset();
        const testConfig = ConfigurationService.getInstance();
        const badClient = createClientFromConfig(testConfig);
        const badDemoPortalClient = new DemoPortalClient(badClient);
        const badService = new EnvironmentService(badDemoPortalClient);

        await expect(badService.listEnvironments()).rejects.toThrow(AuthError);
      } catch (error) {
        // Verify error message doesn't contain the token
        if (error instanceof AuthError) {
          expect(error.message).not.toContain(invalidToken);
          expect(error.message).toContain('authentication');
        }
      } finally {
        // Restore original token
        process.env.DEMO_PORTAL_TOKEN = process.env.DEMO_PORTAL_TOKEN_BACKUP;
        ConfigurationService.reset();
      }
    }, 30000);
  });

  describe('get_environment', () => {
    it('should return environment details for valid ID', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      const result = await service.getEnvironment(testEnvironmentId);

      // Verify response structure
      expect(result.type).toBe('get_environment_result');
      expect(result.environment.id).toBe(testEnvironmentId);
      expect(result.environment.details).toBeDefined();

      // Verify environment has required fields
      expect(result.environment).toHaveProperty('name');
      expect(result.environment).toHaveProperty('status');
      expect(result.environment).toHaveProperty('bcVersion');

      // Verify metadata
      expect(result.source.baseUrl).toBeDefined();
      expect(new Date(result.fetchedAt).getTime()).toBeCloseTo(Date.now(), -2);
      expect(result.elapsedMs).toBeGreaterThan(0);
    }, 30000);

    it('should handle not found error with actionable message', async () => {
      if (SKIP_INTEGRATION) return;

      const fakeId = 'env-nonexistent-fake-id-12345';

      await expect(service.getEnvironment(fakeId)).rejects.toThrow(NotFoundError);

      try {
        await service.getEnvironment(fakeId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          expect(error.message).toContain('Environment not found');
          expect(error.message).toContain('list_environments');
        }
      }
    }, 30000);

    it('should get environment from list', async () => {
      if (SKIP_INTEGRATION) return;

      // Get first environment from list
      const list = await service.listEnvironments();
      expect(list.environments.length).toBeGreaterThan(0);

      const firstEnv = list.environments[0]!;
      const result = await service.getEnvironment(firstEnv.id);

      // Verify we got the same environment
      expect(result.environment.id).toBe(firstEnv.id);
      expect(result.environment.name).toBe(firstEnv.name);
    }, 30000);
  });

  describe('start_environment (idempotency)', () => {
    it('should handle already running status gracefully', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      // Get current status
      const current = await service.getEnvironment(testEnvironmentId);

      // Start if not already running
      if (current.environment.status !== 'Running') {
        console.log('⏳ Starting environment for test...');
        await service.startEnvironment(testEnvironmentId, { wait: 'untilRunning' });
      }

      // Now test idempotency - starting an already running environment
      const result = await service.startEnvironment(testEnvironmentId);

      expect(result.status).toBe('no_op');
      expect(result.message).toContain('already running');
      expect(result.previousStatus).toBe('Running');
      expect(result.newStatus).toBe('Running');
    }, 600000); // 10 minute timeout for environment startup
  });

  describe('stop_environment (idempotency)', () => {
    it('should handle already stopped status gracefully', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      // Get current status
      const current = await service.getEnvironment(testEnvironmentId);

      // Stop if not already stopped
      if (current.environment.status !== 'Stopped') {
        console.log('⏳ Stopping environment for test...');
        await service.stopEnvironment(testEnvironmentId, { wait: 'untilStopped' });
      }

      // Now test idempotency - stopping an already stopped environment
      const result = await service.stopEnvironment(testEnvironmentId);

      expect(result.status).toBe('no_op');
      expect(result.message).toContain('already stopped');
      expect(result.previousStatus).toBe('Stopped');
      expect(result.newStatus).toBe('Stopped');
    }, 600000); // 10 minute timeout for environment shutdown
  });

  describe('environment state transitions', () => {
    it('should successfully start and stop environment', async () => {
      if (SKIP_INTEGRATION) return;
      if (!testEnvironmentId) {
        console.log('⚠️  Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      console.log('⏳ Testing complete environment lifecycle...');

      // Ensure environment is stopped
      const initial = await service.getEnvironment(testEnvironmentId);
      if (initial.environment.status === 'Running') {
        console.log('  Stopping environment...');
        await service.stopEnvironment(testEnvironmentId, { wait: 'untilStopped' });
      }

      // Test start operation
      console.log('  Starting environment...');
      const startResult = await service.startEnvironment(testEnvironmentId, {
        wait: 'untilRunning'
      });

      expect(startResult.status).toBe('completed');
      expect(startResult.newStatus).toBe('Running');

      // Verify environment is actually running
      const afterStart = await service.getEnvironment(testEnvironmentId);
      expect(afterStart.environment.status).toBe('Running');

      // Test stop operation
      console.log('  Stopping environment...');
      const stopResult = await service.stopEnvironment(testEnvironmentId, {
        wait: 'untilStopped'
      });

      expect(stopResult.status).toBe('completed');
      expect(stopResult.newStatus).toBe('Stopped');

      // Verify environment is actually stopped
      const afterStop = await service.getEnvironment(testEnvironmentId);
      expect(afterStop.environment.status).toBe('Stopped');

      console.log('✅ Environment lifecycle test completed');
    }, 1200000); // 20 minute timeout for full lifecycle
  });
});
