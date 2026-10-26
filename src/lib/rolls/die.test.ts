import { describe, expect, it } from 'vitest';
import { DIE_MAX, rollDie, type DieType } from './die';

describe('DIE_MAX rollable sizes (86e3jwaw8)', () => {
  it('includes d2 and d100 used by sheet damage and Randomize display', () => {
    expect(DIE_MAX.d2).toBe(2);
    expect(DIE_MAX.d100).toBe(100);
  });

  it('rolls d2 within 1..2', () => {
    const values = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const v = rollDie('d2');
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(2);
      values.add(v);
    }
    expect(values.size).toBeGreaterThan(1);
  });

  it('lists every DieType in DIE_MAX', () => {
    const types: DieType[] = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    for (const type of types) {
      expect(DIE_MAX[type]).toBeGreaterThan(0);
    }
  });
});
