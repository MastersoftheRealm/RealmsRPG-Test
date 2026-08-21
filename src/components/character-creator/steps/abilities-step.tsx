/**
 * Abilities Step
 * ==============
 * Allocate ability points during character creation
 * Uses shared AbilityScoreEditor component for consistent UI
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { AbilityScoreEditor } from '@/components/creator';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { GuidedChoiceShell, InfoTippy, PathHelpCard, PathNotes } from '@/components/patterns';
import { Button } from '@/components/ui';
import { calculateAbilityPoints, calculateAbilityScoreCost } from '@/lib/game/formulas';
import { buildSuggestedAbilityArray } from '@/lib/game/suggested-abilities';
import { ABILITY_EFFECT_BLURBS, formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { getStepCompletion } from '@/lib/character-creator-validation';
import { DEFAULT_ABILITIES, type AbilityName } from '@/types';
import { getAbilityPointsHelp } from '../../../../public/tooltip-text';
import { useGameRules, useCreatorPathData } from '@/hooks';

export function AbilitiesStep() {
  const {
    draft,
    updateAbility,
    updateDraft,
    nextStep,
    prevStep,
    getStepLayer,
    expandLayer,
    collapseLayer,
  } = useCharacterCreatorStore();
  const { rules } = useGameRules();
  const level = draft.level || 1;
  const layer = getStepLayer('abilities');
  const abilities = useMemo(() => draft.abilities ?? { ...DEFAULT_ABILITIES }, [draft.abilities]);

  const totalPoints = useMemo(() => calculateAbilityPoints(level), [level]);

  const spentPoints = useMemo(() => {
    return Object.values(abilities).reduce(
      (sum, val) => sum + calculateAbilityScoreCost(val || 0),
      0,
    );
  }, [abilities]);

  const remainingPoints = totalPoints - spentPoints;
  const completion = useMemo(
    () => getStepCompletion('abilities', draft, { allSpecies: [], codexSkills: null }),
    [draft],
  );
  const pathMode = draft.creationMode === 'path';
  const canContinue = pathMode && layer === 1 ? completion.done : remainingPoints === 0;

  const pathPrimaryAbility = (draft.archetype?.archetype_ability ||
    draft.pow_abil ||
    draft.mart_abil) as AbilityName | undefined;
  const pathSecondaryAbility = draft.archetype?.secondary_ability as AbilityName | undefined;
  const powerAbility = (draft.pow_abil || pathPrimaryAbility) as AbilityName | undefined;
  const martialAbility = (draft.mart_abil || pathSecondaryAbility) as AbilityName | undefined;
  const pathNotes = useCreatorPathData()?.level1?.notes;
  const abilityPointsHelp = useMemo(() => getAbilityPointsHelp(level, rules), [level, rules]);

  const applySuggested = useCallback(() => {
    const suggested = buildSuggestedAbilityArray(level, pathPrimaryAbility, pathSecondaryAbility);
    updateDraft({ abilities: suggested });
  }, [level, pathPrimaryAbility, pathSecondaryAbility, updateDraft]);

  const guidance = (
    <>
      {pathMode && draft.archetype?.name && (
        <PathHelpCard pathName={draft.archetype.name}>
          {pathPrimaryAbility ? (
            <>
              Prioritize{' '}
              <strong className="text-primary-fg capitalize">{pathPrimaryAbility}</strong>
              {pathSecondaryAbility ? (
                <>
                  {' '}
                  and <strong className="text-primary-fg capitalize">{pathSecondaryAbility}</strong>
                </>
              ) : null}
              . Use the suggested array or customize below.
            </>
          ) : (
            'Use the suggested array or assign points yourself.'
          )}
        </PathHelpCard>
      )}
      {pathMode && draft.archetype?.name && (
        <PathNotes pathName={draft.archetype.name} notes={pathNotes} />
      )}
    </>
  );

  const layer1Content = (
    <div className="space-y-4">
      {pathPrimaryAbility && (
        <div className="rounded-xl border border-primary-subtle-border bg-primary-subtle-bg/50 p-4">
          <p className="mb-2 text-sm font-semibold text-text-primary">Suggested for your path</p>
          <p className="mb-3 text-sm text-text-secondary">
            One click applies a balanced array favoring{' '}
            <span className="font-medium text-primary-fg capitalize">{pathPrimaryAbility}</span>
            {pathSecondaryAbility ? (
              <>
                {' '}
                and{' '}
                <span className="font-medium text-primary-fg capitalize">
                  {pathSecondaryAbility}
                </span>
              </>
            ) : null}
            .
          </p>
          <Button type="button" onClick={applySuggested} className="min-h-11">
            Apply suggested abilities
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(Object.keys(ABILITY_EFFECT_BLURBS) as AbilityName[]).map((key) => (
          <p
            key={key}
            className={`rounded-lg border px-3 py-2 text-xs ${
              key === pathPrimaryAbility || key === pathSecondaryAbility
                ? 'border-primary-subtle-border bg-primary-subtle-bg text-text-primary'
                : 'border-border-light bg-surface-alt text-text-secondary'
            }`}
          >
            <span className="font-semibold">{formatAbilityLabel(key)}:</span>{' '}
            {ABILITY_EFFECT_BLURBS[key]}
          </p>
        ))}
      </div>
    </div>
  );

  const fullEditor = (
    <AbilityScoreEditor
      abilities={abilities}
      totalPoints={totalPoints}
      onAbilityChange={updateAbility}
      maxAbility={3}
      minAbility={-2}
      maxNegativeSum={-3}
      isEditMode={true}
      powerAbility={powerAbility}
      martialAbility={martialAbility}
    />
  );

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col">
      {!pathMode && (
        <div className="mb-2 flex items-center gap-1">
          <h2 className="text-2xl font-bold text-text-primary">Assign Abilities</h2>
          <InfoTippy content={abilityPointsHelp} label="Ability point rules" />
        </div>
      )}

      {pathMode ? (
        <GuidedChoiceShell
          layer={layer}
          title="Assign Abilities"
          titleAddon={<InfoTippy content={abilityPointsHelp} label="Ability point rules" />}
          description="Distribute ability points. Path abilities are highlighted; expand for full point-buy."
          guidance={guidance}
          completionState={completion}
          onExpandLayer={() => expandLayer('abilities')}
          onCollapseLayer={() => collapseLayer('abilities')}
          expandLabel={layer === 1 ? 'Customize abilities (full editor)' : 'See all options'}
          canExpand={layer === 1}
        >
          {layer === 1 ? layer1Content : fullEditor}
        </GuidedChoiceShell>
      ) : (
        <>
          <p className="mb-6 text-text-secondary">
            Distribute your ability points. You can reduce abilities below 0 to gain extra points.
            {powerAbility && (
              <span className="text-power-fg"> Power archetype ability highlighted.</span>
            )}
            {martialAbility && (
              <span className="text-martial-fg"> Martial archetype ability highlighted.</span>
            )}
          </p>
          <div className="mb-8">{fullEditor}</div>
        </>
      )}

      <CreatorStepFooter
        onBack={prevStep}
        onContinue={nextStep}
        continueDisabled={!canContinue}
        completionHint={
          remainingPoints !== 0 ? (
            <span>
              {remainingPoints > 0
                ? `${remainingPoints} point${remainingPoints === 1 ? '' : 's'} left`
                : `${Math.abs(remainingPoints)} over budget`}
            </span>
          ) : (
            <span className="text-success-fg">✓ All points spent</span>
          )
        }
      />
    </div>
  );
}
