# SQL — repo tooling (not a migration library)

**Schema reference:** [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). **Generated types:** `src/types/database.types.ts` (ADR-0020).

**Source of truth:** The live Supabase database on RealmsRPG-Test, including which migrations have been applied (`supabase_migrations.schema_migrations`). Table/column documentation lives in `src/docs/SUPABASE_SCHEMA.md`. This folder no longer stores one-off migrations or replay scripts after they were applied. Historical SQL was removed **2026-10-29** (owner-approved cleanup) and wave-1 audit files `0001` / `0002` **2026-11-01** after a line-by-line match against live (backup taken); use **git history** if you need the old file text. The committed `schema/0000_baseline_*` snapshot stays until a deliberate `npm run db:baseline:update` refresh (`db:diff` compares live against it).

**What remains here:**

| Path | Purpose |
|------|---------|
| [`_TEMPLATE_new_table.sql`](_TEMPLATE_new_table.sql) | Required pattern for any **new** `public` table: RLS, policies, and explicit `GRANT` in the same file. CI scans changed `sql/**/*.sql` (except this template and `schema/` baselines). |
| [`characters-relational-*.sql`](characters-relational-audit.sql) | ADR-0031 relational character expansion, compatibility and contract migrations, RPCs, verification, and rollback-safe smoke tests. The compatibility stage was applied to production on 2026-11-08; the contract/drop stage remains pending and requires a fresh backup. |
| [`vtt-v1-tabletop.sql`](vtt-v1-tabletop.sql) | Virtual tabletop schema for branch-local development. Verify target state and obtain approval before applying outside the branch's local database. |
| [`codex-rename-source.sql`](codex-rename-source.sql) | Admin utility: replaces `public.rename_codex_source` only. Safe to re-run on non-prod when Kadin approves; first real rename is a live data change and needs a backup. |
| [`role-quota-atomic.sql`](role-quota-atomic.sql) | `user_profiles` row lock + `assert_account_create_quota`, quota-aware `create_character_relational` and `insert_user_library_row_with_quota`. Apply after explicit OK and backup. |
| [`schema/0000_baseline_2026-08-13.sql`](schema/0000_baseline_2026-08-13.sql) | Committed `pg_dump --schema-only` snapshot (**stale** vs live — regenerate before relying on it). |

**Relational characters (ADR-0031):** Run
[`characters-relational-audit.sql`](characters-relational-audit.sql) read-only
against the target database first. After explicit high-risk approval, apply the
expansion and compatibility phase in this order:

1. [`characters-relational-expand.sql`](characters-relational-expand.sql)
2. [`characters-relational-expand-verify.sql`](characters-relational-expand-verify.sql)
3. [`characters-relational-cutover.sql`](characters-relational-cutover.sql)
4. [`characters-relational-read-rpc.sql`](characters-relational-read-rpc.sql)
5. [`characters-relational-write-rpc.sql`](characters-relational-write-rpc.sql)
6. [`characters-relational-cutover-test.sql`](characters-relational-cutover-test.sql)

The compatibility smoke test rolls back its fixtures and covers mirror/lock parity, direct
child-write denial, and atomic campaign character join/add/remove/read paths.
The write phase first rebuilds every existing compatibility mirror from the
relational reader without changing its authoritative `updated_at` lock value.
The compatibility phase intentionally retains the legacy column for rollback.
Use the expansion verifier plus the cutover smoke test before application QA.
This six-file compatibility stage was applied successfully to RealmsRPG-Test on
2026-11-08. Do not replay it as part of the contract deployment; verify the live
state and continue with application QA/deployment.

After parity QA, deploy the relational-only application code in this branch.
That code never reads or writes the legacy character column. With another
read-only audit, Kadin's explicit approval, and a fresh backup, apply:

1. [`characters-relational-contract.sql`](characters-relational-contract.sql)
2. [`characters-relational-contract-test.sql`](characters-relational-contract-test.sql)

The contract migration takes an exclusive character-table lock, refuses to
continue unless every stored document exactly matches the relational reader,
removes the compatibility trigger, replaces the create/apply/provision RPCs,
and drops the legacy column in one transaction. The contract smoke test proves
create, idempotent replay, patch, provision, and relational reads without that
column. No application code deployment is required between contract and drop;
the drop is part of the contract transaction. Recovery after it requires the
fresh pre-contract backup.

**`supabase_migrations.schema_migrations`:** After a reset around **2026-09-26**, the live table has **11 rows** through `20261029140801_drop_empty_content_schema`. The checkout intentionally retains only the two baseline migration files, so use the live migration table—not this folder or older docs—as the applied-history catalog.

---

## Drift detection (`schema/`)

| Command | What it does |
|---------|--------------|
| `npm run db:diff` | Compares live schema to the committed baseline; exits non-zero on drift. |
| `npm run db:baseline:update` | Writes a fresh `0000_baseline_<date>.sql` after Kadin-approved work and `DIRECT_URL`. |
| `npm run db:check-codex-drift` | Scans `codex_change_logs` for suspicious nulling. |

Requires `DIRECT_URL` (or `DATABASE_URL`) and matching `pg_dump` major version. Neither command is a PR gate.

**Workflow:** When the live DB changes, update `SUPABASE_SCHEMA.md` and types (`npm run db:types`), then regenerate the baseline in a separate owner-run pass. Do not re-run deleted migration files against production.

---

## Applying changes to the database

1. Draft idempotent SQL (copy [`_TEMPLATE_new_table.sql`](_TEMPLATE_new_table.sql) for new tables).
2. **Kadin explicit OK** and a fresh backup before any production write ([`realms-codex-data.mdc`](../.cursor/rules/realms-codex-data.mdc), [`guide/07-database-operations.md`](../src/docs/ai/guide/07-database-operations.md)).
3. Apply via Supabase MCP `apply_migration` or Dashboard on the approved project.
4. Update `SUPABASE_SCHEMA.md`, regenerate types, and refresh the baseline when credentials are available.

Codex **data** edits follow the same owner gate; the app normalizes some legacy values (for example feat category `Offense` → `Offensive`) without requiring a live UPDATE until a separate task applies one.

---

## Best practices

1. **Back up** before any migration.
2. **Do not** paste deleted historical SQL into production — many scripts were superseded and re-running them would undo later security fixes.
3. **New `public` tables:** RLS + policies + `GRANT` in the **same file** as `CREATE TABLE`. CI: `npm run tasks:check-sql-grants`.
4. **Drop legacy:** `DROP TABLE IF EXISTS public._prisma_migrations;` — safe if Prisma was removed.
