import { describe, expect, it } from 'vitest';
import { coerceSavedPartId } from './saved-part-id';

describe('coerceSavedPartId', () => {
  it('keeps finite numbers', () => {
    expect(coerceSavedPartId(6)).toBe(6);
  });

  it('coerces numeric strings', () => {
    expect(coerceSavedPartId('6')).toBe(6);
    expect(coerceSavedPartId(' 211 ')).toBe(211);
  });

  it('coerces legacy s-prefix ids to numbers', () => {
    expect(coerceSavedPartId('s377')).toBe(377);
  });

  it('preserves non-numeric string ids', () => {
    expect(coerceSavedPartId('custom-part')).toBe('custom-part');
  });
});
