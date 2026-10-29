# Database consistency checklist

Use this when setting up a **new** Supabase project or debugging “table missing / permission denied” on RealmsRPG-Test.

**Reference:** [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) (single source of truth for tables). **Repo SQL folder:** [sql/README.md](../../sql/README.md) (template, rename utility, schema snapshots only — not a migration library).

---

## Fresh environment (high level)

| Step | Action |
|------|--------|
| 1 | Clone schema from a **pg_dump baseline** or restore from Supabase backup — do not replay deleted one-off SQL from git history unless Kadin approves a specific script for that environment. |
| 2 | Confirm **`official_*`** tables exist if you use admin “Save to Official Library” (see SUPABASE_SCHEMA §2.4). |
| 3 | Confirm **Storage** buckets `portraits`, `profile-pictures`, `codex-art` and their RLS match SUPABASE_SCHEMA § storage notes. |
| 4 | Confirm **`user_profiles`** timestamps have defaults if inserts fail on `updated_at`. |
| 5 | Optional list columns on characters / encounters / campaign_rolls — documented in SUPABASE_SCHEMA; not required for core app flows. |

---

## Common symptoms

- **Admin “Save to Official Library” fails:** `official_powers` (and siblings) missing or RLS blocks admin role — fix live schema per SUPABASE_SCHEMA, not a repo SQL file.
- **“null value in column updated_at”** or **`user_items_user_id_fkey`:** Ensure `user_profiles` row exists (`ensureUserProfile` / service path) and timestamp defaults on `user_profiles`.
- **Portrait / profile upload denied:** Storage bucket + RLS on `portraits` / `profile-pictures` (SUPABASE_SCHEMA, DEPLOYMENT_AND_SECRETS_SUPABASE.md).
- **GET `/api/codex` permission denied:** Codex tables need SELECT for anon/authenticated per live RLS — see SUPABASE_SCHEMA codex section; do not re-run removed consolidation scripts.

---

## Owner-only

Any **production** DDL or codex **data** change needs Kadin explicit OK and a fresh backup ([guide/07-database-operations.md](./ai/guide/07-database-operations.md)).
