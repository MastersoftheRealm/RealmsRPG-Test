#!/usr/bin/env node
/**
 * Typecheck only staged TS/TSX files using the project tsconfig (strict, paths, etc.).
 * Invoked by lint-staged; exits non-zero on type errors.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const files = process.argv
  .slice(2)
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => resolve(file));

if (files.length === 0) {
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), 'realms-tsc-staged-'));
const configPath = join(tempDir, 'tsconfig.json');

writeFileSync(
  configPath,
  JSON.stringify(
    {
      extends: resolve('tsconfig.json'),
      include: files,
      exclude: ['node_modules'],
    },
    null,
    2,
  ),
);

try {
  execSync(`npx tsc --noEmit -p "${configPath}"`, { stdio: 'inherit' });
} catch {
  process.exit(1);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
