/**
 * Creature Creator - Shared Types
 */

import type { ArchetypeType } from '@/components/creator';
import type { CreaturePower, CreatureTechnique, CreatureFeat, CreatureArmament } from './transformers';

export interface CreatureSkill {
  name: string;
  value: number;
  proficient: boolean;
}

export interface CreatureState {
  name: string;
  level: number;
  type: string;
  size: string;
  description: string;
  archetypeType: ArchetypeType;
  abilities: {
    strength: number;
    vitality: number;
    agility: number;
    acuity: number;
    intelligence: number;
    charisma: number;
  };
  defenses: {
    might: number;
    fortitude: number;
    reflex: number;
    discernment: number;
    mentalFortitude: number;
    resolve: number;
  };
  hitPoints: number;
  energyPoints: number;
  powerProficiency: number;
  martialProficiency: number;
  resistances: string[];
  weaknesses: string[];
  immunities: string[];
  conditionImmunities: string[];
  senses: string[];
  movementTypes: string[];
  languages: string[];
  skills: CreatureSkill[];
  powers: CreaturePower[];
  techniques: CreatureTechnique[];
  feats: CreatureFeat[];
  armaments: CreatureArmament[];
  enablePowers: boolean;
  enableTechniques: boolean;
  enableArmaments: boolean;
}
