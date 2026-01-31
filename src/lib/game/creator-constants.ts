/**
 * Creator Constants
 * =================
 * Shared constants used across Power, Technique, Item, and Creature creators.
 * Centralizes commonly used values to avoid duplication.
 */

// =============================================================================
// Action Types
// =============================================================================

export const ACTION_OPTIONS = [
  { value: 'basic', label: 'Basic Action' },
  { value: 'quick', label: 'Quick Action' },
  { value: 'free', label: 'Free Action' },
  { value: 'long3', label: 'Long Action (3 AP)' },
  { value: 'long4', label: 'Long Action (4 AP)' },
] as const;

export type ActionType = typeof ACTION_OPTIONS[number]['value'];

// =============================================================================
// Damage Configuration
// =============================================================================

/** Die sizes available for damage dice (d4, d6, d8, d10, d12) */
export const DIE_SIZES = [4, 6, 8, 10, 12] as const;
export type DieSize = typeof DIE_SIZES[number];

/** Physical damage types (used by techniques, weapons) */
export const PHYSICAL_DAMAGE_TYPES = [
  'none',
  'physical',
  'slashing',
  'piercing',
  'bludgeoning',
] as const;

/** Magic damage types (used by powers) */
export const MAGIC_DAMAGE_TYPES = [
  'none',
  'magic',
  'fire',
  'cold',
  'lightning',
  'necrotic',
  'radiant',
  'psychic',
  'poison',
  'sonic',
] as const;

/** All damage types (used by creatures and items with mixed damage) */
export const ALL_DAMAGE_TYPES = [
  'none',
  'physical',
  'slashing',
  'piercing',
  'bludgeoning',
  'magic',
  'fire',
  'cold',
  'lightning',
  'acid',
  'poison',
  'necrotic',
  'radiant',
  'psychic',
  'sonic',
] as const;

export type DamageType = typeof ALL_DAMAGE_TYPES[number];

// =============================================================================
// Area of Effect
// =============================================================================

export const AREA_TYPES = [
  { value: 'none', label: 'None (Single Space)' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'cone', label: 'Cone' },
  { value: 'line', label: 'Line' },
  { value: 'trail', label: 'Trail' },
] as const;

export type AreaType = typeof AREA_TYPES[number]['value'];

// =============================================================================
// Duration
// =============================================================================

export const DURATION_TYPES = [
  { value: 'instant', label: 'Instant' },
  { value: 'rounds', label: 'Rounds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'permanent', label: 'Permanent' },
] as const;

export type DurationType = typeof DURATION_TYPES[number]['value'];

/** Duration value intervals per type (matching vanilla site) */
export const DURATION_VALUES: Record<string, { value: number; label: string }[]> = {
  rounds: [
    { value: 1, label: '1 round' },
    { value: 2, label: '2 rounds' },
    { value: 3, label: '3 rounds' },
    { value: 4, label: '4 rounds' },
    { value: 5, label: '5 rounds' },
    { value: 6, label: '6 rounds' },
  ],
  minutes: [
    { value: 1, label: '1 minute' },
    { value: 10, label: '10 minutes' },
    { value: 30, label: '30 minutes' },
  ],
  hours: [
    { value: 1, label: '1 hour' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
  ],
  days: [
    { value: 1, label: '1 day' },
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
  ],
};

// =============================================================================
// Rarity
// =============================================================================

export const RARITY_COLORS: Record<string, string> = {
  Common: 'text-text-secondary bg-neutral-100',
  Uncommon: 'text-green-600 bg-green-100',
  Rare: 'text-blue-600 bg-blue-100',
  Epic: 'text-purple-600 bg-purple-100',
  Legendary: 'text-amber-600 bg-amber-100',
  Mythic: 'text-red-600 bg-red-100',
  Ascended: 'text-pink-600 bg-pink-100',
};

// =============================================================================
// Category Colors (for Power Parts)
// =============================================================================

export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; hoverBg: string; buttonBg: string; buttonHover: string }> = {
  'Action': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', hoverBg: 'hover:bg-blue-200', buttonBg: 'bg-blue-600', buttonHover: 'hover:bg-blue-700' },
  'Activation': { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', hoverBg: 'hover:bg-teal-200', buttonBg: 'bg-teal-600', buttonHover: 'hover:bg-teal-700' },
  'Area of Effect': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', hoverBg: 'hover:bg-green-200', buttonBg: 'bg-green-600', buttonHover: 'hover:bg-green-700' },
  'Duration': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', hoverBg: 'hover:bg-purple-200', buttonBg: 'bg-purple-600', buttonHover: 'hover:bg-purple-700' },
  'Target': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', hoverBg: 'hover:bg-orange-200', buttonBg: 'bg-orange-600', buttonHover: 'hover:bg-orange-700' },
  'Special': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', hoverBg: 'hover:bg-amber-200', buttonBg: 'bg-amber-600', buttonHover: 'hover:bg-amber-700' },
  'Restriction': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', hoverBg: 'hover:bg-red-200', buttonBg: 'bg-red-600', buttonHover: 'hover:bg-red-700' },
};

// =============================================================================
// Creature Types & Sizes
// =============================================================================

export const CREATURE_TYPES = [
  'Beast', 'Humanoid', 'Undead', 'Construct', 'Elemental',
  'Aberration', 'Dragon', 'Fiend', 'Celestial', 'Fey', 'Plant', 'Ooze', 'Other',
] as const;

export type CreatureType = typeof CREATURE_TYPES[number];

export const CREATURE_SIZES = [
  { value: 'tiny', label: 'Tiny', modifier: -2 },
  { value: 'small', label: 'Small', modifier: -1 },
  { value: 'medium', label: 'Medium', modifier: 0 },
  { value: 'large', label: 'Large', modifier: 1 },
  { value: 'huge', label: 'Huge', modifier: 2 },
  { value: 'gargantuan', label: 'Gargantuan', modifier: 3 },
] as const;

export type CreatureSize = typeof CREATURE_SIZES[number]['value'];

// =============================================================================
// Conditions
// =============================================================================

export const CONDITIONS = [
  'Bleeding', 'Blinded', 'Charmed', 'Restrained', 'Dazed', 'Deafened',
  'Dying', 'Exhausted', 'Exposed', 'Faint', 'Frightened', 'Grappled',
  'Hidden', 'Immobile', 'Invisible', 'Prone', 'Resilient', 'Slowed',
  'Stunned', 'Susceptible', 'Terminal', 'Weakened',
] as const;

export type Condition = typeof CONDITIONS[number];

// =============================================================================
// Skills
// =============================================================================

export const SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
] as const;

export type Skill = typeof SKILLS[number];

// =============================================================================
// LocalStorage Cache Keys
// =============================================================================

export const CREATOR_CACHE_KEYS = {
  POWER: 'realms-power-creator-cache',
  TECHNIQUE: 'realms-technique-creator-cache',
  ITEM: 'realms-item-creator-cache',
  CREATURE: 'realms-creature-creator-cache',
} as const;

/** Cache expiry time in milliseconds (30 days) */
export const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format a cost value to its minimum necessary decimal places.
 * Examples: 5.0 → "5", 1.30 → "1.3", 1.25 → "1.25", 0.125 → "0.125"
 * For percentages, shows as-is. For regular costs, strips trailing zeros.
 */
export function formatCost(value: number, isPercentage = false): string {
  if (isPercentage) {
    return value.toString();
  }
  // Check if it's an integer
  if (Number.isInteger(value)) {
    return Math.floor(value).toString();
  }
  // Round to 3 decimal places to avoid floating point issues
  const rounded = Math.round(value * 1000) / 1000;
  // Convert to string and remove trailing zeros after decimal
  return rounded.toString();
}

/**
 * Format a cost with a label (e.g., "EN: 5" or "TP: 10")
 */
export function formatCostWithLabel(label: string, value: number, isPercentage = false): string {
  return `${label}: ${formatCost(value, isPercentage)}`;
}

// =============================================================================
// Default Damage Configurations
// =============================================================================

export interface DamageConfig {
  amount: number;
  size: DieSize | number;
  type: string;
  applyDuration?: boolean;
}

export const DEFAULT_POWER_DAMAGE: DamageConfig = {
  amount: 0,
  size: 6,
  type: 'none',
};

export const DEFAULT_TECHNIQUE_DAMAGE: DamageConfig = {
  amount: 0,
  size: 6,
  type: 'none',
};

export const DEFAULT_WEAPON_DAMAGE: DamageConfig = {
  amount: 1,
  size: 4,
  type: 'slashing',
};
