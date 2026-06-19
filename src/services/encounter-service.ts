/**
 * Encounter Service
 * ==================
 * Client-side API calls for encounter data. Uses /api/encounters (Supabase).
 */

import type { Encounter, EncounterSummary } from '@/types/encounter';
import { apiFetch, apiFetchOrNull } from '@/lib/api-client';

const API_BASE = '/api/encounters';

/**
 * Get all encounters for the current user.
 */
export async function getEncounters(): Promise<EncounterSummary[]> {
  return apiFetch<EncounterSummary[]>(API_BASE);
}

/**
 * Get a single encounter by ID.
 */
export async function getEncounter(encounterId: string): Promise<Encounter | null> {
  return apiFetchOrNull<Encounter>(`${API_BASE}/${encodeURIComponent(encounterId)}`);
}

/**
 * Create a new encounter. Returns the new encounter ID.
 */
export async function createEncounter(
  data: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.id;
}

/**
 * Save (update) an existing encounter.
 */
export async function saveEncounter(
  encounterId: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>
): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(encounterId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete an encounter.
 */
export async function deleteEncounter(encounterId: string): Promise<void> {
  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(encounterId)}`, {
    method: 'DELETE',
  });
}
