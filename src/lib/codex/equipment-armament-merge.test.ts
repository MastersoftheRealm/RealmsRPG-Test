import { describe, expect, it } from 'vitest';
import { buildCodexEquipmentColumns } from '@/lib/codex/equipment-list';
import { buildEquipmentCatalogRows } from '@/lib/guided-creator/equipment-catalog-rows';
import {
  indexOfficialArmamentsForCodexEquipmentMerge,
  mergeOfficialArmamentIntoCodexEquipmentRow,
} from '@/lib/codex/equipment-armament-merge';
import { mapCodexEquipment } from '@/lib/codex/row-map';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';

const SHARP: ItemPropertyTpRow = {
  id: 1,
  name: 'Sharp',
  base_c: 2,
  op_1_c: 0,
  base_ip: 2,
  op_1_ip: 0,
  base_tp: 4,
};

/** Simulates codex_equipment row shape (no type or properties columns). */
const CODEX_BLADE_ROW = {
  id: 'blade',
  name: 'Blade',
  currency: 5,
  category: 'Weapon',
  rarity: 'Common',
};

const OFFICIAL_BLADE_ROW = {
  id: 'blade',
  name: 'Blade',
  type: 'weapon',
  properties: [{ id: 1, name: 'Sharp', op_1_lvl: 0 }],
};

function mapCodexEquipmentLikeApi(
  codexRow: Record<string, unknown>,
  officialRows: Record<string, unknown>[],
) {
  const officialById = indexOfficialArmamentsForCodexEquipmentMerge(officialRows);
  return mapCodexEquipment(mergeOfficialArmamentIntoCodexEquipmentRow(codexRow, officialById));
}

describe('codex equipment armament merge (GET /api/codex path)', () => {
  it('merge + mapCodexEquipment keeps armament type and properties (1dfe8wf3xew)', () => {
    const item = mapCodexEquipmentLikeApi(CODEX_BLADE_ROW, [OFFICIAL_BLADE_ROW]);
    expect(item.type).toBe('weapon');
    expect(item.properties).toEqual([{ id: 1, name: 'Sharp', op_1_lvl: 0 }]);
    expect(item.currency).toBe(5);
  });

  it('browse currency is calculated after merge + map, not stored catalog', () => {
    const item = mapCodexEquipmentLikeApi(CODEX_BLADE_ROW, [OFFICIAL_BLADE_ROW]);
    const cols = buildCodexEquipmentColumns(item, [SHARP]);
    expect(cols.find((c) => c.key === 'currency')?.value).toBe(31);
  });

  it('guided catalog gold_cost uses calculated currency on the same mapped row', () => {
    const item = mapCodexEquipmentLikeApi(CODEX_BLADE_ROW, [OFFICIAL_BLADE_ROW]);
    const catalog = buildEquipmentCatalogRows([], [item], [SHARP]);
    expect(catalog.get('blade')?.gold_cost).toBe(31);
    expect(catalog.get('blade')?.gold_cost).not.toBe(5);
  });

  it('unresolved property names keep stored catalog currency, not Common floor', () => {
    const official = {
      id: 'blade',
      name: 'Blade',
      type: 'weapon',
      properties: [{ name: 'Nope', op_1_lvl: 0 }],
    };
    const item = mapCodexEquipmentLikeApi(CODEX_BLADE_ROW, [official]);
    const cols = buildCodexEquipmentColumns(item, [SHARP]);
    expect(cols.find((c) => c.key === 'currency')?.value).toBe(5);
  });
});
