import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['tests/unit/**/*.spec.ts'],
      exclude: ['tests/integration/**/*'],
      testTimeout: 10000 // Unit tests should be fast
    }
  })
);
