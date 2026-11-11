// @vitest-environment happy-dom
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useEncounterPlayPageMock } = vi.hoisted(() => ({
  useEncounterPlayPageMock: vi.fn(() => ({
    gatePhase: 'loading' as const,
    encounter: null,
    setEncounter: vi.fn(),
    campaignsFull: [],
    user: null,
    isSaving: false,
    hasUnsavedChanges: false,
    syncBlockedByNetwork: false,
    saveNow: vi.fn(async () => {}),
    isEditingName: false,
    nameInput: '',
    setNameInput: vi.fn(),
    handleCommitName: vi.fn(),
    handleCancelEditName: vi.fn(),
    startEditingName: vi.fn(),
  })),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: <T,>(usable: T): T => {
      if (
        usable &&
        typeof usable === 'object' &&
        'then' in usable &&
        typeof (usable as Promise<unknown>).then === 'function'
      ) {
        return { id: 'enc-skill-wiring' } as T;
      }
      return actual.use(usable as never);
    },
  };
});

vi.mock('../_components/encounter-play-page-shell', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../_components/encounter-play-page-shell')>();
  return { ...actual, useEncounterPlayPage: useEncounterPlayPageMock };
});

import SkillEncounterPage from './page';

describe('SkillEncounterPage play wiring', () => {
  beforeEach(() => {
    useEncounterPlayPageMock.mockClear();
  });

  it('wires keepalive unload and skill gate into useEncounterPlayPage', async () => {
    render(<SkillEncounterPage params={Promise.resolve({ id: 'enc-skill-wiring' })} />);
    await waitFor(() => {
      expect(useEncounterPlayPageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          encounterId: 'enc-skill-wiring',
          keepaliveOnUnload: true,
          requireSkillEncounter: true,
        }),
      );
    });
  });
});
