#!/usr/bin/env node
/**
 * D4 knip ratchet — unused export / exported-type counts must not rise (audit D4 dead-code).
 *
 *   node scripts/check-knip-ratchet.mjs
 *   node scripts/check-knip-ratchet.mjs --update-baseline
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadJson, writeJson } from './lib/count-ratchet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'knip-ratchet-baseline.json');
const UPDATE = process.argv.includes('--update-baseline');

/** @returns {{ unusedExports: number, unusedTypes: number }} */
export function measureKnipUnused(root = ROOT) {
  const result = spawnSync('npx', ['knip', '--reporter', 'json'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DOTENV_CONFIG_QUIET: 'true' },
  });
  const raw = result.stdout || '';
  if (!raw.trim()) {
    throw new Error(
      `knip produced no JSON output (exit ${result.status}): ${result.stderr || '(no stderr)'}`,
    );
  }
  const knip = JSON.parse(raw);
  let unusedExports = 0;
  let unusedTypes = 0;
  for (const issue of Object.values(knip.issues)) {
    unusedExports += (issue.exports || []).length;
    unusedTypes += (issue.types || []).length;
  }
  return { unusedExports, unusedTypes };
}

export function runKnipRatchetCheck({
  baselinePath = BASELINE_PATH,
  update = UPDATE,
  root = ROOT,
} = {}) {
  const measured = measureKnipUnused(root);
  if (update) {
    writeJson(baselinePath, measured);
    console.log(
      `Updated knip ratchet baseline (unusedExports=${measured.unusedExports}, unusedTypes=${measured.unusedTypes}).`,
    );
    return { ok: true, measured };
  }

  const baseline = loadJson(baselinePath, () => ({
    unusedExports: measured.unusedExports,
    unusedTypes: measured.unusedTypes,
  }));

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

  if (errors.length) {
    return { ok: false, errors, measured, baseline };
  }

  console.log(
    `Knip ratchet OK (unusedExports=${measured.unusedExports}, unusedTypes=${measured.unusedTypes}, no regressions).`,
  );
  return { ok: true, measured, baseline };
}

function main() {
  const result = runKnipRatchetCheck();
  if (!result.ok) {
    console.error('Knip unused-export ratchet failed (audit D4 dead-code).');
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
