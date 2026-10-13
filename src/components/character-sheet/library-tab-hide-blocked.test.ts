import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TAB_VISIBILITY, libraryTabHideBlocked, type TabType } from './library-tab-config';

const navigation = readFileSync(
  path.join(import.meta.dirname, 'use-library-tab-navigation.tsx'),
  'utf8',
);

function only(tabId: TabType): Record<TabType, boolean> {
  return {
    feats: false,
    powers: false,
    techniques: false,
    inventory: false,
    proficiencies: false,
    notes: false,
    [tabId]: true,
  };
}

describe('last visible library tab hide (86e3jvzry)', () => {
  it('blocks hide only for the last tab that stays visible', () => {
    expect(libraryTabHideBlocked(only('notes'), 'notes')).toBe(true);
    expect(libraryTabHideBlocked(only('notes'), 'feats')).toBe(false);
    expect(libraryTabHideBlocked(DEFAULT_TAB_VISIBILITY, 'notes')).toBe(false);
    expect(libraryTabHideBlocked({ techniques: false }, 'powers')).toBe(false);
  });

  it('disables that hide button and still refuses the click', () => {
    expect(navigation).toContain('disabled={libraryTabHideBlocked(resolvedTabVisibility, tab.id)}');
    expect(navigation).toContain(
      'if (libraryTabHideBlocked(resolvedTabVisibility, tabId)) return;',
    );
  });
});
