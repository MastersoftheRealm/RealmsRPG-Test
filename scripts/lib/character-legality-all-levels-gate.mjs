/**
 * B5 prevention gate — shared logic for lint script and unit test.
 */
import fs from 'node:fs';
import path from 'node:path';

export const FORBIDDEN_IDENTIFIERS = ['shouldCheckLevel1Legality', 'findLevel1LegalityViolations'];

const SAVE_ROUTE_GLOB = path.join('src', 'app', 'api', 'characters');

/** Strip line and block comments so substring checks match real code only. */
export function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('//', i)) {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    out += source[i];
    i++;
  }
  return out;
}

/** @param {string} root @returns {string[]} */
export function listCharacterSaveRouteFiles(root) {
  const dir = path.join(root, SAVE_ROUTE_GLOB);
  /** @type {string[]} */
  const relPaths = [];
  function walk(current) {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (name === 'route.ts') {
        relPaths.push(path.relative(root, full).split(path.sep).join('/'));
      }
    }
  }
  walk(dir);
  return relPaths.sort();
}

/** @param {string} root @returns {{ ok: boolean, errors: string[] }} */
export function runCharacterLegalityAllLevelsGate(root) {
  const errors = [];
  const srcRoot = path.join(root, 'src');
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
    const code = stripComments(fs.readFileSync(full, 'utf8'));
    for (const id of FORBIDDEN_IDENTIFIERS) {
      if (code.includes(id)) {
        errors.push(`${rel}: must not reference removed level-1-only helper \`${id}\`.`);
      }
    }
  }

  for (const rel of listCharacterSaveRouteFiles(root)) {
    const code = stripComments(fs.readFileSync(path.join(root, rel), 'utf8'));
    if (!/\bevaluateCharacterLegalityForSave\s*\(/.test(code)) {
      errors.push(`${rel}: must call \`evaluateCharacterLegalityForSave(\` for save legality.`);
    }
  }

  return { ok: errors.length === 0, errors };
}
