/**
 * Codex id allocation and retirement.
 * Deleted codex ids are tombstoned in `codex_retired_ids` and never handed out again:
 * feat 248 (`Flawless Fighter`) was deleted and reallocated 26 minutes later, silently
 * repointing every character that had taken it. All codex/official entity types share
 * this allocator so the guarantee cannot be reimplemented per table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const RETIRED_IDS_TABLE = 'codex_retired_ids';

export function parseNumericId(id: unknown): number | null {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const raw = String(id);
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

/** Lowest positive integer not in `taken`; gaps left by deletes are in `taken` via retired ids. */
export function lowestUnusedNumericId(taken: ReadonlySet<number>): string {
  let max = 0;
  for (const n of taken) {
    if (n > max) max = n;
  }
  for (let i = 1; i <= max + 1; i++) {
    if (!taken.has(i)) return String(i);
  }
  return String(max + 1);
}

/** Retired ids are advisory: a missing tombstone table must not break admin writes. */
export async function fetchRetiredIds(
  supabase: SupabaseClient,
  entityType: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(RETIRED_IDS_TABLE)
    .select('id')
    .eq('entity_type', entityType);
  if (error) {
    console.warn('[Codex ids] Could not read retired ids for', entityType, error.message);
    return new Set<string>();
  }
  const out = new Set<string>();
  for (const row of (data ?? []) as Array<{ id?: unknown }>) {
    if (row.id != null) out.add(String(row.id));
  }
  return out;
}

/**
 * Allocate the lowest numeric id that is neither live nor retired for this entity type.
 * `entityType` keys the tombstone rows and is the table name for every current caller.
 */
export async function allocateCodexNumericId(
  supabase: SupabaseClient,
  table: string,
  entityType: string = table,
): Promise<string> {
  const { data, error } = await supabase.from(table).select('id');
  if (error) throw new Error(error.message);

  const taken = new Set<number>();
  for (const row of (data ?? []) as Array<{ id?: unknown }>) {
    const n = parseNumericId(row.id);
    if (n != null) taken.add(n);
  }
  for (const retired of await fetchRetiredIds(supabase, entityType)) {
    const n = parseNumericId(retired);
    if (n != null) taken.add(n);
  }

  return lowestUnusedNumericId(taken);
}

/** Tombstone a deleted id. Best-effort: never blocks or fails the delete that triggered it. */
export async function retireCodexId(
  supabase: SupabaseClient,
  entityType: string,
  id: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from(RETIRED_IDS_TABLE)
      .upsert({ entity_type: entityType, id }, { onConflict: 'entity_type,id' });
    if (error) {
      console.error('[Codex ids] Failed to retire id', entityType, id, error.message);
    }
  } catch (err) {
    console.error('[Codex ids] Failed to retire id', entityType, id, err);
  }
}
