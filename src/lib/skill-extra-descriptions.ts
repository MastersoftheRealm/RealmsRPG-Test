/**
 * Skill extra descriptions — shared helper for TASK-173
 * Builds detailSections/chips for success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc
 * for use in Codex Skills tab, add-skill modal, and add sub-skill modal.
 */

import type { Skill } from '@/hooks';

/** Compatible with GridListRow ChipData (name, description, category). */
export interface SkillExtraChip {
  name: string;
  description?: string;
  category?: 'default';
}

export function getSkillExtraDescriptionDetailSections(
  skill: Skill
): Array<{ label: string; chips: SkillExtraChip[] }> {
  const chips: SkillExtraChip[] = [];
  if (skill.success_desc?.trim()) {
    chips.push({ name: 'Success Outcomes', description: skill.success_desc.trim(), category: 'default' });
  }
  if (skill.failure_desc?.trim()) {
    chips.push({ name: 'Failure Outcomes', description: skill.failure_desc.trim(), category: 'default' });
  }
  if (skill.ds_calc?.trim()) {
    chips.push({ name: 'DS Calculation', description: skill.ds_calc.trim(), category: 'default' });
  }
  if (skill.craft_success_desc?.trim()) {
    chips.push({ name: 'Craft Success', description: skill.craft_success_desc.trim(), category: 'default' });
  }
  if (skill.craft_failure_desc?.trim()) {
    chips.push({ name: 'Craft Failure', description: skill.craft_failure_desc.trim(), category: 'default' });
  }
  if (chips.length === 0) return [];
  return [{ label: 'Additional descriptions', chips }];
}
