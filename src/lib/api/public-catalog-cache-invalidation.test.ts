import { describe, expect, it, vi, beforeEach } from 'vitest';

const { revalidateTag, updateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidateTag, updateTag }));

import {
  CORE_RULES_CACHE_TAG,
  codexApiTableCacheTag,
  codexPublicCollectionCdnCacheTag,
  officialLibraryWriteCacheTags,
  officialPublicRouteCdnCacheTag,
} from '@/lib/codex/cache-tags';
import { codexPayloadCacheTags } from '@/lib/api/public-catalog-list-cache-tags';
import {
  codexListedGetCacheTags,
  codexWritePurgeCacheTags,
  invalidateCodexApiAfterSourceRenameFromServerAction,
  invalidateCodexCollectionPublicCachesFromServerAction,
  invalidateOfficialLibraryPublicCachesFromRouteHandler,
  officialListedGetCacheTags,
  officialWritePurgeCacheTags,
} from './public-catalog-cache-invalidation';

describe('public-catalog-cache-invalidation', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    updateTag.mockClear();
  });

  it('server actions expire data cache and CDN tags with updateTag (not stale-while-revalidate max)', () => {
    invalidateCodexCollectionPublicCachesFromServerAction('core_rules', 'core_rules');

    expect(updateTag).toHaveBeenCalledWith(CORE_RULES_CACHE_TAG);
    expect(updateTag).toHaveBeenCalledWith(codexPublicCollectionCdnCacheTag('coreRules'));
    const maxCalls = revalidateTag.mock.calls.filter((call) => call[1] === 'max');
    expect(maxCalls).toHaveLength(0);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('route handlers expire tags with revalidateTag expire 0 so the next GET is not a stale body', () => {
    invalidateOfficialLibraryPublicCachesFromRouteHandler('official_techniques');

    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith(officialPublicRouteCdnCacheTag('techniques'), {
      expire: 0,
    });
    expect(
      revalidateTag.mock.calls.some((call) => call[1] === 'max' || call[1] === undefined),
    ).toBe(false);
  });

  it('listed GET cache tags are a subset of official route handler purge tags', () => {
    const listedTags = officialListedGetCacheTags('official_powers');
    const writeTags = officialWritePurgeCacheTags('official_powers');
    expect(writeTags.length).toBeGreaterThan(listedTags.length);
    for (const tag of listedTags) {
      expect(writeTags).toContain(tag);
    }
    invalidateOfficialLibraryPublicCachesFromRouteHandler('official_powers');
    for (const tag of writeTags) {
      expect(revalidateTag).toHaveBeenCalledWith(tag, { expire: 0 });
    }
  });

  it('listed codex GET cache tags are a subset of server-action purge tags for a collection', () => {
    const listedTags = codexListedGetCacheTags('core_rules');
    const writeTags = codexWritePurgeCacheTags('core_rules', 'core_rules');
    for (const tag of listedTags) {
      expect(writeTags).toContain(tag);
    }
    invalidateCodexCollectionPublicCachesFromServerAction('core_rules', 'core_rules');
    for (const tag of writeTags) {
      expect(updateTag).toHaveBeenCalledWith(tag);
    }
    expect(listedTags).toContain(CORE_RULES_CACHE_TAG);
    expect(listedTags).toContain(codexPublicCollectionCdnCacheTag('coreRules'));
  });

  it('codex equipment payload data-cache tags are a subset of official_items write purge tags', () => {
    const payloadTags = codexPayloadCacheTags(new Set(['equipment']));
    const writeTags = officialWritePurgeCacheTags('official_items');
    for (const tag of officialLibraryWriteCacheTags('official_items')) {
      expect(payloadTags).toContain(tag);
      expect(writeTags).toContain(tag);
    }
  });

  it('source rename expires every listed collection CDN tag from server actions', () => {
    invalidateCodexApiAfterSourceRenameFromServerAction(['codex_feats']);

    expect(updateTag).toHaveBeenCalledWith(codexPublicCollectionCdnCacheTag('coreRules'));
    expect(updateTag).toHaveBeenCalledWith(codexApiTableCacheTag('codex_feats'));
  });
});
