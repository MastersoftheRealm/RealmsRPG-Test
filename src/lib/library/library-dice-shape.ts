import { DIE_SIZES } from '@/lib/game/creator-constants';

const DIE_SIZE_SET = new Set<number>(DIE_SIZES);
const MAX_SAFE_COUNT = Number.MAX_SAFE_INTEGER;

export const LIBRARY_DICE_SHAPE_ERROR =
  'Die size must be 4, 6, 8, 10, or 12, and the count must be a whole number from 1 up.';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateDicePair(value: unknown): string | null {
  if (!isPlainObject(value)) return null;
  const hasAmount = Object.prototype.hasOwnProperty.call(value, 'amount');
  const hasSize = Object.prototype.hasOwnProperty.call(value, 'size');
  if (!hasAmount || !hasSize) return null;

  const amount = value.amount;
  const size = value.size;

  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 1) {
    return LIBRARY_DICE_SHAPE_ERROR;
  }
  if (amount > MAX_SAFE_COUNT) {
    return LIBRARY_DICE_SHAPE_ERROR;
  }
  if (typeof size !== 'number' || !DIE_SIZE_SET.has(size)) {
    return LIBRARY_DICE_SHAPE_ERROR;
  }
  return null;
}

function walkForDice(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const err = walkForDice(entry);
      if (err) return err;
    }
    return null;
  }
  if (!isPlainObject(value)) return null;

  const pairErr = validateDicePair(value);
  if (pairErr) return pairErr;

  for (const nested of Object.values(value)) {
    const err = walkForDice(nested);
    if (err) return err;
  }
  return null;
}

/** App-path dice validation for library write bodies (not a database guarantee). */
export function libraryDocumentDiceShapeError(body: Record<string, unknown>): string | null {
  if ('shieldDamage' in body && body.shieldDamage === null) {
    const clone = { ...body };
    delete clone.shieldDamage;
    return walkForDice(clone);
  }
  if ('damage' in body && Array.isArray(body.damage) && body.damage.length === 0) {
    const clone = { ...body };
    delete clone.damage;
    return walkForDice(clone);
  }
  return walkForDice(body);
}
