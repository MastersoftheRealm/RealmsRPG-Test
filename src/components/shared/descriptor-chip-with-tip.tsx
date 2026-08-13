'use client';

/**
 * Non-expanding descriptor chip with optional InfoTippy for property descriptions
 * (TASK-454 / TASK-465 compact-fact grammar). Prefer this over ExpandableChip when the chip
 * must stay opaque and help is hover/focus/touch-hold only.
 *
 * Tip trigger sits **inside** the chip (affordance colocated with the labeled fact —
 * shorter pointer travel / clearer association than a sibling icon beside the chip).
 */

import { DescriptorChip } from '@/components/ui';
import { InfoTippy } from '@/components/shared/info-tippy';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { cn } from '@/lib/utils';

export interface DescriptorChipWithTipProps {
  chip: ChipData;
  className?: string;
  /** DescriptorChip size — default sm for inline metadata. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders a descriptor chip. When `chip.description` is set, adds a compact
 * accessible InfoTippy trigger inside the chip — the chip itself never expands.
 */
export function DescriptorChipWithTip({
  chip,
  className,
  size = 'sm',
}: DescriptorChipWithTipProps) {
  const tip = chip.description?.trim();
  const costSuffix =
    chip.cost != null && chip.cost > 0
      ? ` (${chip.cost} ${chip.costLabel || 'Training Points'})`
      : '';
  const label = `${chip.name}${costSuffix}`;

  if (!tip) {
    return (
      <span className={cn('inline-flex max-w-full', className)}>
        <DescriptorChip size={size}>{label}</DescriptorChip>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex max-w-full', className)}>
      <DescriptorChip size={size} className="gap-1 pr-1.5">
        <span className="min-w-0 truncate">{label}</span>
        <InfoTippy
          content={tip}
          label={`${chip.name} details`}
          size="inline"
          tone="current"
          className="!min-h-6 !min-w-6 md:!min-h-5 md:!min-w-5 -my-0.5"
        />
      </DescriptorChip>
    </span>
  );
}
