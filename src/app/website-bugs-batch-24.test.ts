import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rollLog = readFileSync(new URL('../components/rolls/roll-log.tsx', import.meta.url), 'utf8');
const valueStepper = readFileSync(
  new URL('../components/patterns/select/value-stepper.tsx', import.meta.url),
  'utf8',
);
const notesTab = readFileSync(
  new URL('../components/character-sheet/notes-tab.tsx', import.meta.url),
  'utf8',
);
const sheetPageData = readFileSync(
  new URL('./(detail)/characters/[id]/use-character-sheet-page-data.ts', import.meta.url),
  'utf8',
);

describe('website bugs batch 24 — sheet keyboard & interaction', () => {
  it('removes dice from the builder with Delete/Backspace (86e3jw5qb)', () => {
    expect(rollLog).toContain("e.key !== 'Backspace' && e.key !== 'Delete'");
    expect(rollLog).toContain('removeDie(die)');
    expect(rollLog).toContain('Right-click: remove');
  });

  it('clears autosave dirty after save without a false leave prompt (86e3jw5pw)', () => {
    expect(sheetPageData).toContain('characterAutosaveDocumentsEqual');
    expect(sheetPageData).toContain('areEqual:');
  });

  it('stops hold-repeat steppers on a global pointer release (86e3jw5p7)', () => {
    expect(valueStepper).toContain("addEventListener('pointerup', onGlobalPointerEnd, true)");
    expect(valueStepper).toContain("addEventListener('pointercancel', onGlobalPointerEnd, true)");
  });

  it('exposes note rename via a focusable control (86e3jw5mb)', () => {
    expect(notesTab).toContain('setIsEditingName(true)');
    expect(notesTab).toMatch(
      /<button[\s\S]*?setIsEditingName\(true\)[\s\S]*?aria-label="Edit name"/,
    );
  });
});
