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
import { useMergedSpecies, useCodexSkills, useTraits, useGameRules, useCreatorPathData, type Species, type Skill } from '@/hooks';
import { SkillsAllocationPage, InfoTippy, GuidedChoiceShell } from '@/components/shared';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { Button } from '@/components/ui';
import { getSkillPointsHelp, subSkillsHelp } from '../../../../public/tooltip-text';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';

function pathHelpContent(_pathName: string, names: string[]): React.ReactNode {
  if (names.length === 0) return null;
  const Bold = ({ children }: { children: string }) => (
    <strong className="text-primary-fg">{children}</strong>
  );
  if (names.length === 1) {
    return <>The recommended Skill <Bold>{names[0]}</Bold> has been added!</>;
  }
  if (names.length === 2) {
    return <>The recommended Skills <Bold>{names[0]}</Bold> and <Bold>{names[1]}</Bold> have been added!</>;
  }
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return (
    <>
      The recommended Skills{' '}
      {rest.map((n, i) => (
        <React.Fragment key={n}>{i > 0 ? ', ' : ''}<Bold>{n}</Bold></React.Fragment>
      ))}
      , and <Bold>{last}</Bold> have been added!
    </>
  );
}

export function SkillsStep() {
  const {
    draft,
    nextStep,
    prevStep,
    updateDraft,
    getStepLayer,
    expandLayer,
    collapseLayer,
  } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: allTraits } = useTraits();
  const { rules } = useGameRules();

  const validationContext = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null, allTraits: allTraits ?? null, rules }),
    [allSpecies, codexSkills, allTraits, rules]
  );
  const stepIssues = useMemo(
    () => getValidationIssuesForStep('skills', draft, validationContext),
    [draft, validationContext]
  );
  const completion = useMemo(
    () => getStepCompletion('skills', draft, validationContext),
    [draft, validationContext]
  );
  const layer = getStepLayer('skills');
  const pathMode = draft.creationMode === 'path';
  const canContinue = pathMode && layer === 1 ? completion.done : stepIssues.length === 0;

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
  const skillPointsHelp = useMemo(
    () => getSkillPointsHelp(level, rules),
    [level, rules]
  );

  const mergedSkillAbilities = draft.skillAbilities ?? {};
  const pathData = useCreatorPathData();
  const recommendedSkillIds = pathData?.level1?.skills ?? [];

  const declinedPathSkillIds = useMemo(
    () => new Set((draft.declinedPathSkillIds ?? []).map(String)),
    [draft.declinedPathSkillIds]
  );

  // Species skill id "0" = "Any" (extra skill point); path-recommended skills default to proficient (value 0)
  // unless the player removed them (declinedPathSkillIds — otherwise they would be re-injected every render).
  const allocationsWithSpecies = useMemo(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (id === '0') return; // Any = extra point only
      if (!(id in next)) next[id] = 0; // Species = proficient + value 0
    });
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0') return;
      if (declinedPathSkillIds.has(key)) return;
      if (!(key in next)) next[key] = 0; // Path default: proficient + value 0 (removable; see declinedPathSkillIds)
    });
    return next;
  }, [allocations, speciesSkillIds, recommendedSkillIds, declinedPathSkillIds]);

  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;

  const handleSkillAbilityChange = useCallback(
    (skillId: string, abilityKey: string) => {
      updateDraft({ skillAbilities: { ...(draft.skillAbilities ?? {}), [skillId]: abilityKey } });
    },
    [draft.skillAbilities, updateDraft]
  );

  const handleAllocationsChange = useCallback(
    (newAllocations: Record<string, number>) => {
      const declined = new Set((draft.declinedPathSkillIds ?? []).map(String));
      let changedDeclined = false;
      for (const id of recommendedSkillIds) {
        const key = String(id);
        if (key === '0') continue;
        if (!(key in newAllocations)) {
          if (!declined.has(key)) {
            declined.add(key);
            changedDeclined = true;
          }
        } else if (declined.has(key)) {
          declined.delete(key);
          changedDeclined = true;
        }
      }
      if (changedDeclined) {
        updateDraft({
          skills: newAllocations,
          declinedPathSkillIds: declined.size > 0 ? [...declined] : undefined,
        });
      } else {
        updateDraft({ skills: newAllocations });
      }
    },
    [draft.declinedPathSkillIds, recommendedSkillIds, updateDraft]
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
  const pathNotes = pathData?.level1?.notes;

  const pathHelpAfterDescription = useMemo(() => {
    if (!pathMode || !draft.archetype?.name) return null;
    return (
      <>
        {recommendedSkillNames.length > 0 && (
          <PathHelpCard pathName={draft.archetype.name}>
            {pathHelpContent(draft.archetype.name, recommendedSkillNames)}
          </PathHelpCard>
        )}
        <PathNotes pathName={draft.archetype.name} notes={pathNotes} />
      </>
    );
  }, [pathMode, draft.archetype, recommendedSkillNames, pathNotes]);

  const hasMissingRecommendedSkills = useMemo(() => {
    return recommendedSkillIds.some((id) => {
      const key = String(id);
      if (key === '0') return false;
      return declinedPathSkillIds.has(key) || !(key in allocations);
    });
  }, [recommendedSkillIds, declinedPathSkillIds, allocations]);

  const handleApplyRecommendedSkills = useCallback(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (id === '0') return;
      if (!(id in next)) next[id] = 0;
    });
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0') return;
      next[key] = next[key] ?? 0;
    });
    updateDraft({
      skills: next,
      declinedPathSkillIds: undefined,
    });
  }, [allocations, speciesSkillIds, recommendedSkillIds, updateDraft]);

  const pathSkillsAction = useMemo(() => {
    if (draft.creationMode !== 'path' || recommendedSkillIds.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyRecommendedSkills}
          className="min-h-[44px]"
          aria-label="Apply recommended path skills"
        >
          Apply recommended skills
        </Button>
        {hasMissingRecommendedSkills ? (
          <span className="text-sm text-text-secondary">
            Re-adds path skill proficiencies you removed.
          </span>
        ) : (
          <span className="text-sm text-text-secondary">
            Path skills are added as proficient (0 bonus) by default.
          </span>
        )}
      </div>
    );
  }, [
    draft.creationMode,
    recommendedSkillIds.length,
    handleApplyRecommendedSkills,
    hasMissingRecommendedSkills,
  ]);

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

  const skillsPage = (
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
      afterDescription={pathMode ? undefined : pathHelpAfterDescription}
      hideDefenseBonuses={pathMode && layer === 1}
      hideSubSkills={pathMode && layer === 1}
      embeddedInShell={pathMode}
      headingAddon={
        !pathMode ? (
          <InfoTippy
            content={skillPointsHelp}
            allowHTML
            label="Skill allocation help"
            size="inline"
          />
        ) : undefined
      }
      addSubSkillAddon={
        <InfoTippy
          content={subSkillsHelp}
          allowHTML
          label="Sub-skill help"
          placement="top"
          size="inline"
        />
      }
    />
  );

  const stepFooter = (
    <CreatorStepFooter
      onBack={prevStep}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      completionHint={<span>{completion.label}</span>}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4">
      {pathSkillsAction}
      {pathMode ? (
        <>
          <GuidedChoiceShell
            layer={layer}
            title="Allocate Skills"
            titleAddon={
              <InfoTippy
                content={skillPointsHelp}
                allowHTML
                label="Skill allocation help"
                size="inline"
              />
            }
            description="Spend skill points on proficiencies and values. Species skills stay locked; expand for sub-skills and defense bonuses."
            guidance={pathHelpAfterDescription}
            completionState={completion}
            onExpandLayer={() => expandLayer('skills')}
            onCollapseLayer={() => collapseLayer('skills')}
            expandLabel={layer === 1 ? 'See more options (sub-skills & defenses)' : 'See all skills'}
            canExpand={layer === 1}
          >
            {skillsPage}
          </GuidedChoiceShell>
          {stepFooter}
        </>
      ) : (
        <>
          {skillsPage}
          {stepFooter}
        </>
      )}
    </div>
  );
}
