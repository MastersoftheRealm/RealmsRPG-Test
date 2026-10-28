/**
 * Seed decision logic (pure)
 * ==========================
 * Decides what `scripts/seed-to-supabase.js` may upsert, given already-parsed CSV
 * input and live row counts. No I/O, no Supabase, no deletes — upsert only.
 */

export const SEED_FLAGS = ['--dry-run'];

export function parseSeedArgs(argv) {
  const args = argv.filter((arg) => arg.startsWith('--'));
  const unknown = args.filter((arg) => !SEED_FLAGS.includes(arg));
  return {
    dryRun: args.includes('--dry-run'),
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

    upsertTables.push({ table, file: entry.file, csvRows: entry.rowCount, liveRows });
  }

  const blockers = [];
  if (options.unknown.length > 0) {
    blockers.push(
      `Unknown flag(s): ${options.unknown.join(', ')}. Supported: ${SEED_FLAGS.join(' ')}`,
    );
  }
  if (upsertTables.length === 0) {
    blockers.push('No table has a valid non-empty CSV; there is nothing to seed.');
  }

  return {
    mode: 'upsert',
    dryRun: options.dryRun,
    upsertTables,
    clearTables: [],
    notResettable: [],
    untouchedTables,
    blockers,
    requiresConfirmation: false,
  };
}

export function formatSeedPlan(plan, { seedDir }) {
  const lines = [];
  lines.push(`Seed source: ${seedDir}`);
  lines.push(`Mode: ${plan.mode}${plan.dryRun ? ' (dry run)' : ''}`);
  lines.push('');
  lines.push('Table                  CSV rows   Live rows   Action');

  for (const row of plan.upsertTables) {
    lines.push(
      `${row.table.padEnd(22)} ${String(row.csvRows).padStart(8)}   ${String(row.liveRows ?? '?').padStart(9)}   upsert`,
    );
  }

  for (const row of plan.untouchedTables) {
    lines.push(
      `${row.table.padEnd(22)} ${'-'.padStart(8)}   ${String(row.liveRows ?? '?').padStart(9)}   left untouched (${row.reason})`,
    );
  }

  return lines.join('\n');
}
