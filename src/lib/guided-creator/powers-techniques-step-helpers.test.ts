import { describe, expect, it } from 'vitest';
import {
  applyInnateSelection,
  buildLookup,
  innateSelectionBlockMessage,
  pickAffordableIds,
  pickInnateFillIds,
  resolveLibraryItem,
} from '@/lib/guided-creator/powers-techniques-step-helpers';
import type { LibraryPower } from '@/types/library';

describe('pickAffordableIds', () => {
  const costOf = (id: string) => Number(id.replace('item-', ''));

  it('picks ids in order while staying within the budget', () => {
    expect(pickAffordableIds(['item-3', 'item-2', 'item-5'], costOf, 0, 10)).toEqual([
      'item-3',
      'item-2',
      'item-5',
    ]);
  });

  it('skips later items when the running total would exceed the limit', () => {
    expect(pickAffordableIds(['item-8', 'item-2', 'item-1'], costOf, 0, 10)).toEqual([
      'item-8',
      'item-2',
    ]);
  });

  it('accounts for already-spent budget', () => {
    expect(pickAffordableIds(['item-3', 'item-2'], costOf, 8, 10)).toEqual(['item-2']);
  });

  it('returns empty when nothing fits', () => {
    expect(pickAffordableIds(['item-5', 'item-6'], costOf, 9, 10)).toEqual([]);
  });

  it('returns empty for an empty input list', () => {
    expect(pickAffordableIds([], costOf, 0, 10)).toEqual([]);
  });
});

describe('pickInnateFillIds', () => {
  const energyOf = (id: string) => {
    const map: Record<string, number | undefined> = {
      high: 4,
      mid: 2,
      low: 1,
      over: 5,
      unknown: undefined,
      negative: -1,
    };
    return map[id];
  };
  const tpOf = (id: string) => (id === 'high' ? 3 : 1);

  it('prefers higher energy within threshold and fills toward energyMax', () => {
    expect(pickInnateFillIds(['low', 'mid', 'high'], energyOf, tpOf, 4, 5, 0, 10)).toEqual([
      'high',
      'low',
    ]);
  });

  it('stops when innate energy is fully allocated', () => {
    expect(pickInnateFillIds(['mid', 'low', 'high'], energyOf, tpOf, 4, 4, 0, 10)).toEqual([
      'high',
    ]);
  });

  it('skips candidates above threshold or with unknown energy', () => {
    expect(pickInnateFillIds(['over', 'unknown', 'low'], energyOf, tpOf, 4, 5, 0, 10)).toEqual([
      'low',
    ]);
  });

  it('skips negative energy values', () => {
    expect(pickInnateFillIds(['negative', 'low'], energyOf, tpOf, 4, 5, 0, 10)).toEqual(['low']);
  });

  it('respects shared Training Points budget', () => {
    expect(pickInnateFillIds(['mid', 'low'], energyOf, tpOf, 4, 5, 9, 10)).toEqual(['mid']);
    expect(pickInnateFillIds(['high', 'low'], energyOf, tpOf, 4, 5, 9, 10)).toEqual(['low']);
  });

  it('returns empty when no candidate fits energy or TP constraints', () => {
    expect(pickInnateFillIds(['high', 'mid'], energyOf, tpOf, 4, 1, 0, 10)).toEqual([]);
    expect(pickInnateFillIds(['low'], energyOf, tpOf, 4, 5, 10, 10)).toEqual([]);
  });
});

describe('applyInnateSelection', () => {
  const energyOf = (id: string): number | undefined => {
    const map: Record<string, number | undefined> = {
      a4: 4,
      b2: 2,
      c3: 3,
      d5: 5,
      e1: 1,
      f2: 2,
      over: 7,
      unknown: undefined,
      negative: -1,
    };
    return map[id];
  };
  const tpOf = (id: string) => (id === 'd5' ? 4 : 1);

  const base = {
    energyOf,
    tpOf,
    threshold: 6,
    energyMax: 6,
    otherTpSpent: 0,
    tpLimit: 10,
  };

  it('appends when the pick fits remaining Innate Energy', () => {
    expect(applyInnateSelection({ ...base, selectedIds: ['b2'], id: 'c3' })).toEqual({
      ok: true,
      nextIds: ['b2', 'c3'],
    });
  });

  it('swaps the last-selected pick when at energy cap (1-for-1)', () => {
    expect(applyInnateSelection({ ...base, selectedIds: ['a4', 'b2'], id: 'f2' })).toEqual({
      ok: true,
      nextIds: ['a4', 'f2'],
    });
  });

  it('keeps dropping last-in until the new pick fits', () => {
    expect(applyInnateSelection({ ...base, selectedIds: ['a4', 'b2'], id: 'd5' })).toEqual({
      ok: true,
      nextIds: ['d5'],
    });
  });

  it('does not drop an earlier pick when dropping last-in is enough', () => {
    expect(
      applyInnateSelection({
        ...base,
        selectedIds: ['e1', 'a4'],
        id: 'c3',
      }),
    ).toEqual({ ok: true, nextIds: ['e1', 'c3'] });
  });

  it('blocks over-threshold picks without changing the selection', () => {
    expect(applyInnateSelection({ ...base, selectedIds: ['b2'], id: 'over' })).toEqual({
      ok: false,
      reason: 'threshold',
    });
  });

  it('blocks unknown or negative energy as threshold-ineligible', () => {
    expect(applyInnateSelection({ ...base, selectedIds: [], id: 'unknown' })).toEqual({
      ok: false,
      reason: 'threshold',
    });
    expect(applyInnateSelection({ ...base, selectedIds: [], id: 'negative' })).toEqual({
      ok: false,
      reason: 'threshold',
    });
  });

  it('blocks a pick that cannot fit Innate Energy alone', () => {
    expect(
      applyInnateSelection({
        ...base,
        energyMax: 4,
        threshold: 6,
        selectedIds: [],
        id: 'd5',
      }),
    ).toEqual({ ok: false, reason: 'energy' });
  });

  it('does not drop extra innates just to free Training Points', () => {
    expect(
      applyInnateSelection({
        ...base,
        selectedIds: ['a4', 'b2'],
        id: 'e1',
        otherTpSpent: 9,
        tpLimit: 10,
      }),
    ).toEqual({ ok: false, reason: 'tp' });
  });

  it('allows a swap when dropping last-in frees enough Training Points', () => {
    expect(
      applyInnateSelection({
        ...base,
        selectedIds: ['d5'],
        id: 'c3',
        otherTpSpent: 9,
        tpLimit: 10,
      }),
    ).toEqual({ ok: true, nextIds: ['c3'] });
  });
});

describe('buildLookup / resolveLibraryItem', () => {
  const spark = {
    id: 'p1',
    docId: 'spark-doc',
    name: 'Spark Bolt',
    parts: [],
  } as LibraryPower;

  it('resolves by id, docId, and name (case-insensitive)', () => {
    const lookup = buildLookup([spark]);
    expect(resolveLibraryItem('p1', lookup)?.name).toBe('Spark Bolt');
    expect(resolveLibraryItem('spark-doc', lookup)?.name).toBe('Spark Bolt');
    expect(resolveLibraryItem('Spark Bolt', lookup)?.name).toBe('Spark Bolt');
    expect(resolveLibraryItem('SPARK-DOC', lookup)?.name).toBe('Spark Bolt');
  });
});

describe('innateSelectionBlockMessage', () => {
  it('maps block reasons onto powersTechniques copy', () => {
    expect(innateSelectionBlockMessage('threshold')).toBe(
      'That power exceeds your Innate Threshold.',
    );
    expect(innateSelectionBlockMessage('energy')).toBe(
      'Not enough Innate Energy remaining for that choice.',
    );
    expect(innateSelectionBlockMessage('tp')).toBe(
      'Not enough Training Points remaining for that choice.',
    );
  });
});
