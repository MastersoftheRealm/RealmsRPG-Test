/**
 * Library Service
 * ================
 * Client-side API calls for saving items to user library.
 * Used by creators (power, technique, item, creature).
 */

const API_BASE = '/api/user/library';

export async function saveToLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
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
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  name: string
): Promise<{ id: string } | null> {
  const res = await fetch(`${API_BASE}/${type}`);
  if (!res.ok) return null;
  const items = (await res.json()) as Array<{ id: string; name?: string }>;
  const found = items.find((i) => (i.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
  return found ? { id: found.id } : null;
}

/** Fetch public library items (no auth). */
export async function fetchPublicLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures'
): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`/api/public/${type}`);
  if (!res.ok) throw new Error('Failed to fetch public library');
  return (await res.json()) as Array<Record<string, unknown>>;
}

/** Find a public library item by name (for replace-by-name when publishing). */
export async function findPublicLibraryItemByName(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  name: string
): Promise<{ id: string } | null> {
  const items = await fetchPublicLibrary(type);
  const normalized = (name || '').trim().toLowerCase();
  const found = items.find(
    (i) => (String((i as Record<string, unknown>).name ?? '').trim().toLowerCase() === normalized)
  ) as { id: string } | undefined;
  return found ? { id: found.id } : null;
}

/** Copy a public library item to the user's library. Strips public-specific fields. */
export async function addPublicItemToLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  publicItem: Record<string, unknown>
): Promise<string> {
  const { id: _id, docId: _docId, _source, ...data } = publicItem;
  return saveToLibrary(type, { ...data, createdAt: new Date().toISOString() });
}

/** Save to public library (admin only). Same shape as saveToLibrary. */
export async function saveToPublicLibrary(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  data: Record<string, unknown>,
  options?: { existingId?: string }
): Promise<string> {
  const body = options?.existingId ? { ...data, id: options.existingId } : data;
  const res = await fetch(`/api/public/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string; details?: string };
    const msg = err.details ? `${err.error ?? 'Save failed'}: ${err.details}` : (err.error ?? 'Save to public library failed');
    throw new Error(msg);
  }
  const result = (await res.json()) as { id: string };
  return result.id;
}
