/**
 * Block direct PostgREST INSERT/UPDATE/UPSERT on public.characters under src/.
 * Character saves must use relational RPCs (allowlisted below), not table writes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  charactersTableWriteChains,
  stripComments,
} from './character-legality-all-levels-gate.mjs';

export const ALLOWED_CHARACTER_WRITE_RPCS = [
  'add_campaign_character_relational',
  'create_character_relational',
  'get_campaign_character_relational_document',
  'get_character_relational_document',
  'patch_character_relational',
  'provision_character_relational',
  'remove_campaign_character_relational',
];

const WRITE_METHOD = /\.(insert|update|upsert)\s*\(/;

/**
 * @param {string} chain
 */
export function chainHasDirectCharacterTableWrite(chain) {
  return WRITE_METHOD.test(chain);
}

/**
 * @param {string} strippedSource
 * @returns {string[]}
 */
export function directCharacterTableWriteChains(strippedSource) {
  return charactersTableWriteChains(strippedSource).filter(chainHasDirectCharacterTableWrite);
}

/**
 * @param {string} root @returns {{ ok: boolean, errors: string[] }}
 */
export function runCharactersDirectWriteGate(root) {
  const errors = [];
  const srcRoot = path.join(root, 'src');
  if (!fs.existsSync(srcRoot)) {
    return { ok: true, errors };
  }

  /** @type {string[]} */
  const files = [];

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(name)) continue;
      files.push(full);
    }
  }
  walk(srcRoot);

  for (const full of files) {
    const rel = path.relative(root, full).split(path.sep).join('/');
    const stripped = stripComments(fs.readFileSync(full, 'utf8'));
    const chains = directCharacterTableWriteChains(stripped);
    for (const chain of chains) {
      const preview = chain.replace(/\s+/g, ' ').trim().slice(0, 120);
      errors.push(
        `${rel}: direct characters table write forbidden — use relational RPCs (${ALLOWED_CHARACTER_WRITE_RPCS.join(', ')}). Chain: ${preview}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
