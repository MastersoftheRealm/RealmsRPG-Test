import { describe, expect, it, vi } from 'vitest';
import { isGridListChipExpandable } from '@/lib/chip/grid-list-chip-utils';
import {
  buildFeatLevelChips,
  featLevelChipDescription,
  type LeveledFeatLike,
} from './leveled-feats';

function feat(overrides: Partial<LeveledFeatLike> & Pick<LeveledFeatLike, 'id'>): LeveledFeatLike {
  return {
    name: 'Speedy',
    description: 'Move faster.',
    ...overrides,
  };
}

const family = [
  feat({ id: '1', feat_lvl: 1 }),
  feat({
    id: '2',
    feat_lvl: 2,
    base_feat_id: '1',
    lvl_req: 4,
    uses_per_rec: 1,
    rec_period: 'Full',
  }),
  feat({ id: '3', feat_lvl: 3, base_feat_id: '1', lvl_req: 8 }),
];

describe('buildFeatLevelChips', () => {
  it('omits the current rank by default (Codex / other-level browse)', () => {
    const chips = buildFeatLevelChips(family, '1');
    expect(chips.map((c) => c.name)).toEqual(['Level 2', 'Level 3']);
    expect(chips.every((c) => c.kind !== 'descriptor')).toBe(true);
  });

  it('includes the current rank as a marked descriptor when asked (sheet play)', () => {
    const chips = buildFeatLevelChips(family, '2', { includeCurrent: true });
    expect(chips.map((c) => c.name)).toEqual(['Level 1', 'Level 2', 'Level 3']);
    expect(chips[1]).toMatchObject({
      kind: 'descriptor',
      category: 'success',
      name: 'Level 2',
      current: true,
    });
    expect(chips[0]?.kind).toBeUndefined();
    expect(chips[0]?.onSelect).toBeUndefined();
    expect(isGridListChipExpandable(chips[0]!)).toBe(true);
    expect(isGridListChipExpandable(chips[1]!)).toBe(false);
  });

  it('select mode marks current, wires qualified onSelect, and disables unqualified', () => {
    const onSelectLevel = vi.fn();
    const chips = buildFeatLevelChips(family, '2', {
      select: {
        featName: 'Speedy',
        maxQualified: 2,
        onSelectLevel,
        unmetReasonFor: (f) => ((f.feat_lvl ?? 1) > 2 ? 'Requires character level 8' : undefined),
      },
    });
    expect(chips.map((c) => c.name)).toEqual(['Level 1', 'Level 2', 'Level 3']);
    expect(chips.every((c) => !isGridListChipExpandable(c))).toBe(true);

    expect(chips[0]).toMatchObject({
      kind: 'descriptor',
      selectAriaLabel: 'Set Speedy to Level 1',
    });
    expect(chips[0]?.disabled).toBeUndefined();
    expect(typeof chips[0]?.onSelect).toBe('function');
    chips[0]!.onSelect!();
    expect(onSelectLevel).toHaveBeenCalledWith(1);

    expect(chips[1]).toMatchObject({ kind: 'descriptor', category: 'success', current: true });
    expect(chips[1]?.onSelect).toBeUndefined();

    expect(chips[2]).toMatchObject({
      kind: 'descriptor',
      disabled: true,
      description: 'Requires character level 8',
    });
    expect(chips[2]?.onSelect).toBeUndefined();
  });
});

describe('featLevelChipDescription', () => {
  it('joins req, uses, and description', () => {
    expect(featLevelChipDescription(family[1]!)).toBe(
      'Req. Character Level 4\nUses: 1 / Full\nMove faster.',
    );
  });
});
