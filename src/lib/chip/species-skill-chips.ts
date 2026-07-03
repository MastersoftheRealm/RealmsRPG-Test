import type { SummaryChipItem } from '@/components/shared/summary-chip-list';

export const ANY_SPECIES_SKILL_ID = '0';

export const ANY_SPECIES_SKILL_DESCRIPTION =
  'Your choice: pick any one skill as your second species skill, or treat this as an extra skill point.';

type SkillLike = { id: string | number; name?: string; description?: string };

/** Map a species skill id to a summary/expandable chip item (codex + "Any"). */
export function speciesSkillToSummaryChipItem(
  skillId: string | number,
  allSkills: SkillLike[]
): SummaryChipItem {
  const key = String(skillId);
  if (key === ANY_SPECIES_SKILL_ID) {
    return {
      key,
      label: 'Any',
      description: ANY_SPECIES_SKILL_DESCRIPTION,
      variant: 'list',
    };
  }
  const skill = allSkills.find(
    (s) =>
      String(s.id) === key ||
      String(s.name ?? '').toLowerCase() === key.toLowerCase()
  );
  return {
    key,
    label: skill?.name ?? key,
    description: skill?.description,
    variant: 'list',
  };
}

/** Map species skill ids to GridListRow ChipData (expandable when description exists). */
export function speciesSkillToChipData(skillId: string | number, allSkills: SkillLike[]) {
  const item = speciesSkillToSummaryChipItem(skillId, allSkills);
  return {
    name: item.label,
    description: item.description ?? undefined,
    category: 'skill' as const,
  };
}
