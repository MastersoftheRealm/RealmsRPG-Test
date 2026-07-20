/**
 * Shared creator skill-save rows (Guided + Advanced).
 * Builds array rows before cleanForSave so proficient-only skill_val 0 is kept
 * (Record→array in cleanForSave drops val <= 0).
 */

export interface CreatorSkillCodexEntry {
  id: string | number;
  name?: string;
  category?: string;
  ability?: string;
  base_skill_id?: string | number | null;
}

export interface CreatorSkillSaveRow {
  id: string;
  name: string;
  category: string;
  skill_val: number;
  prof: boolean;
  ability?: string;
  /** Display name of base skill when includeBaseSkillName is set (Advanced parity). */
  baseSkill?: string;
}

export interface BuildCreatorSkillSaveRowsOptions {
  /** Species-granted skill ids (id "0" = Any / ignored). */
  speciesSkillIds?: string[];
  codexSkills?: CreatorSkillCodexEntry[];
  /** When true, attach baseSkill display name from codex base_skill_id. */
  includeBaseSkillName?: boolean;
}

function resolveCodexSkill(
  skillKey: string,
  codexSkills: CreatorSkillCodexEntry[]
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
  options: BuildCreatorSkillSaveRowsOptions = {}
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
    const ability = skillData?.ability?.split(',')[0]?.trim().toLowerCase();
    const category =
      skillData?.category || skillData?.ability?.split(',')[0]?.trim() || 'other';

    let baseSkill: string | undefined;
    if (includeBaseSkillName && skillData?.base_skill_id !== undefined && skillData.base_skill_id !== null) {
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
