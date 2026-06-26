# Supabase Public Schema — Single Source of Truth

**Purpose:** The **only** canonical reference for how the RealmsRPG Supabase database is organized. All app tables live in the `public` schema. Use this doc for agents, engineers, and migrations — not PATH_C_AUDIT_FULFILLMENT or scattered table lists elsewhere.

**Related:** `src/docs/human/CODEX_SCHEMA_REFERENCE.md` (codex **field** definitions and use), `DATA_HANDLING.md` (API/hooks/cache), `DEPLOYMENT_AND_SECRETS_SUPABASE.md` (env, RLS, Storage).

---

## 1. Overview

| Item | Value |
|------|--------|
| **Schema** | Single schema: **`public`** only. There is **no `codex` schema** — all tables (including `codex_feats`, `codex_skills`, etc.) live in `public`. |
| **Data access** | Supabase server client: `createClient()` from `@/lib/supabase/server`; all reads/writes use `supabase.from('table_name')` and hit `public`. |
| **Migrations** | SQL only (run in Supabase Dashboard or CI). No Prisma. |

**Shape convention:** Prefer **columnar** (scalar columns ± one JSONB for variable payload) where possible. Some tables remain **id + data (JSONB)** or hybrid (list columns + data); see table list below.

---

## 2. Tables (current state)

Tables are listed in dependency-friendly order. **Columnar** = proper columns; **JSONB** = table stores mainly `id` + `data` (or similar) blob.

### 2.2 Auth & profile

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_profiles` | Columnar | id (PK), email, display_name, username (canonical lowercase), username_display (preserved casing), photo_url, last_username_change, created_at, updated_at, role (UserRole enum), show_tooltips |
| `usernames` | Columnar | username (PK), user_id (FK → user_profiles) |

---

### 2.3 Codex (reference data) — all in `public`

All codex tables are **columnar** and live in **public** (no `codex` schema). Array-like fields are stored as TEXT (comma-sep). Field semantics: see `src/docs/human/CODEX_SCHEMA_REFERENCE.md`.

| Table | Shape | Key columns (public schema) |
|-------|--------|------------------------|
| `codex_feats` | Columnar | id (PK), name, description, req_desc, ability_req (TEXT), abil_req_val (TEXT), skill_req (TEXT), skill_req_val (TEXT), feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags (TEXT), char_feat, state_feat, base_feat_id (TEXT, nullable) |
| `codex_skills` | Columnar | id (PK), name, description, ability, base_skill (TEXT), success_desc, failure_desc, ds_calc, craft_failure_desc, craft_success_desc |
| `codex_species` | Columnar | id (PK), name, description, type, sizes (TEXT), skills (TEXT), species_traits (TEXT), ancestry_traits (TEXT), flaws (TEXT), characteristics (TEXT), ave_hgt_cm, ave_wgt_kg, adulthood_lifespan (TEXT), languages (TEXT) |
| `codex_traits` | Columnar | id (PK), name, description, uses_per_rec, rec_period, flaw, characteristic, option_trait_ids (TEXT) |
| `codex_parts` | Columnar | id (PK), name, description, category, base_en, base_tp, op_1_desc, op_1_en, op_1_tp, op_2_desc, op_2_en, op_2_tp, op_3_desc, op_3_en, op_3_tp, type, mechanic, percentage, duration, defense (TEXT) |
| `codex_properties` | Columnar | id (PK), name, description, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, type, mechanic |
| `codex_equipment` | Columnar | id (PK), name, description, category, currency, rarity |
| `codex_archetypes` | Columnar | id (PK), name, type, description, archetype_ability, secondary_ability, power_prof_start, martial_prof_start, power_prof_level5, martial_prof_level5, level1_feats (TEXT), level1_skills (TEXT), level1_powers (TEXT), level1_techniques (TEXT), level1_armaments (TEXT), level1_equipment (TEXT), level1_recommend_unarmed_prowess (BOOLEAN), level1_remove_feats (TEXT), level1_remove_powers (TEXT), level1_remove_techniques (TEXT), level1_remove_armaments (TEXT), level1_notes; **legacy:** `path_data` (JSONB, optional — pre-columnar compat; GET /api/codex composes `path_data` from level1 columns + `codex_archetype_levels`). **Player picker visibility:** paths appear in creator/codex/sheet switcher only when level 1 has at least one add recommendation (feats/skills/powers/techniques/armaments/equipment); see `src/docs/human/CODEX_SCHEMA_REFERENCE.md` and `pathHasPlayerVisibleLevel1()` |
| `codex_archetype_levels` | Columnar | id (PK), archetype_id (FK → codex_archetypes.id), level, feats (TEXT), skills (TEXT), powers (TEXT), techniques (TEXT), armaments (TEXT), equipment (TEXT), remove_feats (TEXT), remove_powers (TEXT), remove_techniques (TEXT), remove_armaments (TEXT), notes |
| `codex_creature_feats` | Columnar | id (PK), name, description, feat_points, feat_lvl, lvl_req, mechanic |
| `core_rules` | JSONB | id (PK), data (JSONB), updated_at |

---

### 2.4 Official library (admin-curated Realms content, browse by all)

All **columnar** (scalars + `payload` JSONB). Legacy `public_*` JSONB tables (`public_powers`, `public_techniques`, etc.) were **dropped** after migration to `official_*`; they are not present in production.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `official_powers` | Columnar | id (PK), name, description, action_type, is_reaction, innate, range/duration/area/damage columns, payload (JSONB), created_at, updated_at |
| `official_techniques` | Columnar | id (PK), name, description, action_type, weapon_name, promoted columns, payload (JSONB), created_at, updated_at |
| `official_empowered_techniques` | Columnar | Same shape as official_techniques |
| `official_items` | Columnar | id (PK), name, description, type, rarity, armor_value, damage_reduction, promoted columns, payload (JSONB), created_at, updated_at |
| `official_creatures` | Columnar | id (PK), name, description, level, type, size, hit_points, energy_points, payload (JSONB), created_at, updated_at |

**API:** `GET /api/public/[type]` reads `official_*` only (returns `[]` if the table is missing). `POST`/`DELETE` require admin and write to `official_*`. Legacy `public_*` JSONB tables were dropped; do not reference them in app code.

**Migrations:** `sql/supabase-official-library-public-schema.sql` (create + RLS), `sql/supabase-official-library-columnar-expansion.sql` (powers columns), `sql/supabase-library-columnar-parity-expansion.sql` (promoted columns + `sync_library_promoted_columns` trigger on official_* and user_*).

---

### 2.5 User library

All **columnar** (scalars + `payload` JSONB). Species matches codex_species columns + user_id + payload.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_powers` | Columnar | id (PK), user_id (FK), name, description, action_type, is_reaction, innate, created_at, updated_at, payload (JSONB) |
| `user_techniques` | Columnar | id (PK), user_id (FK), name, description, action_type, weapon_name, created_at, updated_at, payload (JSONB) |
| `user_empowered_techniques` | Columnar | id (PK), user_id (FK), name, description, action_type, weapon_name, created_at, updated_at, payload (JSONB) |
| `user_items` | Columnar | id (PK), user_id (FK), name, description, type, rarity, armor_value, damage_reduction, created_at, updated_at, payload (JSONB) |
| `user_creatures` | Columnar | id (PK), user_id (FK), name, description, level, type, size, hit_points, energy_points, created_at, updated_at, payload (JSONB) |
| `user_species` | Columnar | id (PK), user_id (FK), name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages, created_at, updated_at, payload (JSONB) |

If Supabase logs show **`permission denied for table user_species`**, the `authenticated` role is missing table `GRANT`s (common after creating/moving the table without grants). Run **`sql/supabase-user-species-grants-rls.sql`** in the SQL Editor. This does not fix campaign invite lookup by itself (that is separate RLS on `campaigns`); it fixes species library / hooks that query `user_species`.

**API:** `GET/POST/PATCH/DELETE /api/user/library/[type]`; types: powers, techniques, empowered-techniques, items, creatures, species.

---

### 2.6 Characters

| Table | Shape | Key columns |
|-------|--------|-------------|
| `characters` | Hybrid | id (PK), user_id (FK → user_profiles), data (JSONB), created_at, updated_at; list columns: name, level, archetype_name, ancestry_name, status, visibility |

Single document in `data`; list columns for list/filter. Realtime: `public.characters`.

**Character `data` JSON (app-owned, no DB migration for new keys):** Feats are lean entries `{ id, currentUses?, customName?, note? }` on `feats` / `archetypeFeats`; trait player labels live in `traitCustomizations` (map of trait id → `{ customName?, note? }`). Codex names/descriptions are enriched on load, not stored on save.

**Cross-user read (campaign / public):** `/api/characters/[id]` applies visibility in app code, but Supabase RLS runs first. If the only SELECT policy is “own rows,” other users get no row → “Character not found.” Run **`sql/supabase-characters-rls-cross-read.sql`** to add SELECT policies for `data.visibility = 'public'` and for `campaign` when the reader is the campaign owner or in `campaign_members` and the character appears on that campaign’s `characters` JSON roster (`userId`/`characterId` or snake_case).

---

### 2.7 Campaigns

| Table | Shape | Key columns |
|-------|--------|-------------|
| `campaigns` | Scalar + JSONB | id (PK), owner_id, name, description, invite_code, characters (JSONB), memberIds (JSONB), owner_username, created_at, updated_at |
| `campaign_members` | Columnar | campaign_id (PK), user_id (PK); FK campaign_id → campaigns(id) |
| `campaign_rolls` | Hybrid | id (PK, required on insert unless DB default), campaign_id (FK), data (JSONB), **created_at** (app POST sets ISO `now`; optional DB `DEFAULT now()`); list columns: character_id, user_id, type, title |

Membership source of truth: `campaign_members`. Realtime: `public.campaign_rolls`.

**Join-by-invite (app behavior):** RLS on `campaigns` allows SELECT only for the owner or existing members, so a new player cannot load a campaign row with the normal user-scoped Supabase client. The app uses **`SUPABASE_SERVICE_ROLE_KEY`** (server-only) in `joinCampaignAction` and in `GET /api/campaigns/invite/[code]` to look up by `invite_code` and update roster/members after the user is authenticated and character ownership is verified.

If logs show **`permission denied for table campaign_members`**, run **`sql/supabase-campaign-members-grants.sql`** — the `authenticated` role needs explicit `GRANT` on the table (RLS does not replace table privileges).

---

### 2.8 Encounters

| Table | Shape | Key columns |
|-------|--------|-------------|
| `encounters` | Hybrid | id (PK), user_id, data (JSONB), created_at, updated_at; list columns: name, type, status |

---

### 2.9 Crafting Sessions

| Table | Shape | Key columns |
|-------|--------|-------------|
| `crafting_sessions` | Hybrid | id (PK), user_id (**UUID** → auth.users), data (JSONB), created_at, updated_at; list columns: status, item_name, currency_cost |

**Migration (run in Supabase SQL Editor):**

```sql
CREATE TABLE IF NOT EXISTS public.crafting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planned',
  item_name TEXT,
  currency_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crafting_sessions_user_id ON public.crafting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_crafting_sessions_updated_at ON public.crafting_sessions(updated_at DESC);

ALTER TABLE public.crafting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY crafting_sessions_select ON public.crafting_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY crafting_sessions_insert ON public.crafting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY crafting_sessions_update ON public.crafting_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY crafting_sessions_delete ON public.crafting_sessions FOR DELETE USING (auth.uid() = user_id);
```

---

### 2.10 User Enhanced Items (Enhanced Equipment Library)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_enhanced_items` | Hybrid | id (PK), user_id (**UUID** → auth.users), data (JSONB), name, created_at, updated_at |

Stores enhanced equipment (base item + imbued power) saved from crafting. List columns: name for list display.

**Migration (run in Supabase SQL Editor):**

```sql
CREATE TABLE IF NOT EXISTS public.user_enhanced_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_enhanced_items_user_id ON public.user_enhanced_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enhanced_items_updated_at ON public.user_enhanced_items(updated_at DESC);

ALTER TABLE public.user_enhanced_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_enhanced_items_select ON public.user_enhanced_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_enhanced_items_insert ON public.user_enhanced_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_enhanced_items_update ON public.user_enhanced_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY user_enhanced_items_delete ON public.user_enhanced_items FOR DELETE USING (auth.uid() = user_id);
```

### 2.11 Official Enhanced Items (Realms Enhanced Equipment Library)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `official_enhanced_items` | Columnar + payload | id (PK), name, description, currency_cost, rarity, base_item_source, base_item_id, base_item_name, base_item_description, power_source, power_id, power_name, uses_type, uses_count, payload (JSONB), created_at, updated_at |

Stores **official** enhanced equipment for the Realms library (base item + imbued power). Unlike `user_enhanced_items`, `currency_cost` and `rarity` are derived from the **ideal enhanced crafting rules** (assuming proper successes) rather than a specific crafting outcome.

**Migration (run in Supabase SQL Editor):**

```sql
CREATE TABLE IF NOT EXISTS public.official_enhanced_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency_cost NUMERIC NOT NULL,
  rarity TEXT NOT NULL,
  base_item_source TEXT NOT NULL, -- 'codex' | 'public' | 'custom'
  base_item_id TEXT,              -- nullable for custom
  base_item_name TEXT NOT NULL,
  base_item_description TEXT,
  power_source TEXT NOT NULL,     -- 'official' | 'public' | 'library'
  power_id TEXT NOT NULL,
  power_name TEXT NOT NULL,
  uses_type TEXT NOT NULL,        -- 'full' | 'partial' | 'permanent'
  uses_count INTEGER,             -- null when permanent
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_enhanced_items_rarity ON public.official_enhanced_items(rarity);
CREATE INDEX IF NOT EXISTS idx_official_enhanced_items_updated_at ON public.official_enhanced_items(updated_at DESC);

ALTER TABLE public.official_enhanced_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.official_enhanced_items TO anon, authenticated;
GRANT ALL ON public.official_enhanced_items TO service_role;

CREATE POLICY "Anyone can read official enhanced items" ON public.official_enhanced_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin can insert official enhanced items" ON public.official_enhanced_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admin can update official enhanced items" ON public.official_enhanced_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admin can delete official enhanced items" ON public.official_enhanced_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));
```

**RLS + grants:** Also in `sql/supabase-security-hardening-2026-06.sql` if the table was created without policies.

---

### 2.12 UI Tooltips (onboarding/help text)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `ui_tooltips` | Columnar | id (PK), key (UNIQUE), scope, title, body_md, placement, trigger, audience, enabled, version, updated_at, updated_by |

Stores admin-editable tooltip/help content used across navigation, creator steps, and settings. Tooltip text supports markdown-lite and runtime interpolation of Core Rule values in app code.

**Migration:** `sql/supabase-ui-tooltips.sql`

---

### 2.13 Role policies (admin-managed permissions and quotas)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `role_policies` | Columnar | role (PK, UserRole), max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions (JSONB), updated_at, updated_by |

Stores role-level quotas and permission flags used by campaign, character, library, and profile feature gating. This is the source for admin-editable role limits in the app.

**Migration:** `sql/supabase-role-policies.sql`

---

### 2.14 Codex edit changelogs (admin audit trail)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `codex_change_logs` | Append-only JSONB snapshots | id (PK), entity_type, entity_id, operation (`create`/`update`/`delete`), changed_at, changed_by_user_id (FK auth.users), before_data (JSONB), after_data (JSONB), changed_fields (JSONB) |

Stores short-term admin edit history for codex/core-rules entities. Each change stores before/after snapshots plus actor and timestamp.

Retention rule: DB trigger keeps only the latest 10 rows per `(entity_type, entity_id)`.

**Migration:** `sql/supabase-codex-change-logs.sql`

---

### 2.15 Admin role audit (append-only)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `admin_role_audit` | Append-only | id (PK), actor_id, target_id, old_role, new_role, created_at |

Records admin role changes from `PATCH /api/admin/users/update-role`. RLS: admins read-only; writes via service role only.

**Migration:** `sql/supabase-admin-role-audit-2026-06.sql`

---

## 3. Enums

| Name | Values |
|------|--------|
| `UserRole` | new_player, playtester, developer, admin |

Used by `user_profiles.role`.

---

## 4. Future / migration (optional)

**Columnar migration status (prefer columns over JSONB where possible):**

| Area | Status | Task / notes |
|------|--------|--------------|
| Codex (codex_*) | Done | All columnar in public. |
| User library (powers, techniques, items, creatures) | Done | user_* columnar (scalars + payload). |
| Official/user column parity expansion | Done | **TASK-304:** promoted columns for powers/techniques/items on both official_* + user_*; trigger-based payload sync (`sql/supabase-library-columnar-parity-expansion.sql`). |
| User library (species) | Done | **TASK-280:** user_species columnar (codex_species + user_id + payload); SQL + API. |
| Public/official library | Done | **TASK-279:** official_* in public; legacy `public_*` JSONB tables dropped; GET /api/public reads official_* only. |
| Legacy `_prisma_migrations` | Done | Dropped via `sql/supabase-security-hardening-2026-06.sql`. |
| Campaign members | Done | campaign_members table; memberIds deprecated. |
| Encounters list | Done | **TASK-281:** name, type, status columns; backfill + API. |
| Characters list | Done | **TASK-282:** name, level, archetype_name, ancestry_name, status, visibility; backfill + API. |
| Campaign rolls list | Done | **TASK-283:** character_id, user_id, type, title; backfill + API. |
| Core rules | Keep JSONB | Category-specific shapes; no columnar migration planned. |
| UI tooltips | Done | `ui_tooltips` table + `user_profiles.show_tooltips` preference via `sql/supabase-ui-tooltips.sql`. |

See `AI_TASK_QUEUE.md` for TASK-279–TASK-283 and TASK-304. Historical rationale: `src/docs/ai/archive/DATABASE_SCALABILITY_AUDIT.md`.

---

## 5. What to change elsewhere

- **Do not** duplicate this table list in other docs. Point to **this file** for “how is the DB organized?”
- **Path C / DB rationale docs** (in `src/docs/ai/archive/`): PATH_C_MIGRATION_PLAN, PATH_C_AUDIT_FULFILLMENT, DATABASE_CODEX_AUDIT, DATABASE_SCALABILITY_AUDIT — historical only; for current schema use this doc.
- **Codex field reference** (`src/docs/human/CODEX_SCHEMA_REFERENCE.md`): Defines **fields** (meaning, types, use) for codex entities; this doc defines **tables and columns** in Supabase.

---

## 6. Quick reference: API → tables

| API or feature | Tables (public) |
|----------------|-----------------|
| GET /api/codex | codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats, core_rules |
| GET /api/public/[type] | official_powers, official_techniques, official_empowered_techniques, official_items, official_creatures |
| GET/POST/PATCH/DELETE /api/official/enhanced-items | official_enhanced_items (admin) |
| GET/POST/PATCH/DELETE /api/user/library/[type] | user_powers, user_techniques, user_empowered_techniques, user_items, user_creatures, user_species |
| GET/POST/PATCH/DELETE /api/tooltips | ui_tooltips (admin write, audience-filtered read) |
| GET/PATCH /api/user/settings/tooltips | user_profiles.show_tooltips |
| Characters CRUD | characters |
| Campaigns | campaigns, campaign_members, campaign_rolls |
| Encounters | encounters |
| GET/PATCH /api/admin/role-policies | role_policies, user_profiles.role (admin check) |
| PATCH /api/admin/users/update-role | user_profiles, admin_role_audit |
| GET /api/admin/changelogs | codex_change_logs, user_profiles (admin check) |
| Auth / profile / account delete | user_profiles, usernames, role_policies; delete also clears user_* library, characters, encounters, crafting_sessions, user_enhanced_items, campaign membership |

---

## 7. Supabase logs (what you’ll see)

Supabase Dashboard → Logs shows **PostgREST** requests. Our app uses the **public** schema only; the client never specifies a schema, so all `/rest/v1/<table>` requests hit **public** tables.

**Expected when codex or library loads:**

- **GET /rest/v1/codex_feats**, **codex_skills**, **codex_species**, **codex_traits**, **codex_parts**, **codex_properties**, **codex_equipment**, **codex_archetypes**, **codex_creature_feats**, **core_rules** — One browser request to `GET /api/codex` triggers these 10 parallel server-side queries. This is expected; the browser still only makes one call to our API.
- **GET /rest/v1/official_techniques** (or other `official_*`) — When the Realms library tab is loaded, the API queries the corresponding official table. Again expected.

**Other schemas (reference only):**

- **auth** — Supabase Auth (users, sessions, etc.). We don’t create or query these directly; we use Supabase Auth APIs and `user_profiles` / `usernames` in **public** for app profile data.
- **storage** — Supabase Storage (buckets, objects). We use this for portraits and profile pictures; RLS is in `sql/supabase-storage-policies.sql`. App row data stays in **public**.

If you see **404 or 500** on any `/rest/v1/codex_*` or `core_rules`, check that the table exists in **public** (Table Editor) and that RLS allows the anon/service role used by the API (see DEPLOYMENT_AND_SECRETS_SUPABASE.md).
