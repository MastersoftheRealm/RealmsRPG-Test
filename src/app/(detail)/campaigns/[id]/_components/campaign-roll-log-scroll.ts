/**
 * Campaign roll log scroller (86e3k919m).
 * A max-height overflow box at ~375px captures the wheel, so the page cannot
 * move past the log. Phone grows with the log. From `md`, the 400px box returns.
 */
export const CAMPAIGN_ROLL_LOG_SCROLL_CLASS =
  'rounded-lg bg-surface-alt p-2 md:max-h-[400px] md:overflow-y-auto';
