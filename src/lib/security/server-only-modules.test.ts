import { describe, expect, it } from 'vitest';

import characterViewEnrichmentServerSource from '../character-view-enrichment-server.ts?raw';
import codexChangelogSource from '../codex-changelog.ts?raw';
import supabaseServerSource from '../supabase/server.ts?raw';

/** LIB1-010 — service-role / server fetch modules must register the Next.js server-only guard. */
describe('server-only module guards (LIB1-010)', () => {
  it('character-view-enrichment-server registers server-only', () => {
    expect(characterViewEnrichmentServerSource).toMatch(/import 'server-only';/);
  });

  it('codex-changelog registers server-only', () => {
    expect(codexChangelogSource).toMatch(/import 'server-only';/);
  });

  it('supabase/server registers server-only', () => {
    expect(supabaseServerSource).toMatch(/import 'server-only';/);
  });
});
