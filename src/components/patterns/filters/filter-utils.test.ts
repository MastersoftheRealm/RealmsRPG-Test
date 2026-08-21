import { describe, expect, it } from 'vitest';
import {
  FILTER_CONTROL_CLASS,
  FILTER_CONTROL_ROW_CLASS,
  FILTER_LABEL_ROW_CLASS,
} from './filter-utils';

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
