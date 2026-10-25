import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL,
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION,
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE,
  creatureCreatorOptionalSectionRemoveConfirm,
} from './creature-creator-remove-section-confirm-placeholder';

const placeholderPrefix = '[' + 'Placeholder';

describe('creature creator optional section remove confirm (1dfe8wf28e6)', () => {
  it('reuses ConfirmActionModal labels and hides slots with no existing sentence', () => {
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

    expect(copy).toContain("// TODO: needs Kadin's wording");
    expect(restart).toContain("title: 'Restart Creature'");
    expect(restart).toContain("confirmLabel: 'Restart'");
    expect(modal).toContain("confirmLabel = 'Confirm'");
    expect(modal).toContain("cancelLabel = 'Cancel'");
    expect(modal).toContain('title ?');
    expect(modal).toContain('description ?');

    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL).toBe('Confirm');
    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE).toBe('');
    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION).toBe('');
    expect(creatureCreatorOptionalSectionRemoveConfirm).toEqual({
      title: '',
      description: '',
      confirmLabel: 'Confirm',
    });
    for (const value of Object.values(creatureCreatorOptionalSectionRemoveConfirm)) {
      expect(value.startsWith(placeholderPrefix)).toBe(false);
    }
  });

  it('wires remove confirm through CollapsibleSection and ConfirmActionModal', () => {
    const collapsible = readFileSync(
      path.join(import.meta.dirname, '../../../components/creator/collapsible-section.tsx'),
      'utf8',
    );
    expect(collapsible).toContain('ConfirmActionModal');
    expect(collapsible).toContain('confirmVariant="danger"');
    expect(collapsible).toContain('removeConfirm');
    expect(collapsible).toContain('title={removeConfirm.title}');
    expect(collapsible).toContain('description={removeConfirm.description}');
    expect(collapsible).toContain('confirmLabel={removeConfirm.confirmLabel}');

    const loadout = readFileSync(
      path.join(import.meta.dirname, 'creature-creator-editor-loadout-sections.tsx'),
      'utf8',
    );
    const inventory = readFileSync(
      path.join(import.meta.dirname, 'creature-creator-editor-inventory-section.tsx'),
      'utf8',
    );
    expect(loadout).toContain('creatureCreatorOptionalSectionRemoveConfirm');
    expect(inventory).toContain('creatureCreatorOptionalSectionRemoveConfirm');
    expect(loadout).toContain('removeConfirm={creatureCreatorOptionalSectionRemoveConfirm}');
    expect(inventory).toContain('removeConfirm={creatureCreatorOptionalSectionRemoveConfirm}');
  });
});
