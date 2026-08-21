import { describe, expect, it } from 'vitest';
import { fetchCoreRules } from './core-rules-server';

function mockCoreRulesClient(
  rows: { id: string; data: unknown }[] | null,
  error: { message: string } | null = null,
) {
  return {
    from: (table: string) => {
      expect(table).toBe('core_rules');
      return {
        select: async (columns: string) => {
          expect(columns).toBe('id, data');
          return { data: rows, error };
        },
      };
    },
  };
}

describe('fetchCoreRules', () => {
  it('maps each row id to its data payload', async () => {
    const rules = await fetchCoreRules(
      mockCoreRulesClient([{ id: 'PROGRESSION_PLAYER', data: { baseHealth: 8 } }]) as never,
    );
    expect(rules).toEqual({ PROGRESSION_PLAYER: { baseHealth: 8 } });
  });

  it('returns empty when the read fails', async () => {
    await expect(
      fetchCoreRules(mockCoreRulesClient(null, { message: 'permission denied' }) as never),
    ).resolves.toEqual({});
  });
});
