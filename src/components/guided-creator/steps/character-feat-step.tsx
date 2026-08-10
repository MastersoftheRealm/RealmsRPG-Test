/**
 * Character feat — identity / non-combat expression (1 at level 1).
 * Layer 1: path-curated cards; Layer 2: add modal (TASK-565).
 */

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { EmptyState, Spinner } from '@/components/ui';
import { GuidedInlineCatalogList, GuidedLayerNav } from '@/components/shared';
import { useCodexFeats, useCodexSkills } from '@/hooks';
import { guidedDraftToFeatRequirementCharacter } from '@/lib/guided-creator/feat-selection';
import {
  buildGuidedFeatsL2FilterOptions,
  buildGuidedFeatsL2Items,
  FEATS_L2_GRID,
  FEATS_L2_HEADER_COLUMNS,
  FEATS_L2_SEARCH_FIELDS,
  type StateFeatFilterMode,
} from '@/lib/guided-creator/feats-l2';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GuidedFeatRestrictionNotice } from '../guided-restriction-notice';
import { GuidedFeatsL2Modal } from '../guided-feats-l2-modal';
import { GuidedFeatsFilterFields } from '../guided-feats-filter-fields';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { filterFeatGuidanceGroups } from '@/lib/game/archetype-path';
import { EMPTY_GUIDANCE_GROUPS, EMPTY_STRING_ARRAY } from '@/lib/empty';

const stepCopy = GUIDED_CREATOR_COPY.steps.characterFeat;
const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

export function CharacterFeatStep() {
  const { draft, updateDraft, navigationIntent, entryNonce } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const [browseOpen, setBrowseOpen] = useState(false);

  // L3 — no archetype path: inline full catalog in the step body, no L2 modal (TASK-684).
  const isInlineCatalog = prefersDeepCatalogEntry(draft);

  const openBrowse = useCallback(() => setBrowseOpen(true), []);
  useGuidedDeepEntryOnArrival({
    draft,
    navigationIntent,
    entryNonce,
    enabled: !isLoading && !isInlineCatalog,
    onDeepEntry: openBrowse,
  });

  const guidanceGroups = pathData?.level1?.guidance_groups;
  const characterFeatGroups = useMemo(
    () => {
      const filtered = filterFeatGuidanceGroups(guidanceGroups, 'character');
      return filtered.length > 0 ? filtered : EMPTY_GUIDANCE_GROUPS;
    },
    [guidanceGroups]
  );

  useEffect(() => {
    if (draft.characterFeatIds.length > 0) return;
    const firstGroup = characterFeatGroups[0];
    if (firstGroup?.feats?.[0]) {
      updateDraft({ characterFeatIds: [String(firstGroup.feats[0])] });
    }
  }, [characterFeatGroups, draft.characterFeatIds.length, updateDraft]);

  const options = useMemo(() => {
    const ids = new Set<string>();
    characterFeatGroups.forEach((g) => g.feats?.forEach((id) => ids.add(String(id))));
    return Array.from(ids)
      .map((id) => feats.find((f) => String(f.id) === id))
      .filter(Boolean);
  }, [characterFeatGroups, feats]);

  const recommendedIds = useMemo(
    () => options.map((f) => (f ? String(f.id) : '')).filter(Boolean),
    [options]
  );

  const requirementCharacter = useMemo(
    () => guidedDraftToFeatRequirementCharacter(draft),
    [draft]
  );

  const selectFeat = useCallback(
    (id: string) => {
      const isSelected = draft.characterFeatIds[0] === id;
      updateDraft({ characterFeatIds: isSelected ? [] : [id] });
    },
    [draft.characterFeatIds, updateDraft]
  );

  // Inline (L3) catalog — same builders as GuidedFeatsL2Modal so filtering/eligibility
  // (requirements, capped selection) stay identical whether shown in-page or in a modal.
  const [inlineCategories, setInlineCategories] = useState<string[]>([]);
  const [inlineStateFeatMode, setInlineStateFeatMode] = useState<StateFeatFilterMode>('all');

  const { categories: inlineCategoryOptions } = useMemo(
    () => buildGuidedFeatsL2FilterOptions(feats, 'character'),
    [feats]
  );

  const inlineItems = useMemo(
    () =>
      buildGuidedFeatsL2Items({
        featType: 'character',
        feats,
        recommendedIds: EMPTY_STRING_ARRAY,
        selectedIds: draft.characterFeatIds,
        requirementCharacter,
        codexSkills,
        categories: inlineCategories,
        stateFeatMode: inlineStateFeatMode,
      }),
    [
      feats,
      draft.characterFeatIds,
      requirementCharacter,
      codexSkills,
      inlineCategories,
      inlineStateFeatMode,
    ]
  );

  const inlineActiveFilterCount =
    inlineCategories.length + (inlineStateFeatMode !== 'all' ? 1 : 0);

  const selectedIdSet = useMemo(
    () => new Set(draft.characterFeatIds.map(String)),
    [draft.characterFeatIds]
  );

  const hasLayer1Options = options.length > 0;

  return (
    <GuidedStepLayout
      subStep="character-feat"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={draft.characterFeatIds.length === 1}
      completionHint={
        <span className="font-nunito">
          {draft.characterFeatIds.length} / 1
        </span>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isInlineCatalog ? (
        <GuidedInlineCatalogList
          items={inlineItems}
          selectedIds={selectedIdSet}
          onToggleSelection={selectFeat}
          columns={FEATS_L2_HEADER_COLUMNS}
          gridColumns={FEATS_L2_GRID}
          itemLabel="feat"
          emptyMessage={l2Copy.emptyMessage}
          searchPlaceholder={l2Copy.searchPlaceholder}
          searchFields={FEATS_L2_SEARCH_FIELDS}
          filterContent={
            <GuidedFeatsFilterFields
              categories={inlineCategoryOptions}
              selectedCategories={inlineCategories}
              onAddCategory={(v) => setInlineCategories((prev) => [...prev, v])}
              onRemoveCategory={(v) =>
                setInlineCategories((prev) => prev.filter((c) => c !== v))
              }
              stateFeatMode={inlineStateFeatMode}
              onStateFeatModeChange={setInlineStateFeatMode}
            />
          }
          showFilters
          optionsActiveCount={inlineActiveFilterCount}
          maxSelections={1}
          selectionLimitMessage={l2Copy.overLimit(1)}
          selectedTitle={l2Copy.characterSelectedTitle}
          selectedCountLabel={
            <span className="font-nunito text-sm text-text-secondary">
              {draft.characterFeatIds.length} / 1
            </span>
          }
        />
      ) : (
        <>
          {hasLayer1Options ? (
            <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
              {options.map((feat) =>
                feat ? (
                  <GuidedChoiceCard
                    key={feat.id}
                    density="compact"
                    title={feat.name}
                    description={feat.description}
                    selected={draft.characterFeatIds[0] === String(feat.id)}
                    onSelect={() => updateDraft({ characterFeatIds: [String(feat.id)] })}
                    expandedExtra={
                      getFeatRestrictionNotice(feat) ? (
                        <GuidedFeatRestrictionNotice feat={feat} />
                      ) : undefined
                    }
                  />
                ) : null
              )}
            </div>
          ) : (
            <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
          )}

          <GuidedLayerNav expandLabel={stepCopy.seeMore} onExpand={() => setBrowseOpen(true)} />

          {browseOpen ? (
            <GuidedFeatsL2Modal
              isOpen
              featType="character"
              feats={feats}
              recommendedIds={recommendedIds}
              initialSelectedIds={draft.characterFeatIds}
              maxSelections={1}
              requirementCharacter={requirementCharacter}
              onClose={() => setBrowseOpen(false)}
              onConfirm={(ids) => updateDraft({ characterFeatIds: ids.slice(0, 1) })}
            />
          ) : null}
        </>
      )}
    </GuidedStepLayout>
  );
}
