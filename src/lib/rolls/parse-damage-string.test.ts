import { describe, expect, it } from 'vitest';
import { parseDamageRollGroups } from './parse-damage-string';

describe('parseDamageRollGroups', () => {
  it('parses every group in a Modify-style label (86e3kfkbm)', () => {
    expect(parseDamageRollGroups('1d6 fire, 1d8 ice, 1d4 acid')).toEqual([
      { count: 1, size: 6, modifier: 0, type: 'fire' },
      { count: 1, size: 8, modifier: 0, type: 'ice' },
      { count: 1, size: 4, modifier: 0, type: 'acid' },
    ]);
  });

  it('keeps a single group with a bonus', () => {
    expect(parseDamageRollGroups('2d6+3 Slashing')).toEqual([
      { count: 2, size: 6, modifier: 3, type: 'Slashing' },
    ]);
  });

  it('returns empty for a non-dice string', () => {
    expect(parseDamageRollGroups('none')).toEqual([]);
  });
});
