/**
 * Encounter Service
 * ==================
 * Client-side API calls for encounter data. Uses /api/encounters (Supabase).
 */

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
  data: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => client.create(data);

/** Save (update) an existing encounter. */
export const saveEncounter = (
  encounterId: string,
  data: Partial<Omit<Encounter, 'id' | 'createdAt'>>
): Promise<void> => client.save(encounterId, data);

/** Delete an encounter. */
export const deleteEncounter = (encounterId: string): Promise<void> =>
  client.remove(encounterId);
