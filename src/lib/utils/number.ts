/**
 * Number Utilities
 * =================
 * Centralized number formatting and manipulation functions
 */

/**
 * Format a number as a bonus string with + or - prefix.
 */
export function formatBonus(value: number | string): string {
  const num = parseInt(String(value), 10) || 0;
  return num >= 0 ? `+${num}` : `${num}`;
}
