/**
 * Roll log panel layout tokens (86e3jwawd follow-up).
 * Tests assert these strings stay in roll-log.tsx / globals.css.
 */

/** Roll history list (min height via `.roll-log-history` in globals.css). */
export const ROLL_LOG_HISTORY_LIST_CLASS =
  'roll-log-history min-h-0 flex-1 basis-0 overflow-y-auto bg-surface-alt p-2';

/** @deprecated Asserted in tests as the default history min (5rem); short viewports use 3rem in CSS. */
export const ROLL_LOG_HISTORY_LIST_MIN_CLASS = 'min-h-20';

/** Header row height when Personal vs Campaign tabs switch (Clear placeholder in campaign mode). */
export const ROLL_LOG_HEADER_MIN_CLASS = 'min-h-14';

/** Panel height cap — flex column; list grows between header and dice builder. */
export const ROLL_LOG_PANEL_HEIGHT_CLASS =
  'max-h-[var(--roll-log-panel-max-height)] h-[var(--roll-log-panel-max-height)]';

/** Dice builder shell: may shrink; dice grid scrolls inside; Roll button stays in the footer. */
export const ROLL_LOG_DICE_BUILDER_CLASS =
  'flex min-h-0 max-h-[14rem] shrink flex-col overflow-hidden border-t-2 border-border-light bg-primary-button';

/** Scrollable dice pool + modifier row (not the Roll button). */
export const ROLL_LOG_DICE_BUILDER_SCROLL_CLASS = 'min-h-0 flex-1 overflow-y-auto p-3 pb-2';

/** Roll button row — always visible at the bottom of the card. */
export const ROLL_LOG_ROLL_BUTTON_FOOTER_CLASS = 'shrink-0 px-3 pb-3';
