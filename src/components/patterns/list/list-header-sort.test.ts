import { describe, expect, it } from 'vitest';
import { columnSortAccessibleName } from './list-header';

describe('columnSortAccessibleName (86e3k0jwe)', () => {
  it('names the direction on the active column only', () => {
    expect(columnSortAccessibleName('Name', true, 1)).toBe('Name, sorted ascending');
    expect(columnSortAccessibleName('Name', true, -1)).toBe('Name, sorted descending');
    expect(columnSortAccessibleName('Name', false, 1)).toBeUndefined();
  });
});
