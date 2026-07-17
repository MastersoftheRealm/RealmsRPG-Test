/**
 * Equipped-state rules for character equipment (sheet + create).
 * Armor: at most one piece equipped; weapons/shields/general gear may multi-equip.
 */

import type { Item, ItemProperty } from '@/types/equipment';

type DrLike = {
  damageReduction?: number;
  armorValue?: number;
  armor?: number;
  properties?: Array<string | ItemProperty | { name?: string; op_1_lvl?: number }>;
};

/** Resolve Damage Reduction for armor pick / display parity with sheet rows. */
export function itemDamageReduction(item: DrLike): number {
  const direct = item.damageReduction ?? item.armorValue ?? item.armor;
  if (typeof direct === 'number' && direct > 0) return direct;

  const props = item.properties;
  if (!Array.isArray(props)) return 0;

  for (const p of props) {
    if (typeof p === 'string') continue;
    if (p.name === 'Damage Reduction') {
      const op = p as ItemProperty & { op_1_lvl?: number };
      const lvl = typeof op.op_1_lvl === 'number' ? op.op_1_lvl : 0;
      return 1 + lvl;
    }
  }
  return 0;
}

/** Index of armor row to equip at creation (highest DR, else first). */
export function pickArmorEquipIndex<T>(armorRows: T[], drScore: (row: T) => number): number {
  if (armorRows.length === 0) return -1;
  let bestIdx = 0;
  let bestDr = drScore(armorRows[0]!);
  for (let i = 1; i < armorRows.length; i++) {
    const dr = drScore(armorRows[i]!);
    if (dr > bestDr) {
      bestDr = dr;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Toggle one armor row; equipping clears equipped on all other armor rows.
 */
export function toggleSheetArmorEquipped(
  armor: Item[],
  itemId: string | number,
  matches: (item: Item, itemId: string | number, index: number) => boolean,
): Item[] {
  const targetIdx = armor.findIndex((a, idx) => matches(a, itemId, idx));
  if (targetIdx === -1) return armor;

  const willEquip = !armor[targetIdx]?.equipped;
  return armor.map((a, idx) => {
    if (idx === targetIdx) return { ...a, equipped: willEquip };
    if (willEquip) return { ...a, equipped: false };
    return a;
  });
}

export type InventoryEquipRow = {
  type?: string;
  equipped?: boolean;
};

/**
 * Mark starter gear equipped on create. Does not mutate input rows.
 * Weapons, shields, and general equipment → equipped; armor → single best DR.
 */
export function applyStarterEquippedFlags<T extends InventoryEquipRow>(
  inventory: T[],
  armorDrScore: (row: T) => number = () => 0,
): T[] {
  const armorRows = inventory.filter((r) => r.type === 'armor');
  const armorPickIdx = pickArmorEquipIndex(armorRows, armorDrScore);

  return inventory.map((row) => {
    const type = row.type;
    if (type === 'armor') {
      const idxInArmor = armorRows.indexOf(row);
      return { ...row, equipped: idxInArmor === armorPickIdx && armorPickIdx >= 0 };
    }
    if (type === 'weapon' || type === 'shield' || type === 'equipment') {
      return { ...row, equipped: true };
    }
    if (!type) {
      return { ...row, equipped: true };
    }
    return row;
  });
}
