/**
 * Abilities Step
 * ==============
 * Allocate ability points during character creation
 * Uses shared AbilityScoreEditor component for consistent UI
 */

'use client';

import { useMemo } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { AbilityScoreEditor } from '@/components/creator';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';
import { ContextHelpTooltip } from '@/components/shared';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { calculateAbilityPoints, calculateAbilityScoreCost } from '@/lib/game/formulas';
import type { AbilityName } from '@/types';

export function AbilitiesStep() {
  const { draft, updateAbility, nextStep, prevStep } = useCharacterCreatorStore();
  const level = draft.level || 1;
  const abilities = draft.abilities || {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  };
  
  // Calculate total points available (vanilla formula)
  const totalPoints = useMemo(() => calculateAbilityPoints(level), [level]);
  
  const spentPoints = useMemo(() => {
    return Object.values(abilities).reduce((sum, val) => sum + calculateAbilityScoreCost(val || 0), 0);
  }, [abilities]);
  
  const remainingPoints = totalPoints - spentPoints;
  const canContinue = remainingPoints === 0;
  
  // Get archetype abilities
  const pathPrimaryAbility = (draft.archetype?.archetype_ability || draft.pow_abil || draft.mart_abil) as AbilityName | undefined;
  const pathSecondaryAbility = draft.archetype?.secondary_ability as AbilityName | undefined;
  const powerAbility = (draft.pow_abil || pathPrimaryAbility) as AbilityName | undefined;
  const martialAbility = (draft.mart_abil || pathSecondaryAbility) as AbilityName | undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Assign Abilities</h2>
        <ContextHelpTooltip
          tooltipKey="characters.new.step.abilities.pointsHelp"
          scope="page:/characters/new"
          label="Ability point rules"
          context={{ level }}
        />
      </div>
      <p className="text-text-secondary mb-6">
        Distribute your ability points. You can reduce abilities below 0 to gain extra points.
        {powerAbility && <span className="text-power-fg"> Power archetype ability highlighted.</span>}
        {martialAbility && <span className="text-martial-fg"> Martial archetype ability highlighted.</span>}
      </p>
      {draft.creationMode === 'path' && draft.archetype?.name && (
        <PathHelpCard pathName={draft.archetype.name}>
          {pathPrimaryAbility ? (
            <>
              you should prioritize having a high <strong className="text-primary-fg capitalize">{pathPrimaryAbility}</strong>
              {pathSecondaryAbility ? (
                <> and <strong className="text-primary-fg capitalize">{pathSecondaryAbility}</strong></>
              ) : null}
              !
            </>
          ) : (
            'Assign your ability points below.'
          )}
        </PathHelpCard>
      )}
      
      {/* Shared Ability Score Editor */}
      <div className="mb-8">
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
      </div>
      
      <CreatorStepFooter onBack={prevStep} onContinue={nextStep} continueDisabled={!canContinue} />
    </div>
  );
}
