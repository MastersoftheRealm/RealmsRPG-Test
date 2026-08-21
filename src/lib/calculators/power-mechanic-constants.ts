/**
 * Shared power auto-mechanic constants (creator load/save + cost derivation).
 */

export const POWER_ADVANCED_MECHANIC_CATEGORIES = [
  'Action',
  'Activation',
  'Area of Effect',
  'Duration',
  'Target',
  'Special',
  'Restriction',
] as const;

export type PowerAdvancedMechanicCategory = (typeof POWER_ADVANCED_MECHANIC_CATEGORIES)[number];

export const POWER_ADVANCED_MECHANIC_CATEGORY_SET = new Set<string>(
  POWER_ADVANCED_MECHANIC_CATEGORIES,
);

/** Auto-derived mechanic parts rebuilt from action/damage/range/area/duration fields. */
export const POWER_AUTO_MECHANIC_PART_NAMES = new Set([
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
  'Power Split Damage Dice',
  'Add Weapon to Power',
]);
