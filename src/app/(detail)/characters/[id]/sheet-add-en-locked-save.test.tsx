/** @vitest-environment happy-dom */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SheetHeaderResources } from '@/components/character-sheet/sheet-header-resources';
import { useSheetResourceActions } from '@/components/character-sheet/use-sheet-resource-actions';
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

const realtime = vi.hoisted(() => ({
  handler: null as
    | null
    | ((payload: { new: { id: string; current_energy?: number; updated_at?: string } }) => void),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel() {
      return this;
    },
    on(
      _event: string,
      _filter: unknown,
      cb: (payload: { new: { id: string; current_energy?: number; updated_at?: string } }) => void,
    ) {
      realtime.handler = cb;
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

/** Level-4 sheet that has never stored an energy allocation (the key is absent). */
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

function AddEnButtonHarness() {
  const data = useCharacterSheetPageData('c-qa');
  const actions = useSheetResourceActions({
    character: data.character,
    setCharacter: data.setCharacter,
    calculatedStats: data.calculatedStats,
    featsDb: [],
    traitsDb: [],
    codexArchetypes: [],
    rules: undefined,
    showToast: () => {},
    user: { uid: 'user' },
    setError: () => {},
    setUploadingPortrait: () => {},
    setPortraitRefreshKey: () => {},
  });
  if (!data.character) return null;
  return (
    <SheetHeaderResources
      actionPoints={data.character.actionPoints ?? 0}
      currentHealth={data.character.currentHealth ?? 0}
      maxHealth={data.calculatedStats?.maxHealth ?? 0}
      currentEnergy={data.character.currentEnergy ?? 0}
      maxEnergy={data.calculatedStats?.maxEnergy ?? 0}
      terminal={0}
      isEditMode
      healthPoints={data.character.healthPoints ?? 0}
      energyPoints={data.character.energyPoints ?? 0}
      totalHEPool={36}
      onHealthPointsChange={actions.handleHealthPointsChange}
      onEnergyPointsChange={actions.handleEnergyPointsChange}
    />
  );
}

describe('Add EN button locked allocation PATCH', () => {
  beforeEach(() => {
    realtime.handler = null;
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

  it('sends energyPoints on the locked PATCH after Add EN and the current-energy echo', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AddEnButtonHarness />, { wrapper: Wrapper });
    const addEn = await screen.findByTitle('Add EN points');
    for (let i = 0; i < 8; i += 1) {
      await user.click(addEn);
    }

    const echoedAt = '2026-11-10T12:00:01.000Z';
    const echoed = loadedCharacter();
    echoed.currentEnergy = 16;
    echoed.updatedAt = echoedAt;
    characterMocks.getCharacter.mockResolvedValue({
      character: echoed,
      enrichment: emptyCharacterViewEnrichment(),
    });

    await act(async () => {
      realtime.handler?.({
        new: {
          id: 'c-qa',
          current_energy: 16,
          updated_at: echoedAt,
        },
      });
    });
    await waitFor(() => {
      expect(characterMocks.getCharacter.mock.calls.length).toBeGreaterThan(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    characterMocks.saveCharacterWithConflictRetry.mockClear();

    await waitFor(
      () => {
        const lockedCalls = characterMocks.saveCharacterWithConflictRetry.mock
          .calls as unknown as Array<[string, { energyPoints?: number }]>;
        expect(lockedCalls.some((call) => call[1].energyPoints === 8)).toBe(true);
      },
      { timeout: 4000 },
    );

    const fastCalls = characterMocks.saveCharacter.mock.calls as unknown as Array<
      [string, Record<string, unknown>]
    >;
    for (const call of fastCalls) {
      expect(call[1]).not.toHaveProperty('energyPoints');
      expect(call[1]).not.toHaveProperty('healthPoints');
    }
  }, 10000);
});
