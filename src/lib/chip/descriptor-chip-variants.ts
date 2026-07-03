import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';
import type { ItemBadge } from '@/types/items';

export type DescriptorChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export type TraitCategoryKind = 'species' | 'ancestry' | 'flaw' | 'characteristic';

export function itemBadgeToDescriptorVariant(variant: ItemBadge['variant']): DescriptorChipVariant {
  switch (variant) {
    case 'primary':
      return 'primary';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    case 'info':
      return 'info';
    default:
      return 'descriptor';
  }
}

export function traitCategoryDescriptorVariant(category: TraitCategoryKind): DescriptorChipVariant {
  switch (category) {
    case 'species':
      return 'info';
    case 'ancestry':
      return 'success';
    case 'flaw':
      return 'danger';
    case 'characteristic':
      return 'power';
    default:
      return 'descriptor';
  }
}

export type StatusBadgeKind = 'complete' | 'warning' | 'info' | 'danger' | 'neutral';

export function statusBadgeDescriptorVariant(kind: StatusBadgeKind): DescriptorChipVariant {
  switch (kind) {
    case 'complete':
      return 'success';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'danger':
      return 'danger';
    case 'neutral':
    default:
      return 'descriptor';
  }
}

export function profPointsDescriptorVariant(remaining: number): DescriptorChipVariant {
  if (remaining > 0) return 'success';
  if (remaining < 0) return 'danger';
  return 'primary';
}
