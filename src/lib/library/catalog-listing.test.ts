import { describe, expect, it } from 'vitest';
import {
  CATALOG_LISTING_SCOPE_OPTIONS,
  CREATOR_SAVE_TARGET_OPTIONS,
  catalogListingClassOptions,
  catalogListingToSaveTarget,
  findLoadedLibraryItem,
  officialLibraryQueryPath,
  parseCatalogListing,
  resolveCreatorSaveTargetFromItem,
  saveTargetToCatalogListing,
  wantsIncludeUnlisted,
} from './catalog-listing';

describe('listing option lists', () => {
  it('shares All/Public/Admin labels for filters, class, and save target', () => {
    expect(CATALOG_LISTING_SCOPE_OPTIONS.map((o) => o.value)).toEqual([
      'all',
      'listed',
      'unlisted',
    ]);
    expect(catalogListingClassOptions(true).map((o) => o.label)).toEqual(['Public', 'Admin']);
    expect(catalogListingClassOptions(false).map((o) => o.label)).toEqual([
      'Public library',
      'Admin library',
    ]);
    expect(CREATOR_SAVE_TARGET_OPTIONS.map((o) => o.value)).toEqual(['private', 'public', 'admin']);
  });
});

describe('parseCatalogListing', () => {
  it('treats missing, null, and unknown values as listed', () => {
    expect(parseCatalogListing(undefined)).toBe('listed');
    expect(parseCatalogListing(null)).toBe('listed');
    expect(parseCatalogListing('listed')).toBe('listed');
    expect(parseCatalogListing('nope')).toBe('listed');
  });

  it('accepts unlisted', () => {
    expect(parseCatalogListing('unlisted')).toBe('unlisted');
  });
});

describe('save target round-trip', () => {
  it('maps official classes and leaves my-library as no listing', () => {
    expect(saveTargetToCatalogListing('private')).toBeNull();
    expect(saveTargetToCatalogListing('public')).toBe('listed');
    expect(saveTargetToCatalogListing('admin')).toBe('unlisted');
    expect(catalogListingToSaveTarget('listed')).toBe('public');
    expect(catalogListingToSaveTarget('unlisted')).toBe('admin');
  });
});

describe('resolveCreatorSaveTargetFromItem', () => {
  it('uses private for user rows and admin for unlisted official rows', () => {
    expect(resolveCreatorSaveTargetFromItem({ _source: 'user', catalogListing: 'unlisted' })).toBe(
      'private',
    );
    expect(resolveCreatorSaveTargetFromItem({ _source: 'official' })).toBe('public');
    expect(
      resolveCreatorSaveTargetFromItem({ _source: 'official', catalogListing: 'unlisted' }),
    ).toBe('admin');
    expect(
      resolveCreatorSaveTargetFromItem({ _source: 'official', catalog_listing: 'unlisted' }),
    ).toBe('admin');
  });
});

describe('query helpers', () => {
  it('encodes includeUnlisted only when requested', () => {
    expect(officialLibraryQueryPath('powers', false)).toBe('/api/official/powers');
    expect(officialLibraryQueryPath('powers', true)).toBe('/api/official/powers?includeUnlisted=1');
    expect(wantsIncludeUnlisted(new URLSearchParams('includeUnlisted=1'))).toBe(true);
    expect(wantsIncludeUnlisted(new URLSearchParams('includeUnlisted=true'))).toBe(false);
  });
});

describe('findLoadedLibraryItem', () => {
  it('matches id or docId and ignores empty edit ids', () => {
    const items = [
      { id: 'a', docId: 'a', name: 'A' },
      { id: 'b', docId: 'doc-b', name: 'B' },
    ];
    expect(findLoadedLibraryItem(items, null)).toBeUndefined();
    expect(findLoadedLibraryItem(items, 'a')).toEqual(items[0]);
    expect(findLoadedLibraryItem(items, 'doc-b')).toEqual(items[1]);
  });
});
