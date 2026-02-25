# Supabase Path C — Step-by-step operator guide

**Purpose:** You (the project owner) run SQL in Supabase to align the database with Path C (single `public` schema, no Prisma, raw SQL). Use this as the single place for **what to run, in what order, and what to expect.**

**Context:** See [PATH_C_MIGRATION_PLAN.md](ai/PATH_C_MIGRATION_PLAN.md) for the full migration plan. This guide is the **operator checklist** only.

---

## Before you start

- **Back up** the project (Supabase Dashboard → Project Settings → Database → or use Backups).
- You can **delete data** where needed to fix structure (e.g. going from JSONB-only to columnar). The scripts below move/copy structure; optional steps mention when data may be replaced.

---

## Step 1: Consolidate all tables into `public` (Phase 0)

This is the **main** step. It moves every app table from `users`, `campaigns`, `codex`, and `encounters` into the `public` schema and fixes RLS and Realtime.

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open the file **`sql/path-c-phase0-consolidate-to-public.sql`** from this repo (root: `RealmsRPG-Test`).
3. Copy the **entire** file contents.
4. Paste into the SQL Editor and click **Run**.
5. Confirm no errors. You should see “Success” or similar.

**What this did:**

- Removed `campaign_rolls` and `characters` from the Realtime publication (they were under `campaigns` and `users`).
- Created `public."UserRole"` and switched `user_profiles.role` to use it.
- Moved all tables into `public` (user_profiles, usernames, characters, user_powers, user_techniques, user_items, user_creatures, user_species, campaigns, campaign_members, campaign_rolls, encounters, all codex_* and public_* and core_rules).
- Recreated RLS policies for campaigns, campaign_members, and campaign_rolls so they reference `public.campaigns` and `public.campaign_members`.
- Re-added `public.campaign_rolls` and `public.characters` to the Realtime publication and granted SELECT to authenticated.
- Dropped the now-empty schemas: `users`, `campaigns`, `codex`, `encounters`.

**Check:** In Supabase **Table Editor**, you should see **only** the `public` schema, and all app tables (user_profiles, characters, campaigns, codex_feats, etc.) under `public`.

---

## Step 2: (Optional) Codex columnar — only if codex is still `id` + `data`

If your codex tables are still **two columns** (`id` + `data` JSONB) and you want **proper columns** (for CSV drag-and-drop and filtering):

- The file **`prisma/supabase-codex-tables-columnar.sql`** creates columnar codex tables in the **`codex`** schema. After Phase 0, those schemas are gone and codex tables are already in **`public`**.
- So you have two options:
  - **Option A:** Run the columnar script **before** Step 1 (while codex tables are still in `codex`), then run Step 1 — the script moves tables by name, so you’d move the already-columnar codex tables to `public`.
  - **Option B:** Run Step 1 first (so codex is in `public` as id+data), then use a **modified** columnar script that creates/alters tables in **`public`** (not `codex`). That modified script is not in the repo yet; an agent can generate it from `prisma/supabase-codex-tables-columnar.sql` by replacing `codex.` with `public.` and dropping/recreating the codex_* tables in `public` (you may lose existing codex data unless you backfill from CSV).

If you are **okay with codex staying as id+data** for now, skip this step.

---

## Step 3: Storage RLS (if not already done)

If you use **Storage** for portraits or profile pictures:

1. Open **`prisma/supabase-storage-policies.sql`** in this repo.
2. Copy the entire file and run it in Supabase **SQL Editor**.

This is independent of Path C; run once per project.

---

## Step 4: After the database is aligned

- **Prisma (temporary):** So the app keeps working until Prisma is removed, update **`prisma/schema.prisma`**: set **every** model to `@@schema("public")` and set the datasource to a single schema, e.g. `schemas = ["public"]`. Then run `npx prisma generate`. The app will keep using Prisma against `public` until Phases 1–5 replace it with the Supabase client.
- **Realtime in the app:** When you implement Phase 0 in code (or right after), update Realtime subscriptions to use `schema: 'public'` and `table: 'campaign_rolls'` or `table: 'characters'` (see PATH_C_MIGRATION_PLAN.md Phase 0 / Phase 2).

---

## Quick reference: SQL files and order

| Order | File | When |
|-------|------|------|
| 1 | **`sql/path-c-phase0-consolidate-to-public.sql`** | Once; aligns DB with Path C (single `public` schema). |
| 2 (optional) | **`prisma/supabase-codex-tables-columnar.sql`** | Only if you want columnar codex and haven’t run it yet; run **before** Step 1 if you want columnar tables moved to public. |
| 3 | **`prisma/supabase-storage-policies.sql`** | Once per project for Storage RLS. |

---

## If something goes wrong

- **Realtime not working:** Ensure `public.campaign_rolls` and `public.characters` are in the `supabase_realtime` publication (Supabase Dashboard → Database → Realtime or run the Realtime block from the Phase 0 script again).
- **RLS errors:** Ensure all policies in the Phase 0 script ran; campaigns/campaign_rolls/campaign_members must reference `public.campaigns` and `public.campaign_members`.
- **Missing tables:** If a table was created in a different schema or name, the Phase 0 script will error on that `ALTER TABLE ... SET SCHEMA public`. Fix the schema/name in the DB or adjust the script for your case.

---

## Summary

1. Run **`sql/path-c-phase0-consolidate-to-public.sql`** in Supabase SQL Editor.
2. Confirm all tables are under **public** in Table Editor.
3. (Optional) Codex columnar if needed; (required) Storage RLS if you use Storage.
4. Update Prisma schema to `@@schema("public")` and `schemas = ["public"]` so the app keeps working until Prisma is removed.

After that, the codebase can proceed with Path C Phases 1–6 (replace Prisma with Supabase client, then update docs and agent rules).
