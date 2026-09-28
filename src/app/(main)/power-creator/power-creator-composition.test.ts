import { describe, expect, it } from 'vitest';
import { buildCompositionPayload, emptyTabForm } from './power-creator-composition';

describe('Modify variant tabs', () => {
  it('does not save Shared mechanics or Shared parts onto an untouched piece', () => {
    const shared = emptyTabForm();
    shared.range = { steps: 2 };
    shared.area = { type: 'sphere', level: 2, applyDuration: false };
    shared.duration = { ...shared.duration, type: 'rounds', value: 2 };
    shared.selectedParts = [
      {
        part: { id: '910', name: 'Restrained' },
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ] as typeof shared.selectedParts;

    const payload = buildCompositionPayload({
      structure: 'modify',
      reverseEnabled: false,
      shared,
      variants: [
        {
          id: 'v1',
          label: 'Variant 1',
          polarity: 'positive',
          description: '',
          form: emptyTabForm(),
        },
      ],
      reverse: emptyTabForm(),
      dieSides: 2,
      dieFaces: ['', ''],
    });

    expect(payload?.variants).toEqual([{ id: 'v1', label: 'Variant 1' }]);
  });
});
