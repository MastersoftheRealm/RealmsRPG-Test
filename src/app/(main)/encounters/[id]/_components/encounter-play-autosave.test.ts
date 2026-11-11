/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import type { useAutoSave } from '@/hooks';
import { useEncounterPlayPage } from './encounter-play-page-shell';

const mutateAsync = vi.fn().mockResolvedValue(undefined);
const encounterRow = { ...createDefaultEncounter('skill', 'Autosave'), id: 'e-autosave' };

let autoSaveOptions: Parameters<typeof useAutoSave<unknown>>[0] | null = null;

vi.mock('@/services/encounter-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/encounter-service')>();
  return { ...actual, persistEncounterSave: vi.fn() };
});

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useEncounter: () => ({ data: encounterRow, isLoading: false, error: null }),
    useSaveEncounter: () => ({ mutateAsync, isPending: false }),
    useCampaignsFull: () => ({ data: [] }),
    useAuth: () => ({ user: { id: 'u1' } }),
    useAutoSave: (opts: Parameters<typeof useAutoSave<unknown>>[0]) => {
      autoSaveOptions = opts;
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
  return {
    ...actual,
    useToast: () => ({ showToast: vi.fn() }),
  };
});

describe('useEncounterPlayPage autosave', () => {
  afterEach(() => {
    vi.clearAllMocks();
    autoSaveOptions = null;
  });

  it('uses keepalive persistEncounterSave on unload when keepaliveOnUnload is true', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-autosave',
        keepaliveOnUnload: true,
        signedIn: true,
      }),
    );
    await waitFor(() => expect(autoSaveOptions?.enabled).toBe(true));
    await act(async () => {
      await autoSaveOptions!.onSave(encounterRow, { unload: true });
    });
    expect(persistEncounterSave).toHaveBeenCalledWith(
      'e-autosave',
      encounterAutosaveBody(encounterRow),
      { signedIn: true, keepalive: true },
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('uses save mutation without keepalive for debounced saves', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-autosave',
        keepaliveOnUnload: true,
        signedIn: true,
      }),
    );
    await waitFor(() => expect(autoSaveOptions?.enabled).toBe(true));
    await act(async () => {
      await autoSaveOptions!.onSave(encounterRow, undefined);
    });
    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'e-autosave',
      data: encounterAutosaveBody(encounterRow),
    });
    expect(persistEncounterSave).not.toHaveBeenCalled();
  });

  it('does not use keepalive on unload when keepaliveOnUnload is false', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-autosave',
        keepaliveOnUnload: false,
      }),
    );
    await waitFor(() => expect(autoSaveOptions?.enabled).toBe(true));
    await act(async () => {
      await autoSaveOptions!.onSave(encounterRow, { unload: true });
    });
    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'e-autosave',
      data: encounterAutosaveBody(encounterRow),
    });
    expect(persistEncounterSave).not.toHaveBeenCalled();
  });
});
