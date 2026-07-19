/**
 * Character feat — identity / non-combat expression (1 at level 1).
 * Layer 1: path-curated cards; Layer 2: add modal (TASK-565).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, Spinner } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { useCodexFeats } from '@/hooks';
import { guidedDraftToFeatRequirementCharacter } from '@/lib/guided-creator/feat-selection';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GuidedFeatRestrictionNotice } from '../guided-restriction-notice';
import { GuidedFeatsL2Modal } from '../guided-feats-l2-modal';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { filterFeatGuidanceGroups } from '@/lib/game/archetype-path';
import { EMPTY_GUIDANCE_GROUPS } from '@/lib/empty';

const stepCopy = GUIDED_CREATOR_COPY.steps.characterFeat;

export function CharacterFeatStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();
  const [browseOpen, setBrowseOpen] = useState(false);

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
