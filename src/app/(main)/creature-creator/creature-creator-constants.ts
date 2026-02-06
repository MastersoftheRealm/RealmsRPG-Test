/**
 * Creature Creator - Constants
 */

import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { CREATURE_TYPES } from '@/lib/game/creator-constants';
import type { CreatureState } from './creature-creator-types';

export const CREATURE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.CREATURE;

export const LEVEL_OPTIONS = [
  { value: '0.25', label: '1/4' },
  { value: '0.5', label: '1/2' },
  { value: '0.75', label: '3/4' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

export const CREATURE_TYPE_OPTIONS = CREATURE_TYPES.map(type => ({ value: type, label: type }));

export const DAMAGE_TYPES = [
  'Bludgeoning', 'Piercing', 'Slashing', 'Magic', 'Fire', 'Ice',
  'Lightning', 'Spiritual', 'Sonic', 'Poison', 'Necrotic', 'Acid', 'Psychic'
];

export const SENSES = [
  { value: 'Darkvision', label: 'Darkvision (6 spaces)', description: 'See in darkness up to 6 spaces as if it were dim light.' },
  { value: 'Darkvision II', label: 'Darkvision II (12 spaces)', description: 'See in darkness up to 12 spaces as if it were dim light.' },
  { value: 'Darkvision III', label: 'Darkvision III (24 spaces)', description: 'See in darkness up to 24 spaces as if it were dim light.' },
  { value: 'Blindsense', label: 'Blindsense (3 spaces)', description: 'Detect creatures within 3 spaces without relying on sight.' },
  { value: 'Blindsense II', label: 'Blindsense II (6 spaces)', description: 'Detect creatures within 6 spaces without relying on sight.' },
  { value: 'Blindsense III', label: 'Blindsense III (12 spaces)', description: 'Detect creatures within 12 spaces without relying on sight.' },
  { value: 'Amphibious', label: 'Amphibious', description: 'Can breathe air and water.' },
  { value: 'All-Surface Climber', label: 'All-Surface Climber', description: 'Can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.' },
  { value: 'Telepathy', label: 'Telepathy (12 spaces)', description: 'Mentally communicate with creatures within 12 spaces.' },
  { value: 'Telepathy II', label: 'Telepathy II (48 spaces)', description: 'Mentally communicate with creatures within 48 spaces.' },
  { value: 'Waterbreathing', label: 'Waterbreathing', description: 'Can breathe underwater.' },
  { value: 'Unrestrained Movement', label: 'Unrestrained Movement', description: 'Movement is unaffected by difficult terrain, and spells and magical effects can neither reduce speed nor cause paralysis or restraint.' },
];

export const MOVEMENT_TYPES = [
  { value: 'Fly Half', label: 'Flying (Half Speed)', description: 'Gains a flying speed equal to half its walking speed.' },
  { value: 'Fly', label: 'Flying II (Full Speed)', description: 'Gains a flying speed equal to its walking speed.' },
  { value: 'Burrow', label: 'Burrow (Half Speed)', description: 'Gains a burrowing speed equal to half its walking speed.' },
  { value: 'Burrow II', label: 'Burrow II (Full Speed)', description: 'Gains a burrowing speed equal to its walking speed.' },
  { value: 'Jump', label: 'Jump (Long 3, High 2)', description: 'Long jump of 3 spaces and high jump of 2 spaces, with or without a running start.' },
  { value: 'Jump II', label: 'Jump II (Long 4, High 3)', description: 'Long jump of 4 spaces and high jump of 3 spaces, with or without a running start.' },
  { value: 'Jump III', label: 'Jump III (Long 5, High 4)', description: 'Long jump of 5 spaces and high jump of 4 spaces, with or without a running start.' },
  { value: 'Speedy', label: 'Speedy (+2 spaces)', description: 'Walking speed is increased by 2 spaces.' },
  { value: 'Speedy II', label: 'Speedy II (+4 spaces)', description: 'Walking speed is increased by 4 spaces.' },
  { value: 'Speedy III', label: 'Speedy III (+6 spaces)', description: 'Walking speed is increased by 6 spaces.' },
  { value: 'Slow', label: 'Slow (-2 spaces)', description: 'Walking speed is reduced by 2 spaces.' },
  { value: 'Hover', label: 'Hover', description: 'Can remain in the air without expending movement (requires a flying speed).' },
];

export const SENSE_TO_FEAT_ID: Record<string, number> = {
  'Darkvision': CREATURE_FEAT_IDS.DARKVISION,
  'Darkvision II': CREATURE_FEAT_IDS.DARKVISION_II,
  'Darkvision III': CREATURE_FEAT_IDS.DARKVISION_III,
  'Blindsense': CREATURE_FEAT_IDS.BLINDSENSE,
  'Blindsense II': CREATURE_FEAT_IDS.BLINDSENSE_II,
  'Blindsense III': CREATURE_FEAT_IDS.BLINDSENSE_III,
  'Amphibious': CREATURE_FEAT_IDS.AMPHIBIOUS,
  'All-Surface Climber': CREATURE_FEAT_IDS.ALL_SURFACE_CLIMBER,
  'Telepathy': CREATURE_FEAT_IDS.TELEPATHY,
  'Telepathy II': CREATURE_FEAT_IDS.TELEPATHY_II,
  'Waterbreathing': CREATURE_FEAT_IDS.WATERBREATHING,
  'Unrestrained Movement': CREATURE_FEAT_IDS.UNRESTRAINED_MOVEMENT,
};

export const MOVEMENT_TO_FEAT_ID: Record<string, number> = {
  'Fly Half': CREATURE_FEAT_IDS.FLYING,
  'Fly': CREATURE_FEAT_IDS.FLYING_II,
  'Burrow': CREATURE_FEAT_IDS.BURROW,
  'Burrow II': CREATURE_FEAT_IDS.BURROW_II,
  'Jump': CREATURE_FEAT_IDS.JUMP,
  'Jump II': CREATURE_FEAT_IDS.JUMP_II,
  'Jump III': CREATURE_FEAT_IDS.JUMP_III,
  'Speedy': CREATURE_FEAT_IDS.SPEEDY,
  'Speedy II': CREATURE_FEAT_IDS.SPEEDY_II,
  'Speedy III': CREATURE_FEAT_IDS.SPEEDY_III,
  'Slow': CREATURE_FEAT_IDS.SLOW,
  'Hover': CREATURE_FEAT_IDS.HOVER,
};

export const initialState: CreatureState = {
  name: '',
  level: 1,
  type: 'Humanoid',
  size: 'medium',
  description: '',
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
  armaments: [],
};
