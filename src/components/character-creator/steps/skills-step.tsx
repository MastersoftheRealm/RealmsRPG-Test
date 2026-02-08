/**
 * Skills Step
 * ============
 * Character creator step for skill allocation.
 * Uses shared SkillsAllocationPage component.
 * Characters: 3 skill points per level. Species grants 2 permanent skills.
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useSpecies, type Species } from '@/hooks';
import { SkillsAllocationPage } from '@/components/shared';
import { Button } from '@/components/ui';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';

export function SkillsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useSpecies();

  const speciesSkillIds = useMemo(() => {
    const speciesId = draft.ancestry?.id;
    const speciesName = draft.ancestry?.name || draft.species;
    if (!speciesId && !speciesName) return new Set<string>();

    const species = speciesId
      ? allSpecies.find((s: Species) => s.id === speciesId)
      : allSpecies.find((s: Species) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase());

    return new Set<string>((species?.skills || []).map((id: string | number) => String(id)));
  }, [draft.ancestry?.id, draft.ancestry?.name, draft.species, allSpecies]);

  const allocations = draft.skills || {};
  const defenseSkills = draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS };
  const abilities = draft.abilities || { ...DEFAULT_ABILITIES };
  const level = draft.level || 1;

  const allocationsWithSpecies = useMemo(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (!(id in next) || next[id] < 1) next[id] = 1;
    });
    return next;
  }, [allocations, speciesSkillIds]);

  const handleAllocationsChange = useCallback(
    (newAllocations: Record<string, number>) => {
      updateDraft({ skills: newAllocations });
    },
    [updateDraft]
  );

  const handleDefenseChange = useCallback(
    (newDefense: typeof defenseSkills) => {
      updateDraft({ defenseSkills: newDefense });
    },
    [updateDraft]
  );

  const handleContinue = () => {
    updateDraft({ skills: allocationsWithSpecies, defenseSkills });
    nextStep();
  };

  const abilityDefenseBonuses = useMemo(() => ({
    might: abilities.strength,
    fortitude: abilities.vitality,
    reflex: abilities.agility,
    discernment: abilities.acuity,
    mentalFortitude: abilities.intelligence,
    resolve: abilities.charisma,
  }), [abilities]);

  const footer = (
    <>
      <Button variant="secondary" onClick={prevStep}>
        ← Back
      </Button>
      <Button onClick={handleContinue}>Continue →</Button>
    </>
  );

  return (
    <SkillsAllocationPage
      entityType="character"
      level={level}
      abilities={abilities}
      allocations={allocationsWithSpecies}
      defenseSkills={defenseSkills}
      speciesSkillIds={speciesSkillIds}
      onAllocationsChange={handleAllocationsChange}
      onDefenseChange={handleDefenseChange}
      abilityDefenseBonuses={abilityDefenseBonuses}
      footer={footer}
    />
  );
}
