import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  chainWritesCharacterSheetData,
  charactersTableWriteChains,
  handlerBody,
  isCharacterPersistenceWriteRoute,
  mutationHandlersInRoute,
  routePersistsCharacterSheetData,
  runCharacterLegalityAllLevelsGate,
  stripComments,
} from './lib/character-legality-all-levels-gate.mjs';

describe('stripComments', () => {
  it('does not strip // inside double-quoted strings', () => {
    const code = 'const u = "https://example.com//path"; // real comment';
    const stripped = stripComments(code);
    expect(stripped).toContain('https://example.com//path');
    expect(stripped).not.toContain('real comment');
  });

  it('does not treat evaluateCharacterLegalityForSave( inside a string as a real call', () => {
    const code = 'const doc = "evaluateCharacterLegalityForSave(is fake)";';
    expect(stripComments(code)).toContain('evaluateCharacterLegalityForSave(is fake)');
  });
});

describe('character-legality all-levels gate', () => {
  it('ignores forbidden identifiers in comments', () => {
    const code = stripComments(`
      // shouldCheckLevel1Legality is gone
      export async function POST() {
        return evaluateCharacterLegalityForSave(client, data);
      }
    `);
    expect(code).not.toContain('shouldCheckLevel1Legality');
    expect(code).toContain('evaluateCharacterLegalityForSave');
  });

  it('does not require legality on GET-only character routes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'characters', 'export');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      'export async function GET() { return new Response("ok"); }',
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(true);
  });

  it('fails when POST omits evaluateCharacterLegalityForSave in the handler body', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-'));
    fs.mkdirSync(path.join(dir, 'src', 'app', 'api', 'characters'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'app', 'api', 'characters', 'route.ts'),
      `export async function POST() {
        await supabase.from('characters').insert({ data: cleanedData });
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('POST must call'))).toBe(true);
  });

  it('requires evaluateCharacterLegalityForSave inside PATCH handler only', () => {
    const src = `
      export async function GET() { return null; }
      export async function PATCH() {
        await evaluateCharacterLegalityForSave(s, data);
        return null;
      }
    `;
    expect(mutationHandlersInRoute(src)).toEqual(['PATCH']);
    expect(handlerBody(src, 'PATCH')).toMatch(/evaluateCharacterLegalityForSave\s*\(/);
    expect(handlerBody(src, 'GET')).toBe('');
  });

  it('targets only character persistence write routes', () => {
    const postCharacters = `
      export async function POST() {
        await supabase.from('characters').insert({ data: cleanedData });
      }
    `;
    const patchCharacter = `
      export async function PATCH() {
        await supabase.from('characters').update({ data: mergedData });
      }
    `;
    const portraitOnly = `
      export async function POST() {
        await supabase.from('characters').select('id');
      }
    `;
    expect(
      isCharacterPersistenceWriteRoute('src/app/api/characters/route.ts', postCharacters),
    ).toBe(true);
    expect(
      isCharacterPersistenceWriteRoute('src/app/api/characters/[id]/route.ts', patchCharacter),
    ).toBe(true);
    expect(
      isCharacterPersistenceWriteRoute('src/app/api/upload/portrait/route.ts', portraitOnly),
    ).toBe(false);
  });

  it('detects chain-local character writes and ignores other tables', () => {
    const splitStatements = `
      await supabase.from('characters').select('id');
      await supabase.from('items').insert({ data: payload });
    `;
    expect(routePersistsCharacterSheetData(stripComments(splitStatements))).toBe(false);
  });

  it.each([
    ['explicit data property', `supabase.from('characters').update({ data: mergedData });`],
    ['ES shorthand data', `supabase.from('characters').update({ data });`],
    [
      'asDbUpdate variable payload (fail closed)',
      `supabase.from('characters').update(asDbUpdate<'characters'>(payload));`,
    ],
    ['variable payload (fail closed)', `supabase.from('characters').update(payload);`],
    ['object spread (fail closed)', `supabase.from('characters').update({ ...rowPatch });`],
    ['quoted data key (fail closed)', `supabase.from('characters').update({ 'data': sheet });`],
    [
      'brace in string value (fail closed)',
      `supabase.from('characters').update({ name: '}', data: sheet });`,
    ],
    ['upsert', `supabase.from('characters').upsert({ data: sheet });`],
  ])('positive chain fixture: %s', (_label, snippet) => {
    const chain = charactersTableWriteChains(stripComments(snippet))[0];
    expect(chainWritesCharacterSheetData(chain)).toBe(true);
    expect(isCharacterPersistenceWriteRoute('src/app/api/characters/[id]/route.ts', snippet)).toBe(
      true,
    );
  });

  it('end-to-end gate fails on unguarded asDbUpdate variable payload', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-asdbupdate-var-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'sheet', 'wrapped');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      `export async function PATCH() {
        const payload = { data: sheet };
        await client.from('characters').update(asDbUpdate<'characters'>(payload));
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('PATCH must call'))).toBe(true);
  });

  it('end-to-end gate fails on unguarded update with quoted data key', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-quoted-data-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'sheet', 'quoted');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      `export async function PATCH() {
        await client.from('characters').update({ 'data': sheet });
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('PATCH must call'))).toBe(true);
  });

  it('end-to-end gate fails on unguarded update with brace inside string', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-brace-string-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'sheet', 'trick');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      `export async function PATCH() {
        await client.from('characters').update({ name: '}', data: sheet });
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('PATCH must call'))).toBe(true);
  });

  it('end-to-end gate fails on unguarded update with ES shorthand data', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-shorthand-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'sheet', 'sync');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      `export async function PATCH() {
        const data = sheet;
        await client.from('characters').update({ data });
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('PATCH must call'))).toBe(true);
  });

  it('negative chain fixture: select-only on characters', () => {
    const snippet = `const row = await supabase.from('characters').select('id').maybeSingle();`;
    expect(routePersistsCharacterSheetData(stripComments(snippet))).toBe(false);
  });

  it('negative chain fixture: proven metadata-only inline update', () => {
    const snippet = `await supabase.from('characters').update({ updated_at: now });`;
    const chain = charactersTableWriteChains(stripComments(snippet))[0];
    expect(chainWritesCharacterSheetData(chain)).toBe(false);
  });

  it('fails when a new characters insert route omits evaluateCharacterLegalityForSave', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-new-char-route-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'player', 'import');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      `export async function POST() {
        await client.from('characters').insert({ data: payload });
        return new Response("ok");
      }`,
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('POST must call'))).toBe(true);
  });

  it('forbids level-1-only blocking helpers', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-forbidden-'));
    fs.mkdirSync(path.join(dir, 'src', 'lib', 'game'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'lib', 'game', 'bad.ts'),
      'export function shouldBlockCharacterSaveAtLevel() {}',
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('shouldBlockCharacterSaveAtLevel'))).toBe(true);
  });
});
