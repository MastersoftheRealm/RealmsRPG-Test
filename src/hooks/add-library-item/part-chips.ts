import type { ChipData } from '@/components/shared/grid-list-row';

export function partChipsFromDisplay(
  partChips: Array<{ text: string; description?: string; finalTP?: number }>
): ChipData[] {
  return partChips.map((chip) => ({
    name: chip.text.split(' | TP:')[0].trim(),
    description: chip.description,
    cost: chip.finalTP,
    costLabel: 'TP',
    category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
  }));
}
