import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  librarySectionExpandedForCount,
  librarySectionStateForMount,
  readLibrarySectionSession,
  rememberLibrarySectionSession,
} from './use-library-section-collapse';

const source = readFileSync(new URL('./use-library-section-collapse.ts', import.meta.url), 'utf8');
const collapsibleSection = readFileSync(
  new URL('../components/patterns/list/entity-library-feats.tsx', import.meta.url),
  'utf8',
);

describe('library section collapse when rows arrive (86e3jvjh8)', () => {
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
    expect(source).toContain('rememberLibrarySectionSession(sessionKey');
    expect(collapsibleSection).toContain(
      'useLibrarySectionCollapse(true, itemCount, onAdd, title)',
    );
  });

  it('opens from the count effect, not only the mount state', () => {
    expect(source).toContain('librarySectionExpandedForCount');
    expect(source).toContain('userToggledRef.current = true');
    expect(source).toContain('onExpandedChange,');
    expect(source).not.toContain('onExpandedChange: setExpanded');
  });
});
