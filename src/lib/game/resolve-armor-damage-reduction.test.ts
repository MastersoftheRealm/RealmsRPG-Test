import { describe, expect, it } from 'vitest';
import { resolveArmorDamageReduction } from './resolve-armor-damage-reduction';

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
