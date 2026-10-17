import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toColumnarPayload, toDbPayload } from '@/app/(main)/admin/codex/codex-column-map';
import {
  CODEX_SOURCE_IDS,
  CODEX_SOURCES,
  codexSourcesOrCore,
  itemMatchesSources,
  normalizeCodexSources,
} from './sources';

describe('codex sources', () => {
  it('lists one typed set: Core through Homebrew, plus Unreleased', () => {
    expect(CODEX_SOURCES.map((source) => source.label)).toEqual([
      'Core',
      'Crafting',
      'Downtime',
      'Harvesting',
      'Companions',
      'Homebrew',
      'Unreleased',
    ]);
    expect(new Set(CODEX_SOURCE_IDS).size).toBe(CODEX_SOURCE_IDS.length);
  });

  it('normalizes ids, legacy labels, and duplicates into canonical order', () => {
    expect(normalizeCodexSources(['homebrew', 'core', 'core'])).toEqual(['core', 'homebrew']);
    expect(normalizeCodexSources(' Crafting Expansion ')).toEqual(['crafting']);
    expect(normalizeCodexSources('unreleased/test')).toEqual(['unreleased']);
    expect(normalizeCodexSources('not a source')).toEqual([]);
    expect(normalizeCodexSources(null)).toEqual([]);
    expect(codexSourcesOrCore('')).toEqual(['core']);
    expect(codexSourcesOrCore(['companions', 'nope', 'core'])).toEqual(['core', 'companions']);
  });

  it('matches every item when the filter is All, otherwise any selected source', () => {
    expect(itemMatchesSources(['crafting'], [])).toBe(true);
    expect(itemMatchesSources(['crafting'], null)).toBe(true);
    expect(itemMatchesSources(['crafting'], ['all'])).toBe(true);
    expect(itemMatchesSources(['core', 'crafting'], ['crafting'])).toBe(true);
    expect(itemMatchesSources(['core'], ['crafting', 'companions'])).toBe(false);
    expect(itemMatchesSources(['companions'], ['crafting', 'companions'])).toBe(true);
    expect(itemMatchesSources(undefined, ['core'])).toBe(true);
    expect(itemMatchesSources(undefined, ['unreleased'])).toBe(false);
    expect(itemMatchesSources(['unreleased', 'core'], ['unreleased'])).toBe(true);
  });

  it('keeps sources as a postgres text array on the admin write path', () => {
    const columnar = toColumnarPayload('codex_feats', {
      name: 'Example',
      sources: ['homebrew', 'core', 'homebrew'],
    });
    expect(columnar.sources).toEqual(['core', 'homebrew']);
    expect(toDbPayload('codex_skills', { sources: columnar.sources }).sources).toEqual([
      'core',
      'homebrew',
    ]);
  });

  it('puts every source id in the migration check', () => {
    const sql = readFileSync(join(process.cwd(), 'sql/codex-entry-sources.sql'), 'utf8');
    for (const id of CODEX_SOURCE_IDS) {
      expect(sql).toContain(`'${id}'`);
    }
    expect(sql).toContain("ARRAY[''core'']");
    expect(sql.includes('SET source =')).toBe(false);
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
