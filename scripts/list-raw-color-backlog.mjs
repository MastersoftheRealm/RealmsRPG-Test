#!/usr/bin/env node
/**
 * Lists every source file that currently violates `realms/no-raw-color`,
 * formatted as a ready-to-paste array for eslint-rules/raw-color-backlog.mjs.
 *
 * Run after narrowing the backlog to confirm progress:
 *   node scripts/list-raw-color-backlog.mjs
 */
import { ESLint } from 'eslint';
import { relative } from 'node:path';

const eslint = new ESLint({ errorOnUnmatchedPattern: false });
const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);

const files = new Set();
for (const r of results) {
  if (r.messages.some((m) => m.ruleId === 'realms/no-raw-color')) {
    files.add(relative(process.cwd(), r.filePath).split('\\').join('/'));
  }
}

const sorted = [...files].sort();
console.error(`\n${sorted.length} file(s) currently violate realms/no-raw-color.\n`);
console.log(sorted.map((f) => `  '${f}',`).join('\n'));
