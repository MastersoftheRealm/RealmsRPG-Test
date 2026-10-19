import { ABILITY_LIMITS } from '@/lib/game/constants';
import type { CoreRulesMap } from '@/types/core-rules';

/** Creature ability min/max; max follows stored core_rules, min is code-only until a DB field exists. */
export function getCreatureAbilityBounds(rules?: Partial<CoreRulesMap>): {
  min: number;
  max: number;
} {
  return {
    min: ABILITY_LIMITS.MIN_ABSOLUTE_CREATURE,
    max: rules?.ABILITY_RULES?.maxAbsoluteCreature ?? ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE,
  };
}
