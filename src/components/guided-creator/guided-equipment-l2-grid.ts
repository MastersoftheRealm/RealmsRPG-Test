/**
 * Grid column definitions for guided equipment L2 `UnifiedSelectionModal`.
 * Headers must match GridListRow `columns` keys (name is the row `name` prop, still
 * listed in headers for alignment with `gridColumns`).
 */

import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';

export type L2ColumnHeader = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable: boolean;
};

/** Weapons & shields — Name | Damage | Currency | Training Points */
export const WEAPON_L2_HEADER_COLUMNS: L2ColumnHeader[] = [
  { key: 'name', label: 'Name', align: 'left', sortable: false },
  { key: 'damage', label: 'Damage', align: 'center', sortable: false },
  { key: 'currency', label: 'Currency', align: 'right', sortable: false },
  { key: 'tp', label: 'Training Points', align: 'center', sortable: false },
];
export const WEAPON_L2_GRID = '1.6fr 0.9fr 0.7fr 0.9fr';

/** Armor — Name | Damage Reduction | Currency | Training Points */
export const ARMOR_L2_HEADER_COLUMNS: L2ColumnHeader[] = [
  { key: 'name', label: 'Name', align: 'left', sortable: false },
  { key: 'dr', label: 'Damage Reduction', align: 'center', sortable: false },
  { key: 'currency', label: 'Currency', align: 'right', sortable: false },
  { key: 'tp', label: 'Training Points', align: 'center', sortable: false },
];
export const ARMOR_L2_GRID = '1.6fr 1fr 0.7fr 0.9fr';

/** Gear — Name | Currency */
export const GEAR_L2_HEADER_COLUMNS: L2ColumnHeader[] = [
  { key: 'name', label: 'Name', align: 'left', sortable: false },
  { key: 'currency', label: 'Currency', align: 'right', sortable: false },
];
export const GEAR_L2_GRID = '1.6fr 0.7fr';

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
