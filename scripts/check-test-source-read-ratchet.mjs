#!/usr/bin/env node
/**
 * C3 ratchet — tests that read repo source under src/, scripts/, sql/, .github/.
 *
 * Per test file, counts qualifying fs read call sites. New test files must have zero;
 * existing files may not add more reads than the baseline.
 *
 *   node scripts/check-test-source-read-ratchet.mjs
 *   node scripts/check-test-source-read-ratchet.mjs --update-baseline
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listRepoFiles, loadJson, pruneZeroFlat, writeJson } from './lib/count-ratchet.mjs';
import {
  countSourceReadsInTestText,
  diffTestSourceReadRatchet,
  formatTestSourceReadRatchetFailure,
  isRatchetTestFile,
} from './lib/test-source-reads.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'test-source-read-ratchet-baseline.json');

const UPDATE = process.argv.includes('--update-baseline');

/** @returns {Record<string, number>} */
export function measureTestSourceReadRatchet(root = ROOT) {
  const files = listRepoFiles(root, ['src', 'tests', 'scripts'], isRatchetTestFile);
  /** @type {Record<string, number>} */
  const measured = {};
  for (const relPath of files) {
    const text = fs.readFileSync(path.join(root, relPath), 'utf8');
    const n = countSourceReadsInTestText(text, relPath);
    if (n > 0) measured[relPath] = n;
  }
  return measured;
}

export function summarizeTestSourceReadRatchet(measured) {
  const fileCount = Object.keys(measured).length;
  const readTotal = Object.values(measured).reduce((a, b) => a + b, 0);
  return { fileCount, readTotal };
}

export function runTestSourceReadRatchetCheck({
  baselinePath = BASELINE_PATH,
  update = UPDATE,
  root = ROOT,
} = {}) {
  const measured = measureTestSourceReadRatchet(root);
  if (update) {
    writeJson(baselinePath, { files: pruneZeroFlat(measured) });
    const summary = summarizeTestSourceReadRatchet(measured);
    console.log(
      `Updated test source-read ratchet baseline (${summary.fileCount} files, ${summary.readTotal} source read call sites).`,
    );
    return { ok: true, measured, summary };
  }

  const baseline = loadJson(baselinePath, () => ({ files: {} })).files || {};
  const errors = diffTestSourceReadRatchet(measured, baseline);
  if (errors.length) {
    return { ok: false, errors, measured, summary: summarizeTestSourceReadRatchet(measured) };
  }
  const summary = summarizeTestSourceReadRatchet(measured);
  console.log(
    `Test source-read ratchet OK (${summary.fileCount} files, ${summary.readTotal} call sites, no regressions).`,
  );
  return { ok: true, measured, summary };
}

function main() {
  const result = runTestSourceReadRatchetCheck();
  if (!result.ok) {
    console.error(formatTestSourceReadRatchetFailure(result.errors));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
