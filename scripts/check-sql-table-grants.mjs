#!/usr/bin/env node
/**
 * Fail when a changed sql/ file defines CREATE TABLE without an explicit GRANT.
 * Only files in the diff are scanned, so untouched legacy migrations do not fail.
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
      out += ' ';
      i += 1;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          out += '  ';
          i += 2;
          continue;
        }
        const ch = sql[i];
        out += ch === '\n' ? '\n' : ' ';
        i += 1;
        if (ch === '"') break;
      }
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

/** @param {string} sql */
export function sqlDefinesCreateTableWithoutGrant(sql) {
  const code = sqlCodeWithoutCommentsAndLiterals(sql).toLowerCase();
  if (!/\bcreate\s+table\b/.test(code)) return false;
  return !/\bgrant\b/.test(code);
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
    if (sqlDefinesCreateTableWithoutGrant(sql)) {
      violations.push({
        file: normalized,
        reason:
          'contains CREATE TABLE but no GRANT (add explicit grants in the same file; see sql/_TEMPLATE_new_table.sql)',
      });
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
    'SQL grant check failed — new/changed migrations must GRANT in the same file as CREATE TABLE:\n',
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
