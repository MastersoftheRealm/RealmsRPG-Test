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
import { useMergedSpecies, type Species } from '@/hooks';
import { SkillsAllocationPage } from '@/components/shared';
import { Button } from '@/components/ui';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';

export function SkillsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();

  const speciesSkillIds = useMemo(() => {
    const isMixed = draft.ancestry?.mixed === true;
    const speciesIds = draft.ancestry?.speciesIds;

    if (isMixed && speciesIds?.length === 2) {
      const a = allSpecies.find((s: Species) => s.id === speciesIds[0]);
      const b = allSpecies.find((s: Species) => s.id === speciesIds[1]);
      const ids = new Set<string>();
      (a?.skills || []).forEach((id: string | number) => ids.add(String(id)));
      (b?.skills || []).forEach((id: string | number) => ids.add(String(id)));
      return ids;
    }

    const speciesId = draft.ancestry?.id;
    const speciesName = draft.ancestry?.name || draft.species;
    if (!speciesId && !speciesName) return new Set<string>();

    const species = speciesId
      ? allSpecies.find((s: Species) => s.id === speciesId)
      : allSpecies.find((s: Species) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase());

    return new Set<string>((species?.skills || []).map((id: string | number) => String(id)));
  }, [draft.ancestry?.id, draft.ancestry?.name, draft.ancestry?.mixed, draft.ancestry?.speciesIds, draft.species, allSpecies]);

  const allocations = draft.skills || {};
  const defenseVals = draft.defenseVals || draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS };
  const abilities = draft.abilities || { ...DEFAULT_ABILITIES };
  const level = draft.level || 1;

  // Species skill id "0" = "Any" (extra skill point), not a fixed skill — don't set allocations['0']
  // Species skills are proficient with skill value 0 (not 1); only set if not already present
  const allocationsWithSpecies = useMemo(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (id === '0') return; // Any = extra point only
      if (!(id in next)) next[id] = 0; // Species = proficient + value 0
    });
    return next;
  }, [allocations, speciesSkillIds]);

  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;

  const mergedSkillAbilities = draft.skillAbilities ?? {};

  const handleSkillAbilityChange = useCallback(
    (skillId: string, abilityKey: string) => {
      updateDraft({ skillAbilities: { ...(draft.skillAbilities ?? {}), [skillId]: abilityKey } });
    },
    [draft.skillAbilities, updateDraft]
  );

  const handleAllocationsChange = useCallback(
    (newAllocations: Record<string, number>) => {
      updateDraft({ skills: newAllocations });
    },
    [updateDraft]
  );

  const handleDefenseChange = useCallback(
    (newDefense: typeof defenseVals) => {
      updateDraft({ defenseVals: newDefense });
    },
    [updateDraft]
  );

  const handleContinue = () => {
    updateDraft({ skills: allocationsWithSpecies, defenseVals });
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
      defenseSkills={defenseVals}
      speciesSkillIds={speciesSkillIds}
      extraSkillPoints={extraSkillPoints}
      onAllocationsChange={handleAllocationsChange}
      onDefenseChange={handleDefenseChange}
      abilityDefenseBonuses={abilityDefenseBonuses}
      skillAbilities={mergedSkillAbilities}
      onSkillAbilityChange={handleSkillAbilityChange}
      footer={footer}
    />
  );
}
