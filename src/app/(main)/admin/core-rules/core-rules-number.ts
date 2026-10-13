/**
 * Core Rules number checks (86e3jtuge).
 * Blank is not 0. Values past the safe integer limit are rejected.
 * Negatives stay valid only on the ability and combat fields that already store them.
 * Count, points, and level fields are whole numbers. Rates, feat points, size
 * spaces, and crafting multipliers and percents may stay fractional.
 */

export const CORE_RULES_NUMBER_REQUIRED = 'Enter a number.';
export const CORE_RULES_NUMBER_TOO_LARGE = 'That number is too large.';
export const CORE_RULES_NUMBER_WHOLE = 'Enter a whole number.';
export const CORE_RULES_NUMBER_SAVE_BLOCKED = 'Fix the highlighted numbers before saving.';
export const CORE_RULES_NUMBER_SERVER_NEGATIVE =
  'Negative numbers are not allowed in this core rules field.';
export const CORE_RULES_NUMBER_ERROR_ATTR = 'data-core-rules-number-error';

const NUMBER_TEXT = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;

/**
 * Keys that store fractions and are not a percent, multiplier, or rate.
 * Feat points are points, and they stay here on purpose. Size spaces are not a count.
 */
const FRACTIONAL_NUMBER_KEYS = new Set(['baseFeatPoints', 'featPointsPerLevel', 'spaces']);

/** Top-level keys that already store negatives in seeded core rules. */
const NEGATIVE_KEYS: Record<string, ReadonlySet<string>> = {
  ABILITY_RULES: new Set(['min', 'maxTotalNegative']),
  COMBAT: new Set([
    'multipleActionPenalty',
    'natural1Penalty',
    'rangedMeleePenalty',
    'longRangePenalty',
  ]),
};

export interface CoreRulesNumberOptions {
  min?: number | undefined;
  max?: number | undefined;
  /** No default floor of 0. An explicit min still applies. */
  allowNegative?: boolean | undefined;
  integer?: boolean | undefined;
}

export type CoreRulesNumberResult = { ok: true; value: number } | { ok: false; message: string };

export function coreRulesNumberFloorMessage(min: number): string {
  return `Enter ${min} or greater.`;
}

export function coreRulesNumberCeilingMessage(max: number): string {
  return `Enter ${max} or less.`;
}

export function parseCoreRulesNumber(
  raw: string,
  options: CoreRulesNumberOptions = {},
): CoreRulesNumberResult {
  const trimmed = raw.trim();
  if (trimmed === '' || !NUMBER_TEXT.test(trimmed)) {
    return { ok: false, message: CORE_RULES_NUMBER_REQUIRED };
  }

  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return { ok: false, message: CORE_RULES_NUMBER_REQUIRED };
  }
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    return { ok: false, message: CORE_RULES_NUMBER_TOO_LARGE };
  }

  if (options.integer && !Number.isInteger(value)) {
    return { ok: false, message: CORE_RULES_NUMBER_WHOLE };
  }

  const min = options.min !== undefined ? options.min : options.allowNegative ? undefined : 0;
  if (min !== undefined && value < min) {
    return { ok: false, message: coreRulesNumberFloorMessage(min) };
  }
  if (options.max !== undefined && value > options.max) {
    return { ok: false, message: coreRulesNumberCeilingMessage(options.max) };
  }

  return { ok: true, value };
}

function fractionalAllowed(path: string[]): boolean {
  const key = path[path.length - 1];
  if (!key) return false;
  if (FRACTIONAL_NUMBER_KEYS.has(key)) return true;
  return /Percent|Multiplier|Rate/.test(key);
}

function negativeAllowed(docId: string, path: string[]): boolean {
  if (docId === 'ABILITY_RULES' && path[0] === 'standardArrays') return true;
  const keys = NEGATIVE_KEYS[docId];
  return path.length === 1 && !!keys?.has(path[0] ?? '');
}

function walkCoreRulesNumbers(docId: string, value: unknown, path: string[]): string | null {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return CORE_RULES_NUMBER_REQUIRED;
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return CORE_RULES_NUMBER_TOO_LARGE;
    }
    if (value < 0 && !negativeAllowed(docId, path)) return CORE_RULES_NUMBER_SERVER_NEGATIVE;
    if (!Number.isInteger(value) && !fractionalAllowed(path)) return CORE_RULES_NUMBER_WHOLE;
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const message = walkCoreRulesNumbers(docId, value[i], [...path, String(i)]);
      if (message) return message;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const message = walkCoreRulesNumbers(docId, child, [...path, key]);
      if (message) return message;
    }
  }

  return null;
}

/** Server-side check for a core_rules document. Null when every number can be stored. */
export function coreRulesDocumentNumberError(docId: string, data: unknown): string | null {
  return walkCoreRulesNumbers(docId, data, []);
}
