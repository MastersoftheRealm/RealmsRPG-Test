/**
 * Equipment loadout — coherent kits from path loadouts or level-1 armaments.
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_STYLES } from '../guided-choice-styles';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-grid';
import { GuidedStepLayout } from '../guided-step-layout';
import type { PathLoadout } from '@/types/archetype';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.loadout;

export function LoadoutStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();

  const loadouts: PathLoadout[] = useMemo(() => {
    const fromPath = pathData?.level1?.loadouts ?? [];
    if (fromPath.length > 0) return fromPath;

    const armaments = pathData?.level1?.armamentRecommendations ?? [];
    const equipment = pathData?.level1?.equipmentRecommendations ?? [];
    if (armaments.length === 0 && equipment.length === 0) return [];

    return [
      {
        id: 'path-default',
        title: stepCopy.pathDefaultTitle(archetype?.name ?? 'Path'),
        why: stepCopy.pathDefaultWhy,
        armaments,
        equipment,
      },
    ];
  }, [pathData, archetype?.name]);

  useEffect(() => {
    if (draft.loadoutId || loadouts.length === 0) return;
    const first = loadouts[0];
    updateDraft({
      loadoutId: first.id,
      armaments: first.armaments ?? [],
      equipment: first.equipment ?? [],
    });
  }, [loadouts, draft.loadoutId, updateDraft]);

  const selectLoadout = (loadout: PathLoadout) => {
    updateDraft({
      loadoutId: loadout.id,
      armaments: loadout.armaments ?? [],
      equipment: [...(loadout.equipment ?? []), ...(loadout.armor ?? [])],
    });
  };

  return (
    <GuidedStepLayout
      subStep="loadout"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={Boolean(draft.loadoutId)}
      continueLabel={stepCopy.continueLabel}
    >
      {loadouts.length === 0 ? (
        <EmptyState
          title={stepCopy.emptyTitle}
          description={stepCopy.emptyDescription}
        />
      ) : (
        <div className={GUIDED_CHOICE_GRID_CLASS}>
          {loadouts.map((loadout) => (
            <GuidedChoiceCard
              key={loadout.id}
              className={GUIDED_CHOICE_GRID_ITEM_CLASS}
              title={loadout.title}
              tagline={loadout.why ?? stepCopy.defaultWhy}
              selected={draft.loadoutId === loadout.id}
              onSelect={() => selectLoadout(loadout)}
            >
              <p className={GUIDED_CHOICE_STYLES.meta}>
                {(loadout.armaments?.length ?? 0) + (loadout.armor?.length ?? 0) + (loadout.equipment?.length ?? 0)}{' '}
                items
              </p>
            </GuidedChoiceCard>
          ))}
        </div>
      )}
    </GuidedStepLayout>
  );
}
