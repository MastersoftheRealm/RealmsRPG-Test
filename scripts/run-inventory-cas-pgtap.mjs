#!/usr/bin/env node
/**
 * Local/CI: supabase start + pgTAP for inventory CAS (branch must pass; master baseline fails).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectFail = process.argv.includes('--expect-fail');

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

function pgtap(dbUrl) {
  return spawnSync(
    'pg_prove',
    ['-d', dbUrl, path.join(root, 'supabase/tests/inventory_cas_test.sql')],
    { cwd: root, encoding: 'utf8' },
  );
}

function dbUrlFromSupabase() {
  const out = run('supabase', ['status', '-o', 'env']);
  const line = out.split('\n').find((l) => l.startsWith('DB_URL='));
  if (!line) throw new Error('supabase status missing DB_URL');
  return line.slice('DB_URL='.length).replace(/^"|"$/g, '');
}

function applyInventorySql(dbUrl) {
  psqlFile(dbUrl, 'sql/tests/inventory-cas-pgtap-bootstrap.sql');
  if (fs.existsSync(path.join(root, 'sql/characters-inventory-row-id.sql'))) {
    psqlFile(dbUrl, 'sql/characters-inventory-row-id.sql');
  }
  psqlFile(dbUrl, 'sql/characters-inventory-cas-patch-86e3juw0a.sql');
}

function masterHasInventoryCas() {
  try {
    execFileSync('git', ['cat-file', '-e', 'origin/master:sql/characters-inventory-cas-patch-86e3juw0a.sql'], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  run('supabase', ['start', '-x', 'imgproxy', 'logflare', 'vector']);
  const dbUrl = dbUrlFromSupabase();

  if (expectFail) {
    psqlFile(dbUrl, 'sql/tests/inventory-cas-pgtap-bootstrap.sql');
    if (masterHasInventoryCas()) {
      const tmp = path.join(root, '.tmp-master-cas.sql');
      const sql = execFileSync(
        'git',
        ['show', 'origin/master:sql/characters-inventory-cas-patch-86e3juw0a.sql'],
        { cwd: root, encoding: 'utf8' },
      );
      fs.writeFileSync(tmp, sql);
      run('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', tmp]);
      fs.unlinkSync(tmp);
    }
    const res = pgtap(dbUrl);
    if (res.status === 0) {
      console.error('Expected pgTAP to fail on master inventory CAS SQL; it passed.');
      process.exit(2);
    }
    console.log('inventory-cas-pgtap: master baseline failed as expected.');
    return;
  }

  applyInventorySql(dbUrl);
  const res = pgtap(dbUrl);
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) process.exit(res.status ?? 2);
  console.log('inventory-cas-pgtap: OK');
}

main();