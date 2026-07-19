/**
 * Guided feats L2 — UnifiedSelectionModal (TASK-565).
 * Replaces in-step GuidedFeatsBrowsePanel card dump (same grammar as skills / loadout / powers).
 */

'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/shared';
import { useCodexSkills, type Feat } from '@/hooks';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';
import {
  buildGuidedFeatsL2FilterOptions,
  buildGuidedFeatsL2Items,
  FEATS_L2_GRID,
  FEATS_L2_HEADER_COLUMNS,
  selectedIdsFromFeatL2Items,
} from '@/lib/guided-creator/feats-l2';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

export interface GuidedFeatsL2ModalProps {
  isOpen: boolean;
  featType: 'archetype' | 'character';
  feats: Feat[];
  recommendedIds: string[];
  initialSelectedIds: string[];
  maxSelections: number;
  requirementCharacter: CharacterForFeatRequirement;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

export function GuidedFeatsL2Modal({
  isOpen,
  featType,
  feats,
  recommendedIds,
  initialSelectedIds,
  maxSelections,
  requirementCharacter,
  onClose,
  onConfirm,
}: GuidedFeatsL2ModalProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const { data: codexSkills = [] } = useCodexSkills();
  const [category, setCategory] = useState('');
  const [ability, setAbility] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);

  const { categories, abilities } = useMemo(
    () => buildGuidedFeatsL2FilterOptions(feats, featType),
    [feats, featType]
  );

  const items = useMemo(
    () =>
      buildGuidedFeatsL2Items({
        featType,
        feats,
        recommendedIds,
        selectedIds: initialSelectedIds,
        requirementCharacter,
        codexSkills,
        showBlocked,
        category,
        ability,
        recommendedBadgeLabel: l2Copy.recommendedBadge,
      }),
    [
      featType,
      feats,
      recommendedIds,
      initialSelectedIds,
      requirementCharacter,
      codexSkills,
      showBlocked,
      category,
      ability,
    ]
  );

  const initialSet = useMemo(
    () => new Set(initialSelectedIds.map(String)),
    [initialSelectedIds]
  );

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      onConfirm(selectedIdsFromFeatL2Items(selected));
      onClose();
    },
    [onConfirm, onClose]
  );

  const title = featType === 'character' ? l2Copy.characterTitle : l2Copy.archetypeTitle;
  const description = l2Copy.description(maxSelections);
  const selectionLimitMessage =
    maxSelections <= 0
      ? l2Copy.overLimitZero
      : maxSelections === 1
        ? undefined
        : l2Copy.overLimit(maxSelections);

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor={categorySelectId} className="text-sm text-text-muted dark:text-text-secondary">
          {l2Copy.categoryLabel}
        </label>
        <select
          id={categorySelectId}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-11 text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-outline-border"
        >
          <option value="">{l2Copy.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={abilitySelectId} className="text-sm text-text-muted dark:text-text-secondary">
          {l2Copy.abilityLabel}
        </label>
        <select
          id={abilitySelectId}
          value={ability}
          onChange={(e) => setAbility(e.target.value)}
          className="min-h-11 text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-outline-border"
        >
          <option value="">{l2Copy.allAbilities}</option>
          {abilities.map((abil) => (
            <option key={abil} value={abil}>
              {abil}
            </option>
          ))}
        </select>
      </div>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text-muted dark:text-text-secondary">
        <input
          type="checkbox"
          checked={showBlocked}
          onChange={(e) => setShowBlocked(e.target.checked)}
          className="h-4 w-4 rounded border-border-light"
        />
        {l2Copy.showBlocked}
      </label>
    </div>
  );

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      items={items}
      onConfirm={handleConfirm}
      initialSelectedIds={initialSet}
      maxSelections={maxSelections}
      selectionLimitMessage={selectionLimitMessage}
      columns={FEATS_L2_HEADER_COLUMNS}
      gridColumns={FEATS_L2_GRID}
      itemLabel="feat"
      emptyMessage={l2Copy.emptyMessage}
      searchPlaceholder={l2Copy.searchPlaceholder}
      filterContent={filterContent}
      showFilters
      hideDisabled={false}
      size="xl"
      className="md:max-h-[85vh]"
    />
  );
}
