import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { isLikelyNetworkFailure } from './network-error';

describe('isLikelyNetworkFailure', () => {
  it('treats failed fetch as network', () => {
    expect(isLikelyNetworkFailure(new TypeError('Failed to fetch'))).toBe(true);
    expect(
      isLikelyNetworkFailure(new Error('NetworkError when attempting to fetch resource.')),
    ).toBe(true);
  });

  it('does not treat API errors as network', () => {
    expect(isLikelyNetworkFailure(new ApiError('Bad request', 400))).toBe(false);
    expect(isLikelyNetworkFailure(new ApiError('Server error', 500))).toBe(false);
  });
});
