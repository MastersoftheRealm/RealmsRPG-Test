/**
 * Roll log panel layout tokens (86e3jwawd follow-up).
 * Tests assert these strings stay in roll-log.tsx / globals.css.
 */

/** Minimum height for the scrollable roll history list. */
export const ROLL_LOG_HISTORY_LIST_MIN_CLASS = 'min-h-20';

/** Header row height when Personal vs Campaign tabs switch (Clear placeholder in campaign mode). */
export const ROLL_LOG_HEADER_MIN_CLASS = 'min-h-14';

/** Panel height cap — flex column; list grows between header and dice builder. */
export const ROLL_LOG_PANEL_HEIGHT_CLASS =
  'max-h-[var(--roll-log-panel-max-height)] h-[var(--roll-log-panel-max-height)]';

/** Dice builder section: shrink-0 with overflow when the viewport is short. */
export const ROLL_LOG_DICE_BUILDER_CLASS = 'shrink-0 max-h-[14rem] overflow-y-auto';
