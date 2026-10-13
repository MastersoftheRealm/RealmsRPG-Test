import { describe, expect, it } from 'vitest';
import {
  availableUnarmedProwessLevels,
  computeUnarmedProwessTpCost,
  UNARMED_PROWESS_BASE_TP,
  UNARMED_PROWESS_UPGRADE_TP,
} from './unarmed-prowess';

describe('unarmed prowess TP and levels (GAME_RULES)', () => {
  it('computeUnarmedProwessTpCost is 10 + 6×(n−1)', () => {
    expect(computeUnarmedProwessTpCost(0)).toBe(0);
    expect(computeUnarmedProwessTpCost(1)).toBe(UNARMED_PROWESS_BASE_TP);
    expect(computeUnarmedProwessTpCost(2)).toBe(
      UNARMED_PROWESS_BASE_TP + UNARMED_PROWESS_UPGRADE_TP,
    );
  });

  it('availableUnarmedProwessLevels follows character-level gates', () => {
    expect(availableUnarmedProwessLevels(1).map((l) => l.level)).toEqual([1]);
    expect(availableUnarmedProwessLevels(8).map((l) => l.level)).toEqual([1, 2, 3]);
  });
});
