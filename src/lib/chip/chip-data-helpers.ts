import type { ChipData } from '@/components/shared/grid-list-row-types';

/** Opaque metadata chip (tags, feat type, range labels). Never expands in GridListRow. */
export function descriptorChipData(
  name: string,
  category: Exclude<ChipData['category'], undefined> = 'default',
): ChipData {
  return { name, kind: 'descriptor', category };
}

/** Feat/tag label chip — descriptor role, neutral styling. */
export function tagDescriptorChip(tag: string): ChipData {
  return descriptorChipData(tag, 'default');
}
