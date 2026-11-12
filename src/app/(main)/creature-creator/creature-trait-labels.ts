/**
 * Shared labels for stored creature size and language values.
 * Stored keys stay as they are (miniscule). Displays use these labels.
 */

import { findSizeTableRow } from '@/lib/game/size-table';
import { formatListCellLabel } from '@/lib/utils';

/** Hard cap on how many rows one creature picker confirm can add. */
const CREATURE_PICKER_SELECTION_CAP = 10;

/** Size-table label for a stored size key. Unknown keys keep the list-cell title case. */
export function creatureSizeDisplayLabel(size: string | null | undefined): string {
  if (size == null || String(size).trim() === '') return '-';
  return findSizeTableRow(size)?.label ?? formatListCellLabel(size);
}

/** Keep the first spelling. A later name that differs only by case is dropped. */
export function uniqueCreatureLanguages(languages: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of languages) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Null when blank or already listed in any case. */
export function appendCreatureLanguage(languages: readonly string[], raw: string): string[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const next = uniqueCreatureLanguages([...languages, trimmed]);
  if (next.length === uniqueCreatureLanguages(languages).length) return null;
  return next;
}

export function formatCreatureGroupedNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** 0 when that budget is already spent out; otherwise the picker row cap. */
export function creaturePickerMaxSelections(remaining: number): number {
  return remaining <= 0 ? 0 : CREATURE_PICKER_SELECTION_CAP;
}

export function creatureFeatRowsShowLevel(rows: ReadonlyArray<{ levelMeta?: unknown }>): boolean {
  return rows.some((row) => row.levelMeta != null);
}
