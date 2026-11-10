#!/usr/bin/env node
/**
 * Block direct INSERT/UPDATE/UPSERT on public.characters under src/.
 *
 *   node scripts/check-characters-direct-write.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCharactersDirectWriteGate } from './lib/characters-direct-write-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const { ok, errors } = runCharactersDirectWriteGate(ROOT);

if (!ok) {
  console.error('Characters direct-write gate failed:\n');
  for (const line of errors) console.error(`  - ${line}`);
  process.exit(1);
}

console.log('Characters direct-write gate OK.');
