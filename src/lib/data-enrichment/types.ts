import type { CharacterPower, CharacterTechnique } from '@/types';
import type { UserPower, UserTechnique, UserItem, SavedDamage } from '@/hooks/use-user-library';

/** Enriched power with full data from user's library */
export interface EnrichedPower extends CharacterPower {
  // Display fields from library
  description: string;
  cost?: number; // Energy cost of the power
  actionType?: string;
  area?: string;
  duration?: string;
  damageStr?: string;
  range?: string | number;
  targets?: string;
  // Full parts data for display
  displayParts?: Array<{
    name: string;
    description?: string;
    base_en?: number;
    base_tp?: number;
  }>;
  // Original library item for reference
  libraryItem?: UserPower;
  // Innate power flag
  innate?: boolean;
  // Flag if not found in library
  notInLibrary?: boolean;
}

/** Enriched technique with full data from user's library */
export interface EnrichedTechnique extends CharacterTechnique {
  // Display fields from library
  description: string;
  cost?: number; // Energy cost of the technique
  tp?: number; // Training points cost of the technique
  actionType?: string;
  weaponName?: string;
  damageStr?: string;
  // Full parts data for display
  displayParts?: Array<{
    name: string;
    description?: string;
    base_tp?: number;
  }>;
  // Original library item for reference
  libraryItem?: UserTechnique;
  // Flag if not found in library
  notInLibrary?: boolean;
}

/** Enriched item/armament with full data from user's library */
export interface EnrichedItem {
  id: string;
  name: string;
  description?: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  equipped?: boolean;
  quantity?: number;
  // Display fields
  damage?: string | SavedDamage[];
  range?: string;
  armorValue?: number;
  armor?: number;
  properties?: string[];
  displayProperties?: Array<{
    name: string;
    description?: string;
  }>;
  // Armor-specific fields
  critRange?: number;
  agilityReduction?: number;
  abilityRequirement?: {
    name?: string;
    level?: number;
  };
  // Shield-specific (block amount and optional damage)
  shieldAmount?: string;
  shieldDamage?: string | null;
  // Original library item for reference
  libraryItem?: UserItem;
  // Flag if not found in library
  notInLibrary?: boolean;
}

/**
 * Codex Equipment Item interface (for equipment lookup)
 */
export interface CodexEquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment' | 'shield';
  subtype?: string;
  category?: string;
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost?: number;
  currency?: number;
  properties?: string[];
  rarity?: string;
  weight?: number;
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
