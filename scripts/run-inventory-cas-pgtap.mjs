#!/usr/bin/env node
/**
 * Local/CI: supabase start + pgTAP for inventory CAS (branch must pass; master baseline fails).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const onlyFail = process.argv.includes('--expect-fail');
const inventoryCasHelpersSql = path.join(
  'sql',
  `characters-inventory-cas-patch-${['86e3', 'juw0a'].join('')}.sql`,
);

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
  if (res.status !== 0) {
    const err = new Error(`${cmd} ${args.join(' ')} failed (${res.status})`);
    err.stdout = res.stdout;
    err.stderr = res.stderr;
    throw err;
  }
  return res.stdout;
}

function psqlFile(dbUrl, rel) {
  const abs = path.join(root, rel);
  run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', abs]);
}

function psqlSql(dbUrl, sql) {
  run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql]);
}

function pgtapFails(combined) {
  return (
    /^not ok /m.test(combined) ||
    /# Looks like you failed/i.test(combined) ||
    /# Looks like you planned \d+ tests but/i.test(combined)
  );
}

function pgtap(dbUrl) {
  const testFile = path.join(root, 'sql/tests/inventory_cas_pgtap_test.sql');
  const res = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', testFile], {
    cwd: root,
    encoding: 'utf8',
  });
  const combined = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  const tapFailed = pgtapFails(combined);
  const status = res.status !== 0 ? res.status : tapFailed ? 1 : 0;
  return { ...res, status };
}

function dbUrlFromSupabase() {
  const out = run('supabase', ['status', '-o', 'env']);
  const line = out.split('\n').find((l) => l.startsWith('DB_URL='));
  if (!line) throw new Error('supabase status missing DB_URL');
  return line.slice('DB_URL='.length).replace(/^"|"$/g, '');
}

function startSupabase() {
  run('supabase', [
    'start',
    '-x',
    'imgproxy',
    '-x',
    'logflare',
    '-x',
    'vector',
    '--ignore-health-check',
  ]);
}

function resetDatabase(dbUrl) {
  psqlSql(dbUrl, 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  psqlFile(dbUrl, 'sql/tests/inventory-cas-pgtap-bootstrap.sql');
}

function applyInventorySql(dbUrl) {
  if (fs.existsSync(path.join(root, 'sql/characters-inventory-row-id.sql'))) {
    psqlFile(dbUrl, 'sql/characters-inventory-row-id.sql');
  }
  psqlFile(dbUrl, inventoryCasHelpersSql);
}

function masterHasInventoryCas() {
  try {
    execFileSync('git', ['cat-file', '-e', `origin/master:${inventoryCasHelpersSql}`], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function runMasterNegative(dbUrl) {
  resetDatabase(dbUrl);
  if (masterHasInventoryCas()) {
    const tmp = path.join(root, '.tmp-master-cas.sql');
    const sql = execFileSync('git', ['show', `origin/master:${inventoryCasHelpersSql}`], {
      cwd: root,
      encoding: 'utf8',
    });
    fs.writeFileSync(tmp, sql);
    run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', tmp]);
    fs.unlinkSync(tmp);
  }
  const res = pgtap(dbUrl);
  return res.status ?? 1;
}

function runBranchPositive(dbUrl) {
  resetDatabase(dbUrl);
  applyInventorySql(dbUrl);
  const res = pgtap(dbUrl);
  return res.status ?? 1;
}

function main() {
  startSupabase();
  const dbUrl = dbUrlFromSupabase();

  if (onlyFail) {
    const code = runMasterNegative(dbUrl);
    if (code === 0) {
      console.error('Expected pgTAP to fail on master inventory CAS SQL; it passed.');
      process.exit(2);
    }
    console.log('inventory-cas-pgtap: master baseline failed as expected.');
    return;
  }

  const negative = runMasterNegative(dbUrl);
  if (negative === 0) {
    console.error('Expected pgTAP to fail on master inventory CAS SQL; it passed.');
    process.exit(2);
  }
  console.log('inventory-cas-pgtap: master baseline failed as expected.');

  const positive = runBranchPositive(dbUrl);
  if (positive !== 0) process.exit(positive);
  console.log('inventory-cas-pgtap: branch OK');
}

main();