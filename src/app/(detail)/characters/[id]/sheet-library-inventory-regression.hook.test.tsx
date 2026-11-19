/** @vitest-environment happy-dom */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import {
  advanceCharacterAutosaveBaseline,
  peekCharacterAutosaveBaselineForTest,
} from '@/lib/character/autosave-baseline';
import { mergeSheetRealtimePayload } from '@/lib/character/realtime-merge';
import {
  attachRelationalInventoryPatchToDirty,
  inventoryRowCasSnapshot,
} from '@/lib/character/inventory-patch';
import { useAuthStore } from '@/stores/auth-store';
import { ToastProvider } from '@/components/ui';
import { DEFAULT_ABILITIES } from '@/types';
import type { Character } from '@/types';
import { useCharacterSheetPageData } from './use-character-sheet-page-data';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';
const KNIFE_ROW = '20000000-0000-4000-8000-000000000002';

const characterMocks = vi.hoisted(() => ({
  getCharacter: vi.fn(),
  saveCharacterWithConflictRetry: vi.fn(),
  saveCharacterMutate: vi.fn(),
  lastPatchBody: null as Record<string, unknown> | null,
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

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  const emptyList = { data: [], isPending: false, isLoading: false, isFetching: false };
  return {
    ...actual,
    useTraits: () => emptyList,
    useUserPowers: () => emptyList,
    useUserTechniques: () => emptyList,
    useUserEmpoweredTechniques: () => emptyList,
    useUserItems: () => emptyList,
    usePowerParts: () => emptyList,
    useTechniqueParts: () => emptyList,
    useItemProperties: () => emptyList,
    useMergedSpecies: () => emptyList,
    useCodexFeats: () => emptyList,
    useCodexSkills: () => emptyList,
    useCodexArchetypes: () => emptyList,
    useEquipment: () => emptyList,
    useOfficialLibrary: () => emptyList,
    useCampaignsFull: () => emptyList,
    useCharacterResourceSync: () => undefined,
  };
});

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

vi.mock('@/hooks/use-characters', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/use-characters')>('@/hooks/use-characters');
  return {
    ...actual,
    useSaveCharacter: () => ({
      mutate: characterMocks.saveCharacterMutate,
      isPending: false,
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
    saveCharacterWithConflictRetry:
      characterMocks.saveCharacterWithConflictRetry as typeof actual.saveCharacterWithConflictRetry,
  };
});

vi.mock('@/services/campaign-service', async () => {
  const actual = await vi.importActual<typeof import('@/services/campaign-service')>(
    '@/services/campaign-service',
  );
  return { ...actual, getMyCampaignsFull: async () => [] };
});

vi.mock('@/hooks/use-codex', () => ({
  useCodexPowerParts: () => ({ data: [] }),
  useCodexTechniqueParts: () => ({ data: [] }),
  useCodexItemProperties: () => ({ data: [] }),
}));

function characterWithHealthPotion(): Character {
  return {
    id: 'c-qa',
    userId: 'user',
    name: 'Hero',
    level: 4,
    abilities: { ...DEFAULT_ABILITIES, acuity: 2 },
    archetype: { type: 'power' },
    pow_abil: 'acuity',
    notes: 'baseline-note',
    equipment: {
      items: [
        {
          inventoryRowId: HEALTH_ROW,
          id: 'health-potion',
          name: 'Health Potion',
          quantity: 3,
        },
      ],
      weapons: [],
      armor: [],
      shields: [],
    },
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as Character;
}

function libraryAddSaveResult() {
  return {
    applied: {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
        ],
        weapons: [{ id: 'lib-knife', name: 'Knife', inventoryRowId: KNIFE_ROW }],
        armor: [],
        shields: [],
      },
    },
    updatedAt: '2026-01-02T00:00:00.000Z',
    inventoryPatchResult: {
      createdRows: [{ inventoryRowId: KNIFE_ROW, bucket: 'weapons', position: 1 }],
    },
  };
}

function Wrapper({ children, client }: { children: React.ReactNode; client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('library inventory + sheet autosave baseline (hook)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    characterMocks.getCharacter.mockReset();
    characterMocks.saveCharacterWithConflictRetry.mockReset();
    characterMocks.saveCharacterMutate.mockReset();
    characterMocks.getCharacter.mockResolvedValue({
      character: characterWithHealthPotion(),
      enrichment: emptyCharacterViewEnrichment(),
    });
    characterMocks.lastPatchBody = null;
    characterMocks.saveCharacterWithConflictRetry.mockImplementation(
      async (_id, dirty, options?: { inventorySaveBaseline?: Record<string, unknown> | null }) => {
        const body = { ...dirty } as Record<string, unknown>;
        attachRelationalInventoryPatchToDirty(body, options?.inventorySaveBaseline ?? {});
        characterMocks.lastPatchBody = body;
        return {
          applied: body,
          updatedAt: '2026-01-02T00:00:01.000Z',
        };
      },
    );
    useAuthStore.setState({
      user: { uid: 'user', id: 'user' },
      loading: false,
      initialized: true,
      error: null,
    });
  });

  async function mountSheet() {
    return renderHook(() => useCharacterSheetPageData('c-qa'), {
      wrapper: ({ children }) => <Wrapper client={queryClient}>{children}</Wrapper>,
    });
  }

  it('without baseline advance after library save, remove does not emit inventory remove op', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: libraryAddSaveResult().applied.equipment as Character['equipment'],
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          ...(result.current.character as Character).equipment,
          weapons: [],
        },
      });
    });

    await act(async () => {
      await result.current.saveNow();
    });

    const ops =
      (characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] } | undefined)?.ops ?? [];
    expect(ops.some((op) => (op as { op?: string }).op === 'remove')).toBe(false);
  });

  it('after library add success, baseline includes new weapon row id for remove', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    const saveResult = libraryAddSaveResult();
    await act(async () => {
      advanceCharacterAutosaveBaseline('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: saveResult.applied.equipment as Character['equipment'],
        updatedAt: saveResult.updatedAt,
      });
    });

    const baseline = peekCharacterAutosaveBaselineForTest('c-qa');
    const weapons = (baseline?.equipment as { weapons: Array<{ inventoryRowId?: string }> })
      .weapons;
    expect(weapons[0]?.inventoryRowId).toBe(KNIFE_ROW);

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          ...(result.current.character as Character).equipment,
          weapons: [],
        },
      });
    });

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.saveCharacterWithConflictRetry).toHaveBeenCalled());

    const ops = (characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toEqual([
      expect.objectContaining({
        op: 'remove',
        bucket: 'weapons',
        inventoryRowId: KNIFE_ROW,
        expected: inventoryRowCasSnapshot(weapons[0] as Record<string, unknown>),
      }),
    ]);
  });

  it('library-add hook onSuccess advances registered sheet baseline', async () => {
    await mountSheet();
    await waitFor(() => expect(peekCharacterAutosaveBaselineForTest('c-qa')).not.toBeNull());

    const saveResult = libraryAddSaveResult();
    characterMocks.saveCharacterMutate.mockImplementation(
      (_vars: unknown, opts: { onSuccess?: (r: unknown) => void }) => {
        opts?.onSuccess?.(saveResult);
      },
    );

    const { result } = renderHook(() => useAddToCharacterFromLibrary('weapon', 'c-qa'), {
      wrapper: ({ children }) => <Wrapper client={queryClient}>{children}</Wrapper>,
    });

    await waitFor(() => expect(result.current.active).toBe(true));
    await act(async () => {
      result.current.openAddConfirm('Knife', {
        id: 'lib-knife',
        docId: 'lib-knife',
        name: 'Knife',
        type: 'weapon',
        properties: [],
      });
    });

    const knivesBefore = (
      peekCharacterAutosaveBaselineForTest('c-qa')?.equipment as {
        weapons: unknown[];
      }
    )?.weapons;
    expect(knivesBefore?.length ?? 0).toBe(0);

    await act(async () => {
      const modal = result.current.confirmModal as React.ReactElement<{
        onConfirm: () => void;
      }>;
      const onConfirm = modal.props.onConfirm;
      onConfirm();
    });

    const baseline = peekCharacterAutosaveBaselineForTest('c-qa');
    expect(
      (baseline?.equipment as { weapons: Array<{ inventoryRowId?: string }> }).weapons[0]
        ?.inventoryRowId,
    ).toBe(KNIFE_ROW);
  });

  it('pending local notes survive library add baseline advance', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'local-edit',
      });
    });
    await waitFor(() => expect(result.current.character?.notes).toBe('local-edit'));

    await act(async () => {
      advanceCharacterAutosaveBaseline('c-qa', libraryAddSaveResult());
    });

    const baseline = peekCharacterAutosaveBaselineForTest('c-qa');
    expect(baseline?.notes).toBe('baseline-note');
    expect(result.current.character?.notes).toBe('local-edit');
  });

  it('after qty increase save, decrease to 1 sends quantity on the update op', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      advanceCharacterAutosaveBaseline('c-qa', {
        applied: {
          inventoryPatch: {
            ops: [
              {
                op: 'update',
                bucket: 'items',
                inventoryRowId: HEALTH_ROW,
                expected: inventoryRowCasSnapshot({
                  inventoryRowId: HEALTH_ROW,
                  id: 'health-potion',
                  name: 'Health Potion',
                  quantity: 3,
                }),
                item: {
                  id: 'health-potion',
                  name: 'Health Potion',
                  quantity: 2,
                  equipped: false,
                },
              },
            ],
          },
        },
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 2,
            },
          ],
          weapons: [],
          armor: [],
          shields: [],
        },
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          ...(result.current.character as Character).equipment,
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 1,
            },
          ],
        },
      });
    });

    await waitFor(() => expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(1));

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      const item = (
        characterMocks.lastPatchBody?.inventoryPatch as {
          ops: Array<{ item?: { quantity?: number } }>;
        }
      ).ops[0]?.item;
      expect(item?.quantity).toBe(1);
    });
  });

  it('after library add, qty edit sends inventory update not add', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    const saveResult = libraryAddSaveResult();
    await act(async () => {
      advanceCharacterAutosaveBaseline('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 5,
            },
          ],
          weapons: [{ id: 'lib-knife', name: 'Knife', type: 'weapon', inventoryRowId: KNIFE_ROW }],
          armor: [],
          shields: [],
        },
        updatedAt: saveResult.updatedAt,
      });
    });

    await waitFor(() => {
      expect((result.current.character?.equipment?.weapons as unknown[] | undefined)?.length).toBe(
        1,
      );
    });

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.saveCharacterWithConflictRetry).toHaveBeenCalled());

    const ops = (characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops.some((op) => (op as { op?: string }).op === 'add')).toBe(false);
    expect(ops.some((op) => (op as { op?: string }).op === 'remove')).toBe(false);
    expect(ops).toEqual([expect.objectContaining({ op: 'update', inventoryRowId: HEALTH_ROW })]);
  });

  it('after library add, removing a pre-existing inventory item emits remove with CAS', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    const saveResult = libraryAddSaveResult();
    const postAddEquipment = saveResult.applied.equipment as NonNullable<Character['equipment']>;

    await act(async () => {
      advanceCharacterAutosaveBaseline('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: postAddEquipment,
        updatedAt: saveResult.updatedAt,
      });
    });

    await waitFor(() => {
      expect((result.current.character?.equipment?.weapons as unknown[] | undefined)?.length).toBe(
        1,
      );
    });

    const baseline = peekCharacterAutosaveBaselineForTest('c-qa');
    const healthBaseline = (baseline?.equipment as { items: Record<string, unknown>[] }).items[0]!;

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          items: [],
          weapons: postAddEquipment.weapons ?? [],
          armor: [],
          shields: [],
        },
      });
    });

    await waitFor(() => expect(result.current.character?.equipment?.items?.length).toBe(0));
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    expect(
      (peekCharacterAutosaveBaselineForTest('c-qa')?.equipment as { items: unknown[] }).items
        .length,
    ).toBe(1);

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      const patch = characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] } | undefined;
      expect(patch?.ops?.length).toBeGreaterThan(0);
    });

    const ops = (characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toEqual([
      expect.objectContaining({
        op: 'remove',
        bucket: 'items',
        inventoryRowId: HEALTH_ROW,
        expected: inventoryRowCasSnapshot(healthBaseline),
      }),
    ]);
  });

  it('realtime remote keeps locally dirty notes while adopting remote inventory', async () => {
    const character = characterWithHealthPotion();
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'local-edit',
      });
    });

    const baseline = peekCharacterAutosaveBaselineForTest('c-qa')!;
    const remote = {
      ...character,
      notes: 'remote-note',
      equipment: {
        ...character.equipment,
        weapons: [{ id: 'lib-knife', name: 'Knife', inventoryRowId: KNIFE_ROW }],
      },
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    const merged = mergeSheetRealtimePayload(
      { ...(result.current.character as Character), notes: 'local-edit' },
      remote as unknown as Record<string, unknown>,
      baseline,
      { updatedAt: remote.updatedAt },
    );

    expect(merged.character.notes).toBe('local-edit');
    expect(
      (merged.character.equipment?.weapons as Array<{ inventoryRowId?: string }>)[0]
        ?.inventoryRowId,
    ).toBe(KNIFE_ROW);
  });
});
