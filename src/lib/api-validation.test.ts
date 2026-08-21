import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  readBodyWithLimit,
  validateJson,
  verifyMutationRequest,
  verifyRequestOrigin,
} from './api-validation';

const schema = z.object({ name: z.string().min(1) });

const APP_URL = 'http://localhost/api/characters';

function makeRequest(headers: Record<string, string>, method = 'POST', body?: string) {
  return new NextRequest(APP_URL, {
    method,
    headers: { host: 'localhost', ...headers },
    ...(body === undefined ? {} : { body }),
  });
}

/** Body with no Content-Length, like a chunked upload. */
function makeStreamedRequest(byteLength: number) {
  const chunk = new TextEncoder().encode('x'.repeat(64 * 1024));
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(chunk);
      sent += chunk.byteLength;
    },
  });

  type NextRequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>;
  const init: NextRequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers: { host: 'localhost', 'content-type': 'application/json', origin: 'http://localhost' },
    body: stream,
    duplex: 'half',
  };
  return new NextRequest(APP_URL, init);
}

describe('verifyRequestOrigin', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('allows same-origin state-changing requests', () => {
    expect(verifyRequestOrigin(makeRequest({ origin: 'http://localhost' }))).toBeNull();
  });

  it('rejects a cross-site Origin', () => {
    const denied = verifyRequestOrigin(makeRequest({ origin: 'https://evil.example' }));
    expect(denied?.status).toBe(403);
  });

  it('rejects a cross-site Sec-Fetch-Site even when Origin is absent', () => {
    const denied = verifyRequestOrigin(makeRequest({ 'sec-fetch-site': 'cross-site' }));
    expect(denied?.status).toBe(403);
  });

  it('rejects a request with no verifiable origin (fails closed)', () => {
    const denied = verifyRequestOrigin(makeRequest({}));
    expect(denied?.status).toBe(403);
  });

  it('accepts same-origin fetch metadata without an Origin header', () => {
    expect(verifyRequestOrigin(makeRequest({ 'sec-fetch-site': 'same-origin' }))).toBeNull();
  });

  it('allows the configured canonical site origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    expect(verifyRequestOrigin(makeRequest({ origin: 'https://realmsrpg.com' }))).toBeNull();
  });

  it('ignores non-state-changing methods', () => {
    expect(verifyRequestOrigin(makeRequest({ origin: 'https://evil.example' }, 'GET'))).toBeNull();
  });
});

describe('verifyMutationRequest', () => {
  it('rejects text/plain on JSON handlers (CORS-simple content type)', () => {
    const denied = verifyMutationRequest(
      makeRequest({ 'content-type': 'text/plain', origin: 'http://localhost' }),
      { requireJsonBody: true },
    );
    expect(denied?.status).toBe(415);
  });

  it('accepts application/json with a charset parameter', () => {
    const denied = verifyMutationRequest(
      makeRequest({
        'content-type': 'application/json; charset=utf-8',
        origin: 'http://localhost',
      }),
      { requireJsonBody: true },
    );
    expect(denied).toBeNull();
  });
});

describe('readBodyWithLimit', () => {
  it('rejects an oversized body that declares no Content-Length', async () => {
    const result = await readBodyWithLimit(makeStreamedRequest(3 * 1024 * 1024));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(413);
  });

  it('reads a body under the cap', async () => {
    const result = await readBodyWithLimit(
      makeRequest(
        { 'content-type': 'application/json', origin: 'http://localhost' },
        'POST',
        '{"name":"Aria"}',
      ),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.text).toBe('{"name":"Aria"}');
  });

  it('rejects an oversized body from the Content-Length fast path', async () => {
    const request = new NextRequest(APP_URL, {
      method: 'POST',
      headers: {
        host: 'localhost',
        'content-type': 'application/json',
        origin: 'http://localhost',
        'content-length': String(5 * 1024 * 1024),
      },
      body: '{"name":"Aria"}',
    });

    const result = await readBodyWithLimit(request);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(413);
  });
});

describe('validateJson', () => {
  it('rejects a cross-origin mutation before parsing the body', async () => {
    const result = await validateJson(
      makeRequest(
        { 'content-type': 'application/json', origin: 'https://evil.example' },
        'POST',
        '{"name":"Aria"}',
      ),
      schema,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(403);
  });

  it('validates a same-origin JSON body', async () => {
    const result = await validateJson(
      makeRequest(
        { 'content-type': 'application/json', origin: 'http://localhost' },
        'POST',
        '{"name":"Aria"}',
      ),
      schema,
    );

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ name: 'Aria' });
  });

  it('returns 400 for a body that fails the schema', async () => {
    const result = await validateJson(
      makeRequest(
        { 'content-type': 'application/json', origin: 'http://localhost' },
        'POST',
        '{"name":""}',
      ),
      schema,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const result = await validateJson(
      makeRequest(
        { 'content-type': 'application/json', origin: 'http://localhost' },
        'POST',
        '{not json',
      ),
      schema,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(400);
  });
});
