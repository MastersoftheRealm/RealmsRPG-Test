import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL,
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION,
  REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE,
  creatureCreatorOptionalSectionRemoveConfirm,
} from './creature-creator-remove-section-confirm-placeholder';

describe('creature creator optional section remove confirm (1dfe8wf28e6)', () => {
  it('exposes placeholder copy constants in one module', () => {
    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE).toContain('[Placeholder:');
    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION).toBe('[Placeholder: confirm remove]');
    expect(REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL).toContain('[Placeholder:');
    expect(creatureCreatorOptionalSectionRemoveConfirm.title).toBe(
      REMOVE_SECTION_CONFIRM_PLACEHOLDER_TITLE,
    );
    expect(creatureCreatorOptionalSectionRemoveConfirm.description).toBe(
      REMOVE_SECTION_CONFIRM_PLACEHOLDER_DESCRIPTION,
    );
    expect(creatureCreatorOptionalSectionRemoveConfirm.confirmLabel).toBe(
      REMOVE_SECTION_CONFIRM_PLACEHOLDER_CONFIRM_LABEL,
    );
  });

  it('wires placeholder remove confirm through CollapsibleSection and ConfirmActionModal', () => {
    const collapsible = readFileSync(
      path.join(import.meta.dirname, '../../../components/creator/collapsible-section.tsx'),
      'utf8',
    );
    expect(collapsible).toContain('ConfirmActionModal');
    expect(collapsible).toContain('confirmVariant="danger"');
    expect(collapsible).toContain('removeConfirm');

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
