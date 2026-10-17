import { describe, expect, it } from 'vitest';
import { compileCodexSourceCatalog, sourcesColumnMissing } from './source-catalog';

describe('codex source catalog', () => {
  it('merges every table, counts rows, and prefers a non-lowercase spelling', () => {
    const catalog = compileCodexSourceCatalog({
      codex_feats: [{ sources: ['core'] }, { sources: ['Core', 'Homebrew'] }],
      codex_skills: [{ sources: ['homebrew'] }, { sources: [] }],
      codex_species: [{ sources: '  Companion   Expansion ' }],
      codex_parts: undefined,
    });

    expect(catalog.map((entry) => entry.name)).toEqual(['Companion Expansion', 'Core', 'Homebrew']);
    const core = catalog.find((entry) => entry.name === 'Core');
    expect(core?.counts.codex_feats).toBe(2);
    expect(core?.counts.codex_skills).toBe(1);
    expect(core?.total).toBe(3);
    const homebrew = catalog.find((entry) => entry.name === 'Homebrew');
    expect(homebrew?.counts).toEqual({ codex_feats: 1, codex_skills: 1 });
    expect(homebrew?.total).toBe(2);
    expect(catalog.find((entry) => entry.name === 'Companion Expansion')?.counts).toEqual({
      codex_species: 1,
    });
  });

  it('treats a missing sources column as absent and any other error as present', () => {
    expect(sourcesColumnMissing({ code: '42703', message: 'column sources does not exist' })).toBe(
      true,
    );
    expect(sourcesColumnMissing({ message: 'column "sources" does not exist' })).toBe(true);
    expect(
      sourcesColumnMissing({
        code: 'PGRST204',
        message: "Could not find the 'sources' column of 'codex_feats' in the schema cache",
      }),
    ).toBe(true);
    expect(sourcesColumnMissing({ code: '42P01', message: 'relation does not exist' })).toBe(false);
    expect(sourcesColumnMissing({ code: 'PGRST204', message: 'column name does not exist' })).toBe(
      false,
    );
  });
});
