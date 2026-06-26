/**
 * Part category display helpers — maps codex category strings to chip variants.
 */

import type { ChipProps } from '@/components/ui';

type PartCategoryChipVariant = NonNullable<ChipProps['variant']>;

const CODEX_CATEGORY_VARIANTS: Record<string, PartCategoryChipVariant> = {
  Action: 'action',
  Activation: 'activation',
  'Area of Effect': 'area',
  Duration: 'duration',
  Target: 'target',
  Special: 'special',
  Restriction: 'restriction',
};

/** Map a codex part category label to a Chip variant for consistent styling. */
export function partCategoryToChipVariant(category: string | undefined | null): PartCategoryChipVariant {
  if (!category?.trim()) return 'default';
  const exact = CODEX_CATEGORY_VARIANTS[category];
  if (exact) return exact;

  const normalized = category.trim().toLowerCase();
  if (normalized.includes('action') && !normalized.includes('activation')) return 'action';
  if (normalized.includes('activation')) return 'activation';
  if (normalized.includes('area')) return 'area';
  if (normalized.includes('duration')) return 'duration';
  if (normalized.includes('target')) return 'target';
  if (normalized.includes('special')) return 'special';
  if (normalized.includes('restriction')) return 'restriction';

  return 'default';
}
