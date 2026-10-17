import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toColumnarPayload, toDbPayload } from '@/app/(main)/admin/codex/codex-column-map';
import { codexSourcesOrCore, itemMatchesSources, normalizeCodexSources } from './sources';

describe('codex sources', () => {
  it('collapses whitespace and dedupes case-insensitively', () => {
    expect(normalizeCodexSources(['Homebrew', 'Core', 'homebrew'])).toEqual(['Core', 'Homebrew']);
    expect(normalizeCodexSources('  Companion   Expansion  ')).toEqual(['Companion Expansion']);
    expect(normalizeCodexSources('Crafting Expansion')).toEqual(['Crafting Expansion']);
    expect(normalizeCodexSources(['core'], ['Core'])).toEqual(['Core']);
    expect(normalizeCodexSources(['CORE', 'core'])).toEqual(['CORE']);
    expect(normalizeCodexSources('')).toEqual([]);
    expect(normalizeCodexSources('   ')).toEqual([]);
    expect(normalizeCodexSources(null)).toEqual([]);
    expect(codexSourcesOrCore('')).toEqual(['Core']);
    expect(codexSourcesOrCore(undefined)).toEqual(['Core']);
    expect(codexSourcesOrCore(['  companions  ', 'Core', 'COMPANIONS'])).toEqual([
      'COMPANIONS',
      'Core',
    ]);
  });

  it('matches every item when the filter is All, otherwise any selected source', () => {
    expect(itemMatchesSources(['Crafting'], [])).toBe(true);
    expect(itemMatchesSources(['Crafting'], null)).toBe(true);
    expect(itemMatchesSources(['Crafting'], ['all'])).toBe(true);
    expect(itemMatchesSources(['Core', 'Crafting'], ['crafting'])).toBe(true);
    expect(itemMatchesSources(['Core'], ['Crafting', 'Companions'])).toBe(false);
    expect(itemMatchesSources(['Companions'], ['Crafting', 'companions'])).toBe(true);
    expect(itemMatchesSources(undefined, ['Core'])).toBe(true);
    expect(itemMatchesSources(undefined, ['core'])).toBe(true);
    expect(itemMatchesSources(undefined, ['Unreleased'])).toBe(false);
    expect(itemMatchesSources(['Unreleased', 'Core'], ['unreleased'])).toBe(true);
  });

  it('keeps sources as a postgres text array on the admin write path', () => {
    const columnar = toColumnarPayload('codex_feats', {
      name: 'Example',
      sources: ['homebrew', 'Core', 'Homebrew'],
    });
    expect(columnar.sources).toEqual(['Core', 'Homebrew']);
    expect(Array.isArray(columnar.sources)).toBe(true);
    expect(toDbPayload('codex_skills', { sources: columnar.sources }).sources).toEqual([
      'Core',
      'Homebrew',
    ]);
    expect(toColumnarPayload('codex_parts', { sources: [] }).sources).toEqual(['Core']);
    expect(toColumnarPayload('codex_equipment', { sources: 'Companion Expansion' }).sources).toEqual(
      ['Companion Expansion'],
    );
  });

  it('describes the unapplied open-sources rewrite without touching the singular column', () => {
    const sql = readFileSync(join(process.cwd(), 'sql/codex-entry-sources-open.sql'), 'utf8');
    expect(sql).toContain('NOT APPLIED');
    for (const table of [
      'codex_feats',
      'codex_skills',
      'codex_species',
      'codex_traits',
      'codex_parts',
      'codex_properties',
      'codex_equipment',
      'codex_archetypes',
      'codex_creature_feats',
    ]) {
      expect(sql).toContain(`'${table}'`);
    }
    expect(sql).toContain('_sources_check');
    expect(sql).toContain("ARRAY['Core']");
    expect(sql).toContain("ARRAY['Crafting']");
    expect(sql).toContain("ARRAY['Unreleased']");
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS');
    expect(sql).not.toContain('DROP INDEX');
    expect(sql.includes('SET source =')).toBe(false);
    expect(sql).toContain("regexp_replace(btrim(source), '\\s+', ' ', 'g')");
    expect(sql).toContain('Companion Expansion');
  });

  it('does not build a per-table source list in admin codex', () => {
    const root = join(process.cwd(), 'src/app/(main)/admin/codex');
    const offenders: string[] = [];
    const visit = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          visit(path);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        const text = readFileSync(path, 'utf8');
        if (text.includes('collectCodexSources') || text.includes('Add new source')) {
          offenders.push(path);
        }
      }
    };
    visit(root);
    expect(offenders).toEqual([]);
  });
});
