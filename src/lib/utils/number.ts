/**
 * Number Utilities
 * =================
 * Centralized number formatting and manipulation functions
 */

/** Grouped integer for sheet Currency and similar readouts (`en-US`). */
export function formatGroupedInteger(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format a number as a bonus string with + or - prefix.
 */
export function formatBonus(value: number | string): string {
  const num = parseInt(String(value), 10) || 0;
  return num >= 0 ? `+${num}` : `${num}`;
}

/** Speed display unit: 1 space = 5 feet = 1.5 meters */
export type SpeedDisplayUnit = 'spaces' | 'feet' | 'meters';

/**
 * Convert speed in spaces to display value and suffix for the chosen unit.
 * Used for character sheet speed display (editing stays in spaces).
 */
export function formatSpeedForDisplay(
  spaces: number,
  unit: SpeedDisplayUnit = 'spaces',
): { value: number | string; suffix: string } {
  switch (unit) {
    case 'feet':
      return { value: spaces * 5, suffix: 'ft' };
    case 'meters':
      return { value: spaces * 1.5, suffix: 'm' };
    default:
      return { value: spaces, suffix: 'sp' };
  }
}

/** Speed temp modifiers are always stored and stepped in spaces (ADR / DECISIONS). */
export const SPEED_TEMP_MODIFIER_STEP_SPACES = 1;

/** Label for speed temp stepper (always spaces, even when speed displays as ft/m). */
export function formatSpeedTempModifierDelta(
  deltaSpaces: number,
  deltaFormat: 'temp-label' | 'signed' = 'temp-label',
): string {
  const signed =
    deltaFormat === 'signed'
      ? deltaSpaces >= 0
        ? `+${deltaSpaces}`
        : String(deltaSpaces)
      : `Temp: ${deltaSpaces >= 0 ? `+${deltaSpaces}` : deltaSpaces}`;
  return `${signed} sp`;
}

/** Format speed as a single string (e.g. "6 sp", "60 ft", "9 m"). */
export function formatSpeedString(spaces: number, unit: SpeedDisplayUnit = 'spaces'): string {
  const { value, suffix } = formatSpeedForDisplay(spaces, unit);
  const displayValue =
    typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : String(value);
  return suffix ? `${displayValue} ${suffix}` : displayValue;
}
