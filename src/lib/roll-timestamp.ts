/**
 * Roll timestamp normalization (HYG-01 / TASK-378)
 * ================================================
 * Campaign rolls may arrive as ISO strings (current API), Date instances, or legacy
 * Firestore-shaped `{ seconds, nanoseconds? }` objects from historical payloads.
 */

/** Legacy Firestore Timestamp shape stored in older campaign roll rows. */
export interface LegacyFirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

/** All timestamp shapes accepted from API / DB / client roll entries. */
export type RollTimestampInput = Date | string | LegacyFirestoreTimestamp | null | undefined;

/** Normalize roll timestamp to a Date (fallback: now). */
export function normalizeRollTimestamp(timestamp: RollTimestampInput | unknown): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  const sec = (timestamp as LegacyFirestoreTimestamp | null)?.seconds;
  if (typeof sec === 'number') return new Date(sec * 1000);
  return new Date();
}

/** Format roll timestamp for display: short date + time. */
export function formatRollTimestamp(timestamp: RollTimestampInput | unknown): string {
  const d = normalizeRollTimestamp(timestamp);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
