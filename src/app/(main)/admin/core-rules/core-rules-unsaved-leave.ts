/**
 * Unsaved Core Rules editor checks (86e3jtrak).
 * Same discard rule as a Codex record editor.
 * Back and Escape ask. Refresh uses beforeunload.
 * This editor is a page. It has no close button.
 */

export const CORE_RULES_EDITOR_DISCARD_TITLE = 'Discard unsaved changes?';
export const CORE_RULES_EDITOR_DISCARD_DESCRIPTION =
  'This Core Rules edit has changes that are not saved. Continuing will discard them.';
export const CORE_RULES_EDITOR_DISCARD_CONFIRM = 'Discard';
export const CORE_RULES_EDITOR_DISCARD_CANCEL = 'Keep editing';
export const CORE_RULES_TAB_DISCARD_CONFIRM = 'Discard changes';

export type CoreRulesUnsavedAction = 'leave' | 'switch-tab';

/**
 * One confirm dialog. Leaving the page wins over a tab switch.
 * Keep editing is the cancel label; it does not change the typed value.
 */
export function coreRulesUnsavedPrompt(input: {
  navigationPending: boolean;
  tabPending: boolean;
  activeTabLabel: string;
  pendingTabLabel: string;
}): {
  open: boolean;
  description: string;
  confirmLabel: string;
  action: CoreRulesUnsavedAction | null;
} {
  if (input.navigationPending) {
    return {
      open: true,
      description: CORE_RULES_EDITOR_DISCARD_DESCRIPTION,
      confirmLabel: CORE_RULES_EDITOR_DISCARD_CONFIRM,
      action: 'leave',
    };
  }
  if (input.tabPending) {
    return {
      open: true,
      description: `${input.activeTabLabel} has unsaved edits. Opening ${input.pendingTabLabel} will discard them.`,
      confirmLabel: CORE_RULES_TAB_DISCARD_CONFIRM,
      action: 'switch-tab',
    };
  }
  return {
    open: false,
    description: CORE_RULES_EDITOR_DISCARD_DESCRIPTION,
    confirmLabel: CORE_RULES_EDITOR_DISCARD_CONFIRM,
    action: null,
  };
}

/** Escape asks only while an edit is dirty and no other dialog or menu is using that key. */
export function coreRulesEscapeShouldAsk(input: {
  dirty: boolean;
  dialogOpen: boolean;
  menuOpen: boolean;
  targetIsSelect: boolean;
}): boolean {
  if (!input.dirty || input.dialogOpen || input.menuOpen || input.targetIsSelect) return false;
  return true;
}
