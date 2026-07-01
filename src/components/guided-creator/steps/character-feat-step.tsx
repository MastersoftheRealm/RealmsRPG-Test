/**
 * Character feat — identity / non-combat expression (1 at level 1).
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useCodexFeats } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.characterFeat;

export function CharacterFeatStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();

  const characterFeatGroups =
    pathData?.level1?.guidance_groups?.filter((g) => g.feats?.length && g.title.toLowerCase().includes('character')) ??
    [];

  const characterFeatsFromCodex = useMemo(
    () => feats.filter((f) => f.char_feat),
    [feats]
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
    if (ids.size === 0) {
      characterFeatsFromCodex.slice(0, 12).forEach((f) => ids.add(String(f.id)));
    }
    return Array.from(ids)
      .map((id) => feats.find((f) => String(f.id) === id))
      .filter(Boolean);
  }, [characterFeatGroups, characterFeatsFromCodex, feats]);

  return (
    <GuidedStepLayout
      subStep="character-feat"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={draft.characterFeatIds.length === 1}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : options.length === 0 ? (
        <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
      ) : (
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
              />
            ) : null
          )}
        </div>
      )}
    </GuidedStepLayout>
  );
}
