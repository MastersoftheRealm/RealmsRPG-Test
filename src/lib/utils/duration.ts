/**
 * Duration display formatting
 * ===========================
 * Shared logic for displaying duration (value + unit) with proper pluralization
 * everywhere: character sheet, library, codex, power/technique display.
 */

/** Normalize duration type to canonical form (rounds, minutes, hours, days, permanent, instant) */
function normalizeDurationType(type: string): string {
  const t = (type || '').toLowerCase().trim();
  if (t === 'round' || t === 'rounds') return 'rounds';
  if (t === 'minute' || t === 'minutes') return 'minutes';
  if (t === 'hour' || t === 'hours') return 'hours';
  if (t === 'day' || t === 'days') return 'days';
  if (t === 'permanent') return 'permanent';
  if (t === 'instant' || t === 'instantaneous') return 'instant';
  return t;
}

/**
 * Format duration for display: value + unit with proper pluralization.
 * Examples: "1 Minute", "10 Minutes", "2 Rounds", "1 Hour", "6 Hours", "Permanent", "Instant".
 * Use wherever duration is shown (character sheet, library, codex, power/technique cards).
 */
export function formatDurationFromTypeAndValue(
  type: string,
  value: number
): string {
  const norm = normalizeDurationType(type);
  const val = typeof value === 'number' && !Number.isNaN(value) ? Math.max(0, value) : 1;

  if (norm === 'instant') return 'Instant';
  if (norm === 'permanent') return 'Permanent';

  if (norm === 'rounds') {
    const n = val < 1 ? 1 : val;
    return n === 1 ? '1 Round' : `${n} Rounds`;
  }
  if (norm === 'minutes') {
    const n = val < 1 ? 1 : val;
    return n === 1 ? '1 Minute' : `${n} Minutes`;
  }
  if (norm === 'hours') {
    const n = val < 1 ? 1 : val;
    return n === 1 ? '1 Hour' : `${n} Hours`;
  }
  if (norm === 'days') {
    const n = val < 1 ? 1 : val;
    return n === 1 ? '1 Day' : `${n} Days`;
  }

  return type || 'Instant';
}

/**
 * Format duration with optional modifiers (Focus, Sustain) for full display.
 * Base string is from formatDurationFromTypeAndValue; modifiers are appended.
 */
export function formatDurationWithModifiers(
  type: string,
  value: number,
  modifiers?: { focus?: boolean; sustain?: number }
): string {
  let str = formatDurationFromTypeAndValue(type, value);
  if (modifiers?.focus) str += ' (Focus)';
  if (modifiers?.sustain != null && modifiers.sustain > 0) {
    str += ` (Sustain ${modifiers.sustain})`;
  }
  return str;
}
