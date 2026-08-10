/**
 * Archetype feats — path guidance groups (L1) + L2 add modal (TASK-565).
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { EmptyState, Spinner } from '@/components/ui';
import { GuidedInlineCatalogList, GuidedLayerNav } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useCodexFeats, useCodexSkills, type Feat } from '@/hooks';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import {
  applyCappedIdSelection,
  guidedDraftToFeatRequirementCharacter,
} from '@/lib/guided-creator/feat-selection';
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
import { GuidedSectionTitle } from '../guided-section-title';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { filterFeatGuidanceGroups } from '@/lib/game/archetype-path';
import { EMPTY_GUIDANCE_GROUPS, EMPTY_STRING_ARRAY } from '@/lib/empty';
import type { PathGuidanceGroup } from '@/types/archetype';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;
const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

function resolveFeat(id: string, featById: Map<string, Feat>) {
  const key = String(id);
  const feat = featById.get(key);
  return {
    id: key,
    name: feat?.name ?? key,
    description: feat?.description,
    codex: feat,
  };
}

export function ArchetypeFeatsStep() {
  const { draft, updateDraft, navigationIntent, entryNonce } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
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

  const maxFeats = calculateMaxArchetypeFeats(1, draft.archetypeType ?? undefined);
  const guidanceGroups = pathData?.level1?.guidance_groups;
  const pathFeats = pathData?.level1?.feats;
  const groups = useMemo(
    () => {
      const filtered = filterFeatGuidanceGroups(guidanceGroups, 'archetype');
      return filtered.length > 0 ? filtered : EMPTY_GUIDANCE_GROUPS;
    },
    [guidanceGroups]
  );
  const fallbackFeatIds = pathFeats ?? EMPTY_STRING_ARRAY;

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const recommendedIds = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach((g) => g.feats?.forEach((id) => ids.add(String(id))));
    fallbackFeatIds.forEach((id) => ids.add(String(id)));
    return Array.from(ids);
  }, [groups, fallbackFeatIds]);

  const requirementCharacter = useMemo(
    () => guidedDraftToFeatRequirementCharacter(draft),
    [draft]
  );

  const selectFeat = useCallback(
    (id: string) => {
      updateDraft({
        archetypeFeatIds: applyCappedIdSelection(draft.archetypeFeatIds, id, maxFeats),
      });
    },
    [draft.archetypeFeatIds, maxFeats, updateDraft]
  );

  const canContinue = draft.archetypeFeatIds.length === maxFeats;

  // Inline (L3) catalog — same builders as GuidedFeatsL2Modal so filtering/eligibility
  // (requirements, capped selection) stay identical whether shown in-page or in a modal.
  const [inlineCategories, setInlineCategories] = useState<string[]>([]);
  const [inlineStateFeatMode, setInlineStateFeatMode] = useState<StateFeatFilterMode>('all');

  const { categories: inlineCategoryOptions } = useMemo(
    () => buildGuidedFeatsL2FilterOptions(feats, 'archetype'),
    [feats]
  );

  const inlineItems = useMemo(
    () =>
      buildGuidedFeatsL2Items({
        featType: 'archetype',
        feats,
        recommendedIds: EMPTY_STRING_ARRAY,
        selectedIds: draft.archetypeFeatIds,
        requirementCharacter,
        codexSkills,
        categories: inlineCategories,
        stateFeatMode: inlineStateFeatMode,
      }),
    [
      feats,
      draft.archetypeFeatIds,
      requirementCharacter,
      codexSkills,
      inlineCategories,
      inlineStateFeatMode,
    ]
  );

  const inlineActiveFilterCount =
    inlineCategories.length + (inlineStateFeatMode !== 'all' ? 1 : 0);

  const selectedIdSet = useMemo(
    () => new Set(draft.archetypeFeatIds.map(String)),
    [draft.archetypeFeatIds]
  );

  const renderFeatCard = (id: string) => {
    const feat = resolveFeat(id, featById);
    const selected = draft.archetypeFeatIds.includes(feat.id);

    return (
      <GuidedChoiceCard
        key={feat.id}
        density="compact"
        title={feat.name}
        description={feat.description}
        selected={selected}
        onSelect={() => selectFeat(feat.id)}
        selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${feat.name}`}
        expandedExtra={
          feat.codex && getFeatRestrictionNotice(feat.codex) ? (
            <GuidedFeatRestrictionNotice feat={feat.codex} />
          ) : undefined
        }
      />
    );
  };

  const renderGroupSection = (group: PathGuidanceGroup) => (
    <section key={group.id}>
      <GuidedSectionTitle>{group.title}</GuidedSectionTitle>
      {group.why ? (
        <p className="mt-1 font-nunito text-sm text-text-secondary">{group.why}</p>
      ) : null}
      <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
        {(group.feats ?? []).map((id) => renderFeatCard(String(id)))}
      </div>
    </section>
  );

  const hasLayer1Options = groups.length > 0 || fallbackFeatIds.length > 0;

  return (
    <GuidedStepLayout
      subStep="archetype-feats"
      title={stepCopy.title}
      description={stepCopy.description(maxFeats, archetype?.name)}
      canContinue={canContinue}
      completionHint={
        <span className="font-nunito">
          {draft.archetypeFeatIds.length} / {maxFeats}
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
          maxSelections={maxFeats}
          selectionLimitMessage={maxFeats <= 0 ? l2Copy.overLimitZero : l2Copy.overLimit(maxFeats)}
          selectedTitle={l2Copy.archetypeSelectedTitle}
          selectedCountLabel={
            <span className="font-nunito text-sm text-text-secondary">
              {draft.archetypeFeatIds.length} / {maxFeats}
            </span>
          }
        />
      ) : (
        <>
          {hasLayer1Options ? (
            groups.length > 0 ? (
              <div className="space-y-8">
                <p className="font-nunito text-sm text-text-secondary">{stepCopy.groupIntro}</p>
                {groups.map(renderGroupSection)}
              </div>
            ) : (
              <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
                {fallbackFeatIds.slice(0, maxFeats * 3).map((id) => renderFeatCard(String(id)))}
              </div>
            )
          ) : (
            <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
          )}

          <GuidedLayerNav expandLabel={stepCopy.seeMore} onExpand={() => setBrowseOpen(true)} />

          {browseOpen ? (
            <GuidedFeatsL2Modal
              isOpen
              featType="archetype"
              feats={feats}
              recommendedIds={recommendedIds}
              initialSelectedIds={draft.archetypeFeatIds}
              maxSelections={maxFeats}
              requirementCharacter={requirementCharacter}
              onClose={() => setBrowseOpen(false)}
              onConfirm={(ids) => updateDraft({ archetypeFeatIds: ids })}
            />
          ) : null}
        </>
      )}
    </GuidedStepLayout>
  );
}
