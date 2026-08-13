/**
 * Ancestry micro-flow: species overview, then one pick at a time.
 * Supports single species and mixed species (two parents).
 */

'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Spinner } from '@/components/ui';
import { MixedSpeciesModal } from '@/components/character-creator/MixedSpeciesModal';
import { useMergedSpecies, useTraits, useCodexSkills, useUserSpecies, resolveTraitIds } from '@/hooks';
import type { Species, Trait } from '@/hooks';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import {
  canContinueAncestryMixed,
  canContinueAncestrySingle,
  combineSpeciesSizes,
  toggleMixedSpeciesSkillSelection,
  buildMixedSpeciesSkillOptions,
} from '@/lib/ancestry/ancestry-selection';
import {
  buildAncestryPickTasks,
  buildMixedAncestryPickTasks,
  hasRequiredMixedSpeciesSkills,
  resolveFlawSpeciesIdForMixedPick,
  type AncestryPickTask,
} from '@/lib/guided-creator/ancestry-pick-tasks';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import { buildGuidedMixedSpeciesDraftPatch } from '@/lib/guided-creator/species-selection-draft';
import { resolveForwardLandingPhaseIndex } from '@/lib/guided-creator/ancestry-forward-landing';
import { landsOnFirstInnerScreen } from '@/lib/guided-creator/guided-substep-nav';
import { useGuidedCreatorStore, type GuidedDraft } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedMixedSpeciesOverview } from '../guided-mixed-species-overview';
import { GuidedTraitRestrictionNotice } from '../guided-restriction-notice';
import { GuidedStepLayout } from '../guided-step-layout';
import { SpeciesRevealPanel } from '../species-reveal-panel';
import { getSpeciesSizeOptions } from '../guided-species-utils';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getTraitRestrictionNotice } from '@/lib/codex/feat-restriction-notice';

const stepCopy = GUIDED_CREATOR_COPY.steps.ancestry;
const overviewCopy = stepCopy.speciesOverview;

function isTaskFilled(
  task: AncestryPickTask,
  draft: GuidedDraft,
  mixedSkillOptionCount: number
): boolean {
  switch (task.phase) {
    case 'species-trait-option':
      return Boolean(task.parentTraitId && draft.selectedSpeciesTraitChoices[task.parentTraitId]);
    case 'mixed-species-trait-a':
      return Boolean(draft.selectedSpeciesTraits[0]);
    case 'mixed-species-trait-b':
      return Boolean(draft.selectedSpeciesTraits[1]);
    case 'mixed-species-skills':
      return hasRequiredMixedSpeciesSkills(
        mixedSkillOptionCount,
        draft.selectedSpeciesSkillIds.length
      );
    case 'ancestry-trait-1':
      return draft.selectedAncestryTraitIds.length >= 1;
    case 'characteristic':
      return Boolean(draft.selectedCharacteristicId);
    case 'flaw':
      return draft.selectedFlawId !== null;
    case 'ancestry-trait-2':
      return draft.selectedAncestryTraitIds.length >= 2;
    default:
      return false;
  }
}

function resolveInitialPhaseIndex(
  tasks: AncestryPickTask[],
  draft: GuidedDraft,
  ancestryAlreadyComplete: boolean,
  mixedSkillOptionCount: number
): number {
  if (tasks.length === 0) return 0;
  if (ancestryAlreadyComplete) return tasks.length;
  const hasProgress = tasks.some((task) => isTaskFilled(task, draft, mixedSkillOptionCount));
  if (!hasProgress) return 0;
  const firstOpen = tasks.findIndex((task) => !isTaskFilled(task, draft, mixedSkillOptionCount));
  return firstOpen >= 0 ? firstOpen + 1 : tasks.length;
}

export function AncestryStep() {
  const {
    draft,
    updateDraft,
    prevSubStep,
    nextSubStep,
    completedSubSteps,
    navigationIntent,
    entryNonce,
  } = useGuidedCreatorStore();
  const { data: allSpecies = [], isLoading: speciesLoading } = useMergedSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const { data: allTraits = [], isLoading: traitsLoading } = useTraits();
  const { data: codexSkills = [] } = useCodexSkills();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showMixedModal, setShowMixedModal] = useState(false);
  const phaseInitialized = useRef(false);
  const lastEntryNonce = useRef<number | null>(null);
  const ancestryChapterComplete = completedSubSteps.includes('ancestry');

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies as Species[]),
    [draft, allSpecies]
  );
  const { isMixed, species, speciesA, speciesB, displayName, ready } = speciesContext;

  const userSpeciesIds = useMemo(
    () => new Set((userSpeciesList ?? []).map((s) => s.id)),
    [userSpeciesList]
  );

  const mixedSkillOptionCount = useMemo(() => {
    if (!isMixed || !speciesA || !speciesB) return 0;
    const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
    return Array.from(new Set(merged.map(String))).length;
  }, [isMixed, speciesA, speciesB]);

  const tasks = useMemo((): AncestryPickTask[] => {
    if (!allTraits.length) return [];
    if (isMixed && speciesA && speciesB) {
      return buildMixedAncestryPickTasks({
        speciesA,
        speciesB,
        allTraits,
        allSkills: codexSkills,
        selectedFlawId: draft.selectedFlawId,
        selectedAncestryTraitIds: draft.selectedAncestryTraitIds,
        selectedFlawSpeciesId: draft.selectedFlawSpeciesId,
      });
    }
    if (species) {
      return buildAncestryPickTasks({
        species,
        allTraits,
        selectedFlawId: draft.selectedFlawId,
        selectedAncestryTraitIds: draft.selectedAncestryTraitIds,
      });
    }
    return [];
  }, [
    isMixed,
    species,
    speciesA,
    speciesB,
    allTraits,
    codexSkills,
    draft.selectedFlawId,
    draft.selectedAncestryTraitIds,
    draft.selectedFlawSpeciesId,
  ]);

  const showOverview = ready;
  const isOverview = showOverview && phaseIndex === 0;
  const pickIndex = showOverview ? phaseIndex - 1 : phaseIndex;
  const currentTask =
    pickIndex >= 0 ? tasks[Math.min(pickIndex, Math.max(0, tasks.length - 1))] : undefined;
  const totalPicks = tasks.length;

  const [trackedSpeciesId, setTrackedSpeciesId] = useState(draft.speciesId);
  if (draft.speciesId !== trackedSpeciesId) {
    setTrackedSpeciesId(draft.speciesId);
    setPhaseIndex(0);
  }

  useEffect(() => {
    phaseInitialized.current = false;
    lastEntryNonce.current = null;
  }, [draft.speciesId]);

  useEffect(() => {
    if (!ready || !isMixed || !speciesA || !speciesB) return;
    if (mixedSkillOptionCount > 2) return;
    const options = buildMixedSpeciesSkillOptions(speciesA, speciesB, codexSkills);
    const ids = options.map((o) => o.id);
    if (ids.length === 0) return;
    const current = draft.selectedSpeciesSkillIds;
    if (current.length === ids.length && ids.every((id) => current.includes(id))) return;
    updateDraft({ selectedSpeciesSkillIds: ids });
  }, [
    ready,
    isMixed,
    speciesA,
    speciesB,
    codexSkills,
    mixedSkillOptionCount,
    draft.selectedSpeciesSkillIds,
    updateDraft,
  ]);

  useEffect(() => {
    if (!ready) return;

    if (!isMixed && species) {
      const sizes = getSpeciesSizeOptions(species);
      if (sizes.length === 1 && !draft.selectedSize) {
        updateDraft({ selectedSize: sizes[0] });
      }
      return;
    }

    if (isMixed && speciesA && speciesB) {
      const sizes = combineSpeciesSizes(speciesA, speciesB);
      if (sizes.length === 1 && !draft.selectedSize) {
        updateDraft({ selectedSize: sizes[0] });
      }
    }
  }, [ready, isMixed, species, speciesA, speciesB, draft.selectedSize, updateDraft]);

  useEffect(() => {
    if (!ready) return;

    if (landsOnFirstInnerScreen(navigationIntent)) {
      if (lastEntryNonce.current !== entryNonce) {
        lastEntryNonce.current = entryNonce;
        setPhaseIndex(resolveForwardLandingPhaseIndex(tasks, draft));
        phaseInitialized.current = true;
      }
      return;
    }

    if (lastEntryNonce.current === entryNonce && phaseInitialized.current) return;
    lastEntryNonce.current = entryNonce;
    setPhaseIndex(
      resolveInitialPhaseIndex(tasks, draft, ancestryChapterComplete, mixedSkillOptionCount)
    );
    phaseInitialized.current = true;
  }, [
    tasks,
    draft,
    ancestryChapterComplete,
    ready,
    navigationIntent,
    entryNonce,
    mixedSkillOptionCount,
  ]);

  const isSelected = useCallback(
    (trait: Trait, task: AncestryPickTask | undefined = currentTask): boolean => {
      const id = String(trait.id);
      if (!task) return false;
      switch (task.phase) {
        case 'species-trait-option':
          return task.parentTraitId
            ? draft.selectedSpeciesTraitChoices[task.parentTraitId] === id
            : false;
        case 'mixed-species-trait-a':
          return draft.selectedSpeciesTraits[0] === id;
        case 'mixed-species-trait-b':
          return draft.selectedSpeciesTraits[1] === id;
        case 'ancestry-trait-1':
          return draft.selectedAncestryTraitIds[0] === id;
        case 'characteristic':
          return draft.selectedCharacteristicId === id;
        case 'flaw':
          return draft.selectedFlawId === id;
        case 'ancestry-trait-2':
          return draft.selectedAncestryTraitIds[1] === id;
        default:
          return false;
      }
    },
    [currentTask, draft]
  );

  const isSkillSelected = useCallback(
    (skillId: string) => draft.selectedSpeciesSkillIds.includes(skillId),
    [draft.selectedSpeciesSkillIds]
  );

  const skipFlawSelected = Boolean(currentTask?.optional && draft.selectedFlawId === '');

  const hasCurrentPick = useMemo(() => {
    if (!currentTask) return false;
    if (currentTask.phase === 'mixed-species-skills') {
      return hasRequiredMixedSpeciesSkills(
        mixedSkillOptionCount,
        draft.selectedSpeciesSkillIds.length
      );
    }
    if (skipFlawSelected) return true;
    return currentTask.options.some((t) => isSelected(t, currentTask));
  }, [currentTask, isSelected, skipFlawSelected, mixedSkillOptionCount, draft.selectedSpeciesSkillIds]);

  const handlePick = useCallback(
    (trait: Trait) => {
      if (!currentTask) return;
      const id = String(trait.id);

      switch (currentTask.phase) {
        case 'species-trait-option':
          if (currentTask.parentTraitId) {
            updateDraft({
              selectedSpeciesTraitChoices: {
                ...draft.selectedSpeciesTraitChoices,
                [currentTask.parentTraitId]: id,
              },
            });
          }
          break;
        case 'mixed-species-trait-a': {
          const next = [...draft.selectedSpeciesTraits];
          next[0] = id;
          updateDraft({ selectedSpeciesTraits: next });
          break;
        }
        case 'mixed-species-trait-b': {
          const next = [...draft.selectedSpeciesTraits];
          next[1] = id;
          updateDraft({ selectedSpeciesTraits: next });
          break;
        }
        case 'ancestry-trait-1': {
          const prev = draft.selectedAncestryTraitIds;
          if (prev[0] === id) break;
          updateDraft({ selectedAncestryTraitIds: [id] });
          break;
        }
        case 'characteristic':
          updateDraft({ selectedCharacteristicId: id });
          break;
        case 'flaw': {
          if (isMixed && speciesA && speciesB) {
            const flawSpeciesId = resolveFlawSpeciesIdForMixedPick(id, speciesA, speciesB);
            updateDraft({
              selectedFlawId: id,
              selectedFlawSpeciesId: flawSpeciesId,
              selectedAncestryTraitIds: draft.selectedAncestryTraitIds.slice(0, 1),
            });
          } else {
            updateDraft({ selectedFlawId: id });
          }
          break;
        }
        case 'ancestry-trait-2': {
          const first = draft.selectedAncestryTraitIds[0];
          if (!first) break;
          updateDraft({ selectedAncestryTraitIds: [first, id] });
          break;
        }
      }
    },
    [currentTask, draft, updateDraft, isMixed, speciesA, speciesB]
  );

  const handleSkillPick = useCallback(
    (skillId: string) => {
      updateDraft({
        selectedSpeciesSkillIds: toggleMixedSpeciesSkillSelection(
          draft.selectedSpeciesSkillIds,
          skillId
        ),
      });
    },
    [draft.selectedSpeciesSkillIds, updateDraft]
  );

  const advanceAfterPick = useCallback(() => {
    const isLastTask = pickIndex >= totalPicks - 1;
    if (isLastTask) {
      nextSubStep();
    } else {
      setPhaseIndex((i) => i + 1);
    }
  }, [pickIndex, totalPicks, nextSubStep]);

  const handleSkipFlaw = useCallback(() => {
    updateDraft({
      selectedFlawId: '',
      selectedFlawSpeciesId: null,
      selectedAncestryTraitIds: draft.selectedAncestryTraitIds.slice(0, 1),
    });
  }, [draft.selectedAncestryTraitIds, updateDraft]);

  const ancestryComplete = useMemo(() => {
    if (!ready || !allTraits.length) return false;

    if (isMixed && speciesA && speciesB) {
      const sizes = combineSpeciesSizes(speciesA, speciesB);
      const sizeOk = sizes.length <= 1 || Boolean(draft.selectedSize);
      if (!sizeOk) return false;
      return canContinueAncestryMixed({
        selectedSpeciesTraits: [
          draft.selectedSpeciesTraits[0] ?? '',
          draft.selectedSpeciesTraits[1] ?? '',
        ],
        selectedTraitIds: draft.selectedAncestryTraitIds,
        ancestryTraitCount: 1,
        selectedSize: draft.selectedSize ?? undefined,
        mixedSkillOptionCount,
        selectedSpeciesSkillIds: draft.selectedSpeciesSkillIds,
      });
    }

    if (!species) return false;

    const speciesTraits = resolveTraitIds(species.species_traits || [], allTraits);
    for (const trait of speciesTraits) {
      const optionIds = getChoiceOptionIds(trait);
      if (optionIds.length > 0 && !draft.selectedSpeciesTraitChoices[String(trait.id)]) {
        return false;
      }
    }

    if (!draft.selectedCharacteristicId) return false;
    if (draft.selectedFlawId && draft.selectedAncestryTraitIds.length < 2) return false;

    return canContinueAncestrySingle({
      selectedTraitIds: draft.selectedAncestryTraitIds,
      ancestryTraitCount: 1,
      speciesChoiceParents: speciesTraits.filter((t) => getChoiceOptionIds(t).length > 0),
      speciesTraitChoices: draft.selectedSpeciesTraitChoices,
    });
  }, [
    ready,
    allTraits,
    isMixed,
    species,
    speciesA,
    speciesB,
    draft,
    mixedSkillOptionCount,
  ]);

  const handleAncestryBack = () => {
    if (phaseIndex > 0) {
      setPhaseIndex((i) => i - 1);
      return;
    }
    prevSubStep();
  };

  const handleAncestryContinue = () => {
    if (isOverview) {
      if (totalPicks === 0) {
        if (ancestryComplete) nextSubStep();
        return;
      }
      setPhaseIndex(1);
      return;
    }

    if (!currentTask) {
      if (ancestryComplete) nextSubStep();
      return;
    }

    if (currentTask.optional && !hasCurrentPick) {
      handleSkipFlaw();
      nextSubStep();
      return;
    }

    advanceAfterPick();
  };

  const handleMixedConfirm = (
    nextA: { id: string; name: string },
    nextB: { id: string; name: string }
  ) => {
    updateDraft(buildGuidedMixedSpeciesDraftPatch(draft, nextA, nextB));
    setShowMixedModal(false);
  };

  const sizeOptions = isMixed
    ? speciesA && speciesB
      ? combineSpeciesSizes(speciesA, speciesB)
      : []
    : species
      ? getSpeciesSizeOptions(species)
      : [];
  const sizeOk = sizeOptions.length <= 1 || Boolean(draft.selectedSize);

  const footerCanContinue = isOverview
    ? (totalPicks > 0 || ancestryComplete) && sizeOk
    : currentTask
      ? currentTask.phase === 'mixed-species-skills' || currentTask.optional || hasCurrentPick
      : ancestryComplete;

  const overviewTitle = isMixed
    ? overviewCopy.title(displayName ?? 'Mixed species')
    : overviewCopy.title(species?.name ?? 'species');

  const stepTitle = isOverview
    ? overviewTitle
    : (currentTask?.title ?? GUIDED_CREATOR_COPY.chapters.ancestry.title);

  const stepDescription = isOverview ? overviewCopy.description : currentTask?.description;

  const continueLabel = isOverview ? overviewCopy.continueLabel : stepCopy.nextPick;

  const loading = speciesLoading || traitsLoading;

  return (
    <GuidedStepLayout
      subStep="ancestry"
      title={stepTitle}
      description={stepDescription}
      canContinue={footerCanContinue}
      continueLabel={continueLabel}
      footerBack={handleAncestryBack}
      footerContinue={handleAncestryContinue}
      completionHint={
        !isOverview && totalPicks > 0 && currentTask ? (
          <span className="font-nunito">
            {pickIndex + 1} / {totalPicks} picks
          </span>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !ready ? (
        <p className="font-nunito text-text-secondary">{stepCopy.selectSpeciesFirst}</p>
      ) : isOverview ? (
        isMixed && speciesA && speciesB ? (
          <GuidedMixedSpeciesOverview
            speciesA={speciesA}
            speciesB={speciesB}
            selectedSize={draft.selectedSize}
            onSizeChange={(size) => updateDraft({ selectedSize: size })}
            onChangeParents={() => setShowMixedModal(true)}
          />
        ) : species ? (
          <SpeciesRevealPanel
            species={species}
            allTraits={allTraits}
            selectedSize={draft.selectedSize}
            onSizeChange={(size) => updateDraft({ selectedSize: size })}
          />
        ) : null
      ) : !currentTask ? (
        <p className="font-nunito text-text-secondary">{stepCopy.emptyOptions}</p>
      ) : currentTask.phase === 'mixed-species-skills' ? (
        <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
          {(currentTask.skillOptions ?? []).map((opt) => (
            <GuidedChoiceCard
              key={opt.id}
              density="compact"
              title={opt.name}
              description={opt.description}
              selected={isSkillSelected(opt.id)}
              onSelect={() => handleSkillPick(opt.id)}
              selectAriaLabel={`Choose ${opt.name}`}
            />
          ))}
        </div>
      ) : (
        <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
          {currentTask.options.map((trait) => (
            <GuidedChoiceCard
              key={trait.id}
              density="compact"
              title={trait.name}
              description={trait.description}
              selected={isSelected(trait)}
              onSelect={() => handlePick(trait)}
              expandedExtra={
                getTraitRestrictionNotice(trait) ? (
                  <GuidedTraitRestrictionNotice trait={trait} />
                ) : undefined
              }
            />
          ))}
          {currentTask.optional ? (
            <GuidedChoiceCard
              density="compact"
              title={stepCopy.skipFlaw}
              description={stepCopy.skipFlawDescription}
              selected={skipFlawSelected}
              onSelect={handleSkipFlaw}
              selectAriaLabel={stepCopy.skipFlaw}
            />
          ) : null}
        </div>
      )}
      {isMixed ? (
        <MixedSpeciesModal
          isOpen={showMixedModal}
          onClose={() => setShowMixedModal(false)}
          onConfirm={handleMixedConfirm}
          allSpecies={allSpecies}
          userSpeciesIds={userSpeciesIds}
          initialSpeciesAId={draft.mixedSpeciesIds?.[0]}
          initialSpeciesBId={draft.mixedSpeciesIds?.[1]}
        />
      ) : null}
    </GuidedStepLayout>
  );
}
