/**
 * Shared localStorage helpers for creator draft caches.
 */

import { CACHE_EXPIRY_MS } from '@/lib/game/creator-constants';

/**
 * Pure read — safe to call during render (no localStorage writes). Expired or
 * corrupt entries return null; the caller's autosave overwrites them on mount.
 */
export function readCreatorCache<T extends { timestamp?: number | undefined }>(
  key: string,
): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
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

export function writeCreatorCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCreatorCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
}

/** Skip the write after Discard so the leaving page cannot put the draft back. */
export function persistCreatorDraft<T>(key: string, value: T, discarded: boolean): void {
  if (discarded) return;
  writeCreatorCache(key, value);
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
    },
    isDiscarded() {
      return discarded;
    },
  };
}
