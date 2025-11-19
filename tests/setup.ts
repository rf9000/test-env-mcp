/**
 * Global test setup for Vitest
 *
 * This file runs before all tests and sets up the testing environment.
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment variables
beforeAll(() => {
  // Set default test environment
  process.env.NODE_ENV = 'test';

  // Load test configuration
  if (!process.env.DEMO_PORTAL_TOKEN) {
    console.warn(
      'DEMO_PORTAL_TOKEN not set. Integration tests will be skipped.\n' +
      'Set this environment variable to run integration tests against the real API.'
    );
  }
});

// Clean up after all tests
afterAll(() => {
  // Cleanup can be added here if needed
});

// Reset state before each test
beforeEach(() => {
  // Clear any test-specific state
});
