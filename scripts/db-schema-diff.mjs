#!/usr/bin/env node
/**
 * Live schema vs committed baseline
 * =================================
 * Dumps the live schema with the same tool and flags that produced
 * `sql/schema/0000_baseline_<date>.sql` (`pg_dump --schema-only --no-owner --no-acl`),
 * normalises both sides, and diffs them.
 *
 * Usage:
 *   npm run db:diff                     # exit 1 on drift, 0 when identical
 *   npm run db:baseline:update          # refresh the committed baseline deliberately
 *   node scripts/db-schema-diff.mjs --allow-tool-mismatch
 *
 * Requires DIRECT_URL (preferred) or DATABASE_URL in .env.local / .env, and pg_dump.
 * Artifacts are written to .db-diff/ (gitignored) so a reported drift can be inspected.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaDir = path.join(repoRoot, 'sql', 'schema');
const workDir = path.join(repoRoot, '.db-diff');

const args = process.argv.slice(2);
const update = args.includes('--update');
const allowToolMismatch = args.includes('--allow-tool-mismatch');

function fail(message) {
  console.error(`\nFAILURE: ${message}`);
  process.exit(1);
}

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(repoRoot, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '');
    }
  }
}

function resolveDbUrl() {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) {
    fail('No DIRECT_URL or DATABASE_URL in .env.local / .env (see .env.example).');
  }
  const query = pooled.indexOf('?');
  return query > 0 ? pooled.slice(0, query) : pooled;
}

function resolvePgDump() {
  const candidates = ['pg_dump'];
  if (process.env.USERPROFILE) {
    candidates.push(
      path.join(
        process.env.USERPROFILE,
        'scoop',
        'apps',
        'postgresql',
        'current',
        'bin',
        'pg_dump.exe',
      ),
    );
  }
  const programFiles = 'C:\\Program Files\\PostgreSQL';
  if (fs.existsSync(programFiles)) {
    for (const dir of fs.readdirSync(programFiles).sort().reverse()) {
      candidates.push(path.join(programFiles, dir, 'bin', 'pg_dump.exe'));
    }
  }

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (probe.status === 0) {
      const version = /(\d+)\.(\d+)/.exec(probe.stdout ?? '');
      return {
        exe: candidate,
        major: version ? Number(version[1]) : null,
        raw: (probe.stdout ?? '').trim(),
      };
    }
  }
  return null;
}

function resolveBaseline() {
  if (!fs.existsSync(schemaDir)) fail(`Missing ${path.relative(repoRoot, schemaDir)}.`);
  const files = fs
    .readdirSync(schemaDir)
    .filter((file) => /^0000_baseline_.*\.sql$/.test(file))
    .sort();
  if (files.length === 0) {
    fail(`No sql/schema/0000_baseline_*.sql found. Create one with: npm run db:baseline:update`);
  }
  if (files.length > 1) {
    console.warn(`Multiple baselines present (${files.join(', ')}); using the newest.`);
  }
  return path.join(schemaDir, files[files.length - 1]);
}

const DOLLAR_TAG = /\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$/g;

/**
 * pg_dump output carries per-run noise: a random `\restrict` token, the dumping tool's
 * version, and `-- Name: …; Owner: -` headers. Object order also shifts when something is
 * recreated. Strip the noise and sort whole object blocks so a diff shows real changes only.
 *
 * Blank lines separate objects, but a `$$ … $$` function body may contain one, so
 * dollar-quoting is tracked and comments inside a body are kept as part of its definition.
 */
function normalizeDump(sql) {
  const blocks = [];
  let current = [];
  let dollarTag = null;

  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    const insideBody = dollarTag !== null;

    for (const match of line.matchAll(DOLLAR_TAG)) {
      if (dollarTag === null) dollarTag = match[0];
      else if (dollarTag === match[0]) dollarTag = null;
    }

    if (!insideBody && line === '') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
      continue;
    }
    if (!insideBody && (line.startsWith('--') || /^\\(un)?restrict\b/.test(line))) continue;

    current.push(line);
  }
  if (current.length > 0) blocks.push(current.join('\n'));

  blocks.sort();
  return `${blocks.join('\n\n')}\n`;
}

function dumpLiveSchema(pgDump, dbUrl, outFile) {
  const result = spawnSync(
    pgDump.exe,
    ['--schema-only', '--no-owner', '--no-acl', '--file', outFile, '--dbname', dbUrl],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    const detail = (result.stderr || result.error?.message || 'unknown error').trim();
    fail(`pg_dump failed: ${detail}\nTry DIRECT_URL on port 5432.`);
  }
}

function checkToolVersion(baselineSql, pgDump) {
  const recorded = /-- Dumped by pg_dump version (\d+)\.(\d+)/.exec(baselineSql);
  if (!recorded || pgDump.major === null) return;
  if (Number(recorded[1]) === pgDump.major) return;

  const message =
    `Baseline was dumped by pg_dump ${recorded[1]}.${recorded[2]} but this machine has ${pgDump.raw}. ` +
    'Different major versions format DDL differently, so every object would report as drift.';
  if (!allowToolMismatch) {
    fail(
      `${message}\nInstall a matching pg_dump, or re-run with --allow-tool-mismatch to see the raw diff anyway.`,
    );
  }
  console.warn(`WARNING: ${message}`);
}

loadEnv();

const pgDump = resolvePgDump();
if (!pgDump) {
  fail(
    'pg_dump not found. Install PostgreSQL client tools (winget install PostgreSQL.PostgreSQL.17, ' +
      'or scoop install postgresql) and ensure pg_dump is on PATH.',
  );
}

const baselinePath = resolveBaseline();
const baselineSql = fs.readFileSync(baselinePath, 'utf8');
checkToolVersion(baselineSql, pgDump);

fs.mkdirSync(workDir, { recursive: true });
const livePath = path.join(workDir, 'live-schema.sql');
console.log(`Dumping live schema with ${pgDump.raw}...`);
dumpLiveSchema(pgDump, resolveDbUrl(), livePath);

if (update) {
  const today = new Date().toISOString().slice(0, 10);
  const targetPath = path.join(schemaDir, `0000_baseline_${today}.sql`);
  fs.copyFileSync(livePath, targetPath);
  console.log(`\nSUCCESS: baseline written to ${path.relative(repoRoot, targetPath)}`);
  if (path.resolve(targetPath) !== path.resolve(baselinePath)) {
    console.log(
      `Previous baseline ${path.relative(repoRoot, baselinePath)} is now superseded — ` +
        'remove it in the same commit so exactly one baseline stays committed.',
    );
  }
  process.exit(0);
}

const baselineNormalized = path.join(workDir, 'baseline.normalized.sql');
const liveNormalized = path.join(workDir, 'live.normalized.sql');
fs.writeFileSync(baselineNormalized, normalizeDump(baselineSql));
fs.writeFileSync(liveNormalized, normalizeDump(fs.readFileSync(livePath, 'utf8')));

const diff = spawnSync(
  'git',
  ['diff', '--no-index', '--exit-code', '--', baselineNormalized, liveNormalized],
  { encoding: 'utf8' },
);

if (diff.status === 0) {
  console.log(`\nSUCCESS: live schema matches ${path.relative(repoRoot, baselinePath)}.`);
  process.exit(0);
}

process.stdout.write(diff.stdout ?? '');
console.error(
  `\nFAILURE: live schema has drifted from ${path.relative(repoRoot, baselinePath)}.\n` +
    'Every difference is a change applied to the database that is not in the committed baseline.\n' +
    'Add the missing migration to sql/, then run: npm run db:baseline:update\n' +
    `Normalised files: ${path.relative(repoRoot, baselineNormalized)} vs ${path.relative(repoRoot, liveNormalized)}`,
);
process.exit(1);
