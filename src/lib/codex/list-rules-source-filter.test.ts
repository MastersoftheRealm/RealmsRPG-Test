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
    expect(countActiveCodexRulesSourceFilters(['Core'])).toBe(1);
    expect(countActiveCodexRulesSourceFilters(['Core', 'Crafting'])).toBe(1);
  });

  it('filters rows with itemMatchesSources semantics', () => {
    const rows = [{ id: 'a', sources: ['Core'] }, { id: 'b', sources: ['Crafting'] }, { id: 'c' }];
    expect(filterRowsByCodexRulesSources(rows, [], (r) => r.sources).map((r) => r.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(
      filterRowsByCodexRulesSources(rows, ['Crafting'], (r) => r.sources).map((r) => r.id),
    ).toEqual(['b']);
    expect(
      filterRowsByCodexRulesSources(rows, ['Core'], (r) => r.sources).map((r) => r.id),
    ).toEqual(['a', 'c']);
  });

  it('reads sources from row or nested raw', () => {
    expect(readRowRulesSources({ sources: ['Core'] })).toEqual(['Core']);
    expect(readRowRulesSources({ raw: { sources: ['Harvesting'] } })).toEqual(['Harvesting']);
    expect(rowMatchesCodexRulesSourceFilter(undefined, ['Core'])).toBe(true);
  });
});
