/**
 * Seed decision logic (pure)
 * ==========================
 * Decides what `scripts/seed-to-supabase.js` is allowed to delete and upsert, given
 * already-parsed CSV input and live row counts. No I/O, no Supabase, no process exit —
 * so the destructive rules are unit-testable.
 *
 * Rules:
 *  1. Without `--reset`, nothing is ever deleted (upsert only).
 *  2. With `--reset`, only tables whose CSV can fully repopulate them may be cleared.
 *     A CSV with id-less rows still upserts its good rows, but can never authorise a delete.
 *  3. `--reset` is refused outright when any codex table fails that test, unless
 *     `--allow-partial-reset` acknowledges the tables that will be left alone.
 *  4. Any planned delete requires typed confirmation, or `--yes` for non-interactive runs.
 */

export const SEED_FLAGS = ['--reset', '--allow-partial-reset', '--dry-run', '--yes'];

export function parseSeedArgs(argv) {
  const args = argv.filter((arg) => arg.startsWith('--'));
  const unknown = args.filter((arg) => !SEED_FLAGS.includes(arg));
  return {
    reset: args.includes('--reset'),
    allowPartialReset: args.includes('--allow-partial-reset'),
    dryRun: args.includes('--dry-run'),
    yes: args.includes('--yes'),
    unknown,
  };
}

/**
 * @param {object} input
 * @param {string[]} input.tables            Every codex table the seeder manages.
 * @param {Record<string, {file: string, rowCount: number, invalidRows?: number}>} input.loaded
 *   Parsed CSV input keyed by table name.
 * @param {Record<string, number|null>} input.liveCounts  Current row count per table (null = unknown).
 * @param {ReturnType<typeof parseSeedArgs>} input.options
 */
export function buildSeedPlan({ tables, loaded, liveCounts = {}, options }) {
  const upsertTables = [];
  const resettable = [];
  const notResettable = [];
  const untouchedTables = [];

  const ordered = [...tables, ...Object.keys(loaded).filter((table) => !tables.includes(table))];

  for (const table of ordered) {
    const entry = loaded[table];
    const liveRows = liveCounts[table] ?? null;

    if (!entry || entry.rowCount === 0) {
      untouchedTables.push({
        table,
        liveRows,
        reason: entry ? `${entry.file} parsed to 0 rows` : 'no CSV file maps to this table',
      });
      continue;
    }

    const row = { table, file: entry.file, csvRows: entry.rowCount, liveRows };
    upsertTables.push(row);

    if (entry.invalidRows) {
      notResettable.push({ ...row, reason: `${entry.invalidRows} CSV row(s) have no usable id` });
    } else {
      resettable.push(row);
    }
  }

  const unrepopulatable = [...untouchedTables, ...notResettable].filter((row) =>
    tables.includes(row.table),
  );

  const blockers = [];
  if (options.unknown.length > 0) {
    blockers.push(
      `Unknown flag(s): ${options.unknown.join(', ')}. Supported: ${SEED_FLAGS.join(' ')}`,
    );
  }
  if (upsertTables.length === 0) {
    blockers.push('No table has a valid non-empty CSV; there is nothing to seed.');
  }
  if (options.reset && unrepopulatable.length > 0 && !options.allowPartialReset) {
    blockers.push(
      `--reset refused: ${unrepopulatable.length} codex table(s) cannot be fully repopulated from CSV ` +
        `(${unrepopulatable.map((row) => row.table).join(', ')}). ` +
        'Re-run with --allow-partial-reset to clear only the tables that can be.',
    );
  }

  const clearTables = options.reset && blockers.length === 0 ? resettable : [];

  return {
    mode: options.reset ? 'reset' : 'upsert',
    dryRun: options.dryRun,
    upsertTables,
    clearTables,
    notResettable,
    untouchedTables,
    blockers,
    requiresConfirmation: clearTables.length > 0 && !options.yes,
  };
}

export function formatSeedPlan(plan, { seedDir }) {
  const cleared = new Set(plan.clearTables.map((row) => row.table));
  const blocked = new Map(plan.notResettable.map((row) => [row.table, row.reason]));

  const lines = [];
  lines.push(`Seed source: ${seedDir}`);
  lines.push(`Mode: ${plan.mode}${plan.dryRun ? ' (dry run)' : ''}`);
  lines.push('');
  lines.push('Table                  CSV rows   Live rows   Action');

  for (const row of plan.upsertTables) {
    let action = 'upsert';
    if (cleared.has(row.table)) {
      action = `DELETE ALL ${row.liveRows ?? '?'} row(s), then upsert ${row.csvRows}`;
    } else if (plan.mode === 'reset' && blocked.has(row.table)) {
      action = `upsert only — not cleared (${blocked.get(row.table)})`;
    }
    lines.push(
      `${row.table.padEnd(22)} ${String(row.csvRows).padStart(8)}   ${String(row.liveRows ?? '?').padStart(9)}   ${action}`,
    );
  }

  for (const row of plan.untouchedTables) {
    lines.push(
      `${row.table.padEnd(22)} ${'-'.padStart(8)}   ${String(row.liveRows ?? '?').padStart(9)}   left untouched (${row.reason})`,
    );
  }

  return lines.join('\n');
}
