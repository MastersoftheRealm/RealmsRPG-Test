import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  collectInputValidationGaps,
  collectReExportedHandlerMethods,
  getHandlerMethod,
  handlerReadsJsonBody,
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

  it('recognizes non-async export function handlers', () => {
    const source = `
export function GET() {
  return NextResponse.json({});
}
`;
    const chunks = splitHandlerChunks(source);
    expect(getHandlerMethod(chunks[0]!)).toBe('GET');
  });

  it('detects req.json() and text()+JSON.parse as JSON body reads', () => {
    const reqJson = `
export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(body);
}
`;
    expect(handlerReadsJsonBody(reqJson)).toBe(true);

    const textParse = `
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const body = JSON.parse(raw);
  return NextResponse.json(body);
}
`;
    expect(handlerReadsJsonBody(textParse)).toBe(true);

    const validated = `
export async function POST(req: NextRequest) {
  const v = await validateJson(req, schema);
  if (!v.success) return v.error;
  return NextResponse.json({ ok: true });
}
`;
    expect(handlerReadsJsonBody(validated)).toBe(false);
  });

  it('flags aliased re-exported route handlers', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'api-scan-reexport-'));
    const routeDir = path.join(root, 'app', 'api', 'demo');
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(
      path.join(routeDir, 'route.ts'),
      `
function handler() { return NextResponse.json({}); }
export { handler as POST };
`,
    );

    expect(collectReExportedHandlerMethods('export { handler as POST };')).toEqual(['POST']);

    const gaps = collectInputValidationGaps({ apiRoot: path.join(root, 'app', 'api') });
    expect(gaps.some((g) => g.includes('re-exported route handler'))).toBe(true);
  });

  it('flags bare export { GET } including local handlers that read JSON', () => {
    expect(collectReExportedHandlerMethods('export { GET };')).toEqual(['GET']);
    expect(collectReExportedHandlerMethods('export { GET } from "../codex/route";')).toEqual([
      'GET',
    ]);

    const root = mkdtempSync(path.join(tmpdir(), 'api-scan-bare-export-'));
    const routeDir = path.join(root, 'app', 'api', 'bare');
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(
      path.join(routeDir, 'route.ts'),
      `
async function GET(r: NextRequest) {
  await r.json();
  return NextResponse.json({});
}
export { GET };
`,
    );

    const gaps = collectInputValidationGaps({ apiRoot: path.join(root, 'app', 'api') });
    expect(gaps.some((g) => g.includes('bare/route.ts (GET): re-exported'))).toBe(true);
  });

  it('flags export * from in route files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'api-scan-star-'));
    const routeDir = path.join(root, 'app', 'api', 'star');
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(path.join(routeDir, 'route.ts'), `export * from '../codex/route';\n`);

    const gaps = collectInputValidationGaps({ apiRoot: path.join(root, 'app', 'api') });
    expect(gaps.some((g) => g.includes('export * from cannot be input-validated'))).toBe(true);
  });

  it('does not treat export type { ... } as a handler re-export', () => {
    expect(collectReExportedHandlerMethods('export type { GETResponse } from "./types";')).toEqual(
      [],
    );
  });
});
