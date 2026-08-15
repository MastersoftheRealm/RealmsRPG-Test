#!/usr/bin/env node
/**
 * Seed Codex Data from CSV (columnar tables)
 * ==========================================
 * Reads CSV files from scripts/seed-data/ or codex_csv/ and upserts them into Supabase
 * codex tables using Supabase client (no Prisma).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 * Run: npm run db:seed                          # upsert only, never deletes
 * Or:  npm run db:seed:reset                    # clear-then-seed, requires confirmation
 *
 * Flags: --reset --allow-partial-reset --dry-run --yes
 * Deletion rules live in scripts/seed-plan.mjs (unit-tested); nothing is deleted before
 * every CSV has been parsed, validated and reported.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

for (const name of ['.env.local', '.env']) {
  require('dotenv').config({ path: path.join(__dirname, '..', name) });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or .env',
  );
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SEED_DIR = path.join(__dirname, 'seed-data');
const CODEX_CSV_DIR = path.join(__dirname, '..', 'codex_csv');
const CODEX_CSV_DIR_LEGACY = path.join(__dirname, '..', 'Codex csv');

const CONFIRMATION_PHRASE = 'reset codex';

const FILE_TO_TABLE = {
  feats: 'codex_feats',
  parts: 'codex_parts',
  properties: 'codex_properties',
  species: 'codex_species',
  traits: 'codex_traits',
  skills: 'codex_skills',
  archetypes: 'codex_archetypes',
  creature_feats: 'codex_creature_feats',
  equipment: 'codex_equipment',
  items: 'codex_equipment',
  creature_feat: 'codex_creature_feats',
};

const CODEX_TABLES = [
  'codex_feats',
  'codex_parts',
  'codex_properties',
  'codex_species',
  'codex_traits',
  'codex_skills',
  'codex_archetypes',
  'codex_creature_feats',
  'codex_equipment',
];

function fileNameToTableKey(fileBase) {
  let normalized = fileBase
    .replace(/^Codex\s*-\s*/i, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (normalized.includes('_-_')) normalized = normalized.split('_-_').pop() || normalized;
  if (normalized === 'creature_feats') return 'creature_feats';
  if (normalized === 'creature_feat') return 'creature_feats';
  if (normalized === 'items') return 'equipment';
  return normalized;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] !== undefined ? String(values[j]).trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) {
      current += c;
      continue;
    }
    if (c === ',') {
      result.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  result.push(current);
  return result;
}

function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s) {
  return s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

/** Build columnar payload (camelCase) from CSV row; then convert to snake_case for DB */
function rowToColumnarPayload(tableName, row) {
  const payload = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'id' || v === '' || v === undefined) continue;
    const camel = snakeToCamel(k);
    const lower = String(v).toLowerCase();
    if (lower === 'true') payload[camel] = true;
    else if (lower === 'false') payload[camel] = false;
    else if (/^-?\d+$/.test(String(v).trim())) payload[camel] = parseInt(v, 10);
    else if (/^-?\d*\.\d+$/.test(String(v).trim())) payload[camel] = parseFloat(v);
    else payload[camel] = v;
  }
  return payload;
}

function toSnakeRow(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[camelToSnake(k)] = v;
  }
  return out;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

/** A row is only seedable when it yields a stable id; index fallbacks would create junk rows. */
function rowId(row, idColumn = 'id') {
  const raw = row[idColumn] || row.id || slugify(row.name || row.Name || '');
  return String(raw || '').trim();
}

function resolveSeedDir() {
  for (const dir of [SEED_DIR, CODEX_CSV_DIR, CODEX_CSV_DIR_LEGACY]) {
    if (!fs.existsSync(dir)) continue;
    if (fs.readdirSync(dir).some((file) => file.endsWith('.csv'))) return dir;
  }
  return null;
}

/** Parse and validate every CSV up front, so no decision is made on unread input. */
function loadCsvTables(seedDir) {
  const loaded = {};
  const unmapped = [];

  for (const file of fs.readdirSync(seedDir).filter((f) => f.endsWith('.csv'))) {
    const base = path.basename(file, '.csv');
    const tableName = FILE_TO_TABLE[base] || FILE_TO_TABLE[fileNameToTableKey(base)];
    if (!tableName) {
      unmapped.push(file);
      continue;
    }

    const rows = parseCSV(fs.readFileSync(path.join(seedDir, file), 'utf-8'));
    const invalidRows = rows.filter((row) => !rowId(row)).length;
    const existing = loaded[tableName];
    if (existing) {
      existing.rows.push(...rows);
      existing.rowCount = existing.rows.length;
      existing.invalidRows += invalidRows;
      existing.file = `${existing.file} + ${file}`;
      continue;
    }
    loaded[tableName] = { file, rows, rowCount: rows.length, invalidRows };
  }

  return { loaded, unmapped };
}

async function fetchLiveCounts(tables) {
  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    counts[table] = error ? null : (count ?? null);
  }
  return counts;
}

function confirm(phrase) {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`Type "${phrase}" to proceed: `, (answer) => {
      rl.close();
      resolve(answer.trim() === phrase);
    });
  });
}

async function clearTable(tableName) {
  const { data: rows, error: selectError } = await supabase.from(tableName).select('id');
  if (selectError)
    throw new Error(`Cannot read ${tableName} before clearing: ${selectError.message}`);

  const ids = (rows || []).map((r) => r.id);
  const batch = 200;
  for (let i = 0; i < ids.length; i += batch) {
    const chunk = ids.slice(i, i + batch);
    const { error } = await supabase.from(tableName).delete().in('id', chunk);
    if (error) throw new Error(`Failed to clear ${tableName}: ${error.message}`);
  }
  return ids.length;
}

async function seedTable(tableName, rows) {
  let count = 0;
  let skipped = 0;
  for (const row of rows) {
    const id = rowId(row);
    if (!id) {
      skipped++;
      continue;
    }

    const payload = rowToColumnarPayload(tableName, row);
    const dbRow = { id, ...toSnakeRow(payload) };

    const { error } = await supabase.from(tableName).upsert(dbRow, { onConflict: 'id' });
    if (error) {
      console.error(`  Error upserting ${id} in ${tableName}:`, error.message);
    } else {
      count++;
    }
  }
  return { count, skipped };
}

async function main() {
  const { parseSeedArgs, buildSeedPlan, formatSeedPlan } = await import('./seed-plan.mjs');
  const options = parseSeedArgs(process.argv.slice(2));

  const seedDir = resolveSeedDir();
  if (!seedDir) {
    fs.mkdirSync(SEED_DIR, { recursive: true });
    console.error(
      `No CSV files found in ${SEED_DIR}, ${CODEX_CSV_DIR} or ${CODEX_CSV_DIR_LEGACY}.\n` +
        'Add feats.csv, parts.csv, etc. and run again. Nothing was changed.',
    );
    process.exit(1);
  }

  const { loaded, unmapped } = loadCsvTables(seedDir);
  const liveCounts = await fetchLiveCounts(CODEX_TABLES);
  const plan = buildSeedPlan({ tables: CODEX_TABLES, loaded, liveCounts, options });

  console.log(formatSeedPlan(plan, { seedDir }));
  if (unmapped.length > 0) {
    console.log(`\nIgnored (no table mapping): ${unmapped.join(', ')}`);
  }

  if (plan.blockers.length > 0) {
    console.error('\nRefusing to run:');
    for (const blocker of plan.blockers) console.error(`  - ${blocker}`);
    process.exit(1);
  }

  if (plan.dryRun) {
    console.log('\nDry run — no rows were read into or deleted from the database.');
    return;
  }

  if (plan.clearTables.length > 0) {
    console.log(
      `\nThis will DELETE every row from: ${plan.clearTables.map((row) => row.table).join(', ')}`,
    );
    if (plan.requiresConfirmation) {
      const confirmed = await confirm(CONFIRMATION_PHRASE);
      if (!confirmed) {
        console.error(
          process.stdin.isTTY
            ? 'Confirmation did not match. Nothing was changed.'
            : 'Confirmation required but stdin is not interactive. Re-run with --yes. Nothing was changed.',
        );
        process.exit(1);
      }
    }

    for (const row of plan.clearTables) {
      const deleted = await clearTable(row.table);
      console.log(`  Cleared ${row.table} (${deleted} rows)`);
    }
  }

  console.log('');
  for (const row of plan.upsertTables) {
    const entry = loaded[row.table];
    const { count, skipped } = await seedTable(row.table, entry.rows);
    const suffix = skipped > 0 ? ` (${skipped} skipped — no id)` : '';
    console.log(`${entry.file} -> ${row.table}: ${count} rows${suffix}`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
