#!/usr/bin/env node
/**
 * D4 knip ratchet — unused export / exported-type counts must not rise (audit D4 dead-code).
 *
 *   node scripts/check-knip-ratchet.mjs
 *   node scripts/check-knip-ratchet.mjs --update-baseline
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJson } from './lib/count-ratchet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'knip-ratchet-baseline.json');
const UPDATE = process.argv.includes('--update-baseline');

/** @param {unknown} knip */
export function countKnipUnusedFromReport(knip) {
  let unusedExports = 0;
  let unusedTypes = 0;
  const issues = knip?.issues;
  if (!issues || typeof issues !== 'object') {
    throw new Error('knip JSON missing an issues object');
  }
  for (const issue of Object.values(issues)) {
    unusedExports += (issue.exports || []).length;
    unusedTypes += (issue.types || []).length;
  }
  return { unusedExports, unusedTypes };
}

/** @returns {string} */
function resolveKnipBin(root) {
  const localBin = path.join(root, 'node_modules', '.bin', 'knip');
  if (fs.existsSync(localBin)) return localBin;
  const noInstall = spawnSync('npx', ['--no-install', 'knip', '--version'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (noInstall.status === 0) return 'npx';
  throw new Error(
    'knip is not installed in this repo. Run npm ci from the repository root, then retry.',
  );
}

/** @returns {{ unusedExports: number, unusedTypes: number }} */
export function measureKnipUnused(root = ROOT) {
  const bin = resolveKnipBin(root);
  const args =
    bin === 'npx' ? ['--no-install', 'knip', '--reporter', 'json'] : ['--reporter', 'json'];
  const result = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DOTENV_CONFIG_QUIET: 'true' },
  });

  if (result.error) {
    throw new Error(`Failed to run knip: ${result.error.message}`);
  }

  const raw = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (!raw) {
    throw new Error(
      `knip produced no JSON (exit ${result.status ?? 'unknown'})${stderr ? `: ${stderr}` : ''}`,
    );
  }

  /** @type {unknown} */
  let knip;
  try {
    knip = JSON.parse(raw);
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    throw new Error(
      `knip JSON parse failed (exit ${result.status ?? 'unknown'}): ${msg}. stderr: ${stderr || '(none)'}`,
    );
  }

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`knip exited with status ${result.status}${stderr ? `: ${stderr}` : ''}`);
  }

  return countKnipUnusedFromReport(knip);
}

/**
 * @param {{ unusedExports: number, unusedTypes: number }} measured
 * @param {{ unusedExports: number, unusedTypes: number }} baseline
 * @returns {string[]}
 */
export function diffKnipRatchet(measured, baseline) {
  /** @type {string[]} */
  const errors = [];
  if (measured.unusedExports > baseline.unusedExports) {
    errors.push(
      `unusedExports ${measured.unusedExports} > baseline ${baseline.unusedExports}. Remove dead exports or run npm run tasks:knip-ratchet:update after intentional cleanup.`,
    );
  }
  if (measured.unusedTypes > baseline.unusedTypes) {
    errors.push(
      `unusedTypes ${measured.unusedTypes} > baseline ${baseline.unusedTypes}. Remove dead exported types or run npm run tasks:knip-ratchet:update after intentional cleanup.`,
    );
  }
  return errors;
}

/** @returns {{ unusedExports: number, unusedTypes: number }} */
export function readKnipBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(
      `Missing knip ratchet baseline at ${path.relative(ROOT, baselinePath)}. Run npm run tasks:knip-ratchet:update after verifying knip counts.`,
    );
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

export function runKnipRatchetCheck({
  baselinePath = BASELINE_PATH,
  update = UPDATE,
  root = ROOT,
  measure = measureKnipUnused,
} = {}) {
  const measured = measure(root);
  if (update) {
    writeJson(baselinePath, measured);
    console.log(
      `Updated knip ratchet baseline (unusedExports=${measured.unusedExports}, unusedTypes=${measured.unusedTypes}).`,
    );
    return { ok: true, measured };
  }

  let baseline;
  try {
    baseline = readKnipBaseline(baselinePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [message], measured, baseline: null };
  }

  const errors = diffKnipRatchet(measured, baseline);
  if (errors.length) {
    return { ok: false, errors, measured, baseline };
  }

  const belowBaseline =
    measured.unusedExports < baseline.unusedExports || measured.unusedTypes < baseline.unusedTypes;

  console.log(
    `Knip ratchet OK (unusedExports=${measured.unusedExports}, unusedTypes=${measured.unusedTypes}, no regressions).`,
  );
  if (belowBaseline) {
    console.log(
      'Knip counts are below the committed baseline; run npm run tasks:knip-ratchet:update to lock in the improvement.',
    );
  }
  return { ok: true, measured, baseline, belowBaseline };
}

/** @param {string[]} errors */
export function formatKnipRatchetFailure(errors) {
  return [
    'Knip unused-export ratchet failed (audit D4 dead-code).',
    ...errors.map((e) => `  - ${e}`),
    'When counts drop in a cleanup PR, run: npm run tasks:knip-ratchet:update',
  ].join('\n');
}

function main() {
  const result = runKnipRatchetCheck();
  if (!result.ok) {
    console.error(formatKnipRatchetFailure(result.errors));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
