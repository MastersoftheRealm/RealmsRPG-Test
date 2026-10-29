# Scripts

| Script | Purpose | When to run |
|--------|---------|-------------|
| **supabase-backup.ps1** | Full Postgres dump (roles, schema, data) to `backups/supabase-<timestamp>/`. Database only — not Storage. Verifies every output file before printing SUCCESS; exits non-zero and renames the folder to `-FAILED` otherwise. Tool output goes to `backup.log`. | `npm run db:backup`. Requires `DATABASE_URL` in `.env.local` or `.env`; use `DIRECT_URL` (port 5432) when set. Needs `pg_dump` on PATH (or Supabase CLI + Docker). |
| **supabase-storage-backup.js** | Download Storage objects to `backups/storage-<timestamp>/` (all four buckets: `portraits`, `profile-pictures`, `codex-art`, `vtt-maps`). A failing bucket does not abort the rest, but the run exits non-zero. | `npm run storage:backup`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional `STORAGE_BACKUP_BUCKETS=b1,b2`. |
| **seed-to-supabase.js** | Upsert codex tables from CSV (`scripts/seed-data/` or `codex_csv/`). **Never deletes.** | `npm run db:seed`, `npm run db:seed:dry-run`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Do not point env at production without owner approval — see [07-database-operations.md](../src/docs/ai/guide/07-database-operations.md). |
| **seed-plan.mjs** | Pure decision logic for what the seeder may upsert. Unit-tested in `seed-plan.test.mjs`. | Imported by `seed-to-supabase.js`; not run directly. |
| **seed-core-rules.js** | Export embedded `CORE_RULES` to `data/core-rules/*.json`. | `node scripts/seed-core-rules.js --export-json` only. No database writes. |
| **generate-db-types.mjs** | Regenerates `src/types/database.types.ts` from a Supabase project (`supabase gen types typescript --schema public`). Prepends a do-not-edit header. | `npm run db:types`. Requires `SUPABASE_PROJECT_ID` and network + Supabase CLI via npx. See ADR-0020. |
| **db-schema-diff.mjs** | Diff the live schema against `sql/schema/0000_baseline_<date>.sql`; exits non-zero on drift. `--update` refreshes the baseline file (not the remote DB). | `npm run db:diff` / `npm run db:baseline:update`. Requires `DIRECT_URL` or `DATABASE_URL` + `pg_dump`. See [sql/README.md](../sql/README.md) § Drift detection. |
| **check-codex-drift.mjs** | Scan `codex_change_logs` for fields that went value → null **without** the null being recorded in `changed_fields` (collateral loss, not a deliberate edit). | `npm run db:check-codex-drift`. Manual/scheduled — needs DB credentials, so it is deliberately not a PR gate. |
| **sync-feat-tags-csv.js** | Refresh `scripts/seed-data/feats.csv` tag column from a database. | Owner-approved codex tag changes only; non-production preferred. |
| **provision-e2e-baseline.js** | Create/update E2E test user + deterministic character/campaign for Playwright auth baselines (TASK-385). | `npm run e2e:provision`. Requires `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`. Non-production test project only unless owner approves. |
| **check-contrast.mjs** | WCAG-AA contrast check of every semantic fg/bg token pair in both themes. | `npm run verify:contrast`. |
| **mobile-audit-auth.mjs** | Authenticated mobile UX audit (E2E login). `--only sheet` also measures C1 panel heights, C4 dock/FAB/modal-footer overlaps, and tour Next vs dock/FAB at 360/390 plus desktop 1280. | `node scripts/mobile-audit-auth.mjs [--base http://localhost:3000] [--only sheet]`. Requires `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in `.env.local` and a running server. |
| **mobile-slices.mjs** | Capture one route as readable viewport-height slices with rule-breaking controls outlined (red = under 44px, orange = text overflowing its box). | `node scripts/mobile-slices.mjs /creature-creator 6 390`. |
| **mobile-compare.mjs** | Measure control-height distribution, list-row height, and chrome-before-content on our pages against an external reference (D&D Beyond), so density claims are numbers not vibes. | `node scripts/mobile-compare.mjs`. Needs network + a running server. |
| **verify:responsive** | Multi-width layout gate (ADR-0023): 8 guest routes × 360/390/768/1024/1280/1440. Fails when overflow, clip-without-ellipsis, or fixed-element collision counts *increase* vs `tests/visual/responsive-baseline.json`. | `npm run verify:responsive`. Update: `npm run verify:responsive:update` (`--workers=1`). Wired in `ui-verify.yml`. |
| **reconcile_tasks.js** | Writes `reports/task-reconcile-report.json`. Historical TASK-### duplicate checks retired when `src/docs/ai/archive/` was removed. Legacy `--strict` / `--apply` flags are no-ops. | CI (`ai-task-verifier.yml`). |
| **extract_feedback.js** | Retired. Exits without writing. File new work in ClickUp. | Do not run to create tasks. |
| **triage_tasks.js** | Retired. Exits without writing. File new work in ClickUp. | Do not run to update `AI_TASK_QUEUE.md`. |

## Seeding

`db:seed` upserts matching CSV rows only. Nothing is deleted.

| Flag | Effect |
|------|--------|
| *(none)* | Upsert only. |
| `--dry-run` | Print rows found per CSV, rows currently live per table, and planned upserts. No writes. |

Every CSV is parsed and validated **before** any upsert is issued.

## Git hooks

Husky (`core.hooksPath=.husky/_`):

| Hook | Runs | Skip |
|------|------|------|
| `pre-commit` | `lint-staged` → ESLint `--fix --max-warnings 0` on staged JS/TS. | `git commit --no-verify` |
| `pre-push` | Nothing. Typecheck and the unit suite run in CI (`ai-task-verifier.yml`). | `REALMS_SKIP_PREPUSH=1` is accepted and unused. |

Typecheck is not a local pre-push hook. `typecheck-staged.mjs` was already removed
because a staged-only config could not see consumers of a changed type. CI runs
`npm run typecheck` and `npm test` on the pull request.

**Database schema:** See [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). SQL run order: [sql/README.md](../sql/README.md). Live writes: [src/docs/ai/guide/07-database-operations.md](../src/docs/ai/guide/07-database-operations.md).

**Linting:** These Node scripts use CommonJS `require()`. Root `eslint.config.mjs` turns off `@typescript-eslint/no-require-imports` for `scripts/**` so `npm run lint` stays clean without converting seeds to ESM.

**Removed / legacy:** One-off task replay/verify scripts, `inject-env-vanilla.js`, `typecheck-staged.mjs`, and other completed migration helpers — removed; git history preserves them.
