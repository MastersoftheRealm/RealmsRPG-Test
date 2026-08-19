import type { ListColumn } from '@/components/patterns';

/** List column definitions and grid (unified with Library/Codex); name column wider for readability */
export const WEAPON_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.8fr' },
  { key: 'damage', label: 'Damage', width: '0.9fr', align: 'center' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
export const WEAPON_LIST_GRID = '1.8fr 0.9fr 0.6fr 0.6fr';

export const ARMOR_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.8fr' },
  { key: 'armor_value', label: 'Damage Reduction', width: '1fr', align: 'center' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
export const ARMOR_LIST_GRID = '1.8fr 1fr 0.6fr 0.6fr';

export const EQUIPMENT_LIST_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.8fr' },
  { key: 'category', label: 'Category', width: '0.8fr', align: 'center' },
  { key: 'gold_cost', label: 'Cost', width: '0.6fr', align: 'right' },
  { key: 'source', label: 'Source', width: '0.6fr', align: 'center' },
];
export const EQUIPMENT_LIST_GRID = '1.8fr 0.8fr 0.6fr 0.6fr';

/** Selected equipment summary — Name (with quantity stepper), Type, Cost */
export const SELECTED_EQUIPMENT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.6fr' },
  { key: 'type', label: 'Type', width: '0.7fr', align: 'center' },
  { key: 'cost', label: 'Cost', width: '0.6fr', align: 'right' },
];
export const SELECTED_EQUIPMENT_GRID = '1.6fr 0.7fr 0.6fr';

/** Match GridListRow right slot (w-[4rem] mr-2) so header columns align with row columns */
export const RIGHT_SLOT_WIDTH = '4.5rem';
