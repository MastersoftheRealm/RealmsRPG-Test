import { describe, expect, it, vi } from 'vitest';
import { rollParsedDamage } from './roll-parsed-damage';
import * as dieModule from './die';

describe('rollParsedDamage (86e3jwaw8 / 86e3jwaw5)', () => {
  it('rolls 1d2 instead of dropping the die when d2 is in the damage string', () => {
    vi.spyOn(dieModule, 'rollDie').mockReturnValue(2);
    const result = rollParsedDamage('1d2 Bludgeoning', 3);
    expect(result).not.toBeNull();
    expect(result!.diceResults).toHaveLength(1);
    expect(result!.diceResults[0]?.type).toBe('d2');
    expect(result!.diceResults[0]?.value).toBe(2);
    expect(result!.total).toBe(5);
    vi.restoreAllMocks();
  });

  it('logs a plain zero result for bonus-only damage with 0 bonus (prowess 0)', () => {
    const result = rollParsedDamage('Bludgeoning', 0);
    expect(result).toEqual({
      diceResults: [],
      totalBonus: 0,
      total: 0,
    });
  });
});
