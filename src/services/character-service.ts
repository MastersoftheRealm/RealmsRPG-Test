/**
 * Character Service
 * ==================
 * Client-side API calls for character data. Uses /api/characters (Supabase).
 */

import type { Character, CharacterSummary } from '@/types';
import type { UserCreature, UserItem, UserPower, UserTechnique } from '@/hooks/use-user-library';
import { apiFetch, apiFetchOrNull, isConflictError } from '@/lib/api-client';
import { characterLockToken } from '@/lib/character/dirty-patch';

const API_BASE = '/api/characters';

/** Owner's library items returned when viewing another user's character (read-only enrichment). */
export interface LibraryForView {
  powers: UserPower[];
  techniques: UserTechnique[];
  items: UserItem[];
  creatures: UserCreature[];
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

  const data = await apiFetchOrNull<
    | GetCharacterResult
    | Character
  >(`${API_BASE}/${encodeURIComponent(characterId.trim())}`, { cache: 'no-store' });

  if (data === null) return { character: null };

  if (data && typeof data === 'object' && 'character' in data) {
    const wrapped = data as GetCharacterResult;
    return { character: wrapped.character, libraryForView: wrapped.libraryForView };
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { character: data as Character };
  }
  return { character: data as Character };
}

/**
 * Save a character (update). Send a dirty-key subset plus optional `updatedAt`
 * (the token from GET / last PATCH). Stale `updatedAt` → 409; refetch and retry
 * via `saveCharacterWithConflictRetry` (ADR-0013).
 */
export async function saveCharacter(
  characterId: string,
  data: Partial<Character>,
  options: { updatedAt?: string | Date | null } = {}
): Promise<{ ok: true; updatedAt?: string }> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  const body: Record<string, unknown> = { ...data };
  const lock = characterLockToken(options.updatedAt) ?? characterLockToken(data.updatedAt);
  if (lock) body.updatedAt = lock;
  else delete body.updatedAt;

  return apiFetch<{ ok: true; updatedAt?: string }>(
    `${API_BASE}/${encodeURIComponent(characterId.trim())}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  );
}

/**
 * PATCH dirty keys; on 409 refetch, let the caller re-apply local dirty keys, retry once.
 */
export async function saveCharacterWithConflictRetry(
  characterId: string,
  dirty: Partial<Character>,
  options: {
    updatedAt?: string | Date | null;
    mergeOnConflict: (remote: Character) => {
      dirty: Partial<Character>;
      updatedAt?: string | Date | null;
    };
  }
): Promise<{ updatedAt?: string }> {
  try {
    return await saveCharacter(characterId, dirty, { updatedAt: options.updatedAt });
  } catch (err) {
    if (!isConflictError(err)) throw err;
    const { character: remote } = await getCharacter(characterId);
    if (!remote) throw err;
    const next = options.mergeOnConflict(remote);
    if (Object.keys(next.dirty).length === 0) {
      return { updatedAt: characterLockToken(remote.updatedAt) };
    }
    return await saveCharacter(characterId, next.dirty, { updatedAt: next.updatedAt });
  }
}

/**
 * Create a new character with auto-generated ID.
 *
 * Pass the same `clientRequestId` on every retry of one save attempt: the route replays
 * the first create instead of inserting a second character when a response is lost
 * (TASK-738). Creators persist the key on the draft (`resolveClientRequestId`) so a
 * reload-then-retry still hits the same row; `resetCreator` clears it for the next character.
 */
export async function createCharacter(
  data: Partial<Character>,
  options: { clientRequestId?: string } = {}
): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(
      options.clientRequestId ? { ...data, clientRequestId: options.clientRequestId } : data
    ),
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
 * Duplicate a character. The server resolves and validates `duplicateOf`
 * (404 when missing), so no wasteful client pre-fetch is needed.
 */
export async function duplicateCharacter(characterId: string): Promise<string> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify({ duplicateOf: characterId.trim() }),
  });
  return result.id;
}
