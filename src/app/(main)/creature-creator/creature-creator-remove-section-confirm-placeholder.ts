/**
 * Optional-section Remove confirm (TASK 1dfe8wf28e6).
 * ConfirmActionModal copy for Powers, Techniques, and Inventory Remove.
 */

/** ConfirmActionModal confirm button label (#446). */
export const REMOVE_SECTION_CONFIRM_CONFIRM_LABEL = 'Confirm';

/** Temporary stopgap until Kadin's copy rewrite (task 86e3rw7af) replaces this description. */
export const REMOVE_SECTION_CONFIRM_DESCRIPTION =
  'This section will be hidden. Your items in it are kept.';

/** Section titles already used on CollapsibleSection (do not invent new names). */
export type CreatureCreatorOptionalSectionDisplayName = 'Powers' | 'Techniques' | 'Inventory';

export function creatureCreatorOptionalSectionRemoveConfirm(
  sectionDisplayName: CreatureCreatorOptionalSectionDisplayName,
): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  return {
    title: `Remove ${sectionDisplayName}?`,
    description: REMOVE_SECTION_CONFIRM_DESCRIPTION,
    confirmLabel: REMOVE_SECTION_CONFIRM_CONFIRM_LABEL,
  };
}
