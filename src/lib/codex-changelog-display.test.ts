import { describe, expect, it } from 'vitest';
import {
  formatCodexChangeValue,
  parseChangedFields,
  summarizeChangedFieldNames,
} from './codex-changelog-display';

describe('codex-changelog-display (TASK-874)', () => {
  it('formats primitives and truncates long strings', () => {
    expect(formatCodexChangeValue(null)).toBe('—');
    expect(formatCodexChangeValue('Fireball')).toBe('Fireball');
    expect(formatCodexChangeValue(3)).toBe('3');
    expect(formatCodexChangeValue('x'.repeat(200)).endsWith('…')).toBe(true);
  });

  it('parses changed_fields rows', () => {
    expect(
      parseChangedFields([
        { field: 'name', before: 'Old', after: 'New' },
        { field: 'description', before: null, after: 'Text' },
      ]),
    ).toEqual([
      { field: 'name', before: 'Old', after: 'New' },
      { field: 'description', before: null, after: 'Text' },
    ]);
  });

  it('summarizes field names for list rows', () => {
    const changes = parseChangedFields([
      { field: 'name', before: 'A', after: 'B' },
      { field: 'category', before: 'X', after: 'Y' },
    ]);
    expect(summarizeChangedFieldNames(changes)).toBe('name, category');
    expect(
      summarizeChangedFieldNames(
        parseChangedFields([
          { field: 'a', before: 1, after: 2 },
          { field: 'b', before: 1, after: 2 },
          { field: 'c', before: 1, after: 2 },
          { field: 'd', before: 1, after: 2 },
          { field: 'e', before: 1, after: 2 },
        ]),
      ),
    ).toBe('a, b, c +2 more');
  });
});
