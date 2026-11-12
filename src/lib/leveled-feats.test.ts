import { describe, expect, it, vi } from 'vitest';
import { isGridListChipExpandable } from '@/lib/chip/grid-list-chip-utils';
import {
  buildFeatLevelChips,
  computeNextLeveledFeatFields,
  featLevelChipDescription,
  formatFeatName,
  isFeatFamilyBase,
  levelToRomanNumeral,
  peakFeatInFamily,
  sortedFeatFamily,
  parseFeatNameRomanSuffix,
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

describe('levelToRomanNumeral', () => {
  it('maps feat ranks to Roman suffixes', () => {
    expect(levelToRomanNumeral(1)).toBe('');
    expect(levelToRomanNumeral(2)).toBe('II');
    expect(levelToRomanNumeral(3)).toBe('III');
    expect(levelToRomanNumeral(4)).toBe('IV');
    expect(levelToRomanNumeral(6)).toBe('VI');
    expect(levelToRomanNumeral(11)).toBe('XI');
  });
});

describe('parseFeatNameRomanSuffix', () => {
  it('detects trailing Roman suffixes without stripping level-1 names that include numerals', () => {
    expect(parseFeatNameRomanSuffix('Amplify II')).toMatchObject({
      baseName: 'Amplify',
      romanSuffix: 'II',
      levelFromSuffix: 2,
    });
    expect(parseFeatNameRomanSuffix('Empowered Experience II')).toMatchObject({
      baseName: 'Empowered Experience',
      romanSuffix: 'II',
      levelFromSuffix: 2,
    });
    expect(parseFeatNameRomanSuffix('Speedy')).toMatchObject({
      baseName: 'Speedy',
      romanSuffix: null,
      levelFromSuffix: null,
    });
  });
});

describe('formatFeatName', () => {
  it('returns base name for level 1 even when the stored name includes a Roman suffix', () => {
    expect(formatFeatName({ id: '197', name: 'Empowered Experience II', feat_lvl: 1 })).toBe(
      'Empowered Experience II',
    );
    expect(formatFeatName({ id: '1', name: 'Speedy', feat_lvl: 1 })).toBe('Speedy');
  });

  it('appends Roman suffix for level 2+ when missing', () => {
    expect(formatFeatName({ id: '2', name: 'Speedy', feat_lvl: 2 })).toBe('Speedy II');
    expect(formatFeatName({ id: '3', name: 'Speedy', feat_lvl: 3 })).toBe('Speedy III');
  });

  it('keeps names that already include the matching Roman suffix', () => {
    expect(formatFeatName({ id: '24', name: 'Amplify II', feat_lvl: 2 })).toBe('Amplify II');
  });

  it('does not double-suffix or use (Level N)', () => {
    expect(formatFeatName({ id: '24', name: 'Amplify II', feat_lvl: 2 })).not.toContain('(Level');
    expect(formatFeatName({ id: '24', name: 'Amplify II', feat_lvl: 2 })).not.toBe('Amplify II II');
    expect(formatFeatName({ id: '2', name: 'Speedy', feat_lvl: 2 })).not.toContain('(Level');
  });

  it('replaces a mismatched Roman suffix with the feat level', () => {
    expect(formatFeatName({ id: '3', name: 'Amplify II', feat_lvl: 3 })).toBe('Amplify III');
  });
});

describe('isFeatFamilyBase', () => {
  it('treats an unset or level-1 row with no parent as the family base', () => {
    expect(isFeatFamilyBase({ id: '36', name: 'Speedy' })).toBe(true);
    expect(isFeatFamilyBase({ id: '36', name: 'Speedy', feat_lvl: 1 })).toBe(true);
    expect(isFeatFamilyBase({ id: '36', name: 'Speedy', feat_lvl: 0 })).toBe(false);
    expect(isFeatFamilyBase({ id: '37', name: 'Speedy II', feat_lvl: 2, base_feat_id: '36' })).toBe(
      false,
    );
  });
});

describe('peakFeatInFamily', () => {
  it('returns the highest feat_lvl row from a sorted family list', () => {
    const sorted = [
      { id: '36', feat_lvl: 1 },
      { id: '37', feat_lvl: 2, base_feat_id: '36' },
      { id: '38', feat_lvl: 3, base_feat_id: '36' },
    ];
    expect(peakFeatInFamily(sorted)?.id).toBe('38');
  });
});

describe('computeNextLeveledFeatFields', () => {
  it('bumps from the family peak when the source row is still level 1', () => {
    expect(
      computeNextLeveledFeatFields({
        sourceFeatLvl: 1,
        sourceBaseFeatId: undefined,
        sourceDbFeatId: '36',
        existingFamilyMaxLevel: 2,
      }),
    ).toEqual({ feat_lvl: 3, base_feat_id: '36' });
  });
});

describe('sortedFeatFamily', () => {
  it('returns the family in level order', () => {
    const speedy = { id: '36', name: 'Speedy', feat_lvl: 1 };
    const speedyIi = { id: '37', name: 'Speedy II', feat_lvl: 2, base_feat_id: '36' };
    expect(
      sortedFeatFamily([speedyIi, speedy, { id: '1', name: 'Other' }], speedyIi).map(
        (row) => row.id,
      ),
    ).toEqual(['36', '37']);
  });
});

describe('86e3nwaru mergeFeatsInFamilyOnAdd', () => {
  it('keeps archetype id 37 when adding creature Speedy III id 38', async () => {
    const { mergeFeatsInFamilyOnAdd } = await import('./leveled-feats');
    const creatureMap = new Map([
      ['36', { id: '36', name: 'Speedy', feat_lvl: 1 }],
      ['37', { id: '37', name: 'Speedy II', feat_lvl: 2, base_feat_id: '36' }],
      ['38', { id: '38', name: 'Speedy III', feat_lvl: 3, base_feat_id: '36' }],
    ]);
    const characterMap = new Map<string, { id: string; name: string; feat_lvl: number }>();
    const result = mergeFeatsInFamilyOnAdd({
      existing: [{ id: '37', name: 'Astral Projection', featSourceType: 'archetype' as const }],
      added: [{ id: '38', name: 'Speedy III', featSourceType: 'creature' as const }],
      creatureDefsById: creatureMap,
      characterDefsById: characterMap,
    });
    expect(result).toHaveLength(2);
  });
});
