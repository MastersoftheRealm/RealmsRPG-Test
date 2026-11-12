/**
 * Creature Creator - Constants
 */

import { CREATOR_CACHE_KEYS, CREATURE_TYPES } from '@/lib/game/creator-constants';
import type { CreatureState } from './creature-creator-types';

export const CREATURE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.CREATURE;

export const CREATURE_TYPE_OPTIONS = CREATURE_TYPES.map((type) => ({ value: type, label: type }));

export const DAMAGE_TYPES = [
  'Bludgeoning',
  'Piercing',
  'Slashing',
  'Magic',
  'Fire',
  'Ice',
  'Lightning',
  'Spiritual',
  'Sonic',
  'Poison',
  'Necrotic',
  'Acid',
  'Psychic',
];

export const initialState: CreatureState = {
  name: '',
  level: 1,
  type: 'Humanoid',
  size: 'medium',
  description: '',
  imageId: null,
  imageUrl: null,
  archetypeType: 'power',
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  defenses: {
    might: 0,
    fortitude: 0,
    reflex: 0,
    discernment: 0,
    mentalFortitude: 0,
    resolve: 0,
  },
  hitPoints: 0,
  energyPoints: 0,
  powerProficiency: 2,
  martialProficiency: 0,
  enablePowers: false,
  enableTechniques: false,
  enableArmaments: false,
  resistances: [],
  weaknesses: [],
  immunities: [],
  conditionImmunities: [],
  senses: [],
  movementTypes: [],
  languages: [],
  skills: [],
  powers: [],
  techniques: [],
  feats: [],
  weapons: [],
  armor: [],
  shields: [],
  equipment: [],
};
