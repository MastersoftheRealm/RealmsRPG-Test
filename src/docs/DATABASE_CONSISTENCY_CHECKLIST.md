# Database Consistency Checklist

Use this checklist to keep your Supabase database in sync with the app and fix common inconsistencies.

**Reference:** [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) (single source of truth for tables). **SQL location:** [sql/README.md](../sql/README.md) (file list and run order).

---

## 1. One-time setup (fresh or migrated DB)

| Step | Action | When |
|------|--------|------|
| 1 | Run **sql/supabase-official-library-public-schema.sql** in Supabase Dashboard → SQL Editor | Creates `official_powers`, `official_techniques`, `official_items`, `official_creatures` in `public` and backfills from `public_*` if those tables exist. **Required** for admin “Save to Official Library” to work. |
| 2 | Run **sql/supabase-user-profiles-timestamps-default.sql** | If you see “null value in column updated_at of relation user_profiles” or “user_items_user_id_fkey” when saving to library. Sets `DEFAULT now()` on `user_profiles.created_at` and `updated_at`. |
| 3 | Run **sql/supabase-storage-policies.sql** | If you use portrait or profile-picture uploads. RLS for Storage buckets. |
| 4 | (Optional) **sql/supabase-official-library-columnar-expansion.sql** | Adds `range_steps`, `duration_*`, `area_*`, `damage` columns to `official_powers`. Not required; app stores these in `payload` if columns are missing. |
| 5 | (Optional) **sql/supabase-encounters-list-columns.sql**, **supabase-characters-list-columns.sql**, **supabase-campaign-rolls-list-columns.sql** | For list/filter by name, level, type, etc. See sql/README.md Data migration section. |

**Back up** (Supabase Dashboard → Backups or export) before running any migration.

---

## 2. Admin official library saves not persisting

- **Cause:** Missing tables or RLS blocking writes.
- **Fix:**
  1. Run **sql/supabase-official-library-public-schema.sql** (creates `official_*` tables and RLS: anyone can read; only `user_profiles.role = 'admin'` can insert/update/delete).
  2. In Supabase: **Table Editor → user_profiles** → set `role = 'admin'` for your admin user(s). The app checks this for POST/DELETE to `/api/official/[type]`.

---

## 3. User library / profile errors after migration

- **“null value in column updated_at”** or **“user_items_user_id_fkey”**: Run **sql/supabase-user-profiles-timestamps-default.sql** and ensure the app uses `ensureUserProfile` (or equivalent) before any insert into `user_items`, `user_powers`, etc. See [AI_CHANGELOG](../ai/AI_CHANGELOG.md) 2026-03-02.
- **Profile not found:** Ensure a row exists in `user_profiles` for the user’s `id` (auth.uid()); the app creates it on first login or before library writes.

---

## 4. Optional cleanup

- **Drop legacy Prisma table:** `DROP TABLE IF EXISTS public._prisma_migrations;` — safe if you no longer use Prisma (see SUPABASE_SCHEMA.md §4).
- **Codex RLS:** If GET `/api/codex` returns 500 (permission denied), run **sql/supabase-codex-rls-public.sql** to grant SELECT on codex_* and core_rules.

---

## 5. Run order summary (recommended)

1. **supabase-official-library-public-schema.sql** — official library + RLS.
2. **supabase-user-profiles-timestamps-default.sql** — avoid null updated_at / FK errors.
3. **supabase-storage-policies.sql** — if using Storage.
4. Any optional list-column or columnar expansion scripts from sql/README.md.

After running SQL, redeploy the app (or at least ensure env points to the same Supabase project). No Prisma or other migrate commands; all schema changes are SQL in Supabase.

---

## 6. Creators, character creator, character sheet, library — alignment with DB

These areas were audited for consistency with the current Supabase implementation (columnar user_* / official_*, payload JSONB). Use this as a quick reference if something breaks after a schema or API change.

| Area | Data source | What to check |
|------|-------------|---------------|
| **Power / Technique / Item / Creature creators** | Save: `POST /api/user/library/[type]` (columnar). Official save: `POST /api/official/[type]` (payload holds range, duration, area, damage for powers). | Load from library: item shape from `rowToItem` (scalars + payload). If you add new fields, put them in payload for powers/techniques/items or in bodyToColumnar so they land in payload. |
| **Character creator** | Characters API; library from `useUserPowers` etc. and `useOfficialLibrary` for add-power/technique modals. | Adding a public item to character stores `{ id, name }` only; enrichment resolves from user library then public (official) library by id. |
| **Character sheet** | `enrichCharacterData(character, userPowers, userTechniques, userItems, …, publicLibraries)`. Character load returns `libraryForView` for non-owner view. | Powers/techniques/items must be resolvable by id (or name fallback) in user library or publicLibraries. Public library comes from `useOfficialLibrary` (GET /api/official). |
| **Library page** | User: `GET /api/user/library/[type]`. Official: `GET /api/official/[type]`. | Both return client shape from `rowToItem` (id, docId, name, description, parts, range, duration, area, damage in payload for powers). |
| **Enrichment** | `enrichPowers`, `enrichTechniques`, `enrichItems` take optional `publicPowerLibrary` etc. for character-referenced official items. | Character page builds `publicLibraries` from `usePublicLibrary` (official) and passes to `enrichCharacterData`. |
| **User species** | `GET /api/user/library/species` → `user_species` columnar or legacy `r.data`. | `rowToItemSpecies` returns codex-like shape (sizes, skills, species_traits, etc. as arrays). Character creator and hooks expect that shape. |

**If something doesn’t load or display after a change:**

- **Creator load (edit):** Ensure API returns full item (scalars + payload). `library-columnar` `rowToItem` merges `...payload` so range/duration/area/damage/parts come from payload for user_*.
- **Character sheet missing power/technique/item:** Enrichment looks up by character reference id/name in user library first, then in publicLibraries. Ensure character page passes `publicLibraries` and that official API returns full items.
- **Multiple damage types:** Power creator saves `damage` as array. `formatPowerDamage` displays all entries (e.g. "2d6 slashing, 1d4 fire"). Library/sheet use derivePowerDisplay + formatPowerDamage.
