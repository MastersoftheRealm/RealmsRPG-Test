/**
 * Ancestry micro-flow: species overview, then one pick at a time.
 * Select a trait, confirm with Next pick, Back revisits prior picks.
 * Deferred: mixed species.
 */

'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Spinner } from '@/components/ui';
import { useMergedSpecies, useTraits, resolveTraitIds } from '@/hooks';
import type { Species, Trait } from '@/hooks';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import {
  buildAncestryPickTasks,
  type AncestryPickTask,
} from '@/lib/guided-creator/ancestry-pick-tasks';
import { landsOnFirstInnerScreen } from '@/lib/guided-creator/guided-substep-nav';
import { useGuidedCreatorStore, type GuidedDraft } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedTraitRestrictionNotice } from '../guided-restriction-notice';
import { GuidedStepLayout } from '../guided-step-layout';
import { SpeciesRevealPanel } from '../species-reveal-panel';
import { getSpeciesSizeOptions } from '../guided-species-utils';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getTraitRestrictionNotice } from '@/lib/codex/feat-restriction-notice';

const stepCopy = GUIDED_CREATOR_COPY.steps.ancestry;
const overviewCopy = stepCopy.speciesOverview;

function isTaskFilled(task: AncestryPickTask, draft: GuidedDraft): boolean {
  switch (task.phase) {
    case 'species-trait-option':
      return Boolean(task.parentTraitId && draft.selectedSpeciesTraitChoices[task.parentTraitId]);
    case 'ancestry-trait-1':
      return draft.selectedAncestryTraitIds.length >= 1;
    case 'characteristic':
      return Boolean(draft.selectedCharacteristicId);
    case 'flaw':
      // null = not decided yet; '' = explicitly skipped; id = chosen
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
  ancestryAlreadyComplete: boolean
): number {
  if (tasks.length === 0) return 0;
  if (ancestryAlreadyComplete) return tasks.length;
  // Always show the species overview first when no ancestry picks exist yet.
  const hasProgress = tasks.some((task) => isTaskFilled(task, draft));
  if (!hasProgress) return 0;
  const firstOpen = tasks.findIndex((task) => !isTaskFilled(task, draft));
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
  const { data: allTraits = [], isLoading: traitsLoading } = useTraits();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phaseInitialized = useRef(false);
  const lastEntryNonce = useRef<number | null>(null);
  const ancestryChapterComplete = completedSubSteps.includes('ancestry');

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null,
    [allSpecies, draft.speciesId]
  );

  const tasks = useMemo((): AncestryPickTask[] => {
    if (!species || !allTraits.length) return [];
    return buildAncestryPickTasks({
      species,
      allTraits,
      selectedFlawId: draft.selectedFlawId,
      selectedAncestryTraitIds: draft.selectedAncestryTraitIds,
    });
  }, [species, allTraits, draft.selectedFlawId, draft.selectedAncestryTraitIds]);

  const showOverview = Boolean(species);
  const isOverview = showOverview && phaseIndex === 0;
  const pickIndex = showOverview ? phaseIndex - 1 : phaseIndex;
  const currentTask = pickIndex >= 0 ? tasks[Math.min(pickIndex, Math.max(0, tasks.length - 1))] : undefined;
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
    if (!species) return;
    const sizes = getSpeciesSizeOptions(species);
    if (sizes.length === 1 && !draft.selectedSize) {
      updateDraft({ selectedSize: sizes[0] });
    }
  }, [species, draft.selectedSize, updateDraft]);

  useEffect(() => {
    if (!species) return;

    // Chapter rail / Continue: land on species overview (never jump to furthest pick).
    if (landsOnFirstInnerScreen(navigationIntent)) {
      if (lastEntryNonce.current !== entryNonce) {
        lastEntryNonce.current = entryNonce;
        setPhaseIndex(0);
        phaseInitialized.current = true;
      }
      return;
    }

    // Footer Back: resume last inner screen (sequential history).
    if (lastEntryNonce.current === entryNonce && phaseInitialized.current) return;
    lastEntryNonce.current = entryNonce;
    setPhaseIndex(resolveInitialPhaseIndex(tasks, draft, ancestryChapterComplete));
    phaseInitialized.current = true;
  }, [tasks, draft, ancestryChapterComplete, species, navigationIntent, entryNonce]);

  const isSelected = useCallback(
    (trait: Trait, task: AncestryPickTask | undefined = currentTask): boolean => {
      const id = String(trait.id);
      if (!task) return false;
      switch (task.phase) {
        case 'species-trait-option':
          return task.parentTraitId
            ? draft.selectedSpeciesTraitChoices[task.parentTraitId] === id
            : false;
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

  const skipFlawSelected = Boolean(currentTask?.optional && draft.selectedFlawId === '');

  const hasCurrentPick = useMemo(() => {
    if (!currentTask) return false;
    if (skipFlawSelected) return true;
    return currentTask.options.some((t) => isSelected(t, currentTask));
  }, [currentTask, isSelected, skipFlawSelected]);

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
        case 'ancestry-trait-1': {
          // Re-selecting the same first trait must not wipe a second trait from a flaw.
          const prev = draft.selectedAncestryTraitIds;
          if (prev[0] === id) break;
          updateDraft({ selectedAncestryTraitIds: [id] });
          break;
        }
        case 'characteristic':
          updateDraft({ selectedCharacteristicId: id });
          break;
        case 'flaw':
          updateDraft({ selectedFlawId: id });
          break;
        case 'ancestry-trait-2': {
          const first = draft.selectedAncestryTraitIds[0];
          if (!first) break;
          updateDraft({
            selectedAncestryTraitIds: [first, id],
          });
          break;
        }
      }
    },
    [currentTask, draft, updateDraft]
  );

  const advanceAfterPick = useCallback(() => {
    const isLastTask = pickIndex >= totalPicks - 1;
    if (isLastTask) {
      nextSubStep();
    } else {
      setPhaseIndex((i) => i + 1);
    }
  }, [pickIndex, totalPicks, nextSubStep]);

  /** Explicit decline — same card pattern as flaw options; footer Continue advances. */
  const handleSkipFlaw = useCallback(() => {
    updateDraft({
      selectedFlawId: '',
      selectedAncestryTraitIds: draft.selectedAncestryTraitIds.slice(0, 1),
    });
  }, [draft.selectedAncestryTraitIds, updateDraft]);

  const ancestryComplete = useMemo(() => {
    if (!species || !allTraits.length) return false;

    const speciesTraits = resolveTraitIds(species.species_traits || [], allTraits);
    for (const trait of speciesTraits) {
      const optionIds = getChoiceOptionIds(trait);
      if (optionIds.length > 0 && !draft.selectedSpeciesTraitChoices[String(trait.id)]) {
        return false;
      }
    }

    if (draft.selectedAncestryTraitIds.length < 1) return false;
    if (!draft.selectedCharacteristicId) return false;
    if (draft.selectedFlawId && draft.selectedAncestryTraitIds.length < 2) return false;

    return true;
  }, [
    species,
    allTraits,
    draft.selectedSpeciesTraitChoices,
    draft.selectedAncestryTraitIds,
    draft.selectedCharacteristicId,
    draft.selectedFlawId,
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
      updateDraft({
        selectedFlawId: '',
        selectedAncestryTraitIds: draft.selectedAncestryTraitIds.slice(0, 1),
      });
      nextSubStep();
      return;
    }

    advanceAfterPick();
  };

  const sizeOptions = species ? getSpeciesSizeOptions(species) : [];
  const sizeOk = sizeOptions.length <= 1 || Boolean(draft.selectedSize);

  const footerCanContinue = isOverview
    ? (totalPicks > 0 || ancestryComplete) && sizeOk
    : currentTask
      ? currentTask.optional || hasCurrentPick
      : ancestryComplete;

  const stepTitle = isOverview
    ? overviewCopy.title(species?.name ?? 'species')
    : (currentTask?.title ?? GUIDED_CREATOR_COPY.chapters.ancestry.title);

  const stepDescription = isOverview
    ? overviewCopy.description
    : currentTask?.description;

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
      ) : !species ? (
        <p className="font-nunito text-text-secondary">{stepCopy.selectSpeciesFirst}</p>
      ) : isOverview ? (
        <SpeciesRevealPanel
          species={species as Species}
          allTraits={allTraits}
          selectedSize={draft.selectedSize}
          onSizeChange={(size) => updateDraft({ selectedSize: size })}
        />
      ) : !currentTask ? (
        <p className="font-nunito text-text-secondary">{stepCopy.emptyOptions}</p>
      ) : (
        <>
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
            {currentTask.optional && (
              <GuidedChoiceCard
                density="compact"
                title={stepCopy.skipFlaw}
                description={stepCopy.skipFlawDescription}
                selected={skipFlawSelected}
                onSelect={handleSkipFlaw}
                selectAriaLabel={stepCopy.skipFlaw}
              />
            )}
          </div>
        </>
      )}
    </GuidedStepLayout>
  );
}

