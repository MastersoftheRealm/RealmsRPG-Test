/**
 * Archetype feats — path guidance groups (L1) + filtered browse (L2).
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useCodexFeats, type Feat } from '@/hooks';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import {
  applyCappedIdSelection,
  guidedDraftToFeatRequirementCharacter,
} from '@/lib/guided-creator/feat-selection';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GuidedFeatRestrictionNotice } from '../guided-feat-restriction-notice';
import { GuidedFeatsBrowsePanel } from '../guided-feats-browse-panel';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import type { PathGuidanceGroup } from '@/types/archetype';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;
const layerNavCopy = GUIDED_CREATOR_COPY.layerNav;

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
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();
  const [browsing, setBrowsing] = useState(false);

  const maxFeats = calculateMaxArchetypeFeats(1, draft.archetypeType ?? undefined);
  const groups = pathData?.level1?.guidance_groups?.filter((g) => g.feats?.length) ?? [];
  const fallbackFeatIds = pathData?.level1?.feats ?? [];

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

  const canContinue = draft.archetypeFeatIds.length >= maxFeats;

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
      <h3 className="font-display text-lg font-semibold text-text-primary">{group.title}</h3>
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
      ) : browsing || !hasLayer1Options ? (
        <>
          <GuidedFeatsBrowsePanel
            featType="archetype"
            feats={feats}
            selectedIds={draft.archetypeFeatIds}
            maxSelections={maxFeats}
            onSelectionChange={(ids) => updateDraft({ archetypeFeatIds: ids })}
            recommendedIds={recommendedIds}
            requirementCharacter={requirementCharacter}
          />
          {hasLayer1Options ? (
            <GuidedLayerNav
              collapseLabel={layerNavCopy.backToRecommendations}
              onCollapse={() => setBrowsing(false)}
            />
          ) : null}
        </>
      ) : (
        <>
          {groups.length > 0 ? (
            <div className="space-y-8">
              <p className="font-nunito text-sm text-text-secondary">{stepCopy.groupIntro}</p>
              {groups.map(renderGroupSection)}
            </div>
          ) : (
            <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
              {fallbackFeatIds.slice(0, maxFeats * 3).map((id) => renderFeatCard(String(id)))}
            </div>
          )}
          <GuidedLayerNav expandLabel={stepCopy.seeMore} onExpand={() => setBrowsing(true)} />
        </>
      )}
    </GuidedStepLayout>
  );
}
