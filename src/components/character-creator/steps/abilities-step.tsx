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
import { Button } from '@/components/ui';
import { calculateAbilityPoints } from '@/lib/game/formulas';
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
  
  // Sum of all ability values for validation
  const spentPoints = useMemo(() => {
    return Object.values(abilities).reduce((sum, val) => sum + (val || 0), 0);
  }, [abilities]);
  
  const remainingPoints = totalPoints - spentPoints;
  const canContinue = remainingPoints >= 0;
  
  // Get archetype abilities
  const pathPrimaryAbility = (draft.archetype?.archetype_ability || draft.pow_abil || draft.mart_abil) as AbilityName | undefined;
  const pathSecondaryAbility = draft.archetype?.secondary_ability as AbilityName | undefined;
  const powerAbility = (draft.pow_abil || pathPrimaryAbility) as AbilityName | undefined;
  const martialAbility = (draft.mart_abil || pathSecondaryAbility) as AbilityName | undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Assign Abilities</h2>
      <p className="text-text-secondary mb-6">
        Distribute your ability points. You can reduce abilities below 0 to gain extra points.
        {powerAbility && <span className="text-power-dark dark:text-power-300"> Power archetype ability highlighted.</span>}
        {martialAbility && <span className="text-martial-dark dark:text-martial-300"> Martial archetype ability highlighted.</span>}
      </p>
      {draft.creationMode === 'path' && (
        <div className="mb-4 rounded-lg border border-border-light bg-surface-alt px-4 py-3 text-sm text-text-secondary">
          This character uses an Archetype Path. Recommended ability focus:
          {pathPrimaryAbility && <strong className="ml-1 text-text-primary capitalize">{pathPrimaryAbility}</strong>}
          {pathSecondaryAbility && <span className="ml-1">with secondary <strong className="text-text-primary capitalize">{pathSecondaryAbility}</strong></span>}.
        </div>
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
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={!canContinue}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

