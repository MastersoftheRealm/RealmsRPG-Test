// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useEncounterPlayPage = vi.fn(() => ({
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
}));

vi.mock('../_components/encounter-play-page-shell', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../_components/encounter-play-page-shell')>();
  return { ...actual, useEncounterPlayPage };
});

import SkillEncounterPage from './page';

describe('SkillEncounterPage play wiring', () => {
  beforeEach(() => {
    useEncounterPlayPage.mockClear();
  });

  it('wires keepalive unload and skill gate into useEncounterPlayPage', () => {
    render(<SkillEncounterPage params={Promise.resolve({ id: 'enc-skill-wiring' })} />);
    expect(useEncounterPlayPage).toHaveBeenCalledWith(
      expect.objectContaining({
        encounterId: 'enc-skill-wiring',
        keepaliveOnUnload: true,
        requireSkillEncounter: true,
      }),
    );
  });
});
