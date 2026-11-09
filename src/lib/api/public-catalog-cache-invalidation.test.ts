import { describe, expect, it, vi, beforeEach } from 'vitest';

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }));

import { CORE_RULES_CACHE_TAG, codexApiTableCacheTag } from '@/lib/codex/cache-tags';
import {
  invalidateCodexApiAfterSourceRename,
  invalidateCodexCollectionPublicCaches,
  invalidateOfficialLibraryPublicCaches,
} from './public-catalog-cache-invalidation';

describe('public-catalog-cache-invalidation', () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    revalidateTag.mockClear();
  });

  it('purges core rules with revalidateTag max and the public codex paths', () => {
    invalidateCodexCollectionPublicCaches('core_rules', 'core_rules');

    expect(revalidateTag).toHaveBeenCalledWith(CORE_RULES_CACHE_TAG, 'max');
    expect(revalidatePath).toHaveBeenCalledWith('/api/codex');
    expect(revalidatePath).toHaveBeenCalledWith('/api/codex?collection=coreRules');
    expect(revalidateTag).not.toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it('purges official techniques CDN path and library tags on write', () => {
    invalidateOfficialLibraryPublicCaches('official_techniques');

    expect(revalidatePath).toHaveBeenCalledWith('/api/official/techniques');
    expect(revalidateTag).toHaveBeenCalledWith('official-library', 'max');
    expect(revalidateTag).toHaveBeenCalledWith(
      'official-library:official_techniques:listedOnly=true',
      'max',
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      'official-library:official_techniques:listedOnly=false',
      'max',
    );
  });

  it('revalidates every listed codex collection path after a source rename', () => {
    invalidateCodexApiAfterSourceRename(['codex_feats', 'codex_skills']);

    expect(revalidateTag).toHaveBeenCalledWith('codex-api', 'max');
    expect(revalidateTag).toHaveBeenCalledWith(codexApiTableCacheTag('codex_feats'), 'max');
    expect(revalidatePath).toHaveBeenCalledWith('/api/codex?collection=feats');
    expect(revalidatePath).toHaveBeenCalledWith('/api/codex?collection=coreRules');
  });
});
