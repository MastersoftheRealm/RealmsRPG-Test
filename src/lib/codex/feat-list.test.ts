import { describe, expect, it } from 'vitest';
import type { Feat } from '@/hooks';
import { buildFeatDetailSections } from './feat-list';

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
    ...overrides,
  };
}

describe('buildFeatDetailSections', () => {
  const skillIdToName = new Map<string, string>([['34', 'Perceive']]);

  it('places Tags last and always labels the section (no hideLabelIfSingle)', () => {
    const feat = minimalFeat({
      char_feat: true,
      tags: ['Craft'],
      ability_req: ['Strength'],
      abil_req_val: [3],
      skill_req: ['34'],
      skill_req_val: [0],
    });

    const familyLevels: Feat[] = [
      minimalFeat({ id: '1', feat_lvl: 1 }),
      minimalFeat({ id: '2', feat_lvl: 2, base_feat_id: '1', lvl_req: 4 }),
    ];

    const sections = buildFeatDetailSections(feat, skillIdToName, familyLevels);
    const labels = sections.map((s) => s.label);

    expect(labels).toEqual([
      'Type',
      'Ability Requirements',
      'Skill Requirements',
      'Feat Levels',
      'Tags',
    ]);

    const tagsSection = sections.find((s) => s.label === 'Tags');
    expect(tagsSection?.chips.map((c) => c.name)).toEqual(['Craft']);
    expect(tagsSection?.hideLabelIfSingle).toBeUndefined();
  });

  it('omits Tags when feat has no tags', () => {
    const sections = buildFeatDetailSections(minimalFeat(), skillIdToName, []);
    expect(sections.some((s) => s.label === 'Tags')).toBe(false);
  });
});
