import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  analyzeItemMarketCurrency,
  calculateItemCosts,
  resolveItemMarketPricing,
  type ItemPropertyTpRow,
} from './item-calc';
import { buildItemAdvancedCalculationGroups } from './item-cost-breakdown';

function prop(
  partial: Partial<ItemPropertyTpRow> & Pick<ItemPropertyTpRow, 'id' | 'name'>,
): ItemPropertyTpRow {
  return {
    base_ip: 0,
    base_tp: 0,
    base_c: 0,
    mechanic: true,
    ...partial,
  };
}

const weaponDamage = prop({
  id: String(PROPERTY_IDS.WEAPON_DAMAGE),
  name: 'Weapon Damage',
  base_ip: 1,
  op_1_ip: 0.5,
  base_c: 2,
  op_1_c: 1,
});

const twoHanded = prop({
  id: String(PROPERTY_IDS.TWO_HANDED),
  name: 'Two-Handed',
  base_ip: 0,
  base_c: 0,
  base_tp: 1,
});

const finesse = prop({
  id: String(PROPERTY_IDS.FINESSE),
  name: 'Finesse',
  base_ip: 0.5,
  base_c: 1,
});

describe('buildItemAdvancedCalculationGroups', () => {
  it('groups by section, omits empty, and uses Rounded Down (not floor)', () => {
    const properties = [
      { id: PROPERTY_IDS.WEAPON_DAMAGE, name: 'Weapon Damage', op_1_lvl: 2 },
      { id: PROPERTY_IDS.FINESSE, name: 'Finesse', op_1_lvl: 0 },
      { id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed', op_1_lvl: 0 },
    ];
    const db = [weaponDamage, finesse, twoHanded];
    const fromProps = calculateItemCosts(properties, db);
    const pricing = resolveItemMarketPricing(properties, db);
    expect(pricing.totalIP).toBe(fromProps.totalIP);
    expect(pricing.totalCurrency).toBe(fromProps.totalCurrency);

    const { currencyRaw, currencyCost } = analyzeItemMarketCurrency(
      pricing.totalCurrency,
      pricing.totalIP,
    );
    expect(currencyCost).toBe(pricing.currencyCost);
    expect(currencyRaw).not.toBe(currencyCost);

    const groups = buildItemAdvancedCalculationGroups(properties, db, pricing);
    const text = JSON.stringify(groups);
    expect(text).not.toMatch(/\bfloor\b|\bceil\b|toFixed/i);
    expect(text).toContain('Damage');
    expect(text).toContain('Ability Utilized');
    // Two-Handed has no IP/C — omitted from Handedness
    expect(text).not.toContain('Handedness');
    expect(text).toContain('Combined Pricing');
    expect(text).toContain('Rounded Down');

    const combined = groups.find((g) => g.title === 'Combined Pricing');
    expect(combined?.rows.some((r) => r.label === 'Currency Cost')).toBe(true);
    expect(combined?.rows.some((r) => r.label === 'Rarity' && r.value === pricing.rarity)).toBe(
      true,
    );
  });
});
