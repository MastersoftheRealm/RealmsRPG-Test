import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const notes = readFileSync(new URL('./notes-tab.tsx', import.meta.url), 'utf8');
const libraryRemoves = readFileSync(
  new URL('./use-sheet-library-actions.ts', import.meta.url),
  'utf8',
);
const entityRows = readFileSync(new URL('./library-entity-rows.tsx', import.meta.url), 'utf8');
const inventory = readFileSync(new URL('./library-inventory-panel.tsx', import.meta.url), 'utf8');

describe('note delete confirmation (86e3jvcgn)', () => {
  it('opens the character delete modal before a custom note is removed', () => {
    expect(notes).toContain('setNotePendingDelete(note)');
    expect(notes).not.toContain('onDeleteNote(note.id)');
    expect(notes).toContain('<DeleteConfirmModal');
    expect(notes).toContain('itemType="note"');
    expect(notes).toContain('deleteContext="character"');
    expect(notes).toContain('onDeleteNote?.(notePendingDelete.id)');
    expect(notes).toContain('onClose={() => setNotePendingDelete(null)}');
  });

  it('does not add a confirm step to item, power, or technique removal', () => {
    expect(libraryRemoves).not.toContain('DeleteConfirmModal');
    expect(libraryRemoves).toContain('const handleRemovePower');
    expect(libraryRemoves).toContain('const handleRemoveTechnique');
    expect(libraryRemoves).toContain('const handleRemoveWeapon');
    expect(libraryRemoves).toContain('const handleRemoveArmor');
    expect(libraryRemoves).toContain('const handleRemoveShield');
    expect(libraryRemoves).toContain('const handleRemoveEquipment');
    expect(entityRows).not.toContain('DeleteConfirmModal');
    expect(entityRows).toContain('ctx.onRemovePower!(id)');
    expect(entityRows).toContain('ctx.onRemoveTechnique!(id)');
    expect(inventory).not.toContain('DeleteConfirmModal');
    expect(inventory).toContain('onRemoveWeapon');
    expect(inventory).toContain('onRemoveEquipment');
  });
});
