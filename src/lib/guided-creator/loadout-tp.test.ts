import { describe, expect, it } from 'vitest';
import {
  combineGuidedTpBudgets,
  wouldExceedSharedTp,
} from '@/lib/guided-creator/loadout-tp';

describe('loadout-tp shared budgets', () => {
  it('combines equipment and combat Training Points against one limit', () => {
    expect(combineGuidedTpBudgets({ spent: 10, limit: 30, remaining: 20 }, 5)).toEqual({
      spent: 15,
      limit: 30,
      remaining: 15,
    });
  });

  it('blocks adds that would exceed remaining Training Points', () => {
    expect(wouldExceedSharedTp(28, 30, 3)).toBe(true);
    expect(wouldExceedSharedTp(28, 30, 2)).toBe(false);
    expect(wouldExceedSharedTp(28, 30, 5, { alreadySelected: true })).toBe(false);
  });
});
