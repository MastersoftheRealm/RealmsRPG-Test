import { afterEach, describe, expect, it } from 'vitest';
import { isStyleguideServed } from './styleguide-gate';

describe('isStyleguideServed', () => {
  const original = process.env.VERCEL_ENV;

  afterEach(() => {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
  });

  it('is false on Vercel production and true elsewhere', () => {
    process.env.VERCEL_ENV = 'production';
    expect(isStyleguideServed()).toBe(false);
    process.env.VERCEL_ENV = 'preview';
    expect(isStyleguideServed()).toBe(true);
    delete process.env.VERCEL_ENV;
    expect(isStyleguideServed()).toBe(true);
  });
});
