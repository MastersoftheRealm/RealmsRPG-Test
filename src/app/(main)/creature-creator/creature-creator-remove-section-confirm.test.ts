import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REMOVE_SECTION_CONFIRM_CONFIRM_LABEL,
  REMOVE_SECTION_CONFIRM_DESCRIPTION,
  creatureCreatorOptionalSectionRemoveConfirm,
} from './creature-creator-remove-section-confirm-placeholder';

describe('creature creator optional section remove confirm (1dfe8wf28e6)', () => {
  it('uses section display name in dialog accessible name via ConfirmActionModal titleA11y', () => {
    const powersCopy = creatureCreatorOptionalSectionRemoveConfirm('Powers');
    expect(powersCopy.title).toBe('Remove Powers?');
    expect(powersCopy.description).toBe('');
    expect(powersCopy.confirmLabel).toBe('Confirm');

    const modal = readFileSync(
      path.join(
        import.meta.dirname,
        '../../../components/patterns/chrome/confirm-action-modal.tsx',
      ),
      'utf8',
    );
    expect(modal).toContain('titleA11y={title || undefined}');

    const collapsible = readFileSync(
      path.join(import.meta.dirname, '../../../components/creator/collapsible-section.tsx'),
      'utf8',
    );
    expect(collapsible).toContain('title={removeConfirm.title}');
    expect(collapsible).toContain('description={removeConfirm.description}');
    expect(collapsible).toContain('confirmLabel={removeConfirm.confirmLabel}');
  });

  it('keeps description empty (Remove hides section; items stay on creature)', () => {
    expect(REMOVE_SECTION_CONFIRM_DESCRIPTION).toBe('');
    for (const section of ['Powers', 'Techniques', 'Inventory'] as const) {
      expect(creatureCreatorOptionalSectionRemoveConfirm(section).description).toBe('');
    }

    const modal = readFileSync(
      path.join(
        import.meta.dirname,
        '../../../components/patterns/chrome/confirm-action-modal.tsx',
      ),
      'utf8',
    );
    expect(modal).toContain('description ?');
  });

  it('reuses ConfirmActionModal defaults and wires optional sections', () => {
    const copy = readFileSync(
      path.join(import.meta.dirname, 'creature-creator-remove-section-confirm-placeholder.ts'),
      'utf8',
    );
    const modal = readFileSync(
      path.join(
        import.meta.dirname,
        '../../../components/patterns/chrome/confirm-action-modal.tsx',
      ),
      'utf8',
    );
    const restart = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');

    expect(copy).toContain('86e3rw7af');
    expect(restart).toContain("title: 'Restart Creature'");
    expect(restart).toContain("confirmLabel: 'Restart'");
    expect(modal).toContain("confirmLabel = 'Confirm'");
    expect(modal).toContain("cancelLabel = 'Cancel'");

    expect(REMOVE_SECTION_CONFIRM_CONFIRM_LABEL).toBe('Confirm');
    expect(creatureCreatorOptionalSectionRemoveConfirm('Powers')).toEqual({
      title: 'Remove Powers?',
      description: '',
      confirmLabel: 'Confirm',
    });

    const loadout = readFileSync(
      path.join(import.meta.dirname, 'creature-creator-editor-loadout-sections.tsx'),
      'utf8',
    );
    const inventory = readFileSync(
      path.join(import.meta.dirname, 'creature-creator-editor-inventory-section.tsx'),
      'utf8',
    );
    expect(loadout).toContain("creatureCreatorOptionalSectionRemoveConfirm('Powers')");
    expect(loadout).toContain("creatureCreatorOptionalSectionRemoveConfirm('Techniques')");
    expect(inventory).toContain("creatureCreatorOptionalSectionRemoveConfirm('Inventory')");
  });

  it('wires remove confirm through CollapsibleSection and ConfirmActionModal', () => {
    const collapsible = readFileSync(
      path.join(import.meta.dirname, '../../../components/creator/collapsible-section.tsx'),
      'utf8',
    );
    expect(collapsible).toContain('ConfirmActionModal');
    expect(collapsible).toContain('confirmVariant="danger"');
    expect(collapsible).toContain('removeConfirm');
  });
});
