/**
 * Id allocation must skip retired ids. Feat 248 was deleted and reallocated 26 minutes later,
 * so every character that had taken it silently resolved to a different feat.
 */

import { describe, expect, it } from 'vitest';
import { FakeSupabase } from './fake-supabase';
import {
  allocateCodexNumericId,
  lowestUnusedNumericId,
  parseNumericId,
  retireCodexId,
} from './codex-id-allocation';

describe('lowestUnusedNumericId', () => {
  it('fills a gap that was never used', () => {
    expect(lowestUnusedNumericId(new Set([1, 3]))).toBe('2');
  });

  it('appends when every id is taken', () => {
    expect(lowestUnusedNumericId(new Set([1, 2, 3]))).toBe('4');
  });

  it('starts at 1 for an empty table', () => {
    expect(lowestUnusedNumericId(new Set())).toBe('1');
  });
});

describe('parseNumericId', () => {
  it.each([
    ['12', 12],
    ['0', null],
    ['-1', null],
    ['abc', null],
    ['1.5', null],
  ])('parses %s', (input, expected) => {
    expect(parseNumericId(input)).toBe(expected);
  });
});

describe('allocateCodexNumericId', () => {
  it('skips ids held by live rows and by tombstoned deletes', async () => {
    const db = new FakeSupabase({
      codex_feats: [{ id: '1' }, { id: '3' }],
      codex_retired_ids: [{ entity_type: 'codex_feats', id: '2' }],
    });

    await expect(allocateCodexNumericId(db as never, 'codex_feats')).resolves.toBe('4');
  });

  it('keeps allocating when the tombstone table is missing', async () => {
    const db = new FakeSupabase({ codex_feats: [{ id: '1' }] });

    await expect(allocateCodexNumericId(db as never, 'codex_feats')).resolves.toBe('2');
  });

  it('tombstones a deleted id under its entity type', async () => {
    const db = new FakeSupabase({ codex_retired_ids: [] });

    await retireCodexId(db as never, 'codex_species', '7');

    expect(db.tables.codex_retired_ids).toEqual([{ entity_type: 'codex_species', id: '7' }]);
  });

  it('never throws when the tombstone write fails', async () => {
    const db = new FakeSupabase({});

    await expect(retireCodexId(db as never, 'codex_species', '7')).resolves.toBeUndefined();
  });
});
