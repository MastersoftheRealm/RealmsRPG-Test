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
  id?: number | undefined;
  name?: string | undefined;
  op_1_lvl?: number | undefined;
  op_2_lvl?: number | undefined;
  op_3_lvl?: number | undefined;
  applyDuration?: boolean | undefined;
}

export interface SavedDamage {
  amount?: number | string | undefined;
  size?: number | string | undefined;
  type?: string | undefined;
  applyDuration?: boolean | undefined;
}

export interface LibraryPower {
  id: string;
  docId: string;
  name: string;
  description?: string | undefined;
  parts: SavedPart[];
  damage?: SavedDamage[] | undefined;
  actionType?: string | undefined;
  isReaction?: boolean | undefined;
  range?: { steps?: number | undefined; applyDuration?: boolean | undefined } | undefined;
  area?:
    | { type?: string | undefined; level?: number | undefined; applyDuration?: boolean | undefined }
    | undefined;
  duration?:
    | {
        type?: string | undefined;
        value?: number | undefined;
        focus?: boolean | undefined;
        noHarm?: boolean | undefined;
        endsOnActivation?: boolean | undefined;
        sustain?: number | undefined;
      }
    | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  /** Present on official-library rows when copied from Realms Library. */
  _source?: 'official' | string | undefined;
  /** Defenses this power actually targets (if any). */
  targetedDefenses?: string[] | undefined;
}

export interface LibraryTechnique {
  id: string;
  docId: string;
  name: string;
  description?: string | undefined;
  parts: SavedPart[];
  damage?: SavedDamage[] | undefined;
  /** Attack mode (none | unarmed | weapon); preferred over legacy `weapon`. */
  attackMode?: AttackMode | undefined;
  /** Derived Attack column label ("No Attack" | "Unarmed" | "Weapon") — not persisted. */
  weaponName?: string | undefined;
  /** @deprecated Legacy weapon reference; retained for reading older rows. */
  weapon?:
    | { id?: string | number | undefined; name?: string | undefined; tp?: number | undefined }
    | undefined;
  actionType?: string | undefined;
  isReaction?: boolean | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  _source?: 'official' | string | undefined;
  /** Present on empowered-technique library rows. */
  empoweredTechnique?: boolean | undefined;
  empowered_technique?: boolean | undefined;
  power?: Record<string, unknown> | undefined;
  technique?: Record<string, unknown> | undefined;
  totals?: { energy?: number | undefined; trainingPoints?: number | undefined } | undefined;
  /** Defenses this technique / empowered entry actually targets (if any). */
  targetedDefenses?: string[] | undefined;
}

export interface SavedProperty {
  id?: number | undefined;
  name?: string | undefined;
  op_1_lvl?: number | undefined;
}

export interface LibraryItem {
  id: string;
  docId: string;
  name: string;
  description?: string | undefined;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  properties: SavedProperty[];
  damage?: SavedDamage[] | undefined;
  isTwoHanded?: boolean | undefined;
  rangeLevel?: number | undefined;
  abilityRequirement?:
    | { id?: string | undefined; name?: string | undefined; level?: number | undefined }
    | undefined;
  damageReduction?: number | undefined;
  agilityReduction?: number | undefined;
  criticalRangeIncrease?: number | undefined;
  shieldDR?: { amount: number; size: number } | undefined;
  hasShieldDamage?: boolean | undefined;
  shieldDamage?: { amount: number; size: number } | undefined;
  costs?:
    | {
        totalTP?: number | undefined;
        totalCurrency?: number | undefined;
        totalIP?: number | undefined;
      }
    | undefined;
  rarity?: string | undefined;
  armorValue?: number | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  _source?: 'official' | string | undefined;
}

export interface LibrarySpecies {
  id: string;
  docId?: string | undefined;
  name: string;
  description?: string | undefined;
  type?: string | undefined;
  size?: string | undefined;
  sizes?: string[] | undefined;
  speed?: number | undefined;
  skills?: string[] | undefined;
  species_traits?: string[] | undefined;
  ancestry_traits?: string[] | undefined;
  flaws?: string[] | undefined;
  characteristics?: string[] | undefined;
  languages?: string[] | undefined;
  ave_height?: number | undefined;
  ave_weight?: number | undefined;
  adulthood_lifespan?: number[] | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  _source?: 'official' | string | undefined;
}

export interface LibraryCreature {
  id: string;
  docId: string;
  name: string;
  description?: string | undefined;
  level: number;
  type?: string | undefined;
  size?: string | undefined;
  hitPoints?: number | undefined;
  energyPoints?: number | undefined;
  abilities?: Record<string, number> | undefined;
  defenses?: Record<string, number> | undefined;
  powerProficiency?: number | undefined;
  martialProficiency?: number | undefined;
  resistances?: string[] | undefined;
  weaknesses?: string[] | undefined;
  immunities?: string[] | undefined;
  conditionImmunities?: string[] | undefined;
  senses?: string[] | undefined;
  movementTypes?: string[] | undefined;
  languages?: string[] | undefined;
  skills?: Array<{ name: string; value: number; proficient?: boolean | undefined }> | undefined;
  powers?: Array<{ name: string; description?: string | undefined }> | undefined;
  techniques?: Array<{ name: string; description?: string | undefined }> | undefined;
  feats?: Array<{ name: string; description?: string | undefined }> | undefined;
  weapons?:
    | Array<{ name: string; type?: string | undefined; quantity?: number | undefined }>
    | undefined;
  armor?:
    | Array<{ name: string; type?: string | undefined; quantity?: number | undefined }>
    | undefined;
  shields?:
    | Array<{ name: string; type?: string | undefined; quantity?: number | undefined }>
    | undefined;
  equipment?:
    | Array<{ name: string; type?: string | undefined; quantity?: number | undefined }>
    | undefined;
  /** Legacy mixed bag. Prefer kind buckets. */
  armaments?:
    | Array<{ name: string; type?: string | undefined; quantity?: number | undefined }>
    | undefined;
  hp?: number | undefined;
  attacks?: unknown[] | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  _source?: 'official' | string | undefined;
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
