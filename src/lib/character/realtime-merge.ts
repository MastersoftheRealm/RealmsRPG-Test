/**
 * Sheet postgres_changes merge (TASK-747 / ADR-0013).
 * Non-resource keys: remote wins unless locally dirty (`mergeRemotePreservingDirty`).
 * HP/EN/AP: still `mergeResourceUpdatesIntoCharacter` unless the echo window is active.
 */

import type { Character } from '@/types';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  characterLockToken,
  mergeRemotePreservingDirty,
  pickDirtyCharacterFields,
} from '@/lib/character/dirty-patch';
import { mergeResourceUpdatesIntoCharacter } from '@/lib/encounter/character-resource-sync';

/** Same membership as dirty-patch `META_KEY_SET` (unexported, TASK-741). */
const PATCH_META_KEYS = new Set(['id', 'userId', 'createdAt', 'updatedAt', 'lastPlayedAt']);

const REALTIME_RESOURCE_KEYS = new Set([
  'currentHealth',
  'currentEnergy',
  'actionPoints',
  'health',
  'energy',
]);

function stableEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === undefined || b === undefined) return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function overlayRemoteNonResource(
  prev: Record<string, unknown>,
  remoteData: Record<string, unknown>,
  dirtyKeys: readonly string[],
  updatedAt?: string | Date | null | undefined,
): Record<string, unknown> {
  const dirtySet = new Set(dirtyKeys);
  const stripped: Record<string, unknown> = {};
  let adopted = false;
  for (const [key, value] of Object.entries(remoteData)) {
    if (PATCH_META_KEYS.has(key) || REALTIME_RESOURCE_KEYS.has(key)) continue;
    stripped[key] = value;
    if (!dirtySet.has(key) && !stableEqual(prev[key], value)) adopted = true;
  }

  const token =
    characterLockToken(updatedAt) ??
    characterLockToken(
      typeof remoteData.updatedAt === 'string' || remoteData.updatedAt instanceof Date
        ? remoteData.updatedAt
        : undefined,
    );
  const prevToken = characterLockToken(
    typeof prev.updatedAt === 'string' || prev.updatedAt instanceof Date
      ? (prev.updatedAt as string | Date)
      : undefined,
  );
  const stamp = Boolean(token && token !== prevToken);
  if (!adopted && !stamp) return prev;

  const remoteDoc: Record<string, unknown> = {
    ...prev,
    ...stripped,
    ...(stamp && token ? { updatedAt: token } : {}),
  };
  return mergeRemotePreservingDirty(remoteDoc, prev, dirtyKeys);
}

export type SheetRealtimeMerge = {
  character: Character;
  /** Null when `character` is the same object — do not touch `savedCleanRef`. */
  nextBaseline: Record<string, unknown> | null;
};

export function mergeSheetRealtimePayload(
  prev: Character,
  remoteData: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined,
  options?: {
    suppressResources?: boolean | undefined;
    updatedAt?: string | Date | null | undefined;
  },
): SheetRealtimeMerge {
  const prevRecord = prev as unknown as Record<string, unknown>;
  const cleaned = cleanForSave(prev) as Record<string, unknown>;
  const dirtyKeys = Object.keys(pickDirtyCharacterFields(cleaned, baseline));
  const overlaid = overlayRemoteNonResource(prevRecord, remoteData, dirtyKeys, options?.updatedAt);
  let next = overlaid as unknown as Character;
  if (!options?.suppressResources) {
    next = mergeResourceUpdatesIntoCharacter(next, remoteData) ?? next;
  }
  if (next === prev) {
    return { character: prev, nextBaseline: null };
  }

  const nextClean = cleanForSave(next) as Record<string, unknown>;
  const base = baseline ?? nextClean;
  return {
    character: next,
    nextBaseline: mergeRemotePreservingDirty(nextClean, base, dirtyKeys),
  };
}
