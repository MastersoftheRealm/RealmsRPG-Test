# SQL — repo tooling (not a migration library)

**Schema reference:** [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). **Generated types:** `src/types/database.types.ts` (ADR-0020).

**Source of truth:** The live Supabase database on RealmsRPG-Test. This folder no longer stores one-off migrations or replay scripts after they were applied. Historical SQL was removed **2026-10-29** (owner-approved cleanup); use **git history** if you need the old file text.

**What remains here:**

| Path | Purpose |
|------|---------|
| [`_TEMPLATE_new_table.sql`](_TEMPLATE_new_table.sql) | Required pattern for any **new** `public` table: RLS, policies, and explicit `GRANT` in the same file. CI scans changed `sql/**/*.sql` (except this template and `schema/` baselines). |
| [`codex-rename-source.sql`](codex-rename-source.sql) | Admin utility: replaces `public.rename_codex_source` only. Safe to re-run on non-prod when Kadin approves; first real rename is a live data change and needs a backup. |
| [`schema/0000_baseline_2026-08-13.sql`](schema/0000_baseline_2026-08-13.sql) | Committed `pg_dump --schema-only` snapshot (**stale** vs live — regenerate before relying on it). |
| [`schema/0001_audit_remediation_security_2026-08-13.sql`](schema/0001_audit_remediation_security_2026-08-13.sql) | Wave-1 audit remediation (objects already live; folded into a future baseline). |
| [`schema/0002_codex_locking_and_atomic_levels_2026-08-13.sql`](schema/0002_codex_locking_and_atomic_levels_2026-08-13.sql) | Codex locking follow-up (live). |

**`supabase_migrations.schema_migrations`:** After a reset around **2026-09-26**, the live table has **7 rows** only (`remote_schema`, three `86e3*` migrations, `codex_entry_sources`, `codex_entry_sources_open`). Do not treat this README or old docs as a full migration catalog.

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
