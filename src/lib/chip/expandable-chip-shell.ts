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
    'inline-flex flex-col items-start font-medium transition-all duration-base ease-standard',
    chipVariants({ variant, shape: 'expandable' }),
    size === 'sm' ? 'text-xs' : 'text-sm',
    expanded
      ? 'w-full min-w-0 ring-2 ring-offset-1 ring-primary-outline-border px-3 py-2'
      : size === 'sm'
        ? 'px-2 py-0.5'
        : 'px-3 py-1.5',
    className
  );
}
