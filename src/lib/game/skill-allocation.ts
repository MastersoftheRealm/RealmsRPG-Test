/**
 * Skill Allocation Utilities
 * ===========================
 * Centralized logic for skill point costs, caps, and defense allocation.
 * Characters: 3 pts/level. Creatures: 5 at L1, 3 per level after.
 * Species skills: 2 permanent, always proficient, can't be removed.
 */

import type { DefenseSkills } from '@/types';

// =============================================================================
// Constants
// =============================================================================

export const SKILL_VALUE_CAP = 3;
export const BASE_SKILL_PAST_CAP_COST = 3;
export const SUB_SKILL_PAST_CAP_COST = 2;
export const DEFENSE_INCREASE_COST = 2;

/** Skill points per level for characters (simple: 3 * level) */
export const CHARACTER_SKILL_POINTS_PER_LEVEL = 3;

/** Creature skill points: 5 at level 1, +3 per additional level */
export const CREATURE_SKILL_POINTS = {
  base: 5,
  perLevel: 3,
} as const;

/**
 * @deprecated Use CHARACTER_SKILL_POINTS_PER_LEVEL and CREATURE_SKILL_POINTS instead.
 */
export const SKILL_POINTS_PER_LEVEL = {
  character: 3,
  creature: 3, // corrected: creatures get 5 at L1 + 3/level (use getTotalSkillPoints)
} as const;

/** Species grants 2 permanent skills (don't cost points) */
export const SPECIES_SKILL_COUNT = 2;

// =============================================================================
// Point Calculation
// =============================================================================

/**
 * Get total skill points for an entity at a given level.
 * Characters: 3 * level. Creatures: 5 + 3 * (level - 1).
 */
export function getTotalSkillPoints(
  level: number,
  entityType: 'character' | 'creature'
): number {
  const parsedLevel = Math.max(1, Math.floor(level));
  if (entityType === 'creature') {
    return CREATURE_SKILL_POINTS.base + CREATURE_SKILL_POINTS.perLevel * (parsedLevel - 1);
  }
  return CHARACTER_SKILL_POINTS_PER_LEVEL * parsedLevel;
}

/**
 * Cost to increase skill value by 1.
 * - Base skill: 1 pt for 0->1 (proficiency), 1 pt for 1->2, 2->3. Past cap: 3 pts each.
 * - Sub-skill: 1 pt for 0->1 (proficiency + 1 value), 1 pt for 1->2, 2->3. Past cap: 2 pts each.
 */
export function getSkillValueIncreaseCost(
  currentValue: number,
  isSubSkill: boolean
): number {
  if (currentValue < SKILL_VALUE_CAP) return 1;
  return isSubSkill ? SUB_SKILL_PAST_CAP_COST : BASE_SKILL_PAST_CAP_COST;
}

/**
 * Cost to gain proficiency in a skill.
 * Base skill: 1 pt. Sub-skill: 1 pt (and grants +1 skill value).
 */
export function getProficiencyCost(_isSubSkill: boolean): number {
  return 1;
}

/**
 * Cost to decrease skill value by 1.
 * Decreasing from 1 to 0 for a proficient skill = remove proficiency (refunds 1 pt).
 */
export function getSkillValueDecreaseRefund(
  currentValue: number,
  isSubSkill: boolean
): number {
  if (currentValue <= 1) return 1; // Removing proficiency
  return 1; // Decreasing value
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Can we increase this skill's value?
 * - Must be proficient (or we spend point on proficiency first)
 * - Must have enough points
 */
export function canIncreaseSkillValue(
  currentValue: number,
  isProficient: boolean,
  isSubSkill: boolean,
  baseSkillProficient: boolean,
  availablePoints: number,
  isSpeciesSkill: boolean
): boolean {
  if (isSpeciesSkill) {
    return availablePoints >= getSkillValueIncreaseCost(currentValue, isSubSkill);
  }
  if (!isProficient) {
    // First point goes to proficiency
    if (isSubSkill && !baseSkillProficient) return false;
    return availablePoints >= 1;
  }
  return availablePoints >= getSkillValueIncreaseCost(currentValue, isSubSkill);
}

/**
 * Can we decrease this skill's value?
 * - Species skills: can decrease value but not below 0 (0 = unproficient, which species can't do)
 */
export function canDecreaseSkillValue(
  currentValue: number,
  isSpeciesSkill: boolean
): boolean {
  if (currentValue <= 0) return false;
  if (isSpeciesSkill) return currentValue > 1; // Can't go to 0 (would lose proficiency)
  return true;
}

/**
 * Can we increase a defense bonus?
 * - Costs 2 skill points
 * - Defense bonus from skill points cannot exceed level
 */
export function canIncreaseDefense(
  currentDefenseBonus: number,
  level: number,
  abilityBonus: number,
  availablePoints: number
): boolean {
  const totalBonus = currentDefenseBonus + abilityBonus;
  if (totalBonus >= level) return false;
  return availablePoints >= DEFENSE_INCREASE_COST;
}

// =============================================================================
// Spent Points Calculation
// =============================================================================

/**
 * Calculate skill points spent on skills (excluding species skills).
 * Species skills count their value increases but not the initial proficiency.
 */
export function calculateSkillPointsSpent(
  allocations: Record<string, number>,
  defenseSkills: DefenseSkills,
  speciesSkillIds: Set<string>,
  skillData: {
    id: string;
    isSubSkill: boolean;
    baseSkillId?: string;
  }[],
  getBaseSkillValue: (baseSkillId: string) => number
): number {
  let spent = 0;

  for (const skill of skillData) {
    const value = allocations[skill.id] ?? 0;
    if (value <= 0) continue;

    const isSpecies = speciesSkillIds.has(skill.id);
    if (isSpecies) {
      // Species: only pay for value above 1 (proficiency is free)
      spent += Math.max(0, value - 1);
      continue;
    }

    // Non-species: pay for proficiency (1) + value
    if (skill.isSubSkill) {
      // Sub-skill: 1 pt for proficiency+1 value, then 1 pt per value up to cap, 2 pt past cap
      const effectiveValue = value;
      if (effectiveValue >= 1) {
        spent += 1; // Proficiency + first value
        for (let v = 2; v <= effectiveValue; v++) {
          spent += getSkillValueIncreaseCost(v - 1, true);
        }
      }
    } else {
      // Base skill: 1 pt for proficiency, then 1 pt per value
      spent += 1; // Proficiency
      for (let v = 1; v < value; v++) {
        spent += getSkillValueIncreaseCost(v, false);
      }
    }
  }

  // Defense increases: 2 pts each
  const defenseTotal = Object.values(defenseSkills || {}).reduce((a, b) => a + b, 0);
  spent += defenseTotal * DEFENSE_INCREASE_COST;

  return spent;
}

/**
 * Simplified spent calculation for creator.
 * Skills: species pay (value-1), others pay 1 for prof + sum of value increases.
 * Defense: 2 pts per +1 to defense bonus.
 */
export function calculateSimpleSkillPointsSpent(
  allocations: Record<string, number>,
  speciesSkillIds: Set<string>,
  skillMeta: Map<string, { isSubSkill: boolean }>,
  defenseSkills?: DefenseSkills
): number {
  let spent = 0;
  for (const [skillId, value] of Object.entries(allocations)) {
    if (value < 0) continue;
    const meta = skillMeta.get(skillId) || { isSubSkill: false };
    const isSpecies = speciesSkillIds.has(skillId);

    if (isSpecies) {
      spent += Math.max(0, value - 1);
    } else if (meta.isSubSkill) {
      spent += 1; // proficiency (value 0 or 1+)
      for (let v = 2; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, true);
      }
    } else {
      // Base skill: 1 pt proficiency + 1 pt per value (value 0 = proficient only)
      spent += 1; // proficiency
      for (let v = 1; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, false);
      }
    }
  }
  if (defenseSkills) {
    const defenseTotal = Object.values(defenseSkills).reduce((a, b) => a + b, 0);
    spent += defenseTotal * DEFENSE_INCREASE_COST;
  }
  return spent;
}
