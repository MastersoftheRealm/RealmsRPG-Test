# Scripts

| Script | Purpose | When to run |
|--------|---------|-------------|
| **supabase-backup.ps1** | Full Postgres dump (roles, schema, data) to `backups/supabase-<timestamp>/`. Database only — not Storage. Verifies every output file before printing SUCCESS; exits non-zero and renames the folder to `-FAILED` otherwise. Tool output goes to `backup.log`. | `npm run db:backup`. Requires `DATABASE_URL` in `.env.local` or `.env`; use `DIRECT_URL` (port 5432) when set. Needs `pg_dump` on PATH (or Supabase CLI + Docker). |
| **supabase-storage-backup.js** | Download Storage objects to `backups/storage-<timestamp>/` (all four buckets: `portraits`, `profile-pictures`, `codex-art`, `vtt-maps`). A failing bucket does not abort the rest, but the run exits non-zero. | `npm run storage:backup`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional `STORAGE_BACKUP_BUCKETS=b1,b2`. |
| **seed-to-supabase.js** | Seed codex tables from CSV (`scripts/seed-data/` or `codex_csv/`). **Upsert-only by default — never deletes.** See § Seeding below. | `npm run db:seed`, `npm run db:seed:dry-run`, `npm run db:seed:reset`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. |
| **seed-plan.mjs** | Pure decision logic for what the seeder may delete/upsert. Unit-tested in `seed-plan.test.mjs`. | Imported by `seed-to-supabase.js`; not run directly. |
| **seed-core-rules.js** | Upsert `core_rules` table with game rules (progression, conditions, etc.). Idempotent. | `node scripts/seed-core-rules.js`. Optional: `--export-json` for backup. |
| **generate-db-types.mjs** | Regenerates `src/types/database.types.ts` from the live project (`supabase gen types typescript --schema public`). Prepends a do-not-edit header. | `npm run db:types`. Optional `SUPABASE_PROJECT_ID` (default `lbqhiwudvifmkjtkccdg`). Requires network + Supabase CLI via npx. See ADR-0020. |
| **db-schema-diff.mjs** | Diff the live schema against `sql/schema/0000_baseline_<date>.sql`; exits non-zero on drift. `--update` refreshes the baseline. | `npm run db:diff` / `npm run db:baseline:update`. Requires `DIRECT_URL` or `DATABASE_URL` + `pg_dump`. See [sql/README.md](../sql/README.md) § Drift detection. |
| **check-codex-drift.mjs** | Scan `codex_change_logs` for fields that went value → null **without** the null being recorded in `changed_fields` (collateral loss, not a deliberate edit). | `npm run db:check-codex-drift`. Manual/scheduled — needs DB credentials, so it is deliberately not a PR gate. |
| **sync-feat-tags-csv.js** | Refresh `scripts/seed-data/feats.csv` tag column from the live DB. Kept because it is the only tool that closes seed-CSV↔DB drift. | `node scripts/sync-feat-tags-csv.js` after approved codex tag changes. |
| **provision-e2e-baseline.js** | Create/update E2E test user + deterministic character/campaign for Playwright auth baselines (TASK-385). | `npm run e2e:provision`. Requires `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`. |
| **check-contrast.mjs** | WCAG-AA contrast check of every semantic fg/bg token pair in both themes. | `npm run verify:contrast`. |
| **mobile-audit-auth.mjs** | Authenticated mobile UX audit (E2E login). `--only sheet` also measures C1 panel heights, C4 dock/FAB/modal-footer overlaps, and tour Next vs dock/FAB at 360/390 plus desktop 1280. | `node scripts/mobile-audit-auth.mjs [--base http://localhost:3000] [--only sheet]`. Requires `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in `.env.local` and a running server. |
| **mobile-slices.mjs** | Capture one route as readable viewport-height slices with rule-breaking controls outlined (red = under 44px, orange = text overflowing its box). | `node scripts/mobile-slices.mjs /creature-creator 6 390`. |
| **mobile-compare.mjs** | Measure control-height distribution, list-row height, and chrome-before-content on our pages against an external reference (D&D Beyond), so density claims are numbers not vibes. | `node scripts/mobile-compare.mjs`. Needs network + a running server. |
| **verify:responsive** | Multi-width layout gate (ADR-0023): 8 guest routes × 360/390/768/1024/1280/1440. Fails when overflow, clip-without-ellipsis, or fixed-element collision counts *increase* vs `tests/visual/responsive-baseline.json`. | `npm run verify:responsive`. Update: `npm run verify:responsive:update` (`--workers=1`). Wired in `ui-verify.yml`. |
| **reconcile_tasks.js** | Reconcile AI_TASK_QUEUE.md with git history; writes `reports/task-reconcile-report.json`. `--apply` appends to AI_CHANGELOG; `--strict` fails if any done task has no matching commit. | CI (report-only) or locally. |
| **extract_feedback.js** | Parse raw entries from ALL_FEEDBACK_CLEAN.md and append task stubs to AI_TASK_QUEUE. | After adding raw feedback; review before merge. |
| **triage_tasks.js** | Infer `related_files` for tasks with empty related_files. `--apply` to update queue. | Optional; dry-run by default. |
| **run-task-649-phase2.mjs** / **verify-task-649.mjs** | Replay + verify the TASK-649 least-privilege migration. | Referenced as the replay path by `SUPABASE_SCHEMA.md` §4.1 and `BUILD_VALIDATION.md` DEV-V-041. |
| **run-task-650.mjs** / **verify-task-650.mjs** | Replay + verify the TASK-650 campaigns RLS consolidation. | Referenced by `sql/README.md` and `BUILD_VALIDATION.md` DEV-V-042. |

## Seeding

`db:seed` upserts and never deletes. Deletion is opt-in and narrow:

| Flag | Effect |
|------|--------|
| *(none)* | Upsert only. Nothing is deleted, ever. |
| `--dry-run` | Print rows found per CSV, rows currently live per table, and the exact planned actions. No writes. |
| `--reset` | Clear-then-seed, but **only** tables that have a valid non-empty CSV. Refused outright while any codex table has no usable CSV. |
| `--allow-partial-reset` | Acknowledges that tables without a CSV (today: `codex_archetypes`) will be left untouched rather than emptied. |
| `--yes` | Skip the typed confirmation (CI only). Without a TTY and without `--yes`, a reset aborts. |

Every CSV is parsed and validated **before** any delete is issued, so a run with missing or
misnamed files cannot empty a table it has no data to restore.

## Git hooks

Husky (`core.hooksPath=.husky/_`):

| Hook | Runs | Skip |
|------|------|------|
| `pre-commit` | `lint-staged` → ESLint `--fix --max-warnings 0` on staged JS/TS. | `git commit --no-verify` |
| `pre-push` | `npm run typecheck` (whole project) + `npm test`. | `REALMS_SKIP_PREPUSH=1 git push` |

The whole-project typecheck lives in `pre-push`, not `pre-commit`: the previous
`typecheck-staged.mjs` built a temp tsconfig containing only the staged files, so it could
not see any consumer of a changed type. It has been removed.

**Database schema:** See [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). SQL run order: [sql/README.md](../sql/README.md).

**Linting:** These Node scripts use CommonJS `require()`. Root `eslint.config.mjs` turns off `@typescript-eslint/no-require-imports` for `scripts/**` so `npm run lint` stays clean without converting seeds to ESM.

**Removed / legacy:** `inject-env-vanilla.js`, `typecheck-staged.mjs`, `session_submit.js`, `check-feats-ids.js`, `list-raw-color-backlog.mjs`, `slim-task-queue.js`, `smoke-realms-images-api.js`, `guided-creator-screenshots.mjs`, `migrate-fg-tokens.mjs`, `migrate-primary-tokens.mjs`, `fix-mojibake-639.py` — completed one-shots, removed; git history preserves them.
