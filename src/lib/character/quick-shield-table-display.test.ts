import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { quickShieldTableHasDamage } from './quick-shield-table-display';

describe('quickShieldTableHasDamage (86e1vtdht / 86e3mmnz5)', () => {
  it('hides damage when hasShieldDamage is false even if legacy item.damage is set', () => {
    expect(
      quickShieldTableHasDamage({
        hasShieldDamage: false,
        shieldDamage: { amount: 1, size: 6 },
        properties: [],
        legacyItemDamage: '1d6 Bludgeoning',
      }),
    ).toBe(false);
  });

  it('shows damage for legacy rows when hasShieldDamage is undefined', () => {
    expect(
      quickShieldTableHasDamage({
        hasShieldDamage: undefined,
        properties: [{ id: PROPERTY_IDS.SHIELD_DAMAGE, name: 'Shield Damage', op_1_lvl: 2 }],
        legacyItemDamage: undefined,
      }),
    ).toBe(true);
  });
});
