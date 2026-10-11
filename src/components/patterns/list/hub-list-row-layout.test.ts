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

describe('HubListRow narrow layout (86e3k9143)', () => {
  it('keeps title and status badge on one row with title flex-1 truncate + title attr', () => {
    expect(row).toMatch(/flex min-w-0 items-center gap-2/);
    expect(row).toMatch(/min-w-0 flex-1 font-semibold text-text-primary/);
    expect(row).not.toMatch(/flex-col items-start gap-1 sm:flex-row/);
    expect(row).toMatch(/block truncate" title=\{title\}/);
    expect(row).toMatch(/className=\{cn\('shrink-0', badgeClassName\)\}/);
  });

  it('overlays trailing chrome below lg so the name row keeps width at ~375', () => {
    expect(row).toMatch(/max-lg:pe-\[var\(--hub-row-chrome-end\)\]/);
    expect(row).toMatch(
      /max-lg:absolute max-lg:inset-y-0 max-lg:right-4 max-lg:flex max-lg:items-center/,
    );
    expect(hubListRowMobileChromeEnd({ rightSlot: true, showDefaultChrome: false })).toBe(
      HUB_LIST_ROW_MOBILE_CHROME_END_SLOT,
    );
    expect(hubListRowMobileChromeEnd({ rightSlot: false, showDefaultChrome: true })).toBe(
      HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT,
    );
  });

  it('encounters hub uses HubListRow with status badge beside the title', () => {
    expect(encountersPage).toContain('HubListRow');
    expect(encountersPage).toMatch(/badge=\{encounter\.status/);
    expect(encountersPage).toMatch(/title=\{encounter\.name\}/);
    expect(encountersPage).toMatch(/rightSlot=/);
  });
});
