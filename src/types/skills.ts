/**
 * Skill Types
 * ============
 * Skill definitions and categories
 */

/** Skills object on character */
export interface CharacterSkills {
  [skillId: string]: number; // skillId -> ranks
}

/** Lean skill row persisted on sheet / creator (array format). */
export interface CharacterSkillRow {
  id: string | number;
  name?: string | undefined;
  skill_val?: number | undefined;
  prof?: boolean | undefined;
  ability?: string | undefined;
  availableAbilities?: string[] | undefined;
  category?: string | undefined;
  baseSkillId?: number | undefined;
  selectedBaseSkillId?: string | undefined;
  baseSkill?: string | undefined;
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
