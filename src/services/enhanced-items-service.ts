/**
 * Enhanced Items Service
 * ======================
 * Client-side API calls for user enhanced items (saved from crafting).
 */

import type { UserEnhancedItem } from '@/types/crafting';
import { apiFetch } from '@/lib/api-client';

const API_BASE = '/api/user/enhanced-items';

export async function getEnhancedItems(): Promise<UserEnhancedItem[]> {
  return apiFetch<UserEnhancedItem[]>(API_BASE);
}

export async function createEnhancedItem(
  data: Omit<UserEnhancedItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.id;
}

export async function deleteEnhancedItem(id: string): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function updateEnhancedItem(
  id: string,
  patch: { potency?: number; name?: string }
): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
