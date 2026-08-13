import { describe, expect, it } from 'vitest';
import {
  buildCodexEquipmentColumns,
  buildCodexEquipmentDetailSections,
  CODEX_EQUIPMENT_HEADER_COLUMNS,
  equipmentCurrency,
  filterCodexEquipment,
} from './equipment-list';
import { EMPTY_ARMAMENT_FILTERS } from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { CodexEquipmentItem } from '@/types/codex';

const ctx: ArmamentCharacterContext = {
  abilities: {
    strength: 0,
    agility: 0,
    vitality: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  armamentMax: 2,
  currency: 40,
  level: 6,
};

function item(
  partial: Partial<CodexEquipmentItem> & Pick<CodexEquipmentItem, 'id' | 'name'>
): CodexEquipmentItem {
  return {
    type: 'equipment',
    description: '',
    gold_cost: 0,
    currency: 0,
    properties: [],
    ...partial,
  };
}

describe('codex equipment-list', () => {
  it('headers are Category / Currency / Rarity (no Cost, Damage, or DR)', () => {
    const keys = CODEX_EQUIPMENT_HEADER_COLUMNS.map((h) => h.key);
    expect(keys).toEqual(['name', 'category', 'currency', 'rarity']);
    expect(keys).not.toContain('cost');
    expect(keys).not.toContain('damage');
    expect(keys).not.toContain('dr');
  });

  it('currency cells are plain numbers without a c suffix or highlight', () => {
    const cols = buildCodexEquipmentColumns(
      item({ id: '1', name: 'Rope', currency: 12, category: 'Adventuring', rarity: 'Common' })
    );
    const currencyCol = cols.find((c) => c.key === 'currency');
    expect(currencyCol?.value).toBe(12);
    expect(currencyCol?.highlight).toBeUndefined();
    expect(String(currencyCol?.value)).not.toMatch(/c/i);
  });

  it('prefers currency over gold_cost', () => {
    expect(equipmentCurrency({ currency: 5, gold_cost: 99 })).toBe(5);
    expect(equipmentCurrency({ gold_cost: 7 })).toBe(7);
  });

  it('moves damage and DR into expand chips', () => {
    const sections = buildCodexEquipmentDetailSections(
      item({ id: 'w', name: 'Sword', damage: '1d8 Slashing', armor_value: 2, weight: 3 })
    );
    const labels = sections.flatMap((s) => s.chips.map((c) => c.name));
    expect(labels.some((n) => /1d8/i.test(n) && /damage/i.test(n))).toBe(true);
    expect(labels.some((n) => /damage reduction 2/i.test(n))).toBe(true);
    expect(labels.some((n) => /weight 3 kg/i.test(n))).toBe(true);
  });

  it('applies search, category, min currency, and optional affordability without TP gates', () => {
    const items = [
      item({ id: 'a', name: 'Cheap kit', category: 'Tools', currency: 10, rarity: 'Common' }),
      item({ id: 'b', name: 'Fancy kit', category: 'Tools', currency: 80, rarity: 'Rare' }),
      item({ id: 'c', name: 'Rope', category: 'Adventuring', currency: 15, rarity: 'Common' }),
    ];
    const filtered = filterCodexEquipment(
      items,
      { search: 'kit', categoryFilter: 'Tools', rarityFilter: '' },
      { ...EMPTY_ARMAMENT_FILTERS, affordableCurrencyOnly: true },
      ctx
    );
    expect(filtered.map((r) => r.id)).toEqual(['a']);
  });
});
