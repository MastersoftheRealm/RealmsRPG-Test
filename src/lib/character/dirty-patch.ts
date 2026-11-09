/**
 * Dirty-key character PATCH helpers (ADR-0013 / TASK-741).
 * Leaf module: no UI, store, or API imports.
 */

import { matchesSheetEquipmentItem } from '@/lib/character/sheet-equipment-match';

export function characterLockToken(value: string | Date | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return undefined;
}

const META_KEY_SET = new Set<string>(['id', 'userId', 'createdAt', 'updatedAt', 'lastPlayedAt']);

function isCharacterPatchMetaKey(key: string): boolean {
  return META_KEY_SET.has(key);
}

/** True when both timestamps denote the same instant (string or Date.parse). */
export function characterTimestampsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const da = Date.parse(a);
  const db = Date.parse(b);
  return Number.isFinite(da) && Number.isFinite(db) && da === db;
}

/**
 * Stale write when the client sent a lock token and the row has one that does not match.
 * Missing client token or null column → not stale (legacy / resource-only callers).
 */
export function isStaleCharacterWrite(
  expected: string | null | undefined,
  actual: string | null | undefined,
): boolean {
  if (!expected || !actual) return false;
  return !characterTimestampsMatch(expected, actual);
}

function stripCharacterPatchMeta(patch: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (isCharacterPatchMetaKey(key)) continue;
    next[key] = value;
  }
  return next;
}

/**
 * Merge a dirty subset onto the stored character document. Omitted keys stay as stored.
 * A `null` value removes that key. Client meta is stripped.
 */
export function applyCharacterDirtyPatch(
  currentData: Record<string, unknown>,
  patch: Record<string, unknown>,
  options?: { documentUpdatedAt?: string | undefined },
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...currentData };
  for (const [key, value] of Object.entries(stripCharacterPatchMeta(patch))) {
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  if (options?.documentUpdatedAt) merged.updatedAt = options.documentUpdatedAt;
  return merged;
}

function stableEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === undefined || b === undefined) return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Keys in `current` that differ from `baseline`. Meta keys are never dirty.
 * When `baseline` is null (first save / no snapshot), every non-meta defined key is dirty.
 * A baseline key missing from `current` is a clear: the dirty value is `null` so the
 * merge can delete the stored key (86e3juw04). Omitting it would leave the old value.
 */
export function pickDirtyCharacterFields(
  current: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const dirty: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(current), ...Object.keys(baseline ?? {})]);
  for (const key of keys) {
    if (isCharacterPatchMetaKey(key)) continue;
    const value = current[key];
    const baselineValue = baseline?.[key];
    if (value === undefined) {
      if (baseline && baselineValue !== undefined) dirty[key] = null;
      continue;
    }
    if (!baseline || !stableEqual(value, baselineValue)) {
      dirty[key] = value;
    }
  }
  return dirty;
}

/** Copy `null` clears onto `document` so a merge can drop those keys. */
export function withDirtyClears<T extends Record<string, unknown>>(
  document: T,
  dirty: Record<string, unknown>,
): T {
  let next: Record<string, unknown> | undefined;
  for (const [key, value] of Object.entries(dirty)) {
    if (value !== null || isCharacterPatchMetaKey(key)) continue;
    if (!next) next = { ...document };
    next[key] = null;
  }
  return (next ?? document) as T;
}

const EQUIPMENT_ITEM_BUCKETS = [
  'weapons',
  'armor',
  'shields',
  'items',
  'accessories',
  'inventory',
] as const;

type SheetEquipmentRow = { id?: string | number | undefined; name?: string | undefined };

function sheetEquipmentRowAnchorId(row: Record<string, unknown>, index: number): string | number {
  const { id, name } = row;
  if (typeof id === 'string' || typeof id === 'number') return id;
  if (typeof name === 'string' && name.length > 0) return name;
  return index;
}

function findSheetEquipmentRow(
  rows: Record<string, unknown>[] | undefined,
  anchor: Record<string, unknown>,
  anchorIndex: number,
): Record<string, unknown> | undefined {
  if (!rows?.length) return undefined;
  const itemId = sheetEquipmentRowAnchorId(anchor, anchorIndex);
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row && matchesSheetEquipmentItem(row as SheetEquipmentRow, itemId, idx)) return row;
  }
  return undefined;
}

function mergeEquipmentItemBucket(
  remoteList: unknown,
  localList: unknown,
  baselineList: unknown,
): unknown {
  const remote = Array.isArray(remoteList) ? (remoteList as Record<string, unknown>[]) : [];
  const local = Array.isArray(localList) ? (localList as Record<string, unknown>[]) : [];
  const baseline = Array.isArray(baselineList) ? (baselineList as Record<string, unknown>[]) : [];
  const merged: Record<string, unknown>[] = [];
  const usedLocal = new Set<number>();

  for (let rIdx = 0; rIdx < remote.length; rIdx++) {
    const remoteRow = remote[rIdx]!;
    const baselineRow = findSheetEquipmentRow(baseline, remoteRow, rIdx);
    const localIdx = local.findIndex(
      (row, idx) =>
        !usedLocal.has(idx) &&
        matchesSheetEquipmentItem(
          row as SheetEquipmentRow,
          sheetEquipmentRowAnchorId(remoteRow, rIdx),
          rIdx,
        ),
    );
    const localRow = localIdx >= 0 ? local[localIdx] : undefined;
    if (localIdx >= 0) usedLocal.add(localIdx);

    if (localIdx < 0) {
      if (!baselineRow) merged.push(remoteRow);
      continue;
    }

    const localDirty =
      baselineRow === undefined
        ? !stableEqual(localRow, remoteRow)
        : !stableEqual(localRow!, baselineRow);

    merged.push(localDirty ? localRow! : remoteRow);
  }

  for (let lIdx = 0; lIdx < local.length; lIdx++) {
    if (usedLocal.has(lIdx)) continue;
    const localRow = local[lIdx]!;
    const onRemote = remote.some((row, rIdx) =>
      matchesSheetEquipmentItem(
        row as SheetEquipmentRow,
        sheetEquipmentRowAnchorId(localRow, lIdx),
        rIdx,
      ),
    );
    if (onRemote) continue;
    const baselineRow = findSheetEquipmentRow(baseline, localRow, lIdx);
    if (!baselineRow || !stableEqual(localRow, baselineRow)) merged.push(localRow);
  }

  return merged;
}

/**
 * Merge concurrent sheet inventory edits: keep each tab's item rows that differ
 * from the shared autosave baseline instead of last-writer-wins on the whole blob.
 */
function mergeCharacterEquipmentConflict(
  remoteEquipment: unknown,
  localEquipment: unknown,
  baselineEquipment: unknown,
): unknown {
  const remote =
    remoteEquipment && typeof remoteEquipment === 'object'
      ? (remoteEquipment as Record<string, unknown>)
      : {};
  const local =
    localEquipment && typeof localEquipment === 'object'
      ? (localEquipment as Record<string, unknown>)
      : {};
  const baseline =
    baselineEquipment && typeof baselineEquipment === 'object'
      ? (baselineEquipment as Record<string, unknown>)
      : {};
  const keys = new Set([...Object.keys(remote), ...Object.keys(local), ...Object.keys(baseline)]);
  const merged: Record<string, unknown> = { ...remote };
  for (const key of keys) {
    if ((EQUIPMENT_ITEM_BUCKETS as readonly string[]).includes(key)) {
      merged[key] = mergeEquipmentItemBucket(remote[key], local[key], baseline[key]);
      continue;
    }
    const localRow = local[key];
    if (localRow === undefined) continue;
    const baselineRow = baseline[key];
    const localDirty =
      baselineRow === undefined
        ? !stableEqual(localRow, remote[key])
        : !stableEqual(localRow, baselineRow);
    if (localDirty) merged[key] = localRow;
  }
  return merged;
}

function equipmentBucketLocallyTouched(
  savedRow: Record<string, unknown> | undefined,
  localRow: Record<string, unknown> | undefined,
): boolean {
  if (savedRow && !localRow) return true;
  if (!localRow) return false;
  if (!savedRow) return true;
  return !stableEqual(localRow, savedRow);
}

function mergeEquipmentBucketAutosaveBaseline(
  nextList: unknown,
  savedList: unknown,
  localList: unknown,
): unknown {
  const next = Array.isArray(nextList) ? (nextList as Record<string, unknown>[]) : [];
  const saved = Array.isArray(savedList) ? (savedList as Record<string, unknown>[]) : [];
  const local = Array.isArray(localList) ? (localList as Record<string, unknown>[]) : [];
  const merged: Record<string, unknown>[] = [];

  const emitAnchor = (
    savedRow: Record<string, unknown> | undefined,
    localRow: Record<string, unknown> | undefined,
    nextRow: Record<string, unknown> | undefined,
  ) => {
    if (equipmentBucketLocallyTouched(savedRow, localRow)) {
      if (savedRow && !localRow) return;
      if (savedRow) merged.push(savedRow);
      else if (localRow) merged.push(localRow);
      return;
    }
    if (nextRow) merged.push(nextRow);
    else if (savedRow) merged.push(savedRow);
  };

  for (let nIdx = 0; nIdx < next.length; nIdx++) {
    const nextRow = next[nIdx]!;
    const savedRow = findSheetEquipmentRow(saved, nextRow, nIdx);
    const localRow = findSheetEquipmentRow(local, nextRow, nIdx);
    emitAnchor(savedRow, localRow, nextRow);
  }

  for (let sIdx = 0; sIdx < saved.length; sIdx++) {
    const savedRow = saved[sIdx]!;
    const inNext = next.some((row, nIdx) =>
      matchesSheetEquipmentItem(
        row as SheetEquipmentRow,
        sheetEquipmentRowAnchorId(savedRow, sIdx),
        nIdx,
      ),
    );
    if (inNext) continue;
    const localRow = findSheetEquipmentRow(local, savedRow, sIdx);
    if (equipmentBucketLocallyTouched(savedRow, localRow)) continue;
    merged.push(savedRow);
  }

  for (let lIdx = 0; lIdx < local.length; lIdx++) {
    const localRow = local[lIdx]!;
    const inNext = next.some((row, nIdx) =>
      matchesSheetEquipmentItem(
        row as SheetEquipmentRow,
        sheetEquipmentRowAnchorId(localRow, lIdx),
        nIdx,
      ),
    );
    if (inNext) continue;
    if (!findSheetEquipmentRow(saved, localRow, lIdx)) merged.push(localRow);
  }

  return merged;
}

function mergeEquipmentAutosaveBaseline(
  nextEquipment: unknown,
  savedEquipment: unknown,
  localEquipmentBeforeRemote: unknown,
): unknown {
  const next =
    nextEquipment && typeof nextEquipment === 'object'
      ? (nextEquipment as Record<string, unknown>)
      : {};
  const saved =
    savedEquipment && typeof savedEquipment === 'object'
      ? (savedEquipment as Record<string, unknown>)
      : {};
  const local =
    localEquipmentBeforeRemote && typeof localEquipmentBeforeRemote === 'object'
      ? (localEquipmentBeforeRemote as Record<string, unknown>)
      : {};
  const keys = new Set([...Object.keys(next), ...Object.keys(saved), ...Object.keys(local)]);
  const merged: Record<string, unknown> = { ...saved, ...next };
  for (const key of keys) {
    if ((EQUIPMENT_ITEM_BUCKETS as readonly string[]).includes(key)) {
      merged[key] = mergeEquipmentBucketAutosaveBaseline(next[key], saved[key], local[key]);
      continue;
    }
    const savedRow = saved[key];
    const localRow = local[key];
    const localDirty =
      savedRow === undefined
        ? localRow !== undefined && !stableEqual(localRow, next[key])
        : !stableEqual(localRow, savedRow);
    if (localDirty && savedRow !== undefined) merged[key] = savedRow;
    else if (next[key] !== undefined) merged[key] = next[key];
  }
  return merged;
}

/** After a 409 retry, write merged dirty keys onto the open sheet (not the pre-merge blob). */
export function applySheetAutosaveConflictFields<T extends Record<string, unknown>>(
  prev: T,
  remote: T,
  mergedClean: T,
  dirty: Record<string, unknown>,
): T {
  const next: Record<string, unknown> = { ...prev, ...remote };
  for (const key of Object.keys(dirty)) {
    if (dirty[key] === null) delete next[key];
    else if (key in mergedClean) next[key] = mergedClean[key];
  }
  return next as T;
}

/**
 * Autosave baseline after realtime overlay: dirty non-equipment keys revert to
 * the saved snapshot; equipment rows stay dirty until PATCHed (per row).
 */
export function mergeSheetAutosaveBaseline<T extends Record<string, unknown>>(
  nextClean: T,
  savedBaseline: T,
  dirtyKeys: readonly string[],
  localCleanBeforeRemote: T,
): T {
  const next: Record<string, unknown> = { ...nextClean };
  for (const key of dirtyKeys) {
    if (isCharacterPatchMetaKey(key)) continue;
    if (key === 'equipment') {
      next[key] = mergeEquipmentAutosaveBaseline(
        nextClean[key],
        savedBaseline[key],
        localCleanBeforeRemote[key],
      );
      continue;
    }
    if (!(key in savedBaseline)) continue;
    if (savedBaseline[key] === null) delete next[key];
    else next[key] = savedBaseline[key];
  }
  return next as T;
}

/**
 * Remote document wins for keys we did not edit; local dirty keys kept.
 * A local `null` removes that key (a cleared sheet value).
 * When `baseline` is set and `equipment` is dirty, inventory buckets merge per row.
 */
export function mergeRemotePreservingDirty<T extends Record<string, unknown>>(
  remote: T,
  local: T,
  dirtyKeys: readonly string[],
  baseline?: T | null,
): T {
  const next: Record<string, unknown> = { ...remote };
  for (const key of dirtyKeys) {
    if (isCharacterPatchMetaKey(key)) continue;
    if (!(key in local)) continue;
    if (local[key] === null) delete next[key];
    else if (key === 'equipment' && baseline) {
      next[key] = mergeCharacterEquipmentConflict(remote[key], local[key], baseline[key]);
    } else next[key] = local[key];
  }
  return next as T;
}
