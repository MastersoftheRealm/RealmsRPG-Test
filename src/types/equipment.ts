/**
 * Equipment Types
 * ================
 * Item and equipment definitions
 */

/** Equipment slot types */
export type EquipmentSlot =
  | 'mainHand'
  | 'offHand'
  | 'armor'
  | 'head'
  | 'neck'
  | 'ring'
  | 'feet'
  | 'hands'
  | 'back'
  | 'waist';

/** Item rarity levels */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Weapon categories */
export type WeaponCategory = 'simple' | 'martial' | 'exotic' | 'unarmed';

/** Damage types */
export type DamageType =
  | 'physical'
  | 'magic'
  | 'elemental'
  | 'light'
  | 'poison'
  | 'necrotic'
  | 'sonic'
  | 'spiritual'
  | 'psychic';

/** Damage entry for items */
export interface DamageEntry {
  amount?: number | string | undefined;
  size?: number | string | undefined;
  type?: string | undefined;
}

/** Base item interface */
export interface Item {
  id: number | string;
  name: string;
  description?: string | undefined;
  type?: 'weapon' | 'armor' | 'equipment' | 'shield' | string | undefined;
  rarity?: ItemRarity | undefined;
  cost?: number | undefined;
  weight?: number | undefined;
  properties?: string[] | ItemProperty[] | undefined;
  // Equipped state
  equipped?: boolean | undefined;
  quantity?: number | undefined;
  // Combat stats (for display) - supports both string and array formats
  damage?: string | DamageEntry[] | undefined;
  armor?: number | undefined;
  range?: number | undefined;
  /** Bank art (persisted when added from library). */
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
}

/** Item property */
export interface ItemProperty {
  id: number | string;
  name: string;
  value?: number | string | undefined;
}

/** Weapon item */
export interface Weapon extends Item {
  category: WeaponCategory;
  damageType?: DamageType | undefined;
  damageDice?: string | undefined; // e.g., "1d8"
  range?: number | undefined;
  reach?: number | undefined;
  hands?: 1 | 2 | undefined;
  armament?: number | undefined; // Armament value
}

/** Armor item */
export interface Armor extends Item {
  armorValue: number;
  maxAgility?: number | undefined;
  speedPenalty?: number | undefined;
  slot: 'armor' | 'shield';
}

/** Character's equipped items */
export interface CharacterEquipment {
  mainHand?: Weapon | null | undefined;
  offHand?: Weapon | Armor | null | undefined;
  armor?: Armor | Item[] | null | undefined;
  weapons?: Weapon[] | Item[] | undefined;
  shields?: Item[] | undefined;
  items?: Item[] | undefined;
  accessories?: Item[] | undefined;
  inventory?: Item[] | undefined;
}
