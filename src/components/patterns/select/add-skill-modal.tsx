/**
 * Add Skill Modal — UnifiedSelectionModal wrapper
 * Adds base skills from Codex. Used by character sheet and SkillsAllocationPage.
 */

'use client';

import { useId, useMemo, useState } from 'react';
import { Alert, Button } from '@/components/ui';
import { guidedNavProgressClassName } from '@/components/patterns/guided-choice/guided-nav-button-styles';
import { useCodexSkills, usePathListFilter, type Skill } from '@/hooks';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/patterns/select/unified-selection-modal';
import { ArchetypePathFilter } from '@/components/patterns/filters';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';
import {
  ADD_SKILL_GRID_COLUMNS,
  ADD_SKILL_HEADER_COLUMNS,
  formatSkillAbilityList,
  parseSkillAbilities,
} from '@/lib/codex/skill-list';
import {
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
  rowMatchesPathRecommendedIds,
} from '@/lib/game/path-recommendation-index';
import type { ArchetypeCategory } from '@/types/archetype';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import type { AbilityName } from '@/types';

import type { GridListBadgeColor } from '@/lib/chip/grid-list-chip-utils';

export interface AddSkillModalSkillBadge {
  label: string;
  color?: GridListBadgeColor | undefined;
}

export interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: Skill[]) => void;
  /** Inline descriptor chips for recommended skills (guided creator). Keyed by skill id. */
  skillBadgesById?: Record<string, AddSkillModalSkillBadge[]> | undefined;
  /** When set, recommended skills sort to the top of the list. */
  recommendedSkillIds?: string[] | undefined;
  /** Max new skills selectable in this session (e.g. remaining skill points ÷ proficiency cost). */
  maxSelections?: number | undefined;
  /**
   * Soft capacity message when over maxSelections (or max is 0).
   * Rows stay readable; Add Selected is blocked until under the limit.
   */
  selectionLimitMessage?: string | undefined;
  /** Optional deeper layer hop (e.g. guided L2 → L3 sub-skills). */
  deeperLayerLabel?: string | undefined;
  onDeeperLayer?: (() => void) | undefined;
  deeperLayerDisabled?: boolean | undefined;
  deeperLayerDisabledTitle?: string | undefined;
  /** Path-flow See more: auto-select every player-visible path of this type. */
  autoSelectPathType?: ArchetypeCategory | null | undefined;
  /** Guided path See more opens with Filters expanded. */
  optionsDefaultExpanded?: boolean | undefined;
}

/** Drop ability badges when the Abilities column already shows governing options. */
function filterAbilityDuplicateBadges(
  skill: Skill & { ability?: string | undefined },
  badges?: AddSkillModalSkillBadge[],
): AddSkillModalSkillBadge[] | undefined {
  if (!badges?.length) return badges;
  const abilityLabels = new Set(
    parseSkillAbilities(skill.ability).map((key) => formatAbilityLabel(key as AbilityName)),
  );
  const filtered = badges.filter((badge) => !abilityLabels.has(badge.label));
  return filtered.length > 0 ? filtered : undefined;
}

function skillToSelectableItem(
  skill: Skill & { ability?: string | undefined },
  skillBadgesById?: Record<string, AddSkillModalSkillBadge[]>,
  pathChipLabels?: string[],
): SelectableItem {
  const extraSections = getSkillExtraDescriptionDetailSections(skill);
  const detailSections: SelectableItem['detailSections'] =
    extraSections.length > 0 ? extraSections : undefined;
  const skillId = String(skill.id);
  const pathBadges = pathChipLabels?.map((label) => ({ label, color: 'blue' as const }));
  const rawBadges = pathBadges ?? skillBadgesById?.[skillId];
  const badges = filterAbilityDuplicateBadges(skill, rawBadges)?.map((b) => ({
    label: b.label,
    color: b.color,
  }));
  return {
    id: skillId,
    name: skill.name ?? '',
    description: skill.description,
    columns: [
      {
        key: 'ability',
        value: formatSkillAbilityList(skill.ability),
        align: 'center' as const,
      },
    ],
    detailSections,
    badges,
    showBadgesInName: Boolean(pathBadges?.length),
    data: skill,
  };
}

export function AddSkillModal({
  isOpen,
  onClose,
  existingSkillNames,
  onAdd,
  skillBadgesById,
  recommendedSkillIds,
  maxSelections,
  selectionLimitMessage,
  deeperLayerLabel,
  onDeeperLayer,
  deeperLayerDisabled = false,
  deeperLayerDisabledTitle,
  autoSelectPathType,
  optionsDefaultExpanded = false,
}: AddSkillModalProps) {
  const { data: allSkills = [], isLoading: loading, error: queryError } = useCodexSkills();
  const [abilityFilter, setAbilityFilter] = useState('');
  const abilityFilterId = useId();

  const skills = useMemo(() => {
    return allSkills.filter((s: Skill) => s.base_skill_id === undefined);
  }, [allSkills]);

  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities: skills,
      kind: 'skills',
      enabled: isOpen,
      autoSelectType: autoSelectPathType,
      autoSelectWhen: isOpen,
    });

  const items = useMemo((): SelectableItem[] => {
    const existingLower = existingSkillNames.map((n) => n.toLowerCase());
    const recommendedRank = new Map(
      (recommendedSkillIds ?? []).map((id, index) => [String(id), index]),
    );
    const filtered = skills
      .filter((skill: Skill) => {
        if (existingLower.includes(String(skill.name ?? '').toLowerCase())) return false;
        if (abilityFilter) {
          const skillAbilities = skill.ability?.split(',').map((a) => a.trim().toLowerCase()) || [];
          if (!skillAbilities.includes(abilityFilter.toLowerCase())) return false;
        }
        if (!rowMatchesPathRecommendedIds(skill.id, pathRecommendedIds)) return false;
        return true;
      })
      .map((s: Skill) => ({ ...s, ability: s.ability || '' }));

    filtered.sort((a, b) => {
      const ra = recommendedRank.get(String(a.id));
      const rb = recommendedRank.get(String(b.id));
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, {
        sensitivity: 'base',
      });
    });

    return filtered.map((s) =>
      skillToSelectableItem(
        s,
        pathFilterActive ? undefined : skillBadgesById,
        pathFilterActive ? pathChipLabelsForEntity(pathIndex, s.id, selectedPathIds) : undefined,
      ),
    );
  }, [
    skills,
    existingSkillNames,
    abilityFilter,
    skillBadgesById,
    recommendedSkillIds,
    pathFilterActive,
    pathIndex,
    selectedPathIds,
    pathRecommendedIds,
  ]);

  const error = queryError ? `Failed to load Skills: ${queryError.message}` : null;

  const resolvedLimitMessage =
    selectionLimitMessage ??
    (maxSelections !== undefined
      ? maxSelections <= 0
        ? "You don't have enough skill points to add more. Remove a skill or decrease a skill bonus, then try again."
        : `You've selected more skills than you can afford (max ${maxSelections}). Deselect some, or free skill points first.`
      : undefined);

  const filterContent = (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="filter-group min-w-0">
        <label
          htmlFor={abilityFilterId}
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Filter by Ability
        </label>
        <select
          id={abilityFilterId}
          value={abilityFilter}
          onChange={(e) => setAbilityFilter(e.target.value)}
          className="min-h-11 w-full rounded-md border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary-outline-border focus:outline-none"
        >
          <option value="">All Abilities</option>
          {ABILITY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <ArchetypePathFilter
        options={pathIndex.options}
        selectedPathIds={selectedPathIds}
        onChange={setSelectedPathIds}
      />
    </div>
  );

  const deeperLayerNav =
    deeperLayerLabel && onDeeperLayer ? (
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onDeeperLayer}
        disabled={deeperLayerDisabled}
        title={deeperLayerDisabled ? deeperLayerDisabledTitle : undefined}
        className={guidedNavProgressClassName}
      >
        {deeperLayerLabel}
      </Button>
    ) : null;

  return (
    <>
      {error && isOpen && (
        <Alert variant="danger" className="fixed top-4 left-1/2 z-toast max-w-md -translate-x-1/2">
          {error}
        </Alert>
      )}
      <UnifiedSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Skills"
        items={items}
        isLoading={loading}
        onConfirm={(selected) => onAdd(selected.map((i) => i.data as Skill))}
        maxSelections={maxSelections}
        selectionLimitMessage={resolvedLimitMessage}
        footerExtra={deeperLayerNav ? () => deeperLayerNav : undefined}
        columns={ADD_SKILL_HEADER_COLUMNS.map((col) => ({
          key: col.key,
          label: col.label,
          sortable: col.key === 'ability' ? true : undefined,
        }))}
        gridColumns={ADD_SKILL_GRID_COLUMNS}
        itemLabel="Skill"
        emptyMessage={
          error ??
          (pathFilterActive ? pathFilterEmptyTitle('skills') : 'No Skills available to add')
        }
        searchPlaceholder="Search Skills by name or description..."
        filterContent={filterContent}
        showFilters={true}
        optionsDefaultExpanded={optionsDefaultExpanded}
        optionsActiveCount={(abilityFilter ? 1 : 0) + (pathFilterActive ? 1 : 0)}
        optionsSummary={abilityFilter ? `Ability: ${abilityFilter}` : undefined}
        size="xl"
      />
    </>
  );
}
