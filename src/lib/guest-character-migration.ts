/**
 * Guest Character Migration
 * ==========================
 * Moves localStorage guest characters to the authenticated user's account on sign-in.
 */

import { logClientError } from '@/lib/api-client';
import { createCharacter, saveCharacter } from '@/services/character-service';
import { uploadCharacterPortraitFromDataUrl } from '@/lib/portrait';
import {
  getGuestCharactersList,
  getGuestCharacter,
  deleteGuestCharacter,
} from '@/lib/guest-character-storage';
import type { Character } from '@/types';

const MIGRATION_FLAG = 'realms_guest_characters_migrated';

export function hasGuestCharactersToMigrate(): boolean {
  if (typeof window === 'undefined') return false;
  return getGuestCharactersList().length > 0;
}

/**
 * Upload guest characters to the API and clear local copies.
 * Safe to call multiple times; skips when list is empty or migration already ran this session.
 */
export async function migrateGuestCharactersOnSignIn(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (sessionStorage.getItem(MIGRATION_FLAG) === '1') return 0;

  const summaries = getGuestCharactersList();
  if (summaries.length === 0) return 0;

  let migrated = 0;
  for (const summary of summaries) {
    const guest = getGuestCharacter(summary.id);
    if (!guest) {
      deleteGuestCharacter(summary.id);
      continue;
    }
    try {
      const { payload, portraitDataUrl } = guestCharacterToCreatePayload(guest);
      const newId = await createCharacter(payload);
      if (portraitDataUrl) {
        try {
          const { url } = await uploadCharacterPortraitFromDataUrl(newId, portraitDataUrl);
          await saveCharacter(newId, { portrait: url });
        } catch (err) {
          logClientError(
            `guest-character-migration: portrait upload failed for "${summary.id}"`,
            err,
          );
        }
      }
      deleteGuestCharacter(summary.id);
      migrated += 1;
    } catch (err) {
      logClientError(`guest-character-migration: failed to migrate "${summary.id}"`, err);
    }
  }

  if (migrated > 0 || getGuestCharactersList().length === 0) {
    sessionStorage.setItem(MIGRATION_FLAG, '1');
  }
  return migrated;
}

function guestCharacterToCreatePayload(guest: Character): {
  payload: Partial<Character>;
  portraitDataUrl: string | null;
} {
  const rest: Partial<Character> = { ...guest };
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  delete rest.userId;
  const portrait = rest.portrait;
  const isData = typeof portrait === 'string' && portrait.startsWith('data:');
  if (isData) {
    delete rest.portrait;
  }
  return {
    payload: rest,
    portraitDataUrl: isData && typeof portrait === 'string' ? portrait : null,
  };
}
