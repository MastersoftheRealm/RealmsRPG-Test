import { describe, expect, it } from 'vitest';
import { mapFeatRows, mapTraitRows, type FeatRowContext } from './library-feat-rows';

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
    const [row] = mapTraitRows(
      [{ name: 'Darkvision', category: 'species', description: 'See in the dark.' }],
      ctx,
    );

    expect(row.badges).toBeUndefined();
    expect(row.detailSections).toBeUndefined();
  });
});

describe('mapFeatRows — state-feat header badges stay (TASK-779)', () => {
  it('still accepts collapsed Archetype / Character badges', () => {
    const [row] = mapFeatRows([{ name: 'Focused' }], ctx, {
      badge: { label: 'Archetype', color: 'blue' },
    });

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
    const [row] = mapFeatRows([playFeat], ctx);

    expect(row.name).toBe('Flame Tongue');
    expect(row.nameContent).toBeTruthy();
    expect(row.descriptionAfter).toBe('Chosen fire');
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.description).toBe('Pick an element.');
  });

  it('play view: custom name only does not invent a note or customize block', () => {
    const [row] = mapFeatRows(
      [{ name: 'Elemental Adept', customName: 'Flame Tongue', description: 'Pick an element.' }],
      ctx,
    );

    expect(row.descriptionAfter).toBeUndefined();
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.nameContent).toBeTruthy();
  });

  it('edit mode: Customize block is supplemental; note is not inlined', () => {
    const [row] = mapFeatRows([playFeat], editCtx);

    expect(row.descriptionAfter).toBeUndefined();
    expect(row.supplementalExpandedContent).toBeTruthy();
    expect(row.nameContent).toBeTruthy();
  });

  it('traits share the same play-view note slot', () => {
    const [row] = mapTraitRows(
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
    );

    expect(row.badges).toBeUndefined();
    expect(row.detailSections?.[0]?.chips[0]?.name).toBe('Characteristic');
    expect(row.descriptionAfter).toBe('Ask about the mural.');
    expect(row.supplementalExpandedContent).toBeUndefined();
    expect(row.name).toBe('Always Asking');
  });
});
