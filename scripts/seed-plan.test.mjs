import { describe, expect, it } from 'vitest';
import { buildSeedPlan, parseSeedArgs } from './seed-plan.mjs';

const TABLES = ['codex_feats', 'codex_parts', 'codex_archetypes'];

function loadedFor(overrides = {}) {
  return {
    codex_feats: { file: 'feats.csv', rowCount: 900, invalidRows: 0 },
    codex_parts: { file: 'parts.csv', rowCount: 400, invalidRows: 0 },
    ...overrides,
  };
}

const LIVE = { codex_feats: 900, codex_parts: 400, codex_archetypes: 12 };

function plan(argv, loaded = loadedFor()) {
  return buildSeedPlan({
    tables: TABLES,
    loaded,
    liveCounts: LIVE,
    options: parseSeedArgs(argv),
  });
}

describe('parseSeedArgs', () => {
  it('reads --reset instead of ignoring it', () => {
    expect(parseSeedArgs(['--reset']).reset).toBe(true);
    expect(parseSeedArgs([]).reset).toBe(false);
  });

  it('collects unsupported flags rather than silently ignoring them', () => {
    expect(parseSeedArgs(['--force']).unknown).toEqual(['--force']);
  });
});

describe('buildSeedPlan — deletion is opt-in', () => {
  it('never clears anything without --reset', () => {
    const result = plan([]);
    expect(result.mode).toBe('upsert');
    expect(result.clearTables).toEqual([]);
    expect(result.upsertTables.map((row) => row.table)).toEqual(['codex_feats', 'codex_parts']);
  });

  it('refuses --reset while a codex table has no CSV', () => {
    const result = plan(['--reset']);
    expect(result.clearTables).toEqual([]);
    expect(result.blockers.join(' ')).toContain('codex_archetypes');
  });

  it('clears only CSV-backed tables under --allow-partial-reset', () => {
    const result = plan(['--reset', '--allow-partial-reset']);
    expect(result.blockers).toEqual([]);
    expect(result.clearTables.map((row) => row.table)).toEqual(['codex_feats', 'codex_parts']);
    expect(result.untouchedTables.map((row) => row.table)).toEqual(['codex_archetypes']);
  });

  it('treats an empty CSV as unrepopulatable and leaves the table alone entirely', () => {
    const loaded = loadedFor({
      codex_archetypes: { file: 'archetypes.csv', rowCount: 0, invalidRows: 0 },
    });
    const result = plan(['--reset', '--allow-partial-reset'], loaded);
    expect(result.clearTables.map((row) => row.table)).not.toContain('codex_archetypes');
    expect(result.upsertTables.map((row) => row.table)).not.toContain('codex_archetypes');
    expect(result.untouchedTables[0].reason).toContain('0 rows');
  });

  it('still upserts a CSV with id-less rows but refuses to clear that table', () => {
    const loaded = loadedFor({
      codex_archetypes: { file: 'archetypes.csv', rowCount: 12, invalidRows: 3 },
    });
    const result = plan(['--reset', '--allow-partial-reset'], loaded);
    expect(result.upsertTables.map((row) => row.table)).toContain('codex_archetypes');
    expect(result.clearTables.map((row) => row.table)).not.toContain('codex_archetypes');
    expect(result.notResettable[0].reason).toContain('no usable id');
  });

  it('refuses a plain --reset when a table only has a partially valid CSV', () => {
    const loaded = loadedFor({
      codex_archetypes: { file: 'archetypes.csv', rowCount: 12, invalidRows: 3 },
    });
    const result = plan(['--reset'], loaded);
    expect(result.clearTables).toEqual([]);
    expect(result.blockers.join(' ')).toContain('codex_archetypes');
  });

  it('blocks every mode when no CSV is usable', () => {
    const result = plan([], {});
    expect(result.blockers.join(' ')).toContain('nothing to seed');
  });

  it('blocks unknown flags before any delete is planned', () => {
    const result = plan(['--reset', '--allow-partial-reset', '--force']);
    expect(result.clearTables).toEqual([]);
    expect(result.blockers.join(' ')).toContain('--force');
  });
});

describe('buildSeedPlan — confirmation', () => {
  it('requires confirmation for any planned delete', () => {
    expect(plan(['--reset', '--allow-partial-reset']).requiresConfirmation).toBe(true);
  });

  it('accepts --yes for non-interactive runs', () => {
    expect(plan(['--reset', '--allow-partial-reset', '--yes']).requiresConfirmation).toBe(false);
  });

  it('never requires confirmation for an upsert-only run', () => {
    expect(plan([]).requiresConfirmation).toBe(false);
  });

  it('reports dry-run intent without planning a delete it will not perform', () => {
    const result = plan(['--reset', '--allow-partial-reset', '--dry-run']);
    expect(result.dryRun).toBe(true);
    expect(result.clearTables.length).toBe(2);
  });
});
