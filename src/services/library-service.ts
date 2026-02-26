/**
 * Library Service
 * ================
 * Client-side API calls for saving items to user library.
 * Used by creators (power, technique, item, creature).
 */

const API_BASE = '/api/user/library';

export type LibraryType = 'powers' | 'techniques' | 'items' | 'creatures' | 'species';

export async function saveToLibrary(
  type: LibraryType,
  data: Record<string, unknown>,
  options?: { existingId?: string }
): Promise<string> {
  if (options?.existingId) {
    const res = await fetch(`${API_BASE}/${type}/${encodeURIComponent(options.existingId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error ?? 'Save failed');
    }
    return options.existingId;
  }

  const res = await fetch(`${API_BASE}/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Save failed');
  }
  const result = (await res.json()) as { id: string };
  return result.id;
}

export async function findLibraryItemByName(
  type: LibraryType,
  name: string
): Promise<{ id: string } | null> {
  const res = await fetch(`${API_BASE}/${type}`);
  if (!res.ok) return null;
  const items = (await res.json()) as Array<{ id: string; name?: string }>;
  const found = items.find((i) => (i.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
  return found ? { id: found.id } : null;
}

/** Fetch official library items (no auth). Uses columnar official_* tables. */
export async function fetchOfficialLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures'
): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`/api/official/${type}`);
  if (!res.ok) throw new Error('Failed to fetch official library');
  return (await res.json()) as Array<Record<string, unknown>>;
}

/** @deprecated Use fetchOfficialLibrary. Fetches official library (same data). */
export const fetchPublicLibrary = fetchOfficialLibrary;

/** Find an official library item by name (for replace-by-name when publishing). */
export async function findOfficialLibraryItemByName(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  name: string
): Promise<{ id: string } | null> {
  const items = await fetchOfficialLibrary(type);
  const normalized = (name || '').trim().toLowerCase();
  const found = items.find(
    (i) => (String((i as Record<string, unknown>).name ?? '').trim().toLowerCase() === normalized)
  ) as { id: string } | undefined;
  return found ? { id: found.id } : null;
}

/** @deprecated Use findOfficialLibraryItemByName. */
export const findPublicLibraryItemByName = findOfficialLibraryItemByName;

/** Copy an official library item to the user's library. Strips _source etc. */
export async function addOfficialItemToLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  officialItem: Record<string, unknown>
): Promise<string> {
  const { id: _id, docId: _docId, _source, ...data } = officialItem;
  return saveToLibrary(type, { ...data, createdAt: new Date().toISOString() });
}

/** @deprecated Use addOfficialItemToLibrary. */
export const addPublicItemToLibrary = addOfficialItemToLibrary;

/** Save to official library (admin only). Uses columnar official_* tables. */
export async function saveToOfficialLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  data: Record<string, unknown>,
  options?: { existingId?: string }
): Promise<string> {
  const body = options?.existingId ? { ...data, id: options.existingId } : data;
  const res = await fetch(`/api/official/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string; details?: string };
    const msg = err.details ? `${err.error ?? 'Save failed'}: ${err.details}` : (err.error ?? 'Save to official library failed');
    throw new Error(msg);
  }
  const result = (await res.json()) as { id: string };
  return result.id;
}

/** @deprecated Use saveToOfficialLibrary. */
export const saveToPublicLibrary = saveToOfficialLibrary;
