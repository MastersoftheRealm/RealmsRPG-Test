import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { gridListChipVariant } from '@/lib/chip/grid-list-chip-variant';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export type GridListBadgeColor = 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red';

export function isGridListChipExpandable(chip: ChipData): boolean {
  if (chip.kind === 'descriptor') return false;
  if (chip.kind === 'expandable') {
    const hasCost = (chip.cost ?? 0) > 0;
    return !!(chip.description || hasCost || (chip.options?.length ?? 0) > 0);
  }
  const hasCost = (chip.cost ?? 0) > 0;
  return !!(chip.description || hasCost || (chip.options?.length ?? 0) > 0);
}

/** Variant for non-expandable GridListRow chips (tags, feat type, requirements). */
export function descriptorChipVariantForGridList(category: string): ChipVariant {
  switch (category) {
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    case 'cost':
      return 'listCost';
    default:
      return 'descriptor';
  }
}

/** Variant for GridListRow `badges` prop (trait kind, warnings, etc.). */
export function descriptorChipVariantForBadgeColor(color?: GridListBadgeColor): ChipVariant {
  switch (color) {
    case 'blue':
      return 'info';
    case 'purple':
      return 'power';
    case 'green':
      return 'success';
    case 'amber':
      return 'warning';
    case 'red':
      return 'danger';
    default:
      return 'descriptor';
  }
}

export function gridListChipStyleVariant(chip: ChipData): ChipVariant {
  const hasCost = (chip.cost ?? 0) > 0;
  const category = chip.category || (hasCost ? 'cost' : 'default');
  if (!isGridListChipExpandable(chip)) {
    return descriptorChipVariantForGridList(category);
  }
  return gridListChipVariant(category);
}

export function formatGridListChipLabel(chip: ChipData): string {
  const levelSuffix = chip.level != null && chip.level > 0 ? ` (Lv.${chip.level})` : '';
  return `${chip.name}${levelSuffix}`;
}
