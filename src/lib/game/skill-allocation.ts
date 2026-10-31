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
import { calculateSkillPointsForEntity } from './formulas';

// =============================================================================
// Constants (defaults — match SKILLS_AND_DEFENSES seed / Supabase core_rules)
// =============================================================================

export const SKILL_VALUE_CAP = 3;
export const BASE_SKILL_PAST_CAP_COST = 3;
export const SUB_SKILL_PAST_CAP_COST = 2;
export const DEFENSE_INCREASE_COST = 2;

/**
 * Listed skill with value 0 and no proficiency.
 * A base skill stored at 0 is still proficient. This sentinel is not.
 * `calculateSimpleSkillPointsSpent` ignores values below 0, so the row costs nothing.
 */
export const UNPROFICIENT_SKILL_ALLOCATION = -1;

/** Species grants 2 permanent skills (don't cost points) */
export const SPECIES_SKILL_COUNT = 2;

/** Match species skill refs (codex id or name) to skill row ids on the character sheet. */
export function buildSpeciesSkillIdSet(
  speciesSkillRefs: string[],
  skills: Array<{ id?: string | undefined; name?: string | undefined }>,
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
    const nameKey = String(item.name ?? '')
      .trim()
      .toLowerCase();
    const idx = next.findIndex(
      (e) =>
        String(e.id) === String(item.id) ||
        (nameKey &&
          String(e.name ?? '')
            .trim()
            .toLowerCase() === nameKey),
    );
    if (idx >= 0) {
      const existing = next[idx];
      if (existing === undefined) continue;
      const addQty = item.quantity ?? 1;
      next[idx] = {
        ...existing,
        ...item,
        quantity: (existing.quantity ?? 1) + addQty,
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
  | 'maxSkillValue'
  | 'baseSkillPastCapCost'
  | 'subSkillPastCapCost'
  | 'defenseIncreaseCost'
  | 'gainProficiencyCost'
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
    baseSkillPastCapCost:
      sd.baseSkillPastCapCost ?? DEFAULT_SKILL_ALLOCATION_RULES.baseSkillPastCapCost,
    subSkillPastCapCost:
      sd.subSkillPastCapCost ?? DEFAULT_SKILL_ALLOCATION_RULES.subSkillPastCapCost,
    defenseIncreaseCost:
      sd.defenseIncreaseCost ?? DEFAULT_SKILL_ALLOCATION_RULES.defenseIncreaseCost,
    gainProficiencyCost:
      sd.gainProficiencyCost ?? DEFAULT_SKILL_ALLOCATION_RULES.gainProficiencyCost,
  };
}

// =============================================================================
// Point Calculation
// =============================================================================

/**
 * Get total skill points for an entity at a given level.
 * Characters: 3 * level. Creatures: 5 + 3 * (level - 1).
 * Delegates to `calculateSkillPointsForEntity` so there is one implementation.
 */
export function getTotalSkillPoints(
  level: number,
  entityType: 'character' | 'creature',
  rules?: Partial<CoreRulesMap>,
): number {
  return calculateSkillPointsForEntity(level, entityType, rules);
}

/**
 * Cost to increase skill value by 1.
 * - Base skill: 1 pt per +1 up to soft cap; past cap uses baseSkillPastCapCost.
 * - Sub-skill: 1 pt per +1 up to soft cap; past cap uses subSkillPastCapCost.
 */
export function getSkillValueIncreaseCost(
  currentValue: number,
  isSubSkill: boolean,
  skillRules?: SkillAllocationRules,
): number {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  if (currentValue < r.maxSkillValue) return 1;
  return isSubSkill ? r.subSkillPastCapCost : r.baseSkillPastCapCost;
}

/** True when this allocation value is proficient. Species skills always are. */
export function isSkillAllocationProficient(
  value: number | undefined,
  isSubSkill: boolean,
  isSpecies = false,
): boolean {
  if (isSpecies) return true;
  if (value == null || value < 0) return false;
  return isSubSkill ? value >= 1 : true;
}

/** Value shown on a stepper. Unproficient allocations display as 0. */
export function skillAllocationShownValue(value: number | undefined): number {
  if (value == null || value < 0) return 0;
  return value;
}

/**
 * Map a saved skill onto an allocation value.
 * Proficient sub-skills stay at least 1 (proficiency grants that value).
 * Unproficient skills stay listed at {@link UNPROFICIENT_SKILL_ALLOCATION}.
 */
export function allocationValueFromPersistedSkill(
  proficient: boolean,
  value: number,
  isSubSkill: boolean,
): number {
  if (!proficient) return UNPROFICIENT_SKILL_ALLOCATION;
  if (isSubSkill) return Math.max(1, value);
  return value;
}

/** Points charged by the next plus. Proficiency and value steps use the shared cost helpers. */
export function skillAllocationIncreaseCost(
  current: number | undefined,
  isSubSkill: boolean,
  isSpecies: boolean,
  skillRules?: SkillAllocationRules,
): number {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  if (isSpecies) {
    return getSkillValueIncreaseCost(Math.max(0, current ?? 0), isSubSkill, r);
  }
  const value = current ?? UNPROFICIENT_SKILL_ALLOCATION;
  if (isSubSkill) {
    if (value < 1) return r.gainProficiencyCost;
    return getSkillValueIncreaseCost(value, true, r);
  }
  if (value < 0) return r.gainProficiencyCost;
  return getSkillValueIncreaseCost(value, false, r);
}

/** One plus step. Sub-skill proficiency lands on value 1. Base proficiency lands on value 0. */
export function applySkillAllocationIncrease(
  allocations: Record<string, number>,
  skillId: string,
  isSubSkill: boolean,
  isSpecies: boolean,
): Record<string, number> {
  const current = allocations[skillId];
  if (isSubSkill && !isSpecies) {
    const value = current ?? UNPROFICIENT_SKILL_ALLOCATION;
    return { ...allocations, [skillId]: value < 1 ? 1 : value + 1 };
  }
  if (!isSpecies && (current == null || current < 0)) {
    return { ...allocations, [skillId]: 0 };
  }
  const value = current == null || current < 0 ? 0 : current;
  return { ...allocations, [skillId]: value + 1 };
}

type SkillAllocationParent = {
  id: string | number;
  base_skill_id?: number | string | null | undefined;
};

/**
 * One minus step. The exact reverse of plus: value steps refund
 * {@link getSkillValueIncreaseCost} of the step being undone, and leaving
 * proficiency refunds `gainProficiencyCost` (via the spent total).
 *
 * Lowering a base skill from proficient value 0 to unproficient also clears
 * proficiency on its sub-skills, which refunds their proficiency and value points.
 * Species skills stay proficient, including species sub-skills of that base.
 */
export function applySkillAllocationDecrease(
  allocations: Record<string, number>,
  skillId: string,
  options: {
    isSubSkill: boolean;
    isSpecies: boolean;
    codexSkills: readonly SkillAllocationParent[];
    /** Species skills stay proficient. Omitted means none of the rows are species skills. */
    speciesSkillIds?: ReadonlySet<string> | undefined;
  },
): Record<string, number> {
  const current = allocations[skillId];
  if (options.isSpecies) {
    if (current == null || current <= 0) return allocations;
    return { ...allocations, [skillId]: current - 1 };
  }
  if (current == null || current < 0) return allocations;

  if (options.isSubSkill) {
    if (current <= 1) {
      return { ...allocations, [skillId]: UNPROFICIENT_SKILL_ALLOCATION };
    }
    return { ...allocations, [skillId]: current - 1 };
  }

  if (current > 0) {
    return { ...allocations, [skillId]: current - 1 };
  }

  const next: Record<string, number> = {
    ...allocations,
    [skillId]: UNPROFICIENT_SKILL_ALLOCATION,
  };
  for (const skill of options.codexSkills) {
    if (skill.base_skill_id == null || Number(skill.base_skill_id) === 0) continue;
    if (String(skill.base_skill_id) !== skillId) continue;
    const subId = String(skill.id);
    if (options.speciesSkillIds?.has(subId)) continue;
    const subValue = next[subId];
    if (subValue == null || subValue < 0) continue;
    next[subId] = UNPROFICIENT_SKILL_ALLOCATION;
  }
  return next;
}

/**
 * Can we increase a defense bonus?
 * - Costs defenseIncreaseCost skill points
 * - Only the Skill-Point portion of the Defense Bonus is capped at character level;
 *   the ability-derived portion is unrestricted (GAME_RULES "Defense bonus cap").
 *
 * @param currentSkillPointDefense Defense Bonus bought with Skill Points (not including the Ability).
 * @param abilityBonus Accepted for call-site compatibility; deliberately not part of the cap.
 */
export function canIncreaseDefense(
  currentSkillPointDefense: number,
  level: number,
  abilityBonus: number,
  availablePoints: number,
  skillRules?: SkillAllocationRules,
): boolean {
  const r = skillRules ?? DEFAULT_SKILL_ALLOCATION_RULES;
  if (currentSkillPointDefense >= level) return false;
  return availablePoints >= r.defenseIncreaseCost;
}

// =============================================================================
// Spent Points Calculation
// =============================================================================

type CharacterSheetSkillRow = {
  id?: string | undefined;
  skill_val?: number | undefined;
  prof?: boolean | undefined;
  baseSkill?: string | undefined;
  baseSkillId?: number | undefined;
  selectedBaseSkillId?: string | undefined;
};

/**
 * Map character sheet skill rows to creator-style allocations for spent calculation.
 */
function characterSkillsToAllocations(skills: CharacterSheetSkillRow[]): {
  allocations: Record<string, number>;
  skillMeta: Map<string, { isSubSkill: boolean }>;
} {
  const allocations: Record<string, number> = {};
  const skillMeta = new Map<string, { isSubSkill: boolean }>();

  for (const skill of skills) {
    const id = String(skill.id ?? '');
    if (!id) continue;
    const isSubSkill =
      Boolean(skill.baseSkill) || skill.baseSkillId != null || skill.selectedBaseSkillId != null;
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
  rules?: Partial<CoreRulesMap>,
): number {
  const skillRules = resolveSkillAllocationRules(rules);
  const { allocations, skillMeta } = characterSkillsToAllocations(skills);
  return calculateSimpleSkillPointsSpent(
    allocations,
    speciesSkillIds,
    skillMeta,
    defenseSkills,
    skillRules,
  );
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
  skillRules?: SkillAllocationRules,
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
    const defenseTotal = Object.values(defenseSkills).reduce(
      (sum: number, value) => sum + (Number.isFinite(value) ? value : 0),
      0,
    );
    spent += defenseTotal * r.defenseIncreaseCost;
  }
  return spent;
}
