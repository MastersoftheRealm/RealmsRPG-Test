/**
 * Character creator save → sheet handoff (guided + advanced).
 *
 * DESIGN_INTENT: After a successful create, navigate first, then clear the creator
 * store. Calling `resetCreator()` synchronously remounts the wizard to step 1 and can
 * unmount the finish UI (and the guided play-together modal) before navigation
 * completes — stranding users on an empty draft. Defer the reset one macrotask so the
 * push is scheduled while the finish step is still mounted.
 */

export function scheduleCreatorReset(resetCreator: () => void): void {
  setTimeout(resetCreator, 0);
}

export function navigateThenResetCreator(navigate: () => void, resetCreator: () => void): void {
  navigate();
  scheduleCreatorReset(resetCreator);
}
