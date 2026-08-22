import { describe, expect, it } from 'vitest';
import {
  customizationDraftDiffers,
  mapFeatRows,
  mapTraitRows,
  traitRowId,
  type FeatRowContext,
} from './library-feat-rows';
import { defined } from '@/lib/utils';

const ctx: FeatRowContext = {
  showEditControls: false,
  traitUses: {},
};

describe('mapTraitRows — kind chip expanded-only (TASK-779)', () => {
  it('omits collapsed badges and paints Ancestry / Characteristic / Flaw as descriptor chips', () => {
    const rows = mapTraitRows(
      [
        { name: 'Keen Senses', category: 'ancestry', description: 'You notice more.' },
        { name: 'Curious', category: 'characteristic', description: 'You ask why.' },
        { name: 'Frail', category: 'flaw', description: 'You tire easily.' },
      ],
      ctx,
    );

    expect(rows.map((row) => row.badges)).toEqual([undefined, undefined, undefined]);
    expect(rows.map((row) => row.detailSections?.[0]?.hideLabelIfSingle)).toEqual([
      true,
      true,
      true,
    ]);
    expect(rows.map((row) => row.detailSections?.[0]?.chips[0])).toEqual([
      { name: 'Ancestry', kind: 'descriptor', category: 'default' },
      { name: 'Characteristic', kind: 'descriptor', category: 'default' },
      { name: 'Flaw', kind: 'descriptor', category: 'default' },
    ]);
  });

  it('keeps species kind omitted (no header badge, no expanded chip)', () => {
    const row = defined(
      mapTraitRows(
        [{ name: 'Darkvision', category: 'species', description: 'See in the dark.' }],
        ctx,
      )[0],
    );

    expect(row.badges).toBeUndefined();
    expect(row.detailSections).toBeUndefined();
  });
});

describe('mapFeatRows — state-feat header badges stay (TASK-779)', () => {
  it('still accepts collapsed Archetype / Character badges', () => {
    const row = defined(
      mapFeatRows([{ name: 'Focused' }], ctx, {
        badge: { label: 'Archetype', color: 'blue' },
      })[0],
    );

    expect(row.badges).toEqual([{ label: 'Archetype', color: 'blue' }]);
    expect(row.detailSections).toBeUndefined();
  });
});

describe('mapFeatRows / mapTraitRows — play vs edit customization (TASK-783)', () => {
  const playFeat = {
    name: 'Elemental Adept',
    customName: 'Flame Tongue',
    note: 'Chosen fire',
    description: 'Pick an element.',
  };
  const editCtx: FeatRowContext = {
    showEditControls: true,
    traitUses: {},
    onFeatCustomizationChange: () => {},
    onTraitCustomizationChange: () => {},
  };

  it('play view: note is descriptionAfter; no customize chrome; custom name stays the title', () => {
    const row = defined(mapFeatRows([playFeat], ctx)[0]);

    expect(row.name).toBe('Flame Tongue');
    expect(row.nameContent).toBeTruthy();
    expect(row.descriptionAfter).toBe('Chosen fire');
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.description).toBe('Pick an element.');
  });

  it('play view: custom name only does not invent a note or customize block', () => {
    const row = defined(
      mapFeatRows(
        [{ name: 'Elemental Adept', customName: 'Flame Tongue', description: 'Pick an element.' }],
        ctx,
      )[0],
    );

    expect(row.descriptionAfter).toBeUndefined();
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.nameContent).toBeTruthy();
  });

  it('edit mode: Customize block is supplemental; note is not inlined', () => {
    const row = defined(mapFeatRows([playFeat], editCtx)[0]);

    expect(row.descriptionAfter).toBeUndefined();
    expect(row.supplementalExpandedContent).toBeTruthy();
    expect(row.nameContent).toBeTruthy();
  });

  it('traits share the same play-view note slot', () => {
    const row = defined(
      mapTraitRows(
        [
          {
            name: 'Curious',
            category: 'characteristic',
            customName: 'Always Asking',
            note: 'Ask about the mural.',
            description: 'You ask why.',
          },
        ],
        ctx,
      )[0],
    );

    expect(row.badges).toBeUndefined();
    expect(row.detailSections?.[0]?.chips[0]?.name).toBe('Characteristic');
    expect(row.descriptionAfter).toBe('Ask about the mural.');
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.name).toBe('Always Asking');
  });
});

describe('feat/trait Customize draft (TASK-805)', () => {
  it('treats empty committed as empty string so spaces are kept until blur', () => {
    expect(customizationDraftDiffers('Flame', 'Flame')).toBe(false);
    expect(customizationDraftDiffers('Flame ', 'Flame')).toBe(true);
    expect(customizationDraftDiffers('', undefined)).toBe(false);
    expect(customizationDraftDiffers('A', undefined)).toBe(true);
  });

  it('uses a stable traitKey-based row id so name-sort cannot swap Customize fields', () => {
    const rows = mapTraitRows(
      [
        { name: 'Zebra Trait', traitKey: 'trait-z', category: 'ancestry' },
        { name: 'Apple Trait', traitKey: 'trait-a', category: 'ancestry' },
      ],
      ctx,
    );

    expect(rows.map((row) => row.id)).toEqual([
      traitRowId('ancestry', 'trait-z'),
      traitRowId('ancestry', 'trait-a'),
    ]);
    expect(defined(rows[0]).id).not.toBe('ancestry-0');
  });
});

describe('feat/trait columns omit empty uses and recovery (TASK-868)', () => {
  it('does not paint a Uses or Recovery dash when both are empty', () => {
    const row = defined(mapFeatRows([{ name: 'Focused', description: 'Stay on target.' }], ctx)[0]);
    expect(row.columns?.some((col) => col.key === 'uses' || col.key === 'recovery')).toBe(false);
    expect(row.columns?.some((col) => col.value === '-')).toBe(false);
  });

  it('keeps valued recovery without a uses dash', () => {
    const row = defined(
      mapFeatRows(
        [{ name: 'Second Wind', description: 'Catch a breath.', recovery: 'Partial Recovery' }],
        ctx,
      )[0],
    );
    const uses = row.columns?.find((col) => col.key === 'uses');
    const recovery = row.columns?.find((col) => col.key === 'recovery');
    expect(uses?.value).toBeNull();
    expect(recovery?.value).toBe('PR');
  });
});
