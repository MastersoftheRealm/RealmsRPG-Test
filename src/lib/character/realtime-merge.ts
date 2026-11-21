/**
 * Sheet postgres_changes merge (TASK-747 / ADR-0013).
 * Non-resource keys: remote wins unless locally dirty (`mergeRemotePreservingDirty`).
 * HP/EN/AP: still `mergeResourceUpdatesIntoCharacter` unless the echo window is active.
 */

import type { Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  characterLockToken,
  listAutosaveConflictRemoteOverwrites,
  mergeRemotePreservingDirty,
  mergeSheetAutosaveBaseline,
  pickDirtyCharacterFields,
  withDirtyClears,
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

function buildLocalDocumentForMerge(
  prev: Record<string, unknown>,
  localClean: Record<string, unknown>,
  dirtyKeys: readonly string[],
): Record<string, unknown> {
  const localForMerge: Record<string, unknown> = { ...prev };
  for (const key of dirtyKeys) {
    if (key in localClean) localForMerge[key] = localClean[key];
    else if (localClean[key] === undefined) delete localForMerge[key];
  }
  return localForMerge;
}

function overlayRemoteNonResource(
  prev: Record<string, unknown>,
  remoteData: Record<string, unknown>,
  dirtyKeys: readonly string[],
  localForMerge: Record<string, unknown>,
  updatedAt?: string | Date | null | undefined,
  baseline?: Record<string, unknown> | null,
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
  if (!adopted && !stamp) {
    if (dirtyKeys.length === 0 || Object.keys(stripped).length === 0) {
      return prev;
    }
  }
  if (!adopted && stamp && token && Object.keys(stripped).length === 0) {
    return { ...prev, updatedAt: token };
  }

  const remoteDoc: Record<string, unknown> = {
    ...prev,
    ...stripped,
    ...(stamp && token ? { updatedAt: token } : {}),
  };
  return mergeRemotePreservingDirty(remoteDoc, localForMerge, dirtyKeys, baseline);
}

export type SheetRealtimeMerge = {
  character: Character;
  /** Null when `character` is the same object — do not touch `savedCleanRef`. */
  nextBaseline: Record<string, unknown> | null;
  /** Same-tab merge fields overwritten from the other tab (toast). */
  conflictRemoteOverwrites: readonly string[];
};

export function mergeSheetRealtimePayload(
  prev: Character,
  remoteData: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined,
  options?: {
    suppressResources?: boolean | undefined;
    updatedAt?: string | Date | null | undefined;
    rules?: Partial<CoreRulesMap> | undefined;
    localCleanBeforeRemote?: Record<string, unknown> | null | undefined;
  },
): SheetRealtimeMerge {
  const prevRecord = prev as unknown as Record<string, unknown>;
  const cleaned = cleanForSave(prev, options?.rules) as Record<string, unknown>;
  const frozenLocal =
    options?.localCleanBeforeRemote !== undefined && options.localCleanBeforeRemote !== null
      ? options.localCleanBeforeRemote
      : null;
  const localClean = frozenLocal ?? cleaned;
  const dirty = pickDirtyCharacterFields(localClean, baseline);
  const dirtyKeys = Object.keys(dirty);
  const localForOverlay = withDirtyClears(
    frozenLocal
      ? buildLocalDocumentForMerge(prevRecord, frozenLocal, dirtyKeys)
      : prevRecord,
    dirty,
  );
  const overlaid = overlayRemoteNonResource(
    prevRecord,
    remoteData,
    dirtyKeys,
    localForOverlay,
    options?.updatedAt,
    baseline,
  );
  let next = overlaid as unknown as Character;
  if (!options?.suppressResources) {
    next = mergeResourceUpdatesIntoCharacter(next, remoteData) ?? next;
  }
  if (next === prev) {
    return { character: prev, nextBaseline: null, conflictRemoteOverwrites: [] };
  }

  const nextClean = cleanForSave(next) as Record<string, unknown>;
  const base = baseline ?? nextClean;
  const remoteClean = cleanForSave(remoteData as Character) as Record<string, unknown>;
  const hasRelationalPayload = Object.keys(remoteData).some(
    (key) =>
      !PATCH_META_KEYS.has(key) &&
      !REALTIME_RESOURCE_KEYS.has(key) &&
      key !== 'updatedAt' &&
      key !== 'updated_at',
  );
  const lockToken =
    characterLockToken(options?.updatedAt) ??
    characterLockToken(
      typeof remoteData.updatedAt === 'string' || remoteData.updatedAt instanceof Date
        ? remoteData.updatedAt
        : undefined,
    ) ??
    characterLockToken(
      typeof remoteData.updated_at === 'string' ? remoteData.updated_at : undefined,
    );
  let conflictRemoteOverwrites: string[] = [];
  if (dirtyKeys.length > 0 && hasRelationalPayload) {
    conflictRemoteOverwrites = listAutosaveConflictRemoteOverwrites(
      base,
      localClean,
      remoteClean,
      dirtyKeys,
    );
  }
  let nextBaseline: Record<string, unknown> | null;
  if (dirtyKeys.length === 0) {
    nextBaseline = lockToken ? ({ ...base, updatedAt: lockToken } as Record<string, unknown>) : base;
  } else if (!hasRelationalPayload) {
    nextBaseline = lockToken ? ({ ...base, updatedAt: lockToken } as Record<string, unknown>) : base;
  } else {
    nextBaseline = mergeSheetAutosaveBaseline(nextClean, base, dirtyKeys, localClean, remoteClean);
  }
  return {
    character: next,
    nextBaseline,
    conflictRemoteOverwrites,
  };
}
