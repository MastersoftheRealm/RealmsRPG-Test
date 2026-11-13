/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applySheetEnergyPointsChange,
  applySheetHealthPointsChange,
} from '@/lib/character/current-follows-max';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { useAuthStore } from '@/stores/auth-store';
import { ToastProvider } from '@/components/ui';
import { DEFAULT_ABILITIES } from '@/types';
import type { Character } from '@/types';
import { useCharacterSheetPageData } from './use-character-sheet-page-data';

const characterMocks = vi.hoisted(() => ({
  getCharacter: vi.fn(),
  saveCharacter: vi.fn(async () => ({ ok: true as const, updatedAt: '2026-11-10T12:00:01.000Z' })),
  saveCharacterWithConflictRetry: vi.fn(async (_id: string, dirty: Record<string, unknown>) => ({
    applied: dirty,
    updatedAt: '2026-11-10T12:00:02.000Z',
  })),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel() {
      return this;
    },
    on() {
      return this;
    },
    subscribe() {
      return this;
    },
    removeChannel() {},
  }),
}));

vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-auth')>('@/hooks/use-auth');
  return {
    ...actual,
    useAuth: () => ({
      user: { uid: 'user', id: 'user' },
      loading: false,
      error: null,
      initialized: true,
    }),
  };
});

vi.mock('@/hooks/use-game-rules', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/use-game-rules')>('@/hooks/use-game-rules');
  return {
    ...actual,
    useGameRules: () => ({
      rules: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: async () => ({}),
    }),
  };
});

vi.mock('@/services/character-service', async () => {
  const actual = await vi.importActual<typeof import('@/services/character-service')>(
    '@/services/character-service',
  );
  return {
    ...actual,
    getCharacter: characterMocks.getCharacter as typeof actual.getCharacter,
    saveCharacter: characterMocks.saveCharacter as typeof actual.saveCharacter,
    saveCharacterWithConflictRetry:
      characterMocks.saveCharacterWithConflictRetry as typeof actual.saveCharacterWithConflictRetry,
  };
});

vi.mock('@/services/campaign-service', async () => {
  const actual = await vi.importActual<typeof import('@/services/campaign-service')>(
    '@/services/campaign-service',
  );
  return {
    ...actual,
    getMyCampaignsFull: async () => [],
  };
});

function loadedCharacter(): Character {
  return {
    id: 'c-qa',
    userId: 'user',
    name: 'Hero',
    level: 4,
    abilities: { ...DEFAULT_ABILITIES, acuity: 2 },
    archetype: { type: 'power' },
    pow_abil: 'acuity',
    pow_prof: 1,
    mart_prof: 0,
    healthPoints: 0,
    energyPoints: 0,
    currentHealth: 20,
    currentEnergy: 8,
    updatedAt: '2026-11-10T12:00:00.000Z',
  } as Character;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('QA HP/EN allocation PATCH', () => {
  beforeEach(() => {
    characterMocks.getCharacter.mockReset();
    characterMocks.saveCharacter.mockClear();
    characterMocks.saveCharacterWithConflictRetry.mockClear();
    characterMocks.getCharacter.mockResolvedValue({
      character: loadedCharacter(),
      enrichment: emptyCharacterViewEnrichment(),
    });
    useAuthStore.setState({
      user: { uid: 'user', id: 'user' },
      loading: false,
      initialized: true,
      error: null,
    });
  });

  it('sends healthPoints and energyPoints on the sheet save after allocating', async () => {
    const { result } = renderHook(() => useCharacterSheetPageData('c-qa'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.character?.energyPoints).toBe(0);
    });

    const allocated = applySheetEnergyPointsChange(
      applySheetHealthPointsChange(result.current.character as Character, 3),
      8,
    );
    await act(async () => {
      result.current.setCharacter(allocated);
    });

    await waitFor(() => {
      expect(characterMocks.saveCharacter).toHaveBeenCalled();
    });

    expect(characterMocks.saveCharacter).toHaveBeenCalledWith(
      'c-qa',
      expect.objectContaining({ healthPoints: 3, energyPoints: 8 }),
      expect.objectContaining({ skipLock: true }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(characterMocks.saveCharacterWithConflictRetry).toHaveBeenCalledWith(
      'c-qa',
      expect.objectContaining({ healthPoints: 3, energyPoints: 8 }),
      expect.anything(),
    );
  });
});
