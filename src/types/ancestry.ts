/**
 * Ancestry Types
 * ===============
 * Species and ancestry definitions
 */

/** Size categories */
export type SizeCategory = 
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'gargantuan';

/** An ancestry/species from the database */
export interface Ancestry {
  id: number | string;
  name: string;
  description?: string;
  size?: SizeCategory;
  speed?: number;
  traits?: AncestryTrait[];
  abilityBonuses?: Partial<Record<string, number>>;
  languages?: string[];
}

/** Ancestry trait */
export interface AncestryTrait {
  id: number | string;
  name: string;
  description?: string;
}

/** Character's selected ancestry data */
export interface CharacterAncestry {
  id: number | string;
  name: string;
  size?: SizeCategory;
  speed?: number;
  selectedTraits?: string[];
}
