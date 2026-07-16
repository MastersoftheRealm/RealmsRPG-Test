import { describe, expect, it } from 'vitest';
import {
  parseOptionalJsonField,
  parseIdQuantityStrings,
  serializeIdQuantityStrings,
  parseRecommendedAbilities,
} from '@/lib/game/archetype-path';

describe('parseOptionalJsonField', () => {
  it('treats empty / whitespace as null (ok)', () => {
    expect(parseOptionalJsonField('', 'Recommended abilities')).toEqual({ ok: true, value: null });
    expect(parseOptionalJsonField('   ', 'Recommended abilities')).toEqual({ ok: true, value: null });
  });

  it('parses valid JSON object', () => {
    expect(parseOptionalJsonField('{"strength": 3}', 'Recommended abilities')).toEqual({
      ok: true,
      value: { strength: 3 },
    });
  });

  it('returns labeled error for invalid JSON', () => {
    const result = parseOptionalJsonField('{ not json', 'Advanced Path JSON');
    expect(result).toEqual({ ok: false, error: 'Advanced Path JSON must be valid JSON.' });
  });
});

describe('parseIdQuantityStrings', () => {
  it('parses bare ids with default quantity 1', () => {
    expect(parseIdQuantityStrings(['sword', 'shield'])).toEqual([
      { id: 'sword', quantity: 1 },
      { id: 'shield', quantity: 1 },
    ]);
  });

  it('parses id:qty and clamps invalid/low quantities to 1', () => {
    expect(parseIdQuantityStrings(['torch:5', 'ration:0', 'rope:abc'])).toEqual([
      { id: 'torch', quantity: 5 },
      { id: 'ration', quantity: 1 },
      { id: 'rope', quantity: 1 },
    ]);
  });

  it('drops empty ids and trims whitespace', () => {
    expect(parseIdQuantityStrings([' axe : 2 ', '', ':3'])).toEqual([{ id: 'axe', quantity: 2 }]);
  });
});

describe('serializeIdQuantityStrings', () => {
  it('omits :qty when quantity is 1 and keeps it otherwise', () => {
    expect(
      serializeIdQuantityStrings([
        { id: 'sword', quantity: 1 },
        { id: 'torch', quantity: 5 },
      ])
    ).toEqual(['sword', 'torch:5']);
  });

  it('round-trips through parseIdQuantityStrings', () => {
    const entries = [
      { id: 'sword', quantity: 1 },
      { id: 'torch', quantity: 3 },
    ];
    expect(parseIdQuantityStrings(serializeIdQuantityStrings(entries))).toEqual(entries);
  });
});

describe('parseRecommendedAbilities', () => {
  it('keeps only known ability keys with finite values', () => {
    expect(
      parseRecommendedAbilities({ strength: 3, vitality: '2', bogus: 9, charisma: NaN })
    ).toEqual({ strength: 3, vitality: 2 });
  });

  it('returns undefined for empty / non-object input', () => {
    expect(parseRecommendedAbilities({})).toBeUndefined();
    expect(parseRecommendedAbilities(null)).toBeUndefined();
    expect(parseRecommendedAbilities('nope')).toBeUndefined();
  });
});
