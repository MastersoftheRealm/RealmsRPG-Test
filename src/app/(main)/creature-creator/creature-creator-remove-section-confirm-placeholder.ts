/**
 * Optional-section Remove confirm (TASK 1dfe8wf28e6).
 * Same props as the creature Restart confirm: title, description, confirmLabel
 * on ConfirmActionModal. Cancel stays that modal's default label.
 * No existing title or description fits Remove, so those slots stay empty
 * and ConfirmActionModal does not render them.
 */
// TODO: needs Kadin's wording

/** ConfirmActionModal default confirm button label. */
export const REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL = 'Confirm';

/** Empty until Kadin writes a title. Not rendered. */
export const REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE = '';

/** Empty until Kadin writes a description. Not rendered. */
export const REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION = '';

export const creatureCreatorOptionalSectionRemoveConfirm = {
  title: REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE,
  description: REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION,
  confirmLabel: REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL,
};
