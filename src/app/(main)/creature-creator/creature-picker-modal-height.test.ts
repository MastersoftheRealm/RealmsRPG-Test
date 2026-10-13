import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const featModal = readFileSync(new URL('./AddCreatureFeatModal.tsx', import.meta.url), 'utf8');
const creaturePage = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const selectionModal = readFileSync(
  new URL('../../../components/patterns/select/unified-selection-modal.tsx', import.meta.url),
  'utf8',
);
const selectionFooter = readFileSync(
  new URL(
    '../../../components/patterns/select/unified-selection-modal-footer.tsx',
    import.meta.url,
  ),
  'utf8',
);
const modal = readFileSync(new URL('../../../components/ui/modal.tsx', import.meta.url), 'utf8');

/**
 * 375×553 is the phone height where Add feat showed about one result card
 * (86e3jxbrf). Chrome below is the full-screen modal stack on a fine pointer;
 * coarse pointer adds the Standard 44px tab min-height. The list region must
 * stay the majority of that viewport.
 */
const VIEWPORT_H = 553;

function pickerListHeight(coarsePointer: boolean): number {
  const header = 8 + 12 + 28;
  const contentPad = 8;
  const searchRow = 46;
  const tabGap = 4;
  const tabRow = coarsePointer ? 8 + 2 + 44 : 8 + 2 + 20 + 8;
  const sortRow = 2 + 20 + 20 + 2;
  const stackGaps = 4 * 2;
  const footer = 4 + 48 + 8;
  const chrome = header + contentPad + searchRow + tabGap + tabRow + sortRow + stackGaps + footer;
  return VIEWPORT_H - chrome;
}

describe('creature picker modal height (86e3jxbrf)', () => {
  it('keeps Add feat and Select Powers source tabs on one row without a title description', () => {
    expect(featModal).not.toMatch(/description=\{/);
    expect(featModal).toMatch(/aria-label="Feat source"[\s\S]*?equalWidth/);
    expect(creaturePage).toMatch(/aria-label="Power modal type"[\s\S]*?equalWidth/);
  });

  it('does not spend a phone row on the selection count or a second footer inset', () => {
    expect(selectionFooter).toMatch(/max-sm:sr-only/);
    expect(selectionFooter).not.toMatch(/flex-col-reverse/);
    expect(selectionFooter).not.toMatch(/pt-3 md:pt-4/);
    expect(selectionModal).toMatch(/gap-1 overflow-hidden px-4 pt-2 pb-0/);
    expect(modal).toMatch(/useFullScreenMobile \? 'mx-4 mt-2 mb-0 px-4 py-1\.5'/);
    expect(modal).toMatch(/h-full max-h-full min-h-0 flex-col/);
  });

  it('leaves the results list most of a 375×553 modal', () => {
    expect(pickerListHeight(false)).toBeGreaterThan(VIEWPORT_H / 2);
    expect(pickerListHeight(true)).toBeGreaterThan(VIEWPORT_H / 2);
  });
});
