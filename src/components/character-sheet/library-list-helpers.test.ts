import { describe, expect, it } from 'vitest';
import { partDataToChips } from './library-list-helpers';
import type { PartData } from '@/components/shared';

describe('partDataToChips (character sheet)', () => {
  it('uses expandable chips with TP cost label even when there are no options', () => {
    const parts: PartData[] = [
      {
        name: 'Strike',
        description: 'Deal damage.',
        tpCost: 3,
        category: 'cost',
      },
    ];

    const chips = partDataToChips(parts);
    expect(chips).toHaveLength(1);
    expect(chips[0].kind).toBe('expandable');
    expect(chips[0].costLabel).toBe('TP');
    expect(chips[0].cost).toBe(3);
    expect(chips[0].description).toContain('Deal damage.');
  });

  it('keeps expandable kind when option levels are present', () => {
    const parts: PartData[] = [
      {
        name: 'Focus',
        description: 'Concentrate.',
        tpCost: 1,
        options: [{ label: 'Option 1', level: 2, description: 'Better focus' }],
        optionLevels: { opt1: 2, opt2: 0, opt3: 0 },
      },
    ];

    const chips = partDataToChips(parts);
    expect(chips[0].kind).toBe('expandable');
    expect(chips[0].costLabel).toBe('TP');
    expect(chips[0].level).toBe(2);
  });
});
