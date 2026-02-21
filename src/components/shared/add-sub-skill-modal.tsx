/**
 * Add Sub-Skill Modal
 * ===================
 * Shared modal for adding sub-skills from Codex.
 * Used by: character sheet, character creator (SkillsAllocationPage).
 * Unified with other add modals: uses UnifiedSelectionModal + GridListRow.
 * Features:
 * - Shows sub-skills (base_skill_id !== undefined), excludes already-added by name
 * - If base skill is not in character's list, auto-adds it unproficiently (autoAddBaseSkill)
 * - For "any base skill" sub-skills (base_skill_id === 0), footer shows base skill selector
 * - Search, Ability and Base Skill filters, sortable list
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Select } from '@/components/ui';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { FilterSection } from '@/components/shared';
import { useCodexSkills, type Skill } from '@/hooks';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';
import type { ChipData } from '@/components/shared/grid-list-row';

export interface CharacterSkillForSubModal {
  id?: string;
  name: string;
  prof?: boolean;
}

export interface AddSubSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterSkills: CharacterSkillForSubModal[];
  existingSkillNames: string[];
  onAdd: (skills: Array<Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }>) => void;
}

const SUB_SKILL_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'ability', label: 'Abilities', sortable: false },
  { key: 'base', label: 'Base', sortable: false },
];

export function AddSubSkillModal({
  isOpen,
  onClose,
  characterSkills,
  existingSkillNames,
  onAdd,
}: AddSubSkillModalProps) {
  const { data: allSkills = [], isLoading: loading, error: fetchError } = useCodexSkills();
  const [abilityFilter, setAbilityFilter] = useState('');
  const [baseSkillFilter, setBaseSkillFilter] = useState('');
  const [anyBaseSkillSelections, setAnyBaseSkillSelections] = useState<Record<string, string>>({});

  const skillById = useMemo(() => {
    return allSkills.reduce((acc: Record<string, Skill>, skill: Skill) => {
      acc[skill.id] = skill;
      return acc;
    }, {} as Record<string, Skill>);
  }, [allSkills]);

  const allBaseSkills = useMemo(() => {
    return allSkills
      .filter((s: Skill) => s.base_skill_id === undefined)
      .map((s: Skill) => ({ id: s.id, name: s.name }))
      .sort((a: { id: string; name: string }, b: { id: string; name: string }) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }, [allSkills]);

  const existingSkillNamesLower = useMemo(
    () => new Set(existingSkillNames.map((n) => String(n ?? '').toLowerCase())),
    [existingSkillNames]
  );

  const hasBaseSkill = useCallback(
    (baseSkillId: string | number) => {
      const baseSkill = skillById[String(baseSkillId)];
      if (!baseSkill) return false;
      return characterSkills.some(
        (cs) =>
          String(cs.name ?? '').toLowerCase() === String(baseSkill.name ?? '').toLowerCase() ||
          cs.id === baseSkill.id
      );
    },
    [characterSkills, skillById]
  );

  const allSubSkills = useMemo(() => {
    return allSkills.filter((skill: Skill) => skill.base_skill_id !== undefined);
  }, [allSkills]);

  const baseSkillOptions = useMemo(() => {
    const baseSkillIds = new Set<string>();
    allSubSkills.forEach((skill: Skill) => {
      if (skill.base_skill_id !== undefined && skill.base_skill_id !== 0) {
        baseSkillIds.add(String(skill.base_skill_id));
      }
    });
    return Array.from(baseSkillIds)
      .map((id) => skillById[id])
      .filter(Boolean)
      .map((s) => ({ id: s.id, name: s.name }))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }, [allSubSkills, skillById]);

  useEffect(() => {
    if (isOpen) {
      setAbilityFilter('');
      setBaseSkillFilter('');
      setAnyBaseSkillSelections({});
    }
  }, [isOpen]);

  const filteredSkills = useMemo(() => {
    return allSubSkills.filter((skill: Skill) => {
      const nameLower = String(skill.name ?? '').toLowerCase();
      if (existingSkillNamesLower.has(nameLower)) return false;

      if (abilityFilter) {
        const skillAbilities = skill.ability?.split(',').map((a) => a.trim().toLowerCase()) || [];
        if (!skillAbilities.includes(abilityFilter.toLowerCase())) return false;
      }

      if (baseSkillFilter) {
        if (skill.base_skill_id === 0) return false;
        if (String(skill.base_skill_id) !== baseSkillFilter) return false;
      }

      return true;
    });
  }, [allSubSkills, existingSkillNamesLower, abilityFilter, baseSkillFilter]);

  const items: SelectableItem[] = useMemo(() => {
    return filteredSkills.map((skill: Skill) => {
      const isAnyBaseSkill = skill.base_skill_id === 0;
      const baseSkill = skill.base_skill_id ? skillById[String(skill.base_skill_id)] : null;
      const baseSkillName = isAnyBaseSkill ? 'Any' : baseSkill?.name ?? 'Unknown';
      const abilities = skill.ability?.split(',').map((a) => a.trim()).filter(Boolean) || [];
      const abilityAbbrevs = abilities.map((a) => a.slice(0, 3).toUpperCase()).join(', ') || '—';
      const detailSections = getSkillExtraDescriptionDetailSections(skill);
      const chips: ChipData[] = (detailSections[0]?.chips ?? []).map((c) => ({
        name: c.name,
        description: c.description,
        category: 'default',
      }));

      return {
        id: skill.id,
        name: skill.name,
        description: [skill.description, `Base: ${baseSkillName}`].filter(Boolean).join(' · ') || undefined,
        columns: [
          { key: 'ability', value: abilityAbbrevs, align: 'center' as const },
          { key: 'base', value: baseSkillName, align: 'center' as const },
        ],
        detailSections:
          detailSections.length > 0
            ? detailSections.map((s) => ({ label: s.label, chips: s.chips as ChipData[] }))
            : undefined,
        chips: chips.length > 0 ? chips : undefined,
        warningMessage:
          !isAnyBaseSkill &&
          skill.base_skill_id &&
          !hasBaseSkill(skill.base_skill_id)
            ? `Will add ${baseSkillName}`
            : undefined,
        data: skill,
      };
    });
  }, [filteredSkills, skillById, hasBaseSkill]);

  const handleBaseSkillSelect = useCallback((subSkillId: string, baseSkillId: string) => {
    setAnyBaseSkillSelections((prev) => ({ ...prev, [subSkillId]: baseSkillId }));
  }, []);

  const handleConfirm = useCallback(
    (selectedItems: SelectableItem[]) => {
      if (selectedItems.length === 0) return;

      const skillsWithBase = selectedItems.map((item) => {
        const skill = item.data as Skill;
        const isAnyBase = skill.base_skill_id === 0;
        const baseSkillId = isAnyBase ? anyBaseSkillSelections[skill.id] : String(skill.base_skill_id);
        const needsBaseSkill = baseSkillId && !hasBaseSkill(baseSkillId);
        const autoAddBaseSkill = needsBaseSkill ? skillById[baseSkillId] : undefined;

        return {
          ...skill,
          selectedBaseSkillId: isAnyBase ? anyBaseSkillSelections[skill.id] : undefined,
          autoAddBaseSkill,
        };
      });

      onAdd(skillsWithBase);
      onClose();
    },
    [anyBaseSkillSelections, hasBaseSkill, skillById, onAdd, onClose]
  );

  const footerExtra = useCallback(
    (selectedItems: SelectableItem[]) => {
      const selectedAnyBase = selectedItems.filter((item) => (item.data as Skill).base_skill_id === 0);
      if (selectedAnyBase.length === 0) return null;

      return (
        <div className="space-y-2">
          {selectedAnyBase.map((item) => {
            const skill = item.data as Skill;
            return (
              <div
                key={skill.id}
                className="p-3 rounded-lg border border-border-light bg-surface-alt dark:bg-surface"
              >
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Choose base skill for <span className="font-semibold">{skill.name}</span>:
                </label>
                <Select
                  value={anyBaseSkillSelections[skill.id] ?? ''}
                  onChange={(e) => handleBaseSkillSelect(skill.id, e.target.value)}
                  options={[
                    { value: '', label: 'Select a base skill...' },
                    ...allBaseSkills.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>
            );
          })}
        </div>
      );
    },
    [anyBaseSkillSelections, allBaseSkills, handleBaseSkillSelect]
  );

  const confirmDisabled = useCallback(
    (selectedItems: SelectableItem[]) => {
      const anyBase = selectedItems.filter((item) => (item.data as Skill).base_skill_id === 0);
      return anyBase.some((item) => !anyBaseSkillSelections[(item.data as Skill).id]);
    },
    [anyBaseSkillSelections]
  );

  const filterContent = (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-text-secondary">Ability:</label>
        <select
          value={abilityFilter}
          onChange={(e) => setAbilityFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-surface-alt dark:border-border"
        >
          <option value="">All</option>
          {ABILITY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-text-secondary">Base Skill:</label>
        <select
          value={baseSkillFilter}
          onChange={(e) => setBaseSkillFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-surface-alt dark:border-border"
        >
          <option value="">All</option>
          {baseSkillOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const error = fetchError?.message ?? null;

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
        title="Add Sub-Skills"
        description="Add specialized skills. Base skill will be added automatically if needed. Click a row (or the + button) to select, then click Add Selected. For “Any base” skills, choose the base skill below before confirming."
        items={items}
        isLoading={loading}
        onConfirm={handleConfirm}
        columns={SUB_SKILL_COLUMNS}
        gridColumns="1.4fr 0.8fr 0.7fr"
        itemLabel="sub-skill"
        emptyMessage={error ?? 'No sub-skills available to add'}
        emptySubMessage="Create sub-skills in the Codex or adjust filters."
        searchPlaceholder="Search sub-skills by name, description, or base skill..."
        searchFields={['name', 'description']}
        filterContent={filterContent}
        showFilters={true}
        footerExtra={footerExtra}
        confirmDisabled={confirmDisabled}
        size="xl"
        className="max-h-[85vh]"
      />
    </>
  );
}
