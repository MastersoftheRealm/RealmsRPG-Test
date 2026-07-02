'use client';

import type { ReactNode } from 'react';
import { GridListRow } from '@/components/shared';
import type { Skill } from '@/hooks';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';
import { SKILL_GRID_COLUMNS } from '@/lib/codex/skill-list';

export function CodexSkillRow({
  skill,
  skillIdToName,
  rightSlot,
  variant = 'codex',
}: {
  skill: Skill;
  skillIdToName: Map<string, string>;
  rightSlot?: ReactNode;
  variant?: 'codex' | 'admin';
}) {
  const isSubSkill = skill.base_skill_id !== undefined && skill.base_skill_id !== 0;
  const baseSkillName =
    skill.base_skill_id === 0
      ? 'Any'
      : isSubSkill
        ? skillIdToName.get(String(skill.base_skill_id)) || '-'
        : '-';

  const descriptionParts: string[] = [];
  if (skill.description?.trim()) descriptionParts.push(skill.description.trim());
  if (variant === 'codex' && isSubSkill) descriptionParts.push(`Sub-skill of: ${baseSkillName}`);
  const description = descriptionParts.length > 0 ? descriptionParts.join('\n\n') : undefined;
  const detailSections =
    variant === 'codex' ? getSkillExtraDescriptionDetailSections(skill) : [];
  const displayName =
    variant === 'codex' && isSubSkill ? `↳ ${skill.name}` : skill.name;

  return (
    <GridListRow
      id={skill.id}
      name={displayName}
      description={variant === 'codex' ? description : skill.description || ''}
      gridColumns={SKILL_GRID_COLUMNS}
      columns={[
        { key: 'Ability', value: skill.ability || '-', highlight: false },
        { key: 'Base Skill', value: baseSkillName, highlight: variant === 'codex' && isSubSkill },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
      rightSlot={rightSlot}
    />
  );
}
