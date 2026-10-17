import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_CODEX_SOURCE_SECTIONS,
  catalogNameList,
  otherSourcesLabel,
  rowsMatchingSource,
  type AdminCodexSourceRow,
} from './admin-source-list';
import { CODEX_SOURCE_TABLES, compileCodexSourceCatalog } from './source-catalog';

const FEATS: AdminCodexSourceRow[] = [
  { id: '1', name: 'Stored as core', sources: ['core'] },
  { id: '2', name: 'Missing sources' },
  { id: '3', name: 'Empty sources', sources: [] },
  { id: '4', name: 'Workshop', sources: ['Wondrous Workshop'] },
  { id: '5', name: 'Workshop lower', sources: ['wondrous workshop'] },
  { id: '6', name: 'Diviner and core', sources: ['Core', "Diviner's Delights"] },
];

describe('admin source list', () => {
  it('follows the catalog tables and Codex Editor tab order', () => {
    expect(ADMIN_CODEX_SOURCE_SECTIONS.map((section) => section.table)).toEqual([
      ...CODEX_SOURCE_TABLES,
    ]);
    const page = readFileSync(join(process.cwd(), 'src/app/(main)/admin/codex/page.tsx'), 'utf8');
    let last = -1;
    for (const section of ADMIN_CODEX_SOURCE_SECTIONS) {
      const at = page.indexOf(`label: '${section.label}'`);
      expect(at).toBeGreaterThan(last);
      last = at;
    }
  });

  it('matches case-insensitively and treats a missing or empty list as Core', () => {
    expect(rowsMatchingSource(FEATS, 'Core').map((row) => row.id)).toEqual(['1', '2', '3', '6']);
    expect(rowsMatchingSource(FEATS, 'Wondrous Workshop').map((row) => row.id)).toEqual(['4', '5']);
    expect(rowsMatchingSource(FEATS, "DIVINER'S DELIGHTS").map((row) => row.id)).toEqual(['6']);
    expect(rowsMatchingSource(undefined, 'Core')).toEqual([]);
  });

  it("lists the row's other sources and omits the selected source", () => {
    const rowsByTable = { codex_feats: FEATS };
    const catalog = compileCodexSourceCatalog(rowsByTable);
    const names = catalogNameList(catalog, rowsByTable);
    expect(names).toEqual(['Core', "Diviner's Delights", 'Wondrous Workshop']);
    expect(otherSourcesLabel(FEATS[5]?.sources, "Diviner's Delights", names)).toBe('Core');
    expect(otherSourcesLabel(FEATS[3]?.sources, 'Wondrous Workshop', names)).toBe('—');
    expect(otherSourcesLabel(undefined, 'Core', names)).toBe('—');
    expect(otherSourcesLabel([], 'Wondrous Workshop', names)).toBe('Core');
    expect(otherSourcesLabel(['core', 'wondrous workshop'], 'core', names)).toBe(
      'Wondrous Workshop',
    );
  });

  it('counts a source from the same rows the list keeps', () => {
    const rowsByTable = {
      codex_feats: FEATS,
      codex_skills: [{ id: '9', name: 'Bare skill', sources: null }],
    };
    const catalog = compileCodexSourceCatalog(rowsByTable);
    const core = catalog.find((entry) => entry.name === 'Core');
    expect(core?.counts.codex_feats).toBe(rowsMatchingSource(FEATS, 'Core').length);
    expect(core?.counts.codex_skills).toBe(
      rowsMatchingSource(rowsByTable.codex_skills, 'Core').length,
    );
    expect(core?.total).toBe(5);
    const workshop = catalog.find((entry) => entry.name === 'Wondrous Workshop');
    expect(workshop?.counts.codex_feats).toBe(2);
    expect(workshop?.total).toBe(2);
  });

  it('keeps the browser helpers off the server read and orders paged reads by id', () => {
    const helpers = readFileSync(join(process.cwd(), 'src/lib/codex/admin-source-list.ts'), 'utf8');
    expect(helpers).not.toContain('createPublicClient');
    expect(helpers).not.toContain('next/cache');
    expect(helpers).toContain('import type { CodexSourceTable }');
    const rows = readFileSync(join(process.cwd(), 'src/lib/codex/admin-source-rows.ts'), 'utf8');
    const catalog = readFileSync(join(process.cwd(), 'src/lib/codex/source-catalog.ts'), 'utf8');
    expect(rows).toContain(".order('id'");
    expect(catalog).toContain(".order('id'");
  });
});
