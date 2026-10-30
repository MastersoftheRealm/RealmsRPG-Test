#!/usr/bin/env node
/**
 * C4 ratchet — task / audit tag counts in src/, scripts/, sql/ (non-test, non-markdown).
 *
 * Fails when any per-file per-pattern count rises above the committed baseline, or when
 * a new scoped file contains any tags. Does not rewrite existing comments.
 *
 *   node scripts/check-task-id-ratchet.mjs
 *   node scripts/check-task-id-ratchet.mjs --update-baseline
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listRepoFiles, loadJson, pruneZeroCounts, writeJson } from './lib/count-ratchet.mjs';
import {
  diffTaskIdRatchet,
  formatTaskIdRatchetFailure,
  isTaskIdRatchetScopeFile,
  perPatternCounts,
  TASK_ID_PATTERNS,
  totalFromPerPattern,
} from './lib/task-id-tags.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'task-id-ratchet-baseline.json');

const UPDATE = process.argv.includes('--update-baseline');

/** @returns {Record<string, Record<string, number>>} */
export function measureTaskIdRatchet(root = ROOT) {
  const files = listRepoFiles(root, ['src', 'scripts', 'sql'], isTaskIdRatchetScopeFile);
  /** @type {Record<string, Record<string, number>>} */
  const measured = {};
  for (const relPath of files) {
    const text = fs.readFileSync(path.join(root, relPath), 'utf8');
    const counts = perPatternCounts(text);
    if (totalFromPerPattern(counts) > 0) measured[relPath] = counts;
  }
  return measured;
}

/** @returns {{ patternTotals: Record<string, number>, fileCount: number, tagTotal: number, keepInSync: number }} */
export function summarizeTaskIdRatchet(measured) {
  /** @type {Record<string, number>} */
  const patternTotals = Object.fromEntries(TASK_ID_PATTERNS.map((p) => [p.id, 0]));
  let keepInSync = 0;
  let tagTotal = 0;
  for (const counts of Object.values(measured)) {
    for (const [id, n] of Object.entries(counts)) {
      if (id === 'keepInSync') keepInSync += n;
      else if (patternTotals[id] !== undefined) patternTotals[id] += n;
      tagTotal += n;
    }
  }
  return { patternTotals, fileCount: Object.keys(measured).length, tagTotal, keepInSync };
}

export function runTaskIdRatchetCheck({
  baselinePath = BASELINE_PATH,
  update = UPDATE,
  root = ROOT,
} = {}) {
  const measured = measureTaskIdRatchet(root);
  if (update) {
    writeJson(baselinePath, { files: pruneZeroCounts(measured) });
    const summary = summarizeTaskIdRatchet(measured);
    console.log(
      `Updated task-id ratchet baseline (${summary.fileCount} files, ${summary.tagTotal} tagged occurrences).`,
    );
    return { ok: true, measured, summary };
  }

  const baseline = loadJson(baselinePath, () => ({ files: {} })).files || {};
  const errors = diffTaskIdRatchet(measured, baseline);
  if (errors.length) {
    return { ok: false, errors, measured, summary: summarizeTaskIdRatchet(measured) };
  }
  const summary = summarizeTaskIdRatchet(measured);
  console.log(
    `Task-id ratchet OK (${summary.fileCount} files in baseline scope with tags, ${summary.tagTotal} occurrences, no regressions).`,
  );
  return { ok: true, measured, summary };
}

function main() {
  const result = runTaskIdRatchetCheck();
  if (!result.ok) {
    console.error(formatTaskIdRatchetFailure(result.errors));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
