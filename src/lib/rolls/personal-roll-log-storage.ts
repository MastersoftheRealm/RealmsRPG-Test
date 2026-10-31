/**
 * Per-character personal roll log persistence (localStorage).
 * 86e3jvcgv — one key per character; merge by roll id for multi-tab sync.
 */

export const LEGACY_PERSONAL_ROLL_LOG_KEY = 'realms-roll-log';
export const MAX_PERSISTED_PERSONAL_ROLLS = 20;

/** Entries persisted in localStorage (compatible with RollEntry from roll-context). */
export type StoredRollLogEntry = {
  id: string;
  timestamp: Date;
  type: string;
  title: string;
  dice: unknown[];
  modifier: number;
  modifierLabel?: string | undefined;
  total: number;
  isCrit?: boolean | undefined;
  isCritFail?: boolean | undefined;
  critMessage?: string | undefined;
};

export function personalRollLogStorageKey(characterId: string): string {
  return `${LEGACY_PERSONAL_ROLL_LOG_KEY}:${characterId}`;
}

function parseStoredRollLog(raw: string): StoredRollLogEntry[] {
  const parsed = JSON.parse(raw) as StoredRollLogEntry[];
  if (!Array.isArray(parsed)) return [];
  return parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));
}

export function readPersonalRollLog(storageKey: string): StoredRollLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    return parseStoredRollLog(stored);
  } catch {
    return [];
  }
}

export function writePersonalRollLog(storageKey: string, rolls: StoredRollLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toStore = rolls.slice(-MAX_PERSISTED_PERSONAL_ROLLS);
    localStorage.setItem(storageKey, JSON.stringify(toStore));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Merge two roll histories by id; sort oldest-first for display. */
export function mergeRollLogsById<T extends StoredRollLogEntry>(a: T[], b: T[]): T[] {
  const byId = new Map<string, T>();
  for (const roll of [...a, ...b]) {
    byId.set(roll.id, roll);
  }
  return [...byId.values()].sort(
    (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
  );
}
