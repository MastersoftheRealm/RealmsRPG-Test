#!/usr/bin/env node
/**
 * Fail when a changed sql/ migration defines CREATE TABLE without an explicit GRANT.
 * Scoped to PR-changed files so legacy scripts are not retroactively gated.
 *
 * Ignores: sql/_TEMPLATE_new_table.sql, sql/schema/* baseline snapshots.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const IGNORED_REL = new Set(['sql/_TEMPLATE_new_table.sql', 'sql/_template_new_table.sql']);

/** @param {string} relPath posix-style path under repo root */
export function isIgnoredSqlGrantCheckPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (IGNORED_REL.has(normalized)) return true;
  if (normalized.startsWith('sql/schema/')) return true;
  return false;
}

/** @param {string} sql */
export function sqlDefinesCreateTableWithoutGrant(sql) {
  const lower = sql.toLowerCase();
  if (!/\bcreate\s+table\b/.test(lower)) return false;
  return !/\bgrant\b/.test(lower);
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

function resolveBaseRef() {
  const fromEnv =
    process.env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA ||
    process.env.GITHUB_BASE_SHA ||
    process.env.SQL_GRANTS_CHECK_BASE;
  if (fromEnv) return fromEnv;

  try {
    execSync('git rev-parse --verify origin/master', { cwd: repoRoot, stdio: 'ignore' });
    return execSync('git merge-base HEAD origin/master', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

function listChangedSqlFiles(baseRef) {
  const out = execSync(`git diff --name-only ${baseRef}...HEAD`, {
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
    console.log('check-sql-table-grants: skip (no merge base; not a PR context).');
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
