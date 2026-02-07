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
