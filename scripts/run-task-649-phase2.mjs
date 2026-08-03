/**
 * Apply TASK-649 Phase 2 SQL bundle in order (applied 2026-08-03).
 * Requires DATABASE_URL in .env.local and psql on PATH.
 * Uses session pooler port 5432 (DDL-safe).
 *
 * Usage: node scripts/run-task-649-phase2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const rawUrl =
  env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim() ||
  env.match(/^DIRECT_URL=(.+)$/m)?.[1]?.trim();
const url = (() => {
  const cleaned = rawUrl?.replace(/^["']|["']$/g, '');
  if (!cleaned) return cleaned;
  try {
    const u = new URL(cleaned);
    u.search = '';
    if (u.port === '6543' || u.hostname.includes('pooler.supabase.com')) {
      u.port = '5432';
    }
    return u.toString();
  } catch {
    return cleaned;
  }
})();

if (!url) {
  console.error('DATABASE_URL or DIRECT_URL missing in .env.local');
  process.exit(1);
}

const files = [
  'sql/task-649-drop-codex-backup-tables-applied.sql',
  'sql/task-649-anon-least-privilege-applied.sql',
  'sql/task-649-characters-anon-public-read-applied.sql',
  'sql/task-649-codex-art-storage-select-hardening-applied.sql',
  'sql/task-649-feat-tag-function-search-path-applied.sql',
  'sql/task-649-index-hygiene-applied.sql',
];

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing file: ${rel}`);
    process.exit(1);
  }
  console.log(`\n=== Applying ${rel} ===`);
  execSync(`psql "${url}" -v ON_ERROR_STOP=1 -f "${abs}"`, { stdio: 'inherit', shell: true });
}

console.log('\nTASK-649 Phase 2 apply complete. Run: node scripts/verify-task-649.mjs');
