#!/usr/bin/env node
/**
 * Prove autosave regression tests fail on pre-fix SHAs (facd105e client merge, 36318f11 reseed).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PIN_FACD = 'facd105e';
const PIN_RESEED = '36318f11';
const PIN_BASELINE_GUARD = '6cc795bf';

const REGRESSION_GLOBS = [
  'src/lib/character/character-autosave-baseline-context.test.tsx',
  'src/app/(detail)/characters/[id]/sheet-library-inventory-regression.hook.test.tsx',
  'src/lib/character/dirty-patch.test.ts',
];
const TEST_NAME_FILTER =
  'sequence 1|sequence 3|swallowed edit|concurrent remote potion|does not restore a persisted baseline|fresh row default qty';

const PINNED_FACD_FILES = [
  'src/lib/character/dirty-patch.ts',
  'src/lib/character/character-autosave-baseline-context.tsx',
  'src/app/(detail)/characters/[id]/use-character-sheet-page-data.ts',
];
const PINNED_RESEED_FILES = ['src/app/(detail)/characters/[id]/use-character-sheet-page-data.ts'];
const PINNED_BASELINE_GUARD_FILES = [
  'src/app/(detail)/characters/[id]/use-character-sheet-page-data.ts',
];

function readGitFile(sha, rel) {
  return execFileSync('git', ['show', `${sha}:${rel}`], { cwd: root, encoding: 'utf8' });
}

function swapFiles(sha, files) {
  const backups = new Map();
  for (const rel of files) {
    const abs = path.join(root, rel);
    backups.set(rel, fs.readFileSync(abs, 'utf8'));
    fs.writeFileSync(abs, readGitFile(sha, rel));
  }
  return backups;
}

function restoreFiles(backups) {
  for (const [rel, content] of backups) {
    fs.writeFileSync(path.join(root, rel), content);
  }
}

function runVitest(filter, extraArgs = []) {
  return spawnSync(
    'npx',
    [
      'vitest',
      'run',
      ...REGRESSION_GLOBS,
      '-t',
      filter,
      ...extraArgs,
    ],
    { cwd: root, encoding: 'utf8' },
  );
}

function assertFails(res, label) {
  const combined = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  process.stdout.write(combined);
  if (res.status === 0) {
    console.error(`Expected vitest failure for ${label}`);
    process.exit(1);
  }
  console.log(`inventory-autosave pinned negative: ${label} failed vitest as expected.`);
}

function assertPasses(res, label) {
  const combined = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  process.stdout.write(combined);
  if (res.status !== 0) {
    console.error(`Expected vitest pass for ${label}`);
    process.exit(1);
  }
  console.log(`inventory-autosave pinned negative: ${label} passed vitest as expected.`);
}

const currentBackups = new Map();
for (const rel of [
  ...new Set([...PINNED_FACD_FILES, ...PINNED_RESEED_FILES, ...PINNED_BASELINE_GUARD_FILES]),
]) {
  currentBackups.set(rel, fs.readFileSync(path.join(root, rel), 'utf8'));
}

// facd105e: merge + persisted baseline regressions
const facdBackups = swapFiles(PIN_FACD, PINNED_FACD_FILES);
const facdRes = runVitest(TEST_NAME_FILTER);
restoreFiles(facdBackups);
assertFails(facdRes, PIN_FACD);

// 36318f11: reseed-when-clean swallowed-edit regression only
const reseedBackups = swapFiles(PIN_RESEED, PINNED_RESEED_FILES);
const reseedRes = runVitest('swallowed edit');
restoreFiles(reseedBackups);
assertFails(reseedRes, PIN_RESEED);

// 6cc795bf: skip nextBaseline while dirty (concurrent remote potion / notes)
const guardBackups = swapFiles(PIN_BASELINE_GUARD, PINNED_BASELINE_GUARD_FILES);
const guardRes = runVitest('concurrent remote potion');
restoreFiles(guardBackups);
assertFails(guardRes, PIN_BASELINE_GUARD);

// Current tree must pass
const passRes = runVitest(TEST_NAME_FILTER);
assertPasses(passRes, 'current tree');

restoreFiles(currentBackups);
console.log('inventory-autosave pinned negative: all legs OK.');