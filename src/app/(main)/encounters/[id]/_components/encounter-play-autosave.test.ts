import { describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import {
  encounterMutationAutosaveHandler,
  skillEncounterAutosaveHandler,
} from './encounter-play-autosave';
import { persistEncounterSave } from '@/services/encounter-service';

vi.mock('@/services/encounter-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/encounter-service')>();
  return {
    ...actual,
    persistEncounterSave: vi.fn(),
  };
});

describe('encounter play autosave handlers', () => {
  it('mutation handler strips id and createdAt before PATCH', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const saveMutation = { mutateAsync } as never;
    const encounter = { ...createDefaultEncounter('combat', 'Keep'), id: 'e-1', createdAt: 't0' };
    const save = encounterMutationAutosaveHandler('e-1', saveMutation);

    await save(encounter);

    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'e-1',
      data: expect.not.objectContaining({ id: 'e-1', createdAt: 't0' }),
    });
  });

  it('skill handler uses keepalive persist on unload flush', async () => {
    const mutateAsync = vi.fn();
    const saveMutation = { mutateAsync } as never;
    const encounter = { ...createDefaultEncounter('skill', 'Flush'), id: 'e-2' };
    const save = skillEncounterAutosaveHandler('e-2', saveMutation, true);

    await save(encounter, { unload: true });

    expect(persistEncounterSave).toHaveBeenCalledWith(
      'e-2',
      expect.not.objectContaining({ id: expect.anything() }),
      { signedIn: true, keepalive: true },
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
