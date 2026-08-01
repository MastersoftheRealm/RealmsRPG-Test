/**
 * Creature level display — user-facing formatting.
 * Decimal creature levels (0.25, 0.5, 0.75) render as unicode fractions (¼, ½, ¾).
 * Mixed values: 1.25 → 1¼, 2.5 → 2½. Integer levels unchanged.
 */

const QUARTER_FRACTION_CHARS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

/** Snap to nearest quarter to tolerate floating-point storage (e.g. 0.30000000004). */
function normalizeCreatureLevelParts(level: number): { whole: number; fraction: number } {
  const quarters = Math.round(level * 4);
  const whole = Math.floor(quarters / 4);
  const fraction = (quarters % 4) / 4;
  return { whole, fraction };
}

/**
 * Format a creature level for display (no prefix).
 * @example formatCreatureLevel(0.25) → "¼"
 * @example formatCreatureLevel(1.5) → "1½"
 */
export function formatCreatureLevel(level: number | string | null | undefined): string {
  if (level == null || level === '') return '-';

  const n = Number(level);
  if (!Number.isFinite(n) || n < 0) return '-';

  const { whole, fraction } = normalizeCreatureLevelParts(n);
  const fracChar = QUARTER_FRACTION_CHARS[fraction];

  if (whole === 0 && fracChar) return fracChar;
  if (fracChar) return `${whole}${fracChar}`;
  if (whole > 0) return String(whole);
  return String(n);
}

/** @example formatCreatureLevelLabel(0.5) → "Level ½" */
export function formatCreatureLevelLabel(
  level: number | string | null | undefined,
  prefix = 'Level',
): string {
  return `${prefix} ${formatCreatureLevel(level)}`;
}

/** @example formatCreatureLevelShort(0.75) → "Lv ¾" */
export function formatCreatureLevelShort(level: number | string | null | undefined): string {
  return `Lv ${formatCreatureLevel(level)}`;
}

/** Creature creator level select options — labels use unicode fractions. */
export const CREATURE_LEVEL_SELECT_OPTIONS = [
  { value: '0.25', label: formatCreatureLevel(0.25) },
  { value: '0.5', label: formatCreatureLevel(0.5) },
  { value: '0.75', label: formatCreatureLevel(0.75) },
  ...Array.from({ length: 30 }, (_, i) => {
    const value = String(i + 1);
    return { value, label: value };
  }),
];
