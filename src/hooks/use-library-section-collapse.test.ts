import { describe, expect, it } from 'vitest';
import {
  librarySectionExpandedForCount,
  librarySectionStateForMount,
  readLibrarySectionSession,
  rememberLibrarySectionSession,
} from './use-library-section-collapse';

describe('library section collapse when rows arrive', () => {
  it('stays collapsed at 0, then opens when trait rows replace a pending count of 0', () => {
    expect(librarySectionExpandedForCount(false, false, 0)).toBe(false);
    expect(librarySectionExpandedForCount(false, false, 3)).toBe(true);
  });

  it('keeps a user collapse closed after the count changes', () => {
    expect(librarySectionExpandedForCount(false, true, 3)).toBe(false);
    expect(librarySectionExpandedForCount(true, true, 0)).toBe(true);
  });

  it('keeps a collapsed section collapsed after the panel remounts', () => {
    rememberLibrarySectionSession('Appearance', { expanded: false, userToggled: true });
    expect(librarySectionStateForMount(1, readLibrarySectionSession('Appearance'))).toEqual({
      expanded: false,
      userToggled: true,
    });
    expect(librarySectionStateForMount(1, undefined)).toEqual({
      expanded: true,
      userToggled: false,
    });
  });
});
