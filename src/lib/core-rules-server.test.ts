import { beforeEach, describe, expect, it } from 'vitest';
import { fetchCoreRules, resetCoreRulesCacheForTests } from './core-rules-server';

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
  beforeEach(() => {
    resetCoreRulesCacheForTests();
  });

  it('memoizes the core_rules read for the process', async () => {
    let selectCalls = 0;
    const client = {
      from: (table: string) => {
        expect(table).toBe('core_rules');
        return {
          select: async (columns: string) => {
            selectCalls += 1;
            expect(columns).toBe('id, data');
            return { data: [{ id: 'PROGRESSION_PLAYER', data: { baseHealth: 8 } }], error: null };
          },
        };
      },
    };
    await fetchCoreRules(client as never);
    await fetchCoreRules(client as never);
    expect(selectCalls).toBe(1);
  });

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
