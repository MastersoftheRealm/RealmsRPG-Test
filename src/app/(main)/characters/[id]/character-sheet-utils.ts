/**
 * Character Sheet - Utility Functions
 * Delegates to the centralized calculations in @/lib/game/calculations.
 */

import type { Character } from '@/types';
import { calculateAllStats, type AllDerivedStats } from '@/lib/game/calculations';

export type CharacterSheetStats = AllDerivedStats;

export function calculateStats(character: Character): CharacterSheetStats {
  return calculateAllStats(character);
}
