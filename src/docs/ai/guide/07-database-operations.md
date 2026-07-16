> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Database Operations (Canonical Policy)

**One policy** (also in `ARCHITECTURE_CONSTITUTION.md` / `AGENTS.md`):

1. Prefer **Supabase MCP `apply_migration`** for DDL when the plugin is available.
2. Else run the same SQL in **Dashboard → SQL Editor**.
3. Always keep idempotent SQL under `sql/` and update `SUPABASE_SCHEMA.md`.
4. **Codex / `core_rules` data:** audit → propose SQL → **owner approve** → apply (MCP or Dashboard). See `realms-codex-data.mdc`.
5. Human-only fallbacks: `DEVELOPER_TASK_QUEUE.md`.

| Operation | Preferred tool | Notes |
|-----------|----------------|-------|
| DDL | MCP `apply_migration` | snake_case `name` + SQL body; Dashboard OK if MCP unavailable |
| Seed / verify DML | MCP `execute_sql` | Prefer for non-codex seeds; codex mutates need owner approve |
| Pre-flight | `list_tables` / schema doc | Match `SUPABASE_SCHEMA.md` |
| Post-flight | `get_advisors` | After RLS/policy changes |

**Project:** RealmsRPG-Test → `lbqhiwudvifmkjtkccdg`.
