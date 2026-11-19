#!/usr/bin/env node
/**
 * Optional bundle the independent critic runs locally during /audit (not a merge gate).
 * Same commands CI already runs on PRs (typecheck, unit tests, agent doc checks).
 */
import { execSync } from 'node:child_process';

const steps = [
  'npm run typecheck',
  'npm test',
  'node scripts/validate-agent-docs.js',
  'node scripts/validate-feature-index.js',
];

for (const cmd of steps) {
  execSync(cmd, { stdio: 'inherit' });
}