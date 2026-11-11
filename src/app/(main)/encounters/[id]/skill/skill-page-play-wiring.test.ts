import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const skillPagePath = join(dirname(fileURLToPath(import.meta.url)), 'page.tsx');

describe('skill play page wiring', () => {
  it('enables keepalive unload on the shared play hook', () => {
    const source = readFileSync(skillPagePath, 'utf8');
    expect(source).toMatch(/useEncounterPlayPage\(\{[\s\S]*?keepaliveOnUnload:\s*true/);
    expect(source).not.toMatch(/signedIn:\s*!!/);
  });
});
