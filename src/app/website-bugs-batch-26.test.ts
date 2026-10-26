import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const empoweredEditorFiles = [
  'empowered-technique-editor-action-profile.tsx',
  'empowered-technique-editor-power-damage.tsx',
  'empowered-technique-editor-power-parts.tsx',
  'empowered-technique-editor-technique-parts.tsx',
] as const;

function readEmpoweredEditor(fileName: string): string {
  return readFileSync(
    new URL(`./(main)/empowered-technique-creator/${fileName}`, import.meta.url),
    'utf8',
  );
}

/** CollapsibleSection headers with rightSlot crowd the title row at ~375px. */
function expectActionsOnOwnRowWhenRightSlot(source: string, fileName: string): void {
  const blocks = source.split('<CollapsibleSection').slice(1);
  const withRightSlot = blocks.filter((block) => {
    const opening = block.slice(0, block.indexOf('>'));
    return opening.includes('rightSlot');
  });
  expect(
    withRightSlot.length,
    `${fileName} should use CollapsibleSection rightSlot`,
  ).toBeGreaterThan(0);
  for (const block of withRightSlot) {
    const opening = block.slice(0, block.indexOf('>'));
    expect(opening, `${fileName} section with rightSlot`).toContain('actionsOnOwnRow');
  }
}

describe('website bugs batch 26 — empowered section title wrap (86e3jxfcb)', () => {
  it('uses actionsOnOwnRow on empowered CollapsibleSection headers that carry cost badges or actions', () => {
    for (const fileName of empoweredEditorFiles) {
      expectActionsOnOwnRowWhenRightSlot(readEmpoweredEditor(fileName), fileName);
    }
  });
});
