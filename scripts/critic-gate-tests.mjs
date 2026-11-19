#!/usr/bin/env node
/**
 * Minimal test bundle the independent critic GitHub Actions job re-runs on the
 * exact PR head SHA before posting the "Realms Independent Critic" check.
 * Keep in sync with .github/workflows/independent-critic.yml (do not weaken
 * without updating AGENTS.md Risk by path and a ruleset/settings change).
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
