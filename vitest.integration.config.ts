import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['tests/integration/**/*.spec.ts'],
      exclude: ['tests/unit/**/*'],
      testTimeout: 120000, // 2 minutes for integration tests
      hookTimeout: 60000
    }
  })
);
