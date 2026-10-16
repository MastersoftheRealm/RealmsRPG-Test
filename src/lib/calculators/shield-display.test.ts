import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { resolveShieldBlockDisplay, resolveShieldDamageDisplay } from './item-calc';

describe('shield display helpers (86e1vtdht / 86e3mmnz5)', () => {
  it('prefers saved shieldDR over Shield Amount property for block', () => {
    expect(
      resolveShieldBlockDisplay({
        shieldDR: { amount: 2, size: 4 },
        properties: [{ id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 0 }],
      }),
    ).toBe('2d4');
  });

  it('shows stored shield damage with a bludgeoning fallback when type is missing (86e3jwwrt)', () => {
    expect(
      resolveShieldDamageDisplay({
        shieldDamage: { amount: 1, size: 6 },
        hasShieldDamage: true,
        properties: [],
      }),
    ).toBe('1d6 Bludgeoning');
  });

  it('still derives damage from properties when hasShieldDamage was never saved (legacy)', () => {
    expect(
      resolveShieldDamageDisplay({
        hasShieldDamage: undefined,
        properties: [{ id: PROPERTY_IDS.SHIELD_DAMAGE, name: 'Shield Damage', op_1_lvl: 2 }],
      }),
    ).toBe('1d8 Bludgeoning');
  });

  it('hides leftover stored dice when shield damage is off (86e3mmnz5)', () => {
    expect(
      resolveShieldDamageDisplay({
        shieldDamage: { amount: 2, size: 4 },
        hasShieldDamage: false,
        properties: [{ id: PROPERTY_IDS.SHIELD_DAMAGE, name: 'Shield Damage', op_1_lvl: 2 }],
      }),
    ).toBeNull();
  });
});
