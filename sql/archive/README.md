# Archive — Legacy SQL (do not run on current DB)

These scripts targeted the **old multi-schema** layout (`codex`, `users`, etc.). The app now uses a **single `public` schema** only. Kept for reference and one-off recovery only.

**Do not run these on a current public-only database.**

| File | Why archived |
|------|----------------|
| `supabase-codex-tables-columnar.sql` | Creates codex_* in **codex** schema |
| `supabase-official-library-columnar.sql` | Creates official_* in **codex** schema |
| `supabase-user-library-columnar.sql` | Alters **users**.user_* tables |
| `supabase-rls-policies.sql` | Multi-schema RLS (codex.*, etc.) |
| `supabase-idempotent-full.sql` | Full multi-schema setup (pre–Path C) |
| `force-drop-codex-core-rules-part-a-terminate.sql` | One-time fix for codex.core_rules lock |
| `force-drop-codex-core-rules-part-b-drop.sql` | One-time fix: drop codex.core_rules |

Current scripts live in `sql/`; see `sql/README.md` for what to run.
