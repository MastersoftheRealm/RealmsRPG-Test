# SQL — Migrations & One-Off Scripts

**Current schema reference:** [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). All app tables live in the `public` schema. Do not duplicate table layout here.

---

## When to use

- **New project / fresh DB:** Use the operator guide ([SUPABASE_PATH_C_OPERATOR_GUIDE.md](../src/docs/SUPABASE_PATH_C_OPERATOR_GUIDE.md)) for run order. Schema is consolidated to `public` via the path-c-phase0-* scripts (one-time).
- **Existing project:** Schema is already in `public`. Run only scripts that match your target (e.g. Storage RLS, optional cleanup like dropping `_prisma_migrations`).

---

## File overview

| File | Purpose | Status |
|------|---------|--------|
| **path-c-phase0-consolidate-to-public.sql** | Part 1a: Realtime drop, UserRole to public, move `users` schema → public | One-time; only if DB still has `users` schema |
| **path-c-phase0-consolidate-to-public-part1b.sql** | Part 1b: Move campaigns + encounters → public | One-time |
| **path-c-phase0-consolidate-to-public-part1c.sql** | Part 1c: Move codex_* tables → public | One-time |
| **path-c-phase0-consolidate-to-public-part1c2.sql** | Part 1c2a: Move public_powers, public_techniques → public | One-time |
| **path-c-phase0-consolidate-to-public-part1c2b.sql** | Part 1c2b: Move public_items, public_creatures → public | One-time |
| **path-c-phase0-consolidate-to-public-part2.sql** | Part 2: RLS, Realtime add, drop empty schemas | One-time |
| **create-public-core-rules.sql** | Create `public.core_rules` (id, data, updated_at) | Run after Part 2 if core_rules was dropped |
| **supabase-storage-policies.sql** | RLS for Storage buckets (portraits, profile-pictures) | Run once per project |
| **supabase-official-library-public-schema.sql** | Official library in **public** (columnar) + backfill from public_* | Run to create official_* in public and backfill from public_* (id+data). GET /api/public prefers official_*. |
| **supabase-user-species-columnar.sql** | user_species columnar (codex_species columns + user_id + payload) | Run once; backfill from data, then drop data. |
| **supabase-encounters-list-columns.sql** | Encounters: add name, type, status columns; backfill from data | Optional; list/filter by columns. |
| **supabase-characters-list-columns.sql** | Characters: add name, level, archetype_name, ancestry_name, status, visibility; backfill from data | Hybrid list columns (TASK-282). |
| **supabase-campaign-rolls-list-columns.sql** | Campaign rolls: add character_id, user_id, type, title; backfill from data | Hybrid list columns (TASK-283). |
| **supabase-codex-rls-public.sql** | RLS for codex_* and core_rules in public (SELECT TO public) | Run if GET /api/codex returns 500 (permission denied). |
| **supabase-campaign-members.sql** | campaign_members table | May already exist from consolidation |

**Legacy scripts (do not run on current public-only DB)** are in [sql/archive/](archive/): codex-schema columnar, official-library in codex, user-library in users, multi-schema RLS, idempotent-full, force-drop-codex scripts.

---

## Data migration: columnar and hybrid columns

After deploying app code that uses the new columnar or list-column schema, run the corresponding SQL in **Supabase Dashboard → SQL Editor** to create tables/columns and **backfill existing data**. Recommended order:

1. **supabase-official-library-public-schema.sql** — Creates `official_*` in public and backfills from `public_*`. Run if you want GET /api/public to prefer official_*.
2. **supabase-user-species-columnar.sql** — Adds columnar columns to `user_species`, backfills, drops `data`. Run once per environment.
3. **supabase-encounters-list-columns.sql** — Adds `name`, `type`, `status` to `encounters`; backfills. Optional.
4. **supabase-characters-list-columns.sql** — Adds list columns to `characters`; backfills. Optional but recommended for list/filter.
5. **supabase-campaign-rolls-list-columns.sql** — Adds list columns to `campaign_rolls`; backfills. Optional.

**Back up** before running. Each script is idempotent where possible (ADD COLUMN IF NOT EXISTS, ON CONFLICT, or conditional backfill). See [SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md) §4 for status and task refs.

---

## Best practices

1. **Back up** before running any migration. Use Supabase Dashboard → Backups or export critical tables.
2. **Run in order** when doing full consolidation (1a → 1b → 1c → 1c2a → 1c2b → 2); wait for Success between parts.
3. **Do not** run path-c-phase0-* again if your DB already has only `public` schema.
4. **Drop legacy table:** `DROP TABLE IF EXISTS public._prisma_migrations;` — safe if Prisma was removed (see SUPABASE_SCHEMA.md).
