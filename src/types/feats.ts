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
}
