import { describe, expect, it } from 'vitest';
import { collectStoredCategoryLabels } from '@/lib/codex/feat-list';
import {
  EMPTY_CREATURE_FEAT_FORM,
  computeNextCreatureFeatFormState,
  creatureFeatFormToSavePayload,
  creatureFeatToFormState,
} from './admin-creature-feat-form';

describe('computeNextCreatureFeatFormState', () => {
  it('raises the feat level and points at the level-1 creature feat without changing required level', () => {
    const next = computeNextCreatureFeatFormState(
      {
        ...EMPTY_CREATURE_FEAT_FORM,
        name: 'Speedy',
        feat_lvl: 1,
        lvl_req: 3,
        category: 'Movement',
      },
      '36',
    );
    expect(next.feat_lvl).toBe(2);
    expect(next.base_feat_id).toBe('36');
    expect(next.lvl_req).toBe(3);
    expect(next.category).toBe('Movement');
  });

  it('keeps the existing family base when the source is already a higher level', () => {
    const next = computeNextCreatureFeatFormState(
      {
        ...EMPTY_CREATURE_FEAT_FORM,
        name: 'Speedy II',
        feat_lvl: 2,
        base_feat_id: '36',
        lvl_req: 3,
      },
      '37',
    );
    expect(next.feat_lvl).toBe(3);
    expect(next.base_feat_id).toBe('36');
    expect(next.lvl_req).toBe(3);
  });

  it('adds the tier after the highest existing level when the source row is still level 1', () => {
    const family = [
      { id: '36', feat_lvl: 1 },
      { id: '37', feat_lvl: 2, base_feat_id: '36' },
    ];
    const next = computeNextCreatureFeatFormState(
      {
        ...EMPTY_CREATURE_FEAT_FORM,
        name: 'Speedy',
        feat_lvl: 1,
        lvl_req: 3,
      },
      '36',
      family,
    );
    expect(next.feat_lvl).toBe(3);
    expect(next.base_feat_id).toBe('36');
  });
});

describe('creatureFeatFormToSavePayload', () => {
  it('stores the trimmed category and clears an empty one', () => {
    expect(
      creatureFeatFormToSavePayload({
        ...EMPTY_CREATURE_FEAT_FORM,
        name: ' Speedy ',
        category: ' Movement ',
        base_feat_id: '36',
      }),
    ).toMatchObject({
      name: 'Speedy',
      category: 'Movement',
      base_feat_id: '36',
    });
    expect(
      creatureFeatFormToSavePayload({ ...EMPTY_CREATURE_FEAT_FORM, name: 'Speedy', category: '  ' })
        .category,
    ).toBeNull();
  });
});

describe('creatureFeatToFormState', () => {
  it('reads the stored category from the creature feat row', () => {
    expect(
      creatureFeatToFormState({
        id: '36',
        name: 'Speedy',
        description: '',
        category: ' Movement ',
        points: 1,
      }).category,
    ).toBe('Movement');
  });
});

describe('collectStoredCategoryLabels', () => {
  it('uses the values stored on the rows', () => {
    expect(collectStoredCategoryLabels([' Movement ', '', null, 'Senses', 'Movement'])).toEqual([
      'Movement',
      'Senses',
    ]);
  });
});
