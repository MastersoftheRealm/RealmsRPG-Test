/**
 * Ancestry micro-flow: species overview, then one pick at a time.
 * Select a trait, confirm with Next pick, Back revisits prior picks.
 * Deferred: mixed species.
 */

'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Button, Spinner } from '@/components/ui';
import { useMergedSpecies, useTraits, resolveTraitIds } from '@/hooks';
import type { Species, Trait } from '@/hooks';
import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';
import { useGuidedCreatorStore, type GuidedDraft } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import { SpeciesRevealPanel } from '../species-reveal-panel';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.ancestry;
const overviewCopy = stepCopy.speciesOverview;

type AncestryPhase =
  | 'species-trait-option'
  | 'ancestry-trait-1'
  | 'characteristic'
  | 'flaw'
  | 'ancestry-trait-2'
  | 'done';

interface PickTask {
  phase: AncestryPhase;
  title: string;
  description: string;
  options: Trait[];
  parentTraitId?: string;
  optional?: boolean;
}

function resolveTraits(ids: (string | number)[], allTraits: Trait[]): Trait[] {
  return resolveTraitIds(ids, allTraits);
}

function isTaskFilled(task: PickTask, draft: GuidedDraft): boolean {
  switch (task.phase) {
    case 'species-trait-option':
      return Boolean(task.parentTraitId && draft.selectedSpeciesTraitChoices[task.parentTraitId]);
    case 'ancestry-trait-1':
      return draft.selectedAncestryTraitIds.length >= 1;
    case 'characteristic':
      return Boolean(draft.selectedCharacteristicId);
    case 'flaw':
      return Boolean(draft.selectedFlawId);
    case 'ancestry-trait-2':
      return draft.selectedAncestryTraitIds.length >= 2;
    default:
      return false;
  }
}

function resolveInitialPhaseIndex(
  tasks: PickTask[],
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
  const { draft, updateDraft, prevSubStep, nextSubStep, completedSubSteps } = useGuidedCreatorStore();
  const { data: allSpecies = [], isLoading: speciesLoading } = useMergedSpecies();
  const { data: allTraits = [], isLoading: traitsLoading } = useTraits();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phaseInitialized = useRef(false);
  const ancestryChapterComplete = completedSubSteps.includes('ancestry');

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null,
    [allSpecies, draft.speciesId]
  );

  const tasks = useMemo((): PickTask[] => {
    if (!species || !allTraits.length) return [];

    const list: PickTask[] = [];
    const speciesTraits = resolveTraits(species.species_traits || [], allTraits);

    speciesTraits.forEach((trait) => {
      const optionIds = getChoiceOptionIds(trait);
      if (optionIds.length > 0) {
        const options = resolveChoiceOptionTraits(optionIds, allTraits);
        if (options.length > 0) {
          list.push({
            phase: 'species-trait-option',
            title: `Choose your ${trait.name}`,
            description: trait.description || 'Pick the option that fits your character.',
            options,
            parentTraitId: String(trait.id),
          });
        }
      }
    });

    list.push({
      phase: 'ancestry-trait-1',
      title: 'Pick an ancestry trait',
      description: 'This trait makes your character distinct within their species.',
      options: resolveTraits(species.ancestry_traits || [], allTraits),
    });

    list.push({
      phase: 'characteristic',
      title: 'Pick a characteristic',
      description: 'A personal detail that adds flavor to who you are.',
      options: resolveTraits(species.characteristics || [], allTraits),
    });

    list.push({
      phase: 'flaw',
      title: 'Take a flaw? (optional)',
      description: 'Flaws add depth — and grant an extra ancestry trait.',
      options: resolveTraits(species.flaws || [], allTraits),
      optional: true,
    });

    if (draft.selectedFlawId) {
      const firstAncestryId = draft.selectedAncestryTraitIds[0];
      list.push({
        phase: 'ancestry-trait-2',
        title: 'Pick your bonus ancestry trait',
        description: 'Your flaw grants one additional ancestry trait.',
        options: resolveTraits(species.ancestry_traits || [], allTraits).filter(
          (t) => !firstAncestryId || String(t.id) !== firstAncestryId
        ),
      });
    }

    return list;
  }, [species, allTraits, draft.selectedFlawId, draft.selectedAncestryTraitIds]);

  const showOverview = Boolean(species);
  const isOverview = showOverview && phaseIndex === 0;
  const pickIndex = showOverview ? phaseIndex - 1 : phaseIndex;
  const currentTask = pickIndex >= 0 ? tasks[Math.min(pickIndex, Math.max(0, tasks.length - 1))] : undefined;
  const totalPicks = tasks.length;

  useEffect(() => {
    phaseInitialized.current = false;
    setPhaseIndex(0);
  }, [draft.speciesId]);

  useEffect(() => {
    if (phaseInitialized.current || !species) return;
    setPhaseIndex(resolveInitialPhaseIndex(tasks, draft, ancestryChapterComplete));
    phaseInitialized.current = true;
  }, [tasks, draft, ancestryChapterComplete, species]);

  const isSelected = useCallback(
    (trait: Trait, task: PickTask | undefined = currentTask): boolean => {
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

  const hasCurrentPick = useMemo(() => {
    if (!currentTask) return false;
    return currentTask.options.some((t) => isSelected(t, currentTask));
  }, [currentTask, isSelected]);

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
        case 'ancestry-trait-1':
          updateDraft({ selectedAncestryTraitIds: [id] });
          break;
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

  const handleSkipFlaw = () => {
    updateDraft({
      selectedFlawId: null,
      selectedAncestryTraitIds: draft.selectedAncestryTraitIds.slice(0, 1),
    });
  };

  const ancestryComplete = useMemo(() => {
    if (!species || !allTraits.length) return false;

    const speciesTraits = resolveTraits(species.species_traits || [], allTraits);
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
      handleSkipFlaw();
      nextSubStep();
      return;
    }

    const isLastTask = pickIndex >= totalPicks - 1;
    if (isLastTask) {
      nextSubStep();
      return;
    }

    setPhaseIndex((i) => i + 1);
  };

  const footerCanContinue = isOverview
    ? totalPicks > 0 || ancestryComplete
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
        <SpeciesRevealPanel species={species as Species} allTraits={allTraits} />
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
              />
            ))}
          </div>
          {currentTask.optional && (
            <div className="mt-4">
              <Button variant="secondary" onClick={handleSkipFlaw} className="min-h-11">
                {stepCopy.skipFlaw}
              </Button>
            </div>
          )}
        </>
      )}
    </GuidedStepLayout>
  );
}
