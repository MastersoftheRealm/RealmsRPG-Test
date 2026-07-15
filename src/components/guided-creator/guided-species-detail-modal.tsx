/**
 * Species choice-card deep-dive — overview + expandable ancestry option catalogs (TASK-433).
 */

'use client';

import { useMemo } from 'react';
import {
  useTraits,
  findTraitByIdOrName,
  type Species,
  type Trait,
} from '@/hooks';
import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  guidedSpeciesDetailAncestryTraits,
  guidedSpeciesDetailCharacteristics,
  guidedSpeciesDetailFlaws,
  guidedSpeciesDetailSpeciesTraitOptions,
} from '../../../public/tooltip-text';
import { GuidedEntityDetailModal, type GuidedEntityDetailSection } from './guided-entity-detail-modal';
import { GuidedTraitOptionList } from './guided-trait-option-list';
import { SpeciesRevealPanel } from './species-reveal-panel';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

const detailCopy = GUIDED_CREATOR_COPY.steps.species.detail;

export interface GuidedSpeciesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: Species | null;
}

interface SpeciesChoiceGroup {
  parent: Trait;
  options: Trait[];
}

/** Resolve trait IDs without inventing “Trait not found” placeholders. */
function resolveKnownTraits(
  ids: (string | number)[] | undefined,
  allTraits: Trait[]
): Trait[] {
  if (!ids?.length || !allTraits.length) return [];
  return ids
    .map((id) => findTraitByIdOrName(allTraits, id))
    .filter((t): t is Trait => Boolean(t));
}

function buildSpeciesChoiceGroups(species: Species, allTraits: Trait[]): SpeciesChoiceGroup[] {
  const speciesTraits = resolveKnownTraits(species.species_traits, allTraits);
  const groups: SpeciesChoiceGroup[] = [];
  for (const parent of speciesTraits) {
    const optionIds = getChoiceOptionIds(parent);
    if (optionIds.length === 0) continue;
    const options = resolveChoiceOptionTraits(optionIds, allTraits);
    if (options.length > 0) {
      groups.push({ parent, options });
    }
  }
  return groups;
}

export function GuidedSpeciesDetailModal({
  isOpen,
  onClose,
  species,
}: GuidedSpeciesDetailModalProps) {
  const { data: allTraits = [], isLoading: traitsLoading } = useTraits();

  const sections = useMemo((): GuidedEntityDetailSection[] => {
    if (!species || !allTraits.length) return [];

    const result: GuidedEntityDetailSection[] = [];
    const choiceGroups = buildSpeciesChoiceGroups(species, allTraits);
    const ancestryTraits = resolveKnownTraits(species.ancestry_traits, allTraits);
    const characteristics = resolveKnownTraits(species.characteristics, allTraits);
    const flaws = resolveKnownTraits(species.flaws, allTraits);

    if (choiceGroups.length > 0) {
      const optionCount = choiceGroups.reduce((n, g) => n + g.options.length, 0);
      result.push({
        id: 'species-trait-options',
        title: detailCopy.speciesTraitOptionsTitle,
        tip: guidedSpeciesDetailSpeciesTraitOptions,
        itemCount: optionCount,
        children: (
          <div className="space-y-5">
            <p className={o.bodySecondary}>{detailCopy.speciesTraitOptionsIntro}</p>
            {choiceGroups.map(({ parent, options }) => (
              <GuidedTraitOptionList
                key={String(parent.id)}
                traits={options}
                groupLabel={parent.name}
                groupHint={detailCopy.speciesTraitOptionPickHint}
              />
            ))}
          </div>
        ),
      });
    }

    if (ancestryTraits.length > 0) {
      result.push({
        id: 'ancestry-traits',
        title: detailCopy.ancestryTraitsTitle,
        tip: guidedSpeciesDetailAncestryTraits,
        itemCount: ancestryTraits.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.ancestryTraitsIntro}</p>
            <GuidedTraitOptionList traits={ancestryTraits} />
          </div>
        ),
      });
    }

    if (characteristics.length > 0) {
      result.push({
        id: 'characteristics',
        title: detailCopy.characteristicsTitle,
        tip: guidedSpeciesDetailCharacteristics,
        itemCount: characteristics.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.characteristicsIntro}</p>
            <GuidedTraitOptionList traits={characteristics} />
          </div>
        ),
      });
    }

    if (flaws.length > 0) {
      result.push({
        id: 'flaws',
        title: detailCopy.flawsTitle,
        tip: guidedSpeciesDetailFlaws,
        itemCount: flaws.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.flawsIntro}</p>
            <GuidedTraitOptionList traits={flaws} />
          </div>
        ),
      });
    }

    return result;
  }, [species, allTraits]);

  const catalogsPending = Boolean(species && traitsLoading && allTraits.length === 0);

  return (
    <GuidedEntityDetailModal
      key={species ? String(species.id) : 'species-detail-closed'}
      isOpen={isOpen && species != null}
      onClose={onClose}
      title={species?.name ?? ''}
      description={GUIDED_CREATOR_COPY.steps.species.detailModalHint}
      overview={
        species ? (
          <>
            <SpeciesRevealPanel
              species={species}
              allTraits={allTraits}
              readOnlyDetail
              hideChoiceTeaser
            />
            {catalogsPending ? (
              <p className={o.bodySecondary}>{detailCopy.loadingTraits}</p>
            ) : null}
          </>
        ) : null
      }
      sections={sections}
    />
  );
}
