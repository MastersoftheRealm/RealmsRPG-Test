import { describe, expect, it } from 'vitest';
import { nextSheetInteractionMode, type SheetInteractionMode } from './sheet-interaction-mode';

describe('Edit and Temp toggles during a pending save', () => {
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
});
