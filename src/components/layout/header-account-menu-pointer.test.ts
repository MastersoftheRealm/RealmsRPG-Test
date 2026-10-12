import { describe, expect, it } from 'vitest';
import { accountMenuPointerClickState } from './header';

/** ClickUp 86e3jvjj2 — pointer click after hover must leave the menu open. */
describe('accountMenuPointerClickState (86e3jvjj2)', () => {
  it('keeps the menu open when hover already opened it', () => {
    expect(accountMenuPointerClickState(true, true)).toEqual({
      open: true,
      consumeHoverFlag: true,
    });
    expect(accountMenuPointerClickState(true, false)).toEqual({
      open: true,
      consumeHoverFlag: true,
    });
  });

  it('toggles when the pointer did not open via hover (keyboard or touch without enter)', () => {
    expect(accountMenuPointerClickState(false, false)).toEqual({
      open: true,
      consumeHoverFlag: false,
    });
    expect(accountMenuPointerClickState(false, true)).toEqual({
      open: false,
      consumeHoverFlag: false,
    });
  });
});
