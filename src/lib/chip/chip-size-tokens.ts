import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';
import type { ExpandableChipShellSize } from './expandable-chip-shell';

export type ChipVariantSize = NonNullable<VariantProps<typeof chipVariants>['size']>;

/**
 * Canonical collapsed size when descriptor, expandable, and pill chips share an entity row
 * (`data-chip-group`, GridListRow expanded sections, summary chip lists).
 */
export const CHIP_ENTITY_INLINE_SIZE: ChipVariantSize = 'descriptor';

/** ExpandableChip shell size → shared chipVariants size token. */
export function expandableShellChipSize(size: ExpandableChipShellSize = 'md'): ChipVariantSize {
  return size === 'sm' ? 'sm' : CHIP_ENTITY_INLINE_SIZE;
}

export type DescriptorChipSizeProp = 'sm' | 'md' | 'lg' | 'descriptor';

/**
 * DescriptorChip prop sizes → chipVariants size.
 * `sm` (default) and `descriptor` = entity inline; `md`/`lg` = prominent counters outside chip groups.
 */
export function resolveDescriptorChipSize(
  size: DescriptorChipSizeProp | null | undefined,
): ChipVariantSize {
  if (!size || size === 'sm' || size === 'descriptor') return CHIP_ENTITY_INLINE_SIZE;
  return size;
}
