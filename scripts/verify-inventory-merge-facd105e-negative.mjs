#!/usr/bin/env node
/**
 * Prove dirty-patch merge regression tests fail on facd105e (pre critic-remediate).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pin = 'facd105e';
const rel = 'src/lib/character/dirty-patch.ts';
const abs = path.join(root, rel);
const current = fs.readFileSync(abs, 'utf8');
const pinned = execFileSync('git', ['show', `${pin}:${rel}`], { cwd: root, encoding: 'utf8' });

if (pinned.includes('savedInventoryQuantity')) {
  console.error(`Pinned ${pin} already contains savedInventoryQuantity; pick an older SHA.`);
  process.exit(2);
}

fs.writeFileSync(abs, pinned);
const res = spawnSync(
  'npx',
  [
    'vitest',
    'run',
    'src/lib/character/dirty-patch.test.ts',
    '-t',
    'fresh row default qty',
  ],
  { cwd: root, encoding: 'utf8' },
);
fs.writeFileSync(abs, current);

const combined = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
process.stdout.write(combined);
if (res.status === 0) {
  console.error(`Expected vitest failure with dirty-patch at ${pin}`);
  process.exit(1);
}
console.log(`inventory-merge pinned negative: dirty-patch at ${pin} failed vitest as expected.`);