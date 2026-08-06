import { describe, expect, it } from 'vitest';
import { sortByColumn } from './use-sort';

describe('sortByColumn', () => {
  it('sorts creature level numerically (¼ < ½ < 1)', () => {
    const rows = [
      { name: 'b', level: 0.5 },
      { name: 'a', level: 0.25 },
      { name: 'c', level: 1 },
    ];

    const sorted = sortByColumn(rows, { col: 'level', dir: 1 });
    expect(sorted.map((r) => r.level)).toEqual([0.25, 0.5, 1]);
  });

  it('sorts formatted level column values from GridListRow columns', () => {
    const rows = [
      {
        name: 'b',
        columns: [{ key: 'level', value: '½' }],
      },
      {
        name: 'a',
        columns: [{ key: 'level', value: '¼' }],
      },
      {
        name: 'c',
        columns: [{ key: 'level', value: '1' }],
      },
    ];

    const sorted = sortByColumn(rows, { col: 'level', dir: 1 });
    expect(sorted.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });
});
