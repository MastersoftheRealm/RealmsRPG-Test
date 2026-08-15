/**
 * After Modal `isOpen` flips false the dialog unmounts immediately (no close
 * animation). Hold an invisible full-viewport sink so the same pointer/click
 * cannot fall through to Create/Save (or another stacked dialog) underneath.
 */

export const MODAL_CLOSE_CLICK_CAPTURE_MS = 200;

export function shouldHoldCloseClickCapture(wasOpen: boolean, isOpen: boolean): boolean {
  return wasOpen && !isOpen;
}
