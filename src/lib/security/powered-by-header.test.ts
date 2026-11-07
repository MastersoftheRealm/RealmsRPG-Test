import { describe, expect, it } from 'vitest';
import { NEXT_APP_POWERED_BY_HEADER } from './next-app-flags';

describe('next.config poweredByHeader', () => {
  it('disables the x-powered-by framework fingerprint', () => {
    expect(NEXT_APP_POWERED_BY_HEADER).toBe(false);
  });
});
