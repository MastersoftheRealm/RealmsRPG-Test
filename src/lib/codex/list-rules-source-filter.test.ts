import { describe, expect, it } from 'vitest';
import {
  countActiveCodexRulesSourceFilters,
  filterRowsByCodexRulesSources,
  readRowRulesSources,
  rowMatchesCodexRulesSourceFilter,
} from './list-rules-source-filter';

describe('list-rules-source-filter', () => {
  it('counts active only when chips are selected', () => {
    expect(countActiveCodexRulesSourceFilters([])).toBe(0);
    expect(countActiveCodexRulesSourceFilters(['core'])).toBe(1);
    expect(countActiveCodexRulesSourceFilters(['core', 'crafting'])).toBe(1);
  });

  it('filters rows with itemMatchesSources semantics', () => {
    const rows = [{ id: 'a', sources: ['core'] }, { id: 'b', sources: ['crafting'] }, { id: 'c' }];
    expect(filterRowsByCodexRulesSources(rows, [], (r) => r.sources).map((r) => r.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(
      filterRowsByCodexRulesSources(rows, ['crafting'], (r) => r.sources).map((r) => r.id),
    ).toEqual(['b']);
    expect(
      filterRowsByCodexRulesSources(rows, ['core'], (r) => r.sources).map((r) => r.id),
    ).toEqual(['a', 'c']);
  });

  it('reads sources from row or nested raw', () => {
    expect(readRowRulesSources({ sources: ['core'] })).toEqual(['core']);
    expect(readRowRulesSources({ raw: { sources: ['harvesting'] } })).toEqual(['harvesting']);
    expect(rowMatchesCodexRulesSourceFilter(undefined, ['core'])).toBe(true);
  });
});
