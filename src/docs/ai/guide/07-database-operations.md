> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Database Operations (Canonical Policy)

**Production and shared live databases:** No DDL or DML without **explicit owner approval** and a **fresh backup** taken immediately beforehand. Agents do not apply migrations, run seed scripts against a live URL, paste SQL into a dashboard, or use CLI deploy flags that target production.

**Non-production work:** Use a dedicated test or local project. Prefer Supabase MCP `apply_migration` for DDL when the plugin is available; otherwise run the same idempotent SQL from `sql/` on that non-production project only, and update `SUPABASE_SCHEMA.md`.

**Codex / `core_rules` data:** audit → propose SQL → **owner approve** → apply on the approved environment only. See `realms-codex-data.mdc`.

**Scripts that write:** `npm run db:seed` upserts codex CSVs to whichever database the env vars point at — treat it as production-capable and do not run it against production without owner approval. `node scripts/seed-core-rules.js --export-json` writes repo JSON only (no database).

| Operation | Preferred tool | Notes |
|-----------|----------------|-------|
| DDL | MCP `apply_migration` on non-prod | Idempotent SQL lives under `sql/` |
| Read-only checks | MCP `list_tables`, schema doc | Match `SUPABASE_SCHEMA.md` |
| Post-flight (after approved change) | MCP `get_advisors` | After RLS/policy changes |

Human-only fallbacks and historical notes may appear in archived docs; this file is the live policy.
