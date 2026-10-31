/**
 * B5 prevention gate — shared logic for lint script and unit test.
 */
import fs from 'node:fs';
import path from 'node:path';

export const FORBIDDEN_IDENTIFIERS = [
  'shouldCheckLevel1Legality',
  'findLevel1LegalityViolations',
  'shouldBlockCharacterSaveAtLevel',
  'resolveCharacterPatchLegality',
];

const API_ROOT = path.join('src', 'app', 'api');

/**
 * Strip comments without treating `//` inside string literals as comments.
 * @param {string} source
 */
export function stripComments(source) {
  let out = '';
  let i = 0;
  let mode = 'code';
  let quote = '';
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === 'code') {
      if (ch === '"' || ch === "'" || ch === '`') {
        mode = 'string';
        quote = ch;
        out += ch;
        i++;
        continue;
      }
      if (ch === '/' && next === '/') {
        i += 2;
        while (i < source.length && source[i] !== '\n') i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        i += 2;
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
      out += ch;
      i++;
      continue;
    }

    if (mode === 'string') {
      out += ch;
      if (ch === '\\' && i + 1 < source.length) {
        out += source[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        mode = 'code';
        quote = '';
      }
      i++;
      continue;
    }
  }
  return out;
}

const CHARACTER_PERSISTENCE_METHODS = ['POST', 'PATCH', 'PUT'];

/** @param {string} code @returns {string[]} */
export function mutationHandlersInRoute(code) {
  const stripped = stripComments(code);
  const handlers = [];
  const re = /export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\s*\(/g;
  let match;
  while ((match = re.exec(stripped)) !== null) {
    handlers.push(match[1]);
  }
  return handlers;
}

/** Routes that persist character JSON and must call evaluateCharacterLegalityForSave in write handlers. */
export function isCharacterPersistenceWriteRoute(relPath) {
  return (
    relPath === 'src/app/api/characters/route.ts' ||
    relPath === 'src/app/api/characters/[id]/route.ts'
  );
}

/**
 * @param {string} code
 * @param {'POST'|'PATCH'|'PUT'|'DELETE'} method
 */
export function handlerBody(code, method) {
  if (!CHARACTER_PERSISTENCE_METHODS.includes(method)) return '';
  if (!mutationHandlersInRoute(code).includes(method)) return '';
  const stripped = stripComments(code);
  const startRe = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
  const startMatch = stripped.match(startRe);
  if (!startMatch || startMatch.index === undefined) return '';
  const start = startMatch.index;
  const afterOpen = start + startMatch[0].length;
  const nextExport = stripped
    .slice(afterOpen)
    .search(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/);
  const end = nextExport === -1 ? stripped.length : afterOpen + nextExport;
  return stripped.slice(start, end);
}

/** @param {string} root @returns {string[]} */
export function listApiRouteFiles(root) {
  const dir = path.join(root, API_ROOT);
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

  for (const rel of listApiRouteFiles(root)) {
    if (!isCharacterPersistenceWriteRoute(rel)) continue;
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    const handlers = mutationHandlersInRoute(raw).filter((m) =>
      CHARACTER_PERSISTENCE_METHODS.includes(m),
    );
    if (handlers.length === 0) continue;
    for (const method of handlers) {
      const body = handlerBody(raw, method);
      if (!/\bevaluateCharacterLegalityForSave\s*\(/.test(body)) {
        errors.push(
          `${rel}: ${method} must call \`evaluateCharacterLegalityForSave(\` (character write legality).`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
