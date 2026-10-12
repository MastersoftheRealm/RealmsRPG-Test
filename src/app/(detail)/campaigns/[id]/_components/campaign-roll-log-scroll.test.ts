import { describe, expect, it } from 'vitest';
import { CAMPAIGN_ROLL_LOG_SCROLL_CLASS } from './campaign-roll-log-scroll';

describe('campaign roll log scroll (86e3k919m)', () => {
  it('does not nest a wheel trap below md', () => {
    expect(CAMPAIGN_ROLL_LOG_SCROLL_CLASS.startsWith('md:overflow-y-auto')).toBe(false);
    expect(CAMPAIGN_ROLL_LOG_SCROLL_CLASS).toContain('md:max-h-[400px]');
    expect(CAMPAIGN_ROLL_LOG_SCROLL_CLASS).toContain('md:overflow-y-auto');
    expect(CAMPAIGN_ROLL_LOG_SCROLL_CLASS).not.toMatch(/(^|\s)overflow-y-auto(\s|$)/);
    expect(CAMPAIGN_ROLL_LOG_SCROLL_CLASS).not.toMatch(/(^|\s)max-h-\[400px\](\s|$)/);
  });
});
