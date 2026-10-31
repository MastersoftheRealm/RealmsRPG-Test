/**
 * Shared labels for stored creature sense, movement, size, and language values.
 * Stored keys stay as they are (Fly, Fly Half, miniscule). Displays use these labels.
 */

import {
  MOVEMENT_DESCRIPTIONS,
  SENSE_DESCRIPTIONS,
} from '@/components/patterns/list/creature-stat-block-helpers';
import { findSizeTableRow } from '@/lib/game/size-table';
import { formatListCellLabel } from '@/lib/utils';
import { MOVEMENT_TYPES, SENSES } from './creature-creator-constants';

const SENSE_BY_VALUE = new Map(SENSES.map((sense) => [sense.value, sense]));
const MOVEMENT_BY_VALUE = new Map(MOVEMENT_TYPES.map((movement) => [movement.value, movement]));

/** Hard cap on how many rows one creature picker confirm can add. */
const CREATURE_PICKER_SELECTION_CAP = 10;

export function creatureSenseLabel(value: string): string {
  return SENSE_BY_VALUE.get(value)?.label ?? value;
}

export function creatureMovementLabel(value: string): string {
  return MOVEMENT_BY_VALUE.get(value)?.label ?? value;
}

export function creatureSenseDescription(value: string): string {
  return (
    SENSE_BY_VALUE.get(value)?.description ??
    SENSE_DESCRIPTIONS[value] ??
    'No description available.'
  );
}

export function creatureMovementDescription(value: string): string {
  return (
    MOVEMENT_BY_VALUE.get(value)?.description ??
    MOVEMENT_DESCRIPTIONS[value] ??
    'See movement rules for details.'
  );
}

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
