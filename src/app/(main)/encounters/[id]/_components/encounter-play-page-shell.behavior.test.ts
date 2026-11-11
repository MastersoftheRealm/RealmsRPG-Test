/** @vitest-environment happy-dom */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import type { Encounter } from '@/types/encounter';

const autosaveEnabledRef = vi.hoisted(() => ({ current: false }));
const useEncounterMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useEncounter: useEncounterMock,
    useSaveEncounter: () => ({ mutateAsync: vi.fn() }),
    useCampaignsFull: () => ({ data: [] }),
    useAuth: () => ({ user: { id: 'u1' } }),
    useAutoSave: (opts: { enabled?: boolean }) => {
      autosaveEnabledRef.current = Boolean(opts.enabled);
      return {
        isSaving: false,
        hasUnsavedChanges: false,
        syncBlockedByNetwork: false,
        saveNow: vi.fn(),
      };
    },
  };
});

vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return { ...actual, useToast: () => ({ showToast: vi.fn() }) };
});

import { useEncounterPlayPage } from './encounter-play-page-shell';

describe('useEncounterPlayPage behavior', () => {
  beforeEach(() => {
    autosaveEnabledRef.current = false;
    useEncounterMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  it('does not enable autosave while the encounter query is loading', () => {
    renderHook(() => useEncounterPlayPage({ encounterId: 'enc-1' }));
    expect(autosaveEnabledRef.current).toBe(false);
  });

  it('enables autosave after load and hydration', () => {
    const row: Encounter = { ...createDefaultEncounter('combat', 'Test'), id: 'enc-1' };
    useEncounterMock.mockReturnValue({
      data: row,
      isLoading: false,
      error: null,
    });
    renderHook(() => useEncounterPlayPage({ encounterId: 'enc-1' }));
    expect(autosaveEnabledRef.current).toBe(true);
  });

  it('does not commit an empty trimmed name', () => {
    const row: Encounter = { ...createDefaultEncounter('combat', 'Keep Me'), id: 'enc-2' };
    useEncounterMock.mockReturnValue({
      data: row,
      isLoading: false,
      error: null,
    });
    const { result, rerender } = renderHook(() => useEncounterPlayPage({ encounterId: 'enc-2' }));
    rerender();
    act(() => {
      result.current.startEditingName();
      result.current.setNameInput('   ');
      result.current.handleCommitName();
    });
    expect(result.current.encounter?.name).toBe('Keep Me');
  });
});
