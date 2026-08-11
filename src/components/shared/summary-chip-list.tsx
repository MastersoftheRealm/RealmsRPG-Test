'use client';

import type { VariantProps } from 'class-variance-authority';
import { ExpandableChip, DescriptorChip, ChipGroup, type chipVariants } from '@/components/ui';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export interface SummaryChipItem {
  key: string;
  label: string;
  description?: string | null;
  variant?: ChipVariant;
  category?: string;
  className?: string;
  energyCost?: number;
}

/** Expandable entity chips in summary panels — `md` maps to entity inline size (matches DescriptorChip default). */
const SUMMARY_EXPANDABLE_SIZE = 'md' as const;
/** Descriptor fallback when no description — entity inline size. */
const SUMMARY_DESCRIPTOR_SIZE = 'sm' as const;

export function SummaryChipList({
  items,
  className,
}: {
  items: SummaryChipItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ChipGroup className={className}>
      {items.map((item) => {
        const description = item.description?.trim();
        if (description) {
          return (
            <ExpandableChip
              key={item.key}
              label={item.label}
              description={description}
              variant={item.variant ?? 'list'}
              category={item.category}
              energyCost={item.energyCost}
              size={SUMMARY_EXPANDABLE_SIZE}
              className={item.className}
              fullWidthWhenExpanded
              interactiveHover
            />
          );
        }

        return (
          <DescriptorChip
            key={item.key}
            size={SUMMARY_DESCRIPTOR_SIZE}
            variant={item.variant ?? 'descriptor'}
            className={item.className}
          >
            {item.label}
          </DescriptorChip>
        );
      })}
    </ChipGroup>
  );
}
