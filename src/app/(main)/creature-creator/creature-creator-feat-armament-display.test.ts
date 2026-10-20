import { describe, expect, it } from 'vitest';
import { enrichArmamentsWithSortKeys } from './creature-creator-feat-armament-display';
import { initialState } from './creature-creator-constants';

describe('enrichArmamentsWithSortKeys armor Damage Reduction', () => {
  it('shows 1 + option level when the armor stores only the Damage Reduction property', () => {
    const rows = enrichArmamentsWithSortKeys({
      ...initialState,
      armor: [
        {
          id: 'hide',
          name: 'Thick Hide',
          type: 'armor',
          tp: 2,
          currency: 8,
          rarity: 'Common',
          properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 3 }],
        },
      ],
    });
    expect(rows[0]?.damageReduction).toBe('4');
  });

  it('leaves weapons and shields without a static Damage Reduction number', () => {
    const rows = enrichArmamentsWithSortKeys({
      ...initialState,
      weapons: [
        {
          id: 'mace',
          name: 'Mace',
          type: 'weapon',
          tp: 1,
          currency: 5,
          rarity: 'Common',
          properties: [{ id: 17, name: 'Weapon Damage', op_1_lvl: 1 }],
        },
      ],
      shields: [
        {
          id: 'buckler',
          name: 'Buckler',
          type: 'shield',
          tp: 1,
          currency: 8,
          rarity: 'Common',
          damageReduction: 4,
        },
      ],
    });
    expect(rows.map((row) => row.damageReduction)).toEqual(['-', '-']);
  });

  it('shows Critical Range increase as a signed bonus, not the computed threshold (1dfe8wf1wwk)', () => {
    const rows = enrichArmamentsWithSortKeys({
      ...initialState,
      armor: [
        {
          id: 'studded',
          name: 'Studded Leather',
          type: 'armor',
          tp: 2,
          currency: 15,
          rarity: 'Uncommon',
          properties: [{ id: 22, name: 'Critical Range +1', op_1_lvl: 0 }],
        },
        {
          id: 'plain',
          name: 'Plain Armor',
          type: 'armor',
          tp: 1,
          currency: 5,
          rarity: 'Common',
          properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 0 }],
        },
      ],
    });
    expect(rows[0]?.criticalRangeIncrease).toBe('+1');
    expect(rows[1]?.criticalRangeIncrease).toBe('-');
  });
});
