import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { collectCharacterLibraryRefIds } from './character-view-enrichment';
import { getOwnerLibraryForView } from './owner-library-for-view';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const OWNER = 'owner-user';

type Row = Record<string, unknown>;

interface QueryCall {
  table: string;
  columns: string;
  ids: string[];
}

/**
 * Minimal fake that applies the same filters PostgREST would, so a row the
 * character does not reference can only appear if the query is unconstrained.
 */
function createMockServiceClient(tables: Record<string, Row[]>, failOn?: string) {
  const calls: QueryCall[] = [];

  const client = {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (_col: string, userId: string) => ({
          in: async (_idCol: string, ids: string[]) => {
            calls.push({ table, columns, ids });
            if (failOn === table) {
              return { data: null, error: { code: 'PGRST301', message: 'JWT expired' } };
            }
            const rows = (tables[table] ?? []).filter(
              (row) => row.user_id === userId && ids.includes(String(row.id)),
            );
            return { data: rows, error: null };
          },
        }),
      }),
    }),
  };

  return { client, calls };
}

function powerRow(id: string, name: string, userId = OWNER): Row {
  return { id, user_id: userId, name, description: `${name} description`, payload: {} };
}

describe('collectCharacterLibraryRefIds', () => {
  it('collects power, technique and equipment ids across stored ref shapes', () => {
    const refIds = collectCharacterLibraryRefIds({
      powers: [
        { id: 'power-1', name: 'Firebolt' },
        { id: 42, name: 'Official Power' },
      ],
      techniques: [{ docId: 'technique-1', name: 'Riposte' }],
      equipment: {
        weapons: [{ id: 'item-weapon', name: 'Sword' }],
        armor: { id: 'item-armor', name: 'Plate' },
        items: [{ id: 'item-gear', name: 'Rope' }],
        shields: [],
      },
    });

    expect(refIds.powers.sort()).toEqual(['42', 'power-1']);
    expect(refIds.techniques).toEqual(['technique-1']);
    expect(refIds.items.sort()).toEqual(['item-armor', 'item-gear', 'item-weapon']);
    expect(refIds.creatures).toEqual([]);
  });

  it('returns empty sets for a character with no library refs', () => {
    expect(collectCharacterLibraryRefIds({ name: 'Blank' })).toEqual({
      powers: [],
      techniques: [],
      items: [],
      creatures: [],
    });
    expect(collectCharacterLibraryRefIds(null)).toEqual({
      powers: [],
      techniques: [],
      items: [],
      creatures: [],
    });
  });
});

describe('getOwnerLibraryForView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return library rows the character never references', async () => {
    const { client, calls } = createMockServiceClient({
      user_powers: [
        powerRow('power-referenced', 'Referenced Power'),
        powerRow('power-unpublished', 'Secret Homebrew'),
      ],
    });
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    const result = await getOwnerLibraryForView(OWNER, {
      powers: ['power-referenced'],
      techniques: [],
      items: [],
      creatures: [],
    });

    expect(result.powers.map((p) => p.id)).toEqual(['power-referenced']);
    expect(result.powers.map((p) => p.name)).not.toContain('Secret Homebrew');
    expect(calls).toHaveLength(1);
    expect(calls[0].ids).toEqual(['power-referenced']);
  });

  it('never selects the owner user_id column', async () => {
    const { client, calls } = createMockServiceClient({
      user_powers: [powerRow('power-1', 'Firebolt')],
    });
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    await getOwnerLibraryForView(OWNER, {
      powers: ['power-1'],
      techniques: [],
      items: [],
      creatures: [],
    });

    expect(calls[0].columns).toContain('id');
    expect(calls[0].columns).toContain('payload');
    expect(calls[0].columns.split(', ')).not.toContain('user_id');
  });

  it('queries only the tables with referenced ids', async () => {
    const { client, calls } = createMockServiceClient({
      user_powers: [powerRow('power-1', 'Firebolt')],
      user_items: [{ id: 'item-1', user_id: OWNER, name: 'Sword', payload: {} }],
    });
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    const result = await getOwnerLibraryForView(OWNER, {
      powers: ['power-1'],
      techniques: [],
      items: ['item-1'],
      creatures: [],
    });

    expect(calls.map((c) => c.table).sort()).toEqual(['user_items', 'user_powers']);
    expect(result.techniques).toEqual([]);
    expect(result.creatures).toEqual([]);
  });

  it('returns empty arrays without querying when nothing is referenced', async () => {
    const { client, calls } = createMockServiceClient({
      user_powers: [powerRow('power-unpublished', 'Secret Homebrew')],
    });
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    const result = await getOwnerLibraryForView(OWNER, {
      powers: [],
      techniques: [],
      items: [],
      creatures: [],
    });

    expect(result).toEqual({ powers: [], techniques: [], items: [], creatures: [] });
    expect(calls).toHaveLength(0);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('throws when a library query fails instead of reporting an empty library', async () => {
    const { client } = createMockServiceClient(
      { user_powers: [powerRow('power-1', 'Firebolt')] },
      'user_powers',
    );
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    await expect(
      getOwnerLibraryForView(OWNER, {
        powers: ['power-1'],
        techniques: [],
        items: [],
        creatures: [],
      }),
    ).rejects.toMatchObject({ code: 'PGRST301' });
  });

  it('does not return another user rows even when ids match', async () => {
    const { client } = createMockServiceClient({
      user_powers: [powerRow('power-1', 'Someone Else Power', 'other-user')],
    });
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    const result = await getOwnerLibraryForView(OWNER, {
      powers: ['power-1'],
      techniques: [],
      items: [],
      creatures: [],
    });

    expect(result.powers).toEqual([]);
  });
});
