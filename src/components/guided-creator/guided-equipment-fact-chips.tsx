'use client';

import { DescriptorChipWithTip } from '@/components/patterns';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { cn } from '@/lib/utils';

export interface GuidedFactChipRowProps {
  chips: ChipData[];
  className?: string | undefined;
}

/** Non-expanding fact chips for guided cards (DescriptorChipWithTip only). */
export function GuidedFactChipRow({ chips, className }: GuidedFactChipRowProps) {
  if (chips.length === 0) return null;

  return (
    <div
      data-chip-group
      className={cn('flex flex-wrap items-start gap-2', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {chips.map((chip, index) => (
        <DescriptorChipWithTip key={`${chip.name}-${index}`} chip={chip} />
      ))}
    </div>
  );
}

/** @deprecated Prefer GuidedFactChipRow — same renderer. */
export const GuidedEquipmentFactChips = GuidedFactChipRow;
export type GuidedEquipmentFactChipsProps = GuidedFactChipRowProps;
