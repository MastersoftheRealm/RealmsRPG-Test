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
  /** Selected ancestry traits (1-2 depending on flaw selection) */
  selectedTraits?: string[];
  /** Selected flaw ID (grants an extra ancestry trait) */
  selectedFlaw?: string | null;
  /** Selected characteristic ID */
  selectedCharacteristic?: string | null;
}
