import { describe, expect, it } from 'vitest';
import { ABILITY_LIMITS } from '@/lib/game/constants';
import { getCreatureAbilityBounds } from './creature-ability-bounds';

describe('getCreatureAbilityBounds', () => {
  it('returns code-authoritative +10 / −4 for the creator', () => {
    expect(getCreatureAbilityBounds()).toEqual({
      min: ABILITY_LIMITS.MIN_ABSOLUTE_CREATURE,
      max: ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE,
    });
  });

  it('ignores stale maxAbsoluteCreature from merged core_rules', () => {
    expect(
      getCreatureAbilityBounds({
        ABILITY_RULES: { maxAbsoluteCreature: 7 } as import('@/types/core-rules').AbilityRules,
      }).max,
    ).toBe(ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE);
  });
});
