/**
 * Library Service
 * ================
 * Client-side API calls for saving items to user library.
 * Used by creators (power, technique, item, creature).
 */

import { apiFetch } from '@/lib/api-client';

const API_BASE = '/api/user/library';

export type LibraryType = 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species';

export async function saveToLibrary(
  type: LibraryType,
  data: Record<string, unknown>,
  options?: { existingId?: string }
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

export async function findLibraryItemByName(
  type: LibraryType,
  name: string
): Promise<{ id: string } | null> {
  try {
    const items = await apiFetch<Array<{ id: string; name?: string }>>(`${API_BASE}/${type}`);
    const found = items.find(
      (i) => (i.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase()
    );
    return found ? { id: found.id } : null;
  } catch {
    return null;
  }
}

/** Fetch official library items (no auth). Uses columnar official_* tables; species reads codex_species. */
export async function fetchOfficialLibrary(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species'
): Promise<Array<Record<string, unknown>>> {
  return apiFetch<Array<Record<string, unknown>>>(`/api/official/${type}`, { cache: 'no-store' });
}

/** Find an official library item by name (for replace-by-name when publishing). */
export async function findOfficialLibraryItemByName(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species',
  name: string
): Promise<{ id: string } | null> {
  const items = await fetchOfficialLibrary(type);
  const normalized = (name || '').trim().toLowerCase();
  const found = items.find(
    (i) => String((i as Record<string, unknown>).name ?? '').trim().toLowerCase() === normalized
  ) as { id: string } | undefined;
  return found ? { id: found.id } : null;
}

/** Copy an official library item to the user's library. Strips _source etc. */
export async function addOfficialItemToLibrary(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species',
  officialItem: Record<string, unknown>
): Promise<string> {
  /* eslint-disable @typescript-eslint/no-unused-vars -- strip official-library metadata before copy */
  const { id, docId, _source, ...data } = officialItem as Record<string, unknown> & {
    id?: unknown;
    docId?: unknown;
    _source?: unknown;
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return saveToLibrary(type, { ...data, createdAt: new Date().toISOString() });
}

/** Save to official library (admin only). Uses columnar official_* tables; species writes codex_species. */
export async function saveToOfficialLibrary(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items' | 'creatures' | 'species',
  data: Record<string, unknown>,
  options?: { existingId?: string }
): Promise<string> {
  const body = options?.existingId ? { ...data, id: options.existingId } : data;
  const result = await apiFetch<{ id: string }>(`/api/official/${type}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return result.id;
}
