/** @vitest-environment happy-dom */
import React, { useEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
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
import { characterViewerId, mergeCharacterSaveResultIntoDetailQuery } from '@/hooks/use-characters';
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

vi.mock('@/lib/character/save-lock', () => ({
  enqueueCharacterSave: (_id: string, run: () => Promise<unknown>) => run(),
  rememberCharacterLockToken: vi.fn(),
  resolveCharacterLockToken: () => '2026-01-01T00:00:00.000Z',
}));

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
        expected: inventoryRowCasSnapshot({
          inventoryRowId: KNIFE_ROW,
          id: 'lib-knife',
          name: 'Knife',
          type: 'weapon',
        }),
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
        expected: inventoryRowCasSnapshot({
          inventoryRowId: HEALTH_ROW,
          id: 'health-potion',
          name: 'Health Potion',
          quantity: 3,
        }),
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

    expect(patchBodies).toHaveLength(2);
    const retryBody = patchBodies[1]!;
    const retryItem = (
      retryBody.inventoryPatch as {
        ops: Array<{ item?: { quantity?: number }; expected?: { quantity?: number } }>;
      }
    ).ops[0];
    expect(retryItem?.expected?.quantity).toBe(4);
    expect(retryItem?.item?.quantity).toBeLessThan(4);

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
});