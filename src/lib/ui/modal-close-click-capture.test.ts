import { describe, expect, it } from 'vitest';
import {
  MODAL_CLOSE_CLICK_CAPTURE_MS,
  shouldHoldCloseClickCapture,
} from './modal-close-click-capture';

describe('shouldHoldCloseClickCapture', () => {
  it('holds only after a dialog that was open closes', () => {
    expect(shouldHoldCloseClickCapture(true, false)).toBe(true);
  });

  it('does not hold on first mount or while open', () => {
    expect(shouldHoldCloseClickCapture(false, false)).toBe(false);
    expect(shouldHoldCloseClickCapture(false, true)).toBe(false);
    expect(shouldHoldCloseClickCapture(true, true)).toBe(false);
  });

  it('lingers long enough to absorb a ghost click', () => {
    expect(MODAL_CLOSE_CLICK_CAPTURE_MS).toBeGreaterThanOrEqual(100);
  });
});
