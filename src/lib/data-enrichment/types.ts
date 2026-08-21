import type { CharacterPower, CharacterTechnique } from '@/types';
import type { UserPower, UserTechnique, UserItem, SavedDamage } from '@/hooks/use-user-library';

/** Enriched power with full data from user's library */
export interface EnrichedPower extends CharacterPower {
  // Display fields from library
  description: string;
  cost?: number | undefined; // Energy cost of the power
  actionType?: string | undefined;
  area?: string | undefined;
  duration?: string | undefined;
  damageStr?: string | undefined;
  range?: string | number | undefined;
  targets?: string | undefined;
  // Full parts data for display
  displayParts?:
    | Array<{
        name: string;
        description?: string | undefined;
        base_en?: number | undefined;
        base_tp?: number | undefined;
      }>
    | undefined;
  // Original library item for reference
  libraryItem?: UserPower | undefined;
  // Innate power flag
  innate?: boolean | undefined;
  // Flag if not found in library
  notInLibrary?: boolean | undefined;
}

/** Enriched technique with full data from user's library */
export interface EnrichedTechnique extends CharacterTechnique {
  // Display fields from library
  description: string;
  cost?: number | undefined; // Energy cost of the technique
  tp?: number | undefined; // Training points cost of the technique
  actionType?: string | undefined;
  weaponName?: string | undefined;
  damageStr?: string | undefined;
  // Full parts data for display
  displayParts?:
    | Array<{
        name: string;
        description?: string | undefined;
        base_tp?: number | undefined;
      }>
    | undefined;
  // Original library item for reference
  libraryItem?: UserTechnique | undefined;
  // Flag if not found in library
  notInLibrary?: boolean | undefined;
}

/** Enriched item/armament with full data from user's library */
export interface EnrichedItem {
  id: string;
  name: string;
  description?: string | undefined;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  equipped?: boolean | undefined;
  quantity?: number | undefined;
  // Display fields
  damage?: string | SavedDamage[] | undefined;
  range?: string | undefined;
  armorValue?: number | undefined;
  armor?: number | undefined;
  properties?: string[] | undefined;
  displayProperties?:
    | Array<{
        name: string;
        description?: string | undefined;
      }>
    | undefined;
  // Armor-specific fields
  critRange?: number | undefined;
  agilityReduction?: number | undefined;
  abilityRequirement?:
    | {
        name?: string | undefined;
        level?: number | undefined;
      }
    | undefined;
  // Shield-specific (block amount and optional damage)
  shieldAmount?: string | undefined;
  shieldDamage?: string | null | undefined;
  // Original library item for reference
  libraryItem?: UserItem | undefined;
  // Flag if not found in library
  notInLibrary?: boolean | undefined;
}

/**
 * Codex Equipment Item interface (for equipment lookup)
 */
export interface CodexEquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  subtype?: string | undefined;
  category?: string | undefined;
  description: string;
  damage?: string | undefined;
  armor_value?: number | undefined;
  gold_cost?: number | undefined;
  currency?: number | undefined;
  properties?: string[] | undefined;
  rarity?: string | undefined;
  weight?: number | undefined;
}

/**
 * Enrich all character data at once
 * Returns enriched data alongside the original character
 */
export interface EnrichedCharacterData {
  powers: EnrichedPower[];
  techniques: EnrichedTechnique[];
  weapons: EnrichedItem[];
  shields: EnrichedItem[];
  armor: EnrichedItem[];
  equipment: EnrichedItem[];
}
