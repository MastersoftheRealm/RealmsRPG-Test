import { describe, expect, it } from 'vitest';
import { formatDamageDisplay } from '@/lib/utils/string';

describe('formatDamageDisplay', () => {
  it('formats typed dice+type rows with capitalized type', () => {
    expect(formatDamageDisplay([{ amount: 1, size: 8, type: 'slashing' }])).toBe('1d8 Slashing');
  });

  it('joins multiple valid dice+type rows', () => {
    expect(
      formatDamageDisplay([
        { amount: 1, size: 8, type: 'slashing' },
        { amount: 1, size: 4, type: 'fire' },
      ]),
    ).toBe('1d8 Slashing, 1d4 Fire');
  });

  it('formats a single damage object', () => {
    expect(formatDamageDisplay({ amount: 2, size: 6, type: 'piercing' })).toBe('2d6 Piercing');
  });

  it('capitalizes the type on a string value', () => {
    expect(formatDamageDisplay('2d6 slashing')).toBe('2d6 Slashing');
  });

  it('omits type none and empty values', () => {
    expect(formatDamageDisplay([{ amount: 1, size: 6, type: 'none' }])).toBe('1d6');
    expect(formatDamageDisplay(null)).toBe('');
    expect(formatDamageDisplay(undefined)).toBe('');
  });
});
