import { describe, expect, it, vi } from 'vitest';
import { defined } from '@/lib/utils';
import { assertRowFactCoverage, chipLabelsFromDetailSections } from '@/lib/glr/validate-glr-facts';
import type { CreatureArmamentRow } from './creature-creator-feat-armament-display';
import {
  creatureArmamentToSheetItem,
  mapCreatureSelectedInventoryRows,
} from './map-creature-inventory-rows';

const abilities = {
  strength: 3,
  vitality: 0,
  agility: 1,
  acuity: 2,
  intelligence: 0,
  charisma: 0,
};

function baseRow(
  overrides: Partial<CreatureArmamentRow> & Pick<CreatureArmamentRow, 'id' | 'type'>,
): CreatureArmamentRow {
  return {
    name: 'Item',
    range: '-',
    attack: '-',
    damage: '-',
    block: '-',
    damageReduction: '-',
    criticalRangeIncrease: '-',
    tp: 2,
    currency: '15c',
    rarity: 'uncommon',
    ...overrides,
  };
}

describe('mapCreatureSelectedInventoryRows (TASK-817)', () => {
  it('converts stored tp/currency onto the sheet item for play cost chips', () => {
    const item = creatureArmamentToSheetItem(
      baseRow({
        id: 'w1',
        type: 'weapon',
        name: 'Spear',
        range: 'Melee',
        damage: '1d8 Piercing',
        tp: 2,
        currency: '15c',
      }),
    );
    expect(item.cost).toBe(15);
    expect(item.tp).toBe(2);
    expect(item.rarity).toBe('uncommon');
  });

  it('weapons: play chips for rarity/currency/TP and no totalTp footer', () => {
    const { weapons } = mapCreatureSelectedInventoryRows({
      sortedArmaments: [
        baseRow({
          id: 'w1',
          type: 'weapon',
          name: 'Spear',
          range: 'Melee',
          damage: '1d8 Piercing',
          tp: 2,
          currency: '15c',
          rarity: 'uncommon',
        }),
      ],
      creature: { abilities, martialProficiency: 1 },
      onRemoveArmament: vi.fn(),
    });
    const row = defined(weapons[0]);
    expect(row.totalTp).toBeUndefined();
    expect(row.columns?.map((c) => c.key)).toEqual(['range', 'attack', 'damage']);
    const chips = chipLabelsFromDetailSections(row.detailSections);
    expect(chips.some((l) => /training points\s+2/i.test(l))).toBe(true);
    expect(chips.some((l) => /^currency\s+15$/i.test(l))).toBe(true);
    expect(chips.some((l) => /^rarity\b/i.test(l))).toBe(true);
    assertRowFactCoverage('character-sheet-weapon-play', {
      columnKeys: row.columns?.map((c) => c.key) ?? [],
      chipLabels: chips,
    });
  });

  it('armor/shields omit totalTp and chip demoted cost facts', () => {
    const { armor, shields } = mapCreatureSelectedInventoryRows({
      sortedArmaments: [
        baseRow({
          id: 'a1',
          type: 'armor',
          name: 'Hide',
          damageReduction: '2',
          armorValue: 2,
          rarity: 'common',
          tp: 1,
          currency: '8c',
        }),
        baseRow({
          id: 's1',
          type: 'shield',
          name: 'Buckler',
          range: 'Melee',
          damage: '1d4 Bludgeoning',
          block: '1d6',
          rarity: 'common',
          tp: 1,
          currency: '5c',
        }),
      ],
      creature: { abilities, martialProficiency: 0 },
      onRemoveArmament: vi.fn(),
    });
    const armorRow = defined(armor[0]);
    const shieldRow = defined(shields[0]);
    expect(armorRow.totalTp).toBeUndefined();
    expect(shieldRow.totalTp).toBeUndefined();
    const armorChips = chipLabelsFromDetailSections(armorRow.detailSections);
    const shieldChips = chipLabelsFromDetailSections(shieldRow.detailSections);
    expect(armorChips.some((l) => /training points\s+1/i.test(l))).toBe(true);
    expect(shieldChips.some((l) => /training points\s+1/i.test(l))).toBe(true);
    expect(armorChips.some((l) => /^currency\s+8$/i.test(l))).toBe(true);
    expect(shieldChips.some((l) => /^currency\s+5$/i.test(l))).toBe(true);
  });

  it('equipment Qty uses stored quantity or "-" and omits totalTp', () => {
    const { equipment } = mapCreatureSelectedInventoryRows({
      sortedArmaments: [
        baseRow({
          id: 'e1',
          type: 'equipment',
          name: 'Rope',
          category: 'Adventuring',
          rarity: 'common',
          tp: 0,
          currency: '3c',
          quantity: 2,
        }),
        baseRow({
          id: 'e2',
          type: 'equipment',
          name: 'Torch',
          category: 'Adventuring',
          rarity: 'common',
          tp: 0,
          currency: '1c',
        }),
      ],
      creature: { abilities, martialProficiency: 0 },
      onRemoveArmament: vi.fn(),
    });
    const rope = defined(equipment[0]);
    const torch = defined(equipment[1]);
    expect(rope.totalTp).toBeUndefined();
    expect(torch.totalTp).toBeUndefined();
    expect(rope.columns?.find((c) => c.key === 'quantity')?.value).toBe('2');
    expect(torch.columns?.find((c) => c.key === 'quantity')?.value).toBe('-');
    assertRowFactCoverage('character-sheet-gear', {
      columnKeys: rope.columns?.map((c) => c.key) ?? [],
      chipLabels: chipLabelsFromDetailSections(rope.detailSections),
    });
  });
});
