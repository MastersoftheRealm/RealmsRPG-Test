/**
 * Feat Types
 * ===========
 * Feat definitions for characters
 */

/** Feat categories */
export type FeatCategory = 
  | 'combat'
  | 'general'
  | 'skill'
  | 'heritage'
  | 'archetype';

/** A feat from the database */
export interface Feat {
  id: number | string;
  name: string;
  category?: FeatCategory;
  description?: string;
  prerequisites?: string[];
  benefits?: string[];
  level?: number; // Required level
  stackable?: boolean;
  // Additional fields from database
  ability?: string; // Associated ability
  rec_period?: string; // Recovery period
  uses_per_rec?: number; // Uses per recovery
  lvl_req?: number; // Level requirement
  ability_req?: string[]; // Ability requirements
  skill_req?: string[]; // Skill requirements
  tags?: string[]; // Tags/categories
}

/** Player-facing customization for a feat or trait (does not overwrite codex data). */
export interface FeatTraitCustomization {
  /** Display name override — shown in italics on the character sheet. */
  customName?: string;
  /** Player note — visible only in the expanded row. */
  note?: string;
}

/** Character's selected feat */
export interface CharacterFeat {
  id: number | string;
  name: string;
  description?: string;
  source?: 'character' | 'archetype' | 'ancestry';
  type?: 'character' | 'archetype';
  level?: number; // Level when taken
  stacks?: number; // Number of times stacked
  maxUses?: number; // Per-rest uses
  currentUses?: number; // Remaining uses
  recovery?: string; // Recovery period (e.g., 'Full Recovery', 'Short Rest')
  /** Player display name override (codex name unchanged). */
  customName?: string;
  /** Player note appended in expanded view only. */
  note?: string;
}
