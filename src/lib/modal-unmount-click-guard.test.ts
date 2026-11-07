import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODAL_CLOSE_CLICK_CAPTURE_MS } from './modal-close-click';
import { armModalUnmountClickGuard, modalUnmountShouldArmGuard } from './modal-unmount-click-guard';

describe('sheet modal unmount click-through', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('arms only when a modal closes', () => {
    expect(modalUnmountShouldArmGuard(true, false)).toBe(true);
    expect(modalUnmountShouldArmGuard(false, true)).toBe(false);
    expect(modalUnmountShouldArmGuard(true, true)).toBe(false);
    expect(modalUnmountShouldArmGuard(false, false)).toBe(false);
  });

  it('stops the click about 90ms after close, before it can reach Archetype & Attacks', () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const release = armModalUnmountClickGuard(target);

    vi.advanceTimersByTime(90);
    const followUp = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(followUp);
    expect(followUp.defaultPrevented).toBe(true);
    release();
  });

  it('lets a click through after the guard window', () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const release = armModalUnmountClickGuard(target);
    vi.advanceTimersByTime(MODAL_CLOSE_CLICK_CAPTURE_MS);
    const later = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(later);
    expect(later.defaultPrevented).toBe(false);
    release();
  });
});
