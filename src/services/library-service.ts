/**
 * Library Service
 * ================
 * Client-side API calls for saving items to user library.
 * Used by creators (power, technique, item, creature).
 */

import { apiFetch } from '@/lib/api-client';
import type { LibraryTabCounts } from '@/lib/library/library-tab-counts';
import type {
  LibraryItemByType,
  LibraryItemType,
  LibraryRow,
  LibrarySaveBody,
} from '@/types/library';

const API_BASE = '/api/user/library';

export type LibraryType = LibraryItemType;

export async function saveToLibrary(
  type: LibraryType,
  data: LibrarySaveBody,
  options?: { existingId?: string | undefined },
): Promise<string> {
  if (options?.existingId) {
    await apiFetch<void>(`${API_BASE}/${type}/${encodeURIComponent(options.existingId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return options.existingId;
  }

  const result = await apiFetch<{ id: string }>(`${API_BASE}/${type}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.id;
}

/**
 * Find a user-library row by exact name.
 * Returns `null` when no row matches. API/network failures **throw** (do not
 * treat transport errors as "not found" — see ARCHITECTURE.md client errors).
 */
export async function findLibraryItemByName(
  type: LibraryType,
  name: string,
): Promise<{ id: string } | null> {
  // PERF-01: server-side name lookup returns only matching `{ id, name }`
  // rows instead of the whole library.
  const matches = await apiFetch<Array<{ id: string; name?: string | undefined }>>(
    `${API_BASE}/${type}?name=${encodeURIComponent(name.trim())}`,
  );
  const found = matches[0];
  return found ? { id: found.id } : null;
}

/** Fetch official library items (no auth). Uses columnar official_* tables; species reads codex_species. */
export async function fetchOfficialLibrary<T extends LibraryItemType>(
  type: T,
): Promise<LibraryRow<T>[]> {
  return apiFetch<LibraryRow<T>[]>(`/api/official/${type}`, { cache: 'no-store' });
}

/** Auth My Library tab badges (ADR-0015). */
export async function fetchUserLibraryCounts(): Promise<LibraryTabCounts> {
  return apiFetch<LibraryTabCounts>('/api/user/library/counts');
}

/** Public Realms Library tab badges (ADR-0015). `enhanced` is always 0. */
export async function fetchOfficialLibraryCounts(): Promise<LibraryTabCounts> {
  return apiFetch<LibraryTabCounts>('/api/official/counts', { cache: 'no-store' });
}

/** Find an official library item by name (for replace-by-name when publishing). */
export async function findOfficialLibraryItemByName<T extends LibraryItemType>(
  type: T,
  name: string,
): Promise<{ id: string } | null> {
  const items = await fetchOfficialLibrary(type);
  const normalized = (name || '').trim().toLowerCase();
  const found = items.find(
    (i) =>
      String(i.name ?? '')
        .trim()
        .toLowerCase() === normalized,
  );
  return found ? { id: found.id } : null;
}

/**
 * Copy an official library item to the user's library. Strips _source etc.
 * Preserves image_id / imageUrl so the user row references the same bank master (no re-upload).
 */
export async function addOfficialItemToLibrary<T extends LibraryItemType>(
  type: T,
  officialItem: LibraryRow<T>,
): Promise<string> {
  /* eslint-disable @typescript-eslint/no-unused-vars -- strip official-library metadata before copy */
  const { id, docId, _source, ...data } = officialItem as LibraryRow<T> & {
    docId?: unknown | undefined;
    _source?: unknown | undefined;
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return saveToLibrary(type, { ...data, createdAt: new Date().toISOString() });
}

/** Save to official library (admin only). Uses columnar official_* tables; species writes codex_species. */
export async function saveToOfficialLibrary(
  type: LibraryItemType,
  data: LibrarySaveBody,
  options?: { existingId?: string | undefined },
): Promise<string> {
  const body = options?.existingId ? { ...data, id: options.existingId } : data;
  const result = await apiFetch<{ id: string }>(`/api/official/${type}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return result.id;
}

export type { LibraryItemByType, LibraryItemType, LibraryRow, LibrarySaveBody };
