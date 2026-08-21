import { describe, expect, it } from 'vitest';
import type {
  CreateOfficialEnhancedItemInput,
  OfficialEnhancedItem,
  OfficialEnhancedItemPayload,
  UpdateOfficialEnhancedItemInput,
} from '../types/crafting';

describe('Official enhanced item types', () => {
  it('accepts known payload fields plus open extensions', () => {
    const payload: OfficialEnhancedItemPayload = {
      powerEnergy: 3,
      materialCost: 50,
      currencyCost: 100,
      rarity: 'Uncommon',
      potency: 'creator',
      multipleUseTableIndex: 1,
      craftBaseItemAlso: true,
      futureFlag: true,
    };
    expect(payload.powerEnergy).toBe(3);
    expect(payload.futureFlag).toBe(true);
  });

  it('shapes create / list / patch contracts used by admin hooks', () => {
    const create: CreateOfficialEnhancedItemInput = {
      name: 'Ring of Echo',
      baseItemSource: 'public',
      baseItemName: 'Ring',
      powerSource: 'official',
      powerId: 'p1',
      powerName: 'Echo',
      powerEnergy: 2,
      usesType: 'full',
      usesCount: 1,
      payload: { powerEnergy: 2 },
    };
    const row: OfficialEnhancedItem = {
      id: 'e1',
      name: create.name,
      currency_cost: 0,
      rarity: 'Common',
      base_item_source: create.baseItemSource,
      base_item_id: null,
      base_item_name: create.baseItemName,
      power_source: create.powerSource,
      power_id: create.powerId,
      power_name: create.powerName,
      uses_type: create.usesType,
      uses_count: create.usesCount ?? null,
      payload: create.payload ?? null,
    };
    expect(row.payload?.powerEnergy).toBe(2);
    const patch: UpdateOfficialEnhancedItemInput = {
      name: 'Ring of Echoes',
      usesType: 'permanent',
      usesCount: null,
      payload: { rarity: 'Rare' },
    };
    expect(patch.usesType).toBe('permanent');
  });
});
