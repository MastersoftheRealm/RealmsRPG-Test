import { describe, expect, it } from 'vitest';
import { findCollateralNulls } from './check-codex-drift.mjs';

function log(overrides) {
  return {
    id: 'log-1',
    entity_type: 'feats',
    entity_id: '248',
    operation: 'update',
    changed_at: '2026-04-20T17:56:00Z',
    before_data: {},
    after_data: {},
    changed_fields: [],
    ...overrides,
  };
}

describe('findCollateralNulls', () => {
  it('reports a value-to-null change the app never recorded', () => {
    const losses = findCollateralNulls(
      log({
        before_data: { name: 'Flawless Fighter', mart_prof_req: 3 },
        after_data: { name: 'Flawless Fighter', mart_prof_req: null },
        changed_fields: [{ field: 'name', before: 'Flawless Fighter', after: 'Flawless Fighter' }],
      }),
    );
    expect(losses).toEqual([{ field: 'mart_prof_req', before: 3 }]);
  });

  it('ignores a null the app recorded as a deliberate edit', () => {
    const losses = findCollateralNulls(
      log({
        before_data: { op_1_desc: '+2 EN to extend this to one hour' },
        after_data: { op_1_desc: null },
        changed_fields: [
          { field: 'op_1_desc', before: '+2 EN to extend this to one hour', after: null },
        ],
      }),
    );
    expect(losses).toEqual([]);
  });

  it('ignores delete-shaped rows where after_data has no keys', () => {
    const losses = findCollateralNulls(
      log({ before_data: { name: 'Flawless Fighter', mart_prof_req: 3 }, after_data: {} }),
    );
    expect(losses).toEqual([]);
  });

  it('ignores creates and deletes', () => {
    const before = { before_data: { a: 1 }, after_data: { a: null } };
    expect(findCollateralNulls(log({ ...before, operation: 'create' }))).toEqual([]);
    expect(findCollateralNulls(log({ ...before, operation: 'delete' }))).toEqual([]);
  });

  it('treats blank-to-null as no loss but keeps 0 and false as real values', () => {
    const losses = findCollateralNulls(
      log({
        before_data: { blank: '   ', zero: 0, flag: false },
        after_data: { blank: null, zero: null, flag: null },
      }),
    );
    expect(losses.map((loss) => loss.field)).toEqual(['zero', 'flag']);
  });

  it('accepts changed_fields recorded as plain field names', () => {
    const losses = findCollateralNulls(
      log({ before_data: { tags: 'a,b' }, after_data: { tags: null }, changed_fields: ['tags'] }),
    );
    expect(losses).toEqual([]);
  });
});
