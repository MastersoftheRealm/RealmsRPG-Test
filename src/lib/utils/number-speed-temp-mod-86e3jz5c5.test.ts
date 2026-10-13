import { describe, expect, it } from 'vitest';
import { formatSpeedTempModifierDelta, SPEED_TEMP_MODIFIER_STEP_SPACES } from './number';

describe('Speed temp modifier spaces (86e3jz5c5)', () => {
  it('steps one space at a time', () => {
    expect(SPEED_TEMP_MODIFIER_STEP_SPACES).toBe(1);
  });

  it('labels temp delta in spaces even when sheet speed may show ft/m', () => {
    expect(formatSpeedTempModifierDelta(2)).toBe('Temp: +2 sp');
    expect(formatSpeedTempModifierDelta(-1, 'signed')).toBe('-1 sp');
  });
});
