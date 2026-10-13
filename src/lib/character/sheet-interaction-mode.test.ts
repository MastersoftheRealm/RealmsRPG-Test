import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextSheetInteractionMode, type SheetInteractionMode } from './sheet-interaction-mode';

const ui = readFileSync(
  new URL('../../app/(detail)/characters/[id]/use-character-sheet-page-ui.ts', import.meta.url),
  'utf8',
);

describe('Edit and Temp toggles during a pending save (86e3jw5j5)', () => {
  it('applies each click to the latest mode, so a burst ends on the last click', () => {
    let mode: SheetInteractionMode = 'edit';
    for (const action of ['edit', 'temp', 'edit', 'temp'] as const) {
      mode = nextSheetInteractionMode(mode, action);
    }
    expect(mode).toBe('temp');
    expect(nextSheetInteractionMode(null, 'edit')).toBe('edit');
    expect(nextSheetInteractionMode('temp', 'temp')).toBe(null);
    expect(nextSheetInteractionMode('edit', 'temp')).toBe('temp');
  });

  it('switches mode before the save, instead of waiting on it', () => {
    expect(ui).toContain("nextSheetInteractionMode(current, 'edit')");
    expect(ui).toContain("nextSheetInteractionMode(current, 'temp')");
    expect(ui).toContain('modeRef.current = next');
    expect(ui).not.toContain('await saveNow()');
  });
});
