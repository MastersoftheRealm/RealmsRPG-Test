/**
 * Ancestry Types
 * ===============
 * Species and ancestry definitions
 */

import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';

/** Size categories */
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

/** An ancestry/species from the database */
interface AncestryFields {
  id: number | string;
  name: string;
  description?: string | undefined;
  size?: SizeCategory | undefined;
  speed?: number | undefined;
  traits?: AncestryTrait[] | undefined;
  abilityBonuses?: Partial<Record<string, number>> | undefined;
  languages?: string[] | undefined;
}

export type Ancestry = AllowUndefinedOptionals<AncestryFields>;

/** Ancestry trait */
interface AncestryTraitFields {
  id: number | string;
  name: string;
  description?: string | undefined;
}

export type AncestryTrait = AllowUndefinedOptionals<AncestryTraitFields>;

/** Character's selected ancestry data */
interface CharacterAncestryFields {
  id: number | string;
  name: string;
  size?: SizeCategory | undefined;
  speed?: number | undefined;
  /** Selected ancestry traits (1-2 depending on flaw selection) */
  selectedTraits?: string[] | undefined;
  /** Selected flaw ID (grants an extra ancestry trait) */
  selectedFlaw?: string | null | undefined;
  /** Selected characteristic ID */
  selectedCharacteristic?: string | null | undefined;
  /** True when character is mixed (two species) */
  mixed?: boolean | undefined;
  /** For mixed: [speciesAId, speciesBId] */
  speciesIds?: [string, string] | undefined;
  /** For mixed: [speciesAName, speciesBName] */
  speciesNames?: [string, string] | undefined;
  /** For mixed: chosen size from combined unique sizes */
  selectedSize?: string | undefined;
  /** For mixed: [speciesTraitIdFromA, speciesTraitIdFromB] — one from each species */
  selectedSpeciesTraits?: [string, string] | undefined;
  /** For mixed: species id that the selected flaw comes from (extra ancestry trait must be from same) */
  selectedFlawSpeciesId?: string | null | undefined;
  /** For mixed: averaged physical (height, weight, adulthood, maxAge) for display/save */
  mixedPhysical?:
    | {
        aveHeight?: number | undefined;
        aveWeight?: number | undefined;
        adulthood?: number | undefined;
        maxAge?: number | undefined;
      }
    | undefined;
  /** For mixed: exactly 2 skill IDs the player chose from the combined species skills (not all 4) */
  selectedSpeciesSkillIds?: string[] | undefined;
  /**
   * Single-species: parent species trait id → chosen option trait id for traits with `option_trait_ids`.
   * (Mixed species stores the resolved id per slot on `selectedSpeciesTraits` instead.)
   */
  selectedSpeciesTraitChoices?: Record<string, string> | undefined;
}

export type CharacterAncestry = AllowUndefinedOptionals<CharacterAncestryFields>;
