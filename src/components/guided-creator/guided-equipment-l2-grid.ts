/**
 * Grid column definitions for guided equipment L2/L3 catalogs.
 * Align with Codex/Library `ARMAMENT_LIBRARY_CONFIG` (TASK-688).
 * Weapon phase mixes weapons + shields — uses weapon columns; shields show Block
 * in the Damage cell (intentional mixed-phase subset).
 */

import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import { ARMAMENT_LIBRARY_CONFIG } from '@/lib/library/official-item-list';

export type L2ColumnHeader = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable: boolean;
};

function fromArmamentConfig(kind: keyof typeof ARMAMENT_LIBRARY_CONFIG): {
  headers: L2ColumnHeader[];
  grid: string;
} {
  const cfg = ARMAMENT_LIBRARY_CONFIG[kind];
  return {
    grid: cfg.grid,
    headers: cfg.headers.map((h) => ({
      key: h.key,
      label: h.label,
      align: h.align,
      sortable: h.sortable !== false,
    })),
  };
}

const weaponCfg = fromArmamentConfig('weapon');
const armorCfg = fromArmamentConfig('armor');

/** Weapons (+ shields in same phase) — Codex weapon browse columns. */
export const WEAPON_L2_HEADER_COLUMNS: L2ColumnHeader[] = weaponCfg.headers;
export const WEAPON_L2_GRID = weaponCfg.grid;

/** Armor — Codex armor browse columns. */
export const ARMOR_L2_HEADER_COLUMNS: L2ColumnHeader[] = armorCfg.headers;
export const ARMOR_L2_GRID = armorCfg.grid;

/** Gear — Name | Category | Rarity | Currency (taxonomy, not phase type). */
export const GEAR_L2_HEADER_COLUMNS: L2ColumnHeader[] = [
  { key: 'name', label: 'NAME', align: 'left', sortable: true },
  { key: 'category', label: 'CATEGORY', align: 'center', sortable: true },
  { key: 'rarity', label: 'RARITY', align: 'center', sortable: true },
  { key: 'currency', label: 'CURRENCY', align: 'center', sortable: true },
];
export const GEAR_L2_GRID = '1.5fr 1fr 0.7fr 0.7fr';

export function l2HeaderColumnsForPhase(phase: GuidedEquipmentPhase): L2ColumnHeader[] {
  if (phase === 'armor') return ARMOR_L2_HEADER_COLUMNS;
  if (phase === 'gear') return GEAR_L2_HEADER_COLUMNS;
  return WEAPON_L2_HEADER_COLUMNS;
}

export function l2GridColumnsForPhase(phase: GuidedEquipmentPhase): string {
  if (phase === 'armor') return ARMOR_L2_GRID;
  if (phase === 'gear') return GEAR_L2_GRID;
  return WEAPON_L2_GRID;
}
