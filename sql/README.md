# SQL — Migrations & One-Off Scripts

**Current schema reference:** [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). All app tables live in the `public` schema. Do not duplicate table layout here. **Owner checklist for DB consistency:** [src/docs/DATABASE_CONSISTENCY_CHECKLIST.md](../src/docs/DATABASE_CONSISTENCY_CHECKLIST.md).

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
| **supabase-official-library-columnar-expansion.sql** | Official powers: add range_steps, duration_*, area_*, damage columns; backfill from payload | Run after official-library-public-schema; see [OFFICIAL_LIBRARY_COLUMNAR_PLAN.md](../src/docs/OFFICIAL_LIBRARY_COLUMNAR_PLAN.md). |
| **supabase-user-species-columnar.sql** | user_species columnar (codex_species columns + user_id + payload) | Run once; backfill from data, then drop data. |
| **supabase-user-species-grants-rls.sql** | `GRANT` + RLS on `user_species` for `authenticated` | Run if logs show **permission denied for table user_species** (missing table privileges after manual SQL). |
| **supabase-campaign-members-grants.sql** | `GRANT` on `public.campaign_members` for `authenticated` (+ service_role) | Run if logs show **permission denied for table campaign_members** (join/upsert/member list fails). |
| **supabase-characters-rls-cross-read.sql** | RLS SELECT on `public.characters` for **public** + **campaign** visibility (non-owners) | Run if viewers get **Character not found** for another player’s sheet: old RLS only allowed owner SELECT, so the API never received the row. |
| **supabase-encounters-list-columns.sql** | Encounters: add name, type, status columns; backfill from data | Optional; list/filter by columns. |
| **supabase-characters-list-columns.sql** | Characters: add name, level, archetype_name, ancestry_name, status, visibility; backfill from data | Hybrid list columns (TASK-282). |
| **supabase-campaign-rolls-list-columns.sql** | Campaign rolls: add character_id, user_id, type, title; backfill from data | Hybrid list columns (TASK-283). |
| **supabase-campaign-rolls-id-default.sql** | `campaign_rolls.id`: optional `DEFAULT gen_random_uuid()` (uuid or text column) | Run only if you want DB-side defaults; **app POST now always sets `id`**. Fixes logs: *null value in column "id"* on insert. |
| **supabase-codex-rls-public.sql** | RLS for codex_* and core_rules in public (SELECT TO public) | Run if GET /api/codex returns 500 (permission denied). |
| **supabase-campaign-members.sql** | campaign_members table | May already exist from consolidation |
| **supabase-user-profiles-timestamps-default.sql** | user_profiles: set DEFAULT now() on created_at, updated_at | Run if inserts fail with "null value in column updated_at" |
| **supabase-user-profiles-username-display.sql** | user_profiles: add `username_display` and backfill from canonical `username` | Run once to preserve entered username casing in UI while keeping lowercase canonical uniqueness |
| **supabase-role-policies.sql** | Create `role_policies` table + seed defaults + RLS for admin-managed role quotas/permissions | Run once before enabling `/admin/roles` and quota enforcement |
| **supabase-ui-tooltips.sql** | Adds `user_profiles.show_tooltips`, creates `ui_tooltips` table, RLS policies, and initial seed tooltips | Run once when enabling tooltip system |

**Legacy scripts (do not run on current public-only DB)** are in [sql/archive/](archive/): codex-schema columnar, official-library in codex, user-library in users, multi-schema RLS, idempotent-full, force-drop-codex scripts.

---

## Data migration: columnar and hybrid columns

After deploying app code that uses the new columnar or list-column schema, run the corresponding SQL in **Supabase Dashboard → SQL Editor** to create tables/columns and **backfill existing data**. Recommended order:

1. **supabase-official-library-public-schema.sql** — Creates `official_*` in public and backfills from `public_*`. Run if you want GET /api/public to prefer official_*.
2. **supabase-official-library-columnar-expansion.sql** — Adds range/duration/area/damage columns to `official_powers`; backfills from payload. Run after (1) for more columnar powers; optional.
3. **supabase-user-species-columnar.sql** — Adds columnar columns to `user_species`, backfills, drops `data`. Run once per environment.
4. **supabase-encounters-list-columns.sql** — Adds `name`, `type`, `status` to `encounters`; backfills. Optional.
5. **supabase-characters-list-columns.sql** — Adds list columns to `characters`; backfills. Optional but recommended for list/filter.
6. **supabase-campaign-rolls-list-columns.sql** — Adds list columns to `campaign_rolls`; backfills. Optional.
7. **supabase-ui-tooltips.sql** — Adds tooltip data table + preference column and seeds baseline tooltips.

**Back up** before running. Each script is idempotent where possible (ADD COLUMN IF NOT EXISTS, ON CONFLICT, or conditional backfill). See [SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md) §4 for status and task refs.

---

## Best practices

1. **Back up** before running any migration. Use Supabase Dashboard → Backups or export critical tables.
2. **Run in order** when doing full consolidation (1a → 1b → 1c → 1c2a → 1c2b → 2); wait for Success between parts.
3. **Do not** run path-c-phase0-* again if your DB already has only `public` schema.
4. **Drop legacy table:** `DROP TABLE IF EXISTS public._prisma_migrations;` — safe if Prisma was removed (see SUPABASE_SCHEMA.md).
5. **Supabase permissions:** Tables created or moved by raw SQL do **not** get automatic GRANTs. For the app (anon/authenticated) to access a table you need **both** (1) `GRANT SELECT` (or INSERT/UPDATE/DELETE) `ON public.<table> TO anon, authenticated` (as needed) and (2) RLS enabled with policies. See `supabase-codex-rls-public.sql` for the pattern.
