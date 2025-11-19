import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read tsconfig to get path aliases
const tsConfig = JSON.parse(readFileSync(join(__dirname, 'tsconfig.json'), 'utf-8'));
const paths = tsConfig.compilerOptions.paths || {};

// Convert tsconfig paths to esbuild alias format
const alias = {};
for (const [key, values] of Object.entries(paths)) {
  // Remove the /* from the key and value
  const aliasKey = key.replace('/*', '');
  const aliasValue = values[0].replace('./src', join(__dirname, 'src')).replace('/*', '');
  alias[aliasKey] = aliasValue;
}

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    '@modelcontextprotocol/sdk',
    'axios',
    'form-data',
    'zod',
    'fast-xml-parser',
    'csv-parse',
    'tsconfig-paths'
  ],
  alias,
  sourcemap: true,
  minify: false,
  keepNames: true,
});

console.log('Build complete!');