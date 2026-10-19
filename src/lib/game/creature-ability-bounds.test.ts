import { describe, expect, it } from 'vitest';
import { ABILITY_LIMITS } from '@/lib/game/constants';
import { getCreatureAbilityBounds } from './creature-ability-bounds';

describe('getCreatureAbilityBounds', () => {
  it('uses stored max and code constant min (-4)', () => {
    expect(getCreatureAbilityBounds()).toEqual({
      min: ABILITY_LIMITS.MIN_ABSOLUTE_CREATURE,
      max: ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE,
    });
    expect(
      getCreatureAbilityBounds({
        ABILITY_RULES: { maxAbsoluteCreature: 10 } as import('@/types/core-rules').AbilityRules,
      }),
    ).toEqual({
      min: -4,
      max: 10,
    });
  });
});
