/**
 * Codex feat/part categories are shown as stored — no Offense → Offensive rewrite.
 * This suite fails on master while normalizeFeatCategory still remaps Offense.
 */
import { describe, expect, it } from 'vitest';
import type { Feat } from '@/hooks';
import { buildFeatFilterOptions, buildFeatGridColumns } from './feat-list';
import { derivePartCategories } from '@/lib/library/power-technique-categories';

function minimalFeat(overrides: Partial<Feat> = {}): Feat {
  return {
    id: '1',
    name: 'Test Feat',
    description: '',
    category: 'Utility',
    ability_req: [],
    abil_req_val: [],
    tags: [],
    skill_req: [],
    skill_req_val: [],
    lvl_req: 0,
    uses_per_rec: 0,
    char_feat: false,
    state_feat: false,
    sources: ['Core'],
    ...overrides,
  };
}

describe('stored codex category labels (no Offense rewrite)', () => {
  it('displays feat grid category without rewriting Offense to Offensive', () => {
    const columns = buildFeatGridColumns(minimalFeat({ category: 'Offense' }), 'codex');
    expect(columns.find((c) => c.key === 'category')?.value).toBe('Offense');
  });

  it('keeps Offense and Offensive as distinct feat filter options', () => {
    const mixed = [
      minimalFeat({ id: 'a', category: 'Offense' }),
      minimalFeat({ id: 'b', category: 'Offensive' }),
      minimalFeat({ id: 'c', category: 'Utility' }),
    ];
    expect(buildFeatFilterOptions(mixed).categories).toEqual(['Offense', 'Offensive', 'Utility']);
  });

  it('derives part categories from codex rows without rewriting Offense', () => {
    const partsDb = [{ id: '10', name: 'Strike', category: 'Offense', mechanic: false }];
    expect(derivePartCategories([{ id: '10' }], partsDb)).toEqual(['Offense']);
  });

  it('uses Offensive when stored on the codex part row', () => {
    const partsDb = [{ id: '11', name: 'Blast', category: 'Offensive', mechanic: false }];
    expect(derivePartCategories([{ id: '11' }], partsDb)).toEqual(['Offensive']);
  });
});
