/**
 * Build character sheet skill rows from guided creator allocations.
 */

export interface GuidedSkillRow {
  id: string;
  name: string;
  category: string;
  skill_val: number;
  prof: boolean;
  ability?: string;
}

export function buildGuidedSkillsArray(
  skills: Record<string, number>,
  speciesSkillIds: string[],
  codexSkills: Array<{ id: string | number; name?: string; category?: string; ability?: string }>
): GuidedSkillRow[] {
  const ids = new Set<string>();
  speciesSkillIds.forEach((id) => {
    if (id !== '0') ids.add(String(id));
  });
  Object.keys(skills).forEach((id) => ids.add(String(id)));

  return Array.from(ids).map((skillId) => {
    const skillData = codexSkills.find((s) => String(s.id) === skillId);
    const skillVal = skills[skillId] ?? 0;
    return {
      id: skillId,
      name: skillData?.name ?? skillId,
      category: skillData?.category || skillData?.ability?.split(',')[0]?.trim() || 'other',
      skill_val: skillVal,
      prof: true,
      ability: skillData?.ability?.split(',')[0]?.trim().toLowerCase(),
    };
  });
}
