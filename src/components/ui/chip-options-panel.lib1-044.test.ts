import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** LIB1-044 — ChipOptionsPanel UI lives next to ExpandableChip, not under src/lib/chip. */
describe('chip-options-panel placement (LIB1-044)', () => {
  const dir = import.meta.dirname;
  const libChipPath = path.join(dir, '../../lib/chip/chip-options-panel.tsx');
  const uiPath = path.join(dir, 'chip-options-panel.tsx');

  it('does not keep ChipOptionsPanel under src/lib/chip', () => {
    expect(existsSync(libChipPath)).toBe(false);
  });

  it('keeps ChipOptionsPanel next to expandable-chip', () => {
    expect(existsSync(uiPath)).toBe(true);
  });
});
