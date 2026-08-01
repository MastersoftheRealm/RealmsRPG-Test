/**
 * Mixed species overview at the start of guided Ancestry.
 */

'use client';

import { useMemo } from 'react';
import { GitMerge } from 'lucide-react';
import { SegmentedControl } from '@/components/shared';
import { DescriptorChip } from '@/components/ui';
import type { Species } from '@/hooks';
import {
  averageMixedPhysical,
  combineSpeciesSizes,
} from '@/lib/ancestry/ancestry-selection';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedOverviewSection } from './guided-overview-section';
import { GuidedSectionTitle } from './guided-section-title';
import { titleCase } from './guided-text';

const copy = GUIDED_CREATOR_COPY.steps.ancestry.speciesOverview;
const mixedCopy = GUIDED_CREATOR_COPY.steps.ancestry.mixedOverview;

export interface GuidedMixedSpeciesOverviewProps {
  speciesA: Species;
  speciesB: Species;
  selectedSize?: string | null;
  onSizeChange?: (size: string) => void;
}

export function GuidedMixedSpeciesOverview({
  speciesA,
  speciesB,
  selectedSize,
  onSizeChange,
}: GuidedMixedSpeciesOverviewProps) {
  const combinedSizes = useMemo(
    () => combineSpeciesSizes(speciesA, speciesB),
    [speciesA, speciesB]
  );
  const averaged = useMemo(
    () => averageMixedPhysical(speciesA, speciesB),
    [speciesA, speciesB]
  );

  const sizeOptions = combinedSizes.map((s) => ({ value: s, label: titleCase(s) }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-subtle-border bg-primary-subtle-bg">
          <GitMerge className="h-7 w-7 text-primary-link-fg" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-text-primary">
            {mixedCopy.title(speciesA.name, speciesB.name)}
          </h3>
          <p className="mt-1 font-nunito text-sm text-text-secondary">{mixedCopy.description}</p>
        </div>
      </div>

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
    </div>
  );
}
