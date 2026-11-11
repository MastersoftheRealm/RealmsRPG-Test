import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushDirtyAutosave } from '@/hooks/use-auto-save';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import { createDefaultEncounter } from '@/types/encounter';

vi.mock('@/services/encounter-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/encounter-service')>();
  return {
    ...actual,
    persistEncounterSave: vi.fn(),
  };
});

/** Mirrors the skill-flush branch inside useEncounterPlayPage (unload path). */
async function skillFlushAutosave(
  encounterId: string,
  signedIn: boolean,
  data: ReturnType<typeof createDefaultEncounter> & { id: string },
  flush?: { unload: boolean },
  mutateAsync = vi.fn(),
) {
  if (flush?.unload) {
    await persistEncounterSave(encounterId, encounterAutosaveBody(data), {
      signedIn,
      keepalive: true,
    });
    return;
  }
  await mutateAsync({ id: encounterId, data: encounterAutosaveBody(data) });
}

describe('encounter play autosave (skill flush)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unload flush uses keepalive persistEncounterSave', async () => {
    const encounter = { ...createDefaultEncounter('skill', 'Flush'), id: 'e-2' };
    const mutateAsync = vi.fn();

    await skillFlushAutosave('e-2', true, encounter, { unload: true }, mutateAsync);

    expect(persistEncounterSave).toHaveBeenCalledWith(
      'e-2',
      expect.not.objectContaining({ id: expect.anything() }),
      { signedIn: true, keepalive: true },
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('debounced save does not use keepalive', async () => {
    const encounter = { ...createDefaultEncounter('skill', 'Gate'), id: 'e-1' };
    const mutateAsync = vi.fn();
    flushDirtyAutosave({
      enabled: true,
      dirty: true,
      data: encounter,
      save: (data) =>
        skillFlushAutosave('e-1', true, data as typeof encounter, undefined, mutateAsync),
    });
    expect(mutateAsync).toHaveBeenCalled();
    expect(persistEncounterSave).not.toHaveBeenCalled();
  });
});
