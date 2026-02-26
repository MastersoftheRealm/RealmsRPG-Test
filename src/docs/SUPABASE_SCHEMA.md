# Supabase Public Schema — Single Source of Truth

**Purpose:** The **only** canonical reference for how the RealmsRPG Supabase database is organized. All app tables live in the `public` schema. Use this doc for agents, engineers, and migrations — not PATH_C_AUDIT_FULFILLMENT or scattered table lists elsewhere.

**Related:** `CODEX_SCHEMA_REFERENCE.md` (codex **field** definitions and use), `DATA_HANDLING.md` (API/hooks/cache), `DEPLOYMENT_AND_SECRETS_SUPABASE.md` (env, RLS, Storage).

---

## 1. Overview

| Item | Value |
|------|--------|
| **Schema** | Single schema: `public`. No `codex`, `users`, `campaigns`, or `encounters` schemas. |
| **Data access** | Supabase server client: `createClient()` from `@/lib/supabase/server`; all reads/writes use `supabase.from('table_name')`. |
| **Migrations** | SQL only (run in Supabase Dashboard or CI). No Prisma. |

**Shape convention:** Prefer **columnar** (scalar columns ± one JSONB for variable payload) where possible. Some tables remain **id + data (JSONB)** for historical or document-style use; see table list below.

---

## 2. Tables (current state)

Tables are listed in dependency-friendly order. **Columnar** = proper columns; **JSONB** = table stores mainly `id` + `data` (or similar) blob.

### 2.1 Legacy / optional removal

| Table | Shape | Notes |
|-------|--------|--------|
| `_prisma_migrations` | Prisma metadata columns | **Legacy.** Prisma was removed; this table is unused. Safe to drop if present: `DROP TABLE IF EXISTS public._prisma_migrations;` |

---

### 2.2 Auth & profile

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_profiles` | Columnar | id (PK), email, display_name, username, photo_url, last_username_change, created_at, updated_at, role (UserRole enum) |
| `usernames` | Columnar | username (PK), user_id (FK → user_profiles) |

---

### 2.3 Codex (reference data)

All codex tables are **columnar**. Field semantics: see `CODEX_SCHEMA_REFERENCE.md`.

| Table | Shape | Key columns (summary) |
|-------|--------|------------------------|
| `codex_feats` | Columnar | id (PK), name, description, req_desc, ability_req, abil_req_val, skill_req, skill_req_val, feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags, char_feat, state_feat |
| `codex_skills` | Columnar | id (PK), name, description, ability, base_skill, success_desc, failure_desc, ds_calc, craft_failure_desc, craft_success_desc |
| `codex_species` | Columnar | id (PK), name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages |
| `codex_traits` | Columnar | id (PK), name, description, uses_per_rec, rec_period, flaw, characteristic, option_trait_ids |
| `codex_parts` | Columnar | id (PK), name, description, category, base_en, base_tp, op_1_desc, op_1_en, op_1_tp, op_2_desc, op_2_en, op_2_tp, op_3_desc, op_3_en, op_3_tp, type, mechanic, percentage, duration, defense |
| `codex_properties` | Columnar | id (PK), name, description, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, type, mechanic |
| `codex_equipment` | Columnar | id (PK), name, description, category, currency, rarity |
| `codex_archetypes` | Columnar | id (PK), name, type, description |
| `codex_creature_feats` | Columnar | id (PK), name, description, feat_points, feat_lvl, lvl_req, mechanic |
| `core_rules` | JSONB | id (PK), data (JSONB), updated_at |

---

### 2.4 Public library (admin-curated, browse by all)

Currently **id + data (JSONB)**. Optional future: migrate to columnar (e.g. `official_*`-style scalars + payload) for consistency with user library and better querying.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `public_powers` | JSONB | id (PK), data (JSONB), created_at, updated_at |
| `public_techniques` | JSONB | id (PK), data (JSONB), created_at, updated_at |
| `public_items` | JSONB | id (PK), data (JSONB), created_at, updated_at |
| `public_creatures` | JSONB | id (PK), data (JSONB), created_at, updated_at |

**API:** `GET /api/public/[type]` reads these tables; falls back to `official_*` in public if present (columnar). POST/DELETE require admin.

---

### 2.5 User library

Powers, techniques, items, creatures: **columnar** (scalars + `payload` JSONB). Species: **JSONB**.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_powers` | Columnar | id (PK), user_id (FK), name, description, action_type, is_reaction, innate, created_at, updated_at, payload (JSONB) |
| `user_techniques` | Columnar | id (PK), user_id (FK), name, description, action_type, weapon_name, created_at, updated_at, payload (JSONB) |
| `user_items` | Columnar | id (PK), user_id (FK), name, description, type, rarity, armor_value, damage_reduction, created_at, updated_at, payload (JSONB) |
| `user_creatures` | Columnar | id (PK), user_id (FK), name, description, level, type, size, hit_points, energy_points, created_at, updated_at, payload (JSONB) |
| `user_species` | JSONB | id (PK), user_id (FK), data (JSONB), created_at, updated_at |

**API:** `GET/POST/PATCH/DELETE /api/user/library/[type]`; types: powers, techniques, items, creatures, species.

---

### 2.6 Characters

| Table | Shape | Key columns |
|-------|--------|-------------|
| `characters` | JSONB | id (PK), user_id (FK → user_profiles), data (JSONB), created_at, updated_at |

Single document per character; variable nested structure. Realtime: `public.characters`.

---

### 2.7 Campaigns

| Table | Shape | Key columns |
|-------|--------|-------------|
| `campaigns` | Scalar + JSONB | id (PK), owner_id, name, description, invite_code, characters (JSONB), memberIds (JSONB), owner_username, created_at, updated_at |
| `campaign_members` | Columnar | campaign_id (PK), user_id (PK); FK campaign_id → campaigns(id) |
| `campaign_rolls` | JSONB | id (PK), campaign_id (FK), data (JSONB), created_at |

Membership source of truth: `campaign_members`. Realtime: `public.campaign_rolls`.

---

### 2.8 Encounters

| Table | Shape | Key columns |
|-------|--------|-------------|
| `encounters` | JSONB | id (PK), user_id, data (JSONB), created_at, updated_at |

---

## 3. Enums

| Name | Values |
|------|--------|
| `UserRole` | new_player, playtester, developer, admin |

Used by `user_profiles.role`.

---

## 4. Future / migration (optional)

- **Drop `_prisma_migrations`:** If the table exists, run `DROP TABLE IF EXISTS public._prisma_migrations;` in Supabase SQL Editor. No app code uses it.

**Columnar migration status (prefer columns over JSONB where possible):**

| Area | Status | Task / notes |
|------|--------|--------------|
| Codex (codex_*) | Done | All columnar in public. |
| User library (powers, techniques, items, creatures) | Done | user_* columnar (scalars + payload). |
| User library (species) | Done | **TASK-280:** user_species columnar (codex_species + user_id + payload); SQL + API. |
| Public/official library | Done | **TASK-279:** official_* in public; GET /api/public prefers official_*; POST/DELETE columnar. |
| Campaign members | Done | campaign_members table; memberIds deprecated. |
| Encounters list | Done | **TASK-281:** name, type, status columns; backfill + API. |
| Characters list | Done | **TASK-282:** name, level, archetype_name, ancestry_name, status, visibility; backfill + API. |
| Campaign rolls list | Done | **TASK-283:** character_id, user_id, type, title; backfill + API. |
| Core rules | Keep JSONB | Per DATABASE_SCALABILITY_AUDIT: category-specific shapes; no columnar migration planned. |

See `AI_TASK_QUEUE.md` for TASK-279–TASK-283. Rationale and column sets: `DATABASE_SCALABILITY_AUDIT.md`.

---

## 5. What to change elsewhere

- **Do not** duplicate this table list in other docs. Point to **this file** for “how is the DB organized?”
- **Path C docs** (in `src/docs/ai/archive/`): PATH_C_MIGRATION_PLAN, PATH_C_AUDIT_FULFILLMENT — historical; for current schema use this doc.
- **DATABASE_CODEX_AUDIT** / **DATABASE_SCALABILITY_AUDIT**: Use for **rationale** and **future** columnar/rename ideas; not as the schema source of truth.
- **CODEX_SCHEMA_REFERENCE**: Defines **fields** (meaning, types, use) for codex entities; this doc defines **tables and columns** in Supabase.

---

## 6. Quick reference: API → tables

| API or feature | Tables (public) |
|----------------|-----------------|
| GET /api/codex | codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats, core_rules |
| GET /api/public/[type] | public_powers, public_techniques, public_items, public_creatures (or official_* if present) |
| GET/POST/PATCH/DELETE /api/user/library/[type] | user_powers, user_techniques, user_items, user_creatures, user_species |
| Characters CRUD | characters |
| Campaigns | campaigns, campaign_members, campaign_rolls |
| Encounters | encounters |
| Auth / profile | user_profiles, usernames |

---

## 7. Supabase logs (what you’ll see)

Supabase Dashboard → Logs shows **PostgREST** requests. Our app uses the **public** schema only; the client never specifies a schema, so all `/rest/v1/<table>` requests hit **public** tables.

**Expected when codex or library loads:**

- **GET /rest/v1/codex_feats**, **codex_skills**, **codex_species**, **codex_traits**, **codex_parts**, **codex_properties**, **codex_equipment**, **codex_archetypes**, **codex_creature_feats**, **core_rules** — One browser request to `GET /api/codex` triggers these 10 parallel server-side queries. This is expected; the browser still only makes one call to our API.
- **GET /rest/v1/official_techniques** (or other official_* / public_*) — When the public or official library tab is loaded, the API queries the corresponding table(s). Again expected.

**Other schemas (reference only):**

- **auth** — Supabase Auth (users, sessions, etc.). We don’t create or query these directly; we use Supabase Auth APIs and `user_profiles` / `usernames` in **public** for app profile data.
- **storage** — Supabase Storage (buckets, objects). We use this for portraits and profile pictures; RLS is in `sql/supabase-storage-policies.sql`. App row data stays in **public**.

If you see **404 or 500** on any `/rest/v1/codex_*` or `core_rules`, check that the table exists in **public** (Table Editor) and that RLS allows the anon/service role used by the API (see DEPLOYMENT_AND_SECRETS_SUPABASE.md).
