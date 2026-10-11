/**
 * HubListRow trailing chrome reserve below `lg` (86e3k9143).
 * Actions overlay the row end; content pads by this width so the title + badge
 * stay readable beside each other without running under buttons.
 */

/** Default delete + chevron (crafting hub). */
export const HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT = '5.5rem';

/** Custom rightSlot with two IconButtons + chevron (encounters hub). */
export const HUB_LIST_ROW_MOBILE_CHROME_END_SLOT = '9.5rem';

export function hubListRowMobileChromeEnd(input: {
  rightSlot: boolean;
  showDefaultChrome: boolean;
}): string | undefined {
  if (input.rightSlot) return HUB_LIST_ROW_MOBILE_CHROME_END_SLOT;
  if (input.showDefaultChrome) return HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT;
  return undefined;
}
