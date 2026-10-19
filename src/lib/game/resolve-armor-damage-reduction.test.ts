import { describe, expect, it } from 'vitest';
import {
  armorCurrencyCost,
  armorDamageReductionForHit,
  creatureArmorDamageReduction,
  damageAfterArmorReduction,
  resolveArmorDamageReduction,
} from './resolve-armor-damage-reduction';

describe('resolveArmorDamageReduction', () => {
  it('uses flat scalar fields (damageReduction, armorValue, armor, armor_value)', () => {
    expect(resolveArmorDamageReduction({ damageReduction: 4 })).toBe(4);
    expect(resolveArmorDamageReduction({ armorValue: 3 })).toBe(3);
    expect(resolveArmorDamageReduction({ armor: 2 })).toBe(2);
    expect(resolveArmorDamageReduction({ armor_value: 5 })).toBe(5);
    expect(
      resolveArmorDamageReduction({
        damageReduction: 4,
        armorValue: 1,
        properties: [{ name: 'Damage Reduction', op_1_lvl: 9 }],
      }),
    ).toBe(4);
  });

  it('derives DR from Damage Reduction property (1 + op_1_lvl)', () => {
    expect(
      resolveArmorDamageReduction({
        properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 0 }],
      }),
    ).toBe(1);
    expect(
      resolveArmorDamageReduction({
        properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 2 }],
      }),
    ).toBe(3);
  });

  it('returns 0 when no scalar or property DR is present', () => {
    expect(resolveArmorDamageReduction({})).toBe(0);
    expect(
      resolveArmorDamageReduction({ properties: [{ name: 'Agility Reduction', op_1_lvl: 1 }] }),
    ).toBe(0);
  });
});

describe('creatureArmorDamageReduction (86e3t17av)', () => {
  it('is 0 when a creature has no armor (Goblin, Squirrel, weapons do not count)', () => {
    expect(creatureArmorDamageReduction([])).toBe(0);
    expect(
      creatureArmorDamageReduction([
        {
          name: 'Knife',
          type: 'weapon',
          damageReduction: 1,
          properties: [{ id: 17, name: 'Weapon Damage', op_1_lvl: 0 }],
        },
        { name: 'Buckler', type: 'shield', damageReduction: 5, currency: 80 },
        { name: 'Rope', type: 'equipment', armorValue: 9, currency: 80 },
      ]),
    ).toBe(0);
  });

  it('reads a property-only armor as 1 + option level (Brown Bear Thick Hide)', () => {
    expect(
      creatureArmorDamageReduction([
        {
          name: 'Thick Hide',
          type: 'armor',
          properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 3 }],
        },
      ]),
    ).toBe(4);
  });

  it('uses a stored armor number (Human 3, Dragon 4, Animated Armor 6)', () => {
    expect(creatureArmorDamageReduction([{ type: 'armor', damageReduction: 3 }])).toBe(3);
    expect(creatureArmorDamageReduction([{ type: 'armor', armorValue: 4 }])).toBe(4);
    expect(creatureArmorDamageReduction([{ type: 'armor', damageReduction: 6 }])).toBe(6);
  });

  it('applies only the highest currency cost, not a sum (the DR 49 case)', () => {
    expect(
      creatureArmorDamageReduction([
        { name: 'Hide', type: 'armor', currency: 10, damageReduction: 4 },
        { name: 'Plate', type: 'armor', currency: 40, damageReduction: 6 },
        { name: 'Mail', type: 'armor', currency: 20, damageReduction: 39 },
      ]),
    ).toBe(6);
  });

  it('treats natural armor and armament armor as the same kind of piece', () => {
    const natural = {
      name: 'Thick Hide',
      type: 'armor',
      currency: 30,
      properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 3 }],
    };
    const forged = { name: 'Chain', type: 'armor', currency: 12, damageReduction: 2 };
    expect(creatureArmorDamageReduction([natural, forged])).toBe(4);
    expect(creatureArmorDamageReduction([{ ...natural, currency: 5 }, forged])).toBe(2);
  });

  it('on a currency-cost tie, keeps the earlier armor in the stored list', () => {
    expect(
      creatureArmorDamageReduction([
        { name: 'First', type: 'armor', currency: 20, damageReduction: 3 },
        { name: 'Second', type: 'armor', currency: 20, damageReduction: 8 },
      ]),
    ).toBe(3);
  });

  it('counts a missing currency as 0 and prefers a priced armor', () => {
    expect(
      creatureArmorDamageReduction([
        { name: 'Unpriced', type: 'armor', damageReduction: 9 },
        { name: 'Priced', type: 'armor', gold_cost: 1, damageReduction: 2 },
      ]),
    ).toBe(2);
  });

  it('reads currency before currencyCost, gold_cost, and cost', () => {
    expect(armorCurrencyCost({ currency: 4, currencyCost: 9, gold_cost: 8, cost: 7 })).toBe(4);
    expect(armorCurrencyCost({ currencyCost: 9, gold_cost: 8 })).toBe(9);
    expect(armorCurrencyCost({ gold_cost: 8, cost: 7 })).toBe(8);
    expect(armorCurrencyCost({ cost: 7 })).toBe(7);
    expect(armorCurrencyCost({})).toBe(0);
  });
});

describe('armorDamageReductionForHit', () => {
  it('halves Damage Reduction 5, rounded up, on each later reduction in the turn', () => {
    expect(armorDamageReductionForHit(5, 0)).toBe(5);
    expect(armorDamageReductionForHit(5, 1)).toBe(3);
    expect(armorDamageReductionForHit(5, 2)).toBe(2);
    expect(armorDamageReductionForHit(5, 3)).toBe(1);
    expect(armorDamageReductionForHit(5, 4)).toBe(1);
  });

  it('does not drop by 1 per hit', () => {
    expect(armorDamageReductionForHit(5, 1)).not.toBe(4);
    expect(armorDamageReductionForHit(4, 1)).toBe(2);
    expect(armorDamageReductionForHit(4, 2)).toBe(1);
  });

  it('keeps a base of 0 or 1 from falling through the floor', () => {
    expect(armorDamageReductionForHit(0, 0)).toBe(0);
    expect(armorDamageReductionForHit(0, 3)).toBe(0);
    expect(armorDamageReductionForHit(1, 0)).toBe(1);
    expect(armorDamageReductionForHit(1, 2)).toBe(1);
  });

  it('treats a missing or negative prior count as the first reduction', () => {
    expect(armorDamageReductionForHit(5, -1)).toBe(5);
    expect(armorDamageReductionForHit(5, Number.NaN)).toBe(5);
    expect(armorDamageReductionForHit(Number.NaN, 1)).toBe(0);
  });
});

describe('damageAfterArmorReduction', () => {
  it('matches the rulebook hits: 20 reduced by 5, then 10 reduced by 3', () => {
    expect(damageAfterArmorReduction(20, armorDamageReductionForHit(5, 0))).toBe(15);
    expect(damageAfterArmorReduction(10, armorDamageReductionForHit(5, 1))).toBe(7);
  });

  it('leaves at least 1 when a hit is reduced, and leaves a non-hit at 0', () => {
    expect(damageAfterArmorReduction(4, 5)).toBe(1);
    expect(damageAfterArmorReduction(1, 5)).toBe(1);
    expect(damageAfterArmorReduction(0, 5)).toBe(0);
    expect(damageAfterArmorReduction(-2, 5)).toBe(0);
  });
});
