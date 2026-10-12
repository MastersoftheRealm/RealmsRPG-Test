/**
 * Technique creator reset (86e3jywcr).
 * Confirmed reset clears form state and drops the loaded library row.
 */

export function applyTechniqueCreatorReset(actions: {
  clearDraftCache: () => void;
  resetForm: () => void;
  forgetLoadedLibraryItem: () => void;
  clearSaveMessage: () => void;
  acceptDraft: () => void;
}): void {
  actions.resetForm();
  actions.forgetLoadedLibraryItem();
  actions.clearSaveMessage();
  actions.clearDraftCache();
  actions.acceptDraft();
}
