/**
 * Known sql/ grant-check violations pinned until SQL is fixed.
 * Each entry must match a live violation (file + reason + statement in file); orphan entries fail CI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE_PATH = path.join(repoRoot, 'scripts/sql-grant-check-baseline.json');

/**
 * @param {string} text
 */
export function normalizeSqlStatement(text) {
  return text
    .replace(/;+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * @param {string} sql
 * @returns {string}
 */
export function normalizeSqlFileForStatementMatch(sql) {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * @returns {{ exceptions: { file: string, statement: string, reason: string }[] }}
 */
export function loadSqlGrantCheckBaseline(baselinePath = BASELINE_PATH) {
  const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (!Array.isArray(raw.exceptions)) {
    throw new Error('sql-grant-check-baseline.json must have an "exceptions" array');
  }
  return raw;
}

/**
 * @param {{ file: string, reason: string, statement?: string }[]} violations
 * @param {string} [root]
 * @returns {string[]}
 */
/**
 * @returns {string[]}
 */
export function validateSqlGrantCheckBaselineStructure() {
  const { exceptions } = loadSqlGrantCheckBaseline();
  /** @type {string[]} */
  const errors = [];
  const seen = new Set();
  for (const entry of exceptions) {
    const statement = normalizeSqlStatement(entry.statement ?? '');
    const reason = (entry.reason ?? '').trim();
    if (!entry.file?.trim()) errors.push('baseline invalid: entry missing file');
    if (!statement) errors.push(`baseline invalid: empty statement in ${entry.file}`);
    if (!reason) errors.push(`baseline invalid: empty reason in ${entry.file}`);
    const key = `${entry.file}\0${statement}\0${reason}`;
    if (seen.has(key)) errors.push(`baseline invalid: duplicate entry for ${entry.file}`);
    seen.add(key);
  }
  return errors;
}

export function validateSqlGrantCheckBaseline(violations, root = repoRoot) {
  const { exceptions } = loadSqlGrantCheckBaseline();
  /** @type {string[]} */
  const errors = [...validateSqlGrantCheckBaselineStructure()];

  for (const entry of exceptions) {
    const abs = path.join(root, entry.file);
    if (!fs.existsSync(abs)) {
      errors.push(`baseline stale: missing file ${entry.file}`);
      continue;
    }
    const normalizedFile = normalizeSqlFileForStatementMatch(fs.readFileSync(abs, 'utf8'));
    const needle = normalizeSqlStatement(entry.statement);
    if (!normalizedFile.includes(needle)) {
      errors.push(`baseline stale: statement not in ${entry.file}: ${entry.statement}`);
      continue;
    }
    const matched = violations.some(
      (v) =>
        v.file === entry.file &&
        v.reason === entry.reason &&
        normalizeSqlStatement(v.statement ?? '') === needle,
    );
    if (!matched) {
      errors.push(
        `baseline stale: ${entry.file} no matching violation for statement: ${entry.statement}`,
      );
    }
  }
  return errors;
}

/**
 * @param {{ file: string, reason: string, statement?: string }[]} violations
 * @param {string} [root]
 */
export function applySqlGrantCheckBaseline(violations, root = repoRoot) {
  const { exceptions } = loadSqlGrantCheckBaseline();
  const remaining = [...violations];
  for (const entry of exceptions) {
    const abs = path.join(root, entry.file);
    if (!fs.existsSync(abs)) continue;
    const normalizedFile = normalizeSqlFileForStatementMatch(fs.readFileSync(abs, 'utf8'));
    const needle = normalizeSqlStatement(entry.statement);
    if (!normalizedFile.includes(needle)) continue;
    const idx = remaining.findIndex(
      (v) =>
        v.file === entry.file &&
        v.reason === entry.reason &&
        normalizeSqlStatement(v.statement ?? '') === needle,
    );
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}
