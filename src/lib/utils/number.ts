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

/**
 * Format a number with thousands separators.
 */
export function formatNumber(value: number | string, locale: string = 'en-US'): string {
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0';
  return num.toLocaleString(locale);
}

/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to a specified number of decimal places.
 */
export function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate the percentage of a value relative to a total.
 */
export function percentage(value: number, total: number, decimals: number = 0): number {
  if (total === 0) return 0;
  return round((value / total) * 100, decimals);
}

/**
 * Convert centimeters to feet and inches.
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number; formatted: string } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches, formatted: `${feet}'${inches}"` };
}

/**
 * Convert kilograms to pounds.
 */
export function kgToLbs(kg: number): number {
  return round(kg * 2.20462, 1);
}

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return round(lbs / 2.20462, 1);
}

/**
 * Parse a string to number, returning default if invalid.
 */
export function parseNum(value: unknown, defaultValue: number = 0): number {
  const num = parseFloat(String(value));
  return isNaN(num) ? defaultValue : num;
}

/**
 * Parse a string to integer (base 10).
 */
export function parseInt10(value: unknown, defaultValue: number = 0): number {
  const num = parseInt(String(value), 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Check if a value is a valid number.
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Roll a dice with the specified number of sides.
 */
export function rollDice(sides: number, count: number = 1): number[] {
  return Array.from({ length: count }, () => randomInt(1, sides));
}

/**
 * Format dice notation (e.g., "2d6+3").
 */
export function formatDice(count: number, sides: number, modifier: number = 0): string {
  let result = `${count}d${sides}`;
  if (modifier > 0) result += `+${modifier}`;
  else if (modifier < 0) result += modifier;
  return result;
}

/**
 * Sum an array of numbers.
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Calculate the average of an array of numbers.
 */
export function average(numbers: number[], decimals: number = 2): number {
  if (numbers.length === 0) return 0;
  return round(sum(numbers) / numbers.length, decimals);
}

/**
 * Compute how to split a value across multiple targets.
 */
export function computeSplits(value: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(value / count);
  const remainder = value % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}
