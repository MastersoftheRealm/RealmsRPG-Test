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
import { InfoTippy } from '@/components/patterns/help/info-tippy';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { descriptorChipVariantForGridList } from '@/lib/chip/grid-list-chip-utils';
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
  const variant = descriptorChipVariantForGridList(chip.category ?? 'default');
  const costSuffix =
    chip.cost != null && chip.cost > 0
      ? ` (${chip.cost} ${chip.costLabel || 'Training Points'})`
      : '';
  const label = `${chip.name}${costSuffix}`;
  const wrapperClass = cn('inline-flex max-w-full', chip.disabled && 'opacity-60', className);

  if (!tip) {
    return (
      <span
        className={wrapperClass}
        aria-current={chip.current ? 'true' : undefined}
        aria-disabled={chip.disabled ? true : undefined}
      >
        <DescriptorChip size={size} variant={variant}>
          {label}
        </DescriptorChip>
      </span>
    );
  }

  return (
    <span
      className={wrapperClass}
      aria-current={chip.current ? 'true' : undefined}
      aria-disabled={chip.disabled ? true : undefined}
    >
      <DescriptorChip size={size} variant={variant} className="gap-1 pr-1.5">
        <span className="min-w-0 truncate">{label}</span>
        <InfoTippy content={tip} label={`${chip.name} details`} size="inline" tone="current" />
      </DescriptorChip>
    </span>
  );
}
