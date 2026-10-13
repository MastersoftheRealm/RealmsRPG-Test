/** Sheet Edit and Temp are mutually exclusive. Clicking the active one turns it off. */
export type SheetInteractionMode = 'edit' | 'temp' | null;

export function nextSheetInteractionMode(
  current: SheetInteractionMode,
  action: 'edit' | 'temp',
): SheetInteractionMode {
  return current === action ? null : action;
}
