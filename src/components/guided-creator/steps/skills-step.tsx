/**
 * Skills — species locked (free), path recommended (auto-added), skill points + free picks.
 * L1: allocated list + recommended skill cards.
 * L2: Browse all Skills (custom chooser: opt-in via GuidedLayerNav, not auto-opened).
 * L3: Browse all Sub-Skills from L2 modal footer (custom chooser only).
 */

'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedSkillsPanel } from '../guided-skills-panel';
import { GuidedSectionTitle } from '../guided-section-title';
import { useMergedSpecies, useCodexSkills, useGameRules, type Skill } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { AddSkillModal, AddSubSkillModal, GuidedLayerNav } from '@/components/patterns';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import { resolveSkillAllocationRules } from '@/lib/game/skill-allocation';
import {
  applyAddedBaseSkills,
  applyAddedSubSkills,
  buildCharacterSkillsForSubModal,
  buildExistingSkillIdSet,
  buildExistingSkillNames,
} from '@/lib/game/skill-allocation-add';
import {
  buildGuidedSkillSuggestions,
  guidedSuggestionsToBadgeMap,
} from '@/lib/guided-creator/guided-skill-recommendations';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import {
  calculateGuidedSkillPointBudget,
  pruneUnresolvedSkillAllocations,
} from '@/lib/guided-creator/skill-reconcile';
import { EMPTY_STRING_ARRAY, EMPTY_STRING_RECORD } from '@/lib/empty';

const stepCopy = GUIDED_CREATOR_COPY.steps.skills;

export function SkillsStep() {
  const { draft, updateDraft, nextSubStep, navigationIntent, entryNonce } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);
  const deepCatalogOnly = prefersDeepCatalogEntry(draft);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [subBrowseOpen, setSubBrowseOpen] = useState(false);

  const openBrowse = useCallback(() => {
    setSubBrowseOpen(false);
    setBrowseOpen(true);
  }, []);
  const openSubBrowse = useCallback(() => {
    setBrowseOpen(false);
    setSubBrowseOpen(true);
  }, []);
  const closeBrowseLayers = useCallback(() => {
    setBrowseOpen(false);
    setSubBrowseOpen(false);
  }, []);

  useGuidedDeepEntryOnArrival({
    draft,
    navigationIntent,
    entryNonce,
    onDeepEntry: openBrowse,
    enabled: !deepCatalogOnly,
  });

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies),
    [draft, allSpecies],
  );

  const pathSkillIds = useMemo(
    () => new Set((pathData?.level1?.skills ?? []).map(String)),
    [pathData],
  );

  const pathLevel1Skills = pathData?.level1?.skills;
  const recommendedSkillIds = pathLevel1Skills ?? EMPTY_STRING_ARRAY;

  const declinedPathSkillIds = useMemo(
    () => new Set(draft.declinedPathSkillIds.map(String)),
    [draft.declinedPathSkillIds],
  );

  const defenseVals = draft.defenseVals ?? DEFAULT_DEFENSE_SKILLS;
  const skillAbilities = draft.skillAbilities ?? EMPTY_STRING_RECORD;
  const abilities = useMemo(() => draft.abilities ?? { ...DEFAULT_ABILITIES }, [draft.abilities]);
  const level = 1;
  const {
    skillMeta,
    speciesSkillIds,
    allocationsWithDefaults,
    remainingPoints,
    totalPoints,
    spentPoints,
  } = useMemo(
    () =>
      calculateGuidedSkillPointBudget({
        allocations: draft.skills,
        defenseVals,
        selectedSpeciesSkillIds: draft.selectedSpeciesSkillIds,
        declinedPathSkillIds: draft.declinedPathSkillIds,
        recommendedSkillIds,
        speciesContext,
        catalog: codexSkills,
        rules,
      }),
    [
      codexSkills,
      defenseVals,
      draft.declinedPathSkillIds,
      draft.selectedSpeciesSkillIds,
      draft.skills,
      recommendedSkillIds,
      rules,
      speciesContext,
    ],
  );

  /** Same reconciliation on the persisted draft, so the stale key does not survive a reload. */
  useEffect(() => {
    if (skillMeta.size === 0) return;
    const { skills, removedIds } = pruneUnresolvedSkillAllocations(draft.skills, skillMeta);
    if (removedIds.length === 0) return;
    updateDraft({ skills });
  }, [skillMeta, draft.skills, updateDraft]);
  const maxAddSkillSelections = Math.floor(remainingPoints / skillRules.gainProficiencyCost);
  const canBrowseSubSkills = remainingPoints >= 1;

  const handleAllocationsChange = useCallback(
    (newAllocations: Record<string, number>) => {
      const declined = new Set(draft.declinedPathSkillIds.map(String));
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
      updateDraft({
        skills: newAllocations,
        declinedPathSkillIds: changedDeclined
          ? declined.size > 0
            ? [...declined]
            : []
          : draft.declinedPathSkillIds,
      });
    },
    [draft.declinedPathSkillIds, recommendedSkillIds, updateDraft],
  );

  const handleDefenseChange = useCallback(
    (next: typeof defenseVals) => {
      updateDraft({ defenseVals: next });
    },
    [updateDraft],
  );

  const handleSkillAbilityChange = useCallback(
    (skillId: string, abilityKey: string) => {
      updateDraft({ skillAbilities: { ...skillAbilities, [skillId]: abilityKey } });
    },
    [skillAbilities, updateDraft],
  );

  const selectedSkillIds = useMemo(
    () => new Set(Object.keys(allocationsWithDefaults)),
    [allocationsWithDefaults],
  );

  const existingSkillIds = useMemo(
    () => buildExistingSkillIdSet(speciesSkillIds, allocationsWithDefaults),
    [speciesSkillIds, allocationsWithDefaults],
  );

  const existingSkillNames = useMemo(
    () => buildExistingSkillNames(codexSkills, existingSkillIds),
    [codexSkills, existingSkillIds],
  );

  const characterSkillsForSubModal = useMemo(
    () => buildCharacterSkillsForSubModal(codexSkills, existingSkillIds, allocationsWithDefaults),
    [codexSkills, existingSkillIds, allocationsWithDefaults],
  );

  const { suggestions: skillSuggestions } = useMemo(
    () =>
      buildGuidedSkillSuggestions({
        codexSkills,
        abilities,
        declinedPathSkillIds: [...declinedPathSkillIds],
        pathSourceLabel: archetype?.name,
        archetypeType: draft.archetypeType,
        archetype,
        powAbil: draft.pow_abil,
        martAbil: draft.mart_abil,
        pathSkillIds: [...pathSkillIds],
        speciesSkillIds: [...speciesSkillIds],
        selectedSkillIds,
        includeAbilityMatches: remainingPoints > 0,
      }),
    [
      codexSkills,
      abilities,
      declinedPathSkillIds,
      archetype,
      draft.archetypeType,
      draft.pow_abil,
      draft.mart_abil,
      pathSkillIds,
      speciesSkillIds,
      selectedSkillIds,
      remainingPoints,
    ],
  );

  const browseSkillBadgesById = useMemo(
    () => guidedSuggestionsToBadgeMap(skillSuggestions),
    [skillSuggestions],
  );

  const browseRecommendedSkillIds = useMemo(
    () => skillSuggestions.map((s) => s.skillId),
    [skillSuggestions],
  );

  const hasPathDeclinedSuggestions = skillSuggestions.some((s) =>
    s.kinds.includes('path-declined'),
  );
  const hasAbilitySuggestions = skillSuggestions.some((s) => s.kinds.includes('ability-match'));

  const addSuggestedSkill = (skillId: string) => {
    if (remainingPoints < skillRules.gainProficiencyCost) return;
    handleAllocationsChange({
      ...allocationsWithDefaults,
      [skillId]: allocationsWithDefaults[skillId] ?? 0,
    });
  };

  const handleAddSkills = useCallback(
    (skills: Skill[]) => {
      handleAllocationsChange(applyAddedBaseSkills(allocationsWithDefaults, skills));
      setBrowseOpen(false);
    },
    [allocationsWithDefaults, handleAllocationsChange],
  );

  const handleAddSubSkills = useCallback(
    (
      skills: Array<
        Skill & { selectedBaseSkillId?: string | undefined; autoAddBaseSkill?: Skill | undefined }
      >,
    ) => {
      handleAllocationsChange(applyAddedSubSkills(allocationsWithDefaults, skills));
      setSubBrowseOpen(false);
    },
    [allocationsWithDefaults, handleAllocationsChange],
  );

  const handleContinue = useCallback(() => {
    updateDraft({
      skills: allocationsWithDefaults,
      defenseVals: { ...defenseVals },
      skillAbilities,
    });
    nextSubStep();
  }, [allocationsWithDefaults, defenseVals, skillAbilities, updateDraft, nextSubStep]);

  const canContinue = remainingPoints === 0 && Object.keys(allocationsWithDefaults).length > 0;

  return (
    <GuidedStepLayout
      subStep="skills"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={canContinue}
      continueLabel={stepCopy.continueLabel}
      footerContinue={handleContinue}
      completionHint={
        remainingPoints > 0 ? (
          <span className="font-nunito">{stepCopy.pointsRemaining(remainingPoints)}</span>
        ) : (
          <span className="font-nunito text-success-fg">{stepCopy.pointsComplete}</span>
        )
      }
    >
      <GuidedSkillsPanel
        abilities={abilities}
        allocations={allocationsWithDefaults}
        speciesSkillIds={speciesSkillIds}
        pathSkillIds={pathSkillIds}
        pathSourceLabel={archetype?.name}
        totalPoints={totalPoints}
        spentPoints={spentPoints}
        onAllocationsChange={handleAllocationsChange}
        defenseSkills={defenseVals}
        onDefenseChange={handleDefenseChange}
        skillAbilities={skillAbilities}
        onSkillAbilityChange={handleSkillAbilityChange}
        level={level}
      />

      {skillSuggestions.length > 0 && (
        <section className="mt-8">
          <GuidedSectionTitle>
            {hasPathDeclinedSuggestions && !hasAbilitySuggestions
              ? stepCopy.pathSkillSuggestionsTitle(archetype?.name ?? 'your path')
              : hasPathDeclinedSuggestions && hasAbilitySuggestions
                ? stepCopy.mixedSkillSuggestionsTitle
                : stepCopy.suggestedSkillsTitle}
          </GuidedSectionTitle>
          {hasPathDeclinedSuggestions && (
            <p className="mt-1 font-nunito text-sm text-text-secondary">
              {hasAbilitySuggestions
                ? stepCopy.mixedSkillSuggestionsHint(remainingPoints)
                : stepCopy.pathSkillSuggestionsHint(archetype?.name ?? 'your path')}
            </p>
          )}
          <div className={`${GUIDED_CHOICE_COMPACT_GRID_CLASS} mt-3`}>
            {skillSuggestions.map((suggestion) => {
              const skill = codexSkills.find((s) => String(s.id) === suggestion.skillId);
              if (!skill) return null;
              return (
                <GuidedChoiceCard
                  key={suggestion.skillId}
                  density="compact"
                  title={skill.name ?? suggestion.skillId}
                  description={skill.description}
                  tags={suggestion.tags}
                  selected={false}
                  onSelect={() => addSuggestedSkill(suggestion.skillId)}
                  selectAriaLabel={`Add ${skill.name ?? suggestion.skillId}`}
                />
              );
            })}
          </div>
        </section>
      )}

      {!browseOpen && !subBrowseOpen ? (
        <GuidedLayerNav expandLabel={stepCopy.browseAll} onExpand={openBrowse} />
      ) : null}

      {browseOpen ? (
        <AddSkillModal
          isOpen
          onClose={closeBrowseLayers}
          existingSkillNames={existingSkillNames}
          onAdd={handleAddSkills}
          skillBadgesById={browseSkillBadgesById}
          recommendedSkillIds={browseRecommendedSkillIds}
          maxSelections={maxAddSkillSelections}
          selectionLimitMessage={stepCopy.browseOverLimit(maxAddSkillSelections)}
          autoSelectPathType={deepCatalogOnly ? null : draft.archetypeType}
          optionsDefaultExpanded={!deepCatalogOnly}
          deeperLayerLabel={deepCatalogOnly ? stepCopy.browseAllSubSkills : undefined}
          onDeeperLayer={deepCatalogOnly ? openSubBrowse : undefined}
          deeperLayerDisabled={!canBrowseSubSkills}
          deeperLayerDisabledTitle={!canBrowseSubSkills ? stepCopy.subBrowseDisabled : undefined}
        />
      ) : null}

      {subBrowseOpen ? (
        <AddSubSkillModal
          isOpen
          onClose={closeBrowseLayers}
          characterSkills={characterSkillsForSubModal}
          existingSkillNames={existingSkillNames}
          onAdd={handleAddSubSkills}
          shallowerLayerLabel={stepCopy.browseAll}
          onShallowerLayer={openBrowse}
        />
      ) : null}
    </GuidedStepLayout>
  );
}
