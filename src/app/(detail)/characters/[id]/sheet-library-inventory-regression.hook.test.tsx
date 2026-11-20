/** @vitest-environment happy-dom */
import React, { useEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { ApiError, apiFetch, apiFetchOrNull } from '@/lib/api-client';
import {
  CharacterAutosaveBaselineProvider,
  useAdvanceCharacterAutosaveBaseline,
} from '@/lib/character/character-autosave-baseline-context';
import type { CharacterSaveBaselineResult } from '@/lib/character/autosave-baseline';
import { inventoryRowCasSnapshot } from '@/lib/character/inventory-patch';
import {
  InventoryCasMockServer,
  type InventoryCasMockRow,
} from '@/lib/character/inventory-cas-mock-server';
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
  lastSaveResult: null as Record<string, unknown> | null,
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
          cost: 25,
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
            item: { id: 'lib-knife', name: 'Knife', type: 'weapon', equipped: false, cost: 0 },
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
            cost: 25,
          },
        ],
        weapons: [
          { id: 'lib-knife', name: 'Knife', type: 'weapon', inventoryRowId: KNIFE_ROW, cost: 0 },
        ],
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

const inventoryCasState = {
  server: null as InventoryCasMockServer | null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function seedInventoryCasServer(character: Character): InventoryCasMockServer {
  const rows: InventoryCasMockRow[] = [];
  const pushRows = (bucket: InventoryCasMockRow['bucket'], list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const row of list) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const inventoryRowId = r.inventoryRowId;
      if (typeof inventoryRowId !== 'string' || !inventoryRowId.trim()) continue;
      rows.push({ ...r, inventoryRowId, bucket });
    }
  };
  const equip = character.equipment ?? {};
  pushRows('items', equip.items);
  pushRows('weapons', equip.weapons);
  pushRows('shields', equip.shields);
  pushRows('accessories', equip.accessories);
  if (equip.armor && typeof equip.armor === 'object' && !Array.isArray(equip.armor)) {
    const armor = equip.armor as unknown as Record<string, unknown>;
    if (typeof armor.inventoryRowId === 'string') {
      rows.push({ ...armor, inventoryRowId: armor.inventoryRowId, bucket: 'armor' });
    }
  }
  return new InventoryCasMockServer(rows);
}

function characterFromInventoryServer(base: Character): Character {
  const equipment = inventoryCasState.server?.toEquipment() ?? base.equipment;
  return {
    ...base,
    equipment: equipment as Character['equipment'],
    updatedAt: inventoryCasState.updatedAt,
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
    if (patch?.ops?.length) {
      inventoryCasState.server?.applyPatchOrThrow(
        patch as Parameters<InventoryCasMockServer['applyPatchOrThrow']>[0],
      );
    }
    inventoryCasState.updatedAt = '2026-01-02T00:00:01.000Z';
    const nextCharacter = characterFromInventoryServer(characterWithHealthPotion());
    characterMocks.getCharacter.mockResolvedValue({
      character: nextCharacter,
      enrichment: emptyCharacterViewEnrichment(),
    });
    const addOp = patch?.ops?.find((op) => op.op === 'add' && op.bucket === 'weapons');
    return {
      ok: true as const,
      updatedAt: inventoryCasState.updatedAt,
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
    const seedCharacter = characterWithHealthPotion();
    inventoryCasState.server = seedInventoryCasServer(seedCharacter);
    const seedUpdatedAt = seedCharacter.updatedAt;
    inventoryCasState.updatedAt =
      typeof seedUpdatedAt === 'string'
        ? seedUpdatedAt
        : seedUpdatedAt instanceof Date
          ? seedUpdatedAt.toISOString()
          : '2026-01-01T00:00:00.000Z';
    characterMocks.getCharacter.mockResolvedValue({
      character: seedCharacter,
      enrichment: emptyCharacterViewEnrichment(),
    });
    characterMocks.lastPatchBody = null;
    characterMocks.lastSaveResult = null;
    queryClient.setQueryData(
      ['characters', 'detail', characterViewerId('user'), 'c-qa'],
      {
        character: seedCharacter,
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
        characterMocks.lastSaveResult = result as unknown as Record<string, unknown>;
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

  async function libraryAddKnifeViaHook(sheet: Awaited<ReturnType<typeof mountSheet>>) {
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
      const modal = library.current.confirmModal as React.ReactElement<{ onConfirm: () => void }>;
      modal.props.onConfirm();
    });
    await waitFor(() => expect(characterMocks.saveCharacterMutate).toHaveBeenCalled());
    await waitFor(() => {
      const weapons = (sheet.result.current.character?.equipment?.weapons ?? []) as Array<{ id?: string }>;
      expect(weapons.some((w) => w.id === 'lib-knife')).toBe(true);
    });
    await waitFor(() => expect(characterMocks.lastSaveResult).toBeTruthy());
  }

  async function syncSheetBaselineFromCasServer(sheet: Awaited<ReturnType<typeof mountSheet>>) {
    const synced = characterFromInventoryServer(characterWithHealthPotion());
    await waitFor(() => expect(advanceBaselineBridge.current).toBeTruthy());
    await act(async () => {
      const syncedUpdatedAt =
        typeof synced.updatedAt === 'string'
          ? synced.updatedAt
          : synced.updatedAt instanceof Date
            ? synced.updatedAt.toISOString()
            : inventoryCasState.updatedAt;
      advanceBaselineBridge.current?.('c-qa', {
        applied: cleanForSave(synced, undefined) as Record<string, unknown>,
        updatedAt: syncedUpdatedAt,
      });
      sheet.result.current.setCharacter({
        ...synced,
        updatedAt: synced.updatedAt,
      });
    });
    await waitFor(() => {
      expect(sheet.result.current.character?.equipment?.weapons?.length).toBe(1);
    });
  }

  async function advanceBaselineFromLibraryAdd(
    sheet: Awaited<ReturnType<typeof mountSheet>>,
    options?: { skipServerSeed?: boolean },
  ) {
    if (!options?.skipServerSeed) {
      const saveResult = libraryAddSaveResult();
      inventoryCasState.server?.applyPatchOrThrow(
        saveResult.applied.inventoryPatch as Parameters<
          InventoryCasMockServer['applyPatchOrThrow']
        >[0],
      );
    }
    await syncSheetBaselineFromCasServer(sheet);
  }

  function knifeInventoryRowId(sheet: Awaited<ReturnType<typeof mountSheet>>): string {
    const row = (sheet.result.current.character?.equipment?.weapons ?? []).find(
      (w) => w.id === 'lib-knife',
    );
    if (!row?.inventoryRowId) throw new Error('expected library knife row');
    return row.inventoryRowId;
  }

  it('sheet saveNow remove library knife succeeds when baseline includes stored cost (B)', async () => {
    const sheet = await mountSheet();
    await waitFor(() => expect(sheet.result.current.character?.id).toBe('c-qa'));
    await advanceBaselineFromLibraryAdd(sheet);
    const { result } = sheet;

    characterMocks.lastPatchBody = null;
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

    await waitFor(() =>
      expect((characterMocks.lastPatchBody as Record<string, unknown> | null)?.inventoryPatch).toBeDefined(),
    );
    const patchBody = characterMocks.lastPatchBody as unknown as Record<string, unknown>;
    const ops = (patchBody.inventoryPatch as { ops: unknown[] }).ops;
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
            cost: 0,
          },
          'weapons',
        ),
      }),
    ]);
    expect(inventoryCasState.server?.getRow(KNIFE_ROW)).toBeUndefined();
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

  describe('prod retest B/C1/E (CAS mock server + real hooks)', () => {
    it('library add then first + persists quantity 2 on server (E)', async () => {
      const sheet = await mountSheet();
      await waitFor(() => expect(sheet.result.current.character?.id).toBe('c-qa'));
      await libraryAddKnifeViaHook(sheet);
      await syncSheetBaselineFromCasServer(sheet);
      const knifeId = knifeInventoryRowId(sheet);

      characterMocks.lastPatchBody = null;
      await act(async () => {
        const knife = (sheet.result.current.character as Character).equipment?.weapons?.find(
          (w) => w.inventoryRowId === knifeId,
        );
        sheet.result.current.setCharacter({
          ...(sheet.result.current.character as Character),
          equipment: {
            ...(sheet.result.current.character as Character).equipment,
            weapons: [{ ...knife!, quantity: 2 }],
          },
        });
      });
      await waitFor(() => expect(sheet.result.current.hasUnsavedChanges).toBe(true));
      await act(async () => {
        await sheet.result.current.saveNow();
      });
      await waitFor(() => expect(characterMocks.lastPatchBody).toBeTruthy());
      const update = (
        (characterMocks.lastPatchBody as unknown as Record<string, unknown>).inventoryPatch as {
          ops: Array<{ op: string; item?: { quantity?: number } }>;
        }
      ).ops[0];
      expect(update?.op).toBe('update');
      expect(update?.item?.quantity).toBe(2);
      expect((update as { inventoryRowId?: string }).inventoryRowId).toBe(knifeId);
      expect(inventoryCasState.server?.getRow(knifeId)?.quantity).toBe(2);
    });

    it('stored cost 25 row qty 3→4 succeeds under CAS (B)', async () => {
      const sheet = await mountSheet();
      await waitFor(() => expect(sheet.result.current.character?.id).toBe('c-qa'));
      await act(async () => {
        sheet.result.current.setCharacter({
          ...(sheet.result.current.character as Character),
          equipment: {
            ...(sheet.result.current.character as Character).equipment,
            items: [
              {
                inventoryRowId: HEALTH_ROW,
                id: 'health-potion',
                name: 'Health Potion',
                quantity: 4,
                cost: 25,
              },
            ],
          },
        });
      });
      await waitFor(() => expect(sheet.result.current.hasUnsavedChanges).toBe(true));
      await act(async () => {
        await sheet.result.current.saveNow();
      });
      await waitFor(() => expect(characterMocks.lastPatchBody).toBeTruthy());
      const op = (
        (characterMocks.lastPatchBody as unknown as Record<string, unknown>).inventoryPatch as {
          ops: Array<{ expected?: { cost?: number }; item?: { quantity?: number } }>;
        }
      ).ops[0];
      expect(op?.expected?.cost).toBe(25);
      expect(op?.item?.quantity).toBe(4);
      expect(inventoryCasState.server?.getRow(HEALTH_ROW)?.quantity).toBe(4);
    });
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
    const sheet = await mountSheet();
    await waitFor(() => expect(sheet.result.current.character?.id).toBe('c-qa'));
    await advanceBaselineFromLibraryAdd(sheet);
    const { result } = sheet;

    const postAddWeapons = (result.current.character?.equipment?.weapons ?? []) as NonNullable<
      Character['equipment']
    >['weapons'];
    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 5,
              cost: 25,
            },
          ],
          weapons: postAddWeapons ?? [],
          armor: [],
          shields: [],
        },
      });
    });

    await waitFor(() => expect(result.current.hasUnsavedChanges).toBe(true));
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() =>
      expect((characterMocks.lastPatchBody as Record<string, unknown> | null)?.inventoryPatch).toBeDefined(),
    );
    const patchBody = characterMocks.lastPatchBody as unknown as Record<string, unknown>;
    const ops = (patchBody.inventoryPatch as { ops: unknown[] }).ops;
    expect(ops.some((op) => (op as { op?: string }).op === 'add')).toBe(false);
    expect(ops.some((op) => (op as { op?: string }).op === 'remove')).toBe(false);
    expect(ops).toEqual([expect.objectContaining({ op: 'update', inventoryRowId: HEALTH_ROW })]);
  });

  it('after library add, removing a pre-existing inventory item emits remove with CAS', async () => {
    const sheet = await mountSheet();
    await waitFor(() => expect(sheet.result.current.character?.id).toBe('c-qa'));
    await advanceBaselineFromLibraryAdd(sheet);
    const { result } = sheet;

    const postAddWeapons = (result.current.character?.equipment?.weapons ?? []) as NonNullable<
      Character['equipment']
    >['weapons'];
    await act(async () => {
      result.current.setCharacter({
        ...(result.current.character as Character),
        equipment: {
          items: [],
          weapons: postAddWeapons ?? [],
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
            cost: 25,
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
});