/**
 * Skill Allocation Utilities
 * ===========================
 * Centralized logic for skill point costs, caps, and defense allocation.
 * Characters: 3 pts/level. Creatures: 5 at L1, 3 per level after.
 * Species skills: 2 permanent, always proficient, can't be removed.
 *
 * Soft cap and past-cap costs are read from core rules (SKILLS_AND_DEFENSES)
 * when provided; defaults match vanilla (cap 3, base past-cap 3, sub past-cap 2).
 */

import type { DefenseSkills } from '@/types';
import type { Item } from '@/types/equipment';
import type { CoreRulesMap, SkillsAndDefensesRules } from '@/types/core-rules';

// =============================================================================
// Constants (defaults — match SKILLS_AND_DEFENSES seed / Supabase core_rules)
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

/** Match species skill refs (codex id or name) to skill row ids on the character sheet. */
export function buildSpeciesSkillIdSet(
  speciesSkillRefs: string[],
  skills: Array<{ id?: string; name?: string }>
): Set<string> {
  const set = new Set<string>();
  for (const ref of speciesSkillRefs.filter((id) => id !== '0')) {
    const refLower = String(ref).toLowerCase();
    set.add(String(ref));
    for (const skill of skills) {
      const id = String(skill.id ?? '');
      const name = String(skill.name ?? '').toLowerCase();
      if (id.toLowerCase() === refLower || name === refLower) {
        if (id) set.add(id);
      }
    }
  }
  return set;
}

/** Merge equipment rows; stacks quantity when id or name (case-insensitive) matches. */
export function mergeEquipmentIntoInventory(existing: Item[], incoming: Item[]): Item[] {
  const next = [...existing];
  for (const item of incoming) {
    const nameKey = String(item.name ?? '').trim().toLowerCase();
    const idx = next.findIndex(
      (e) =>
        String(e.id) === String(item.id) ||
        (nameKey &&
          String(e.name ?? '')
            .trim()
            .toLowerCase() === nameKey)
    );
    if (idx >= 0) {
      const addQty = item.quantity ?? 1;
      next[idx] = {
        ...next[idx],
        ...item,
        quantity: (next[idx].quantity ?? 1) + addQty,
      };
    } else {
      next.push({ ...item, quantity: item.quantity ?? 1 });
    }
  }
  return next;
}

// =============================================================================
// Core rules resolution
// =============================================================================

export type SkillAllocationRules = Pick<
  SkillsAndDefensesRules,
  'maxSkillValue' | 'baseSkillPastCapCost' | 'subSkillPastCapCost' | 'defenseIncreaseCost' | 'gainProficiencyCost'
>;

export const DEFAULT_SKILL_ALLOCATION_RULES: SkillAllocationRules = {
  maxSkillValue: SKILL_VALUE_CAP,
  baseSkillPastCapCost: BASE_SKILL_PAST_CAP_COST,
  subSkillPastCapCost: SUB_SKILL_PAST_CAP_COST,
  defenseIncreaseCost: DEFENSE_INCREASE_COST,
  gainProficiencyCost: 1,
};

/** Resolve skill allocation costs from core rules (DB-backed via useGameRules). */
export function resolveSkillAllocationRules(rules?: Partial<CoreRulesMap>): SkillAllocationRules {
  const sd = rules?.SKILLS_AND_DEFENSES;
  if (!sd) return DEFAULT_SKILL_ALLOCATION_RULES;
  return {
    maxSkillValue: sd.maxSkillValue ?? DEFAULT_SKILL_ALLOCATION_RULES.maxSkillValue,
    baseSkillPastCapCost: sd.baseSkillPastCapCost ?? DEFAULT_SKILL_ALLOCATION_RULES.baseSkillPastCapCost,
    subSkillPastCapCost: sd.subSkillPastCapCost ?? DEFAULT_SKILL_ALLOCATION_RULES.subSkillPastCapCost,
    defenseIncreaseCost: sd.defenseIncreaseCost ?? DEFAULT_SKILL_ALLOCATION_RULES.defenseIncreaseCost,
    gainProficiencyCost: sd.gainProficiencyCost ?? DEFAULT_SKILL_ALLOCATION_RULES.gainProficiencyCost,
  };
}

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
 * - Base skill: 1 pt per +1 up to soft cap; past cap uses baseSkillPastCapCost.
 * - Sub-skill: 1 pt per +1 up to soft cap; past cap uses subSkillPastCapCost.
 */
export function getSkillValueIncreaseCost(
  currentValue: number,
  isSubSkill: boolean,
  skillRules?: SkillAllocationRules
): number {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  if (currentValue < r.maxSkillValue) return 1;
  return isSubSkill ? r.subSkillPastCapCost : r.baseSkillPastCapCost;
}

/**
 * Cost to gain proficiency in a skill.
 * Base skill: 1 pt. Sub-skill: 1 pt (and grants +1 skill value).
 */
export function getProficiencyCost(skillRules?: SkillAllocationRules): number {
  return (skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES).gainProficiencyCost;
}

/**
 * Cost to decrease skill value by 1.
 * Decreasing from 1 to 0 for a proficient skill = remove proficiency (refunds 1 pt).
 */
export function getSkillValueDecreaseRefund(currentValue: number): number {
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
  isSpeciesSkill: boolean,
  skillRules?: SkillAllocationRules
): boolean {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  if (isSpeciesSkill) {
    return availablePoints >= getSkillValueIncreaseCost(currentValue, isSubSkill, r);
  }
  if (!isProficient) {
    if (isSubSkill && !baseSkillProficient) return false;
    return availablePoints >= r.gainProficiencyCost;
  }
  return availablePoints >= getSkillValueIncreaseCost(currentValue, isSubSkill, r);
}

/**
 * Can we decrease this skill's value?
 * - Species skills: can decrease value but not below 0 (0 = proficient with 0 value)
 */
export function canDecreaseSkillValue(
  currentValue: number,
  isSpeciesSkill: boolean
): boolean {
  if (currentValue <= 0) return false;
  if (isSpeciesSkill) return currentValue > 0; // Can decrease to 0 (proficient, value 0)
  return true;
}

/**
 * Can we increase a defense bonus?
 * - Costs defenseIncreaseCost skill points
 * - Defense bonus from skill points cannot exceed level
 */
export function canIncreaseDefense(
  currentDefenseBonus: number,
  level: number,
  abilityBonus: number,
  availablePoints: number,
  skillRules?: SkillAllocationRules
): boolean {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  const totalBonus = currentDefenseBonus + abilityBonus;
  if (totalBonus >= level) return false;
  return availablePoints >= r.defenseIncreaseCost;
}

// =============================================================================
// Spent Points Calculation
// =============================================================================

type CharacterSheetSkillRow = {
  id?: string;
  skill_val?: number;
  prof?: boolean;
  baseSkill?: string;
  baseSkillId?: number;
  selectedBaseSkillId?: string;
};

/**
 * Map character sheet skill rows to creator-style allocations for spent calculation.
 */
export function characterSkillsToAllocations(
  skills: CharacterSheetSkillRow[]
): {
  allocations: Record<string, number>;
  skillMeta: Map<string, { isSubSkill: boolean }>;
} {
  const allocations: Record<string, number> = {};
  const skillMeta = new Map<string, { isSubSkill: boolean }>();

  for (const skill of skills) {
    const id = String(skill.id ?? '');
    if (!id) continue;
    const isSubSkill =
      Boolean(skill.baseSkill) ||
      skill.baseSkillId != null ||
      skill.selectedBaseSkillId != null;
    skillMeta.set(id, { isSubSkill });
    if (!skill.prof) continue;
    const val = skill.skill_val ?? 0;
    if (val < 0) continue;
    allocations[id] = val;
  }

  return { allocations, skillMeta };
}

/**
 * Calculate skill points spent for character sheet skills + defense bonuses.
 */
export function calculateCharacterSkillPointsSpent(
  skills: CharacterSheetSkillRow[],
  speciesSkillIds: Set<string>,
  defenseSkills?: DefenseSkills,
  rules?: Partial<CoreRulesMap>
): number {
  const skillRules = resolveSkillAllocationRules(rules);
  const { allocations, skillMeta } = characterSkillsToAllocations(skills);
  return calculateSimpleSkillPointsSpent(
    allocations,
    speciesSkillIds,
    skillMeta,
    defenseSkills,
    skillRules
  );
}

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
  skillRules?: SkillAllocationRules
): number {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  let spent = 0;

  for (const skill of skillData) {
    const value = allocations[skill.id] ?? 0;
    if (value <= 0) continue;

    const isSpecies = speciesSkillIds.has(skill.id);
    if (isSpecies) {
      for (let v = 1; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, skill.isSubSkill, r);
      }
      continue;
    }

    if (skill.isSubSkill) {
      const effectiveValue = value;
      if (effectiveValue >= 1) {
        spent += r.gainProficiencyCost;
        for (let v = 2; v <= effectiveValue; v++) {
          spent += getSkillValueIncreaseCost(v - 1, true, r);
        }
      }
    } else {
      spent += r.gainProficiencyCost;
      for (let v = 1; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, false, r);
      }
    }
  }

  const defenseTotal = Object.values(defenseSkills || {}).reduce((a, b) => a + b, 0);
  spent += defenseTotal * r.defenseIncreaseCost;

  return spent;
}

/**
 * Simplified spent calculation for creator.
 * Skills: species pay (value-1), others pay 1 for prof + sum of value increases.
 * Defense: defenseIncreaseCost pts per +1 to defense bonus.
 */
export function calculateSimpleSkillPointsSpent(
  allocations: Record<string, number>,
  speciesSkillIds: Set<string>,
  skillMeta: Map<string, { isSubSkill: boolean }>,
  defenseSkills?: DefenseSkills,
  skillRules?: SkillAllocationRules
): number {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  let spent = 0;
  for (const [skillId, value] of Object.entries(allocations)) {
    if (value < 0) continue;
    const meta = skillMeta.get(skillId) || { isSubSkill: false };
    const isSpecies = speciesSkillIds.has(skillId);

    if (isSpecies) {
      for (let v = 1; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, meta.isSubSkill, r);
      }
    } else if (meta.isSubSkill) {
      spent += r.gainProficiencyCost;
      for (let v = 2; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, true, r);
      }
    } else {
      spent += r.gainProficiencyCost;
      for (let v = 1; v <= value; v++) {
        spent += getSkillValueIncreaseCost(v - 1, false, r);
      }
    }
  }
  if (defenseSkills) {
    const defenseTotal = Object.values(defenseSkills).reduce((a, b) => a + b, 0);
    spent += defenseTotal * r.defenseIncreaseCost;
  }
  return spent;
}
