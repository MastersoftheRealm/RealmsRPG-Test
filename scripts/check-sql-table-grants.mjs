#!/usr/bin/env node
/**
 * Fail when a changed sql/ file defines CREATE TABLE without the repo template:
 * ENABLE ROW LEVEL SECURITY, CREATE POLICY, and GRANT SELECT to authenticated plus full
 * CRUD to service_role on new public tables. Only files in the diff are scanned unless
 * SQL_GRANTS_CHECK_TREE=1.
 *
 * Analysis lives in scripts/lib/sql-grant-check-engine.mjs (loop expansion, broad-policy
 * heuristics, anon write grants, and files without CREATE TABLE).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applySqlGrantCheckBaseline,
  validateSqlGrantCheckBaseline,
} from './lib/sql-grant-check-baseline.mjs';
import {
  expandForeachExecuteFormatSql,
  extractCreateTableTargets,
  findCreateTableSetupViolations,
  findSqlFileViolations,
  isIgnoredSqlGrantCheckPath,
  sqlCodeWithoutCommentsAndLiterals,
  sqlDefinesCreateTableWithoutGrant,
} from './lib/sql-grant-check-engine.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export {
  expandForeachExecuteFormatSql,
  extractCreateTableTargets,
  findCreateTableSetupViolations,
  sqlCodeWithoutCommentsAndLiterals,
  sqlDefinesCreateTableWithoutGrant,
};

export { isIgnoredSqlGrantCheckPath };

const COMMIT_SHA = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/i;

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
    const issues = findSqlFileViolations(sql, { relPath: normalized });
    for (const issue of issues) {
      violations.push({
        file: normalized,
        reason: issue.reason,
        statement: issue.statement ?? '',
      });
    }
  }
  return violations;
}

/**
 * @param {string} [root]
 */
export function findViolationsInSqlTree(root = repoRoot) {
  const sqlDir = path.join(root, 'sql');
  if (!fs.existsSync(sqlDir)) return [];
  /** @type {{ file: string; reason: string }[]} */
  const violations = [];
  for (const name of fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const rel = `sql/${name}`;
    if (isIgnoredSqlGrantCheckPath(rel)) continue;
    const sql = fs.readFileSync(path.join(sqlDir, name), 'utf8');
    for (const issue of findSqlFileViolations(sql, { relPath: rel })) {
      violations.push({
        file: rel,
        reason: issue.reason,
        statement: issue.statement ?? '',
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
 * @param {NodeJS.ProcessEnv} [env]
 * @param {object | null} [event]
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
  if (process.env.SQL_GRANTS_CHECK_TREE === '1') {
    const rawViolations = findViolationsInSqlTree();
    const baselineErrors = validateSqlGrantCheckBaseline(rawViolations);
    if (baselineErrors.length) {
      console.error('SQL grant check baseline is stale or unmatched:\n');
      for (const err of baselineErrors) {
        console.error(`  ${err}`);
      }
      process.exit(2);
    }
    const violations = applySqlGrantCheckBaseline(rawViolations);
    if (violations.length) {
      console.error('SQL grant check failed — sql/ tree has setup gaps:\n');
      for (const v of violations) {
        console.error(`  ${v.file}: ${v.reason}`);
      }
      process.exit(2);
    }
    const count = fs
      .readdirSync(path.join(repoRoot, 'sql'))
      .filter((f) => f.endsWith('.sql')).length;
    console.log(`check-sql-table-grants: tree OK (${count} file(s) under sql/).`);
    return;
  }

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
