/**
 * Abilities — path-recommended array applied by default; optional customize.
 */

'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { AbilityScoreGrid, GuidedLayerNav } from '@/components/shared';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedAbilitiesCustomizePanel } from '../guided-abilities-customize-panel';
import { calculateAbilityPoints, calculateAbilityScoreCost } from '@/lib/game/formulas';
import { resolveGuidedRecommendedAbilities } from '@/lib/guided-creator/build-character';
import type { AbilityName } from '@/types';
import { useGameRules } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.abilities;
const layerNavCopy = GUIDED_CREATOR_COPY.layerNav;

export function AbilitiesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { archetype, pathData } = useGuidedPathData();
  const { rules } = useGameRules();
  const [customizing, setCustomizing] = useState(draft.abilitiesMode === 'custom');

  const primary = draft.pow_abil ?? draft.mart_abil ?? archetype?.archetype_ability ?? null;
  const secondary = draft.mart_abil ?? archetype?.secondary_ability ?? null;
  const powerAbilityProp =
    draft.archetypeType === 'martial' ? undefined : (draft.pow_abil ?? primary ?? undefined);
  const martialAbilityProp =
    draft.archetypeType === 'power'
      ? undefined
      : draft.archetypeType === 'powered-martial'
        ? (draft.mart_abil ?? secondary ?? undefined)
        : (draft.mart_abil ?? primary ?? undefined);

  const recommended = useMemo(
    () => resolveGuidedRecommendedAbilities(pathData, primary, secondary),
    [pathData, primary, secondary]
  );

  const displayAbilities =
    !customizing && recommended && draft.abilitiesMode !== 'custom'
      ? recommended
      : draft.abilities;

  const totalPoints = calculateAbilityPoints(1, false, rules);
  const spentPoints = useMemo(
    () =>
      Object.values(draft.abilities).reduce((sum, val) => sum + calculateAbilityScoreCost(val || 0), 0),
    [draft.abilities]
  );

  useEffect(() => {
    if (!recommended || customizing || draft.abilitiesMode === 'custom') return;
    updateDraft({ abilities: recommended, abilitiesMode: 'recommended' });
  }, [recommended, customizing, draft.abilitiesMode, updateDraft]);

  const applyRecommended = useCallback(() => {
    if (!recommended) return;
    updateDraft({ abilities: recommended, abilitiesMode: 'recommended' });
    setCustomizing(false);
  }, [recommended, updateDraft]);

  const handleAbilityChange = (ability: AbilityName, value: number) => {
    updateDraft({
      abilities: { ...draft.abilities, [ability]: value },
      abilitiesMode: 'custom',
    });
  };

  const canContinue =
    draft.abilitiesMode === 'recommended' ||
    (customizing && spentPoints === totalPoints);

  return (
    <GuidedStepLayout
      subStep="abilities"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={canContinue}
    >
      {!customizing && recommended && (
        <>
          <div className="rounded-card border border-primary-subtle-border bg-primary-subtle-bg/60 p-5">
            <p className="font-display text-lg font-semibold text-text-primary">
              {stepCopy.recommendedHeading(archetype?.name ?? 'your path')}
            </p>
            <p className="mt-1 font-nunito text-sm text-text-secondary">{stepCopy.recommendedHint}</p>
            <div className="mt-4">
              <AbilityScoreGrid
                abilities={displayAbilities}
                powerAbility={powerAbilityProp}
                martialAbility={martialAbilityProp}
                mode="display"
              />
            </div>
          </div>
          <GuidedLayerNav
            expandLabel={stepCopy.customize}
            onExpand={() => setCustomizing(true)}
          />
        </>
      )}

      {(customizing || !recommended) && (
        <>
          <GuidedAbilitiesCustomizePanel
            abilities={draft.abilities}
            totalPoints={totalPoints}
            spentPoints={spentPoints}
            onAbilityChange={handleAbilityChange}
            powerAbility={powerAbilityProp}
            martialAbility={martialAbilityProp}
          />
          {recommended ? (
            <GuidedLayerNav
              collapseLabel={layerNavCopy.backToRecommendations}
              onCollapse={applyRecommended}
            />
          ) : null}
        </>
      )}
    </GuidedStepLayout>
  );
}
