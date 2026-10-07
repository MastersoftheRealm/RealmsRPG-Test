import { describe, expect, it } from 'vitest';
import {
  creatorDraftIsDirty,
  creatorInternalNavigationHref,
} from '@/lib/creator/creator-unsaved-guard';

const page = 'https://realmsrpg.com/power-creator?edit=row-1';

describe('creator unsaved guard', () => {
  it('treats an edited draft as dirty and a saved draft as clean', () => {
    const saved = '{"name":"Saved"}';
    expect(creatorDraftIsDirty('{"name":"Edited"}', saved)).toBe(true);
    expect(creatorDraftIsDirty(saved, saved)).toBe(false);
  });

  it('asks before an in-app link leaves the creator', () => {
    expect(
      creatorInternalNavigationHref({
        href: 'https://realmsrpg.com/library',
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBe('/library');
  });

  it('does not ask for reload-equivalent same document, a new tab, or another site', () => {
    expect(
      creatorInternalNavigationHref({
        href: page,
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
    expect(
      creatorInternalNavigationHref({
        href: 'https://realmsrpg.com/library',
        target: '_blank',
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
    expect(
      creatorInternalNavigationHref({
        href: 'https://example.com/away',
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
  });
});
