# Supabase Public Schema — Single Source of Truth

**Purpose:** The **only** canonical reference for how the RealmsRPG Supabase database is organized. All app tables live in the `public` schema. Use this doc for agents, engineers, and migrations — not PATH_C_AUDIT_FULFILLMENT or scattered table lists elsewhere.

**Related:** `src/docs/human/CODEX_SCHEMA_REFERENCE.md` (codex **field** definitions and use), `DATA_HANDLING.md` (API/hooks/cache), `DEPLOYMENT_AND_SECRETS_SUPABASE.md` (env, RLS, Storage).

---

## 1. Overview

| Item | Value |
|------|--------|
| **Schema** | Single schema: **`public`** only. There is **no `codex` schema** — all tables (including `codex_feats`, `codex_skills`, etc.) live in `public`. |
| **Data access** | Typed Supabase clients: `createClient()` from `@/lib/supabase/server` (browser + middleware factories too), parameterized with generated `Database` (`src/types/database.types.ts`; ADR-0020). All reads/writes use `.from('table_name')` and hit `public`. Regenerate types: `npm run db:types`. Schema-type drift shows up as a git diff of `database.types.ts` after regen (SQL baseline drift is still `npm run db:diff`). JSONB writes go through `asDbJson` / `asDbInsert` / `asDbUpdate`; variable table names through `fromPublicTable` (`lib/supabase/database.ts`). |
| **Migrations** | SQL only (run in Supabase Dashboard or CI). No Prisma. |

**Shape convention:** Prefer **columnar** (scalar columns ± one JSONB for variable payload) where possible. Some tables remain **id + data (JSONB)** or hybrid (list columns + data); see table list below.

---

## 2. Tables (current state)

Tables are listed in dependency-friendly order. **Columnar** = proper columns; **JSONB** = table stores mainly `id` + `data` (or similar) blob.

### 2.2 Auth & profile

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_profiles` | Columnar | id (PK), email, display_name, username (canonical lowercase), username_display (preserved casing), photo_url, last_username_change, created_at, updated_at, role (UserRole enum) |
| `usernames` | Columnar | username (PK), user_id (FK → user_profiles) |

**Session writes (86e3jt562):** `authenticated` may INSERT `id`, `display_name`, `created_at`, `updated_at` and UPDATE `display_name`, `updated_at` on `user_profiles`. Username, email, `photo_url`, `last_username_change`, and `role` are written by the service role after the server checks the rules. `usernames` is SELECT-only for `authenticated`. Profile-picture storage INSERT/UPDATE also requires `role_policies.permissions.can_upload_profile_picture`. Applied on RealmsRPG-Test (was `sql/86e3jt562-profile-column-writes.sql`, deleted 2026-10-29).

**Known pending database change (not applied) — profile picture Storage DELETE (86e3jtcdk; ClickUp [1dfe8wf2hr2](https://app.clickup.com/t/1dfe8wf2hr2)):** On live Test, policy `"Users can delete own profile picture"` on `storage.objects` allows authenticated DELETE on `{uid}.*` in bucket `profile-pictures` **without** `public.auth_can_upload_profile_picture()`, while INSERT/UPDATE on that bucket already require it. Proposed fix (was `sql/86e3jtcdk-profile-picture-delete-policy-proposed.sql`, deleted 2026-10-29; full text also in git history) — **requires Kadin explicit OK and a fresh backup before any production apply:**

```sql
drop policy if exists "Users can delete own profile picture" on storage.objects;
create policy "Users can delete own profile picture"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like ((select auth.uid())::text || '.%')
  and public.auth_can_upload_profile_picture()
);
```

My Account remove uses `DELETE /api/upload/profile-picture` (service role for `photo_url`; session client may delete storage objects). Tightening DELETE RLS blocks direct Storage API abuse without breaking that route when the service role is used.

**Known pending database change (not applied) — `auth_can_upload_profile_picture()` EXECUTE for anon (ClickUp [1dfe8wf2hu7](https://app.clickup.com/t/1dfe8wf2hu7)):** Live Test grants `EXECUTE` on `public.auth_can_upload_profile_picture()` to `anon` as well as `authenticated`; the repo file intended authenticated-only. Low risk to tighten. **Requires Kadin explicit OK and a fresh backup before any production apply:**

```sql
REVOKE EXECUTE ON FUNCTION public.auth_can_upload_profile_picture() FROM anon;
```

**Known pending database change (not applied) — `codex_retired_ids` table grants (ClickUp [1dfe8wf2hu8](https://app.clickup.com/t/1dfe8wf2hu8)):** Live Test grants `ALL` on `public.codex_retired_ids` to `anon` and `authenticated`; intended posture is service-role writes only with scoped read if needed. Low risk to tighten. **Requires Kadin explicit OK and a fresh backup before any production apply:**

```sql
REVOKE ALL ON public.codex_retired_ids FROM anon, authenticated;
```

---

### 2.3 Codex (reference data) — all in `public`

All codex tables are **columnar** and live in **public** (no `codex` schema). Array-like fields are stored as TEXT (comma-sep). Field semantics: see `src/docs/human/CODEX_SCHEMA_REFERENCE.md`.

| Table | Shape | Key columns (public schema) |
|-------|--------|------------------------|
| `codex_feats` | Columnar | id (PK), name, description, req_desc, ability_req (TEXT), abil_req_val (TEXT), skill_req (TEXT), skill_req_val (TEXT), feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags (TEXT), char_feat, state_feat, base_feat_id (TEXT, nullable) |
| `codex_skills` | Columnar | id (PK), name, description, ability, base_skill (TEXT), success_desc, failure_desc, ds_calc, craft_failure_desc, craft_success_desc |
| `codex_species` | Columnar | id (PK), name, description, type, sizes (TEXT), skills (TEXT), species_traits (TEXT), ancestry_traits (TEXT), flaws (TEXT), characteristics (TEXT), ave_hgt_cm, ave_wgt_kg, adulthood_lifespan (TEXT), languages (TEXT), **is_starter (BOOLEAN)**, **catalog_listing (TEXT NOT NULL DEFAULT `listed`; `listed`\|`unlisted`, ADR-0027)**, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** — denormalized cache synced from bank (ADR-0003 / TASK-494; TASK-498 backfilled legacy entity-tied URLs) |
| `codex_traits` | Columnar | id (PK), name, description, uses_per_rec, rec_period, flaw, characteristic, option_trait_ids (TEXT) |
| `codex_parts` | Columnar | id (PK), name, description, category, base_en, base_tp, op_1_desc, op_1_en, op_1_tp, op_2_desc, op_2_en, op_2_tp, op_3_desc, op_3_en, op_3_tp, type, mechanic, percentage, duration, defense (TEXT) |
| `codex_properties` | Columnar | id (PK), name, description, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, type, mechanic |
| `codex_equipment` | Columnar | id (PK), name, description, category, currency, rarity, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** — equipment is a first-class Image Library category (TASK-494) |
| `codex_archetypes` | Columnar | id (PK), name, type, description, archetype_ability, secondary_ability, power_prof_start, martial_prof_start, power_prof_level5, martial_prof_level5, level1_feats (TEXT), level1_skills (TEXT), level1_powers (TEXT), **level1_innate_powers (TEXT, applied TASK-473 2026-07-15)** — CSV → `path_data.level1.innatePowers`, level1_techniques (TEXT), level1_armaments (TEXT), level1_equipment (TEXT), level1_recommend_unarmed_prowess (BOOLEAN), level1_remove_feats (TEXT), level1_remove_powers (TEXT), level1_remove_techniques (TEXT), level1_remove_armaments (TEXT), level1_notes (TEXT), level1_guidance_groups (JSONB; groups may include `audience: "character"|"archetype"` for feat groups — TASK-514/ADR-0004), **removed TASK-517:** `level1_recommended_species` (species curation = `codex_species.is_starter` only), **level1_recommended_abilities (JSONB)**, **level1_loadouts (JSONB)** (optional metadata `{ armorStep?, sharedEquipment? }` only; kit arrays removed TASK-442; weapon/armor/gear picks use `level1_armaments` / `level1_equipment`); **legacy:** `path_data` (JSONB, optional — pre-columnar compat; GET /api/codex composes `path_data` from level1 columns + `codex_archetype_levels`). **Player picker visibility:** paths appear in creator/codex/sheet switcher only when level 1 has at least one add recommendation (feats/skills/powers/innatePowers/techniques/armaments/equipment); see `src/docs/human/CODEX_SCHEMA_REFERENCE.md` and `pathHasPlayerVisibleLevel1()` |
| `codex_archetype_levels` | Columnar | id (PK), archetype_id (FK → codex_archetypes.id), level, feats (TEXT), skills (TEXT), powers (TEXT), techniques (TEXT), armaments (TEXT), equipment (TEXT), remove_feats (TEXT), remove_powers (TEXT), remove_techniques (TEXT), remove_armaments (TEXT), notes |
| `codex_creature_feats` | Columnar | id (PK), name, description, feat_points, feat_lvl, lvl_req, mechanic, **sources (text[] NOT NULL, default `{Core}`)** |
| `core_rules` | JSONB | id (PK), data (JSONB), updated_at |

**Rules sources:** `codex_feats`, `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, and `codex_creature_feats` each have `sources text[] NOT NULL` with default `{Core}`, GIN indexes on `sources`, and **no** `*_sources_check` constraints on production. Display names on that array are the source identity; whitespace collapse in the app matches `public.collapse_codex_source_name`. The legacy nullable `source` text column remains and is not rewritten. `codex_species.is_starter` is the guided-creator starter flag only (not access control). Historical DDL: singular column (was `sql/codex-entry-source.sql`, deleted 2026-10-29), array + checks (was `sql/codex-entry-sources.sql`, deleted 2026-10-29), open display names / drop checks (was `sql/codex-entry-sources-open.sql`, deleted 2026-10-29, applied 2026-10-17). Verify column defaults and policies on the live database; do not re-paste deleted migrations.

---

### 2.4 Official library (admin-curated Realms content, browse by all)

All **columnar** (scalars + `payload` JSONB). Legacy `public_*` JSONB tables (`public_powers`, `public_techniques`, etc.) were **dropped** after migration to `official_*`; they are not present in production.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `official_powers` | Columnar | id (PK), name, description, action_type, is_reaction, innate, range/duration/area/damage columns, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** cache, payload (JSONB), **catalog_listing (TEXT NOT NULL DEFAULT `listed`; `listed`\|`unlisted`)**, created_at, updated_at |
| `official_techniques` | Columnar | id (PK), name, description, action_type, promoted columns, **image_id**, **image_url** cache, payload (JSONB; `attackMode` + parts; Attack label derived in app — **dropped** `weapon_name` 2026-07-20), **catalog_listing**, created_at, updated_at |
| `official_empowered_techniques` | Columnar | Same shape as official_techniques + **image_id** (picker uses power\|technique tags — no separate category), **image_url** cache, **catalog_listing** |
| `official_items` | Columnar | id (PK), name, description, type, rarity, armor_value, damage_reduction, promoted columns, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** — armament/equipment art cache, payload (JSONB), **catalog_listing**, created_at, updated_at |
| `official_creatures` | Columnar | id (PK), name, description, level, type, size, hit_points, energy_points, **image_id**, **image_url** cache, payload (JSONB), **catalog_listing**, created_at, updated_at |

**API:** `GET /api/official/[type]` defaults to `catalog_listing = listed` (player Public library). `?includeUnlisted=1` is honored only for an admin session (Admin library + editor). `POST`/`PATCH`/`DELETE` require admin and write to `official_*` / `codex_species`. Unlisted rows stay publicly **readable** by id (RLS `Anyone can read official_*`); they are omitted from list/count APIs. Legacy `public_*` JSONB tables were dropped; do not reference them in app code.

**Official library (live shape):** Tables `official_powers`, `official_techniques`, `official_empowered_techniques`, `official_items`, and `official_creatures` exist in `public` with admin write RLS and public read policies; promoted columns and `sync_library_promoted_columns` triggers match user-library parity where noted below. Confirm table list, RLS, and `catalog_listing` on the live database before debugging “Save to Official Library.” Historical one-off scripts (all deleted 2026-10-29; see git history): create + RLS (was `sql/supabase-official-library-public-schema.sql`, deleted 2026-10-29); optional powers column promotion (was `sql/supabase-official-library-columnar-expansion.sql`, deleted 2026-10-29); library column parity + trigger (was `sql/supabase-library-columnar-parity-expansion.sql`, deleted 2026-10-29); TASK-627 payload dedupe (was `sql/official-powers-strip-redundant-auto-mechanic-parts-applied.sql`, deleted 2026-10-29); TASK-927 `catalog_listing` (was `sql/official-catalog-listing.sql`, deleted 2026-10-29).

**`payload.parts` (powers):** User and advanced parts only after TASK-627 cleanup; auto-mechanic parts derivable from promoted columns (`range_steps`, `duration_*`, `area_*`, `damage`, `action_type`, `is_reaction`) are rebuilt on read in app (`mechanic-builder.ts`) and were removed from official rows in live codex data.

**`payload.range` / `payload.area` / `payload.duration` (powers):** Promoted scalars hold `steps` / `type`+`level` / `type`+`value` for indexing. Non-promoted fields (`applyDuration` on range/area; duration `focus` / `noHarm` / `endsOnActivation` / `sustain`) live in the nested payload objects and are merged on read in `library-columnar.ts` (`rowToItem`). Do not skip writing these nested objects on save — TASK-642.

---

### 2.5 User library

All **columnar** (scalars + `payload` JSONB). Species matches codex_species columns + user_id + payload.

| Table | Shape | Key columns |
|-------|--------|-------------|
| `user_powers` | Columnar | id (PK), user_id (FK), name, description, action_type, is_reaction, innate, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** cache, created_at, updated_at, payload (JSONB) |
| `user_techniques` | Columnar | id (PK), user_id (FK), name, description, action_type, **image_id**, **image_url** cache, created_at, updated_at, payload (JSONB; `attackMode` + parts; Attack label derived in app — **dropped** `weapon_name` 2026-07-20) |
| `user_empowered_techniques` | Columnar | id (PK), user_id (FK), name, description, action_type, **image_id** (picker uses power\|technique tags), **image_url** cache, created_at, updated_at, payload (JSONB; same attack-mode model as techniques) |
| `user_items` | Columnar | id (PK), user_id (FK), name, description, type, rarity, armor_value, damage_reduction, **image_id (UUID, nullable FK → realms_images)**, **image_url (TEXT, nullable)** — same semantics as `official_items`, created_at, updated_at, payload (JSONB) |
| `user_creatures` | Columnar | id (PK), user_id (FK), name, description, level, type, size, hit_points, energy_points, **image_id**, **image_url** cache, created_at, updated_at, payload (JSONB) |
| `user_species` | Columnar | id (PK), user_id (FK), name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages, **image_id**, **image_url** cache, created_at, updated_at, payload (JSONB) — same semantics as `codex_species` |

**Power variants (ADR-0029, TASK-929):** `official_powers.payload` / `user_powers.payload` may carry `composition` `{ structure: none|choice|alternate|modify|randomize, variants[], reverse?, die? }` — JSONB only, no new columns. Composed Choice rows keep the shared chassis in the columns and leave `damage` empty (variants own damage). Character `powers[]` entries persist `selectedVariantId` beside `innate`.

**User-library image parity (TASK-497, ADR-0003, REALMS §5.0.3):** `user_powers`, `user_techniques`, `user_empowered_techniques`, `user_items`, `user_creatures`, and `user_species` have nullable `image_id` matching official/codex counterparts ((was `sql/realms-image-user-entity-columns.sql`, deleted 2026-10-29) — **applied** 2026-07-17). Copy official → user on add-to-library copies `image_id` (and cache URL). Creators pick bank images; non-admins do not upload into the bank. No separate `user_equipment` table (armament art on `user_items`). No art columns on feats/skills/archetypes/parts/properties/creature feats/traits.

### 2.5a Realms Image Library (ADR-0003, TASK-492)

| Table / object | Shape | Key columns / notes |
|----------------|--------|---------------------|
| `realms_images` | Columnar | id (UUID PK), name, storage_path (unique), public_url, created_at, updated_at, created_by (nullable FK → auth.users) — **one Storage object per row** |
| `realms_image_category` | ENUM | Locked: `species`, `creature`, `weapon`, `armor`, `shield`, `equipment`, `power`, `technique`. No `empowered` tag. |
| `realms_image_categories` | Join | (image_id, category) PK — multi-select tags on master |
| Storage | Bucket `codex-art` | Bank paths: `library/{id}.{ext}`. Cataloged legacy paths `{entityType}/{entityId}.jpg` remain valid until admin replace moves them (TASK-498 applied). Public read; admin writes via service role. |
| Consumers | FK (TASK-494 official/codex; TASK-497 user_*) | Nullable `image_id` → `realms_images.id`; optional denormalized `image_url` synced on replace |
| SQL (entity columns) | — | (was `sql/realms-image-entity-columns.sql`, deleted 2026-10-29) — **applied** on RealmsRPG-Test (`realms_image_entity_columns`, 2026-07-16, owner-approved) |
| SQL (user entity columns) | — | (was `sql/realms-image-user-entity-columns.sql`, deleted 2026-10-29) — **applied** on RealmsRPG-Test (`realms_image_user_entity_columns`, 2026-07-17) |
| RLS | — | Guest + authenticated **SELECT**; **admin-only** write/replace/delete via `/api/images*` (service role after `isAdmin()`) |
| SQL | — | (was `sql/realms-image-library.sql`, deleted 2026-10-29) — **applied** on RealmsRPG-Test (`realms_image_library`, 2026-07-16) |

**API (TASK-492):**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/images?category=&q=` | Public | List/filter by category (comma OR) + name search |
| GET | `/api/images/[id]` | Public | Single asset |
| POST | `/api/images` | Admin | Create: multipart `file` + `name` + `categories` (JSON/CSV) |
| PATCH | `/api/images/[id]` | Admin | Update name and/or categories |
| POST | `/api/images/[id]/replace` | Admin | Replace master file; sync consumer `image_url` caches |
| GET | `/api/images/[id]/usage` | Admin | Entities referencing `image_id` (warn UI) |
| DELETE | `/api/images/[id]` | Admin | Clear all refs → remove Storage object + row |

Helpers: `src/lib/realms-images.ts` (client + types), `src/lib/realms-images-server.ts`, `src/lib/realms-image-consumers.ts`, `src/lib/entity-image-url.ts`, `src/lib/entity-image-enrich-server.ts`. Uploads via `apiUpload` only.

**Legacy migration (TASK-498, applied 2026-07-17):** (was `sql/realms-image-catalog-legacy-entity-art.sql`, deleted 2026-10-29) registered existing entity-tied Storage objects into `realms_images` (same path) and set consumer `image_id`. Entity-tied upload route `/api/upload/codex-art` and `CodexArtUploadField` removed. Do not delete cataloged Storage objects while `image_id` refs remain.

If Supabase logs show **`permission denied for table user_species`**, the `authenticated` role is missing table `GRANT`s (common after creating/moving the table without grants). Confirm table `GRANT`s and RLS on `public.user_species` in the live database (Dashboard → Table Editor). Historical script (was `sql/supabase-user-species-grants-rls.sql`, deleted 2026-10-29) in git history. For a new environment use owner-approved DDL (see guide/07-database-operations.md), not a straight paste of deleted files. This does not fix campaign invite lookup by itself (that is separate RLS on `campaigns`); it fixes species library / hooks that query `user_species`.

**API:** `GET/POST/PATCH/DELETE /api/user/library/[type]`; types: powers, techniques, empowered-techniques, items, creatures, species. Tab badges: `GET /api/user/library/counts` (auth) and `GET /api/official/counts` (public). Tab badges: `GET /api/user/library/counts` (auth) and `GET /api/official/counts` (public).

---

### 2.6 Characters

| Table | Shape | Key columns |
|-------|--------|-------------|
| `characters` | Hybrid | id (PK), user_id (FK → user_profiles), data (JSONB), created_at, updated_at, client_request_id (uuid, nullable); list columns: name, level, archetype_name, ancestry_name, status, visibility |

Single document in `data`; list columns for list/filter. Realtime: `public.characters`.

**Dirty-key PATCH + `updated_at` lock (TASK-741 / ADR-0013 / TASK-786):** `PATCH /api/characters/[id]` merges only keys present in the body (not a full-document smash). A present `null` removes that key, which is how a cleared sheet value is saved (86e3juw04). When the client sends `updatedAt` matching `characters.updated_at`, the UPDATE also `.eq('updated_at', <just read>)`; mismatch or a lost race → **409** `{ error: string }`. Success returns `{ ok: true, updatedAt }`. The route stamps `updated_at` on every PATCH; create/duplicate stamp it on insert so the first sheet save can lock. The client keeps the newest token in memory and queues same-id PATCHes so sheet autosave and encounter resource sync do not 409 each other.

**Idempotent create (`client_request_id`, TASK-738):** Applied 2026-08-13 via (was `sql/task-738-characters-client-request-id.sql`, deleted 2026-10-29). `POST /api/characters` accepts a client-generated `clientRequestId` and stores it in this column; a repeated key returns the first character instead of inserting a second one, so a create whose response was lost cannot duplicate the character. The partial unique index `characters_user_client_request_id_key (user_id, client_request_id) WHERE client_request_id IS NOT NULL` is what makes the replay race-safe — a losing concurrent insert gets `23505` and the route re-reads the winning row. Nullable: rows created before the key existed, and callers that omit it, are unaffected.

**Character save legality advisory (TASK-738, B5 1dfe8wf2g9k):** `POST /api/characters` and `PATCH /api/characters/[id]` run `evaluateCharacterLegalityForSave` / `findCharacterLegalityViolations` (`lib/game/character-legality.ts`) at every level when `core_rules` loaded. Over-budget payloads return `legalityWarnings` on **200**; saves are not blocked. Empty `core_rules` → `legalityUncomputable`. Prevention gate: `scripts/check-character-legality-all-levels.mjs` (lint). Required `CharacterLegalityRulesStatus` on each legality call.

**Character `data` JSON (app-owned, no DB migration for new keys):** Feats are lean entries `{ id, currentUses?, customName?, note? }` on `feats` / `archetypeFeats`; trait player labels live in `traitCustomizations` (map of trait id → `{ customName?, note? }`). Codex names/descriptions are enriched on load, not stored on save.

**Temp Modifier (`tempModifiers`, ADR-0006 / TASK-585 / TASK-782):** Optional sparse object of integer Bonus/Penalty deltas layered on display/computed values (not allocation bases). Keys include `speed`, `evasion`, `damageReduction`, `criticalRange`, `terminal`, `abilities` (partial ability map), `defenses` (partial defense-name map), `skills` (skill id → delta), and optional `applyAbilityToResourceMaxima` (boolean; default omit/false — ability temps do not change max Health/Energy/TP maxima unless true). Persist via `cleanForSave` / `SAVEABLE_FIELDS`; normalize zeros out with `normalizeTempModifiers`. UI chrome: sheet-level Edit vs Temp toolbar (TASK-782). Surface wiring: TASK-586.

**Cross-user read (campaign / public):** `/api/characters/[id]` applies visibility in app code, but Supabase RLS runs first. If the only SELECT policy is “own rows,” other users get no row → “Character not found.” Confirm `characters_select_authenticated` (and related SELECT policies) on `public.characters` in the live database; historical script (was `sql/supabase-characters-rls-cross-read.sql`, deleted 2026-10-29) in git history. On a misconfigured database, owner-approved DDL should add SELECT policies for `data.visibility = 'public'` and for `campaign` when the reader is the campaign owner or in `campaign_members` and the character appears on that campaign’s `characters` JSON roster (`userId`/`characterId` or snake_case).

**Campaign roster read (86e3jryyt) — applied 2026-10-09 on RealmsRPG-Test:** `characters_select_authenticated` still matches those roster keys, and also requires `private.campaign_roster_user_joined`: the roster user is that campaign’s owner or a current `campaign_members` row. A leftover JSON entry does not grant the read after the membership row is gone. Historical replay script (was `sql/86e3jryyt-campaign-roster-members-only.sql`, deleted 2026-10-29) in git history (already applied on RealmsRPG-Test; verify policies in the live database rather than re-pasting).

**Guest public sheets (TASK-649):** Applied 2026-08-03. `characters_select_authenticated` remains `TO authenticated`; (was `sql/task-649-characters-anon-public-read-applied.sql`, deleted 2026-10-29) adds `characters_select_public_anon` for guests (`visibility = 'public'`). Owner library on public views still uses service_role in `getOwnerLibraryForView`.

---

### 2.7 Campaigns

| Table | Shape | Key columns |
|-------|--------|-------------|
| `campaigns` | Scalar + JSONB | id (PK), owner_id, name, description, invite_code, characters (JSONB), memberIds (JSONB), owner_username, created_at, updated_at |
| `campaign_members` | Columnar | campaign_id (PK), user_id (PK); FK campaign_id → campaigns(id) |
| `campaign_rolls` | Hybrid | id (PK, required on insert unless DB default), campaign_id (FK), data (JSONB), **created_at** (app POST sets ISO `now`; optional DB `DEFAULT now()`); list columns: character_id, user_id, type, title |

Membership source of truth: `campaign_members`. Realtime: `public.campaign_rolls`.

**Known pending database change (not applied) — `campaign_rolls.created_at` backfill (ClickUp [1dfe8wf2hu6](https://app.clickup.com/t/1dfe8wf2hu6)):** On live Test, some `public.campaign_rolls` rows still have NULL `created_at` (the backfill in (was `sql/supabase-campaign-rolls-created-at-backfill.sql`, deleted 2026-10-29) was **never applied**). Owner-approved data fix only; requires backup first. Not part of this repo cleanup PR.

**RLS (`campaigns`):** One permissive SELECT policy per role — `campaigns_select_participants` (`owner_id = auth.uid()` **or** `private.auth_is_campaign_participant(id)`). The `owner_id` short-circuit is required so `INSERT … RETURNING` can see the in-flight owner row (STABLE helper lookup cannot; TASK-802). Owner write policies: `campaigns_owner_insert`, `campaigns_owner_update`, `campaigns_owner_delete`. Do not restore a second `campaigns_owner_select` policy (TASK-650 / `multiple_permissive_policies`). Historical replay script (was `sql/task-802-campaigns-select-owner-short-circuit.sql`, deleted 2026-10-29) in git history (already applied on RealmsRPG-Test; verify policies in the live database rather than re-pasting).

**Roster JSON (86e3jryyt) — applied 2026-10-09 on RealmsRPG-Test:** Trigger `campaigns_roster_members_only` runs before insert or before update of `characters`. A signed-in owner can add a roster entry only for their own character. The service role can add another user’s character only when that user already has a `campaign_members` row and owns the character. Entries already stored stay, including a slot whose character row is gone. `campaign_members` policies are unchanged. Migration `campaign_roster_members_only` (`20261009202856`). Historical replay script (was `sql/86e3jryyt-campaign-roster-members-only.sql`, deleted 2026-10-29) in git history (already applied on RealmsRPG-Test; verify policies in the live database rather than re-pasting).

**Join-by-invite (app behavior):** RLS on `campaigns` allows SELECT only for the owner or existing members, so a new player cannot load a campaign row with the normal user-scoped Supabase client. The app uses **`SUPABASE_SERVICE_ROLE_KEY`** (server-only) in `joinCampaignAction` and in `GET /api/campaigns/invite/[code]` to look up by `invite_code` and update roster/members after the user is authenticated and character ownership is verified.

**RLS (`campaign_members`) — applied 2026-10-09 on RealmsRPG-Test (86e3jryyr):** Authenticated INSERT is `campaign_members_insert_owner_self`: `private.auth_is_campaign_owner(campaign_id)` AND `user_id = auth.uid()`. A signed-in user cannot insert their own row on a campaign they do not own, and cannot insert another user's row. There is no UPDATE policy (`campaign_members_update_self` is dropped), so a membership row cannot be moved onto another campaign. SELECT remains `campaign_members_select_participants` (self or owner). DELETE remains `campaign_members_delete_owner_or_self` (self or owner). A valid invite code is the only way to join a campaign you do not own; that write uses the service role in `joinCampaignAction`. The owner still inserts their own membership with the user client in `createCampaignAction`. Historical replay script (was `sql/86e3jryyr-campaign-members-insert-owner-self.sql`, deleted 2026-10-29) in git history (already applied on RealmsRPG-Test; verify policies in the live database rather than re-pasting).

If logs show **`permission denied for table campaign_members`**, confirm explicit `GRANT`s on `public.campaign_members` for `authenticated` in the live database; historical script (was `sql/supabase-campaign-members-grants.sql`, deleted 2026-10-29) in git history — the `authenticated` role needs explicit `GRANT` on the table (RLS does not replace table privileges).

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

**Migration (run in owner-approved database apply (see 07-database-operations.md)):**

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

**Migration (run in owner-approved database apply (see 07-database-operations.md)):**

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
| `official_enhanced_items` | Columnar + payload | id (PK), name, description, currency_cost, rarity, base_item_source, base_item_id, base_item_name, base_item_description, power_source, power_id, power_name, uses_type, uses_count, **catalog_listing**, payload (JSONB), created_at, updated_at |

Stores **official** enhanced equipment for the Realms library (base item + imbued power). Unlike `user_enhanced_items`, `currency_cost` and `rarity` are derived from the **ideal enhanced crafting rules** (assuming proper successes) rather than a specific crafting outcome.

**Migration (run in owner-approved database apply (see 07-database-operations.md)):**

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

**RLS + grants:** Also in (was `sql/supabase-security-hardening-2026-06.sql`, deleted 2026-10-29) if the table was created without policies.

---

### 2.12 UI Tooltips (removed)

**Removed 2026-06-30 (DEV-376 / TASK-392):** Legacy `ui_tooltips` table and `user_profiles.show_tooltips` column were dropped. Contextual help uses `InfoTippy` + `public/tooltip-text.tsx`. See (was `sql/drop-legacy-ui-tooltips-2026-06.sql`, deleted 2026-10-29). Original create script (historical): (was `sql/supabase-ui-tooltips.sql`, deleted 2026-10-29).

---

### 2.13 Role policies (admin-managed permissions and quotas)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `role_policies` | Columnar | role (PK, UserRole), max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions (JSONB), updated_at, updated_by |

Stores role-level quotas and permission flags used by campaign, character, library, and profile feature gating. This is the source for admin-editable role limits in the app.

**Migration:** (was `sql/supabase-role-policies.sql`, deleted 2026-10-29)

---

### 2.14 Codex edit changelogs (admin audit trail)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `codex_change_logs` | Append-only JSONB snapshots | id (PK), entity_type, entity_id, operation (`create`/`update`/`delete`), changed_at, changed_by_user_id (FK auth.users), before_data (JSONB), after_data (JSONB), changed_fields (JSONB) |

Stores short-term admin edit history for codex/core-rules entities. Each change stores before/after snapshots plus actor and timestamp.

Retention rule: DB trigger keeps only the latest 10 rows per `(entity_type, entity_id)`.

**Diffs (TASK-874):** `changed_fields` and the admin UI omit empty-equivalent pairs (`null` / `""` / `[]` / `{}`) and bookkeeping timestamps (`updated_at`, `created_at`). **Creates** persist and display identity only (name + kind); **deletes** keep the prior-state field dump. Full `before_data` / `after_data` snapshots still persist on update/delete until DEV-Q07.

**Migration:** (was `sql/supabase-codex-change-logs.sql`, deleted 2026-10-29)

---

### 2.15 Admin role audit (append-only)

| Table | Shape | Key columns |
|-------|--------|-------------|
| `admin_role_audit` | Append-only | id (PK), actor_id, target_id, old_role, new_role, created_at |

Records admin role changes from `PATCH /api/admin/users/update-role`. RLS: admins read-only; writes via service role only.

**Migration:** (was `sql/supabase-admin-role-audit-2026-06.sql`, deleted 2026-10-29)

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
| Official/user column parity expansion | Done | **TASK-304:** promoted columns for powers/techniques/items on both official_* + user_*; trigger-based payload sync ((was `sql/supabase-library-columnar-parity-expansion.sql`, deleted 2026-10-29)). |
| User library (species) | Done | **TASK-280:** user_species columnar (codex_species + user_id + payload); SQL + API. |
| Public/official library | Done | **TASK-279:** official_* in public; legacy `public_*` JSONB tables dropped; GET /api/public reads official_* only. |
| Legacy `_prisma_migrations` | Done | Dropped via (was `sql/supabase-security-hardening-2026-06.sql`, deleted 2026-10-29). |
| Campaign members | Done | campaign_members table; memberIds deprecated. |
| Encounters list | Done | **TASK-281:** name, type, status columns; backfill + API. |
| Characters list | Done | **TASK-282:** name, level, archetype_name, ancestry_name, status, visibility; backfill + API. |
| Campaign rolls list | Done | **TASK-283:** character_id, user_id, type, title; backfill + API. |
| Core rules | Keep JSONB | Category-specific shapes; no columnar migration planned. |
| UI tooltips (legacy DB) | Removed | Dropped 2026-06-30 — (was `sql/drop-legacy-ui-tooltips-2026-06.sql`, deleted 2026-10-29). Help copy in `public/tooltip-text.tsx` + `InfoTippy`. |

See ClickUp / git history for TASK-279–TASK-283 and TASK-304 rationale.

### 4.1 `anon` role grant posture (TASK-649 — applied 2026-08-03)

Live on RealmsRPG-Test after (was `sql/task-649-anon-least-privilege-applied.sql`, deleted 2026-10-29) + guest public character read. The `anon` role has **SELECT only** on intentional public-read tables:

| Table group | Tables | RLS |
|-------------|--------|-----|
| Codex + rules | `codex_*` (10 tables), `core_rules` | `Anyone can read …` (`TO public`) |
| Official library | `official_powers`, `official_techniques`, `official_empowered_techniques`, `official_items`, `official_creatures`, `official_enhanced_items` | `Anyone can read official_*` (unlisted `catalog_listing` rows stay publicly readable; list APIs filter) |
| Image bank metadata | `realms_images`, `realms_image_categories` | `Anyone can read realms images*` |
| Guest public sheets | `characters` | `characters_select_public_anon` — `visibility = 'public'` only |

All other `public` tables: **no** `anon` table grants (RLS + `authenticated` / `service_role` as before). **VTT tables (`vtt_*`)** unchanged — out of scope for TASK-649 (Collins branch).

**Storage art (no sign-in):** `codex-art`, `portraits`, and `profile-pictures` buckets remain **public** in `storage.buckets`. TASK-649 removed bucket-wide Storage **listing** policies on `codex-art` (same pattern as portraits); **direct object URLs / CDN GETs still work** without a SELECT policy.

TASK-649 Phase 2 is applied on RealmsRPG-Test (anon least-privilege table grants, codex-art storage SELECT hardening, index hygiene, etc.). Historical replay scripts are named `sql/task-649-*-applied.sql` (deleted 2026-10-29; see git history). Do not re-apply on production without owner approval. Current posture is summarized in the table above and in `sql/README.md`; owner-approved DDL only (see `guide/07-database-operations.md`).

---

## 5. What to change elsewhere

- **Do not** duplicate this table list in other docs. Point to **this file** for “how is the DB organized?”
- **Path C / DB rationale** — historical audit docs were removed with `src/docs/ai/archive/`; for current schema use this doc and git history.
- **Codex field reference** (`src/docs/human/CODEX_SCHEMA_REFERENCE.md`): Defines **fields** (meaning, types, use) for codex entities; this doc defines **tables and columns** in Supabase.

---

## 6. Quick reference: API → tables

| API or feature | Tables (public) |
|----------------|-----------------|
| GET /api/codex | codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats, core_rules |
| GET /api/public/[type] | official_powers, official_techniques, official_empowered_techniques, official_items, official_creatures |
| GET/POST/PATCH/DELETE /api/official/enhanced-items | official_enhanced_items (admin) |
| GET /api/official/counts | official_powers, official_techniques, official_empowered_techniques, official_items, official_creatures (`enhanced` always 0) |
| GET /api/official/counts | official_powers, official_techniques, official_empowered_techniques, official_items, official_creatures (`enhanced` always 0) |
| GET/POST/PATCH/DELETE /api/user/library/[type] | user_powers, user_techniques, user_empowered_techniques, user_items, user_creatures, user_species |
| GET /api/user/library/counts | same user_* tables + user_enhanced_items (auth; armament split via `normalizeArmamentKind`) |
| GET /api/user/library/counts | same user_* tables + user_enhanced_items (auth; armament split via `normalizeArmamentKind`) |
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
- **storage** — Supabase Storage (buckets, objects). **Buckets:** `portraits`, `profile-pictures` (any user; may also **pick** Realms Image Library assets tagged species/creature — TASK-499), **`codex-art`** (Realms Image Library master objects under `library/{id}.{ext}` + cataloged legacy entity paths — ADR-0003 / TASK-492 / TASK-498). Public read; admin/service-role writes for bank. RLS: (was `sql/supabase-storage-policies.sql`, deleted 2026-10-29), (was `sql/codex-art-species-image-url.sql`, deleted 2026-10-29), (was `sql/realms-image-library.sql`, deleted 2026-10-29). Consumers store **`image_id`** (+ optional `image_url` cache). See REALMS §5.0.3.

If you see **404 or 500** on any `/rest/v1/codex_*` or `core_rules`, check that the table exists in **public** (Table Editor) and that RLS allows the anon/service role used by the API (see DEPLOYMENT_AND_SECRETS_SUPABASE.md).
