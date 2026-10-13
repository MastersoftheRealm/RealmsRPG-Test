import { describe, expect, it } from 'vitest';
import {
  armorDamageReductionForHit,
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
