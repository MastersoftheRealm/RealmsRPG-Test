import { describe, expect, it } from 'vitest';
import { defined, isDefined } from '@/lib/utils';

describe('defined', () => {
  it('returns the value when it is defined', () => {
    expect(defined('ok')).toBe('ok');
    expect(defined(0)).toBe(0);
    expect(defined(null)).toBeNull();
  });

  it('throws when the value is undefined', () => {
    expect(() => defined(undefined)).toThrow('Expected a defined value');
    expect(() => defined(undefined, 'missing row')).toThrow('missing row');
  });
});

describe('isDefined', () => {
  it('narrows undefined out of arrays', () => {
    expect(['a', undefined, 'b'].filter(isDefined)).toEqual(['a', 'b']);
  });
});
