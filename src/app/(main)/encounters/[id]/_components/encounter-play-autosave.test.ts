/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import type { useAutoSave } from '@/hooks';
import { useEncounterPlayPage } from './encounter-play-page-shell';

/** fetch `keepalive` request bodies are capped at 64 KiB in Chromium. */
const FETCH_KEEPALIVE_BODY_LIMIT_BYTES = 64 * 1024;

const mutateAsync = vi.fn().mockResolvedValue(undefined);
const encounterRow = { ...createDefaultEncounter('skill', 'Autosave'), id: 'e-autosave' };
const combatRow = { ...createDefaultEncounter('combat', 'Combat unload'), id: 'e-combat' };
const mixedRow = { ...createDefaultEncounter('mixed', 'Mixed unload'), id: 'e-mixed' };

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

  it('uses keepalive persistEncounterSave on unload for skill play', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-autosave',
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

  it('uses keepalive persistEncounterSave on unload for combat play', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-combat',
      }),
    );
    await waitFor(() => expect(autoSaveOptions?.enabled).toBe(true));
    await act(async () => {
      await autoSaveOptions!.onSave(combatRow, { unload: true });
    });
    expect(persistEncounterSave).toHaveBeenCalledWith(
      'e-combat',
      encounterAutosaveBody(combatRow),
      { signedIn: true, keepalive: true },
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('uses keepalive persistEncounterSave on unload for mixed play', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-mixed',
      }),
    );
    await waitFor(() => expect(autoSaveOptions?.enabled).toBe(true));
    await act(async () => {
      await autoSaveOptions!.onSave(mixedRow, { unload: true });
    });
    expect(persistEncounterSave).toHaveBeenCalledWith('e-mixed', encounterAutosaveBody(mixedRow), {
      signedIn: true,
      keepalive: true,
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('uses save mutation without keepalive for debounced saves', async () => {
    renderHook(() =>
      useEncounterPlayPage({
        encounterId: 'e-autosave',
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

  it('keeps default encounter autosave bodies within fetch keepalive size limit', () => {
    for (const encounter of [encounterRow, combatRow, mixedRow]) {
      const bytes = new TextEncoder().encode(
        JSON.stringify(encounterAutosaveBody(encounter)),
      ).length;
      expect(bytes).toBeLessThan(FETCH_KEEPALIVE_BODY_LIMIT_BYTES);
    }
  });
});
