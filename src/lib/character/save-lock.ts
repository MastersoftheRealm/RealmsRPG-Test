/**
 * In-memory `updatedAt` lock + per-id PATCH queue (ADR-0013 / TASK-786).
 * Sheet autosave and encounter resource sync share this so overlapping
 * same-tab writes do not 409 on a stale token.
 */

import { characterLockToken, characterTimestampsMatch } from '@/lib/character/dirty-patch';

const latestLockTokens = new Map<string, string>();
const saveTails = new Map<string, Promise<unknown>>();

/** Prefer the later instant. Equal instants keep `a`. */
function preferNewerCharacterLock(a?: string | null, b?: string | null): string | undefined {
  const left = characterLockToken(a);
  const right = characterLockToken(b);
  if (!left) return right;
  if (!right) return left;
  if (characterTimestampsMatch(left, right)) return left;
  const da = Date.parse(left);
  const db = Date.parse(right);
  if (Number.isFinite(da) && Number.isFinite(db)) return da >= db ? left : right;
  return left;
}

export function rememberCharacterLockToken(
  characterId: string,
  value: string | Date | null | undefined,
): string | undefined {
  const id = characterId.trim();
  const token = characterLockToken(value);
  if (!id || !token) return token;
  const next = preferNewerCharacterLock(latestLockTokens.get(id), token) ?? token;
  latestLockTokens.set(id, next);
  return next;
}

/**
 * Newest of the caller token and the in-memory token.
 * Locked callers pass the result as `updatedAt`. Resource sync omits the lock
 * (`skipLock`) so encounter HP stays last-write-wins against other tabs.
 */
export function resolveCharacterLockToken(
  characterId: string,
  provided?: string | Date | null,
): string | undefined {
  const id = characterId.trim();
  return preferNewerCharacterLock(
    characterLockToken(provided),
    id ? latestLockTokens.get(id) : undefined,
  );
}

export function enqueueCharacterSave<T>(characterId: string, work: () => Promise<T>): Promise<T> {
  const id = characterId.trim();
  const prev = saveTails.get(id) ?? Promise.resolve();
  const next = prev.then(work, work);
  saveTails.set(
    id,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

/** Test-only: isolate maps between cases. */
export function resetCharacterSaveLockForTests(): void {
  latestLockTokens.clear();
  saveTails.clear();
}
