import { describe, expect, it } from 'vitest';
import {
  dedupeSelectOptions,
  FILTER_CONTROL_CLASS,
  FILTER_CONTROL_ROW_CLASS,
  FILTER_LABEL_ROW_CLASS,
  shouldShowSelectPlaceholder,
} from './filter-utils';

describe('filter option lists (86e1vtgpy)', () => {
  it('dedupes options by value', () => {
    const opts = dedupeSelectOptions([
      { value: 'hide', label: 'Hide Mechanics' },
      { value: 'hide', label: 'Hide Mechanics' },
      { value: 'only', label: 'Only Mechanics' },
    ]);
    expect(opts).toHaveLength(2);
    expect(opts.map((o) => o.value)).toEqual(['hide', 'only']);
  });

  it('skips synthetic placeholder when options already use all or empty sentinels', () => {
    expect(shouldShowSelectPlaceholder('All parts', [{ value: 'all', label: 'All Parts' }])).toBe(
      false,
    );
    expect(shouldShowSelectPlaceholder('All parts', [{ value: '', label: 'All parts' }])).toBe(
      false,
    );
    expect(
      shouldShowSelectPlaceholder('All parts', [{ value: 'only', label: 'Only Mechanics' }]),
    ).toBe(true);
  });
});

describe('filter control chrome (TASK-725)', () => {
  it('shares h-11 rounded-md field chrome for inputs and selects', () => {
    expect(FILTER_CONTROL_CLASS).toContain('h-11');
    expect(FILTER_CONTROL_CLASS).toContain('rounded-md');
    expect(FILTER_CONTROL_CLASS).toContain('border-border-light');
  });

  it('keeps checkbox rows at min-h-11 with the same radius', () => {
    expect(FILTER_CONTROL_ROW_CLASS).toContain('min-h-11');
    expect(FILTER_CONTROL_ROW_CLASS).toContain('rounded-md');
  });

  it('pins filter labels to a one-line h-5 track', () => {
    expect(FILTER_LABEL_ROW_CLASS).toContain('h-5');
  });
});
