/**
 * Guided · Chapter 1 · Species
 * ============================
 * Choose a species. Species are path-ambiguous (no per-path recommendations).
 * Layer 1 surfaces a curated "starter" set; "Show all species" reveals the rest.
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useMergedSpecies } from '@/hooks';
import type { Species } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-grid';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.species;

export function SpeciesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { data: allSpecies = [], isLoading } = useMergedSpecies();
  const [showAll, setShowAll] = useState(false);

  const hasStarters = useMemo(() => allSpecies.some((s) => (s as Species).is_starter), [allSpecies]);

  const visibleSpecies = useMemo(() => {
    if (!hasStarters || showAll) return allSpecies;
    return allSpecies.filter((s) => (s as Species).is_starter);
  }, [allSpecies, hasStarters, showAll]);

  const handleSelect = (species: Species) => {
    const changed = draft.speciesId !== String(species.id);
    updateDraft({
      speciesId: String(species.id),
      speciesName: species.name,
      // Reset ancestry selections (they are species-specific).
      ...(changed
        ? {
            selectedSpeciesTraitChoices: {},
            selectedAncestryTraitIds: [],
            selectedCharacteristicId: null,
            selectedFlawId: null,
          }
        : {}),
    });
  };

  return (
    <GuidedStepLayout
      subStep="species"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={Boolean(draft.speciesId)}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : visibleSpecies.length === 0 ? (
        <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
      ) : (
        <>
          <div className={GUIDED_CHOICE_GRID_CLASS}>
            {visibleSpecies.map((species) => (
              <GuidedChoiceCard
                key={species.id}
                className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                imageKind="species"
                imageRecord={species}
                title={species.name}
                description={species.description}
                selected={draft.speciesId === String(species.id)}
                onSelect={() => handleSelect(species as Species)}
              />
            ))}
          </div>

          {hasStarters && !showAll && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-sm font-medium text-primary-fg hover:underline min-h-11"
              >
                {stepCopy.showAll}
              </button>
            </div>
          )}
        </>
      )}
    </GuidedStepLayout>
  );
}
