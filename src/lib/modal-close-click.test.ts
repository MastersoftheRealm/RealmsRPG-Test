import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bindModalCloseClickSink, MODAL_CLOSE_CLICK_CAPTURE_MS } from './modal-close-click';

const modal = readFileSync(new URL('../components/ui/modal.tsx', import.meta.url), 'utf8');

describe('modal confirm double-click (86e3jw5g6)', () => {
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

  it('keeps the close shield up through a double-click and sinks that click', () => {
    expect(MODAL_CLOSE_CLICK_CAPTURE_MS).toBeGreaterThanOrEqual(500);
    expect(modal).toContain('bindModalCloseClickSink(window');
    expect(modal).toContain('MODAL_CLOSE_CLICK_CAPTURE_MS');
    expect(modal).toContain('data-testid="modal-close-click-capture"');
  });

  it('arms the click sink only after an open dialog closes, not on a closed mount (86e3jzduq / 86e3jw5g6)', () => {
    expect(modal).toContain('skipClickSinkOnCloseRef.current = true');
    expect(modal).toContain('if (!wasOpenForClickSinkRef.current) return');
    expect(modal).toContain('setCaptureCloseClicks(true)');
  });
});
