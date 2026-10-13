/**
 * Species Reset (86e3jp7e1).
 * Drops the open library row so the next same-name save asks before it replaces that row.
 */

export function applySpeciesCreatorReset(actions: {
  clearDraftCache: () => void;
  resetForm: () => void;
  forgetLoadedLibraryItem: () => void;
  clearSaveMessage: () => void;
}): void {
  actions.clearDraftCache();
  actions.resetForm();
  actions.forgetLoadedLibraryItem();
  actions.clearSaveMessage();
}
