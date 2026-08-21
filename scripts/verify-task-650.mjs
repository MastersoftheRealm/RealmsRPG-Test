/**
 * Post-apply verification for TASK-650 (advisor-parity + RLS access smoke).
 * Exits non-zero when any assertion in task-650-verify-applied.sql fails.
 *
 * Usage: node scripts/verify-task-650.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
const rawUrl =
  env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim() || env.match(/^DIRECT_URL=(.+)$/m)?.[1]?.trim();
const cleaned = rawUrl?.replace(/^["']|["']$/g, '');
if (!cleaned) {
  console.error('DATABASE_URL or DIRECT_URL missing in .env.local');
  process.exit(1);
}
const u = new URL(cleaned);
u.search = '';
if (u.port === '6543' || u.hostname.includes('pooler.supabase.com')) u.port = '5432';

const verify = path.join(root, 'sql/task-650-verify-applied.sql');
try {
  execSync(`psql "${u.toString()}" -v ON_ERROR_STOP=1 -f "${verify}"`, {
    stdio: 'inherit',
    shell: true,
  });
} catch {
  console.error('TASK-650 verify failed');
  process.exit(1);
}
