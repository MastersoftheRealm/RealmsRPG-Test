import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CORE_RULES_EDITOR_DISCARD_CANCEL,
  CORE_RULES_EDITOR_DISCARD_CONFIRM,
  CORE_RULES_EDITOR_DISCARD_DESCRIPTION,
  CORE_RULES_EDITOR_DISCARD_TITLE,
  CORE_RULES_TAB_DISCARD_CONFIRM,
  coreRulesEscapeShouldAsk,
  coreRulesUnsavedPrompt,
} from './core-rules-unsaved-leave';
import { codexEditorWarning } from '../codex/admin-codex-unsaved-leave';

const dir = import.meta.dirname;

describe('Core Rules editor unsaved edits (86e3jtrak)', () => {
  it('asks before Back discards Base Ability Points changed from 7 to 8, and uses the browser warning on refresh', () => {
    const saved: number = 7;
    const edited: number = 8;
    const dirty = edited !== saved;

    expect(codexEditorWarning(dirty, 'back')).toBe('confirm');
    expect(codexEditorWarning(dirty, 'refresh')).toBe('beforeunload');
    expect(codexEditorWarning(edited === saved, 'back')).toBe('allow');
    expect(codexEditorWarning(edited === saved, 'refresh')).toBe('allow');

    const leave = coreRulesUnsavedPrompt({
      navigationPending: true,
      tabPending: false,
      activeTabLabel: 'Progression',
      pendingTabLabel: '',
    });
    expect(leave.open).toBe(true);
    expect(leave.action).toBe('leave');
    expect(leave.description).toBe(CORE_RULES_EDITOR_DISCARD_DESCRIPTION);
    expect(leave.confirmLabel).toBe(CORE_RULES_EDITOR_DISCARD_CONFIRM);
    expect(CORE_RULES_EDITOR_DISCARD_CANCEL).toBe('Keep editing');
  });

  it('keeps the tab-switch confirm on the same dialog, and stays quiet when nothing is pending', () => {
    const tab = coreRulesUnsavedPrompt({
      navigationPending: false,
      tabPending: true,
      activeTabLabel: 'Progression',
      pendingTabLabel: 'Combat',
    });
    expect(tab.open).toBe(true);
    expect(tab.action).toBe('switch-tab');
    expect(tab.description).toBe(
      'Progression has unsaved edits. Opening Combat will discard them.',
    );
    expect(tab.confirmLabel).toBe(CORE_RULES_TAB_DISCARD_CONFIRM);

    const both = coreRulesUnsavedPrompt({
      navigationPending: true,
      tabPending: true,
      activeTabLabel: 'Progression',
      pendingTabLabel: 'Combat',
    });
    expect(both.action).toBe('leave');

    const quiet = coreRulesUnsavedPrompt({
      navigationPending: false,
      tabPending: false,
      activeTabLabel: 'Progression',
      pendingTabLabel: '',
    });
    expect(quiet.open).toBe(false);
    expect(quiet.action).toBeNull();
  });

  it('asks on Escape while a value is dirty, and leaves that key alone for an open menu or select', () => {
    expect(
      coreRulesEscapeShouldAsk({
        dirty: true,
        dialogOpen: false,
        menuOpen: false,
        targetIsSelect: false,
      }),
    ).toBe(true);
    expect(
      coreRulesEscapeShouldAsk({
        dirty: false,
        dialogOpen: false,
        menuOpen: false,
        targetIsSelect: false,
      }),
    ).toBe(false);
    expect(
      coreRulesEscapeShouldAsk({
        dirty: true,
        dialogOpen: true,
        menuOpen: false,
        targetIsSelect: false,
      }),
    ).toBe(false);
    expect(
      coreRulesEscapeShouldAsk({
        dirty: true,
        dialogOpen: false,
        menuOpen: true,
        targetIsSelect: false,
      }),
    ).toBe(false);
    expect(
      coreRulesEscapeShouldAsk({
        dirty: true,
        dialogOpen: false,
        menuOpen: false,
        targetIsSelect: true,
      }),
    ).toBe(false);
  });

  it('wires Back and refresh through the existing leave blocker and confirm dialog', () => {
    const page = readFileSync(path.join(dir, 'page.tsx'), 'utf8');
    expect(page).toContain('useCreatorLeaveBlocker(dirty)');
    expect(page).toContain('coreRulesUnsavedPrompt');
    expect(page).toContain('title={CORE_RULES_EDITOR_DISCARD_TITLE}');
    expect(page).toContain('description={unsavedPrompt.description}');
    expect(page).toContain('confirmLabel={unsavedPrompt.confirmLabel}');
    expect(page).toContain('cancelLabel={CORE_RULES_EDITOR_DISCARD_CANCEL}');
    expect(page).toContain('dismissLeave()');
    expect(page).toContain('coreRulesEscapeShouldAsk');
    expect(page).toContain('backLinkRef.current?.click()');
    expect(page).toContain("if (event.key !== 'Escape' || event.defaultPrevented) return;");
    expect(page).toContain('href="/admin"');
    expect(page).toContain('← Back to Admin');
    expect(page).not.toContain('window.confirm');
    expect(CORE_RULES_EDITOR_DISCARD_TITLE).toBe('Discard unsaved changes?');

    const keepStart = page.indexOf('const keepEditing');
    const keepEnd = page.indexOf('const confirmUnsaved');
    const keep = page.slice(keepStart, keepEnd);
    expect(keep).toContain('setPendingTab(null)');
    expect(keep).toContain('dismissLeave()');
    expect(keep).not.toContain('setEditData');
    expect(keep).not.toContain('setDirty');

    const leaveHook = readFileSync(
      path.join(dir, '../../../../hooks/use-creator-unsaved-guard.ts'),
      'utf8',
    );
    expect(leaveHook).toContain("addEventListener('beforeunload'");

    const progression = readFileSync(path.join(dir, 'core-rules-progression-editor.tsx'), 'utf8');
    expect(progression).toContain('label="Base Ability Points"');
    expect(progression).toContain("onChange={(v) => set('baseAbilityPoints', v)}");
  });
});
