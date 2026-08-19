import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { chipVariants } from '@/components/ui/chip';
import { expandableShellChipSize } from './chip-size-tokens';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export type ExpandableChipShellSize = 'sm' | 'md';

/** Shared shell classes for all expand-in-place chips (ExpandableChip / GridListRow). */
export function expandableChipShellClass({
  variant,
  expanded = false,
  size = 'md',
  className,
}: {
  variant: ChipVariant;
  expanded?: boolean | undefined;
  size?: ExpandableChipShellSize | undefined;
  className?: string | undefined;
}) {
  return cn(
    'inline-flex flex-col items-start font-medium transition-[box-shadow,background-color,border-color,padding,ring] duration-base ease-standard',
    chipVariants({ variant, shape: 'expandable', size: expandableShellChipSize(size) }),
    // ExpandableChip's shared layout promotes this shell (or its local action wrapper)
    // to a full-width flex row while preserving the collapsed row's vertical origin.
    expanded ? 'min-w-0 max-w-full ring-2 ring-inset ring-primary-outline-border align-top' : '',
    className,
  );
}
