/**
 * Guest Encounter Migration
 * ==========================
 * Moves localStorage guest encounters to the authenticated user's account on sign-in.
 */

import { logClientError } from '@/lib/api-client';
import { createEncounter } from '@/services/encounter-service';
import {
  getGuestEncountersList,
  getGuestEncounter,
  deleteGuestEncounter,
} from '@/lib/guest-encounter-storage';
import { beginSingleFlight } from '@/lib/guest-migration-lock';
import type { Encounter } from '@/types/encounter';

const MIGRATION_FLAG = 'realms_guest_encounters_migrated';

const migrationSlot: { current: Promise<number> | null } = { current: null };

export function hasGuestEncountersToMigrate(): boolean {
  if (typeof window === 'undefined') return false;
  return getGuestEncountersList().length > 0;
}

/**
 * Upload guest encounters to the API and clear local copies.
 * Concurrent callers share one flight. Encounter creates have no idempotency
 * column, so this lock is what stops a second POST of the same guest encounter.
 */
export function migrateGuestEncountersOnSignIn(): Promise<number> {
  if (typeof window === 'undefined') return Promise.resolve(0);
  if (sessionStorage.getItem(MIGRATION_FLAG) === '1') return Promise.resolve(0);
  return beginSingleFlight(migrationSlot, migrateGuestEncountersOnce);
}

async function migrateGuestEncountersOnce(): Promise<number> {
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
      // Best-effort background migrate on sign-in; user is not notified.
      logClientError(`guest-encounter-migration: failed to migrate "${summary.id}"`, err);
    }
  }

  if (migrated > 0 || getGuestEncountersList().length === 0) {
    sessionStorage.setItem(MIGRATION_FLAG, '1');
  }
  return migrated;
}

function guestEncounterToCreatePayload(
  guest: Encounter,
): Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> {
  /* eslint-disable @typescript-eslint/no-unused-vars -- strip server fields for create payload */
  const { id, createdAt, updatedAt, ...rest } = guest;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return rest;
}
