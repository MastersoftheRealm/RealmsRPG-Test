import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertCampaignDetailHttpAccess,
  assertCharacterSheetHttpAccess,
} from '@/lib/server/assert-resource-http-access';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      if (name === 'x-forwarded-host' || name === 'host') return 'localhost:3000';
      if (name === 'x-forwarded-proto') return 'http';
      if (name === 'cookie') return '';
      return null;
    },
  })),
}));

function httpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string' || !digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;')) return null;
  return Number(digest.split(';')[1]);
}

describe('assert-resource-http-access', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws HTTP 404 when the character API denies the sheet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('null', { status: 404 })),
    );

    try {
      await assertCharacterSheetHttpAccess('11111111-1111-1111-1111-111111111111');
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
  });

  it('does not throw when the character API returns 200 (own or readable sheet)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"character":{}}', { status: 200 })),
    );

    await expect(assertCharacterSheetHttpAccess('owned-character')).resolves.toBeUndefined();
  });

  it('does not 404 a guest character id and does not call the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(assertCharacterSheetHttpAccess('local-guest')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws HTTP 404 when the campaign API denies the detail page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('null', { status: 404 })),
    );

    try {
      await assertCampaignDetailHttpAccess('59c90016-0000-0000-0000-000000000000');
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
  });

  it('does not throw when the viewer is a campaign member', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"id":"camp"}', { status: 200 })),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).resolves.toBeUndefined();
  });

  it('does not turn a campaign 401 into a 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":"Unauthorized"}', { status: 401 })),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).resolves.toBeUndefined();
  });
});

describe('detail route HTTP status', () => {
  it('checks character access in a server layout before chrome, outside the main loading boundary', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/(detail)/characters/[id]/layout.tsx');
    const src = readFileSync(layoutPath, 'utf8');
    const assertAt = src.indexOf('await assertCharacterSheetHttpAccess');
    const chromeAt = src.indexOf('<MainAppChrome>');
    expect(assertAt).toBeGreaterThan(-1);
    expect(chromeAt).toBeGreaterThan(assertAt);
    expect(existsSync(path.join(process.cwd(), 'src/app/(detail)/loading.tsx'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'src/app/(main)/loading.tsx'))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'src/app/(main)/characters/[id]/page.tsx'))).toBe(
      false,
    );
  });

  it('checks campaign access in a server layout before chrome, outside the main loading boundary', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/(detail)/campaigns/[id]/layout.tsx');
    const src = readFileSync(layoutPath, 'utf8');
    const assertAt = src.indexOf('await assertCampaignDetailHttpAccess');
    const chromeAt = src.indexOf('<MainAppChrome>');
    expect(assertAt).toBeGreaterThan(-1);
    expect(chromeAt).toBeGreaterThan(assertAt);
    expect(existsSync(path.join(process.cwd(), 'src/app/(main)/campaigns/[id]/page.tsx'))).toBe(
      false,
    );
  });
});
