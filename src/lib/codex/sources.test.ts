import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toColumnarPayload, toDbPayload } from '@/app/(main)/admin/codex/codex-column-map';
import {
  CODEX_PROPERTIES_PUBLIC_SELECT,
  CODEX_SKILLS_PUBLIC_SELECT,
  omitCodexSourcesColumn,
} from '@/lib/codex/public-table-select';
import {
  CODEX_SOURCE_WHITESPACE_CODE_POINTS,
  codexSourceNameError,
  codexSourcesAfterAdd,
  codexSourcesAfterRemove,
  codexSourceMembershipRemoveOffered,
  codexSourcesForWrite,
  codexSourcesOrCore,
  collapseCodexSourceName,
  itemMatchesSources,
  normalizeCodexSources,
  resolveCodexSourceName,
} from './sources';

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
    expect(normalizeCodexSources([])).toEqual([]);
    expect(codexSourcesOrCore('')).toEqual(['Core']);
    expect(codexSourcesOrCore([])).toEqual(['Core']);
    expect(codexSourcesOrCore(undefined)).toEqual(['Core']);
    expect(codexSourcesOrCore(['  companions  ', 'Core', 'COMPANIONS'])).toEqual([
      'COMPANIONS',
      'Core',
    ]);
    expect(normalizeCodexSources("Assassin's Accoutrements")).toEqual(["Assassin's Accoutrements"]);
    expect(normalizeCodexSources("Wondrous Workshop, Diviner's Delights")).toEqual([
      "Wondrous Workshop, Diviner's Delights",
    ]);
    const whitespace = CODEX_SOURCE_WHITESPACE_CODE_POINTS.map((code) =>
      String.fromCharCode(code),
    ).join('');
    expect(
      collapseCodexSourceName(`${whitespace}Companion${whitespace}Expansion${whitespace}`),
    ).toBe('Companion Expansion');
    expect(collapseCodexSourceName(whitespace)).toBe('');
    const whitespaceMatches: number[] = [];
    for (let code = 0; code <= 0xffff; code += 1) {
      if (/\s/.test(String.fromCharCode(code))) whitespaceMatches.push(code);
    }
    expect(whitespaceMatches).toEqual([...CODEX_SOURCE_WHITESPACE_CODE_POINTS]);
  });

  it('rejects All, HTML, control characters, and over-long names on the write path', () => {
    expect(codexSourceNameError('All')).toMatch(/reserved/);
    expect(codexSourceNameError(' ALL ')).toMatch(/reserved/);
    expect(() => codexSourcesForWrite(['Core', 'All'])).toThrow(/reserved/);
    expect(() => codexSourcesForWrite('<b>Core</b>')).toThrow(/HTML/);
    expect(() => codexSourcesForWrite(`Core${String.fromCharCode(0)}`)).toThrow(/control/);
    expect(() => codexSourcesForWrite('x'.repeat(101))).toThrow(/100/);
    expect(() => codexSourcesForWrite([1])).toThrow(/text/);
    expect(codexSourcesForWrite("  Assassin's Accoutrements  ")).toEqual([
      "Assassin's Accoutrements",
    ]);
    expect(codexSourcesForWrite(['homebrew', 'Core', 'Homebrew'])).toEqual(['Core', 'Homebrew']);
    expect(codexSourcesForWrite([])).toEqual(['Core']);
    expect(codexSourcesForWrite(null)).toEqual(['Core']);
    expect(() => toColumnarPayload('codex_feats', { sources: ['<img>'] })).toThrow(/HTML/);
    expect(toColumnarPayload('codex_feats', { sources: ['Powers Expansion'] }).sources).toEqual([
      'Powers Expansion',
    ]);
  });

  it('matches every item when the filter is All, otherwise any selected source', () => {
    expect(itemMatchesSources(['Crafting'], [])).toBe(true);
    expect(itemMatchesSources(['Crafting'], null)).toBe(true);
    expect(itemMatchesSources(['Crafting'], ['all'])).toBe(true);
    expect(itemMatchesSources(['Crafting'], [' ALL '])).toBe(true);
    expect(itemMatchesSources(['Core', 'Crafting'], ['crafting'])).toBe(true);
    expect(itemMatchesSources(['Core'], ['Crafting', 'Companions'])).toBe(false);
    expect(itemMatchesSources(['Companions'], ['Crafting', 'companions'])).toBe(true);
    expect(itemMatchesSources(undefined, ['Core'])).toBe(true);
    expect(itemMatchesSources(undefined, ['core'])).toBe(true);
    expect(itemMatchesSources([], ['Core'])).toBe(true);
    expect(itemMatchesSources([], ['Harvesting'])).toBe(false);
    expect(itemMatchesSources(['Core'], ['not-a-source'])).toBe(false);
    expect(itemMatchesSources(undefined, ['Unreleased'])).toBe(false);
    expect(itemMatchesSources(['Unreleased', 'Core'], ['unreleased'])).toBe(true);
    expect(itemMatchesSources('Harvesting Expansion, Core', ['Harvesting'])).toBe(false);
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
    expect(
      toColumnarPayload('codex_equipment', { sources: 'Companion Expansion' }).sources,
    ).toEqual(['Companion Expansion']);
  });

  it('drops only the sources column from the named public selects', () => {
    expect(omitCodexSourcesColumn(CODEX_SKILLS_PUBLIC_SELECT)).not.toContain('sources');
    expect(omitCodexSourcesColumn(CODEX_SKILLS_PUBLIC_SELECT)).toContain('source');
    expect(omitCodexSourcesColumn(CODEX_PROPERTIES_PUBLIC_SELECT)).toBe(
      'id, name, description, source, type, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, mechanic, updated_at',
    );
    expect(omitCodexSourcesColumn('*')).toBe('*');
  });

  it('describes the applied open-sources rewrite without touching the singular column', () => {
    const sql = readFileSync(join(process.cwd(), 'sql/codex-entry-sources-open.sql'), 'utf8');
    expect(sql).toContain('Applied on production 2026-10-17');
    expect(sql).toContain('Do not run this against any database');
    expect(sql).not.toContain('NOT APPLIED');
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
    expect(sql).toContain('IF rewrite THEN');
    expect(sql).toContain('collapse_codex_source_name');
    expect(sql).toContain('check_present');
    expect(sql).not.toContain('DROP INDEX');
    expect(sql.includes('SET source =')).toBe(false);
    expect(sql).not.toContain('regexp_replace(btrim(source)');
    expect(sql).toContain("Assassin''s Accoutrements");
    for (const code of CODEX_SOURCE_WHITESPACE_CODE_POINTS) {
      expect(sql).toContain(`chr(${code})`);
    }
  });

  it('adds and removes membership with case-insensitive dedupe and Core fallback', () => {
    expect(codexSourcesAfterAdd(['Core', 'Homebrew'], 'homebrew')).toEqual(['Core', 'Homebrew']);
    expect(codexSourcesAfterAdd(['Core'], 'Crafting')).toEqual(['Core', 'Crafting']);
    expect(() => codexSourcesAfterAdd(['Core'], 'All')).toThrow(/reserved/);

    expect(codexSourcesAfterRemove(['Core', 'Homebrew'], 'Core')).toEqual(['Homebrew']);
    expect(codexSourcesAfterRemove(['Core'], 'Core')).toEqual(['Core']);
    expect(codexSourcesAfterRemove(['Homebrew'], 'Homebrew')).toEqual(['Core']);
    expect(codexSourcesAfterRemove(['CORE', 'core', 'Homebrew'], 'core')).toEqual(['Homebrew']);

    expect(codexSourceMembershipRemoveOffered(['Core'], 'Core')).toBe(false);
    expect(codexSourceMembershipRemoveOffered([], 'Core')).toBe(false);
    expect(codexSourceMembershipRemoveOffered(['Core', 'Homebrew'], 'Core')).toBe(true);
    expect(codexSourceMembershipRemoveOffered(['Homebrew'], 'Homebrew')).toBe(true);

    expect(resolveCodexSourceName('homebrew', ['Core', 'Homebrew'])).toBe('Homebrew');
    expect(resolveCodexSourceName('New Pack', ['Core'])).toBe('New Pack');
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
