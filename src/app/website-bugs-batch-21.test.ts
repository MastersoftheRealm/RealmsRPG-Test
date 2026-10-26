import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const notesTab = readFileSync(
  new URL('../components/character-sheet/notes-tab.tsx', import.meta.url),
  'utf8',
);
const currencyCommit = readFileSync(
  new URL('../components/character-sheet/currency-field-commit.ts', import.meta.url),
  'utf8',
);
const inventoryPanel = readFileSync(
  new URL('../components/character-sheet/library-inventory-panel.tsx', import.meta.url),
  'utf8',
);
const resourceInput = readFileSync(
  new URL('../components/character-sheet/sheet-resource-input.tsx', import.meta.url),
  'utf8',
);

describe('website bugs batch 21 — sheet notes, currency, HP/EN inputs', () => {
  it('auto-grows note textareas with content (86e3jwn5h)', () => {
    expect(notesTab).toContain('function SheetNoteFieldEditor');
    expect(notesTab).toContain('syncTextareaHeight');
    expect(notesTab).toContain('resize-none overflow-hidden');
    expect(notesTab).toContain('el.style.height = `${el.scrollHeight}px`');
  });

  it('formats and caps sheet Currency (86e3jwn5g)', () => {
    expect(currencyCommit).toContain('formatGroupedInteger');
    expect(currencyCommit).toContain('clampSavedCurrency');
    expect(inventoryPanel).toContain('formatGroupedInteger(currency)');
  });

  it('commits HP/EN on blur, not only Enter (86e3jwn5f)', () => {
    expect(resourceInput).toMatch(/handleBlur[\s\S]*if \(isEditing\)[\s\S]*applyValue\(\)/);
  });

  it('widens the current Health/Energy input for long values (86e3jwn5e)', () => {
    expect(resourceInput).toContain('size={valueCh}');
    expect(resourceInput).toContain('min-w-[3ch]');
    expect(resourceInput).not.toContain('w-12');
  });
});
