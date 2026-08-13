#!/usr/bin/env node
/**
 * Codex collateral-loss scan
 * ==========================
 * Finds codex fields that went from a real value to null **without the application recording
 * the null in `changed_fields`**. That distinction is the whole point: report 13 of the
 * 2026-08-13 audit showed every previously-suspected loss was deliberate editorial work —
 * recorded in `changed_fields` with an explicit before/after. A null that is *absent* from
 * `changed_fields` is the opposite: the app did not know it was clearing the field, which is
 * the signature of a read/write asymmetry like the `mart_prof_req` projection defect.
 *
 * Needs database credentials, so it is NOT part of the PR gate. Run it manually or on a
 * schedule (see sql/README.md § Drift detection).
 *
 * Usage: npm run db:check-codex-drift        # exit 1 when collateral nulls are found
 */

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PAGE_SIZE = 1000;

function isRealValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function recordedFields(changedFields) {
  const names = new Set();
  if (!Array.isArray(changedFields)) return names;
  for (const entry of changedFields) {
    if (typeof entry === 'string') names.add(entry);
    else if (entry && typeof entry === 'object' && typeof entry.field === 'string')
      names.add(entry.field);
  }
  return names;
}

/**
 * Pure discriminator, exported for tests: a value-to-null transition only counts when the
 * changelog did not record it.
 */
export function findCollateralNulls(row) {
  if (row.operation !== 'update') return [];

  const before = row.before_data;
  const after = row.after_data;
  if (!before || typeof before !== 'object') return [];
  // An update whose after_data is empty is a delete-shaped record, not per-field loss.
  if (!after || typeof after !== 'object' || Object.keys(after).length === 0) return [];

  const recorded = recordedFields(row.changed_fields);
  const losses = [];
  for (const [field, beforeValue] of Object.entries(before)) {
    if (!isRealValue(beforeValue)) continue;
    if (isRealValue(after[field])) continue;
    if (recorded.has(field)) continue;
    losses.push({ field, before: beforeValue });
  }
  return losses;
}

function formatValue(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const dotenv = await import('dotenv');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const name of ['.env.local', '.env']) {
    dotenv.default.config({ path: path.join(repoRoot, name) });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or .env',
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const findings = [];
  let scanned = 0;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('codex_change_logs')
      .select(
        'id, entity_type, entity_id, operation, changed_at, before_data, after_data, changed_fields',
      )
      .order('changed_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`FAILURE: could not read codex_change_logs: ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    scanned += data.length;
    for (const row of data) {
      for (const loss of findCollateralNulls(row)) {
        findings.push({ ...loss, ...row });
      }
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Scanned ${scanned} codex_change_logs row(s).`);

  if (findings.length === 0) {
    console.log('\nSUCCESS: no value-to-null change was missing from changed_fields.');
    return;
  }

  console.error(
    `\nFAILURE: ${findings.length} unrecorded value-to-null change(s) — collateral loss, not a deliberate edit:\n`,
  );
  for (const finding of findings) {
    console.error(
      `  ${finding.entity_type} ${finding.entity_id} · ${finding.field} · ` +
        `was ${formatValue(finding.before)} · ${finding.changed_at} · log ${finding.id}`,
    );
  }
  console.error(
    '\nEach line is a field the admin UI wrote as null while believing it changed something else — ' +
      'check that the API projection for that table reads the column (see reports/audit-2026-08-13/13-codex-data-loss-determination.md).',
  );
  process.exit(1);
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`FAILURE: ${err.message || err}`);
    process.exit(1);
  });
}
