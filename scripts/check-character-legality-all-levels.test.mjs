import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runCharacterLegalityAllLevelsGate,
  stripComments,
} from './lib/character-legality-all-levels-gate.mjs';

describe('character-legality all-levels gate', () => {
  it('ignores forbidden identifiers in comments', () => {
    const code = stripComments(`
      // shouldCheckLevel1Legality is gone
      export function ok() {
        return evaluateCharacterLegalityForSave(client, data);
      }
    `);
    expect(code).not.toContain('shouldCheckLevel1Legality');
    expect(code).toContain('evaluateCharacterLegalityForSave');
  });

  it('fails when a save route omits evaluateCharacterLegalityForSave', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legality-gate-'));
    const routeDir = path.join(dir, 'src', 'app', 'api', 'characters', '[id]');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(
      path.join(routeDir, 'route.ts'),
      'export async function PATCH() { return new Response("ok"); }',
    );
    const result = runCharacterLegalityAllLevelsGate(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('evaluateCharacterLegalityForSave'))).toBe(true);
  });
});
