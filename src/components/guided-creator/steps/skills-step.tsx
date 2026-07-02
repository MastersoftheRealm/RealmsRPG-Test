/**
 * Skills — species locked (free), path recommended (toggle/remove), skill points + free picks.
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui';
import { SkillsAllocationPage } from '@/components/shared';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { PathHelpCard } from '@/components/character-creator/PathHelpCard';
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
import { getGuidedCuratedSkillIds } from '@/lib/guided-creator/curated-skills';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { Skill } from '@/hooks';

const stepCopy = GUIDED_CREATOR_COPY.steps.skills;

export function SkillsStep() {
  const { draft, updateDraft, nextSubStep } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [], isLoading } = useCodexSkills();
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

  const handleApplyRecommended = useCallback(() => {
    const next = { ...allocationsWithDefaults };
    recommendedSkillIds.forEach((id) => {
      const key = String(id);
      if (key === '0') return;
      next[key] = next[key] ?? 0;
    });
    updateDraft({ skills: next, declinedPathSkillIds: [] });
  }, [allocationsWithDefaults, recommendedSkillIds, updateDraft]);

  const recommendedSkillNames = useMemo(
    () =>
      recommendedSkillIds
        .map((id) => codexSkills.find((s) => String(s.id) === String(id))?.name)
        .filter((n): n is string => Boolean(n)),
    [recommendedSkillIds, codexSkills]
  );

  const selectedSkillIds = useMemo(
    () => new Set(Object.keys(allocationsWithDefaults)),
    [allocationsWithDefaults]
  );

  const curatedSkillIds = useMemo(
    () =>
      getGuidedCuratedSkillIds({
        codexSkills,
        archetypeType: draft.archetypeType,
        powAbil: draft.pow_abil,
        martAbil: draft.mart_abil,
        pathSkillIds: [...pathSkillIds],
        speciesSkillIds: [...speciesSkillIds],
        selectedSkillIds,
      }),
    [
      codexSkills,
      draft.archetypeType,
      draft.pow_abil,
      draft.mart_abil,
      pathSkillIds,
      speciesSkillIds,
      selectedSkillIds,
    ]
  );

  const hasMissingRecommended = useMemo(
    () =>
      recommendedSkillIds.some((id) => {
        const key = String(id);
        return key !== '0' && (declinedPathSkillIds.has(key) || !(key in allocationsWithDefaults));
      }),
    [recommendedSkillIds, declinedPathSkillIds, allocationsWithDefaults]
  );

  const addCuratedSkill = (skillId: string) => {
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

  const abilityDefenseBonuses = useMemo(
    () => ({
      might: abilities.strength,
      fortitude: abilities.vitality,
      reflex: abilities.agility,
      discernment: abilities.acuity,
      mentalFortitude: abilities.intelligence,
      resolve: abilities.charisma,
    }),
    [abilities]
  );

  return (
    <GuidedStepLayout
      subStep="skills"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={canContinue}
      continueLabel={stepCopy.continueLabel}
      footerContinue={handleContinue}
      completionHint={
        <span className="font-nunito">
          {spentPoints} / {totalPoints} skill points
        </span>
      }
    >
      {archetype?.name && recommendedSkillNames.length > 0 && (
        <PathHelpCard pathName={archetype.name}>
          {stepCopy.pathHelp(recommendedSkillNames)}
        </PathHelpCard>
      )}

      {recommendedSkillIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyRecommended}
            className="min-h-11"
            aria-label={stepCopy.applyRecommended}
          >
            {stepCopy.applyRecommended}
          </Button>
          {hasMissingRecommended && (
            <span className="font-nunito text-sm text-text-secondary">{stepCopy.applyRecommendedHint}</span>
          )}
        </div>
      )}

      {!canContinue && remainingPoints > 0 && (
        <p className="mb-4 font-nunito text-sm text-text-secondary">{stepCopy.pointsRemaining(remainingPoints)}</p>
      )}

      {isLoading ? null : (
        <SkillsAllocationPage
          entityType="character"
          level={level}
          abilities={abilities}
          allocations={allocationsWithDefaults}
          defenseSkills={DEFAULT_DEFENSE_SKILLS}
          speciesSkillIds={speciesSkillIds}
          pathSkillIds={pathSkillIds}
          pathSourceLabel={archetype?.name}
          extraSkillPoints={extraSkillPoints}
          onAllocationsChange={handleAllocationsChange}
          onDefenseChange={() => {}}
          abilityDefenseBonuses={abilityDefenseBonuses}
          hideDefenseBonuses
          hideSubSkills
          embeddedInShell
        />
      )}

      {remainingPoints > 0 && curatedSkillIds.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-lg font-semibold text-text-primary">{stepCopy.freePicksTitle}</h3>
          <p className="mt-1 font-nunito text-sm text-text-secondary">
            {stepCopy.freePicksHint(remainingPoints)}
          </p>
          <div className={`${GUIDED_CHOICE_COMPACT_GRID_CLASS} mt-3`}>
            {curatedSkillIds.map((id) => {
              const skill = codexSkills.find((s) => String(s.id) === id);
              if (!skill) return null;
              return (
                <GuidedChoiceCard
                  key={id}
                  density="compact"
                  title={skill.name ?? id}
                  description={skill.description}
                  selected={false}
                  onSelect={() => addCuratedSkill(id)}
                  selectAriaLabel={`Add ${skill.name ?? id}`}
                />
              );
            })}
          </div>
        </section>
      )}
    </GuidedStepLayout>
  );
}
