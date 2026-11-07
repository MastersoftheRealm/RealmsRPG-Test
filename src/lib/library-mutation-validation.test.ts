import { describe, expect, it } from 'vitest';
import { validateUserLibraryWriteBody } from '@/lib/library-mutation-validation';

describe('validateUserLibraryWriteBody', () => {
  it('rejects unknown fields on library writes', () => {
    const response = validateUserLibraryWriteBody('powers', {
      name: 'Bolt',
      evilField: true,
    });
    expect(response?.status).toBe(400);
  });

  it('strips direct image URL writes for user library saves', () => {
    const body = {
      name: 'Bolt',
      imageId: '11111111-1111-4111-8111-111111111111',
      imageUrl: 'https://evil.example/art.jpg',
    };
    expect(validateUserLibraryWriteBody('powers', body)).toBeNull();
    expect(body.imageUrl).toBeUndefined();
    expect(body.imageId).toBe('11111111-1111-4111-8111-111111111111');
  });
});
