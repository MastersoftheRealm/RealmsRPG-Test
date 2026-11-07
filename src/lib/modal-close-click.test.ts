import { describe, expect, it } from 'vitest';
import { bindModalCloseClickSink, MODAL_CLOSE_CLICK_CAPTURE_MS } from './modal-close-click';

describe('modal confirm double-click', () => {
  it('stops one following click, then lets the next click through', () => {
    const target = new EventTarget();
    let caught = 0;
    const unbind = bindModalCloseClickSink(target, () => {
      caught += 1;
    });

    const first = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    expect(caught).toBe(1);

    const second = new Event('click', { bubbles: true, cancelable: true });
    target.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
    unbind();
  });

  it('uses a long enough capture window for double-clicks', () => {
    expect(MODAL_CLOSE_CLICK_CAPTURE_MS).toBeGreaterThanOrEqual(500);
  });
});
