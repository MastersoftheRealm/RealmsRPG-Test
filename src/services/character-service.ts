/**
 * Character Service
 * ==================
 * Client-side API calls for character data. Uses /api/characters (Prisma).
 */

import type { Character, CharacterSummary } from '@/types';
import { apiFetch } from '@/lib/api-client';

const API_BASE = '/api/characters';

/** Owner's library items returned when viewing another user's character (read-only enrichment). */
export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
}

export interface GetCharacterResult {
  character: Character | null;
  libraryForView?: LibraryForView;
}

/**
 * Get all characters for the current user.
 */
export async function getCharacters(): Promise<CharacterSummary[]> {
  return apiFetch<CharacterSummary[]>(API_BASE);
}

/**
 * Get a single character by ID.
 * When viewing another user's character (public/campaign), includes libraryForView for read-only enrichment.
 */
export async function getCharacter(characterId: string): Promise<GetCharacterResult> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(characterId.trim())}`);
  if (res.status === 404) return { character: null };
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }

  const data = await res.json();
  if (data && typeof data.character !== 'undefined') {
    return { character: data.character, libraryForView: data.libraryForView };
  }
  return { character: data as Character };
}

/**
 * Save a character (create or update).
 */
export async function saveCharacter(
  characterId: string,
  data: Partial<Character>
): Promise<void> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(characterId.trim())}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Create a new character with auto-generated ID.
 */
export async function createCharacter(data: Partial<Character>): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.id;
}

/**
 * Delete a character.
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  await apiFetch<void>(`${API_BASE}/${encodeURIComponent(characterId.trim())}`, {
    method: 'DELETE',
  });
}

/**
 * Duplicate a character.
 */
export async function duplicateCharacter(characterId: string): Promise<string> {
  const { character } = await getCharacter(characterId);

  if (!character) {
    throw new Error('Character not found');
  }

  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify({ duplicateOf: characterId }),
  });
  return result.id;
}
