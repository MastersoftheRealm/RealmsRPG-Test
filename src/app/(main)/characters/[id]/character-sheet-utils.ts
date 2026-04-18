/**
 * Character Sheet - Utility Functions
 * Delegates to the centralized calculations in @/lib/game/calculations.
 */

import type { Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { calculateAllStats, type AllDerivedStats } from '@/lib/game/calculations';

export type CharacterSheetStats = AllDerivedStats;

export function calculateStats(character: Character, rules?: Partial<CoreRulesMap>): CharacterSheetStats {
  return calculateAllStats(character, rules);
}
