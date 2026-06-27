import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';

export type GridListChipCategory =
  | 'default'
  | 'cost'
  | 'tag'
  | 'warning'
  | 'success'
  | 'archetype'
  | 'skill';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

/** Maps GridListRow chip categories to canonical `<Chip>` / `chipVariants` tokens. */
export function gridListChipVariant(category: string): ChipVariant {
  switch (category) {
    case 'cost':
      return 'listCost';
    case 'warning':
      return 'listWarning';
    case 'success':
      return 'listSuccess';
    default:
      return 'list';
  }
}
