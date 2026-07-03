#!/usr/bin/env node
/** One-off: sync codex_feats.tags from Supabase into scripts/seed-data/feats.csv */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

function escapeCSV(val) {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const csvPath = path.join(__dirname, 'seed-data', 'feats.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  const tagsIdx = headers.indexOf('tags');
  if (tagsIdx < 0) throw new Error('tags column not found');

  const { data, error } = await supabase.from('codex_feats').select('id,tags');
  if (error) throw error;

  const tagById = new Map(
    data.map((r) => [String(r.id), (r.tags || '').replace(/,\s*$/, '')])
  );

  let updated = 0;
  const out = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const id = vals[0];
    if (tagById.has(id)) {
      const dbTags = tagById.get(id);
      const csvTags = (vals[tagsIdx] || '').replace(/,\s*$/, '');
      if (dbTags !== csvTags) {
        vals[tagsIdx] = dbTags;
        updated++;
      }
    }
    out.push(vals.map(escapeCSV).join(','));
  }
  fs.writeFileSync(csvPath, `${out.join('\n')}\n`);
  console.log(`Synced tags on ${updated} row(s) in feats.csv`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
