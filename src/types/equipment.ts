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
export type ItemRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

/** Weapon categories */
export type WeaponCategory =
  | 'simple'
  | 'martial'
  | 'exotic'
  | 'unarmed';

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

/** Base item interface */
export interface Item {
  id: number | string;
  name: string;
  description?: string;
  rarity?: ItemRarity;
  cost?: number;
  weight?: number;
  properties?: string[] | ItemProperty[];
  // Equipped state
  equipped?: boolean;
  quantity?: number;
  // Combat stats (for display)
  damage?: string;
  armor?: number;
  range?: number;
}

/** Item property */
export interface ItemProperty {
  id: number | string;
  name: string;
  value?: number | string;
}

/** Weapon item */
export interface Weapon extends Item {
  category: WeaponCategory;
  damageType?: DamageType;
  damageDice?: string; // e.g., "1d8"
  range?: number;
  reach?: number;
  hands?: 1 | 2;
  armament?: number; // Armament value
}

/** Armor item */
export interface Armor extends Item {
  armorValue: number;
  maxAgility?: number;
  speedPenalty?: number;
  slot: 'armor' | 'shield';
}

/** Character's equipped items */
export interface CharacterEquipment {
  mainHand?: Weapon | null;
  offHand?: Weapon | Armor | null;
  armor?: Armor | Item[] | null;
  weapons?: Weapon[] | Item[];
  items?: Item[];
  accessories?: Item[];
  inventory?: Item[];
}
