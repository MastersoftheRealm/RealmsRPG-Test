import type { ChipData } from '@/components/shared/grid-list-row-types';
import { TP_COST_LABEL } from '@/lib/detail-option/compact-facts';

export type DisplayPartChip = {
  text: string;
  description?: string;
  finalTP?: number;
  /** Max option level > 0; omit when 0 / not leveled. */
  optionLevel?: number;
};

/** Map calculator display part chips to GridListRow `ChipData` (dense browse: `TP: N`). */
export function partChipsFromDisplay(
  partChips: DisplayPartChip[],
  opts?: { stripOptionSuffix?: boolean },
): ChipData[] {
  return partChips.map((chip) => {
    let name = chip.text.split(' | TP:')[0].trim();
    let optionLevel = chip.optionLevel;
    if (opts?.stripOptionSuffix) {
      if (optionLevel == null) {
        const levels = [...name.matchAll(/\(Opt\d+\s+(\d+)\)/g)].map((m) => Number(m[1]));
        const max = levels.length ? Math.max(...levels) : 0;
        optionLevel = max > 0 ? max : undefined;
      }
      name = name.replace(/\s*\(Opt\d+ \d+\)/g, '').trim();
    }
    const hasCost = (chip.finalTP ?? 0) > 0;
    return {
      name,
      description: chip.description,
      cost: hasCost ? chip.finalTP : undefined,
      costLabel: TP_COST_LABEL,
      category: hasCost ? ('cost' as const) : ('default' as const),
      level: optionLevel != null && optionLevel > 0 ? optionLevel : undefined,
    };
  });
}
