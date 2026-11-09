#!/usr/bin/env node
/**
 * Fail when a changed sql/ file defines CREATE TABLE without the repo template:
 * ENABLE ROW LEVEL SECURITY, CREATE POLICY, and GRANT SELECT, INSERT, UPDATE, DELETE
 * to authenticated and service_role (public tables). Only files in the diff are scanned.
 *
 * Base ref:
 * - pull_request: event pull_request.base.sha
 * - push (including push to master): event before (the previous tip)
 * - local: merge-base of HEAD and origin/master
 *
 * Comments and quoted strings are not keywords. Dollar-quoted bodies are still
 * scanned, so a DO block that creates a table is caught; comments inside them
 * are ignored.
 * Ignores: sql/_TEMPLATE_new_table.sql, sql/schema/* baseline snapshots.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const IGNORED_REL = new Set(['sql/_TEMPLATE_new_table.sql', 'sql/_template_new_table.sql']);

const COMMIT_SHA = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/i;

const REQUIRED_PRIVILEGES = ['select', 'insert', 'update', 'delete'];
const REQUIRED_ROLES = ['authenticated', 'service_role'];

/** @param {string} relPath posix-style path under repo root */
export function isIgnoredSqlGrantCheckPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (IGNORED_REL.has(normalized)) return true;
  if (normalized.startsWith('sql/schema/')) return true;
  return false;
}

/**
 * SQL with comments and quoted strings blanked. Dollar-quoted bodies stay,
 * with their comments and strings removed, so keyword checks see statements.
 * @param {string} sql
 */
export function sqlCodeWithoutCommentsAndLiterals(sql) {
  let out = '';
  let i = 0;
  const n = sql.length;
  /** @type {string[]} */
  const dollarTags = [];

  const blankUntil = (end) => {
    while (i < end) {
      out += sql[i] === '\n' ? '\n' : ' ';
      i++;
    }
  };

  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];

    if (c === '-' && next === '-') {
      const nl = sql.indexOf('\n', i);
      blankUntil(nl === -1 ? n : nl);
      continue;
    }

    if (c === '/' && next === '*') {
      let depth = 1;
      out += '  ';
      i += 2;
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth += 1;
          out += '  ';
          i += 2;
          continue;
        }
        if (sql[i] === '*' && sql[i + 1] === '/') {
          depth -= 1;
          out += '  ';
          i += 2;
          continue;
        }
        out += sql[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    if (c === "'") {
      out += ' ';
      i += 1;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          out += '  ';
          i += 2;
          continue;
        }
        const ch = sql[i];
        out += ch === '\n' ? '\n' : ' ';
        i += 1;
        if (ch === "'") break;
      }
      continue;
    }

    if (c === '"') {
      let decoded = '';
      i += 1;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          decoded += '"';
          i += 2;
          continue;
        }
        const ch = sql[i];
        if (ch === '"') {
          i += 1;
          break;
        }
        decoded += ch;
        i += 1;
      }
      out += decodedToIdentifierToken(decoded);
      continue;
    }

    if (c === '$') {
      const match = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (match) {
        const tag = match[0];
        if (dollarTags.length && dollarTags[dollarTags.length - 1] === tag) {
          dollarTags.pop();
        } else {
          dollarTags.push(tag);
        }
        out += ' '.repeat(tag.length);
        i += tag.length;
        continue;
      }
    }

    out += c;
    i += 1;
  }

  return out;
}

/**
 * Double-quoted identifiers become one unquoted token (decoded name) so bodies
 * cannot spoof RLS, POLICY, or GRANT statements.
 * @param {string} decoded
 */
function decodedToIdentifierToken(decoded) {
  const name = decoded.replace(/""/g, '"');
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) {
    return name.toLowerCase();
  }
  return '__quoted_identifier__';
}

/** @param {string} name */
function escapeRegExp(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} schema
 * @param {string} tableName lowercased unquoted name
 */
function tableReferencePattern(schema, tableName) {
  const esc = escapeRegExp(tableName);
  const schemaPart =
    schema === 'public'
      ? `(?:(?:public|"public")\\s*\\.\\s*)?`
      : `(?:"${escapeRegExp(schema)}"|${escapeRegExp(schema)})\\s*\\.\\s*`;
  return `${schemaPart}(?:"${esc}"|${esc})`;
}

/**
 * @param {string} code sanitized sql (any case)
 * @returns {{ schema: string, name: string }[]}
 */
export function extractCreateTableTargets(code) {
  const re =
    /\bcreate\s+(?:unlogged\s+)?table(?!\s+as\b)(?:\s+if\s+not\s+exists)?\s+(?:"([^"]+)"\s*\.\s*"([^"]+)"|(?:(public)|([a-z_][a-z0-9_]*))\s*\.\s*(?:"([^"]+)"|([a-z_][a-z0-9_]*))|(?:"([^"]+)"|([a-z_][a-z0-9_]*)))/gi;
  /** @type {{ schema: string, name: string }[]} */
  const targets = [];
  let match;
  while ((match = re.exec(code))) {
    let schema;
    let name;
    if (match[1] && match[2]) {
      schema = match[1].toLowerCase();
      name = match[2].toLowerCase();
    } else if (match[3] || match[4] || match[5] || match[6]) {
      schema = (match[3] ?? match[4]).toLowerCase();
      name = (match[5] ?? match[6]).toLowerCase();
    } else {
      schema = 'public';
      name = (match[7] ?? match[8]).toLowerCase();
    }
    targets.push({ schema, name });
  }
  return targets;
}

/** @param {string} grantOn */
function parseGrantOnTable(grantOn) {
  let normalized = grantOn.replace(/\s+/g, ' ').trim().toLowerCase();
  normalized = normalized.replace(/^table\s+/, '');
  const quotedPair = normalized.match(/^"([^"]+)"\s*\.\s*"([^"]+)"$/);
  if (quotedPair) {
    return { schema: quotedPair[1].toLowerCase(), name: quotedPair[2].toLowerCase() };
  }
  const quotedTable = normalized.match(/^(?:(public)|([a-z_][a-z0-9_]*))\s*\.\s*"([^"]+)"$/);
  if (quotedTable) {
    const schema = (quotedTable[1] ?? quotedTable[2]).toLowerCase();
    return { schema, name: quotedTable[3].toLowerCase() };
  }
  const bare = normalized.match(
    /^(?:(public)|([a-z_][a-z0-9_]*))\s*\.\s*([a-z_][a-z0-9_]*|all\s+tables\s+in\s+schema\s+[a-z_][a-z0-9_]*)$/,
  );
  if (bare && !bare[3].startsWith('all tables')) {
    const schema = (bare[1] ?? bare[2]).toLowerCase();
    return { schema, name: bare[3].toLowerCase() };
  }
  const defaultSchema = normalized.match(/^(?:"([^"]+)"|([a-z_][a-z0-9_]*))$/);
  if (defaultSchema) {
    return { schema: 'public', name: (defaultSchema[1] ?? defaultSchema[2]).toLowerCase() };
  }
  return null;
}

/**
 * @param {string} privilegeList
 * @returns {Set<string>}
 */
function parseGrantPrivileges(privilegeList) {
  const privs = new Set();
  const lower = privilegeList.replace(/\s+/g, ' ').trim().toLowerCase();
  if (/^(all privileges|all)$/.test(lower)) {
    for (const p of REQUIRED_PRIVILEGES) privs.add(p);
    return privs;
  }
  for (const piece of lower.split(',')) {
    let part = piece.trim();
    if (!part) continue;
    const paren = part.indexOf('(');
    if (paren !== -1) part = part.slice(0, paren).trim();
    if (!part) continue;
    for (const p of REQUIRED_PRIVILEGES) {
      if (new RegExp(`\\b${p}\\b`).test(part)) privs.add(p);
    }
  }
  return privs;
}

/**
 * @param {string} toClause
 * @returns {Set<string>}
 */
function parseGrantRoles(toClause) {
  const roles = new Set();
  const lower = toClause.replace(/\s+/g, ' ').trim().toLowerCase();
  for (const role of REQUIRED_ROLES) {
    if (new RegExp(`\\b${role}\\b`).test(lower)) roles.add(role);
  }
  return roles;
}

/**
 * @param {string} code sanitized sql
 * @param {string} schema
 * @param {string} tableName
 * @returns {Map<string, Set<string>>}
 */
function grantsByRoleForTable(code, schema, tableName) {
  /** @type {Map<string, Set<string>>} */
  const byRole = new Map(REQUIRED_ROLES.map((role) => [role, new Set()]));
  const re = /\bgrant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+)/gi;
  let match;
  while ((match = re.exec(code))) {
    const onTable = parseGrantOnTable(match[2]);
    if (!onTable || onTable.schema !== schema || onTable.name !== tableName) continue;
    const privs = parseGrantPrivileges(match[1]);
    const roles = parseGrantRoles(match[3]);
    for (const role of roles) {
      const bucket = byRole.get(role);
      if (!bucket) continue;
      for (const p of privs) bucket.add(p);
    }
  }
  return byRole;
}

/**
 * @param {string} code sanitized sql
 * @param {string} schema
 * @param {string} tableName
 */
function hasEnableRls(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  return new RegExp(
    `\\balter\\s+table\\s+${ref}(?=\\s|;|$)\\s+enable\\s+row\\s+level\\s+security\\b`,
    'i',
  ).test(code);
}

/**
 * @param {string} code sanitized sql
 * @param {string} schema
 * @param {string} tableName
 */
function hasCreatePolicy(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  const policyName = `(?:"[^"]+"|[a-z_][a-z0-9_]*)`;
  return new RegExp(`\\bcreate\\s+policy\\s+${policyName}\\s+on\\s+${ref}(?=\\s|;|$)`, 'i').test(
    code,
  );
}

/**
 * @param {string} sql raw file contents
 * @returns {string[]} human-readable violation lines (empty when compliant or no CREATE TABLE)
 */
export function findCreateTableSetupViolations(sql) {
  const code = sqlCodeWithoutCommentsAndLiterals(sql);
  const targets = extractCreateTableTargets(code);
  if (!targets.length) return [];

  /** @type {string[]} */
  const violations = [];
  const seen = new Set();

  for (const { schema, name } of targets) {
    const key = `${schema}.${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const grants = grantsByRoleForTable(code, schema, name);

    if (schema === 'public') {
      if (!hasEnableRls(code, schema, name)) {
        violations.push(`${key}: missing ENABLE ROW LEVEL SECURITY in the same file`);
      }
      if (!hasCreatePolicy(code, schema, name)) {
        violations.push(`${key}: missing CREATE POLICY in the same file`);
      }
    }

    for (const role of REQUIRED_ROLES) {
      const held = grants.get(role) ?? new Set();
      const missing = REQUIRED_PRIVILEGES.filter((p) => !held.has(p));
      if (missing.length) {
        violations.push(
          `${key}: GRANT missing ${missing.join(', ').toUpperCase()} TO ${role} in the same file`,
        );
      }
    }
  }

  return violations;
}

/**
 * True when CREATE TABLE is present and template requirements are not met.
 * @param {string} sql
 */
export function sqlDefinesCreateTableWithoutGrant(sql) {
  return findCreateTableSetupViolations(sql).length > 0;
}

/**
 * @param {string[]} changedRelPaths
 * @returns {{ file: string; reason: string }[]}
 */
export function findGrantViolations(changedRelPaths) {
  const violations = [];
  for (const rel of changedRelPaths) {
    const normalized = rel.replace(/\\/g, '/');
    if (!normalized.startsWith('sql/') || !normalized.endsWith('.sql')) continue;
    if (isIgnoredSqlGrantCheckPath(normalized)) continue;

    const abs = path.join(repoRoot, normalized);
    if (!fs.existsSync(abs)) continue;

    const sql = fs.readFileSync(abs, 'utf8');
    const issues = findCreateTableSetupViolations(sql);
    if (issues.length) {
      for (const issue of issues) {
        violations.push({
          file: normalized,
          reason: issue,
        });
      }
    }
  }
  return violations;
}

/** @param {string} value */
function isCommitSha(value) {
  return typeof value === 'string' && COMMIT_SHA.test(value) && !/^0+$/.test(value);
}

/** @param {NodeJS.ProcessEnv} env */
function readGithubEvent(env) {
  const eventPath = env.GITHUB_EVENT_PATH;
  if (!eventPath) return null;
  try {
    return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  } catch {
    return null;
  }
}

function mergeBaseWithOriginMaster() {
  try {
    execFileSync('git', ['rev-parse', '--verify', 'origin/master'], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return execFileSync('git', ['merge-base', 'HEAD', 'origin/master'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Left side of `git diff <base>...HEAD`.
 * On a push to master, origin/master already is HEAD, so merge-base is empty.
 * That push must use the event's previous tip (`before`).
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @param {object | null} [event] webhook payload; omit to read GITHUB_EVENT_PATH; null skips the file
 * @returns {string | null}
 */
export function resolveBaseRef(env = process.env, event = undefined) {
  if (env.SQL_GRANTS_CHECK_BASE) return env.SQL_GRANTS_CHECK_BASE;

  const eventName = env.GITHUB_EVENT_NAME || '';
  const payload = event === undefined ? readGithubEvent(env) : event;

  if (eventName === 'pull_request') {
    const sha = payload?.pull_request?.base?.sha;
    return isCommitSha(sha) ? sha : null;
  }

  if (eventName === 'push') {
    const before = payload?.before;
    return isCommitSha(before) ? before : null;
  }

  if (env.GITHUB_BASE_SHA) return env.GITHUB_BASE_SHA;
  if (env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA) return env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA;

  return mergeBaseWithOriginMaster();
}

/** @param {string} baseRef */
export function changedFilesDiffArgs(baseRef) {
  if (
    typeof baseRef !== 'string' ||
    baseRef.startsWith('-') ||
    !/^[A-Za-z0-9._/^~-]+$/.test(baseRef)
  ) {
    throw new Error(`check-sql-table-grants: refusing git rev ${JSON.stringify(baseRef)}`);
  }
  return ['diff', '--name-only', `${baseRef}...HEAD`];
}

function listChangedSqlFiles(baseRef) {
  const out = execFileSync('git', changedFilesDiffArgs(baseRef), {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function main() {
  const baseRef = resolveBaseRef();
  if (!baseRef) {
    const eventName = process.env.GITHUB_EVENT_NAME;
    if (eventName === 'push' || eventName === 'pull_request') {
      console.error(
        `check-sql-table-grants: no base ref for GitHub ${eventName} (push uses event.before; pull_request uses pull_request.base.sha).`,
      );
      process.exit(2);
    }
    console.log('check-sql-table-grants: skip (no merge base).');
    return;
  }

  const changed = listChangedSqlFiles(baseRef);
  const violations = findGrantViolations(changed);

  if (!violations.length) {
    console.log(`check-sql-table-grants: OK (${changed.length} changed file(s) vs ${baseRef}).`);
    return;
  }

  console.error(
    'SQL grant check failed — new/changed migrations need RLS, policies, and explicit GRANTs in the same file as CREATE TABLE:\n',
  );
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.reason}`);
  }
  console.error('\nTemplate: sql/_TEMPLATE_new_table.sql · Docs: sql/README.md');
  process.exit(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
