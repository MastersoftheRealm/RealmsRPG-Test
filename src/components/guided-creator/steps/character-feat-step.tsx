/**
 * Character feat — identity / non-combat expression (1 at level 1).
 * Layer 1: path-curated cards; Layer 2: filtered browse of all character feats.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { useCodexFeats } from '@/hooks';
import { guidedDraftToFeatRequirementCharacter } from '@/lib/guided-creator/feat-selection';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GuidedFeatRestrictionNotice } from '../guided-feat-restriction-notice';
import { GuidedFeatsBrowsePanel } from '../guided-feats-browse-panel';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { filterFeatGuidanceGroups } from '@/lib/game/archetype-path';
import { EMPTY_GUIDANCE_GROUPS } from '@/lib/empty';

const stepCopy = GUIDED_CREATOR_COPY.steps.characterFeat;
const layerNavCopy = GUIDED_CREATOR_COPY.layerNav;

export function CharacterFeatStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const { data: feats = [], isLoading } = useCodexFeats();
  const [browsing, setBrowsing] = useState(false);

  const guidanceGroups = pathData?.level1?.guidance_groups;
  const characterFeatGroups = useMemo(
    () => {
      const filtered = filterFeatGuidanceGroups(guidanceGroups, 'character');
      return filtered.length > 0 ? filtered : EMPTY_GUIDANCE_GROUPS;
    },
    [guidanceGroups]
  );

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
      ) : browsing || !hasLayer1Options ? (
        <>
          <GuidedFeatsBrowsePanel
            featType="character"
            feats={feats}
            selectedIds={draft.characterFeatIds}
            maxSelections={1}
            onSelectionChange={(ids) => updateDraft({ characterFeatIds: ids })}
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
          <GuidedLayerNav expandLabel={stepCopy.seeMore} onExpand={() => setBrowsing(true)} />
        </>
      )}
    </GuidedStepLayout>
  );
}
