/**
 * Dirty-key character PATCH helpers (ADR-0013 / TASK-741).
 * Leaf module: no UI, store, or API imports.
 */

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

type EquipmentRow = Record<string, unknown>;

/**
 * Merge identity for a gear row. Not the sheet click matcher: that one also
 * accepts the first same name and the list index, which pairs the wrong row.
 */
function equipmentRowId(row: EquipmentRow): string | number | undefined {
  const { id } = row;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return undefined;
}

function equipmentRowNameKey(row: EquipmentRow): string | undefined {
  const { name } = row;
  if (typeof name !== 'string' || name.length === 0) return undefined;
  return name.toLowerCase();
}

function equipmentListIsAmbiguous(rows: EquipmentRow[]): boolean {
  const idCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  for (const row of rows) {
    const id = equipmentRowId(row);
    if (id !== undefined) {
      const key = String(id);
      idCounts.set(key, (idCounts.get(key) ?? 0) + 1);
      continue;
    }
    const nameKey = equipmentRowNameKey(row);
    if (!nameKey) return true;
    nameCounts.set(nameKey, (nameCounts.get(nameKey) ?? 0) + 1);
  }
  for (const count of idCounts.values()) if (count > 1) return true;
  for (const count of nameCounts.values()) if (count > 1) return true;
  return false;
}

function equipmentBucketsAmbiguous(
  remote: EquipmentRow[],
  local: EquipmentRow[],
  baseline: EquipmentRow[],
): boolean {
  return (
    equipmentListIsAmbiguous(remote) ||
    equipmentListIsAmbiguous(local) ||
    equipmentListIsAmbiguous(baseline)
  );
}

function findIdentifiableEquipmentIndex(
  rows: EquipmentRow[],
  anchor: EquipmentRow,
  used?: Set<number>,
): number {
  const id = equipmentRowId(anchor);
  const hits: number[] = [];
  if (id !== undefined) {
    const idStr = String(id);
    for (let idx = 0; idx < rows.length; idx++) {
      if (used?.has(idx)) continue;
      const rowId = equipmentRowId(rows[idx]!);
      if (rowId === id || (rowId !== undefined && String(rowId) === idStr)) hits.push(idx);
    }
  } else {
    const nameKey = equipmentRowNameKey(anchor);
    if (!nameKey) return -1;
    for (let idx = 0; idx < rows.length; idx++) {
      if (used?.has(idx)) continue;
      const row = rows[idx]!;
      if (equipmentRowId(row) !== undefined) continue;
      if (equipmentRowNameKey(row) === nameKey) hits.push(idx);
    }
  }
  return hits.length === 1 ? hits[0]! : -1;
}

function sameEquipmentIdentity(a: EquipmentRow, b: EquipmentRow): boolean {
  return findIdentifiableEquipmentIndex([b], a) === 0;
}

function mergeEquipmentScalarBucket(
  remoteValue: unknown,
  localValue: unknown,
  baselineValue: unknown,
): unknown {
  const localDirty =
    baselineValue === undefined
      ? !stableEqual(localValue, remoteValue)
      : !stableEqual(localValue, baselineValue);
  if (localDirty && localValue !== undefined) return localValue;
  if (remoteValue !== undefined) return remoteValue;
  return localValue;
}

function mergeEquipmentItemBucket(
  remoteList: unknown,
  localList: unknown,
  baselineList: unknown,
): unknown {
  const remoteIsArray = Array.isArray(remoteList);
  const localIsArray = Array.isArray(localList);
  const baselineIsArray = Array.isArray(baselineList) || baselineList === undefined;
  if (!remoteIsArray || !localIsArray || !baselineIsArray) {
    return mergeEquipmentScalarBucket(remoteList, localList, baselineList);
  }
  const remote = remoteList as EquipmentRow[];
  const local = localList as EquipmentRow[];
  const baseline = baselineList ? (baselineList as EquipmentRow[]) : [];
  if (equipmentBucketsAmbiguous(remote, local, baseline)) {
    return mergeEquipmentScalarBucket(remoteList, localList, baselineList);
  }
  const merged: EquipmentRow[] = [];
  const usedLocal = new Set<number>();

  for (const remoteRow of remote) {
    const baselineIdx = findIdentifiableEquipmentIndex(baseline, remoteRow);
    const baselineRow = baselineIdx >= 0 ? baseline[baselineIdx] : undefined;
    const localIdx = findIdentifiableEquipmentIndex(local, remoteRow, usedLocal);
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
    const onRemote = remote.some((row) => sameEquipmentIdentity(row, localRow));
    if (onRemote) continue;
    const baselineIdx = findIdentifiableEquipmentIndex(baseline, localRow);
    const baselineRow = baselineIdx >= 0 ? baseline[baselineIdx] : undefined;
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
  const nextIsArray = Array.isArray(nextList);
  const savedIsArray = Array.isArray(savedList) || savedList === undefined;
  const localIsArray = Array.isArray(localList);
  if (!nextIsArray || !savedIsArray || !localIsArray) {
    return mergeEquipmentScalarBucket(nextList, localList, savedList);
  }
  const next = nextList as EquipmentRow[];
  const saved = savedList ? (savedList as EquipmentRow[]) : [];
  const local = localList as EquipmentRow[];
  if (equipmentBucketsAmbiguous(next, saved, local)) {
    const localDirty = Array.isArray(savedList)
      ? !stableEqual(localList, savedList)
      : Array.isArray(localList) && !stableEqual(localList, nextList);
    if (localDirty) return Array.isArray(savedList) ? savedList : undefined;
    return nextList;
  }
  const merged: EquipmentRow[] = [];

  const emitAnchor = (
    savedRow: Record<string, unknown> | undefined,
    localRow: Record<string, unknown> | undefined,
    nextRow: Record<string, unknown> | undefined,
  ) => {
    if (equipmentBucketLocallyTouched(savedRow, localRow)) {
      if (savedRow && !localRow) {
        merged.push(savedRow);
        return;
      }
      if (savedRow) {
        merged.push(savedRow);
        return;
      }
      if (localRow) {
        return;
      }
      if (nextRow) merged.push(nextRow);
      return;
    }
    if (nextRow) merged.push(nextRow);
    else if (savedRow) merged.push(savedRow);
  };

  for (const nextRow of next) {
    const savedIdx = findIdentifiableEquipmentIndex(saved, nextRow);
    const localIdx = findIdentifiableEquipmentIndex(local, nextRow);
    emitAnchor(
      savedIdx >= 0 ? saved[savedIdx] : undefined,
      localIdx >= 0 ? local[localIdx] : undefined,
      nextRow,
    );
  }

  for (const savedRow of saved) {
    const inNext = next.some((row) => sameEquipmentIdentity(row, savedRow));
    if (inNext) continue;
    const localIdx = findIdentifiableEquipmentIndex(local, savedRow);
    const localRow = localIdx >= 0 ? local[localIdx] : undefined;
    if (equipmentBucketLocallyTouched(savedRow, localRow)) {
      if (savedRow && !localRow) merged.push(savedRow);
      continue;
    }
    merged.push(savedRow);
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
 * the saved snapshot; touched equipment rows (including a pending delete) stay
 * on the baseline until PATCHed. Local-only adds stay off the baseline.
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
    if (!(key in savedBaseline)) {
      delete next[key];
      continue;
    }
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
