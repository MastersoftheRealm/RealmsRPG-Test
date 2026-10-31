#!/usr/bin/env node
/**
 * B5 prevention gate: block reintroducing level-1-only legality.
 *
 *   node scripts/check-character-legality-all-levels.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FORBIDDEN_IDENTIFIERS = ['shouldCheckLevel1Legality', 'findLevel1LegalityViolations'];

const REQUIRED_ROUTE_MARKERS = [
  {
    rel: 'src/app/api/characters/route.ts',
    needles: ['evaluateCharacterLegalityForSave'],
  },
  {
    rel: 'src/app/api/characters/[id]/route.ts',
    needles: ['evaluateCharacterLegalityForSave'],
  },
];

/** @param {string} relPath */
function readRepoFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(full, acc);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs)$/.test(name)) continue;
    acc.push(full);
  }
}

function main() {
  const errors = [];
  const srcRoot = path.join(ROOT, 'src');
  /** @type {string[]} */
  const files = [];
  walk(srcRoot, files);

  for (const full of files) {
    const rel = path.relative(ROOT, full);
    const text = fs.readFileSync(full, 'utf8');
    for (const id of FORBIDDEN_IDENTIFIERS) {
      if (text.includes(id)) {
        errors.push(`${rel}: must not reference removed level-1-only helper \`${id}\`.`);
      }
    }
  }

  for (const { rel, needles } of REQUIRED_ROUTE_MARKERS) {
    let text;
    try {
      text = readRepoFile(rel);
    } catch {
      errors.push(`${rel}: missing (legality save routes must call all-level checks).`);
      continue;
    }
    for (const needle of needles) {
      if (!text.includes(needle)) {
        errors.push(`${rel}: missing required legality marker \`${needle}\`.`);
      }
    }
  }

  if (errors.length) {
    console.error('Character legality all-levels gate failed:\n');
    for (const line of errors) console.error(`  - ${line}`);
    process.exit(1);
  }

  console.log('Character legality all-levels gate OK.');
}

main();
