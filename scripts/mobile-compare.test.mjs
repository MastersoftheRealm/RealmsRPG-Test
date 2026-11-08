import { describe, expect, it } from 'vitest';
import { MOBILE_COMPARE_TARGETS, findDisallowedMobileCompareUrls } from './mobile-compare.mjs';

describe('mobile-compare targets (CONFIG-014)', () => {
  it('does not configure dndbeyond or other third-party URLs', () => {
    expect(findDisallowedMobileCompareUrls(MOBILE_COMPARE_TARGETS)).toEqual([]);
    expect(MOBILE_COMPARE_TARGETS.map((t) => t.id).sort((a, b) => a.localeCompare(b))).toEqual([
      'realms-codex',
      'realms-library',
    ]);
  });

  it('flags external compare URLs including historical dndbeyond targets', () => {
    expect(
      findDisallowedMobileCompareUrls([
        { id: 'ddb-spells', url: 'https://www.dndbeyond.com/spells', rowSel: '.row' },
        { id: 'realms-codex', url: 'http://localhost:3100/codex', rowSel: '[data-glr-row]' },
      ]),
    ).toEqual(['https://www.dndbeyond.com/spells']);
  });
});
