import { describe, expect, it } from 'vitest';
import {
  compactLibrarySectionVisibility,
  DEFAULT_LIBRARY_SECTION_VISIBILITY,
  librarySectionVisibleOutsideEdit,
  resolveLibrarySectionVisibility,
} from './character-library-section-visibility';

describe('library section visibility (86e3jvcgh)', () => {
  it('defaults all subsections visible when prefs are missing', () => {
    expect(resolveLibrarySectionVisibility(undefined)).toEqual(DEFAULT_LIBRARY_SECTION_VISIBILITY);
    expect(librarySectionVisibleOutsideEdit('weapons', undefined)).toBe(true);
  });

  it('treats explicit false as hidden outside edit', () => {
    expect(librarySectionVisibleOutsideEdit('stateFeats', { stateFeats: false })).toBe(false);
    expect(librarySectionVisibleOutsideEdit('armor', { armor: false })).toBe(false);
  });

  it('merges partial prefs without dropping other sections', () => {
    expect(resolveLibrarySectionVisibility({ shields: false })).toEqual({
      ...DEFAULT_LIBRARY_SECTION_VISIBILITY,
      shields: false,
    });
  });

  it('stores only hidden sections in compact form (86e3jw5pw)', () => {
    expect(
      compactLibrarySectionVisibility({
        stateFeats: true,
        weapons: true,
        shields: false,
        armor: true,
      }),
    ).toEqual({ shields: false });
    expect(compactLibrarySectionVisibility(DEFAULT_LIBRARY_SECTION_VISIBILITY)).toBeUndefined();
  });
});
