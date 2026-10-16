/**
 * Character sheet — reset ability / skill point allocations (86e3jvcge).
 * Does not touch temp modifiers, Health/Energy pool bonuses, or loadout.
 */

import { withCurrentFollowingMaxDrop } from '@/lib/character/current-follows-max';
import { buildSpeciesSkillIdSet } from '@/lib/game/skill-allocation';
import {
  DEFAULT_ABILITIES,
  DEFAULT_DEFENSE_SKILLS,
  type Character,
  type CharacterSkillRow,
} from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';

type Rules = Partial<CoreRulesMap> | undefined;

function isSubSkillRow(skill: CharacterSkillRow): boolean {
  return Boolean(skill.baseSkill || skill.baseSkillId != null || skill.selectedBaseSkillId);
}

/** Zero ability scores and defense skill bonuses; sync current HP/EN when max drops. */
export function applySheetAbilityAllocationReset(prev: Character, rules?: Rules): Character {
  const next: Character = {
    ...prev,
    abilities: { ...DEFAULT_ABILITIES },
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
  };
  return withCurrentFollowingMaxDrop(prev, next, rules);
}

/**
 * Clear skill training on the sheet. Species-granted skills stay proficient at 0 training.
 * Non-species sub-skills are removed; other skills become unproficient with 0 training.
 */
export function resetSheetSkillAllocationRows(
  skills: CharacterSkillRow[],
  speciesSkillRefs: string[],
): CharacterSkillRow[] {
  const speciesSkillIdSet = buildSpeciesSkillIdSet(
    speciesSkillRefs.filter((id) => id !== '0'),
    skills.map((s) => ({ id: String(s.id ?? ''), name: s.name })),
  );

  const next: CharacterSkillRow[] = [];
  for (const skill of skills) {
    const id = String(skill.id ?? '');
    const isSpecies = speciesSkillIdSet.has(id);
    const isSubSkill = isSubSkillRow(skill);

    if (isSpecies) {
      next.push({ ...skill, prof: true, skill_val: 0 });
      continue;
    }
    if (isSubSkill) {
      continue;
    }
    if (skill.prof || (skill.skill_val ?? 0) > 0) {
      next.push({ ...skill, prof: false, skill_val: 0 });
    }
  }
  return next;
}

export function applySheetSkillAllocationReset(
  prev: Character,
  speciesSkillRefs: string[],
): Character {
  const current = Array.isArray(prev.skills) ? prev.skills : [];
  const nextSkills = resetSheetSkillAllocationRows(current, speciesSkillRefs);
  return { ...prev, skills: nextSkills };
}
