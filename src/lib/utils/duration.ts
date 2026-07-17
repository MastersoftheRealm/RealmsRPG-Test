/**
 * Duration display formatting
 * ===========================
 *
 * One module for all duration UI strings. Layers (pick the lowest that matches your input):
 *
 * 1. **Structured** — `formatDurationFromTypeAndValue(type, value)` /
 *    `formatDurationWithModifiers(...)` when you already have discrete type + numeric value
 *    (creators, calculators, typed library payloads).
 *
 * 2. **Display (any shape)** — `formatDurationDisplay(raw)` at feature boundaries where the
 *    value may be a preformatted string **or** `{ type, value?, unit?, focus?, sustain? }`
 *    (selection modals, mixed library rows).
 *
 * 3. **Compact list** — `formatDurationCompact(string)` for dense list columns
 *    (character-sheet library rows). Abbreviates known units (MIN / RNDS / HRS).
 *
 * Do not add local `formatDuration` helpers in feature code; import from `@/lib/utils/duration`
 * (also re-exported via `@/lib/utils`).
 */

import { capitalizeWords } from './string';

export type DurationDisplayInput =
  | string
  | number
  | {
      type?: string;
      value?: string | number;
      unit?: string;
      focus?: boolean;
      sustain?: number;
    }
  | null
  | undefined;

/** Normalize duration type to canonical form (rounds, minutes, hours, days, permanent, instant) */
function normalizeDurationType(type: string): string {
  const t = (type || '').toLowerCase().trim();
  if (t === 'round' || t === 'rounds') return 'rounds';
  if (t === 'minute' || t === 'minutes' || t === 'min' || t === 'mins') return 'minutes';
  if (t === 'hour' || t === 'hours' || t === 'hr' || t === 'hrs') return 'hours';
  if (t === 'day' || t === 'days') return 'days';
  if (t === 'permanent') return 'permanent';
  if (t === 'instant' || t === 'instantaneous') return 'instant';
  return t;
}

function parseNumericDurationValue(value: unknown, fallback = 1): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.max(0, value);
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (!Number.isNaN(n)) return Math.max(0, n);
  }
  return fallback;
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
  const val = parseNumericDurationValue(value, 1);

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

/**
 * Format a duration value of unknown shape for normal (non-compact) UI display.
 * Prefer structured helpers when type + value are already typed at the call site.
 */
export function formatDurationDisplay(raw: unknown): string {
  if (raw == null) return '-';
  if (typeof raw === 'number') {
    return Number.isNaN(raw) ? '-' : String(raw);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed || '-';
  }
  if (typeof raw === 'object') {
    const obj = raw as Exclude<DurationDisplayInput, string | number | null | undefined>;
    const type = obj.type?.trim();
    if (type) {
      const value = parseNumericDurationValue(obj.value, 1);
      return formatDurationWithModifiers(type, value, {
        focus: obj.focus,
        sustain: obj.sustain,
      });
    }
    if (obj.value != null && obj.unit) {
      const unit = String(obj.unit).trim();
      const norm = normalizeDurationType(unit);
      if (
        norm === 'rounds' ||
        norm === 'minutes' ||
        norm === 'hours' ||
        norm === 'days' ||
        norm === 'instant' ||
        norm === 'permanent'
      ) {
        return formatDurationFromTypeAndValue(norm, parseNumericDurationValue(obj.value, 1));
      }
      return `${obj.value} ${unit}`.trim();
    }
  }
  return '-';
}

/**
 * Compact duration label for dense list columns (e.g. character-sheet library rows).
 * Input is a preformatted duration string (CharacterPower.duration), not structured type/value.
 */
export function formatDurationCompact(duration: string | undefined): string {
  if (!duration) return '-';
  const lower = duration.toLowerCase().trim();
  const withoutParens = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (withoutParens === 'instant' || withoutParens === 'instantaneous') return 'Instant';
  if (withoutParens === 'concentration') return 'Conc.';
  const minMatch = withoutParens.match(/^(\d+)\s*min(ute)?s?$/);
  if (minMatch) return `${minMatch[1]} MIN`;
  const rndMatch = withoutParens.match(/^(\d+)\s*rounds?$/);
  if (rndMatch) return rndMatch[1] === '1' ? '1 RND' : `${rndMatch[1]} RNDS`;
  const hrMatch = withoutParens.match(/^(\d+)\s*hours?$/);
  if (hrMatch) return hrMatch[1] === '1' ? '1 HR' : `${hrMatch[1]} HRS`;
  const dayMatch = withoutParens.match(/^(\d+)\s*days?$/);
  if (dayMatch) return dayMatch[1] === '1' ? '1 Day' : `${dayMatch[1]} Days`;
  if (withoutParens === 'permanent') return 'Permanent';
  return capitalizeWords(withoutParens);
}
