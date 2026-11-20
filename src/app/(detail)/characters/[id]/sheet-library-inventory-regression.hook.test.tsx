/** @vitest-environment happy-dom */
import React, { useEffect, useState } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { ApiError, apiFetch, apiFetchOrNull } from '@/lib/api-client';
import {
  CharacterAutosaveBaselineProvider,
  useAdvanceCharacterAutosaveBaseline,
} from '@/lib/character/character-autosave-baseline-context';
import type { CharacterSaveBaselineResult } from '@/lib/character/autosave-baseline';
import { inventoryRowCasSnapshot } from '@/lib/character/inventory-patch';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  mergeRemotePreservingDirty,
  pickDirtyCharacterFields,
} from '@/lib/character/dirty-patch';
import { characterViewerId, mergeCharacterSaveResultIntoDetailQuery } from '@/hooks/use-characters';
import {
  rememberCharacterLockToken,
  resetCharacterSaveLockForTests,
} from '@/lib/character/save-lock';
import { saveCharacterWithConflictRetry } from '@/services/character-service';
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
  saveCharacterMutate: vi.fn(),
  lastPatchBody: null as Record<string, unknown> | null,
  realtimeHandlers: [] as Array<(payload: unknown) => void>,
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return {
    ...actual,
    apiFetch: vi.fn(),
    apiFetchOrNull: vi.fn(),
  };
});

vi.mock('@/lib/character/save-lock', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/character/save-lock')>();
  return {
    ...actual,
    enqueueCharacterSave: (_id: string, run: () => Promise<unknown>) => run(),
  };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel() {
      return this;
    },
    on(_event: unknown, _filter: unknown, handler: (payload: unknown) => void) {
      characterMocks.realtimeHandlers.push(handler);
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

const advanceBaselineBridge = {
  current: null as ((characterId: string, result: CharacterSaveBaselineResult) => void) | null,
};

function AutosaveBaselineAdvanceBridge() {
  const advance = useAdvanceCharacterAutosaveBaseline();
  useEffect(() => {
    advanceBaselineBridge.current = advance;
  }, [advance]);
  return null;
}

function characterWithHealthPotionQty2(): Character {
  const base = characterWithHealthPotion();
  base.equipment!.items![0]!.quantity = 2;
  return base;
}

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
      inventoryPatch: {
        ops: [
          {
            op: 'add',
            bucket: 'weapons',
            inventoryRowId: KNIFE_ROW,
            item: { id: 'lib-knife', name: 'Knife', type: 'weapon', equipped: false },
            position: 1,
          },
        ],
      },
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
        ],
        weapons: [{ id: 'lib-knife', name: 'Knife', type: 'weapon', inventoryRowId: KNIFE_ROW }],
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

function wrapperDefaultSaveImplementation() {
  vi.mocked(apiFetchOrNull).mockImplementation(async () => {
    const result = await characterMocks.getCharacter();
    return result.character as Awaited<ReturnType<typeof apiFetchOrNull>>;
  });
  vi.mocked(apiFetch).mockImplementation(async (_url, opts) => {
    if (opts?.body && typeof opts.body === 'string') {
      characterMocks.lastPatchBody = JSON.parse(opts.body) as Record<string, unknown>;
    }
    const patch = characterMocks.lastPatchBody?.inventoryPatch as
      | { ops?: Array<{ op?: string; inventoryRowId?: string; bucket?: string }> }
      | undefined;
    const addOp = patch?.ops?.find((op) => op.op === 'add' && op.bucket === 'weapons');
    return {
      ok: true as const,
      updatedAt: '2026-01-02T00:00:01.000Z',
      ...(addOp?.inventoryRowId
        ? {
            inventoryPatchResult: {
              createdRows: [{ inventoryRowId: addOp.inventoryRowId, bucket: 'weapons', position: 1 }],
            },
          }
        : {}),
    };
  });
}

function Wrapper({ children, client }: { children: React.ReactNode; client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <CharacterAutosaveBaselineProvider>
          <AutosaveBaselineAdvanceBridge />
          {children}
        </CharacterAutosaveBaselineProvider>
      </ToastProvider>
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
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetchOrNull).mockReset();
    characterMocks.saveCharacterMutate.mockReset();
    characterMocks.realtimeHandlers.length = 0;
    advanceBaselineBridge.current = null;
    characterMocks.getCharacter.mockResolvedValue({
      character: characterWithHealthPotion(),
      enrichment: emptyCharacterViewEnrichment(),
    });
    characterMocks.lastPatchBody = null;
    queryClient.setQueryData(
      ['characters', 'detail', characterViewerId('user'), 'c-qa'],
      {
        character: characterWithHealthPotion(),
        enrichment: emptyCharacterViewEnrichment(),
      },
    );
    wrapperDefaultSaveImplementation();
    characterMocks.saveCharacterMutate.mockImplementation((vars, opts) =>
      saveCharacterWithConflictRetry(vars.id, vars.data, {
        updatedAt: vars.updatedAt,
        inventorySaveBaseline: vars.inventorySaveBaseline,
        mergeOnConflict:
          vars.mergeOnConflict ??
          ((remote: Character) => ({
            dirty: vars.data,
            updatedAt: remote.updatedAt,
            inventorySaveBaseline: remote as unknown as Record<string, unknown>,
          })),
      }).then((result) => {
        queryClient.setQueryData(
          ['characters', 'detail', characterViewerId('user'), vars.id],
          (prev: unknown) => mergeCharacterSaveResultIntoDetailQuery(prev as never, result),
        );
        opts?.onSuccess?.(result);
      }),
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

  async function mountSheetWithSharedProvider() {
    const apiRef = { current: null as ReturnType<typeof useCharacterSheetPageData> | null };
    let remountButton: HTMLElement | null = null;

    function SheetHost() {
      const data = useCharacterSheetPageData('c-qa');
      useEffect(() => {
        apiRef.current = data;
      }, [data]);
      return null;
    }

    function Tree() {
      const [generation, setGeneration] = useState(0);
      return (
        <Wrapper client={queryClient}>
          <SheetHost key={generation} />
          <button
            type="button"
            data-testid="remount-sheet-host"
            onClick={() => setGeneration((g) => g + 1)}
          />
        </Wrapper>
      );
    }

    const view = render(<Tree />);
    remountButton = view.getByTestId('remount-sheet-host');
    await waitFor(() => expect(apiRef.current?.character?.id).toBe('c-qa'));

    return {
      result: {
        get current() {
          if (!apiRef.current) throw new Error('sheet hook not mounted');
          return apiRef.current;
        },
      },
      remountHost: async () => {
        await act(async () => {
          remountButton?.click();
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
      },
    };
  }

  it('after library add success, baseline includes new weapon row id for remove', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    const saveResult = libraryAddSaveResult();
    await act(async () => {
      advanceBaselineBridge.current?.('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: saveResult.applied.equipment as Character['equipment'],
        updatedAt: saveResult.updatedAt,
      });
    });

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'tracked-local',
        equipment: {
          ...(result.current.character as Character).equipment,
          weapons: [],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.inventoryPatch).toBeDefined());

    const ops = (characterMocks.lastPatchBody?.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops).toEqual([
      expect.objectContaining({
        op: 'remove',
        bucket: 'weapons',
        inventoryRowId: KNIFE_ROW,
        expected: inventoryRowCasSnapshot(
          {
            inventoryRowId: KNIFE_ROW,
            id: 'lib-knife',
            name: 'Knife',
            type: 'weapon',
          },
          'weapons',
        ),
      }),
    ]);
  });

  it('library-add hook issues inventory save and onSuccess runs through conflict retry', async () => {
    const { result: sheet } = await mountSheet();
    await waitFor(() => expect(sheet.current.character?.id).toBe('c-qa'));

    const { result: library } = renderHook(() => useAddToCharacterFromLibrary('weapon', 'c-qa'), {
      wrapper: ({ children }) => <Wrapper client={queryClient}>{children}</Wrapper>,
    });

    await waitFor(() => expect(library.current.active).toBe(true));
    await act(async () => {
      library.current.openAddConfirm('Knife', {
        id: 'lib-knife',
        docId: 'lib-knife',
        name: 'Knife',
        type: 'weapon',
        properties: [],
      });
    });

    await act(async () => {
      const modal = library.current.confirmModal as React.ReactElement<{
        onConfirm: () => void;
      }>;
      modal.props.onConfirm();
    });

    await waitFor(() => expect(characterMocks.saveCharacterMutate).toHaveBeenCalled());
    const addCall = characterMocks.saveCharacterMutate.mock.calls[0]![0] as {
      inventorySaveBaseline?: Record<string, unknown>;
      data?: Record<string, unknown>;
    };
    expect(addCall.inventorySaveBaseline?.equipment).toBeDefined();
    await waitFor(() =>
      expect(
        (characterMocks.lastPatchBody?.inventoryPatch as { ops?: unknown[] } | undefined)?.ops
          ?.length ?? 0,
      ).toBeGreaterThan(0),
    );
  });

  it('pending local notes are included on the next sheet PATCH after library baseline advance', async () => {
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
      advanceBaselineBridge.current?.('c-qa', libraryAddSaveResult());
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.notes).toBe('local-edit'));
  });

  it('after qty increase save, decrease to 1 sends quantity on the update op', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      advanceBaselineBridge.current?.('c-qa', {
        applied: {
          inventoryPatch: {
            ops: [
              {
                op: 'update',
                bucket: 'items',
                inventoryRowId: HEALTH_ROW,
                expected: inventoryRowCasSnapshot(
                  {
                    inventoryRowId: HEALTH_ROW,
                    id: 'health-potion',
                    name: 'Health Potion',
                    quantity: 3,
                  },
                  'items',
                ),
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

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
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
      advanceBaselineBridge.current?.('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: saveResult.applied.equipment as Character['equipment'],
        updatedAt: saveResult.updatedAt,
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(false));

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
              quantity: 5,
            },
          ],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.inventoryPatch).toBeDefined());
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
      advanceBaselineBridge.current?.('c-qa', saveResult);
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
        expected: inventoryRowCasSnapshot(
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
          'items',
        ),
      }),
    ]);
  });

  it('codex equipment custom_type is sent on weapon remove CAS', async () => {
    const bedRollRow = '30000000-0000-4000-8000-000000000003';
    const withBedRoll = characterWithHealthPotion();
    withBedRoll.equipment!.weapons = [
      {
        inventoryRowId: bedRollRow,
        id: 'lib-bed-roll',
        name: 'Bed Roll',
        type: 'equipment',
      },
    ];
    characterMocks.getCharacter.mockResolvedValue({
      character: withBedRoll,
      enrichment: emptyCharacterViewEnrichment(),
    });
    queryClient.setQueryData(['characters', 'detail', characterViewerId('user'), 'c-qa'], {
      character: withBedRoll,
      enrichment: emptyCharacterViewEnrichment(),
    });

    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'tracked-local',
        equipment: {
          ...(result.current.character as Character).equipment,
          weapons: [],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.inventoryPatch).toBeDefined());
    const removeOp = (
      characterMocks.lastPatchBody?.inventoryPatch as {
        ops: Array<{ expected?: { type?: string } }>;
      }
    ).ops[0];
    expect(removeOp?.expected?.type).toBe('equipment');
  });

  it('after 409 merge, tab B −1 applies on tab A value and the next save does not 409', async () => {
    const remoteAfterTabA = characterWithHealthPotion();
    remoteAfterTabA.equipment!.items![0]!.quantity = 4;
    remoteAfterTabA.updatedAt = '2026-01-02T00:00:01.500Z';

    let saveCalls = 0;
    const patchBodies: Record<string, unknown>[] = [];
    vi.mocked(apiFetch).mockImplementation(async (_url, opts) => {
      saveCalls += 1;
      if (opts?.body && typeof opts.body === 'string') {
        const body = JSON.parse(opts.body) as Record<string, unknown>;
        if (saveCalls > 1) {
          characterMocks.lastPatchBody = body;
        }
        patchBodies.push(body);
      }
      if (saveCalls === 1) {
        throw new ApiError('Character was modified elsewhere', 409);
      }
      if (saveCalls === 2) {
        remoteAfterTabA.equipment!.items![0]!.quantity = 3;
        remoteAfterTabA.updatedAt = '2026-01-02T00:00:02.000Z';
      }
      return { ok: true as const, updatedAt: '2026-01-02T00:00:02.000Z' };
    });
    characterMocks.getCharacter.mockImplementation(async () => ({
      character: remoteAfterTabA,
      enrichment: emptyCharacterViewEnrichment(),
    }));

    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

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
              quantity: 2,
            },
          ],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(saveCalls).toBe(2));
    await waitFor(() =>
      expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(3),
    );

    expect(patchBodies).toHaveLength(2);
    const retryBody = patchBodies[1]!;
    const retryItem = (
      retryBody.inventoryPatch as {
        ops: Array<{ item?: { quantity?: number }; expected?: { quantity?: number } }>;
      }
    ).ops[0];
    expect(retryItem?.expected?.quantity).toBe(4);
    expect(retryItem?.item?.quantity).toBe(3);

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
              quantity: 2,
            },
          ],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(saveCalls).toBe(3));
    const followUpBody = patchBodies[2]!;
    expect(followUpBody.inventoryPatch).toBeDefined();
    const followUp = (
      followUpBody.inventoryPatch as {
        ops: Array<{ expected?: { quantity?: number }; item?: { quantity?: number } }>;
      }
    ).ops[0];
    expect(followUp?.expected?.quantity).toBe(retryItem?.item?.quantity);
    expect(followUp?.item?.quantity).toBe(2);
  });

  it('realtime parent update refetches remote inventory while keeping dirty notes', async () => {
    const remote = characterWithHealthPotion();
    remote.notes = 'remote-note';
    remote.equipment!.weapons = [{ id: 'lib-knife', name: 'Knife', inventoryRowId: KNIFE_ROW }];
    remote.updatedAt = '2026-01-02T00:00:00.000Z';

    const { result } = await mountSheet();
    await waitFor(() => expect(characterMocks.realtimeHandlers.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'local-edit',
      });
    });

    characterMocks.getCharacter.mockResolvedValue({
      character: remote,
      enrichment: emptyCharacterViewEnrichment(),
    });

    const handler = characterMocks.realtimeHandlers[0]!;
    await act(async () => {
      handler({
        new: {
          id: 'c-qa',
          updated_at: remote.updatedAt,
        },
      });
    });

    await waitFor(() =>
      expect(
        (result.current.character?.equipment?.weapons as Array<{ inventoryRowId?: string }>)[0]
          ?.inventoryRowId,
      ).toBe(KNIFE_ROW),
    );
    expect(result.current.character?.notes).toBe('local-edit');
  });

  it('C2 dirty-path: cleanForSave merge yields qty 2 for +1 / −1', () => {
    const baseline = cleanForSave(characterWithHealthPotionQty2()) as Record<string, unknown>;
    const remote = cleanForSave({
      ...characterWithHealthPotionQty2(),
      equipment: {
        ...characterWithHealthPotionQty2().equipment!,
        items: [{ ...characterWithHealthPotionQty2().equipment!.items![0]!, quantity: 3 }],
      },
    } as Character) as Record<string, unknown>;
    const local = cleanForSave({
      ...characterWithHealthPotionQty2(),
      equipment: {
        ...characterWithHealthPotionQty2().equipment!,
        items: [{ ...characterWithHealthPotionQty2().equipment!.items![0]!, quantity: 1 }],
      },
    } as Character) as Record<string, unknown>;
    const dirty = pickDirtyCharacterFields(local, baseline);
    const merged = mergeRemotePreservingDirty(remote, local, Object.keys(dirty), baseline);
    const mergedQty = (merged.equipment as { items?: Array<{ quantity?: number }> } | undefined)
      ?.items?.[0]?.quantity;
    expect(mergedQty, JSON.stringify({ baseline: baseline.equipment, merged: merged.equipment })).toBe(
      2,
    );
  });

  it('C2: tab A +1 then tab B −1 merges to qty 2 (not silent last-write-wins)', async () => {
    resetCharacterSaveLockForTests();
    const initial = characterWithHealthPotionQty2();
    let serverQty = 2;
    let serverUpdatedAt = initial.updatedAt as string;
    const patchLog: Array<{
      updatedAt?: string | undefined;
      expectedQty?: number | undefined;
      itemQty?: number | undefined;
      outcome: 'ok' | '409';
    }> = [];

    const remoteAfterA = () => ({
      ...characterWithHealthPotionQty2(),
      equipment: {
        ...initial.equipment!,
        items: [{ ...initial.equipment!.items![0]!, quantity: serverQty }],
      },
      updatedAt: serverUpdatedAt,
    });

    characterMocks.getCharacter.mockImplementation(async () => ({
      character: remoteAfterA(),
      enrichment: emptyCharacterViewEnrichment(),
    }));
    queryClient.setQueryData(['characters', 'detail', characterViewerId('user'), 'c-qa'], {
      character: initial,
      enrichment: emptyCharacterViewEnrichment(),
    });

    vi.mocked(apiFetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts?.body as string) as Record<string, unknown>;
      const lock = body.updatedAt as string | undefined;
      const inv = body.inventoryPatch as
        | { ops?: Array<{ expected?: { quantity?: number }; item?: { quantity?: number } }> }
        | undefined;
      const op = inv?.ops?.[0];
      const expectedQty = op?.expected?.quantity;
      const itemQty = op?.item?.quantity;

      if (lock && lock !== serverUpdatedAt) {
        patchLog.push({ updatedAt: lock, expectedQty, itemQty, outcome: '409' });
        throw new ApiError('Character was modified elsewhere', 409);
      }
      if (
        expectedQty !== undefined &&
        itemQty !== undefined &&
        expectedQty !== serverQty
      ) {
        patchLog.push({ updatedAt: lock, expectedQty, itemQty, outcome: '409' });
        throw new ApiError('inventory_cas_conflict', 409);
      }

      serverQty = itemQty ?? serverQty;
      const nextUpdatedAt = `2026-01-02T00:00:0${patchLog.filter((e) => e.outcome === 'ok').length + 1}.000Z`;
      serverUpdatedAt = nextUpdatedAt;
      rememberCharacterLockToken('c-qa', serverUpdatedAt);
      patchLog.push({ updatedAt: lock, expectedQty, itemQty, outcome: 'ok' });

      for (const handler of characterMocks.realtimeHandlers) {
        await handler({
          new: { id: 'c-qa', updated_at: serverUpdatedAt },
        });
      }
      characterMocks.getCharacter.mockResolvedValue({
        character: remoteAfterA(),
        enrichment: emptyCharacterViewEnrichment(),
      });

      return { ok: true as const, updatedAt: serverUpdatedAt };
    });

    const tabA = await mountSheet();
    const tabB = await mountSheet();
    await waitFor(() => expect(tabA.result.current.character?.id).toBe('c-qa'));
    await waitFor(() => expect(tabB.result.current.character?.id).toBe('c-qa'));

    await act(async () => {
      tabA.result.current.setCharacter({
        ...(tabA.result.current.character as Character),
        equipment: {
          ...(tabA.result.current.character as Character).equipment,
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 3,
            },
          ],
        },
      });
    });
    await waitFor(() =>
      expect(tabA.result.current.character?.equipment?.items?.[0]?.quantity).toBe(3),
    );
    await waitFor(() => expect(tabA.result.current.hasUnsavedChanges).toBe(true));

    await act(async () => {
      await tabA.result.current.saveNow();
    });

    await waitFor(() => expect(patchLog.some((entry) => entry.outcome === 'ok')).toBe(true));
    await waitFor(() => expect(serverQty).toBe(3));

    await act(async () => {
      tabB.result.current.setCharacter({
        ...(tabB.result.current.character as Character),
        equipment: {
          ...(tabB.result.current.character as Character).equipment,
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
    await waitFor(() => expect(tabB.result.current.hasUnsavedChanges).toBe(true));

    await new Promise((resolve) => setTimeout(resolve, 900));

    await act(async () => {
      await tabB.result.current.saveNow();
    });

    await waitFor(() => expect(patchLog.some((entry) => entry.outcome === '409')).toBe(true));
    await waitFor(() => expect(serverQty).toBe(2));

    const tabBFirstInventoryPatch = patchLog.find(
      (entry) => entry.itemQty === 1 && entry.expectedQty !== undefined,
    );
    expect(tabBFirstInventoryPatch?.expectedQty).toBe(2);
    const tabBRetry = patchLog.find(
      (entry) => entry.outcome === 'ok' && entry.expectedQty === 3 && entry.itemQty === 2,
    );
    expect(tabBRetry).toBeDefined();
  });

  it('sequence 1: remount after potion save notes-only PATCH does not CAS stale potion qty', async () => {
    const { result, remountHost } = await mountSheetWithSharedProvider();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

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
              quantity: 4,
            },
          ],
        },
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    const staleBaseline = cleanForSave(characterWithHealthPotion()) as Record<string, unknown>;
    await act(async () => {
      advanceBaselineBridge.current?.('c-qa', {
        applied: staleBaseline,
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });

    const afterQtySave = characterWithHealthPotion();
    afterQtySave.equipment!.items![0]!.quantity = 4;
    afterQtySave.updatedAt = '2026-01-03T00:00:00.000Z';

    queryClient.setQueryData(['characters', 'detail', characterViewerId('user'), 'c-qa'], {
      character: afterQtySave,
      enrichment: emptyCharacterViewEnrichment(),
    });
    characterMocks.getCharacter.mockResolvedValue({
      character: afterQtySave,
      enrichment: emptyCharacterViewEnrichment(),
    });

    await remountHost();
    await waitFor(() => expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(4));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'edited-after-remount',
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.notes).toBe('edited-after-remount'));
    const ops =
      (characterMocks.lastPatchBody?.inventoryPatch as { ops?: Array<{ inventoryRowId?: string; op?: string }> })
        ?.ops ?? [];
    const potionOps = ops.filter((op) => op.inventoryRowId === HEALTH_ROW);
    expect(potionOps).toHaveLength(0);
  });

  it('sequence 3: notes-only save after library add does not CAS-update unchanged knife', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.id).toBe('c-qa'));

    const saveResult = libraryAddSaveResult();
    await act(async () => {
      advanceBaselineBridge.current?.('c-qa', saveResult);
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: saveResult.applied.equipment as Character['equipment'],
        updatedAt: saveResult.updatedAt,
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(false));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'only-notes',
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.notes).toBe('only-notes'));
    const ops =
      (characterMocks.lastPatchBody?.inventoryPatch as { ops?: Array<{ inventoryRowId?: string; op?: string }> })
        ?.ops ?? [];
    const knifeOps = ops.filter((op) => op.inventoryRowId === KNIFE_ROW);
    expect(knifeOps).toHaveLength(0);
    expect(ops.filter((op) => op.op === 'update')).toHaveLength(0);
    expect(characterMocks.lastPatchBody?.inventoryPatch).toBeUndefined();
  });

  it('concurrent remote potion qty while editing notes saves without CAS double-count', async () => {
    resetCharacterSaveLockForTests();
    let serverQty = 3;
    let serverNotes = 'baseline-note';
    let serverUpdatedAt = '2026-01-01T00:00:00.000Z';
    const patchBodies: Array<Record<string, unknown>> = [];

    const serverDoc = () => {
      const base = characterWithHealthPotion();
      base.notes = serverNotes;
      base.equipment!.items![0]!.quantity = serverQty;
      base.updatedAt = serverUpdatedAt;
      return base;
    };

    characterMocks.getCharacter.mockImplementation(async () => ({
      character: serverDoc(),
      enrichment: emptyCharacterViewEnrichment(),
    }));
    queryClient.setQueryData(['characters', 'detail', characterViewerId('user'), 'c-qa'], {
      character: serverDoc(),
      enrichment: emptyCharacterViewEnrichment(),
    });

    vi.mocked(apiFetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts?.body as string) as Record<string, unknown>;
      patchBodies.push(body);
      characterMocks.lastPatchBody = body;

      const lock = body.updatedAt as string | undefined;
      if (lock && lock !== serverUpdatedAt) {
        throw new ApiError('Character was modified elsewhere', 409);
      }

      const inv = body.inventoryPatch as
        | { ops?: Array<{ expected?: { quantity?: number }; item?: { quantity?: number } }> }
        | undefined;
      const invOp = inv?.ops?.[0];
      if (invOp) {
        const expectedQty = invOp.expected?.quantity;
        const itemQty = invOp.item?.quantity;
        if (expectedQty !== undefined && expectedQty !== serverQty) {
          throw new ApiError('inventory_cas_conflict', 409);
        }
        if (itemQty !== undefined) serverQty = itemQty;
      }

      if (typeof body.notes === 'string') serverNotes = body.notes;

      serverUpdatedAt = `2026-01-03T00:00:0${patchBodies.length}.000Z`;
      rememberCharacterLockToken('c-qa', serverUpdatedAt);
      characterMocks.getCharacter.mockResolvedValue({
        character: serverDoc(),
        enrichment: emptyCharacterViewEnrichment(),
      });

      return { ok: true as const, updatedAt: serverUpdatedAt };
    });

    const { result } = await mountSheet();
    await waitFor(() => expect(characterMocks.realtimeHandlers.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        notes: 'my-notes',
      });
    });
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));

    serverQty = 5;
    const remote = serverDoc();
    remote.updatedAt = '2026-01-02T00:00:00.000Z';
    serverUpdatedAt = remote.updatedAt as string;
    characterMocks.getCharacter.mockResolvedValue({
      character: remote,
      enrichment: emptyCharacterViewEnrichment(),
    });

    const handler = characterMocks.realtimeHandlers[0]!;
    await act(async () => {
      handler({
        new: { id: 'c-qa', updated_at: remote.updatedAt },
      });
    });

    await waitFor(() => expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(5));
    expect(result.current.character?.notes).toBe('my-notes');

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(patchBodies.length).toBeGreaterThanOrEqual(1));
    await waitFor(() => expect(serverNotes).toBe('my-notes'));
    const notesPatch = patchBodies.find((body) => body.notes === 'my-notes');
    expect(notesPatch).toBeDefined();
    expect(notesPatch?.inventoryPatch).toBeUndefined();
    expect(serverQty).toBe(5);

    characterMocks.lastPatchBody = null;
    patchBodies.length = 0;
    await act(async () => {
      await result.current.saveNow();
    });
    await waitFor(() => {
      const strayRevert = patchBodies.some((body) => body.notes === 'baseline-note');
      expect(strayRevert).toBe(false);
    });
    expect(serverNotes).toBe('my-notes');
  });

  it('swallowed edit: qty change plus updatedAt bump in one commit stays dirty and PATCHes', async () => {
    const { result } = await mountSheet();
    await waitFor(() => expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(3));

    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        updatedAt: '2026-01-05T12:00:00.000Z',
        equipment: {
          ...(result.current.character as Character).equipment,
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 7,
            },
          ],
        },
      });
    });

    await waitFor(() =>
      expect(result.current.character?.equipment?.items?.[0]?.quantity).toBe(7),
    );
    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => expect(characterMocks.lastPatchBody?.inventoryPatch).toBeDefined());
    const ops =
      (characterMocks.lastPatchBody?.inventoryPatch as {
        ops?: Array<{ op?: string; inventoryRowId?: string; item?: { quantity?: number } }>;
      })?.ops ?? [];
    const qtyUpdate = ops.find(
      (op) => op.op === 'update' && op.inventoryRowId === HEALTH_ROW && op.item?.quantity === 7,
    );
    expect(qtyUpdate).toBeDefined();
  });
});