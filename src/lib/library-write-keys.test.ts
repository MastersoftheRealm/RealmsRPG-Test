import { describe, expect, it } from 'vitest';
import { bodyToColumnar } from '@/lib/library-columnar';
import { unknownLibraryBodyKeys } from '@/lib/library-write-keys';

describe('library-write-keys', () => {
  it('flags unknown top-level library keys', () => {
    expect(unknownLibraryBodyKeys('powers', { name: 'Bolt', injected: true })).toEqual([
      'injected',
    ]);
  });

  it('does not persist unknown keys into the columnar payload', () => {
    const { payload } = bodyToColumnar('powers', {
      name: 'Bolt',
      parts: [],
      damage: [],
      injected: 'x',
    });
    expect(payload.injected).toBeUndefined();
  });
});
