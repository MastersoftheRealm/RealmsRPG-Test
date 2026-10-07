/**
 * Test-only loader for `codex_csv/Realms Codex Test - Parts.csv`.
 * Official energy checks use this snapshot instead of hand-typed part costs.
 * Not a runtime pricing path, and not exported from the calculators barrel.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { PowerPart } from '@/hooks/codex-types';

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      quoted = true;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += c;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((values) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = values[index] ?? '';
    });
    return record;
  });
}

function num(value: string | undefined): number | undefined {
  if (value == null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Parts from the repo Codex CSV (the 2026-10-06 live snapshot). */
export function loadRepoCodexParts(
  file = path.join(process.cwd(), 'codex_csv/Realms Codex Test - Parts.csv'),
): PowerPart[] {
  const records = parseCsv(fs.readFileSync(file, 'utf8'));
  return records.map((row) => {
    const part: PowerPart = {
      id: row.id ?? '',
      name: row.name ?? '',
      description: row.description ?? '',
      category: row.category ?? '',
      type: (row.type || 'power').toLowerCase(),
      base_en: num(row.base_en) ?? 0,
      base_tp: num(row.base_tp) ?? 0,
      mechanic: row.mechanic === 'true',
      percentage: row.percentage === 'true',
      duration: row.duration === 'true',
    };
    const op1 = num(row.op_1_en);
    const op2 = num(row.op_2_en);
    const op3 = num(row.op_3_en);
    const tp1 = num(row.op_1_tp);
    const tp2 = num(row.op_2_tp);
    const tp3 = num(row.op_3_tp);
    if (row.op_1_desc) part.op_1_desc = row.op_1_desc;
    if (row.op_2_desc) part.op_2_desc = row.op_2_desc;
    if (row.op_3_desc) part.op_3_desc = row.op_3_desc;
    if (op1 !== undefined) part.op_1_en = op1;
    if (op2 !== undefined) part.op_2_en = op2;
    if (op3 !== undefined) part.op_3_en = op3;
    if (tp1 !== undefined) part.op_1_tp = tp1;
    if (tp2 !== undefined) part.op_2_tp = tp2;
    if (tp3 !== undefined) part.op_3_tp = tp3;
    return part;
  });
}

/** Snapshot rows for real Codex ids. Missing ids throw so a fixture cannot silently invent a cost. */
export function snapshotParts(ids: readonly number[], file?: string): PowerPart[] {
  const catalog = loadRepoCodexParts(file);
  return ids.map((id) => {
    const row = catalog.find((part) => part.id === String(id));
    if (!row) throw new Error(`Codex snapshot is missing part ${id}`);
    return row;
  });
}
