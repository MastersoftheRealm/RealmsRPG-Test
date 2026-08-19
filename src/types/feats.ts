/**
 * Feat Types
 * ===========
 * Feat definitions for characters
 */

import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';

/** Feat categories */
export type FeatCategory = 'combat' | 'general' | 'skill' | 'heritage' | 'archetype';

/** A feat from the database */
interface FeatFields {
  id: number | string;
  name: string;
  category?: FeatCategory | undefined;
  description?: string | undefined;
  prerequisites?: string[] | undefined;
  benefits?: string[] | undefined;
  level?: number | undefined; // Required level
  stackable?: boolean | undefined;
  // Additional fields from database
  ability?: string | undefined; // Associated ability
  rec_period?: string | undefined; // Recovery period
  uses_per_rec?: number | undefined; // Uses per recovery
  lvl_req?: number | undefined; // Level requirement
  ability_req?: string[] | undefined; // Ability requirements
  skill_req?: string[] | undefined; // Skill requirements
  tags?: string[] | undefined; // Tags/categories
}

export type Feat = AllowUndefinedOptionals<FeatFields>;

/** Player-facing customization for a feat or trait (does not overwrite codex data). */
interface FeatTraitCustomizationFields {
  /** Display name override — shown in italics on the character sheet. */
  customName?: string | undefined;
  /** Player note — visible only in the expanded row. */
  note?: string | undefined;
}

export type FeatTraitCustomization = AllowUndefinedOptionals<FeatTraitCustomizationFields>;

/** Character's selected feat */
interface CharacterFeatFields {
  id: number | string;
  name: string;
  description?: string | undefined;
  source?: 'character' | 'archetype' | 'ancestry' | undefined;
  type?: 'character' | 'archetype' | undefined;
  level?: number | undefined; // Level when taken
  stacks?: number | undefined; // Number of times stacked
  maxUses?: number | undefined; // Per-rest uses
  currentUses?: number | undefined; // Remaining uses
  recovery?: string | undefined; // Recovery period (e.g., 'Full Recovery', 'Short Rest')
  /** Player display name override (codex name unchanged). */
  customName?: string | undefined;
  /** Player note appended in expanded view only. */
  note?: string | undefined;
}

export type CharacterFeat = AllowUndefinedOptionals<CharacterFeatFields>;
