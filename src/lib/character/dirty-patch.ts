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
 * Merge a dirty subset onto stored JSONB. Omitted keys stay as stored.
 * A `null` value removes that key. Client meta is stripped.
 */
export function applyCharacterDirtyPatch(
  currentData: Record<string, unknown>,
  patch: Record<string, unknown>,
  options?: { blobUpdatedAt?: string | undefined },
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...currentData };
  for (const [key, value] of Object.entries(stripCharacterPatchMeta(patch))) {
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  if (options?.blobUpdatedAt) merged.updatedAt = options.blobUpdatedAt;
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

/**
 * Remote document wins for keys we did not edit; local dirty keys kept.
 * A local `null` removes that key (a cleared sheet value).
 */
export function mergeRemotePreservingDirty<T extends Record<string, unknown>>(
  remote: T,
  local: T,
  dirtyKeys: readonly string[],
): T {
  const next: Record<string, unknown> = { ...remote };
  for (const key of dirtyKeys) {
    if (isCharacterPatchMetaKey(key)) continue;
    if (!(key in local)) continue;
    if (local[key] === null) delete next[key];
    else next[key] = local[key];
  }
  return next as T;
}
