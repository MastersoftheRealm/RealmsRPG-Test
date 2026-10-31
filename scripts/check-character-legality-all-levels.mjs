#!/usr/bin/env node
/**
 * B5 prevention gate: block reintroducing level-1-only legality.
 *
 *   node scripts/check-character-legality-all-levels.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCharacterLegalityAllLevelsGate } from './lib/character-legality-all-levels-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const { ok, errors } = runCharacterLegalityAllLevelsGate(ROOT);

if (!ok) {
  console.error('Character legality all-levels gate failed:\n');
  for (const line of errors) console.error(`  - ${line}`);
  process.exit(1);
}

console.log('Character legality all-levels gate OK.');
