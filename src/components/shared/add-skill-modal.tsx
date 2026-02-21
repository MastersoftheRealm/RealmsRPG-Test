/**
 * Add Skill Modal — UnifiedSelectionModal wrapper
 * Adds base skills from Codex. Used by character sheet and SkillsAllocationPage.
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useCodexSkills, type Skill } from '@/hooks';
import { Alert } from '@/components/ui';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row';
import { ABILITY_ABBR, ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';

export interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: Skill[]) => void;
}

/** Parse skill.ability (comma-separated) into list of abbreviated ability codes (STR, AGI, ...). */
function getAbilityAbbrList(abilityString?: string): string[] {
  if (!abilityString) return [];
  return abilityString
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .map((a) => ABILITY_ABBR[a] ?? a.slice(0, 3).toUpperCase());
}

/** Build Abilities detail section and collapsed ability column (abbreviated, like sub-skill ability column). */
function buildAbilityDisplay(abilityString?: string): {
  detailChips: ChipData[];
  columnValue: string | ReactNode;
} {
  const abbrList = getAbilityAbbrList(abilityString);
  const detailChips: ChipData[] = abbrList.map((abbr) => ({ name: abbr, category: 'skill' as const }));
  const columnValue: string | ReactNode =
    abbrList.length === 0 ? (
      '—'
    ) : (
      <span className="inline-flex flex-wrap gap-1">
        {abbrList.map((abbr) => (
          <span
            key={abbr}
            className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-info-50 dark:bg-info-900/30 border border-info-200 dark:border-info-800/50 text-info-700 dark:text-info-400"
          >
            {abbr}
          </span>
        ))}
      </span>
    );
  return { detailChips, columnValue };
}

function skillToSelectableItem(skill: Skill & { ability?: string }): SelectableItem {
  const extraSections = getSkillExtraDescriptionDetailSections(skill);
  const { detailChips, columnValue } = buildAbilityDisplay(skill.ability);
  const detailSections: SelectableItem['detailSections'] = [];
  if (detailChips.length > 0) {
    detailSections.push({ label: 'Abilities', chips: detailChips, hideLabelIfSingle: true });
  }
  if (extraSections.length > 0) {
    detailSections.push(...extraSections);
  }
  return {
    id: String(skill.id),
    name: skill.name ?? '',
    description: skill.description,
    columns: [{ key: 'ability', value: columnValue, align: 'center' as const }],
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    data: skill,
  };
}

export function AddSkillModal({
  isOpen,
  onClose,
  existingSkillNames,
  onAdd,
}: AddSkillModalProps) {
  const { data: allSkills = [], isLoading: loading, error: queryError } = useCodexSkills();
  const [abilityFilter, setAbilityFilter] = useState('');

  const skills = useMemo(() => {
    return allSkills.filter((s: Skill) => s.base_skill_id === undefined);
  }, [allSkills]);

  const items = useMemo((): SelectableItem[] => {
    const existingLower = existingSkillNames.map(n => n.toLowerCase());
    return skills
      .filter((skill: Skill) => {
        if (existingLower.includes(String(skill.name ?? '').toLowerCase())) return false;
        if (abilityFilter) {
          const skillAbilities = skill.ability?.split(',').map(a => a.trim().toLowerCase()) || [];
          if (!skillAbilities.includes(abilityFilter.toLowerCase())) return false;
        }
        return true;
      })
      .map((s: Skill) => ({ ...s, ability: s.ability || '' }))
      .map(skillToSelectableItem);
  }, [skills, existingSkillNames, abilityFilter]);

  const error = queryError ? `Failed to load skills: ${queryError.message}` : null;

  const filterContent = (
    <div className="flex gap-3 items-center">
      <label className="text-sm font-medium text-text-secondary">Filter by Ability:</label>
      <select
        value={abilityFilter}
        onChange={(e) => setAbilityFilter(e.target.value)}
        className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">All Abilities</option>
        {ABILITY_FILTER_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md">
          {error}
        </Alert>
      )}
      <UnifiedSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Skills"
        description="Expand a row to view details. Use the + button to add, then click Add Selected."
        items={items}
        isLoading={loading}
        onConfirm={(selected) => onAdd(selected.map(i => i.data as Skill))}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'ability', label: 'Abilities', sortable: true },
        ]}
        gridColumns="1fr auto"
        itemLabel="skill"
        emptyMessage={error ?? 'No skills available to add'}
        searchPlaceholder="Search skills by name or description..."
        filterContent={filterContent}
        showFilters={true}
        size="xl"
      />
    </>
  );
}
