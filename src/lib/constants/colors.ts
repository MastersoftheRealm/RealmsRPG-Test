/**
 * Category Colors Constants
 * ==========================
 * Centralized color definitions for content categories (action, activation, etc.)
 * These are used by chip components and item displays across the codebase.
 * 
 * All colors are also defined as CSS custom properties in globals.css
 * for use with utility classes (e.g., chip-action, chip-activation).
 */

export type CategoryType = 
  | 'action'
  | 'activation'
  | 'area'
  | 'duration'
  | 'target'
  | 'special'
  | 'restriction'
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'feat'
  | 'proficiency'
  | 'weakness'
  | 'power'
  | 'technique'
  | 'equipment';

export interface CategoryColors {
  bg: string;
  text: string;
  border: string;
}

/**
 * Category color mappings - matches globals.css custom properties
 * Use these when you need dynamic styling, otherwise prefer CSS classes
 */
export const CATEGORY_COLORS: Record<CategoryType, CategoryColors> = {
  // Part/property categories
  action: {
    bg: 'bg-category-action',
    text: 'text-category-action-text',
    border: 'border-category-action-border',
  },
  activation: {
    bg: 'bg-category-activation',
    text: 'text-category-activation-text',
    border: 'border-category-activation-border',
  },
  area: {
    bg: 'bg-category-area',
    text: 'text-category-area-text',
    border: 'border-category-area-border',
  },
  duration: {
    bg: 'bg-category-duration',
    text: 'text-category-duration-text',
    border: 'border-category-duration-border',
  },
  target: {
    bg: 'bg-category-target',
    text: 'text-category-target-text',
    border: 'border-category-target-border',
  },
  special: {
    bg: 'bg-category-special',
    text: 'text-category-special-text',
    border: 'border-category-special-border',
  },
  restriction: {
    bg: 'bg-category-restriction',
    text: 'text-category-restriction-text',
    border: 'border-category-restriction-border',
  },
  
  // Equipment categories
  weapon: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    border: 'border-warning-300',
  },
  armor: {
    bg: 'bg-info-100',
    text: 'text-info-800',
    border: 'border-info-300',
  },
  shield: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-300',
  },
  
  // Character content categories
  feat: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-300',
  },
  proficiency: {
    bg: 'bg-info-50',
    text: 'text-primary-600',
    border: 'border-info-200',
  },
  weakness: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-300',
  },
  power: {
    bg: 'bg-power-light',
    text: 'text-power-text',
    border: 'border-power-border',
  },
  technique: {
    bg: 'bg-martial-light',
    text: 'text-martial-text',
    border: 'border-martial-border',
  },
  equipment: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-300',
  },
};

/**
 * Get the combined class string for a category
 */
export function getCategoryClasses(category: CategoryType): string {
  const colors = CATEGORY_COLORS[category];
  if (!colors) {
    return 'bg-neutral-100 text-neutral-700 border-neutral-300';
  }
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

/**
 * Badge color mappings for status indicators
 */
export const BADGE_COLORS = {
  blue: 'bg-info-100 text-info-800',
  purple: 'bg-power-light text-power-text',
  green: 'bg-success-100 text-success-700',
  yellow: 'bg-warning-100 text-warning-800',
  red: 'bg-danger-100 text-danger-700',
  gray: 'bg-neutral-100 text-neutral-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
  indigo: 'bg-indigo-100 text-indigo-800',
  pink: 'bg-pink-100 text-pink-800',
} as const;

export type BadgeColor = keyof typeof BADGE_COLORS;

/**
 * Roll type colors for dice roller
 */
export const ROLL_TYPE_COLORS = {
  attack: 'border-l-danger-500',
  damage: 'border-l-warning-500',
  skill: 'border-l-info-500',
  save: 'border-l-power',
  healing: 'border-l-success-500',
  initiative: 'border-l-orange-500',
  custom: 'border-l-neutral-500',
} as const;

export type RollType = keyof typeof ROLL_TYPE_COLORS;
