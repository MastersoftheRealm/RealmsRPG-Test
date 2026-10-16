/**
 * Save-as-copy affordances for standalone creators (86e3mm3ax).
 * Normal Save keeps rename-in-place and same-name replace; copy always inserts a new My library row.
 */

export const CREATOR_SAVE_AS_COPY_LABEL = 'Save as copy';

export function creatorPrivateReplaceOffersSaveAsCopy(
  saveTarget: 'private' | 'public' | 'admin',
  hasReplaceTarget: boolean,
): boolean {
  return saveTarget === 'private' && hasReplaceTarget;
}

export function creatorCanSaveMyLibraryCopy(
  saveTarget: 'private' | 'public' | 'admin',
  loadedLibraryId: string | null,
): boolean {
  return saveTarget === 'private' && Boolean(loadedLibraryId?.trim());
}

type CreatorSaveAsCopyHookSlice = {
  canSaveAsCopy: boolean;
  handleSaveAsCopy: () => Promise<void>;
  offerSaveAsCopyOnConfirm: boolean;
  confirmSaveAsCopy: () => Promise<void>;
};

/** Toolbar handler for power, item, technique, and creature creators. */
export function creatorToolbarSaveAsCopyHandler(
  save: CreatorSaveAsCopyHookSlice,
): (() => Promise<void>) | undefined {
  return save.canSaveAsCopy ? () => save.handleSaveAsCopy() : undefined;
}

/** Replace-confirm secondary action for My library name conflicts. */
export function creatorPublishSaveAsCopyActions(save: CreatorSaveAsCopyHookSlice): {
  secondaryConfirmLabel?: string;
  onSecondaryConfirm?: () => Promise<void>;
} {
  if (!save.offerSaveAsCopyOnConfirm) return {};
  return {
    secondaryConfirmLabel: CREATOR_SAVE_AS_COPY_LABEL,
    onSecondaryConfirm: () => save.confirmSaveAsCopy(),
  };
}
