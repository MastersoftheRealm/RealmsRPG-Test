import { describe, expect, it } from 'vitest';
import { ARMOR_FIELD_GRID_CLASS } from '@/app/(main)/item-creator/item-creator-editor-armor';
import {
  armorCreatorSummaryStatRows,
  combineItemSectionCosts,
} from '@/app/(main)/item-creator/item-creator-cost-derivation';
import { formatArmorCriticalRangeListValue } from '@/lib/detail-option/compact-facts';

describe('batch 17 armor summary and signed crit', () => {
  it('sums Armor Configuration costs for the collapsed header badge (86e3jwwrx)', () => {
    expect(
      combineItemSectionCosts(
        { totalIP: 1, totalTP: 2, totalCurrency: 3 },
        { totalIP: 4, totalTP: 0, totalCurrency: 5 },
        { totalIP: 0, totalTP: 6, totalCurrency: 7 },
      ),
    ).toEqual({ totalIP: 5, totalTP: 8, totalCurrency: 15 });
    expect(ARMOR_FIELD_GRID_CLASS).not.toContain('lg:grid-cols-3');
    expect(ARMOR_FIELD_GRID_CLASS).toContain('auto-fit');
  });

  it('lists Critical Range and the ability requirement on the armor summary (86e3jwwru)', () => {
    expect(
      armorCreatorSummaryStatRows({
        criticalRangeIncrease: 1,
        abilityRequirement: { name: 'Armor Strength Requirement', level: 2 },
      }),
    ).toEqual([
      { label: 'Critical Range', value: '+1' },
      { label: 'Strength Requirement', value: '2+' },
    ]);
    expect(
      armorCreatorSummaryStatRows({
        criticalRangeIncrease: 0,
        abilityRequirement: null,
      }),
    ).toEqual([]);
  });

  it('keeps the list cell as the signed bonus (1dfe8wf25rt)', () => {
    expect(formatArmorCriticalRangeListValue(1)).toBe('+1');
    expect(formatArmorCriticalRangeListValue(0)).toBe('-');
  });
});
