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

  it('returns empty and does not memoize a failed read (86e3rb7ca)', async () => {
    let selectCalls = 0;
    const client = {
      from: (table: string) => {
        expect(table).toBe('core_rules');
        return {
          select: async () => {
            selectCalls += 1;
            return { data: null, error: { message: 'permission denied', code: '42501' } };
          },
        };
      },
    };
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    expect(selectCalls).toBe(2);
  });

  it('returns empty and does not memoize a confirmed missing table (86e3rb7ca)', async () => {
    let selectCalls = 0;
    const client = {
      from: (table: string) => {
        expect(table).toBe('core_rules');
        return {
          select: async () => {
            selectCalls += 1;
            return {
              data: null,
              error: { message: 'relation "core_rules" does not exist', code: '42P01' },
            };
          },
        };
      },
    };
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    expect(selectCalls).toBe(2);
  });

  it('does not memoize an empty core_rules payload', async () => {
    let selectCalls = 0;
    const client = {
      from: (table: string) => {
        expect(table).toBe('core_rules');
        return {
          select: async () => {
            selectCalls += 1;
            return { data: [], error: null };
          },
        };
      },
    };
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    await expect(fetchCoreRules(client as never)).resolves.toEqual({});
    expect(selectCalls).toBe(2);
  });
});
