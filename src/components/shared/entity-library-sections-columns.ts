import type { ListColumn } from '@/components/shared/list-header';
import { glrListChrome } from '@/lib/glr';

function toListColumns(chrome: ReturnType<typeof glrListChrome>): ListColumn[] {
  return chrome.headers.map((h) => ({
    key: h.key,
    label: h.label,
    width: h.width,
    align: h.align,
  }));
}

const playPowerChrome = glrListChrome(
  { entityType: 'power', mode: 'play' },
  { labelStyle: 'title' },
);
const selectPowerChrome = glrListChrome(
  { entityType: 'power', mode: 'select' },
  { labelStyle: 'title' },
);
const playTechniqueChrome = glrListChrome(
  { entityType: 'technique', mode: 'play' },
  { labelStyle: 'title' },
);
const selectTechniqueChrome = glrListChrome(
  { entityType: 'technique', mode: 'select' },
  { labelStyle: 'title' },
);
const playArmorChrome = glrListChrome(
  { entityType: 'armor', mode: 'play' },
  { labelStyle: 'title' },
);
const playWeaponChrome = glrListChrome(
  { entityType: 'weapon', mode: 'play' },
  { labelStyle: 'title' },
);
const playShieldChrome = glrListChrome(
  { entityType: 'shield', mode: 'play' },
  {
    labelStyle: 'title',
    nameWidth: '1fr',
    extraColumns: [{ key: 'attack', label: 'Attack', width: '0.6fr', afterKey: 'name' }],
  },
);
const sheetWeaponChrome = glrListChrome(
  { entityType: 'weapon', mode: 'play' },
  {
    labelStyle: 'title',
    nameWidth: 'minmax(180px, 0.9fr)',
    extraColumns: [{ key: 'attack', label: 'Attack', width: 'minmax(60px, 4rem)' }],
    columnOrder: ['range', 'attack', 'damage'],
    trackOverrides: {
      range: 'minmax(88px, 7rem)',
      damage: 'minmax(110px, 8rem)',
    },
  },
);
const sheetShieldChrome = glrListChrome(
  { entityType: 'shield', mode: 'play' },
  {
    labelStyle: 'title',
    nameWidth: 'minmax(160px, 1fr)',
    extraColumns: [
      { key: 'range', label: 'Range', width: 'minmax(64px, 0.6fr)', afterKey: 'name' },
      { key: 'attack', label: 'Attack', width: 'minmax(64px, 4.5rem)', afterKey: 'range' },
    ],
    trackOverrides: {
      damage: 'minmax(64px, 4.5rem)',
      block: 'minmax(64px, 0.7fr)',
    },
  },
);
const playFeatChrome = glrListChrome(
  { entityType: 'feat', mode: 'play' },
  {
    labelStyle: 'title',
    extraColumns: [{ key: 'description', label: 'Description', width: '2.5fr', afterKey: 'name' }],
    trackOverrides: { uses: '5rem', recovery: '4rem' },
  },
);
const playGearChrome = glrListChrome(
  { entityType: 'gear', mode: 'play' },
  {
    labelStyle: 'title',
    nameWidth: '1fr',
    extraColumns: [
      { key: 'type', label: 'Type', width: '0.6fr', afterKey: 'name' },
      { key: 'quantity', label: 'Qty', width: '4rem', afterKey: 'type' },
    ],
  },
);

// Powers (character sheet-like; creature stat block can include Energy)
export const POWER_COLUMNS: ListColumn[] = toListColumns(playPowerChrome);
export const POWER_GRID = playPowerChrome.grid;

export const POWER_COLUMNS_WITH_ENERGY: ListColumn[] = toListColumns(selectPowerChrome);
export const POWER_GRID_WITH_ENERGY = selectPowerChrome.grid;

/** Creature / stat-block techniques — select density (Action + Energy + Attack + TP). */
export const TECHNIQUE_COLUMNS: ListColumn[] = toListColumns(selectTechniqueChrome);
export const TECHNIQUE_GRID = selectTechniqueChrome.grid;

/**
 * Character sheet techniques tab: Action + Attack (weapon).
 * Energy cost lives only in the row rightSlot spend button (not a static value column).
 * ListHeader shows Energy via `CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME` over that control.
 * TP stays on expanded part chips / proficiency budget — not a collapsed GLR column.
 */
export const CHARACTER_SHEET_TECHNIQUE_COLUMNS: ListColumn[] = toListColumns(playTechniqueChrome);
export const CHARACTER_SHEET_TECHNIQUE_GRID = playTechniqueChrome.grid;

// Weapons / Shields / Armor / Equipment (matches Character Sheet -> Library -> Inventory)
export const WEAPON_COLUMNS: ListColumn[] = toListColumns(playWeaponChrome);
export const WEAPON_GRID = playWeaponChrome.grid;

/** Character sheet weapons: range, attack roll, damage roll */
export const CHARACTER_SHEET_WEAPON_COLUMNS: ListColumn[] = toListColumns(sheetWeaponChrome);
export const CHARACTER_SHEET_WEAPON_GRID = sheetWeaponChrome.grid;

export const SHIELD_COLUMNS: ListColumn[] = toListColumns(playShieldChrome);
export const SHIELD_GRID = playShieldChrome.grid;

export const CHARACTER_SHEET_SHIELD_COLUMNS: ListColumn[] = toListColumns(sheetShieldChrome);
export const CHARACTER_SHEET_SHIELD_GRID = sheetShieldChrome.grid;

export const ARMOR_COLUMNS: ListColumn[] = toListColumns(playArmorChrome);
export const ARMOR_GRID = playArmorChrome.grid;

export const EQUIPMENT_COLUMNS: ListColumn[] = toListColumns(playGearChrome);
export const EQUIPMENT_GRID = playGearChrome.grid;

// Feats/Traits (matches Character Sheet -> FeatsTab columns)
export const FEAT_COLUMNS: ListColumn[] = toListColumns(playFeatChrome);
export const FEAT_GRID = playFeatChrome.grid;
