/**
 * Shared localStorage helpers for creator draft caches.
 */

import { CACHE_EXPIRY_MS } from '@/lib/game/creator-constants';

export const CREATOR_NEW_DRAFT_SCOPE = '__new__';

const CREATOR_CACHE_SCOPE_SEP = '::';

export function scopedCreatorCacheKey(baseKey: string, editId: string | null | undefined): string {
  const scope = editId && editId.trim().length > 0 ? editId.trim() : CREATOR_NEW_DRAFT_SCOPE;
  return `${baseKey}${CREATOR_CACHE_SCOPE_SEP}${scope}`;
}

/** Autosave / discard / reset target for the current creator session. */
export function creatorSessionCacheKey(
  baseKey: string,
  editId: string | null | undefined,
  editReplacesDraft: boolean,
): string {
  if (editId && editReplacesDraft) {
    return scopedCreatorCacheKey(baseKey, editId);
  }
  return scopedCreatorCacheKey(baseKey, null);
}

function readStorageCache<T extends { timestamp?: number | undefined }>(
  storage: Storage,
  key: string,
): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    if (!parsed.timestamp || Date.now() - parsed.timestamp >= CACHE_EXPIRY_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache<T>(storage: Storage, key: string, value: T): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

function removeStorageCache(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Pure read — safe to call during render (no localStorage writes). Expired or
 * corrupt entries return null; the caller's autosave overwrites them on mount.
 */
export function readCreatorCache<T extends { timestamp?: number | undefined }>(
  key: string,
): T | null {
  if (typeof window === 'undefined') return null;
  return readStorageCache(localStorage, key);
}

/**
 * Bootstrap for new drafts and unknown ?edit= ids: per-tab sessionStorage first,
 * then shared localStorage buckets (scoped new + legacy unscoped key).
 */
function sessionStorageIfAvailable(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readNewCreatorDraftCache<T extends { timestamp?: number | undefined }>(
  baseKey: string,
): T | null {
  if (typeof window === 'undefined') return null;
  const scopedNewKey = scopedCreatorCacheKey(baseKey, null);
  const session = sessionStorageIfAvailable();
  const fromSession = session ? readStorageCache<T>(session, scopedNewKey) : null;
  if (fromSession) return fromSession;
  const fromScopedLocal = readCreatorCache<T>(scopedNewKey);
  if (fromScopedLocal) return fromScopedLocal;
  return readCreatorCache<T>(baseKey);
}

export function writeCreatorCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  writeStorageCache(localStorage, key, value);
}

export function clearCreatorCache(key: string): void {
  if (typeof window === 'undefined') return;
  removeStorageCache(localStorage, key);
}

export function clearNewCreatorDraftCaches(baseKey: string): void {
  if (typeof window === 'undefined') return;
  const scopedNewKey = scopedCreatorCacheKey(baseKey, null);
  const session = sessionStorageIfAvailable();
  if (session) removeStorageCache(session, scopedNewKey);
  clearCreatorCache(scopedNewKey);
  clearCreatorCache(baseKey);
}

export function clearCreatorSessionDraft(
  baseKey: string,
  editId: string | null | undefined,
  editReplacesDraft: boolean,
): void {
  const key = creatorSessionCacheKey(baseKey, editId, editReplacesDraft);
  if (editId && editReplacesDraft) {
    clearCreatorCache(key);
    return;
  }
  const session = sessionStorageIfAvailable();
  if (session) removeStorageCache(session, key);
  clearCreatorCache(key);
  clearCreatorCache(baseKey);
}

/** Skip the write after Discard so the leaving page cannot put the draft back. */
export function persistCreatorDraft<T>(key: string, value: T, discarded: boolean): void {
  if (discarded) return;
  writeCreatorCache(key, value);
}

/**
 * Confirmed ?edit= rows persist per id in localStorage; new drafts use sessionStorage
 * so parallel tabs do not overwrite each other (86e3juw0a).
 */
export function persistCreatorSessionDraft<T extends { timestamp?: number | undefined }>(
  baseKey: string,
  editId: string | null | undefined,
  editReplacesDraft: boolean,
  value: T,
  discarded: boolean,
): void {
  if (discarded) return;
  const key = creatorSessionCacheKey(baseKey, editId, editReplacesDraft);
  if (editId && editReplacesDraft) {
    writeCreatorCache(key, value);
    return;
  }
  const session = sessionStorageIfAvailable();
  if (!session) return;
  writeStorageCache(session, key, value);
}

export type CreatorDraftDiscard = {
  discard: (key: string) => void;
  isDiscarded: () => boolean;
};

/** One creator mount. Discard clears that mount's stored draft and blocks later writes. */
export function createCreatorDraftDiscard(): CreatorDraftDiscard {
  let discarded = false;
  return {
    discard(key: string) {
      discarded = true;
      clearCreatorCache(key);
      const session = sessionStorageIfAvailable();
      if (session) removeStorageCache(session, key);
    },
    isDiscarded() {
      return discarded;
    },
  };
}
