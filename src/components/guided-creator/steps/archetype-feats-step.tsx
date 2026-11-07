/**
 * Archetype feats — path guidance groups (L1) + L2 add modal (TASK-565).
 */

'use client';

import { useMemo, useCallback, useLayoutEffect, useState } from 'react';
import { Alert, EmptyState, Spinner } from '@/components/ui';
import { GuidedInlineCatalogList, GuidedLayerNav } from '@/components/patterns';
import { cn } from '@/lib/utils';
import { useCodexFeats, useCodexSkills, useGameRules, usePathListFilter, type Feat } from '@/hooks';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import {
  applyCappedIdSelection,
  guidedDraftToFeatRequirementCharacter,
  selectableCuratedFeatIds,
  trimArchetypeFeatIdsToCap,
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
import { pathFilterEmptyTitle } from '@/lib/game/path-recommendation-index';
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
  const { rules, isLoading: rulesLoading, error: rulesError } = useGameRules();
  const rulesResolved = !rulesLoading && rulesError == null;
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

  const maxFeats = calculateMaxArchetypeFeats(1, draft.archetypeType ?? undefined, rules);
  const featCap = Math.max(0, maxFeats);
  const pickedCount = draft.archetypeFeatIds.length;
  const featsRemaining = Math.max(0, featCap - pickedCount);
  const showUnderLimitWarning = featCap > 0 && pickedCount < featCap;
  const isOverCap = rulesResolved && pickedCount > featCap;

  useLayoutEffect(() => {
    if (!rulesResolved) return;
    const trimmed = trimArchetypeFeatIdsToCap(draft.archetypeFeatIds, maxFeats);
    if (trimmed) {
      updateDraft({ archetypeFeatIds: trimmed });
    }
  }, [draft.archetypeFeatIds, maxFeats, rulesResolved, updateDraft]);
  const guidanceGroups = pathData?.level1?.guidance_groups;
  const pathFeats = pathData?.level1?.feats;
  const groups = useMemo(() => {
    const filtered = filterFeatGuidanceGroups(guidanceGroups, 'archetype');
    return filtered.length > 0 ? filtered : EMPTY_GUIDANCE_GROUPS;
  }, [guidanceGroups]);
  const fallbackFeatIds = pathFeats ?? EMPTY_STRING_ARRAY;

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const recommendedIds = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach((g) => g.feats?.forEach((id) => ids.add(String(id))));
    fallbackFeatIds.forEach((id) => ids.add(String(id)));
    return Array.from(ids);
  }, [groups, fallbackFeatIds]);

  const requirementCharacter = useMemo(() => guidedDraftToFeatRequirementCharacter(draft), [draft]);

  const selectFeat = useCallback(
    (id: string) => {
      const cap = rulesResolved ? maxFeats : Number.POSITIVE_INFINITY;
      updateDraft({
        archetypeFeatIds: applyCappedIdSelection(draft.archetypeFeatIds, id, cap),
      });
    },
    [draft.archetypeFeatIds, maxFeats, rulesResolved, updateDraft],
  );

  /** Curated cards honour requirements like the catalog does (report 03 P1-10). */
  const selectableIds = useCallback(
    (ids: readonly (string | number)[]) =>
      selectableCuratedFeatIds({
        ids,
        feats,
        selectedIds: draft.archetypeFeatIds,
        requirementCharacter,
        codexSkills,
      }),
    [feats, draft.archetypeFeatIds, requirementCharacter, codexSkills],
  );

  const canContinue = !isLoading && rulesResolved && !isOverCap;

  // Inline (L3) catalog — same builders as GuidedFeatsL2Modal so filtering/eligibility
  // (requirements, capped selection) stay identical whether shown in-page or in a modal.
  const [inlineCategories, setInlineCategories] = useState<string[]>([]);
  const [inlineStateFeatMode, setInlineStateFeatMode] = useState<StateFeatFilterMode>('all');
  const {
    selectedPathIds: inlineSelectedPathIds,
    setSelectedPathIds: setInlineSelectedPathIds,
    pathIndex: inlinePathIndex,
    pathFilterActive: inlinePathFilterActive,
  } = usePathListFilter({ entities: feats, kind: 'feats' });

  const { categories: inlineCategoryOptions } = useMemo(
    () => buildGuidedFeatsL2FilterOptions(feats, 'archetype'),
    [feats],
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
        pathIndex: inlinePathIndex,
        selectedPathIds: inlineSelectedPathIds,
      }),
    [
      feats,
      draft.archetypeFeatIds,
      requirementCharacter,
      codexSkills,
      inlineCategories,
      inlineStateFeatMode,
      inlinePathIndex,
      inlineSelectedPathIds,
    ],
  );

  const inlineActiveFilterCount =
    inlineCategories.length +
    (inlineStateFeatMode !== 'all' ? 1 : 0) +
    (inlinePathFilterActive ? 1 : 0);

  const selectedIdSet = useMemo(
    () => new Set(draft.archetypeFeatIds.map(String)),
    [draft.archetypeFeatIds],
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
        {selectableIds(group.feats ?? []).map((id) => renderFeatCard(id))}
      </div>
    </section>
  );

  const visibleGroups = useMemo(
    () => groups.filter((g) => selectableIds(g.feats ?? []).length > 0),
    [groups, selectableIds],
  );
  const visibleFallbackIds = useMemo(
    () => selectableIds(fallbackFeatIds),
    [fallbackFeatIds, selectableIds],
  );
  const hasCuratedSource = groups.length > 0 || fallbackFeatIds.length > 0;
  const hasLayer1Options = visibleGroups.length > 0 || visibleFallbackIds.length > 0;

  return (
    <GuidedStepLayout
      subStep="archetype-feats"
      title={stepCopy.title}
      description={stepCopy.description(maxFeats, archetype?.name)}
      canContinue={canContinue}
      completionHint={
        <span className="font-nunito">
          {pickedCount} / {maxFeats}
        </span>
      }
    >
      {showUnderLimitWarning ? (
        <Alert variant="warning" className="mb-4 font-nunito text-sm">
          {stepCopy.underLimit(featsRemaining)}
        </Alert>
      ) : null}
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
          emptyMessage={
            inlinePathFilterActive ? pathFilterEmptyTitle('feats') : l2Copy.emptyMessage
          }
          searchPlaceholder={l2Copy.searchPlaceholder}
          searchFields={FEATS_L2_SEARCH_FIELDS}
          filterContent={
            <GuidedFeatsFilterFields
              categories={inlineCategoryOptions}
              selectedCategories={inlineCategories}
              onAddCategory={(v) => setInlineCategories((prev) => [...prev, v])}
              onRemoveCategory={(v) => setInlineCategories((prev) => prev.filter((c) => c !== v))}
              stateFeatMode={inlineStateFeatMode}
              onStateFeatModeChange={setInlineStateFeatMode}
              pathFilter={{
                options: inlinePathIndex.options,
                selectedPathIds: inlineSelectedPathIds,
                onChange: setInlineSelectedPathIds,
              }}
            />
          }
          showFilters
          optionsActiveCount={inlineActiveFilterCount}
          selectedTitle={l2Copy.archetypeSelectedTitle}
          selectedCountLabel={
            <span className="font-nunito text-sm text-text-secondary">
              {pickedCount} / {maxFeats}
            </span>
          }
        />
      ) : (
        <>
          {hasLayer1Options ? (
            visibleGroups.length > 0 ? (
              <div className="space-y-8">
                <p className="font-nunito text-sm text-text-secondary">{stepCopy.groupIntro}</p>
                {visibleGroups.map(renderGroupSection)}
              </div>
            ) : (
              <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
                {visibleFallbackIds
                  .slice(0, Math.max(maxFeats, 1) * 3)
                  .map((id) => renderFeatCard(id))}
              </div>
            )
          ) : (
            <EmptyState
              title={hasCuratedSource ? stepCopy.emptyFilteredTitle : stepCopy.emptyTitle}
              description={
                hasCuratedSource ? stepCopy.emptyFilteredDescription : stepCopy.emptyDescription
              }
            />
          )}

          <GuidedLayerNav expandLabel={stepCopy.seeMore} onExpand={() => setBrowseOpen(true)} />

          {browseOpen ? (
            <GuidedFeatsL2Modal
              isOpen
              featType="archetype"
              feats={feats}
              recommendedIds={recommendedIds}
              initialSelectedIds={draft.archetypeFeatIds}
              maxSelections={rulesResolved ? maxFeats : undefined}
              allowConfirmWhenOverMax
              requirementCharacter={requirementCharacter}
              autoSelectPathType={draft.archetypeType}
              onClose={() => setBrowseOpen(false)}
              onConfirm={(ids) =>
                updateDraft({
                  archetypeFeatIds: rulesResolved ? ids.slice(0, Math.max(0, maxFeats)) : ids,
                })
              }
            />
          ) : null}
        </>
      )}
    </GuidedStepLayout>
  );
}
