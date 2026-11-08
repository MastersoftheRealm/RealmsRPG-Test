import { describe, expect, it } from 'vitest';
import {
  decodeRealmsImagesListCursor,
  encodeRealmsImagesListCursor,
} from './realms-images-list-cursor';

describe('realms images list cursor', () => {
  it('round-trips a non-negative offset', () => {
    const cursor = encodeRealmsImagesListCursor(200);
    expect(decodeRealmsImagesListCursor(cursor)).toBe(200);
  });

  it('rejects invalid cursors', () => {
    expect(decodeRealmsImagesListCursor('not-a-cursor')).toBeNull();
    expect(decodeRealmsImagesListCursor(encodeRealmsImagesListCursor(-1))).toBeNull();
  });
});
