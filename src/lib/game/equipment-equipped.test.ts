import { describe, expect, it } from 'vitest';
import type { Item } from '@/types/equipment';
import {
  applyStarterEquippedFlags,
  itemDamageReduction,
  pickArmorEquipIndex,
  toggleSheetArmorEquipped,
  type InventoryEquipRow,
} from '@/lib/game/equipment-equipped';

describe('itemDamageReduction', () => {
  it('prefers explicit fields then Damage Reduction property', () => {
    expect(itemDamageReduction({ armorValue: 3 })).toBe(3);
    expect(
      itemDamageReduction({
        properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 2 } as never],
      }),
    ).toBe(3);
  });
});

describe('toggleSheetArmorEquipped', () => {
  const matchId = (item: Item, itemId: string | number) => String(item.id) === String(itemId);

  it('equipping one piece unequips others', () => {
    const armor: Item[] = [
      { id: 'a', name: 'A', equipped: true },
      { id: 'b', name: 'B', equipped: false },
    ];
    const next = toggleSheetArmorEquipped(armor, 'b', (item, id) => matchId(item, id));
    expect(next.find((x) => x.id === 'a')?.equipped).toBe(false);
    expect(next.find((x) => x.id === 'b')?.equipped).toBe(true);
  });

  it('unequipping leaves others unequipped', () => {
    const armor: Item[] = [{ id: 'a', name: 'A', equipped: true }];
    const next = toggleSheetArmorEquipped(armor, 'a', (item, id) => matchId(item, id));
    expect(next[0]?.equipped).toBe(false);
  });
});

describe('applyStarterEquippedFlags', () => {
  it('equips all weapons/shields/equipment and one armor by DR', () => {
    const inventory: Array<InventoryEquipRow & { id: string }> = [
      { id: 'w1', type: 'weapon' as const },
      { id: 's1', type: 'shield' as const },
      { id: 'e1', type: 'equipment' as const },
      { id: 'a1', type: 'armor' as const },
      { id: 'a2', type: 'armor' as const },
    ];
    const dr = (row: { id: string }) => (row.id === 'a2' ? 5 : 1);
    const next = applyStarterEquippedFlags(inventory, dr);
    expect(next.find((r) => r.id === 'w1')?.equipped).toBe(true);
    expect(next.find((r) => r.id === 's1')?.equipped).toBe(true);
    expect(next.find((r) => r.id === 'e1')?.equipped).toBe(true);
    expect(next.find((r) => r.id === 'a1')?.equipped).toBe(false);
    expect(next.find((r) => r.id === 'a2')?.equipped).toBe(true);
  });

  it('picks first armor when DR ties', () => {
    const rows = [{ id: 'a1', type: 'armor' as const }, { id: 'a2', type: 'armor' as const }];
    expect(pickArmorEquipIndex(rows, () => 2)).toBe(0);
  });
});
