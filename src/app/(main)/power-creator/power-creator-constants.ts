/**
 * Power Creator - Local Constants
 */

import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';

export const POWER_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.POWER;

export const ADVANCED_CATEGORIES = [
  'Action',
  'Activation',
  'Area of Effect',
  'Duration',
  'Target',
  'Special',
  'Restriction',
] as const;

export const EXCLUDED_PARTS = new Set([
  'Power Quick or Free Action',
  'Power Long Action',
  'Power Reaction',
  'Sphere of Effect',
  'Cylinder of Effect',
  'Cone of Effect',
  'Line of Effect',
  'Trail of Effect',
  'Magic Damage',
  'Light Damage',
  'Elemental Damage',
  'Poison or Necrotic Damage',
  'Sonic Damage',
  'Spiritual Damage',
  'Psychic Damage',
  'Physical Damage',
  'Duration (Round)',
  'Duration (Minute)',
  'Duration (Hour)',
  'Duration (Days)',
  'Duration (Permanent)',
  'Focus for Duration',
  'No Harm or Adaptation for Duration',
  'Duration Ends On Activation',
  'Sustain for Duration',
  'Power Range',
]);
