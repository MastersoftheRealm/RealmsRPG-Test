/**
 * Guided · Chapter 1 · Species
 * ============================
 * Choose a species. Species are path-ambiguous (no per-path recommendations).
 * Layer 1 surfaces a curated "starter" set; "Show all species" reveals the rest.
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { useMergedSpecies } from '@/hooks';
import type { Species } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from '../guided-choice-card';
import { getSpeciesSizeOptions } from '../guided-species-utils';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-styles';

import { GuidedSpeciesDetailModal } from '../guided-species-detail-modal';
import { GuidedStepLayout } from '../guided-step-layout';

const stepCopy = GUIDED_CREATOR_COPY.steps.species;

export function SpeciesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { data: allSpecies = [], isLoading } = useMergedSpecies();
  const [showAll, setShowAll] = useState(false);
  const [detailSpeciesId, setDetailSpeciesId] = useState<string | null>(null);

  const hasStarters = useMemo(() => allSpecies.some((s) => (s as Species).is_starter), [allSpecies]);

  const visibleSpecies = useMemo(() => {
    if (!hasStarters || showAll) return allSpecies;
    return allSpecies.filter((s) => (s as Species).is_starter);
  }, [allSpecies, hasStarters, showAll]);

  // Lookup against full list so "Back to starters" does not dismiss an open non-starter modal.
  const detailSpecies = useMemo(
    () =>
      (allSpecies.find((s) => String(s.id) === detailSpeciesId) as Species | undefined) ?? null,
    [allSpecies, detailSpeciesId]
  );

  const handleSelect = (species: Species) => {
    const changed = draft.speciesId !== String(species.id);
    const sizeOptions = getSpeciesSizeOptions(species);
    updateDraft({
      speciesId: String(species.id),
      speciesName: species.name,
      ...(changed
        ? {
            selectedSize: sizeOptions.length === 1 ? sizeOptions[0] : null,
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
                density="species"
                imageKind="species"
                imageRecord={species}
                title={species.name}
                description={species.description}
                selected={draft.speciesId === String(species.id)}
                onSelect={() => handleSelect(species as Species)}
                onDetails={() => setDetailSpeciesId(String(species.id))}
              />
            ))}
          </div>

          {hasStarters && !showAll ? (
            <GuidedLayerNav expandLabel={stepCopy.showAll} onExpand={() => setShowAll(true)} />
          ) : null}
          {hasStarters && showAll ? (
            <GuidedLayerNav
              collapseLabel={stepCopy.backToStarters}
              onCollapse={() => setShowAll(false)}
            />
          ) : null}

          <GuidedSpeciesDetailModal
            isOpen={detailSpecies != null}
            onClose={() => setDetailSpeciesId(null)}
            species={detailSpecies}
            onSelect={detailSpecies ? () => handleSelect(detailSpecies) : undefined}
          />
        </>
      )}
    </GuidedStepLayout>
  );
}
