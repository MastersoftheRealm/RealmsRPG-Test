import type { VariantProps } from 'class-variance-authority';
import type { chipVariants } from '@/components/ui/chip';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

const RARITY_VARIANTS = {
  Common: 'rarityCommon',
  Uncommon: 'rarityUncommon',
  Rare: 'rarityRare',
  Epic: 'rarityEpic',
  Legendary: 'rarityLegendary',
  Mythic: 'rarityMythic',
  Ascended: 'rarityAscended',
} as const satisfies Record<string, ChipVariant>;

/** Maps item rarity labels to canonical `chipVariants` tokens. */
export function rarityChipVariant(rarity: string): ChipVariant {
  return RARITY_VARIANTS[rarity as keyof typeof RARITY_VARIANTS] ?? 'rarityCommon';
}
