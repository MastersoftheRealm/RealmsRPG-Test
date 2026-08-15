import { afterEach, describe, expect, it } from 'vitest';
import { SITE_URL } from '@/lib/constants/copy/shared-copy';
import {
  getCanonicalSiteUrl,
  getCanonicalSiteUrlObject,
  isProductionIndexingEnabled,
} from '@/lib/site-url';

describe('getCanonicalSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it('falls back to SITE_URL when the env var is empty', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getCanonicalSiteUrl()).toBe(SITE_URL);
    expect(getCanonicalSiteUrlObject().origin).toBe(SITE_URL);
  });

  it('strips a trailing slash from NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com/';
    expect(getCanonicalSiteUrl()).toBe('https://realmsrpg.com');
  });
});

describe('isProductionIndexingEnabled', () => {
  const original = process.env.VERCEL_ENV;

  afterEach(() => {
    if (original === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original;
  });

  it('is true only when VERCEL_ENV is production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(isProductionIndexingEnabled()).toBe(true);
    process.env.VERCEL_ENV = 'preview';
    expect(isProductionIndexingEnabled()).toBe(false);
    delete process.env.VERCEL_ENV;
    expect(isProductionIndexingEnabled()).toBe(false);
  });
});
