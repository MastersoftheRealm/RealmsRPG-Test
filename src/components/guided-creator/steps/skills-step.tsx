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
import { useMergedSpecies, useCodexSkills, useGameRules } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { AddSkillModal, AddSubSkillModal, GuidedLayerNav } from '@/components/patterns';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import {
  calculateSimpleSkillPointsSpent,
  getTotalSkillPoints,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
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
import { buildMixedSpeciesSkillOptions } from '@/lib/ancestry/ancestry-selection';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { pruneUnresolvedSkillAllocations } from '@/lib/guided-creator/skill-reconcile';
import type { Skill } from '@/hooks';

import { EMPTY_NUMBER_RECORD, EMPTY_STRING_ARRAY, EMPTY_STRING_RECORD } from '@/lib/empty';

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

  const speciesSkillIds = useMemo(() => {
    if (speciesContext.isMixed && speciesContext.speciesA && speciesContext.speciesB) {
      if (draft.selectedSpeciesSkillIds.length > 0) {
        return new Set(draft.selectedSpeciesSkillIds.map(String));
      }
      const options = buildMixedSpeciesSkillOptions(
        speciesContext.speciesA,
        speciesContext.speciesB,
        codexSkills,
      );
      return new Set(options.map((o) => o.id));
    }
    return new Set((speciesContext.species?.skills ?? []).map(String));
  }, [speciesContext, draft.selectedSpeciesSkillIds, codexSkills]);

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

  const allocations = draft.skills ?? EMPTY_NUMBER_RECORD;
  const defenseVals = draft.defenseVals ?? DEFAULT_DEFENSE_SKILLS;
  const skillAbilities = draft.skillAbilities ?? EMPTY_STRING_RECORD;
  const abilities = useMemo(() => draft.abilities ?? { ...DEFAULT_ABILITIES }, [draft.abilities]);
  const level = 1;
  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;
  const totalPoints = getTotalSkillPoints(level, 'character') + extraSkillPoints;

  const skillMeta = useMemo(() => {
    const map = new Map<string, { isSubSkill: boolean }>();
    codexSkills.forEach((s: Skill) => {
      map.set(String(s.id), { isSubSkill: s.base_skill_id !== undefined });
    });
    return map;
  }, [codexSkills]);

  /**
   * Codex-resolved keys only. An unresolvable id still costs a Skill Point in the spend calc
   * but `GuidedSkillsPanel` renders no row for it, so it can never be removed and Continue is
   * dead (audit P0-2). Skipped while the codex is empty so a cold cache cannot drop valid
   * allocations, and applied to species/path defaults too — a deleted path skill bricks the
   * step the same way a deleted draft skill does.
   */
  const allocationsWithDefaults = useMemo(() => {
    const codexReady = skillMeta.size > 0;
    const resolves = (id: string) => !codexReady || skillMeta.has(id);
    const next: Record<string, number> = {};
    Object.entries(allocations).forEach(([id, value]) => {
      if (resolves(id)) next[id] = value;
    });
    speciesSkillIds.forEach((id) => {
      if (id === '0' || !resolves(id)) return;
      if (!(id in next)) next[id] = 0;
    });
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0' || !resolves(key)) return;
      if (declinedPathSkillIds.has(key)) return;
      if (!(key in next)) next[key] = 0;
    });
    return next;
  }, [allocations, speciesSkillIds, recommendedSkillIds, declinedPathSkillIds, skillMeta]);

  /** Same reconciliation on the persisted draft, so the stale key does not survive a reload. */
  useEffect(() => {
    if (skillMeta.size === 0) return;
    const { skills, removedIds } = pruneUnresolvedSkillAllocations(draft.skills, skillMeta);
    if (removedIds.length === 0) return;
    updateDraft({ skills });
  }, [skillMeta, draft.skills, updateDraft]);

  const spentPoints = useMemo(
    () =>
      calculateSimpleSkillPointsSpent(
        allocationsWithDefaults,
        speciesSkillIds,
        skillMeta,
        defenseVals,
        skillRules,
      ),
    [allocationsWithDefaults, speciesSkillIds, skillMeta, defenseVals, skillRules],
  );

  const remainingPoints = totalPoints - spentPoints;
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
          <span className="font-nunito text-success-700 dark:text-success-400">
            {stepCopy.pointsComplete}
          </span>
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
