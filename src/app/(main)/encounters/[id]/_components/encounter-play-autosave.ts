import type { UseMutationResult } from '@tanstack/react-query';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import type { Encounter } from '@/types/encounter';
import type { EncounterAutosaveHandler } from './use-encounter-play-page';

type SaveEncounterMutation = UseMutationResult<
  unknown,
  Error,
  { id: string; data: Partial<Omit<Encounter, 'id' | 'createdAt'>> },
  unknown
>;

/** Combat / mixed encounter pages: strip id + createdAt, PATCH via useSaveEncounter. */
export function encounterMutationAutosaveHandler(
  encounterId: string,
  saveMutation: SaveEncounterMutation,
): EncounterAutosaveHandler {
  return async (data: Encounter | null) => {
    if (!data || !encounterId) return;
    const { id, createdAt, ...rest } = data;
    void id;
    void createdAt;
    await saveMutation.mutateAsync({ id: encounterId, data: rest });
  };
}

/** Skill encounter page: optional unload flush via persistEncounterSave. */
export function skillEncounterAutosaveHandler(
  encounterId: string,
  saveMutation: SaveEncounterMutation,
  signedIn: boolean,
): EncounterAutosaveHandler {
  return async (data: Encounter | null, flush) => {
    if (!data || !encounterId) return;
    const body = encounterAutosaveBody(data);
    if (flush?.unload) {
      await persistEncounterSave(encounterId, body, {
        signedIn,
        keepalive: true,
      });
      return;
    }
    await saveMutation.mutateAsync({ id: encounterId, data: body });
  };
}
