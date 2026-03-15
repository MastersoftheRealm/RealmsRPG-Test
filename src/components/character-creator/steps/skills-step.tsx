/**
 * Skills Step
 * ============
 * Character creator step for skill allocation.
 * Uses shared SkillsAllocationPage component.
 * Characters: 3 skill points per level. Species grants 2 permanent skills.
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useMergedSpecies, useCodexSkills, type Species, type Skill } from '@/hooks';
import { SkillsAllocationPage } from '@/components/shared';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';
import { Button } from '@/components/ui';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import { parseArchetypePathData } from '@/lib/game/archetype-path';

function pathHelpContent(_pathName: string, names: string[]): React.ReactNode {
  if (names.length === 0) return null;
  const Bold = ({ children }: { children: string }) => (
    <strong className="text-primary-700 dark:text-primary-300">{children}</strong>
  );
  if (names.length === 1) {
    return <>the recommended Skill <Bold>{names[0]}</Bold> has been added!</>;
  }
  if (names.length === 2) {
    return <>the recommended Skills <Bold>{names[0]}</Bold> and <Bold>{names[1]}</Bold> have been added!</>;
  }
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return (
    <>
      the recommended Skills{' '}
      {rest.map((n, i) => (
        <React.Fragment key={n}>{i > 0 ? ', ' : ''}<Bold>{n}</Bold></React.Fragment>
      ))}
      , and <Bold>{last}</Bold> have been added!
    </>
  );
}

export function SkillsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();

  const speciesSkillIds = useMemo(() => {
    const isMixed = draft.ancestry?.mixed === true;
    const speciesIds = draft.ancestry?.speciesIds;
    const selectedMixedSkills = draft.ancestry?.selectedSpeciesSkillIds;

    if (isMixed && speciesIds?.length === 2) {
      if (selectedMixedSkills?.length === 2) {
        return new Set<string>(selectedMixedSkills);
      }
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
  }, [draft.ancestry?.id, draft.ancestry?.name, draft.ancestry?.mixed, draft.ancestry?.speciesIds, draft.ancestry?.selectedSpeciesSkillIds, draft.species, allSpecies]);

  const allocations = draft.skills || {};
  const defenseVals = draft.defenseVals || draft.defenseSkills || { ...DEFAULT_DEFENSE_SKILLS };
  const abilities = draft.abilities || { ...DEFAULT_ABILITIES };
  const level = draft.level || 1;

  const mergedSkillAbilities = draft.skillAbilities ?? {};
  const pathData = useMemo(() => parseArchetypePathData(draft.archetype?.path_data), [draft.archetype?.path_data]);
  const recommendedSkillIds = pathData?.level1?.skills ?? [];

  // Species skill id "0" = "Any" (extra skill point); path-recommended skills also start as proficient (value 0), removable
  const allocationsWithSpecies = useMemo(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (id === '0') return; // Any = extra point only
      if (!(id in next)) next[id] = 0; // Species = proficient + value 0
    });
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0') return;
      if (!(key in next)) next[key] = 0; // Path = proficient + value 0 (can remove, counts against points)
    });
    return next;
  }, [allocations, speciesSkillIds, recommendedSkillIds]);

  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;

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

  const pathSkillIds = useMemo(() => new Set(recommendedSkillIds.map((id) => String(id))), [recommendedSkillIds]);
  const recommendedSkillNames = useMemo(() => {
    return recommendedSkillIds
      .map((id) => (codexSkills as Skill[]).find((s) => String(s.id) === String(id))?.name)
      .filter((n): n is string => !!n);
  }, [recommendedSkillIds, codexSkills]);
  const pathHelpAfterDescription = useMemo(() => {
    if (draft.creationMode !== 'path' || !draft.archetype?.name || recommendedSkillNames.length === 0) return null;
    return (
      <PathHelpCard pathName={draft.archetype.name}>
        {pathHelpContent(draft.archetype.name, recommendedSkillNames)}
      </PathHelpCard>
    );
  }, [draft.creationMode, draft.archetype?.name, recommendedSkillNames]);

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
    <div className="space-y-4">
      <SkillsAllocationPage
        entityType="character"
        level={level}
        abilities={abilities}
        allocations={allocationsWithSpecies}
        defenseSkills={defenseVals}
        speciesSkillIds={speciesSkillIds}
        pathSkillIds={pathSkillIds}
        pathSourceLabel={draft.archetype?.name}
        extraSkillPoints={extraSkillPoints}
        onAllocationsChange={handleAllocationsChange}
        onDefenseChange={handleDefenseChange}
        abilityDefenseBonuses={abilityDefenseBonuses}
        skillAbilities={mergedSkillAbilities}
        onSkillAbilityChange={handleSkillAbilityChange}
        afterDescription={pathHelpAfterDescription}
        hideDefenseBonuses={draft.creationMode === 'path'}
        footer={footer}
      />
    </div>
  );
}
