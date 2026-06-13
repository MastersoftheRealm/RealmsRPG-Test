# Supabase Path C — Step-by-step operator guide

**Purpose:** You (the project owner) run SQL in Supabase to align the database with Path C (single `public` schema, no Prisma, raw SQL). Use this as the single place for **what to run, in what order, and what to expect.**

**Context:** Current schema: [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md). SQL file list and run order: [sql/README.md](../sql/README.md). Historical migration plan: [ai/archive/PATH_C_MIGRATION_PLAN.md](ai/archive/PATH_C_MIGRATION_PLAN.md). This guide is the **operator checklist** only.

---

## Before you start

- **Back up** the project (Supabase Dashboard → Project Settings → Database → or use Backups). Exporting tables as CSV (e.g. “Supabase Backup 2-25-26” style) gives you user data (characters, user_powers, user_techniques, user_items, user_creatures, user_species, user_profiles, campaigns, public_*, core_rules) for restore if needed.
- You can **delete data** where needed to fix structure (e.g. going from JSONB-only to columnar). The scripts below **move** tables and preserve row data; optional columnar steps may replace or transform data.
- **User data:** Phase 0 only moves tables to `public`; it does not drop or clear user-created content. To keep user data from a backup, restore after Phase 0 (see “Backup and restoring user data” below).

---

## Step 1: Consolidate all tables into `public` (Phase 0) — run in four parts

Phase 0 is split into **four SQL files** so each run is short and stays under the SQL Editor timeout. Run in order; wait for **Success** after each before the next.

1. **Part 1a** — `sql/path-c-phase0-consolidate-to-public.sql`: Realtime drop, UserRole enum to public, move **users** schema (8 tables). Run, wait for Success.
2. **Part 1b** — `sql/path-c-phase0-consolidate-to-public-part1b.sql`: Create campaign_members (if missing), move **campaigns** + **encounters**. Run, wait for Success.
3. **Part 1c** — `sql/path-c-phase0-consolidate-to-public-part1c.sql`: Move **codex** reference tables (9 tables: codex_feats through codex_creature_feats). Run, wait for Success.
4. **Part 1c2a** — `sql/path-c-phase0-consolidate-to-public-part1c2.sql`: Move public_powers + public_techniques only (core_rules is skipped; see “Core rules” section below). Run, wait for Success.
5. **Part 1c2b** — `sql/path-c-phase0-consolidate-to-public-part1c2b.sql`: Move public_items + public_creatures (2 tables). Run, wait for Success.
6. **Part 2** — `sql/path-c-phase0-consolidate-to-public-part2.sql`: RLS for campaigns/campaign_members/campaign_rolls, Realtime add, drop empty schemas. Run, wait for Success.

**Fix applied (Feb 2026):** Part 1a drops the column default on `role` before changing the enum type, then restores it (fixes "default cannot be cast" error).

**Check:** In Supabase **Table Editor**, you should see **only** the `public` schema, and all app tables (user_profiles, characters, campaigns, codex_feats, etc.) under `public`.

---

## Step 2: (Optional) Codex columnar — only if codex is still `id` + `data`

If your codex tables are still **two columns** (`id` + `data` JSONB) and you want **proper columns** (for CSV drag-and-drop and filtering):

- **Post–Path C:** All tables are in **`public`** only; there is no `codex` schema. The repo’s **`sql/supabase-codex-tables-columnar.sql`** was written for a `codex` schema; for current layout you need a variant that creates/alters tables in **`public`** (e.g. replace `codex.` with `public.` and run in `public`). Running the script as-is would create tables in `codex`; after Phase 0 that schema is dropped, so use a public-only variant.
- **If you have not yet run Phase 0:** You could run the columnar script (creates in `codex`), then run Step 1 — Part 1c moves those tables into `public` by name.
- **If you already have columnar codex tables in `public`** (e.g. from a previous migration or seed), skip this step.

---

## Step 3: Storage RLS (if not already done)

If you use **Storage** for portraits or profile pictures:

1. Open **`sql/supabase-storage-policies.sql`** in this repo.
2. Copy the entire file and run it in Supabase **SQL Editor**.

This is independent of Path C; run once per project.

---

## Step 4: After the database is aligned

- **Realtime in the app:** Realtime subscriptions use `schema: 'public'` and `table: 'campaign_rolls'` or `table: 'characters'`. See [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md).

---

## Quick reference: SQL files and order

| Order | File | When |
|-------|------|------|
| 1a | **`sql/path-c-phase0-consolidate-to-public.sql`** | Realtime + enum + move users schema. Run first. |
| 1b | **`sql/path-c-phase0-consolidate-to-public-part1b.sql`** | Move campaigns + encounters. Run after 1a. |
| 1c | **`sql/path-c-phase0-consolidate-to-public-part1c.sql`** | Move codex reference tables (9). Run after 1b. |
| 1c2a | **`sql/path-c-phase0-consolidate-to-public-part1c2.sql`** | Move public_powers + public_techniques only (core_rules skipped — see below). Run after 1c. |
| 1c2b | **`sql/path-c-phase0-consolidate-to-public-part1c2b.sql`** | Move public_items + public_creatures (2). Run after 1c2a. |
| 2 | **`sql/path-c-phase0-consolidate-to-public-part2.sql`** | RLS, Realtime add, drop schemas. Run after 1c2b. |
| 2 (optional) | **`sql/supabase-codex-tables-columnar.sql`** | Only if you want columnar codex and haven’t run it yet; run **before** Step 1 if you want columnar tables moved to public. |
| 3 | **`sql/supabase-storage-policies.sql`** | Once per project for Storage RLS. |

---

## Backup and restoring user data

**Current backup format (e.g. Supabase Backup 2-25-26):** CSV exports per table. Many tables were stored as **JSONB** (e.g. `id`, `data` or `id`, `user_id`, `data`), so the CSV may have few columns with `data` as a JSON string. Columnar tables (e.g. codex after you made them columnar, or user_* if you ran the user-library columnar script) have one column per field.

**Preserving user data through Path C:**

- **Phase 0** only moves tables; it does **not** drop or truncate. All rows (user_profiles, characters, user_powers, user_techniques, user_items, user_creatures, user_species, campaigns, public_*, core_rules) stay intact.
- If you run **optional columnar** steps (e.g. converting public_* or user_* from id+data to columns), those scripts may **replace** or **migrate** data. Back up first; restore from CSV if needed.
- **Restoring from backup CSVs:** After Phase 0, tables are in `public`. Use Supabase Table Editor → Import CSV, or a one-off script that reads your backup CSVs and inserts/upserts into the correct `public.*` table (matching column names). For JSONB columns, ensure the CSV column is valid JSON.

**User-created content to preserve:** characters, user_powers, user_techniques, user_items, user_creatures, user_species, user_profiles, usernames, campaigns, and optionally public_powers/techniques/items/creatures if you have admin-curated content. core_rules is one row per category (id = category key, data = JSON).

---

## Core rules (stuck table in codex — re-create in public after Part 2)

**What happened:** The `codex.core_rules` table could not be moved to public (timeout) and could not be deleted (timeout). Part 1c2a **does not** move `core_rules`; it only moves `public_powers` and `public_techniques`.

**After Part 2:** Part 2 runs `DROP SCHEMA codex CASCADE`, which **drops the stuck** `codex.core_rules` table. Then:

1. **Create the table in public:** Run **`sql/create-public-core-rules.sql`** in Supabase SQL Editor. This creates `public.core_rules` (id TEXT, data JSONB, updated_at) and RLS (anyone can read).
2. **Re-seed from saved data:** Core rules data is saved in two places:
   - **`data/core-rules/*.json`** — one JSON file per category (13 files). Generate/refresh with: `node scripts/seed-core-rules.js --export-json`.
   - **Embedded in `scripts/seed-core-rules.js`** — the same CORE_RULES object. Seed the DB with: `node scripts/seed-core-rules.js` (writes to Supabase `public.core_rules`).

**Structure:** One row per category (`id` = e.g. `PROGRESSION_PLAYER`, `ABILITY_RULES`; `data` = JSONB). App and admin use this shape; see `src/types/core-rules.ts` and admin core-rules page.

---

## If something goes wrong

- **Realtime not working:** Ensure `public.campaign_rolls` and `public.characters` are in the `supabase_realtime` publication (Supabase Dashboard → Database → Realtime or run the Realtime block from the Phase 0 script again).
- **RLS errors:** Ensure all policies in the Phase 0 script ran; campaigns/campaign_rolls/campaign_members must reference `public.campaigns` and `public.campaign_members`.
- **Missing tables:** If a table was created in a different schema or name, the Phase 0 script will error on that `ALTER TABLE ... SET SCHEMA public`. Fix the schema/name in the DB or adjust the script for your case.
- **"default for column role cannot be cast" (fixed):** Part 1 drops the default on `users.user_profiles.role` before changing the type, then sets the default again.
- **Deadlock (40P01):** Run Phase 0 in four parts (1a, 1b, 1c, 2); wait for Success after each.
- **Upstream timeout:** Phase 0 is split into 1a/1b/1c/2 so each run is shorter. Run 1a → 1b → 1c → 2 in order.
- **Part 2 hangs or times out on codex:** The stuck `codex.core_rules` table is often locked by Realtime or other sessions. Try in order: (1) Run **`sql/force-drop-codex-core-rules.sql`** alone (it terminates other sessions locking the table, removes from Realtime, then drops). If that times out: (2) Run **`sql/force-drop-codex-core-rules-part-a-terminate.sql`** (terminate blockers only); as soon as it succeeds, run **`sql/force-drop-codex-core-rules-part-b-drop.sql`** in a **new** SQL Editor tab (drop only). (3) If Part A or Part B still time out, run Part B from a **direct Postgres connection** (Project Settings → Database → Connection string; use psql or another client as the project owner) so no pooler/dashboard holds the table; or pause the project briefly and retry; or contact Supabase support to drop `codex.core_rules`. After the table is gone, run Part 2 again.

---

## Summary

1. Run **Part 1a** → wait Success.
2. Run **Part 1b** → wait Success.
3. Run **Part 1c** (codex reference tables) → wait Success.
4. Run **Part 1c2a** (public_powers + public_techniques; core_rules skipped) → wait Success.
5. Run **Part 1c2b** (public_items + public_creatures) → wait Success.
6. Run **Part 2** → wait Success (RLS, Realtime add, drop empty schemas including codex). If Part 2 hangs on codex, run **`sql/force-drop-codex-core-rules.sql`** first, then Part 2 again.
7. Run **`sql/create-public-core-rules.sql`** → creates `public.core_rules`. Then seed: `node scripts/seed-core-rules.js` (or use data from `data/core-rules/*.json`).
8. Confirm all tables are under **public** in Table Editor (no codex/users/campaigns/encounters schemas).
9. (Optional) Codex columnar if needed; (required) Storage RLS if you use Storage.

**Phase 0 SQL complete.** Realtime uses `schema: 'public'`, `table: 'campaign_rolls'` / `table: 'characters'`. Schema reference: [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md).
