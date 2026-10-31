import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';

export type DescriptorChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export function profPointsDescriptorVariant(remaining: number): DescriptorChipVariant {
  if (remaining > 0) return 'success';
  if (remaining < 0) return 'danger';
  return 'primary';
}
