import { describe, expect, it } from 'vitest';
import { escapeIlikePattern } from './ilike-pattern';

describe('escapeIlikePattern', () => {
  it('escapes %, _, and backslash', () => {
    expect(escapeIlikePattern('%a_b\\c')).toBe('\\%a\\_b\\\\c');
  });
});
