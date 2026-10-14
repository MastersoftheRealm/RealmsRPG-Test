import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { isApiMutationMethod, rejectCrossOriginApiMutation } from './api-mutation-guard';

describe('api-mutation-guard', () => {
  it('detects mutation HTTP methods', () => {
    expect(isApiMutationMethod('POST')).toBe(true);
    expect(isApiMutationMethod('get')).toBe(false);
  });

  it('rejects cross-origin API mutations at the edge guard', () => {
    const denied = rejectCrossOriginApiMutation(
      new NextRequest('http://localhost/api/characters', {
        method: 'POST',
        headers: { host: 'localhost', origin: 'https://evil.example' },
      }),
    );
    expect(denied?.status).toBe(403);
  });

  it('ignores non-API paths', () => {
    const denied = rejectCrossOriginApiMutation(
      new NextRequest('http://localhost/characters', {
        method: 'POST',
        headers: { host: 'localhost', origin: 'https://evil.example' },
      }),
    );
    expect(denied).toBeNull();
  });
});
