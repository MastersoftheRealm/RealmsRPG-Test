'use client';

import { DescriptorChipWithTip } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { cn } from '@/lib/utils';

export interface GuidedFactChipRowProps {
  chips: ChipData[];
  className?: string;
}

/** Non-expanding fact chips for guided cards (DescriptorChipWithTip only). */
export function GuidedFactChipRow({ chips, className }: GuidedFactChipRowProps) {
  if (chips.length === 0) return null;

  return (
    <div
      data-chip-group
      className={cn('flex flex-wrap gap-2 items-start', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {chips.map((chip, index) => (
        <DescriptorChipWithTip key={`${chip.name}-${index}`} chip={chip} />
      ))}
    </div>
  );
}
