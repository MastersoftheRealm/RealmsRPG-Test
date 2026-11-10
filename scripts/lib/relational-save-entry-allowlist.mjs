import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Parses entry allow-lists from assert_character_document_mapped in expand.sql.
 * @param {string} sql
 */
export function parseSqlEntryAllowlists(sql) {
  const out = {};
  const re = /\('([^']+)',\s*ARRAY\[([^\]]+)\]::text\[\]\)/g;
  for (const match of sql.matchAll(re)) {
    const collection = match[1];
    const keys = match[2]
      .split(',')
      .map((part) => part.trim().replace(/^'/, '').replace(/'$/, ''))
      .filter(Boolean);
    out[collection] = keys;
  }
  return out;
}

export function loadSqlEntryAllowlistsFromExpand(repoRoot = process.cwd()) {
  const sql = readFileSync(resolve(repoRoot, 'sql/characters-relational-expand.sql'), 'utf8');
  return parseSqlEntryAllowlists(sql);
}
