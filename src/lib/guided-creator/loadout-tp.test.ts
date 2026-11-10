import { describe, expect, it } from 'vitest';
import {
  combineGuidedTpBudgets,
  guidedLoadoutTrainingPointsOverspendMessage,
  guidedTrainingPointsOverspendAmount,
  guidedTrainingPointsPointStatusInputs,
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

  it('warns when Training Points spent exceed the guided pool without changing math', () => {
    expect(guidedTrainingPointsOverspendAmount(25, 25)).toBe(0);
    expect(guidedTrainingPointsOverspendAmount(24, 25)).toBe(0);
    expect(guidedTrainingPointsOverspendAmount(27, 25)).toBe(2);
    expect(guidedTrainingPointsOverspendAmount(35, 25)).toBe(10);

    expect(guidedLoadoutTrainingPointsOverspendMessage(25, 25)).toBeNull();
    expect(guidedLoadoutTrainingPointsOverspendMessage(27, 25)).toBe(
      'You are 2 Training Points over budget. You can still continue.',
    );
    expect(guidedLoadoutTrainingPointsOverspendMessage(35, 25)).toBe(
      'You are 10 Training Points over budget. You can still continue.',
    );

    expect(guidedTrainingPointsPointStatusInputs(27, 25)).toEqual({
      total: 25,
      spent: 27,
      remaining: -2,
    });
  });
});
