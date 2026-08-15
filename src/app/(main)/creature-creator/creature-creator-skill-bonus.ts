/**
 * Creature Creator — skill bonus calculation (TASK-610)
 */

import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import type { Skill } from '@/hooks';
import type { CreatureSkill } from './creature-creator-types';
import type { CreatureState } from './creature-creator-types';

export function getCreatureSkillBonus(
  skill: CreatureSkill,
  creature: CreatureState,
  skillsData: Skill[],
  subSkillNames: Set<string>,
  skillAbilityMap: Map<string, string>,
): number {
  const codex = skillsData.find(
    (s: Skill) =>
      (skill.id != null && String(s.id) === String(skill.id)) ||
      String(s.name ?? '').toLowerCase() === String(skill.name).toLowerCase(),
  );
  const linked = codex?.ability ?? skillAbilityMap.get(skill.name) ?? '';

  const baseSkillIdRaw =
    skill.baseSkillId ??
    (codex?.base_skill_id != null && Number(codex.base_skill_id) !== 0
      ? codex.base_skill_id
      : undefined);
  const isSubSkill =
    skill.isSubSkill === true ||
    subSkillNames.has(String(skill.name ?? '').toLowerCase()) ||
    (baseSkillIdRaw != null && String(baseSkillIdRaw) !== '' && Number(baseSkillIdRaw) !== 0);

  let parent: CreatureSkill | undefined;
  if (isSubSkill && baseSkillIdRaw != null) {
    const baseDef = skillsData.find((d: Skill) => String(d.id) === String(baseSkillIdRaw));
    parent = baseDef
      ? creature.skills.find(
          (p) =>
            (p.id != null && String(p.id) === String(baseDef.id)) ||
            String(p.name).toLowerCase() === String(baseDef.name ?? '').toLowerCase(),
        )
      : undefined;
  }

  if (isSubSkill) {
    return calculateSubSkillBonusWithProficiency(
      linked,
      skill.value,
      parent?.value ?? 0,
      parent ? parent.proficient : false,
      creature.abilities,
      skill.proficient,
    );
  }
  return calculateSkillBonusWithProficiency(
    linked,
    skill.value,
    creature.abilities,
    skill.proficient,
  );
}

export function buildSkillAbilityMap(skillsData: Skill[]): Map<string, string> {
  const map = new Map<string, string>();
  skillsData.forEach((skill: Skill) => {
    if (skill.ability) {
      map.set(skill.name, skill.ability.toLowerCase());
    }
  });
  return map;
}

export function buildSubSkillNames(skillsData: Skill[]): Set<string> {
  const set = new Set<string>();
  skillsData.forEach((skill: Skill) => {
    if (skill.base_skill_id !== undefined) {
      set.add(String(skill.name ?? '').toLowerCase());
    }
  });
  return set;
}
