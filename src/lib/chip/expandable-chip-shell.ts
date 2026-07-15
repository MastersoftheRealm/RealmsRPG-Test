import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { chipVariants } from '@/components/ui/chip';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export type ExpandableChipShellSize = 'sm' | 'md';

/** Shared shell classes for all expand-in-place chips (ui, GridListRow, PartChip). */
export function expandableChipShellClass({
  variant,
  expanded = false,
  size = 'md',
  className,
}: {
  variant: ChipVariant;
  expanded?: boolean;
  size?: ExpandableChipShellSize;
  className?: string;
}) {
  return cn(
    'inline-flex flex-col items-start font-medium transition-[box-shadow,background-color,border-color,padding,ring] duration-base ease-standard',
    chipVariants({ variant, shape: 'expandable' }),
    size === 'sm' ? 'text-xs' : 'text-sm',
    // Do not force w-full when expanded — that reboots flex-wrap and jumps the toggle.
    // ExpandableChip sets a measured width that fits the remaining row space.
    expanded
      ? 'min-w-0 max-w-full ring-2 ring-inset ring-primary-outline-border align-top'
      : '',
    // Same vertical padding collapsed/expanded so the header Y does not nudge on toggle.
    size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1.5',
    className
  );
}
