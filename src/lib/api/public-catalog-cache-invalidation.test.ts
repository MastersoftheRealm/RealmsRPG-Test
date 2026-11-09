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
  officialPublicRouteCdnCacheTag,
} from '@/lib/codex/cache-tags';
import {
  invalidateCodexApiAfterSourceRenameFromServerAction,
  invalidateCodexCollectionPublicCachesFromRouteHandler,
  invalidateCodexCollectionPublicCachesFromServerAction,
  invalidateOfficialLibraryPublicCachesFromRouteHandler,
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

  it('codex collection route invalidation uses expire 0 on CDN and data tags', () => {
    invalidateCodexCollectionPublicCachesFromRouteHandler('core_rules', 'core_rules');

    expect(revalidateTag).toHaveBeenCalledWith(CORE_RULES_CACHE_TAG, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(codexPublicCollectionCdnCacheTag('coreRules'), {
      expire: 0,
    });
  });

  it('source rename expires every listed collection CDN tag from server actions', () => {
    invalidateCodexApiAfterSourceRenameFromServerAction(['codex_feats']);

    expect(updateTag).toHaveBeenCalledWith(codexPublicCollectionCdnCacheTag('coreRules'));
    expect(updateTag).toHaveBeenCalledWith(codexApiTableCacheTag('codex_feats'));
  });
});
