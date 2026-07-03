import type { ChipData } from '@/components/shared/grid-list-row-types';

export type DisplayPartChip = { text: string; description?: string; finalTP?: number };

/** Map calculator display part chips to GridListRow `ChipData`. */
export function partChipsFromDisplay(
  partChips: DisplayPartChip[],
  opts?: { stripOptionSuffix?: boolean }
): ChipData[] {
  return partChips.map((chip) => {
    let name = chip.text.split(' | TP:')[0].trim();
    if (opts?.stripOptionSuffix) {
      name = name.replace(/\s*\(Opt\d+ \d+\)/g, '').trim();
    }
    return {
      name,
      description: chip.description,
      cost: chip.finalTP,
      costLabel: 'TP',
      category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
    };
  });
}
