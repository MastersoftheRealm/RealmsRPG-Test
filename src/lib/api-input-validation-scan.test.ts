import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  collectInputValidationGaps,
  getHandlerMethod,
  handlerReadsQuery,
  handlerUsesRouteParams,
  splitHandlerChunks,
} from './api-input-validation-scan';

describe('api-input-validation-scan detectors', () => {
  it('recognizes export const GET = async arrow handlers', () => {
    const source = `
export const GET = async (request: NextRequest) => {
  const x = request.nextUrl.searchParams.get('q');
  return NextResponse.json({});
};
`;
    const chunks = splitHandlerChunks(source);
    expect(getHandlerMethod(chunks[0]!)).toBe('GET');
    expect(handlerReadsQuery(chunks[0]!)).toBe(true);
  });

  it('recognizes context.params reads', () => {
    const chunk = `
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json({ id });
}
`;
    expect(handlerUsesRouteParams(chunk)).toBe(true);
  });

  it('recognizes searchParams.has and getAll as query reads', () => {
    const chunk = `
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.has('debug')) return;
  const all = request.nextUrl.searchParams.getAll('tag');
  return NextResponse.json({ all });
}
`;
    expect(handlerReadsQuery(chunk)).toBe(true);
  });

  it('does not treat validated query reads as gaps', () => {
    const chunk = `
export async function GET(request: NextRequest) {
  const q = validateQuery(request, schema);
  if (!q.success) return q.error;
  return NextResponse.json({});
}
`;
    expect(handlerReadsQuery(chunk)).toBe(false);
  });

  it('flags allowlisted no-input handlers that begin reading query strings', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'api-scan-'));
    const routeDir = path.join(root, 'app', 'api', 'crafting');
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(
      path.join(routeDir, 'route.ts'),
      `
export async function GET(request: NextRequest) {
  const x = request.nextUrl.searchParams.get('oops');
  return NextResponse.json({ x });
}
`,
    );

    const gaps = collectInputValidationGaps({
      apiRoot: path.join(root, 'app', 'api'),
      noInputAllowlist: new Set(['crafting/route.ts (GET)']),
    });

    expect(gaps.some((g) => g.includes('allowlisted as no-input but reads'))).toBe(true);
  });
});
