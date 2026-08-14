/**
 * Dirty-key character PATCH helpers (ADR-0013 / TASK-741).
 * Leaf module: no UI, store, or API imports.
 */

export function characterLockToken(
  value: string | Date | null | undefined
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return undefined;
}

export const CHARACTER_PATCH_META_KEYS = [
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'lastPlayedAt',
] as const;

const META_KEY_SET = new Set<string>(CHARACTER_PATCH_META_KEYS);

export function isCharacterPatchMetaKey(key: string): boolean {
  return META_KEY_SET.has(key);
}

/** True when both timestamps denote the same instant (string or Date.parse). */
export function characterTimestampsMatch(
  a: string | null | undefined,
  b: string | null | undefined
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
  actual: string | null | undefined
): boolean {
  if (!expected || !actual) return false;
  return !characterTimestampsMatch(expected, actual);
}

export function stripCharacterPatchMeta(
  patch: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (isCharacterPatchMetaKey(key)) continue;
    next[key] = value;
  }
  return next;
}

/** Merge a dirty subset onto stored JSONB. Omitted keys stay as stored. */
export function applyCharacterDirtyPatch(
  currentData: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  return { ...currentData, ...stripCharacterPatchMeta(patch) };
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
 */
export function pickDirtyCharacterFields(
  current: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const dirty: Record<string, unknown> = {};
  const keys = new Set([
    ...Object.keys(current),
    ...Object.keys(baseline ?? {}),
  ]);
  for (const key of keys) {
    if (isCharacterPatchMetaKey(key)) continue;
    const value = current[key];
    if (value === undefined) continue;
    if (!baseline || !stableEqual(value, baseline[key])) {
      dirty[key] = value;
    }
  }
  return dirty;
}

/** Remote document wins for keys we did not edit; local dirty keys kept. */
export function mergeRemotePreservingDirty<T extends Record<string, unknown>>(
  remote: T,
  local: T,
  dirtyKeys: readonly string[]
): T {
  const next: Record<string, unknown> = { ...remote };
  for (const key of dirtyKeys) {
    if (isCharacterPatchMetaKey(key)) continue;
    if (key in local) next[key] = local[key];
  }
  return next as T;
}
