import { ABILITY_LIMITS } from '@/lib/game/constants';
import type { CoreRulesMap } from '@/types/core-rules';

/**
 * Creature ability min/max for the creator UI.
 * Min and max are code-authoritative (+10 / −4) until stored core_rules are aligned
 * (stale DB values must not cap the editor below +10).
 */
export function getCreatureAbilityBounds(rules?: Partial<CoreRulesMap>): {
  min: number;
  max: number;
} {
  // mergeCoreRules can supply a stale maxAbsoluteCreature (e.g. 7); code constant wins until DB aligns.
  void rules?.ABILITY_RULES?.maxAbsoluteCreature;
  return {
    min: ABILITY_LIMITS.MIN_ABSOLUTE_CREATURE,
    max: ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE,
  };
}
