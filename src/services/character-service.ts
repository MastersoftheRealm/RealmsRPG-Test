/**
 * Character Service
 * ==================
 * Client-side API calls for character data. Uses /api/characters (Supabase).
 */

import type { Character, CharacterSummary } from '@/types';
import type { UserCreature, UserItem, UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { CharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { apiFetch, apiFetchOrNull, isConflictError } from '@/lib/api-client';
import { characterLockToken } from '@/lib/character/dirty-patch';
import {
  enqueueCharacterSave,
  rememberCharacterLockToken,
  resolveCharacterLockToken,
} from '@/lib/character/save-lock';

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
  libraryForView?: LibraryForView | undefined;
  enrichment?: CharacterViewEnrichment | undefined;
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

  const data = await apiFetchOrNull<GetCharacterResult | Character>(
    `${API_BASE}/${encodeURIComponent(characterId.trim())}`,
    { cache: 'no-store' },
  );

  if (data === null) return { character: null };

  if (data && typeof data === 'object' && 'character' in data) {
    const wrapped = data as GetCharacterResult;
    if (wrapped.character?.id) {
      rememberCharacterLockToken(wrapped.character.id, wrapped.character.updatedAt);
    }
    return {
      character: wrapped.character,
      libraryForView: wrapped.libraryForView,
      enrichment: wrapped.enrichment,
    };
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const character = data as Character;
    if (character.id) rememberCharacterLockToken(character.id, character.updatedAt);
    return { character };
  }
  return { character: data as Character };
}

/**
 * Save a character (update). Send a dirty-key subset plus optional `updatedAt`
 * (the token from GET / last PATCH, upgraded from the in-memory lock). Stale
 * `updatedAt` → 409; refetch and retry via `saveCharacterWithConflictRetry`
 * (ADR-0013). Same-id PATCHes are queued (TASK-786). `skipLock` is for
 * encounter HP LWW (resource sync).
 */
export async function saveCharacter(
  characterId: string,
  data: Partial<Character>,
  options: {
    updatedAt?: string | Date | null | undefined;
    skipLock?: boolean | undefined;
    enqueue?: boolean | undefined;
  } = {},
): Promise<{ ok: true; updatedAt?: string | undefined }> {
  if (!characterId?.trim()) {
    throw new Error('Invalid character ID');
  }

  const id = characterId.trim();
  const run = async () => {
    const body: Record<string, unknown> = { ...data };
    const lock = options.skipLock
      ? undefined
      : resolveCharacterLockToken(id, options.updatedAt ?? data.updatedAt);
    if (lock) body.updatedAt = lock;
    else delete body.updatedAt;

    const result = await apiFetch<{ ok: true; updatedAt?: string | undefined }>(
      `${API_BASE}/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
    if (result.updatedAt) rememberCharacterLockToken(id, result.updatedAt);
    return result;
  };

  return options.enqueue === false ? run() : enqueueCharacterSave(id, run);
}

/**
 * PATCH dirty keys; on 409 refetch, let the caller re-apply local dirty keys, retry once.
 * `applied` is the body that actually persisted (original dirty, or the 409 retry dirty).
 */
export async function saveCharacterWithConflictRetry(
  characterId: string,
  dirty: Partial<Character>,
  options: {
    updatedAt?: string | Date | null | undefined;
    mergeOnConflict: (remote: Character) => {
      dirty: Partial<Character>;
      updatedAt?: string | Date | null | undefined;
    };
  },
): Promise<{ updatedAt?: string | undefined; applied: Partial<Character> }> {
  const id = characterId.trim();
  return enqueueCharacterSave(id, async () => {
    try {
      const result = await saveCharacter(id, dirty, {
        updatedAt: options.updatedAt,
        enqueue: false,
      });
      return { updatedAt: result.updatedAt, applied: dirty };
    } catch (err) {
      if (!isConflictError(err)) throw err;
      const { character: remote } = await getCharacter(id);
      if (!remote) throw err;
      const next = options.mergeOnConflict(remote);
      if (Object.keys(next.dirty).length === 0) {
        return { updatedAt: characterLockToken(remote.updatedAt), applied: {} };
      }
      const retried = await saveCharacter(id, next.dirty, {
        updatedAt: next.updatedAt,
        enqueue: false,
      });
      return { updatedAt: retried.updatedAt, applied: next.dirty };
    }
  });
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
  options: { clientRequestId?: string | undefined } = {},
): Promise<string> {
  const result = await apiFetch<{ id: string }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(
      options.clientRequestId ? { ...data, clientRequestId: options.clientRequestId } : data,
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
