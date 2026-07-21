import type { ListColumn } from '@/components/shared/list-header';

// Powers (character sheet-like; creature stat block can include Energy)
export const POWER_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
export const POWER_GRID = '1.4fr 1fr 1fr 0.7fr 0.7fr';

export const POWER_COLUMNS_WITH_ENERGY: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.2fr' },
  { key: 'energy', label: 'Energy', width: '0.7fr', align: 'center' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
export const POWER_GRID_WITH_ENERGY = '1.2fr 0.7fr 1fr 1fr 0.7fr 0.7fr';

// Techniques (matches Character Sheet -> Library -> Techniques columns)
export const TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'energy', label: 'Energy', width: '0.7fr', align: 'center' },
  { key: 'weapon', label: 'Attack', width: '1fr', align: 'center' },
  { key: 'tp', label: 'TP', width: '0.8fr', align: 'center' },
];
export const TECHNIQUE_GRID = '1.4fr 0.7fr 1fr 0.8fr';

/**
 * Character sheet techniques tab: Action + Attack (weapon).
 * Energy cost lives only in the row rightSlot spend button (not a static value column).
 * ListHeader shows Energy via `CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME` over that control.
 * TP stays on expanded part chips / proficiency budget — not a collapsed GLR column.
 */
export const CHARACTER_SHEET_TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'weapon', label: 'Attack', width: '1fr', align: 'center' },
];
export const CHARACTER_SHEET_TECHNIQUE_GRID = '1.4fr 1fr 1fr';

// Weapons / Shields / Armor / Equipment (matches Character Sheet -> Library -> Inventory)
export const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
];
export const WEAPON_GRID = '1fr 0.8fr 0.6fr';

/** Character sheet weapons: range, attack roll, damage roll */
export const CHARACTER_SHEET_WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(180px, 0.9fr)' },
  { key: 'range', label: 'Range', width: 'minmax(88px, 7rem)', align: 'center' },
  { key: 'attack', label: 'Attack', width: 'minmax(60px, 4rem)', align: 'center' },
  { key: 'damage', label: 'Damage', width: 'minmax(110px, 8rem)', align: 'center' },
];
export const CHARACTER_SHEET_WEAPON_GRID =
  'minmax(180px, 0.9fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem)';

export const SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'attack', label: 'Attack', width: '0.6fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.7fr', align: 'center' },
  { key: 'block', label: 'Block', width: '0.7fr', align: 'center' },
];
export const SHIELD_GRID = '1fr 0.6fr 0.7fr 0.7fr';

export const CHARACTER_SHEET_SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(160px, 1fr)' },
  { key: 'range', label: 'Range', width: 'minmax(64px, 0.6fr)', align: 'center' },
  { key: 'attack', label: 'Attack', width: 'minmax(64px, 4.5rem)', align: 'center' },
  { key: 'damage', label: 'Damage', width: 'minmax(64px, 4.5rem)', align: 'center' },
  { key: 'block', label: 'Block', width: 'minmax(64px, 0.7fr)', align: 'center' },
];
export const CHARACTER_SHEET_SHIELD_GRID =
  'minmax(160px, 1fr) minmax(64px, 0.6fr) minmax(64px, 4.5rem) minmax(64px, 4.5rem) minmax(64px, 0.7fr)';

export const ARMOR_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'dr', label: 'Dmg. Red.', width: '0.6fr', align: 'center' },
  { key: 'crit', label: 'Crit Range', width: '0.6fr', align: 'center' },
];
export const ARMOR_GRID = '1fr 0.6fr 0.6fr';

export const EQUIPMENT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'type', label: 'Type', width: '0.6fr', align: 'center' },
  { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
];
export const EQUIPMENT_GRID = '1fr 0.6fr 4rem';

// Feats/Traits (matches Character Sheet -> FeatsTab columns)
export const FEAT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2.5fr' },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
  { key: 'recovery', label: 'Recovery', width: '4rem', align: 'center' },
];
export const FEAT_GRID = 'minmax(140px, 1.6fr) 2.5fr 5rem 4rem';

export const FEAT_COLUMNS_WITH_LEVEL: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2fr' },
  { key: 'level', label: 'Lvl', width: '3.5rem', align: 'center' },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
  { key: 'recovery', label: 'Recovery', width: '4rem', align: 'center' },
];
export const FEAT_GRID_WITH_LEVEL = 'minmax(140px, 1.6fr) 2fr 3.5rem 5rem 4rem';
