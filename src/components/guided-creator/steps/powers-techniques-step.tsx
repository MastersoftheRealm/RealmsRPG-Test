/**
 * Powers OR Techniques — step title depends on archetype (never both).
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-grid';
import { GuidedStepLayout } from '../guided-step-layout';
import type { ArchetypeCategory } from '@/types';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

function stepCopy(type: ArchetypeCategory | null): { title: string; description: string; kind: 'powers' | 'techniques' } {
  if (type === 'martial') {
    return { ...ptCopy.martial, kind: 'techniques' as const };
  }
  if (type === 'powered-martial') {
    return { ...ptCopy.poweredMartial, kind: 'powers' as const };
  }
  return { ...ptCopy.power, kind: 'powers' as const };
}

export function PowersTechniquesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const copy = stepCopy(draft.archetypeType);

  const recommendedIds = useMemo(() => {
    if (copy.kind === 'techniques') {
      return (pathData?.level1?.techniques ?? []).map(String);
    }
    return (pathData?.level1?.powers ?? []).map(String);
  }, [copy.kind, pathData]);

  const groups =
    pathData?.level1?.guidance_groups?.filter((g) =>
      copy.kind === 'techniques' ? g.techniques?.length : g.powers?.length
    ) ?? [];

  useEffect(() => {
    if (copy.kind === 'techniques' && draft.techniqueIds.length === 0 && recommendedIds.length > 0) {
      updateDraft({ techniqueIds: recommendedIds });
    }
    if (copy.kind === 'powers' && draft.powerIds.length === 0 && recommendedIds.length > 0) {
      updateDraft({ powerIds: recommendedIds });
    }
  }, [copy.kind, recommendedIds, draft.techniqueIds.length, draft.powerIds.length, updateDraft]);

  const selectedIds = copy.kind === 'techniques' ? draft.techniqueIds : draft.powerIds;

  const selectGroup = (ids: string[]) => {
    if (copy.kind === 'techniques') {
      updateDraft({ techniqueIds: ids });
    } else {
      updateDraft({ powerIds: ids });
    }
  };

  const canContinue = selectedIds.length > 0 || recommendedIds.length === 0;

  return (
    <GuidedStepLayout
      subStep="powers-techniques"
      title={copy.title}
      description={copy.description}
      canContinue={canContinue}
      continueLabel={GUIDED_CREATOR_COPY.steps.skills.continueLabel}
    >
      {groups.length > 0 ? (
        <div className={GUIDED_CHOICE_GRID_CLASS}>
          {groups.map((group) => {
            const ids = (copy.kind === 'techniques' ? group.techniques : group.powers) ?? [];
            const selected = ids.length > 0 && ids.every((id) => selectedIds.includes(String(id)));
            return (
              <GuidedChoiceCard
                key={group.id}
                className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                title={group.title}
                tagline={group.why ?? `${ids.length} recommended`}
                selected={selected}
                onSelect={() => selectGroup(ids.map(String))}
              />
            );
          })}
        </div>
      ) : recommendedIds.length === 0 ? (
        <EmptyState
          title={ptCopy.emptyTitle(copy.kind)}
          description={ptCopy.emptyDescription(copy.kind)}
        />
      ) : (
        <p className="font-nunito text-text-secondary">
          {selectedIds.length} {copy.kind} included from your path. Continue when ready.
        </p>
      )}
    </GuidedStepLayout>
  );
}
