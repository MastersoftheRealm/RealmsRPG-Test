/**
 * Apply TASK-650 campaigns RLS SELECT consolidation.
 * Requires DATABASE_URL in .env.local and psql on PATH.
 *
 * Usage: node scripts/run-task-650.mjs
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

const file = 'sql/task-650-campaigns-rls-select-consolidation-applied.sql';
console.log(`Applying ${file}...`);
execSync(`psql "${url}" -v ON_ERROR_STOP=1 -f "${path.join(root, file)}"`, {
  stdio: 'inherit',
  shell: true,
});
console.log('Done. Run: node scripts/verify-task-650.mjs');
