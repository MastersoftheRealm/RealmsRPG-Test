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
