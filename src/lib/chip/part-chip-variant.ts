import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

const PART_CATEGORY_VARIANTS = [
  'action',
  'activation',
  'area',
  'duration',
  'target',
  'special',
  'restriction',
] as const satisfies readonly ChipVariant[];

/** Codex category labels → chip variant (canonical power-part categories). */
const CODEX_CATEGORY_LABELS: Record<string, ChipVariant> = {
  Action: 'action',
  Activation: 'activation',
  'Area of Effect': 'area',
  Duration: 'duration',
  Target: 'target',
  Special: 'special',
  Restriction: 'restriction',
};

function fuzzyPartCategoryVariant(category: string): ChipVariant | null {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('action') && !normalized.includes('activation')) return 'action';
  if (normalized.includes('activation')) return 'activation';
  if (normalized.includes('area')) return 'area';
  if (normalized.includes('duration')) return 'duration';
  if (normalized.includes('target')) return 'target';
  if (normalized.includes('special')) return 'special';
  if (normalized.includes('restriction')) return 'restriction';
  return null;
}

/** Maps part/property categories to canonical `chipVariants` tokens. */
export function partChipVariant(category: string): ChipVariant {
  if (!category?.trim()) return 'default';

  if ((PART_CATEGORY_VARIANTS as readonly string[]).includes(category)) {
    return category as (typeof PART_CATEGORY_VARIANTS)[number];
  }

  const labeled = CODEX_CATEGORY_LABELS[category];
  if (labeled) return labeled;

  const fuzzy = fuzzyPartCategoryVariant(category);
  if (fuzzy) return fuzzy;

  switch (category) {
    case 'cost':
    case 'proficiency':
      return 'listCost';
    case 'property':
      return 'default';
    default:
      return 'default';
  }
}
