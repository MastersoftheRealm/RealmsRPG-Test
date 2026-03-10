/**
 * Crafting Service
 * =================
 * Client-side API calls for crafting sessions. Uses /api/crafting (Supabase).
 */

import type {
  CraftingSession,
  CraftingSessionSummary,
  CraftingSessionData,
} from '@/types/crafting';
import { apiFetch } from '@/lib/api-client';

const API_BASE = '/api/crafting';

export async function getCraftingSessions(): Promise<CraftingSessionSummary[]> {
  return apiFetch<CraftingSessionSummary[]>(API_BASE);
}

export async function getCraftingSession(sessionId: string): Promise<CraftingSession | null> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(sessionId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json();
}

export async function createCraftingSession(
  data: CraftingSessionData
): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.id;
}

export async function saveCraftingSession(
  sessionId: string,
  data: Partial<CraftingSessionData>
): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCraftingSession(sessionId: string): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}
