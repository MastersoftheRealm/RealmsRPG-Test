/**
 * Add Skill Modal — UnifiedSelectionModal wrapper
 * Adds base skills from Codex. Used by character sheet and SkillsAllocationPage.
 */

'use client';

import { useState, useMemo } from 'react';
import { useCodexSkills, type Skill } from '@/hooks';
import { Alert } from '@/components/ui';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';

export interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: Skill[]) => void;
}

function formatAbilityBadges(abilityString?: string): Array<{ label: string; color: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }> {
  if (!abilityString) return [];
  return abilityString.split(',').map(a => a.trim()).filter(Boolean).map(ability => ({
    label: ability.slice(0, 3).toUpperCase(),
    color: 'gray' as const
  }));
}

function skillToSelectableItem(skill: Skill & { ability?: string }): SelectableItem {
  const extraSections = getSkillExtraDescriptionDetailSections(skill);
  return {
    id: skill.id,
    name: skill.name ?? '',
    description: skill.description,
    columns: [
      { key: 'name', value: skill.name ?? '—', align: 'left' },
      { key: 'ability', value: skill.ability ?? '—', align: 'center' as const },
    ],
    badges: formatAbilityBadges(skill.ability),
    detailSections: extraSections.length > 0 ? extraSections : undefined,
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
        description="Select skills to add to your character"
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
