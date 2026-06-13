/**
 * Guest Encounter Migration
 * ==========================
 * Moves localStorage guest encounters to the authenticated user's account on sign-in.
 */

import { createEncounter } from '@/services/encounter-service';
import {
  getGuestEncountersList,
  getGuestEncounter,
  deleteGuestEncounter,
} from '@/lib/guest-encounter-storage';
import type { Encounter } from '@/types/encounter';

const MIGRATION_FLAG = 'realms_guest_encounters_migrated';

export function hasGuestEncountersToMigrate(): boolean {
  if (typeof window === 'undefined') return false;
  return getGuestEncountersList().length > 0;
}

/**
 * Upload guest encounters to the API and clear local copies.
 * Safe to call multiple times; skips when list is empty or migration already ran this session.
 */
export async function migrateGuestEncountersOnSignIn(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (sessionStorage.getItem(MIGRATION_FLAG) === '1') return 0;

  const summaries = getGuestEncountersList();
  if (summaries.length === 0) return 0;

  let migrated = 0;
  for (const summary of summaries) {
    const guest = getGuestEncounter(summary.id);
    if (!guest) {
      deleteGuestEncounter(summary.id);
      continue;
    }
    try {
      const payload = guestEncounterToCreatePayload(guest);
      await createEncounter(payload);
      deleteGuestEncounter(summary.id);
      migrated += 1;
    } catch (err) {
      console.error('[guest-encounter-migration] Failed to migrate', summary.id, err);
    }
  }

  if (migrated > 0 || summaries.length === 0) {
    sessionStorage.setItem(MIGRATION_FLAG, '1');
  }
  return migrated;
}

function guestEncounterToCreatePayload(
  guest: Encounter
): Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> {
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = guest;
  return rest;
}
