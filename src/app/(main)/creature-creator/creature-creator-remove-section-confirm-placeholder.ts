/**
 * Optional-section Remove confirm (TASK 1dfe8wf28e6).
 * ConfirmActionModal copy for Powers, Techniques, and Inventory Remove.
 */

/** ConfirmActionModal confirm button label (#446). */
export const REMOVE_SECTION_CONFIRM_CONFIRM_LABEL = 'Confirm';

// Description held because Remove does not clear section items; Kadin's copy rewrite is task 86e3rw7af.
export const REMOVE_SECTION_CONFIRM_DESCRIPTION = '';

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
