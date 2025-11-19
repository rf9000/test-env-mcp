import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'tests',
        'dist',
        '**/*.config.*',
        '**/*.d.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    testTimeout: 60000, // 1 minute default
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@errors': path.resolve(__dirname, './src/errors'),
      '@services': path.resolve(__dirname, './src/services'),
      '@api': path.resolve(__dirname, './src/api'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@schemas': path.resolve(__dirname, './src/schemas'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
});
