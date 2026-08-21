import { describe, expect, it } from 'vitest';
import {
  fetchLibraryTabCounts,
  OFFICIAL_LIBRARY_COUNT_TABLES,
  USER_LIBRARY_COUNT_TABLES,
  type LibraryCountsClient,
} from '@/lib/library/fetch-library-tab-counts';

function createMockClient(config: {
  counts: Record<string, number>;
  itemTypes?: string[] | undefined;
  errors?: Record<string, { message: string; code?: string | undefined }> | undefined;
}): LibraryCountsClient {
  return {
    from: (table: string) => ({
      select: (columns: string) => {
        const error = config.errors?.[table] ?? null;
        const result =
          columns === 'type'
            ? Promise.resolve({
                data: (config.itemTypes ?? []).map((type) => ({ type })),
                error,
                count: null,
              })
            : Promise.resolve({
                data: null,
                error,
                count: config.counts[table] ?? 0,
              });
        return Object.assign(result, {
          eq: () => result,
        });
      },
    }),
  };
}

describe('fetchLibraryTabCounts', () => {
  it('aggregates user tables and splits items by armament kind', async () => {
    const counts = await fetchLibraryTabCounts(
      createMockClient({
        counts: {
          user_powers: 3,
          user_techniques: 2,
          user_empowered_techniques: 1,
          user_creatures: 4,
          user_enhanced_items: 5,
        },
        itemTypes: ['weapon', 'weapon', 'armor', 'shield', 'equipment'],
      }),
      USER_LIBRARY_COUNT_TABLES,
      'user-1',
    );

    expect(counts).toEqual({
      powers: 3,
      techniques: 2,
      empoweredTechniques: 1,
      weapons: 2,
      armor: 1,
      shields: 1,
      creatures: 4,
      enhanced: 5,
    });
  });

  it('returns enhanced 0 when the official tables omit that collection', async () => {
    const counts = await fetchLibraryTabCounts(
      createMockClient({
        counts: {
          official_powers: 10,
          official_techniques: 8,
          official_empowered_techniques: 1,
          official_creatures: 6,
        },
        itemTypes: ['weapon'],
      }),
      OFFICIAL_LIBRARY_COUNT_TABLES,
    );

    expect(counts.enhanced).toBe(0);
    expect(counts.powers).toBe(10);
    expect(counts.weapons).toBe(1);
  });

  it('treats a missing table as zero', async () => {
    const counts = await fetchLibraryTabCounts(
      createMockClient({
        counts: {},
        errors: {
          official_powers: { message: 'relation does not exist', code: '42P01' },
        },
      }),
      OFFICIAL_LIBRARY_COUNT_TABLES,
    );
    expect(counts.powers).toBe(0);
  });
});
