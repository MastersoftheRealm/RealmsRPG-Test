import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import {
  chunkInvokesMutationGuard,
  isApiMutationMethod,
  rejectCrossOriginApiMutation,
  stripCommentsAndStringLiterals,
} from './api-mutation-guard';
import { verifyRequestOrigin } from './api-validation';

function apiRequest(path: string, method: string, headers: Record<string, string>): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { host: 'localhost', ...headers },
  });
}

describe('api-mutation-guard', () => {
  it('detects live mutation guard call sites in handler source', () => {
    const guarded = `
export async function POST(request: NextRequest) {
  const denied = verifyMutationRequest(request);
  if (denied) return denied;
  return NextResponse.json({});
}
`;
    expect(chunkInvokesMutationGuard(guarded)).toBe(true);
    expect(
      chunkInvokesMutationGuard(
        guarded.replace('verifyMutationRequest', '// verifyMutationRequest'),
      ),
    ).toBe(false);
    expect(
      chunkInvokesMutationGuard(`
export async function POST() {
  const note = "verifyMutationRequest(request)";
  return NextResponse.json({});
}
`),
    ).toBe(false);
    expect(
      chunkInvokesMutationGuard(`
export async function POST(request: NextRequest) {
  const validation = await validateJson(request, schema);
  return validation.success ? NextResponse.json({}) : validation.error;
}
`),
    ).toBe(true);
  });

  it('preserves executable code when stripping comments and strings', () => {
    const stripped = stripCommentsAndStringLiterals(
      `const x = verifyMutationRequest(req); // verifyMutationRequest(fake)`,
    );
    expect(stripped).toContain('verifyMutationRequest(req)');
    expect(stripped).not.toContain('fake');
  });

  it('detects mutation HTTP methods', () => {
    expect(isApiMutationMethod('POST')).toBe(true);
    expect(isApiMutationMethod('PUT')).toBe(true);
    expect(isApiMutationMethod('PATCH')).toBe(true);
    expect(isApiMutationMethod('DELETE')).toBe(true);
    expect(isApiMutationMethod('get')).toBe(false);
  });

  it('rejects cross-origin API mutations at the edge guard', () => {
    const denied = rejectCrossOriginApiMutation(
      apiRequest('/api/characters', 'POST', { origin: 'https://evil.example' }),
    );
    expect(denied?.status).toBe(403);
  });

  it('ignores non-API paths', () => {
    const denied = rejectCrossOriginApiMutation(
      apiRequest('/characters', 'POST', { origin: 'https://evil.example' }),
    );
    expect(denied).toBeNull();
  });

  it('allows safe methods on API routes', () => {
    expect(
      rejectCrossOriginApiMutation(
        apiRequest('/api/characters', 'GET', { origin: 'https://evil.example' }),
      ),
    ).toBeNull();
    expect(
      verifyRequestOrigin(apiRequest('/api/characters', 'GET', { origin: 'https://evil.example' })),
    ).toBeNull();
  });

  it('rejects POST with missing or null Origin when fetch metadata is absent', () => {
    expect(verifyRequestOrigin(apiRequest('/api/characters', 'POST', {}))).toMatchObject({
      status: 403,
    });
    expect(
      verifyRequestOrigin(apiRequest('/api/characters', 'POST', { origin: 'null' })),
    ).toMatchObject({ status: 403 });
  });

  it('rejects PUT, PATCH, and DELETE cross-origin', () => {
    for (const method of ['PUT', 'PATCH', 'DELETE'] as const) {
      expect(
        verifyRequestOrigin(
          apiRequest('/api/characters/x', method, { origin: 'https://evil.example' }),
        )?.status,
      ).toBe(403);
    }
  });

  it('does not trust Referer alone when Origin is hostile', () => {
    const denied = verifyRequestOrigin(
      apiRequest('/api/characters', 'POST', {
        origin: 'https://evil.example',
        referer: 'http://localhost/characters',
      }),
    );
    expect(denied?.status).toBe(403);
  });
});
