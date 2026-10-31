/**
 * Encounter Service
 * ==================
 * Client-side API calls for encounter data. Uses /api/encounters (Supabase).
 */

import { isGuestEncounterId, saveGuestEncounter } from '@/lib/guest-encounter-storage';
import type { Encounter, EncounterSummary } from '@/types/encounter';
import { createResourceClient } from './resource-client';

const client = createResourceClient<
  Encounter,
  EncounterSummary,
  Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>,
  Partial<Omit<Encounter, 'id' | 'createdAt'>>
>('/api/encounters');

/** Get all encounters for the current user. */
export const getEncounters = (): Promise<EncounterSummary[]> => client.list();

/** Get a single encounter by ID. */
export const getEncounter = (encounterId: string): Promise<Encounter | null> =>
  client.get(encounterId);

/** Create a new encounter. Returns the new encounter ID. */
export const createEncounter = (
  data: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => client.create(data);

/** Body the encounter pages already send. `id` and `createdAt` stay off the PATCH. */
export function encounterAutosaveBody(
  encounter: Encounter,
): Partial<Omit<Encounter, 'id' | 'createdAt'>> {
  const { id, createdAt, ...rest } = encounter;
  void id;
  void createdAt;
  return rest;
}

/** Save (update) an existing encounter. `keepalive` lets the unload flush finish after refresh. */
const saveEncounter = (
  encounterId: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>,
  options?: { keepalive?: boolean },
): Promise<void> => client.save(encounterId, data, options);

/**
 * Same guest-or-API branch as `useSaveEncounter`. The skill-encounter unload flush
 * calls this directly so the PATCH starts during pagehide, before the page is discarded.
 */
export function persistEncounterSave(
  encounterId: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>,
  options?: { signedIn?: boolean; keepalive?: boolean },
): Promise<void> {
  if (options?.signedIn || !isGuestEncounterId(encounterId)) {
    return saveEncounter(encounterId, data, options?.keepalive ? { keepalive: true } : undefined);
  }
  saveGuestEncounter(encounterId, data);
  return Promise.resolve();
}

/** Delete an encounter. */
export const deleteEncounter = (encounterId: string): Promise<void> => client.remove(encounterId);
