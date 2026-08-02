import { describe, expect, it } from 'vitest';
import { calculateCreatureFeatPoints } from './formulas';
import { CREATURE_CONSTANTS } from './constants';
import type { CoreRulesMap } from '@/types/core-rules';

type CreatureFeatRules = Pick<CoreRulesMap, 'PROGRESSION_CREATURE'>;

describe('calculateCreatureFeatPoints', () => {
  it('uses CREATURE_CONSTANTS fallback when rules are missing', () => {
    expect(calculateCreatureFeatPoints(1, 0)).toBe(CREATURE_CONSTANTS.BASE_FEAT_POINTS);
    expect(calculateCreatureFeatPoints(3, 0)).toBe(
      CREATURE_CONSTANTS.BASE_FEAT_POINTS + 2 * CREATURE_CONSTANTS.FEAT_POINTS_PER_LEVEL,
    );
  });

  it('adds martial proficiency to the level-1 base', () => {
    expect(calculateCreatureFeatPoints(1, 2)).toBe(CREATURE_CONSTANTS.BASE_FEAT_POINTS + 2);
    expect(calculateCreatureFeatPoints(4, 1)).toBe(
      CREATURE_CONSTANTS.BASE_FEAT_POINTS + 1 + 3 * CREATURE_CONSTANTS.FEAT_POINTS_PER_LEVEL,
    );
  });

  it('reads featPointsPerLevel from admin PROGRESSION_CREATURE rules', () => {
    const rules: CreatureFeatRules = {
      PROGRESSION_CREATURE: {
        baseFeatPoints: 4,
        featPointsPerLevel: 2,
      } as CoreRulesMap['PROGRESSION_CREATURE'],
    };

    expect(calculateCreatureFeatPoints(1, 0, rules)).toBe(4);
    expect(calculateCreatureFeatPoints(3, 0, rules)).toBe(8);
    expect(calculateCreatureFeatPoints(3, 1, rules)).toBe(9);
  });

  it('scales sub-1 levels proportionally from the level-1 base', () => {
    expect(calculateCreatureFeatPoints(0.5, 0)).toBe(2);
    expect(calculateCreatureFeatPoints(0.25, 2)).toBe(2);
  });
});
