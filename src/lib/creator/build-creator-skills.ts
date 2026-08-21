/**
 * Shared creator skill-save rows (Guided + Advanced).
 * Builds array rows before cleanForSave so proficient-only skill_val 0 is kept
 * (Record→array in cleanForSave drops val <= 0).
 */

import type { Abilities } from '@/types';
import { getHighestLinkedAbilityKey, getLinkedAbilityKeys } from '@/lib/game/formulas';

export interface CreatorSkillCodexEntry {
  id: string | number;
  name?: string | undefined;
  category?: string | undefined;
  ability?: string | undefined;
  base_skill_id?: string | number | null | undefined;
}

export interface CreatorSkillSaveRow {
  id: string;
  name: string;
  category: string;
  skill_val: number;
  prof: boolean;
  ability?: string | undefined;
  /** Display name of base skill when includeBaseSkillName is set (Advanced parity). */
  baseSkill?: string | undefined;
}

export interface BuildCreatorSkillSaveRowsOptions {
  /** Species-granted skill ids (id "0" = Any / ignored). */
  speciesSkillIds?: string[] | undefined;
  codexSkills?: CreatorSkillCodexEntry[] | undefined;
  /** When true, attach baseSkill display name from codex base_skill_id. */
  includeBaseSkillName?: boolean | undefined;
  /**
   * Character abilities. Required for multi-ability skills: the Skill Bonus uses the
   * highest linked Ability (GAME_RULES "Skill Bonus Formulas"), so persisting the first
   * codex ability instead makes the sheet disagree with the creator.
   */
  abilities?: Partial<Abilities> | undefined;
  /** Explicit per-skill Ability choice (skill id → ability key), e.g. `draft.skillAbilities`. */
  skillAbilities?: Record<string, string | undefined> | undefined;
}

/** Ability persisted for a skill row: explicit choice, else highest linked, else first listed. */
function resolveSkillAbility(
  skillKey: string,
  codexAbility: string | undefined,
  options: BuildCreatorSkillSaveRowsOptions,
): string | undefined {
  const linkedKeys = getLinkedAbilityKeys(codexAbility);
  if (linkedKeys.length === 0) return undefined;

  const chosen = options.skillAbilities?.[skillKey]?.trim().toLowerCase();
  if (chosen && linkedKeys.includes(chosen as keyof Abilities)) return chosen;

  if (options.abilities) {
    const highest = getHighestLinkedAbilityKey(codexAbility, options.abilities as Abilities);
    if (highest) return highest;
  }

  return linkedKeys[0];
}

function resolveCodexSkill(
  skillKey: string,
  codexSkills: CreatorSkillCodexEntry[],
): CreatorSkillCodexEntry | undefined {
  return (
    codexSkills.find((s) => String(s.id) === skillKey) ??
    codexSkills.find((s) => s.name === skillKey)
  );
}

/**
 * Build lean skill rows for character create/save from a points record.
 * Includes proficient-only entries (skill_val 0) and optional species skill ids.
 */
export function buildCreatorSkillSaveRows(
  skills: Record<string, number>,
  options: BuildCreatorSkillSaveRowsOptions = {},
): CreatorSkillSaveRow[] {
  const { speciesSkillIds = [], codexSkills = [], includeBaseSkillName = false } = options;

  const ids = new Set<string>();
  speciesSkillIds.forEach((id) => {
    if (id !== '0') ids.add(String(id));
  });
  Object.entries(skills).forEach(([id, points]) => {
    if (typeof points === 'number' && points >= 0) ids.add(String(id));
  });

  return Array.from(ids).map((skillKey) => {
    const skillData = resolveCodexSkill(skillKey, codexSkills);
    const skillVal = skills[skillKey] ?? 0;
    const ability = resolveSkillAbility(skillKey, skillData?.ability, options);
    const category = skillData?.category || skillData?.ability?.split(',')[0]?.trim() || 'other';

    let baseSkill: string | undefined;
    if (
      includeBaseSkillName &&
      skillData?.base_skill_id !== undefined &&
      skillData.base_skill_id !== null
    ) {
      const base = codexSkills.find((s) => String(s.id) === String(skillData.base_skill_id));
      if (base?.name) baseSkill = base.name;
    }

    if (skillData) {
      return {
        id: String(skillData.id),
        name: skillData.name ?? skillKey,
        category,
        skill_val: skillVal,
        prof: true,
        ...(ability ? { ability } : {}),
        ...(baseSkill ? { baseSkill } : {}),
      };
    }

    return {
      id: skillKey,
      name: skillKey,
      category: 'other',
      skill_val: skillVal,
      prof: true,
    };
  });
}
