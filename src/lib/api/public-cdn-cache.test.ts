import { describe, expect, it } from 'vitest';
import {
  codexResponseMayUsePublicCdn,
  officialListMayUsePublicCdn,
  PUBLIC_CDN_CACHE_CONTROL,
} from './public-cdn-cache';

describe('public CDN cache eligibility (86e3rb7ca)', () => {
  it('rejects empty coreRules for codex CDN caching', () => {
    expect(codexResponseMayUsePublicCdn(new Set(['coreRules']), { coreRules: {} })).toBe(false);
    expect(
      codexResponseMayUsePublicCdn(new Set(['coreRules']), {
        coreRules: { PROGRESSION_PLAYER: { baseHealth: 8 } },
      }),
    ).toBe(true);
  });

  it('rejects an empty single collection', () => {
    expect(codexResponseMayUsePublicCdn(new Set(['feats']), { feats: [] })).toBe(false);
  });

  it('rejects unlisted codex rows', () => {
    expect(
      codexResponseMayUsePublicCdn(new Set(['species']), {
        species: [{ id: 'hidden', catalog_listing: 'unlisted' } as never],
      }),
    ).toBe(false);
    expect(
      codexResponseMayUsePublicCdn(new Set(['species']), {
        species: [{ id: 'human', catalogListing: 'listed' } as never],
      }),
    ).toBe(true);
  });

  it('rejects empty official lists and any unlisted item', () => {
    expect(officialListMayUsePublicCdn([])).toBe(false);
    expect(officialListMayUsePublicCdn([{ name: 'Bolt' }])).toBe(true);
    expect(officialListMayUsePublicCdn([{ name: 'Hidden', catalogListing: 'unlisted' }])).toBe(
      false,
    );
  });

  it('documents the shared public Cache-Control value', () => {
    expect(PUBLIC_CDN_CACHE_CONTROL).toContain('s-maxage=300');
    expect(PUBLIC_CDN_CACHE_CONTROL).toContain('max-age=0');
    expect(PUBLIC_CDN_CACHE_CONTROL).toContain('stale-while-revalidate=3600');
    expect(PUBLIC_CDN_CACHE_CONTROL).not.toMatch(/vary/i);
  });
});
