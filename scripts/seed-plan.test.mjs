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
  it('supports --dry-run only', () => {
    expect(parseSeedArgs(['--dry-run']).dryRun).toBe(true);
    expect(parseSeedArgs([]).dryRun).toBe(false);
  });

  it('collects unsupported flags', () => {
    expect(parseSeedArgs(['--reset']).unknown).toEqual(['--reset']);
    expect(parseSeedArgs(['--force']).unknown).toEqual(['--force']);
  });
});

describe('buildSeedPlan — upsert only', () => {
  it('never clears tables', () => {
    const result = plan([]);
    expect(result.mode).toBe('upsert');
    expect(result.clearTables).toEqual([]);
    expect(result.upsertTables.map((row) => row.table)).toEqual(['codex_feats', 'codex_parts']);
  });

  it('upserts tables with partially valid CSV without clearing', () => {
    const loaded = loadedFor({
      codex_archetypes: { file: 'archetypes.csv', rowCount: 12, invalidRows: 3 },
    });
    const result = plan([], loaded);
    expect(result.upsertTables.map((row) => row.table)).toContain('codex_archetypes');
    expect(result.clearTables).toEqual([]);
  });

  it('blocks when no CSV is usable', () => {
    const result = plan([], {});
    expect(result.blockers.join(' ')).toContain('nothing to seed');
  });

  it('blocks unknown flags', () => {
    const result = plan(['--reset']);
    expect(result.blockers.join(' ')).toContain('--reset');
  });

  it('never requires confirmation', () => {
    expect(plan([]).requiresConfirmation).toBe(false);
  });

  it('reports dry-run without planning deletes', () => {
    const result = plan(['--dry-run']);
    expect(result.dryRun).toBe(true);
    expect(result.clearTables).toEqual([]);
  });
});
