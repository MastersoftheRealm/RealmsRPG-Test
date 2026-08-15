/**
 * Mixed species overview at the start of guided Ancestry.
 */

'use client';

import { useMemo, useState } from 'react';
import { SegmentedControl } from '@/components/shared';
import { Button, DescriptorChip } from '@/components/ui';
import type { Species } from '@/hooks';
import { averageMixedPhysical, combineSpeciesSizes } from '@/lib/ancestry/ancestry-selection';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedChoiceCard } from './guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from './guided-choice-styles';
import { GuidedOverviewSection } from './guided-overview-section';
import { GuidedSectionTitle } from './guided-section-title';
import { GuidedSpeciesDetailModal } from './guided-species-detail-modal';
import { titleCase } from './guided-text';

const copy = GUIDED_CREATOR_COPY.steps.ancestry.speciesOverview;
const mixedCopy = GUIDED_CREATOR_COPY.steps.ancestry.mixedOverview;

export interface GuidedMixedSpeciesOverviewProps {
  speciesA: Species;
  speciesB: Species;
  selectedSize?: string | null;
  onSizeChange?: (size: string) => void;
  onChangeParents?: () => void;
}

export function GuidedMixedSpeciesOverview({
  speciesA,
  speciesB,
  selectedSize,
  onSizeChange,
  onChangeParents,
}: GuidedMixedSpeciesOverviewProps) {
  const [detailSpecies, setDetailSpecies] = useState<Species | null>(null);
  const combinedSizes = useMemo(
    () => combineSpeciesSizes(speciesA, speciesB),
    [speciesA, speciesB],
  );
  const averaged = useMemo(() => averageMixedPhysical(speciesA, speciesB), [speciesA, speciesB]);

  const sizeOptions = combinedSizes.map((s) => ({ value: s, label: titleCase(s) }));
  const parents = [speciesA, speciesB];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 font-nunito text-sm text-text-secondary">{mixedCopy.description}</p>
        {onChangeParents ? (
          <Button
            type="button"
            variant="outline"
            onClick={onChangeParents}
            className="shrink-0 self-start"
          >
            {mixedCopy.changeParents}
          </Button>
        ) : null}
      </div>

      <GuidedOverviewSection title={mixedCopy.parentsTitle}>
        <div className={GUIDED_CHOICE_GRID_CLASS}>
          {parents.map((parent) => (
            <GuidedChoiceCard
              key={String(parent.id)}
              className={GUIDED_CHOICE_GRID_ITEM_CLASS}
              readOnly
              density="species"
              imageKind="species"
              imageRecord={parent}
              title={parent.name}
              description={parent.description}
              onDetails={() => setDetailSpecies(parent)}
            />
          ))}
        </div>
      </GuidedOverviewSection>

      {sizeOptions.length > 1 && onSizeChange ? (
        <GuidedOverviewSection title={copy.sizeChoiceTitle}>
          <p className="mb-3 font-nunito text-sm text-text-secondary">{copy.sizeChoiceHint}</p>
          <SegmentedControl
            value={selectedSize ?? ''}
            onChange={onSizeChange}
            options={sizeOptions}
            aria-label={copy.sizeChoiceTitle}
          />
        </GuidedOverviewSection>
      ) : null}

      {averaged ? (
        <GuidedOverviewSection title={copy.vitalsTitle}>
          <div className="flex flex-wrap gap-2">
            {combinedSizes.length === 1 ? (
              <DescriptorChip size="sm">{titleCase(combinedSizes[0])}</DescriptorChip>
            ) : null}
            {averaged.aveHeight != null ? (
              <DescriptorChip size="sm">
                {copy.avgHeightLabel}: {averaged.aveHeight} cm
              </DescriptorChip>
            ) : null}
            {averaged.aveWeight != null ? (
              <DescriptorChip size="sm">
                {copy.avgWeightLabel}: {averaged.aveWeight} kg
              </DescriptorChip>
            ) : null}
          </div>
        </GuidedOverviewSection>
      ) : null}

      <GuidedSectionTitle>{mixedCopy.choicesAheadTitle}</GuidedSectionTitle>
      <p className="font-nunito text-sm text-text-secondary">{mixedCopy.choicesAheadHint}</p>

      <GuidedSpeciesDetailModal
        isOpen={detailSpecies != null}
        onClose={() => setDetailSpecies(null)}
        species={detailSpecies}
      />
    </div>
  );
}
