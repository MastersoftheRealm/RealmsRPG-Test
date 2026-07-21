import { describe, expect, it } from 'vitest';
import { pickAffordableIds, pickInnateFillIds } from '@/lib/guided-creator/powers-techniques-step-helpers';

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
    expect(
      pickInnateFillIds(['low', 'mid', 'high'], energyOf, tpOf, 4, 5, 0, 10)
    ).toEqual(['high', 'low']);
  });

  it('stops when innate energy is fully allocated', () => {
    expect(
      pickInnateFillIds(['mid', 'low', 'high'], energyOf, tpOf, 4, 4, 0, 10)
    ).toEqual(['high']);
  });

  it('skips candidates above threshold or with unknown energy', () => {
    expect(
      pickInnateFillIds(['over', 'unknown', 'low'], energyOf, tpOf, 4, 5, 0, 10)
    ).toEqual(['low']);
  });

  it('skips negative energy values', () => {
    expect(
      pickInnateFillIds(['negative', 'low'], energyOf, tpOf, 4, 5, 0, 10)
    ).toEqual(['low']);
  });

  it('respects shared Training Points budget', () => {
    expect(
      pickInnateFillIds(['mid', 'low'], energyOf, tpOf, 4, 5, 9, 10)
    ).toEqual(['mid']);
    expect(
      pickInnateFillIds(['high', 'low'], energyOf, tpOf, 4, 5, 9, 10)
    ).toEqual(['low']);
  });

  it('returns empty when no candidate fits energy or TP constraints', () => {
    expect(
      pickInnateFillIds(['high', 'mid'], energyOf, tpOf, 4, 1, 0, 10)
    ).toEqual([]);
    expect(
      pickInnateFillIds(['low'], energyOf, tpOf, 4, 5, 10, 10)
    ).toEqual([]);
  });
});
