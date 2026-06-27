# Scripts

| Script | Purpose | When to run |
|--------|---------|-------------|
| **supabase-backup.ps1** | Full Postgres dump (roles, schema, data) to `backups/supabase-<timestamp>/`. Database only — not Storage. | `npm run db:backup`. Requires `DATABASE_URL` in `.env.local` or `.env`; use `DIRECT_URL` (port 5432) when set. Needs `pg_dump` on PATH (or Supabase CLI + Docker). |
| **supabase-storage-backup.js** | Download Storage objects to `backups/storage-<timestamp>/` (default: `portraits`, `profile-pictures`). | `npm run storage:backup`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional `STORAGE_BACKUP_BUCKETS=b1,b2`. |
| **seed-to-supabase.js** | Seed codex tables from CSV (`scripts/seed-data/` or `codex_csv/`) into Supabase. Clears codex tables then upserts. | `npm run db:seed` or `npm run db:seed:reset`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. |
| **seed-core-rules.js** | Upsert `core_rules` table with game rules (progression, conditions, etc.). Idempotent. | `node scripts/seed-core-rules.js`. Optional: `--export-json` for backup. |
| **provision-e2e-baseline.js** | Create/update E2E test user + deterministic character/campaign for Playwright auth baselines (TASK-385). | `npm run e2e:provision`. Requires `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`. |
| **reconcile_tasks.js** | Reconcile AI_TASK_QUEUE.md with git history; writes `reports/task-reconcile-report.json`. `--apply` appends to AI_CHANGELOG; `--strict` fails if any done task has no matching commit. | CI (report-only) or locally. |
| **extract_feedback.js** | Parse raw entries from ALL_FEEDBACK_CLEAN.md and append task stubs to AI_TASK_QUEUE. | After adding raw feedback; review before merge. |
| **triage_tasks.js** | Infer `related_files` for tasks with empty related_files. `--apply` to update queue. | Optional; dry-run by default. |
| **session_submit.js** | Append raw feedback to ALL_FEEDBACK_CLEAN.md, then run extractor and triage. Optional `--autopush`. | When submitting owner feedback. |
| **check-feats-ids.js** | One-off: check for duplicate feat IDs in `codex_csv/Realms Codex Test - Feats.csv`. | Dev/optional; not in npm scripts. |

**Database schema:** See [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). SQL run order: [sql/README.md](../sql/README.md).

**Linting:** These Node scripts use CommonJS `require()`. Root `eslint.config.mjs` turns off `@typescript-eslint/no-require-imports` for `scripts/**` so `npm run lint` stays clean without converting seeds to ESM.

**Removed / legacy:** `inject-env-vanilla.js` — removed; no longer in package.json.
