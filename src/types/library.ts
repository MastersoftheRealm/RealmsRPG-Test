/**
 * Library API Types
 * =================
 * Canonical shapes for user + official library items (HYG-02 / TASK-420).
 * GET responses from `/api/user/library/*` and `/api/official/*` share rowToItem output.
 */

import type { AttackMode } from '@/lib/attack-mode';

/** Library collection keys (user + official APIs). */
export type LibraryItemType =
  | 'powers'
  | 'techniques'
  | 'empowered-techniques'
  | 'items'
  | 'creatures'
  | 'species';

export const LIBRARY_ITEM_TYPES = [
  'powers',
  'techniques',
  'empowered-techniques',
  'items',
  'creatures',
  'species',
] as const satisfies readonly LibraryItemType[];

export interface SavedPart {
  id?: number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
  applyDuration?: boolean;
}

export interface SavedDamage {
  amount?: number | string;
  size?: number | string;
  type?: string;
  applyDuration?: boolean;
}

export interface LibraryPower {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  actionType?: string;
  isReaction?: boolean;
  range?: { steps?: number; applyDuration?: boolean };
  area?: { type?: string; level?: number; applyDuration?: boolean };
  duration?: {
    type?: string;
    value?: number;
    focus?: boolean;
    noHarm?: boolean;
    endsOnActivation?: boolean;
    sustain?: number;
  };
  image_id?: string | null;
  image_url?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  /** Present on official-library rows when copied from Realms Library. */
  _source?: 'official' | string;
}

export interface LibraryTechnique {
  id: string;
  docId: string;
  name: string;
  description?: string;
  parts: SavedPart[];
  damage?: SavedDamage[];
  /** Attack mode (none | unarmed | weapon); preferred over legacy `weapon`. */
  attackMode?: AttackMode;
  /** Display label ("No Attack" | "Unarmed" | "Weapon") reused from the weapon_name column. */
  weaponName?: string;
  /** @deprecated Legacy weapon reference; retained for reading older rows. */
  weapon?: { id?: string | number; name?: string; tp?: number };
  actionType?: string;
  isReaction?: boolean;
  image_id?: string | null;
  image_url?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  _source?: 'official' | string;
}

export interface SavedProperty {
  id?: number;
  name?: string;
  op_1_lvl?: number;
}

export interface LibraryItem {
  id: string;
  docId: string;
  name: string;
  description?: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  properties: SavedProperty[];
  damage?: SavedDamage[];
  isTwoHanded?: boolean;
  rangeLevel?: number;
  abilityRequirement?: { id?: string; name?: string; level?: number };
  damageReduction?: number;
  agilityReduction?: number;
  criticalRangeIncrease?: number;
  shieldDR?: { amount: number; size: number };
  hasShieldDamage?: boolean;
  shieldDamage?: { amount: number; size: number };
  costs?: { totalTP?: number; totalCurrency?: number; totalIP?: number };
  rarity?: string;
  armorValue?: number;
  image_id?: string | null;
  image_url?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  _source?: 'official' | string;
}

export interface LibrarySpecies {
  id: string;
  docId?: string;
  name: string;
  description?: string;
  type?: string;
  size?: string;
  sizes?: string[];
  speed?: number;
  skills?: string[];
  species_traits?: string[];
  ancestry_traits?: string[];
  flaws?: string[];
  characteristics?: string[];
  languages?: string[];
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
  image_id?: string | null;
  image_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _source?: 'official' | string;
}

export interface LibraryCreature {
  id: string;
  docId: string;
  name: string;
  description?: string;
  level: number;
  type?: string;
  size?: string;
  hitPoints?: number;
  energyPoints?: number;
  abilities?: Record<string, number>;
  defenses?: Record<string, number>;
  powerProficiency?: number;
  martialProficiency?: number;
  resistances?: string[];
  weaknesses?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  movementTypes?: string[];
  languages?: string[];
  skills?: Array<{ name: string; value: number; proficient?: boolean }>;
  powers?: Array<{ name: string; description?: string }>;
  techniques?: Array<{ name: string; description?: string }>;
  feats?: Array<{ name: string; description?: string }>;
  armaments?: Array<{ name: string }>;
  hp?: number;
  attacks?: unknown[];
  image_id?: string | null;
  image_url?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  _source?: 'official' | string;
}

/** Map library kind → item shape returned by rowToItem / GET list endpoints. */
export interface LibraryItemByType {
  powers: LibraryPower;
  techniques: LibraryTechnique;
  'empowered-techniques': LibraryTechnique;
  items: LibraryItem;
  creatures: LibraryCreature;
  species: LibrarySpecies;
}

export type LibraryRow<T extends LibraryItemType = LibraryItemType> = LibraryItemByType[T];

/** Backward-compatible aliases (user-library hook names). */
export type UserPower = LibraryPower;
export type UserTechnique = LibraryTechnique;
export type UserItem = LibraryItem;
export type UserSpecies = LibrarySpecies;
export type UserCreature = LibraryCreature;

/** Body accepted by POST/PATCH library routes (creators serialize full documents). */
export type LibrarySaveBody = Record<string, unknown>;
