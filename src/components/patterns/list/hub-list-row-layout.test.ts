import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT,
  HUB_LIST_ROW_MOBILE_CHROME_END_SLOT,
  hubListRowMobileChromeEnd,
} from './hub-list-row';

const row = readFileSync(new URL('./hub-list-row.tsx', import.meta.url), 'utf8');
const encountersPage = readFileSync(
  new URL('../../../app/(main)/encounters/page.tsx', import.meta.url),
  'utf8',
);
const craftingPage = readFileSync(
  new URL('../../../app/(main)/crafting/page.tsx', import.meta.url),
  'utf8',
);

/**
 * 375px encounter card. Page `px-4`, 1px card border, card `p-4`, icon 40px,
 * one `gap-4` while trailing chrome is out of flow. Measured on a4cf5eca:
 * Nova Flat 16px “QA Encounter 1” is 113px; “Preparing” chip is 84px.
 * A 9.5rem end reserve leaves a 9px name box — that must fail.
 */
const CONTENT_COLUMN_PX = 375 - 32 - 2 - 32 - 40 - 16;
const TITLE_GAP_PX = 8;
const QA_ENCOUNTER_1_PX = 113;
const PREPARING_BADGE_PX = 84;
const QA_BLADE_1_PX = 82;
const PLANNED_BADGE_PX = 74;

function cssLengthToPx(value: string, remPx = 16): number {
  const terms = value.match(/-?\d*\.?\d+(?:px|rem)/g);
  if (!terms || terms.length === 0) throw new Error(`No lengths in ${value}`);
  return terms.reduce((sum, term) => {
    if (term.endsWith('rem')) return sum + Number.parseFloat(term) * remPx;
    return sum + Number.parseFloat(term);
  }, 0);
}

function nameBoxPx(chromeEnd: string, badgePx: number): number {
  return CONTENT_COLUMN_PX - cssLengthToPx(chromeEnd) - TITLE_GAP_PX - badgePx;
}

describe('HubListRow narrow layout (86e3k9143)', () => {
  it('keeps title and status badge on one row with title flex-1 truncate + title attr', () => {
    expect(row).toMatch(/flex min-w-0 items-center gap-2/);
    expect(row).toMatch(/min-w-0 flex-1 font-semibold text-text-primary/);
    expect(row).not.toMatch(/flex-col items-start gap-1 sm:flex-row/);
    expect(row).toMatch(/block truncate" title=\{title\}/);
    expect(row).toMatch(/className=\{cn\('shrink-0', badgeClassName\)\}/);
  });

  it('reserves only the painted chevron so QA Encounter 1 fits beside Preparing at 375', () => {
    expect(CONTENT_COLUMN_PX).toBe(253);
    expect(row).toMatch(/max-lg:pe-\[var\(--hub-row-chrome-end\)\]/);
    expect(row).toMatch(
      /max-lg:absolute max-lg:inset-y-0 max-lg:right-4 max-lg:flex max-lg:items-center/,
    );
    expect(row).toMatch(/'--hub-row-chrome-end': mobileChromeEnd/);
    expect(row).not.toMatch(/9\.5rem/);

    const chromeEnd = hubListRowMobileChromeEnd({ rightSlot: true, showDefaultChrome: false });
    expect(chromeEnd).toBe(HUB_LIST_ROW_MOBILE_CHROME_END_SLOT);
    // 9.5rem on this card is the measured 9px name box and must not pass.
    expect(nameBoxPx('9.5rem', PREPARING_BADGE_PX)).toBe(9);

    const encounterNameBox = nameBoxPx(chromeEnd ?? '', PREPARING_BADGE_PX);
    expect(encounterNameBox).toBeGreaterThan(QA_ENCOUNTER_1_PX);
    expect(encounterNameBox).toBeGreaterThan(9);
  });

  it('keeps a crafting title visible beside its status badge', () => {
    expect(craftingPage).toContain('HubListRow');
    expect(craftingPage).toMatch(/title=\{session\.itemName\}/);
    const chromeEnd = hubListRowMobileChromeEnd({ rightSlot: false, showDefaultChrome: true });
    expect(chromeEnd).toBe(HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT);
    const craftingNameBox = nameBoxPx(chromeEnd ?? '', PLANNED_BADGE_PX);
    expect(craftingNameBox).toBeGreaterThanOrEqual(QA_BLADE_1_PX);
    expect(craftingNameBox).toBeGreaterThan(9);
    expect(row).toMatch(/block truncate" title=\{title\}/);
  });

  it('encounters hub uses HubListRow with status badge beside the title', () => {
    expect(encountersPage).toContain('HubListRow');
    expect(encountersPage).toMatch(/badge=\{encounter\.status/);
    expect(encountersPage).toMatch(/title=\{encounter\.name\}/);
    expect(encountersPage).toMatch(/rightSlot=/);
  });
});
