import { describe, expect, it } from 'vitest';
import { LOAD_FROM_LIBRARY_MODAL_SIZE } from './LoadFromLibraryModal';

describe('load modal desktop width (86e3jzdu3)', () => {
  it('uses xl for creator load flows', () => {
    expect(LOAD_FROM_LIBRARY_MODAL_SIZE).toBe('xl');
  });
});
