/**
 * Character-derived caps for Library power/technique filters (TASK-676).
 * TP remaining matches sheet Proficiencies tab (owned proficiency TP + Unarmed Prowess).
 */

import type { Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { calculateAllStats, getArchetypeAbilityScore } from '@/lib/game/calculations';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { computeUnarmedProwessTpCost } from '@/lib/game/unarmed-prowess';
import {
  calculateProficiencyTP,
  dedupeHighestProficiencies,
  filterZeroCostProficiencies,
  getTrainingPointLimit,
} from '@/lib/proficiencies';

export interface PowerTechniqueCharacterContext {
  maxEnergy: number;
  innateThreshold: number;
  tpTotal: number;
  tpSpent: number;
  tpRemaining: number;
}

type Rules = Partial<CoreRulesMap>;

/**
 * Derive energy / innate / Training Points caps from a loaded character.
 */
export function derivePowerTechniqueCharacterContext(
  character: Character,
  rules?: Rules,
): PowerTechniqueCharacterContext {
  const stats = calculateAllStats(character, rules);
  const progression = calculateArchetypeProgression(
    character.level || 1,
    character.mart_prof || 0,
    character.pow_prof || 0,
    character.archetypeChoices || {},
    rules,
  );
  const highestAbility = getArchetypeAbilityScore(character);
  const tpTotal = getTrainingPointLimit(character.level || 1, highestAbility, rules);
  const owned = filterZeroCostProficiencies(
    dedupeHighestProficiencies(character.proficiencies || []),
  );
  const proficiencySpent = owned.reduce((sum, p) => sum + calculateProficiencyTP(p), 0);
  const unarmedSpent = computeUnarmedProwessTpCost(character.unarmedProwess || 0);
  const tpSpent = proficiencySpent + unarmedSpent;

  return {
    maxEnergy: Math.max(0, Math.round(stats.maxEnergy)),
    innateThreshold: Math.max(0, Math.round(progression.innateThreshold)),
    tpTotal,
    tpSpent,
    tpRemaining: Math.max(0, tpTotal - tpSpent),
  };
}
