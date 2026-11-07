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

const CHAR_FROM = /\.from\s*\(\s*['"]characters['"]\s*\)/g;

/**
 * One statement chain per `from('characters')` occurrence (stops at `;`).
 * @param {string} strippedSource
 * @returns {string[]}
 */
export function charactersTableWriteChains(strippedSource) {
  /** @type {string[]} */
  const chains = [];
  let match;
  while ((match = CHAR_FROM.exec(strippedSource)) !== null) {
    const fromIdx = match.index;
    const semi = strippedSource.indexOf(';', fromIdx);
    const end = semi === -1 ? strippedSource.length : semi + 1;
    chains.push(strippedSource.slice(fromIdx, end));
  }
  return chains;
}

/**
 * First argument of `.insert(` / `.update(` only — naive `(` / `)` balance (not string-aware).
 * @param {string} source
 * @param {number} openParenIdx index of `(` starting the call argument list
 * @returns {string}
 */
function balancedCallArgFrom(source, openParenIdx) {
  let depth = 0;
  for (let i = openParenIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        return source.slice(openParenIdx + 1, i).trim();
      }
    }
  }
  return '';
}

/** List/index columns on `characters` — not the JSONB `data` blob (strict metadata exemption). */
const METADATA_ONLY_KEYS = new Set([
  'updated_at',
  'created_at',
  'name',
  'level',
  'archetype_name',
  'ancestry_name',
  'status',
  'visibility',
  'client_request_id',
  'user_id',
  'id',
]);

/** Identifier or member access only — no calls, literals, quotes, or braces. */
const SIMPLE_VALUE = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/;

/**
 * Metadata-only inline object exemption (strict allowlist). Anything else is a sheet write.
 * @param {string} arg
 */
function isStrictMetadataOnlyInlineObject(arg) {
  const trimmed = arg.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
  if (/['"`]/.test(trimmed)) return false;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner || inner.includes('{') || inner.includes('}')) return false;
  if (/\.\.\./.test(inner) || /\bdata\b/.test(inner)) return false;
  const parts = inner
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  for (const part of parts) {
    const m = part.match(/^([a-zA-Z_][\w]*)\s*:\s*(.+)$/);
    if (!m) return false;
    if (!METADATA_ONLY_KEYS.has(m[1])) return false;
    if (!SIMPLE_VALUE.test(m[2].trim())) return false;
  }
  return true;
}

/**
 * False only for a strict metadata-only inline `{ ... }`; all other write args fail closed.
 * @param {string} arg
 */
function writeArgLooksLikeSheetPersist(arg) {
  return !isStrictMetadataOnlyInlineObject(arg);
}

/**
 * True when a chain-local `from('characters')` write likely persists sheet JSON (conservative).
 * @param {string} chain
 */
export function chainWritesCharacterSheetData(chain) {
  if (/\.insert\s*\(/.test(chain)) {
    const m = chain.match(/\.insert\s*\(/);
    if (m && m.index !== undefined) {
      const arg = balancedCallArgFrom(chain, m.index + m[0].length - 1);
      return writeArgLooksLikeSheetPersist(arg);
    }
    return true;
  }
  if (/\.upsert\s*\(/.test(chain)) return true;

  const updateMatch = chain.match(/\.update\s*\(/);
  if (!updateMatch || updateMatch.index === undefined) return false;

  const openParenIdx = updateMatch.index + updateMatch[0].length - 1;
  const arg = balancedCallArgFrom(chain, openParenIdx);
  return writeArgLooksLikeSheetPersist(arg);
}

/**
 * True when a chain-local `from('characters')` write is not a strict metadata-only exemption.
 * Those routes must call `evaluateCharacterLegalityForSave` (enforced in the gate).
 * @param {string} strippedSource
 */
export function routePersistsCharacterSheetData(strippedSource) {
  return charactersTableWriteChains(strippedSource).some(chainWritesCharacterSheetData);
}

/** @param {string} relPath @param {string} rawSource */
export function isCharacterPersistenceWriteRoute(relPath, rawSource) {
  if (!relPath.startsWith('src/app/api/') || !relPath.endsWith('/route.ts')) {
    return false;
  }
  return routePersistsCharacterSheetData(stripComments(rawSource));
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
  if (!fs.existsSync(dir)) return [];
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
    const code = stripComments(fs.readFileSync(full, 'utf8'));
    for (const id of FORBIDDEN_IDENTIFIERS) {
      if (code.includes(id)) {
        errors.push(`${rel}: must not reference removed level-1-only helper \`${id}\`.`);
      }
    }
  }

  for (const rel of listApiRouteFiles(root)) {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    if (!isCharacterPersistenceWriteRoute(rel, raw)) continue;
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
