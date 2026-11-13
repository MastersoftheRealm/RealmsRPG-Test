import { describe, expect, it } from 'vitest';
import { computeNextLevelFormState, EMPTY_FEAT_FORM } from './admin-feat-form';

describe('computeNextLevelFormState', () => {
  it('adds the tier after the highest existing level when the source row is still level 1', () => {
    const family = [
      { id: '10', feat_lvl: 1 },
      { id: '11', feat_lvl: 2, base_feat_id: '10' },
    ];
    const next = computeNextLevelFormState(
      {
        ...EMPTY_FEAT_FORM,
        name: 'Iron Skin',
        feat_lvl: 1,
        lvl_req: 2,
      },
      '10',
      family,
    );
    expect(next.feat_lvl).toBe(3);
    expect(next.base_feat_id).toBe('10');
    expect(next.lvl_req).toBe(6);
  });
});
