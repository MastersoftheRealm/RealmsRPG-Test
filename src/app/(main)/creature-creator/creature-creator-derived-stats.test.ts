import { describe, expect, it } from 'vitest';
import {
  calculateCreatureCreatorStats,
  isCreatureOverBudget,
} from './creature-creator-derived-stats';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';

describe('calculateCreatureCreatorStats', () => {
  const featPointsMap = new Map<string, number>([
    [String(CREATURE_FEAT_IDS.RESISTANCE), 1],
    [String(CREATURE_FEAT_IDS.IMMUNITY), 2],
    [String(CREATURE_FEAT_IDS.WEAKNESS), -1],
    [String(CREATURE_FEAT_IDS.CONDITION_IMMUNITY), 1],
  ]);

  it('returns positive remaining budgets for a fresh level-1 creature', () => {
    const stats = calculateCreatureCreatorStats(initialState, featPointsMap, new Set(), undefined);
    expect(stats.featRemaining).toBeGreaterThanOrEqual(0);
    expect(stats.trainingRemaining).toBeGreaterThanOrEqual(0);
    expect(stats.abilityRemaining).toBeGreaterThanOrEqual(0);
    expect(isCreatureOverBudget(stats)).toBe(false);
  });

  it('counts mechanical feat spend from resistances', () => {
    const creature = {
      ...initialState,
      resistances: ['fire'],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.featSpent).toBe(1);
  });

  it('sums currency and TP from kind buckets (TASK-812)', () => {
    const creature = {
      ...initialState,
      weapons: [
        {
          id: 'w1',
          name: 'Axe',
          type: 'weapon',
          tp: 2,
          currency: 10,
          rarity: 'Common',
        },
      ],
      equipment: [
        {
          id: 'e1',
          name: 'Torch',
          type: 'equipment',
          tp: 0,
          currency: 3,
          rarity: 'Common',
          quantity: 2,
        },
      ],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.trainingSpent).toBe(2);
    expect(stats.currencySpent).toBe(16);
  });
});
