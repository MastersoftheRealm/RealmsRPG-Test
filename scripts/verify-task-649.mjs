/**
 * Post-apply verification for TASK-649 (advisor-parity SQL checks).
 * Usage: node scripts/verify-task-649.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
const rawUrl =
  env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim() ||
  env.match(/^DIRECT_URL=(.+)$/m)?.[1]?.trim();
const cleaned = rawUrl?.replace(/^["']|["']$/g, '');
const u = new URL(cleaned);
u.search = '';
if (u.port === '6543' || u.hostname.includes('pooler.supabase.com')) u.port = '5432';
const verify = path.join(root, 'sql/task-649-verify-applied.sql');
execSync(`psql "${u.toString()}" -v ON_ERROR_STOP=1 -f "${verify}"`, { stdio: 'inherit', shell: true });
