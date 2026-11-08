> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Database Operations (Canonical Policy)

**Production and shared live databases:** No DDL or DML without **Kadin explicit OK** and a **fresh backup** taken immediately beforehand. Agents do not apply migrations, run seed scripts against a live URL, paste SQL into a dashboard, or use CLI deploy flags that target production.

**Non-production work:** Use a dedicated test or local project. Prefer Supabase MCP `apply_migration` for DDL when the plugin is available; otherwise run owner-approved idempotent SQL on that non-production project only, and update `SUPABASE_SCHEMA.md`. Applied migrations live on the database (`supabase_migrations.schema_migrations`); the repo keeps a new-table template, drift tooling, and `schema/0000_baseline_*` under `sql/` — not a replay library after apply (see `sql/README.md`).

**Codex / `core_rules` data:** audit → propose SQL → **Kadin explicit OK** → apply on the approved environment only. See `realms-codex-data.mdc`.

**Scripts that write:** `node scripts/seed-core-rules.js --export-json` writes repo JSON only (no database). Codex reference data is maintained in live Supabase, not repo CSV seeds.

| Operation | Preferred tool | Notes |
|-----------|----------------|-------|
| DDL | MCP `apply_migration` on non-prod | Draft SQL from `sql/_TEMPLATE_new_table.sql`; apply on approved env only |
| Read-only checks | MCP `list_tables`, schema doc | Match `SUPABASE_SCHEMA.md` |
| Post-flight (after approved change) | MCP `get_advisors` | After RLS/policy changes |

Human-only fallbacks and historical notes may appear in archived docs; this file is the live policy.
