import { describe, expect, it } from 'vitest';
import { formatSpeedForDisplay, formatSpeedString } from './number';

describe('Speed display units (86e3jvzrt)', () => {
  it('shows sp suffix in spaces mode', () => {
    expect(formatSpeedForDisplay(6, 'spaces')).toEqual({ value: 6, suffix: 'sp' });
    expect(formatSpeedString(6, 'spaces')).toBe('6 sp');
  });

  it('keeps ft and m suffixes', () => {
    expect(formatSpeedString(6, 'feet')).toBe('30 ft');
    expect(formatSpeedString(2, 'meters')).toBe('3 m');
  });
});
