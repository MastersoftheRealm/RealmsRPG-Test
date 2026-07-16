/**
 * Shared localStorage helpers for creator draft caches.
 */

import { CACHE_EXPIRY_MS } from '@/lib/game/creator-constants';

/**
 * Pure read — safe to call during render (no localStorage writes). Expired or
 * corrupt entries return null; the caller's autosave overwrites them on mount.
 */
export function readCreatorCache<T extends { timestamp?: number }>(
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
