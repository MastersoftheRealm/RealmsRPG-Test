#!/usr/bin/env node
/**
 * Local/CI: supabase start + pgTAP for inventory CAS (branch must pass; master baseline fails).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateMasterLwwNegativeOutput,
  validatePreFixCasAnonExecuteNegativeOutput,
} from './lib/inventory-cas-pgtap-harness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const onlyFail = process.argv.includes('--expect-fail');
const selfTestNegativeHarness = process.argv.includes('--self-test-negative-harness');
const inventoryCasHelpersSql = path.join(
  'sql',
  `characters-inventory-cas-patch-${['86e3', 'juw0a'].join('')}.sql`,
);

const BRANCH_CANONICAL_SQL = [
  'sql/tests/pgtap-relational-fk-stubs.sql',
  'sql/tests/inventory-cas-pgtap-bootstrap.sql',
  'sql/characters-relational-expand.sql',
  'sql/characters-relational-cutover.sql',
  'sql/characters-inventory-row-id.sql',
  inventoryCasHelpersSql,
  'sql/characters-relational-read-rpc.sql',
  'sql/characters-relational-write-rpc.sql',
];

const MASTER_CANONICAL_SQL = [
  'sql/tests/pgtap-relational-fk-stubs.sql',
  'sql/tests/inventory-cas-pgtap-bootstrap.sql',
  'sql/characters-relational-expand.sql',
  'sql/characters-relational-cutover.sql',
  'sql/characters-relational-read-rpc.sql',
  'sql/characters-relational-write-rpc.sql',
];

const MASTER_NEGATIVE_TEST = 'sql/tests/inventory_cas_pgtap_master_negative.sql';
const RELATIONAL_TEST = 'sql/tests/inventory_cas_pgtap_relational.sql';
const POST_ROLLBACK_TEST = 'sql/tests/inventory_cas_pgtap_post_rollback.sql';
const ANON_EXECUTE_GATE_TEST = 'sql/tests/inventory_cas_pgtap_anon_execute_gate.sql';
const ROLE_PRIVILEGES_TEST = 'sql/tests/inventory_cas_pgtap_role_privileges.sql';
/** Pre-fix inventory CAS on master (missing anon REVOKE on helpers). */
const PREF_FIX_CAS_REF = 'b9b23969';
const ROLLBACK_MASTER_REF = '8ae31ecd';
const ROLLBACK_RELATIONAL_MASTER = [
  'sql/characters-relational-expand.sql',
  'sql/characters-relational-cutover.sql',
  'sql/characters-relational-read-rpc.sql',
  'sql/characters-relational-write-rpc.sql',
];

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
  const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
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

function pgtap(dbUrl, relTestFile = 'sql/tests/inventory_cas_pgtap_test.sql') {
  const testFile = path.join(root, relTestFile);
  const res = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', testFile], {
    cwd: root,
    encoding: 'utf8',
  });
  const combined = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  const tapFailed = pgtapFails(combined);
  const status = res.status !== 0 ? res.status : tapFailed ? 1 : 0;
  return { ...res, status, combined };
}

function harnessExit(message) {
  console.error(message);
  process.exit(2);
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
  psqlSql(
    dbUrl,
    [
      'DROP SCHEMA IF EXISTS public CASCADE;',
      'CREATE SCHEMA public;',
      'GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;',
      'GRANT ALL ON SCHEMA public TO postgres;',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;',
    ].join('\n'),
  );
}

function gitShowRef(rel, ref) {
  return execFileSync('git', ['show', `${ref}:${rel}`], {
    cwd: root,
    encoding: 'utf8',
  });
}

function applySqlList(dbUrl, relPaths, { fromRef = null, casSqlRef = null } = {}) {
  for (const rel of relPaths) {
    if (casSqlRef && rel === inventoryCasHelpersSql) {
      const tmp = path.join(root, '.tmp-pgtap-inventory-cas.sql');
      fs.writeFileSync(tmp, gitShowRef(rel, casSqlRef));
      psqlFile(dbUrl, tmp);
      fs.unlinkSync(tmp);
      continue;
    }
    if (fromRef && rel.startsWith('sql/characters-relational-')) {
      const tmp = path.join(root, `.tmp-pgtap-${path.basename(rel)}`);
      const sql = gitShowRef(rel, fromRef);
      fs.writeFileSync(tmp, sql);
      psqlFile(dbUrl, tmp);
      fs.unlinkSync(tmp);
      continue;
    }
    psqlFile(dbUrl, rel);
  }
}

function runBranchRollbackLeg(dbUrl) {
  psqlFile(dbUrl, 'sql/characters-inventory-cas-patch-rollback.sql');
  applySqlList(dbUrl, ROLLBACK_RELATIONAL_MASTER, { fromRef: ROLLBACK_MASTER_REF });
  psqlFile(dbUrl, 'sql/characters-inventory-row-id-rollback.sql');
  const res = pgtap(dbUrl, POST_ROLLBACK_TEST);
  return res.status ?? 1;
}

function masterIncludesFullInventoryCasFix() {
  try {
    execFileSync('git', ['cat-file', '-e', `origin/master:sql/characters-inventory-row-id.sql`], {
      cwd: root,
      stdio: 'ignore',
    });
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
  applySqlList(dbUrl, MASTER_CANONICAL_SQL, { fromRef: 'origin/master' });
  const res = pgtap(dbUrl, MASTER_NEGATIVE_TEST);
  if ((res.status ?? 1) === 0) {
    return { type: 'unexpected_pass' };
  }
  const validation = validateMasterLwwNegativeOutput(res.combined);
  if (!validation.ok) {
    return { type: 'harness', error: validation.error };
  }
  return { type: 'negative_ok' };
}

function runPreFixCasAnonExecuteNegative(dbUrl) {
  resetDatabase(dbUrl);
  applySqlList(dbUrl, BRANCH_CANONICAL_SQL, { casSqlRef: PREF_FIX_CAS_REF });
  const res = pgtap(dbUrl, ANON_EXECUTE_GATE_TEST);
  if ((res.status ?? 1) === 0) {
    return { type: 'unexpected_pass' };
  }
  const validation = validatePreFixCasAnonExecuteNegativeOutput(res.combined);
  if (!validation.ok) {
    return { type: 'harness', error: validation.error };
  }
  return { type: 'negative_ok' };
}

function runBranchPositive(dbUrl) {
  resetDatabase(dbUrl);
  applySqlList(dbUrl, BRANCH_CANONICAL_SQL);
  let res = pgtap(dbUrl, ANON_EXECUTE_GATE_TEST);
  if ((res.status ?? 1) !== 0) return res.status ?? 1;
  res = pgtap(dbUrl, ROLE_PRIVILEGES_TEST);
  if ((res.status ?? 1) !== 0) return res.status ?? 1;
  res = pgtap(dbUrl);
  if ((res.status ?? 1) !== 0) return res.status ?? 1;
  res = pgtap(dbUrl, RELATIONAL_TEST);
  if ((res.status ?? 1) !== 0) return res.status ?? 1;
  return runBranchRollbackLeg(dbUrl);
}

function main() {
  if (selfTestNegativeHarness) {
    const reject = validatePreFixCasAnonExecuteNegativeOutput(
      'psql:gate.sql:50: ERROR:  function bag_eq(text[], text[], unknown) does not exist\n',
    );
    if (reject.ok) {
      harnessExit('self-test: negative harness must reject output containing ERROR:');
    }
    console.log('inventory-cas-pgtap: negative harness self-test OK (ERROR: rejected → would exit 2)');
    return;
  }

  startSupabase();
  const dbUrl = dbUrlFromSupabase();

  if (onlyFail) {
    if (masterIncludesFullInventoryCasFix()) {
      console.error('Master already includes inventory CAS fix; negative leg is not applicable.');
      process.exit(2);
    }
    const negative = runMasterNegative(dbUrl);
    if (negative.type === 'unexpected_pass') {
      console.error('Expected pgTAP to fail on master inventory CAS SQL; it passed.');
      process.exit(2);
    }
    if (negative.type === 'harness') {
      harnessExit(negative.error);
    }
    console.log('inventory-cas-pgtap: master baseline failed as expected.');
    return;
  }

  const preFixGate = runPreFixCasAnonExecuteNegative(dbUrl);
  if (preFixGate.type === 'unexpected_pass') {
    console.error(
      `Expected anon execute gate to fail with pre-fix CAS at ${PREF_FIX_CAS_REF}; it passed.`,
    );
    process.exit(2);
  }
  if (preFixGate.type === 'harness') {
    harnessExit(preFixGate.error);
  }
  console.log('inventory-cas-pgtap: pre-fix CAS anon execute gate failed as expected.');

  if (masterIncludesFullInventoryCasFix()) {
    console.log('inventory-cas-pgtap: master already has full fix; skipping LWW negative leg.');
  } else {
    const negative = runMasterNegative(dbUrl);
    if (negative.type === 'unexpected_pass') {
      console.error('Expected pgTAP to fail on master inventory CAS SQL; it passed.');
      process.exit(2);
    }
    if (negative.type === 'harness') {
      harnessExit(negative.error);
    }
    console.log('inventory-cas-pgtap: master LWW baseline failed as expected.');
  }

  const positive = runBranchPositive(dbUrl);
  if (positive !== 0) process.exit(positive);
  console.log('inventory-cas-pgtap: branch + relational + post-rollback OK');
}

main();