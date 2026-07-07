/** Grid column definitions for guided equipment L2 `UnifiedSelectionModal` rows. */

export const LOADOUT_CUSTOMIZE_GRID_COLUMNS = '1.6fr 0.55fr 3.5rem 1fr';

export const LOADOUT_CUSTOMIZE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const, sortable: false as const },
  { key: 'type', label: 'TYPE', align: 'center' as const, sortable: false as const },
  { key: 'tp', label: 'TP', align: 'center' as const, sortable: false as const },
  { key: 'stats', label: 'STATS', align: 'right' as const, sortable: false as const },
] as const;
