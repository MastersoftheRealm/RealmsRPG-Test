import { describe, expect, it } from 'vitest';
import { partChipsFromDisplay } from './part-chips-from-display';

describe('partChipsFromDisplay', () => {
  it('uses dense TP cost label and omits zero cost', () => {
    const chips = partChipsFromDisplay(
      [
        { text: 'Charm | TP: 2', description: 'Charm a creature', finalTP: 2 },
        { text: 'Duration (Minute)', description: 'Lasts a minute', finalTP: 0 },
      ],
      { stripOptionSuffix: true }
    );
    expect(chips[0]).toMatchObject({
      name: 'Charm',
      cost: 2,
      costLabel: 'TP',
      category: 'cost',
    });
    expect(chips[1].cost).toBeUndefined();
    expect(chips[1].level).toBeUndefined();
  });

  it('surfaces option level from Opt suffixes when stripping', () => {
    const chips = partChipsFromDisplay(
      [{ text: 'Power Range (Opt1 2) | TP: 1', description: 'Farther', finalTP: 1 }],
      { stripOptionSuffix: true }
    );
    expect(chips[0]).toMatchObject({
      name: 'Power Range',
      cost: 1,
      costLabel: 'TP',
      level: 2,
    });
  });
});
