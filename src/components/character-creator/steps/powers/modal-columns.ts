/** Column defs for Advanced creator power/technique selection modals + selected lists. */

export const POWER_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Action', label: 'ACTION', sortable: true, align: 'center' as const },
  { key: 'Energy', label: 'EN', sortable: true, align: 'center' as const },
  { key: 'Training Points', label: 'Training Points', sortable: true, align: 'center' as const },
  { key: 'Damage', label: 'DAMAGE', sortable: true, align: 'center' as const },
];
export const POWER_GRID_COLUMNS = '1.4fr 0.8fr 0.5fr 0.5fr 0.7fr';

export const TECHNIQUE_MODAL_COLUMNS = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'Action', label: 'ACTION', sortable: true, align: 'center' as const },
  { key: 'Energy', label: 'ENERGY', sortable: true, align: 'center' as const },
  { key: 'Weapon', label: 'ATTACK', sortable: true, align: 'center' as const },
  { key: 'Training Points', label: 'Training Points', sortable: true, align: 'center' as const },
];
export const TECHNIQUE_GRID_COLUMNS = '1.3fr 0.75fr 0.55fr 1fr 0.75fr';

export type PowerModalTab = 'powers' | 'empowered';
