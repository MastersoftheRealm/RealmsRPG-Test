import { describe, expect, it, vi } from 'vitest';
import { stabilizeAfterSelectedHeightChange } from './stabilize-vertical-scroll';

describe('stabilizeAfterSelectedHeightChange (TASK-728)', () => {
  it('scrolls by the insert/shrink delta and no-ops when height is unchanged', () => {
    const scrollBy = vi.fn();
    stabilizeAfterSelectedHeightChange({
      previousHeight: 0,
      nextHeight: 120,
      skip: false,
      scroller: { scrollBy },
    });
    expect(scrollBy).toHaveBeenCalledWith(0, 120);

    scrollBy.mockClear();
    stabilizeAfterSelectedHeightChange({
      previousHeight: 120,
      nextHeight: 0,
      skip: false,
      scroller: { scrollBy },
    });
    expect(scrollBy).toHaveBeenCalledWith(0, -120);

    scrollBy.mockClear();
    stabilizeAfterSelectedHeightChange({
      previousHeight: 80,
      nextHeight: 80,
      skip: false,
      scroller: { scrollBy },
    });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('adjusts overflow-container scrollTop when scrollBy is absent', () => {
    const scroller = { scrollTop: 200 };
    stabilizeAfterSelectedHeightChange({
      previousHeight: 0,
      nextHeight: 32,
      skip: false,
      scroller,
    });
    expect(scroller.scrollTop).toBe(232);
  });

  it('skips compensation on hydrate / first paint and still returns the new baseline', () => {
    const scrollBy = vi.fn();
    const next = stabilizeAfterSelectedHeightChange({
      previousHeight: 0,
      nextHeight: 140,
      skip: true,
      scroller: { scrollBy },
    });
    expect(next).toBe(140);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
