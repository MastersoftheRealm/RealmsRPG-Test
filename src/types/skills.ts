/**
 * Skill Types
 * ============
 * Skill definitions and categories
 */

/** Skill categories */
export type SkillCategory = 
  | 'combat'
  | 'physical'
  | 'mental'
  | 'social'
  | 'knowledge'
  | 'craft';

/** A skill from the database */
export interface Skill {
  id: number | string;
  name: string;
  category?: SkillCategory;
  description?: string;
  ability?: string; // Associated ability
  untrained?: boolean; // Can be used untrained
}

/** Character's skill allocation */
export interface CharacterSkill {
  id: number | string;
  name: string;
  ranks: number;
  bonus?: number; // Calculated bonus
}

/** Skills object on character */
export interface CharacterSkills {
  [skillId: string]: number; // skillId -> ranks
}

/** Defense skill allocations */
export interface DefenseSkills {
  might: number;
  fortitude: number;
  reflex: number;
  discernment: number;
  mentalFortitude: number;
  resolve: number;
}

/** Default defense skills */
export const DEFAULT_DEFENSE_SKILLS: DefenseSkills = {
  might: 0,
  fortitude: 0,
  reflex: 0,
  discernment: 0,
  mentalFortitude: 0,
  resolve: 0,
};
