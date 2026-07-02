/**
 * Shared damage-dice "split" calculation.
 *
 * Splits represent how many extra dice are gained by using dice smaller than a
 * d12 for the same total damage potential. Same formula as the vanilla site:
 *   splits = max(0, diceAmt - ceil(total / 12))  where total = diceAmt * dieSize
 *
 * Single source of truth imported by mechanic-builder, technique-calc and
 * item-calc (previously duplicated verbatim in all three). (DUP-01)
 */
export function computeSplits(diceAmt: number, dieSize: number): number {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}
