/**
 * Guided · Chapter 1 · Species
 * ============================
 * L1: starter species. L2: all species + Mixed Species card. L3: Create Species (new tab).
 * Species are path-ambiguous (no per-path recommendations).
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { GitMerge } from 'lucide-react';
import { Spinner, EmptyState, Button } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { guidedNavPreviousClassName } from '@/components/shared/guided-choice/guided-nav-button-styles';
import { useMergedSpecies, useUserSpecies } from '@/hooks';
import type { Species } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedDeepEntryOnArrival } from '@/lib/guided-creator/use-guided-deep-entry-on-arrival';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { MixedSpeciesModal } from '@/components/character-creator/MixedSpeciesModal';
import { cn } from '@/lib/utils';
import { GuidedChoiceCard } from '../guided-choice-card';
import { getSpeciesSizeOptions } from '../guided-species-utils';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-styles';

import { GuidedSpeciesDetailModal } from '../guided-species-detail-modal';
import { GuidedStepLayout } from '../guided-step-layout';

const stepCopy = GUIDED_CREATOR_COPY.steps.species;
const SPECIES_CREATOR_PATH = '/species-creator';

function resetAncestryOnSpeciesChange(changed: boolean) {
  if (!changed) return {};
  return {
    selectedSize: null,
    selectedSpeciesTraitChoices: {},
    selectedAncestryTraitIds: [],
    selectedCharacteristicId: null,
    selectedFlawId: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraits: [],
    selectedFlawSpeciesId: null,
  };
}

export function SpeciesStep() {
  const { draft, updateDraft, navigationIntent, entryNonce } = useGuidedCreatorStore();
  const { data: allSpecies = [], isLoading } = useMergedSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const [showAll, setShowAll] = useState(false);
  const [detailSpeciesId, setDetailSpeciesId] = useState<string | null>(null);
  const [showMixedModal, setShowMixedModal] = useState(false);

  const userSpeciesIds = useMemo(
    () => new Set((userSpeciesList ?? []).map((s) => s.id)),
    [userSpeciesList]
  );

  const openAllSpecies = useCallback(() => setShowAll(true), []);
  useGuidedDeepEntryOnArrival({
    draft,
    navigationIntent,
    entryNonce,
    enabled: !isLoading,
    onDeepEntry: openAllSpecies,
  });

  const hasStarters = useMemo(() => allSpecies.some((s) => (s as Species).is_starter), [allSpecies]);
  const isL2 = showAll || !hasStarters;

  const visibleSpecies = useMemo(() => {
    if (!hasStarters || showAll) return allSpecies;
    return allSpecies.filter((s) => (s as Species).is_starter);
  }, [allSpecies, hasStarters, showAll]);

  // Lookup against full list so collapsing starters does not dismiss an open non-starter modal.
  const detailSpecies = useMemo(
    () =>
      (allSpecies.find((s) => String(s.id) === detailSpeciesId) as Species | undefined) ?? null,
    [allSpecies, detailSpeciesId]
  );

  const isMixedSelected = draft.speciesMixed;

  const handleSelect = (species: Species) => {
    const nextId = String(species.id);
    const changed = draft.speciesId !== nextId || draft.speciesMixed;
    const sizeOptions = getSpeciesSizeOptions(species);
    updateDraft({
      speciesId: nextId,
      speciesName: species.name,
      speciesMixed: false,
      mixedSpeciesIds: null,
      mixedSpeciesNames: null,
      ...resetAncestryOnSpeciesChange(changed),
      ...(changed && sizeOptions.length === 1 ? { selectedSize: sizeOptions[0] } : {}),
    });
  };

  const handleMixedConfirm = (
    speciesA: { id: string; name: string },
    speciesB: { id: string; name: string }
  ) => {
    const nextId = `mixed:${speciesA.id}+${speciesB.id}`;
    const changed =
      draft.speciesId !== nextId ||
      !draft.speciesMixed ||
      draft.mixedSpeciesIds?.[0] !== speciesA.id ||
      draft.mixedSpeciesIds?.[1] !== speciesB.id;
    updateDraft({
      speciesId: nextId,
      speciesName: `${speciesA.name} / ${speciesB.name}`,
      speciesMixed: true,
      mixedSpeciesIds: [speciesA.id, speciesB.id],
      mixedSpeciesNames: [speciesA.name, speciesB.name],
      ...resetAncestryOnSpeciesChange(changed),
    });
    setShowMixedModal(false);
  };

  const openSpeciesCreator = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(SPECIES_CREATOR_PATH, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <GuidedStepLayout
      subStep="species"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={Boolean(draft.speciesId)}
      footerTrailing={
        isL2 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={openSpeciesCreator}
            className={guidedNavPreviousClassName}
          >
            {stepCopy.createSpecies}
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : visibleSpecies.length === 0 && !isL2 ? (
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
                selected={!isMixedSelected && draft.speciesId === String(species.id)}
                onSelect={() => handleSelect(species as Species)}
                onDetails={() => setDetailSpeciesId(String(species.id))}
              />
            ))}

            {isL2 ? (
              <GuidedChoiceCard
                className={cn(
                  GUIDED_CHOICE_GRID_ITEM_CLASS,
                  'border-dashed',
                  isMixedSelected
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border hover:border-primary-outline-border'
                )}
                density="species"
                icon={<GitMerge className="h-8 w-8 text-primary-link-fg" aria-hidden />}
                title={stepCopy.mixedSpeciesTitle}
                description={stepCopy.mixedSpeciesDescription}
                selected={isMixedSelected}
                onSelect={() => setShowMixedModal(true)}
                selectAriaLabel={stepCopy.mixedSpeciesTitle}
              />
            ) : null}
          </div>

          {hasStarters && !showAll ? (
            <GuidedLayerNav expandLabel={stepCopy.showAll} onExpand={() => setShowAll(true)} />
          ) : null}
          {hasStarters && showAll ? (
            <GuidedLayerNav
              collapseLabel={stepCopy.seeStarters}
              onCollapse={() => setShowAll(false)}
            />
          ) : null}

          <GuidedSpeciesDetailModal
            isOpen={detailSpecies != null}
            onClose={() => setDetailSpeciesId(null)}
            species={detailSpecies}
            onSelect={detailSpecies ? () => handleSelect(detailSpecies) : undefined}
          />

          <MixedSpeciesModal
            isOpen={showMixedModal}
            onClose={() => setShowMixedModal(false)}
            onConfirm={handleMixedConfirm}
            allSpecies={allSpecies}
            userSpeciesIds={userSpeciesIds}
          />
        </>
      )}
    </GuidedStepLayout>
  );
}
