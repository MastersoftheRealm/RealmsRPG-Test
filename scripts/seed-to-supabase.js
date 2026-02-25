#!/usr/bin/env node
/**
 * Seed Codex Data from CSV (columnar tables)
 * ==========================================
 * Reads CSV files from scripts/seed-data/ or codex_csv/ and inserts into Supabase
 * codex tables using proper columns (no JSONB blob).
 *
 * Run: npm run db:seed
 * Or:  node scripts/seed-to-supabase.js
 *
 * This script always clears all codex tables before seeding. Use with care.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEED_DIR = path.join(__dirname, 'seed-data');
const CODEX_CSV_DIR = path.join(__dirname, '..', 'codex_csv');
const CODEX_CSV_DIR_LEGACY = path.join(__dirname, '..', 'Codex csv');

// Columns that are intentionally comma-separated arrays in CSV.
// All other columns (including descriptions with grammatical commas) stay as strings.
const ARRAY_COLUMNS = new Set([
  'tags',
  'sizes',
  'skills',
  'species_traits',
  'ancestry_traits',
  'flaws',
  'characteristics',
  'languages',
  'adulthood_lifespan',
  'type',
  'mechanic',
  'base_skill',
]);

// Map CSV filename (without .csv) to Prisma model / table
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
  items: 'codex_equipment', // Codex - Items.csv
  creature_feat: 'codex_creature_feats', // Codex - Creature_Feats.csv (singular)
};

// Map "Codex - Feats" -> "feats", "Realms Codex Test - Feats" -> "feats", etc.
function fileNameToTableKey(fileBase) {
  let normalized = fileBase.replace(/^Codex\s*-\s*/i, '').toLowerCase().replace(/\s+/g, '_');
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

/** Parse a CSV row into typed values; then build columnar payload (camelCase keys) for Prisma */
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

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

const TABLE_TO_MODEL = {
  codex_feats: prisma.codexFeat,
  codex_parts: prisma.codexPart,
  codex_properties: prisma.codexProperty,
  codex_species: prisma.codexSpecies,
  codex_traits: prisma.codexTrait,
  codex_skills: prisma.codexSkill,
  codex_archetypes: prisma.codexArchetype,
  codex_creature_feats: prisma.codexCreatureFeat,
  codex_equipment: prisma.codexEquipment,
};

async function seedTable(tableName, rows, idColumn = 'id') {
  const prismaModel = TABLE_TO_MODEL[tableName];

  if (!prismaModel) {
    console.warn(`  No Prisma model for ${tableName}, skipping`);
    return 0;
  }

  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = (row[idColumn] || row.id || slugify(row.name || row.Name || `row-${i}`)).trim();
    const idStr = id || `row-${i}`;
    if (!idStr) continue;

    const payload = rowToColumnarPayload(tableName, row);

    try {
      await prismaModel.upsert({
        where: { id: idStr },
        create: { id: idStr, ...payload },
        update: payload,
      });
      count++;
    } catch (err) {
      console.error(`  Error upserting ${idStr} in ${tableName}:`, err.message);
    }
  }
  return count;
}

async function clearCodexTables() {
  console.log('Clearing codex tables...');
  const tables = Object.keys(TABLE_TO_MODEL);
  for (const tableName of tables) {
    const model = TABLE_TO_MODEL[tableName];
    if (model) {
      try {
        await model.deleteMany({});
        console.log(`  Cleared ${tableName}`);
      } catch (err) {
        console.error(`  Failed to clear ${tableName}:`, err.message);
      }
    }
  }
  console.log('');
}

async function main() {
  // Always clear codex tables before seeding so we fully replace existing data.
  await clearCodexTables();

  console.log('Seeding codex data from CSV...\n');

  if (!fs.existsSync(SEED_DIR)) {
    console.log(`Creating ${SEED_DIR} (add your CSV files here)`);
    fs.mkdirSync(SEED_DIR, { recursive: true });
    console.log('No CSV files found. Add feats.csv, parts.csv, etc. and run again.');
    return;
  }

  let seedDir = SEED_DIR;
  const seedCsvCount = fs.existsSync(SEED_DIR) ? fs.readdirSync(SEED_DIR).filter((f) => f.endsWith('.csv')).length : 0;
  const codexCsvCount = fs.existsSync(CODEX_CSV_DIR) ? fs.readdirSync(CODEX_CSV_DIR).filter((f) => f.endsWith('.csv')).length : 0;
  const legacyCsvCount = fs.existsSync(CODEX_CSV_DIR_LEGACY) ? fs.readdirSync(CODEX_CSV_DIR_LEGACY).filter((f) => f.endsWith('.csv')).length : 0;
  if (seedCsvCount === 0 && codexCsvCount > 0) {
    seedDir = CODEX_CSV_DIR;
    console.log('Using codex_csv folder\n');
  } else if (seedCsvCount === 0 && legacyCsvCount > 0) {
    seedDir = CODEX_CSV_DIR_LEGACY;
    console.log('Using Codex csv folder\n');
  } else if (seedCsvCount === 0) {
    if (!fs.existsSync(SEED_DIR)) fs.mkdirSync(SEED_DIR, { recursive: true });
    console.log('No CSV files. Add feats.csv, etc. to scripts/seed-data/ or Codex csv/');
    return;
  }

  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log('No CSV files found.');
    return;
  }

  for (const file of files) {
    const base = path.basename(file, '.csv');
    const tableKey = fileNameToTableKey(base);
    const tableName = FILE_TO_TABLE[base] || FILE_TO_TABLE[tableKey];
    if (!tableName) {
      console.log(`Skipping ${file} (no table mapping)`);
      continue;
    }

    const filePath = path.join(seedDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
      console.log(`${file}: no rows`);
      continue;
    }

    const count = await seedTable(tableName, rows);
    console.log(`${file} -> ${tableName}: ${count} rows`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
