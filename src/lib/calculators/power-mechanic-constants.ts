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

/** Creator-facing Advanced Calculations groups (energy only). */
export const POWER_CALC_SECTION_IDS = [
  'action',
  'attack',
  'range',
  'area',
  'duration',
  'damage',
  'parts',
  'mechanics',
] as const;

export type PowerCalcSectionId = (typeof POWER_CALC_SECTION_IDS)[number];

export const POWER_CALC_SECTION_TITLES: Record<PowerCalcSectionId, string> = {
  action: 'Action Type',
  attack: 'Attack',
  range: 'Range',
  area: 'Area of Effect',
  duration: 'Duration',
  damage: 'Damage',
  parts: 'Power Parts',
  mechanics: 'Mechanics',
};

/** Duration *type* parts: factor × 100 is the extra Energy percent (e.g. 0.75 → +75%). */
export const POWER_DURATION_TYPE_PART_NAMES = new Set([
  'Duration (Round)',
  'Duration (Minute)',
  'Duration (Hour)',
  'Duration (Days)',
  'Duration (Permanent)',
]);

/** Duration *modifier* parts: framed as a percent change of duration extra (e.g. 0.5 → -50%). */
export const POWER_DURATION_MODIFIER_PART_NAMES = new Set([
  'Focus for Duration',
  'No Harm or Adaptation for Duration',
  'Duration Ends On Activation',
  'Sustain for Duration',
]);

export const POWER_CALC_SECTION_BY_NAME: Record<string, PowerCalcSectionId> = {
  'Power Quick or Free Action': 'action',
  'Power Long Action': 'action',
  'Power Reaction': 'action',
  'Add Weapon to Power': 'attack',
  'Power Range': 'range',
  'Sphere of Effect': 'area',
  'Cylinder of Effect': 'area',
  'Cone of Effect': 'area',
  'Line of Effect': 'area',
  'Trail of Effect': 'area',
  'Duration (Round)': 'duration',
  'Duration (Minute)': 'duration',
  'Duration (Hour)': 'duration',
  'Duration (Days)': 'duration',
  'Duration (Permanent)': 'duration',
  'Focus for Duration': 'duration',
  'No Harm or Adaptation for Duration': 'duration',
  'Duration Ends On Activation': 'duration',
  'Sustain for Duration': 'duration',
  'Magic Damage': 'damage',
  'Light Damage': 'damage',
  'Elemental Damage': 'damage',
  'Poison or Necrotic Damage': 'damage',
  'Sonic Damage': 'damage',
  'Spiritual Damage': 'damage',
  'Psychic Damage': 'damage',
  'Physical Damage': 'damage',
  'Power Split Damage Dice': 'damage',
};
