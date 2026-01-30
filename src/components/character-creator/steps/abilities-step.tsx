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
  
  // Determine highlighted archetype abilities
  const highlightedAbilities = useMemo(() => {
    const highlighted: AbilityName[] = [];
    if (draft.pow_abil) highlighted.push(draft.pow_abil as AbilityName);
    if (draft.mart_abil && draft.mart_abil !== draft.pow_abil) {
      highlighted.push(draft.mart_abil as AbilityName);
    }
    return highlighted;
  }, [draft.pow_abil, draft.mart_abil]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Assign Ability Scores</h1>
      <p className="text-text-secondary mb-6">
        Distribute your ability points. You can reduce abilities below 0 to gain extra points.
        Archetype abilities are highlighted.
      </p>
      
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
          highlightedAbilities={highlightedAbilities}
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

