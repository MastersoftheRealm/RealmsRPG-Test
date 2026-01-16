/**
 * Ability Types
 * ==============
 * Core ability score types for characters and creatures
 */

/** The six core ability scores */
export type AbilityName = 
  | 'strength'
  | 'vitality'
  | 'agility'
  | 'acuity'
  | 'intelligence'
  | 'charisma';

/** Ability scores object */
export interface Abilities {
  strength: number;
  vitality: number;
  agility: number;
  acuity: number;
  intelligence: number;
  charisma: number;
}

/** Default ability scores */
export const DEFAULT_ABILITIES: Abilities = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

/** Defense types that map to abilities */
export type DefenseName =
  | 'might'       // strength
  | 'fortitude'   // vitality
  | 'reflex'      // agility
  | 'discernment' // acuity
  | 'mentalFortitude' // intelligence
  | 'resolve';    // charisma

/** Defense scores object */
export interface Defenses {
  might: number;
  fortitude: number;
  reflex: number;
  discernment: number;
  mentalFortitude: number;
  resolve: number;
}

/** Defense bonuses from skills/feats */
export interface DefenseBonuses {
  might: number;
  fortitude: number;
  reflex: number;
  discernment: number;
  mentalFortitude: number;
  resolve: number;
}
