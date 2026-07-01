/**
 * Archetype feats — path guidance groups with individual feat picks.
 */

'use client';

import { useMemo, useCallback } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCodexFeats } from '@/hooks';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import type { PathGuidanceGroup } from '@/types/archetype';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;

function resolveFeat(
  id: string,
  featById: Map<string, { name?: string; description?: string | null }>
) {
  const key = String(id);
  const feat = featById.get(key);
  return {
    id: key,
    name: feat?.name ?? key,
    description: feat?.description,
  };
}

export function ArchetypeFeatsStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();

  const maxFeats = calculateMaxArchetypeFeats(1, draft.archetypeType ?? undefined);
  const groups = pathData?.level1?.guidance_groups?.filter((g) => g.feats?.length) ?? [];
  const fallbackFeatIds = pathData?.level1?.feats ?? [];

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const toggleFeat = useCallback(
    (id: string) => {
      const key = String(id);
      if (draft.archetypeFeatIds.includes(key)) {
        updateDraft({
          archetypeFeatIds: draft.archetypeFeatIds.filter((x) => x !== key),
        });
        return;
      }
      if (draft.archetypeFeatIds.length >= maxFeats) return;
      updateDraft({ archetypeFeatIds: [...draft.archetypeFeatIds, key] });
    },
    [draft.archetypeFeatIds, maxFeats, updateDraft]
  );

  const canContinue = draft.archetypeFeatIds.length >= maxFeats;

  const renderFeatCard = (id: string) => {
    const feat = resolveFeat(id, featById);
    const selected = draft.archetypeFeatIds.includes(feat.id);
    const atCap = draft.archetypeFeatIds.length >= maxFeats && !selected;

    return (
      <GuidedChoiceCard
        key={feat.id}
        density="compact"
        title={feat.name}
        description={feat.description}
        selected={selected}
        onSelect={() => !atCap && toggleFeat(feat.id)}
        className={atCap ? 'opacity-60 cursor-not-allowed' : undefined}
        selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${feat.name}`}
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
      ) : groups.length === 0 && fallbackFeatIds.length === 0 ? (
        <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
      ) : groups.length > 0 ? (
        <div className="space-y-8">
          <p className="font-nunito text-sm text-text-secondary">{stepCopy.groupIntro}</p>
          {groups.map(renderGroupSection)}
        </div>
      ) : (
        <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
          {fallbackFeatIds.slice(0, maxFeats * 3).map((id) => renderFeatCard(String(id)))}
        </div>
      )}
    </GuidedStepLayout>
  );
}
