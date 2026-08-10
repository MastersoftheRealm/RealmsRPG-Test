/**
 * Guided feats L2 — UnifiedSelectionModal (TASK-565).
 * Replaces in-step GuidedFeatsBrowsePanel card dump (same grammar as skills / loadout / powers).
 */
// DESIGN_INTENT: Sheet AddFeatModal is add-only (excludes owned ids, full Character). Guided
// needs replace-in-place selection (initialSelectedIds, maxSelections, Recommended badges,
// draft CharacterForFeatRequirement) — peer of GuidedPowersTechniquesL2Modal / equipment L2,
// not a sheet AddFeatModal fork.

'use client';

import { useCallback, useMemo, useState } from 'react';
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
  FEATS_L2_SEARCH_FIELDS,
  selectedIdsFromFeatL2Items,
  type StateFeatFilterMode,
} from '@/lib/guided-creator/feats-l2';
import { GuidedFeatsFilterFields } from './guided-feats-filter-fields';
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
  const { data: codexSkills = [] } = useCodexSkills();
  const [categories, setCategories] = useState<string[]>([]);
  const [stateFeatMode, setStateFeatMode] = useState<StateFeatFilterMode>('all');

  const { categories: categoryOptions } = useMemo(
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
        categories,
        stateFeatMode,
        recommendedBadgeLabel: l2Copy.recommendedBadge,
      }),
    [
      featType,
      feats,
      recommendedIds,
      initialSelectedIds,
      requirementCharacter,
      codexSkills,
      categories,
      stateFeatMode,
    ]
  );

  const initialSet = useMemo(
    () => new Set(initialSelectedIds.map(String)),
    [initialSelectedIds]
  );

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      // UnifiedSelectionModal closes after onConfirm — do not double-call onClose.
      onConfirm(selectedIdsFromFeatL2Items(selected));
    },
    [onConfirm]
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
    <GuidedFeatsFilterFields
      categories={categoryOptions}
      selectedCategories={categories}
      onAddCategory={(v) => setCategories((prev) => [...prev, v])}
      onRemoveCategory={(v) => setCategories((prev) => prev.filter((c) => c !== v))}
      stateFeatMode={stateFeatMode}
      onStateFeatModeChange={setStateFeatMode}
    />
  );
  const activeFilterCount = categories.length + (stateFeatMode !== 'all' ? 1 : 0);

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
      searchFields={FEATS_L2_SEARCH_FIELDS}
      filterContent={filterContent}
      showFilters
      optionsActiveCount={activeFilterCount}
      hideDisabled={false}
      size="xl"
      className="md:max-h-[85vh]"
    />
  );
}
