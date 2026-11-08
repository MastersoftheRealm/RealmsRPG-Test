import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** LIB1-036 — finished-character persist must not live in lib (no @/services from lib layer). */
describe('persist-finished-character layer (LIB1-036)', () => {
  const libPath = path.join(import.meta.dirname, 'persist-finished-character.ts');

  it('does not keep persistFinishedCharacter under src/lib', () => {
    expect(existsSync(libPath)).toBe(false);
  });
});
