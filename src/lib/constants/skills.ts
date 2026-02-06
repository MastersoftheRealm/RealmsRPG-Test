/**
 * Skill Constants
 * ===============
 * Shared constants for skill-related functionality across the app.
 * Used by: SkillRow, add-skill-modal, add-sub-skill-modal, skills-section
 */

/** Ability name to abbreviation mapping */
export const ABILITY_ABBR: Record<string, string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

/** Ability options with abbreviations (for compact displays like tables) */
export const ABILITY_OPTIONS = [
  { value: 'strength', label: 'STR' },
  { value: 'vitality', label: 'VIT' },
  { value: 'agility', label: 'AGI' },
  { value: 'acuity', label: 'ACU' },
  { value: 'intelligence', label: 'INT' },
  { value: 'charisma', label: 'CHA' },
] as const;

/** Ability options with full names (for filter dropdowns) */
export const ABILITY_FILTER_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'agility', label: 'Agility' },
  { value: 'acuity', label: 'Acuity' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'charisma', label: 'Charisma' },
] as const;

/** Type for ability option values */
export type AbilityValue = typeof ABILITY_OPTIONS[number]['value'];

