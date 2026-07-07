/**
 * Skills — species locked (free), path recommended (auto-added), skill points + free picks.
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedSkillsPanel } from '../guided-skills-panel';
import { useMergedSpecies, useCodexSkills, useGameRules } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import {
  calculateSimpleSkillPointsSpent,
  getTotalSkillPoints,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import {
  buildGuidedSkillSuggestions,
  guidedSuggestionsToBadgeMap,
} from '@/lib/guided-creator/guided-skill-recommendations';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { Skill } from '@/hooks';

const stepCopy = GUIDED_CREATOR_COPY.steps.skills;

export function SkillsStep() {
  const { draft, updateDraft, nextSubStep } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)),
    [allSpecies, draft.speciesId]
  );

  const speciesSkillIds = useMemo(
    () => new Set((species?.skills ?? []).map(String)),
    [species]
  );

  const pathSkillIds = useMemo(
    () => new Set((pathData?.level1?.skills ?? []).map(String)),
    [pathData]
  );

  const recommendedSkillIds = pathData?.level1?.skills ?? [];

  const declinedPathSkillIds = useMemo(
    () => new Set(draft.declinedPathSkillIds.map(String)),
    [draft.declinedPathSkillIds]
  );

  const allocations = draft.skills ?? {};
  const abilities = draft.abilities ?? { ...DEFAULT_ABILITIES };
  const level = 1;
  const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;
  const totalPoints = getTotalSkillPoints(level, 'character') + extraSkillPoints;

  const allocationsWithDefaults = useMemo(() => {
    const next = { ...allocations };
    speciesSkillIds.forEach((id) => {
      if (id === '0') return;
      if (!(id in next)) next[id] = 0;
    });
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0') return;
      if (declinedPathSkillIds.has(key)) return;
      if (!(key in next)) next[key] = 0;
    });
    return next;
  }, [allocations, speciesSkillIds, recommendedSkillIds, declinedPathSkillIds]);

  const skillMeta = useMemo(() => {
    const map = new Map<string, { isSubSkill: boolean }>();
    codexSkills.forEach((s: Skill) => {
      map.set(String(s.id), { isSubSkill: s.base_skill_id !== undefined });
    });
    return map;
  }, [codexSkills]);

  const spentPoints = useMemo(
    () =>
      calculateSimpleSkillPointsSpent(
        allocationsWithDefaults,
        speciesSkillIds,
        skillMeta,
        DEFAULT_DEFENSE_SKILLS,
        skillRules
      ),
    [allocationsWithDefaults, speciesSkillIds, skillMeta, skillRules]
  );

  const remainingPoints = totalPoints - spentPoints;

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
    [draft.declinedPathSkillIds, recommendedSkillIds, updateDraft]
  );

  const selectedSkillIds = useMemo(
    () => new Set(Object.keys(allocationsWithDefaults)),
    [allocationsWithDefaults]
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
    ]
  );

  const browseSkillBadgesById = useMemo(
    () => guidedSuggestionsToBadgeMap(skillSuggestions),
    [skillSuggestions]
  );

  const browseRecommendedSkillIds = useMemo(
    () => skillSuggestions.map((s) => s.skillId),
    [skillSuggestions]
  );

  const hasPathDeclinedSuggestions = skillSuggestions.some((s) =>
    s.kinds.includes('path-declined')
  );
  const hasAbilitySuggestions = skillSuggestions.some((s) =>
    s.kinds.includes('ability-match')
  );

  const addSuggestedSkill = (skillId: string) => {
    if (remainingPoints < skillRules.gainProficiencyCost) return;
    handleAllocationsChange({
      ...allocationsWithDefaults,
      [skillId]: allocationsWithDefaults[skillId] ?? 0,
    });
  };

  const handleContinue = useCallback(() => {
    updateDraft({ skills: allocationsWithDefaults });
    nextSubStep();
  }, [allocationsWithDefaults, updateDraft, nextSubStep]);

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
        browseSkillBadgesById={browseSkillBadgesById}
        browseRecommendedSkillIds={browseRecommendedSkillIds}
      />

      {skillSuggestions.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-lg font-semibold text-text-primary">
            {hasPathDeclinedSuggestions && !hasAbilitySuggestions
              ? stepCopy.pathSkillSuggestionsTitle(archetype?.name ?? 'your path')
              : hasPathDeclinedSuggestions && hasAbilitySuggestions
                ? stepCopy.mixedSkillSuggestionsTitle
                : stepCopy.suggestedSkillsTitle}
          </h3>
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
    </GuidedStepLayout>
  );
}
