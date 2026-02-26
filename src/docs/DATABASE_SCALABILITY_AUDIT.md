# Database Scalability & Best-Practices Audit (rationale / future work)

**Purpose:** Rationale for columnar vs JSONB and naming (e.g. public → official). **For current table layout use [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md)** — single source of truth.

**Related:** `SUPABASE_SCHEMA.md` (current schema), `DATABASE_CODEX_AUDIT.md`, `src/hooks/use-user-library.ts`, `src/lib/calculators/`.

---

## 1. Current JSONB usage (summary)

**Authoritative table list:** [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md). Summary below for audit context only.

| Location | Current shape (per SUPABASE_SCHEMA) | Notes |
|----------|-------------------------------------|--------|
| **Codex** | Columnar | codex_* in public |
| **Public library** | id + data (JSONB) | public_powers, public_techniques, public_items, public_creatures; optional future: columnar official_* |
| **User library** | Columnar (scalars + payload) except user_species (id+data) | user_powers, user_techniques, user_items, user_creatures, user_species |
| **Characters** | id, user_id, data (JSONB) | Single document |
| **Campaigns** | campaigns (JSONB cols) + campaign_members + campaign_rolls (data JSONB) | |
| **Encounters** | id, user_id, data (JSONB) | |
| **Core rules** | id, data (JSONB) | |

---

## 2. Naming: "public" → "official"

- **Current:** Tables and UI say "public library" (admin-curated content everyone can browse).
- **Recommendation:** Rename to **"official"** everywhere: tables `official_powers`, `official_techniques`, `official_items`, `official_creatures`; API routes; UI labels ("Official Library", "Add from official").
- **Rationale:** Clearer meaning (curated by admins, not "public" in the sense of PostgreSQL `public` schema), and avoids confusion with the `public` schema.

---

## 3. Official & user library: columnar, same shape

**Goal:** Official and user library use the **same column set** (plus `user_id` for user tables) so that:

- Rows can be queried and filtered by name, type, category, etc.
- "Add to my library" from official = copy row from official_* into user_* with same columns + `user_id`.
- Future tooling (e.g. CSV export/import, reporting) works on columns.

**Approach:** One columnar schema per entity (power, technique, item, creature). Variable-length or nested data (e.g. **parts**, **properties**, **damage**) stay as a **single JSONB column** per entity so we don’t need dozens of columns or many junction rows for one item. Top-level scalars (name, description, action_type, innate, etc.) become real columns.

### 3.1 Recommended column sets (scalars + one JSONB for “rest”)

**Power** (official_powers / user_powers)

- **Columns:** id, (user_id only on user table), name, description, action_type, is_reaction, innate, created_at, updated_at.
- **JSONB:** parts_damage_duration (or single `payload` JSONB) containing: parts[], damage[], range, duration, area.  
  Rationale: Parts/damage/duration/area are variable and already consumed by existing calculators; keeping them in one JSONB keeps migration smaller while still allowing indexing/filtering by name and action_type.

**Technique** (official_techniques / user_techniques)

- **Columns:** id, (user_id), name, description, action_type, weapon_id or weapon_name, created_at, updated_at.
- **JSONB:** parts_damage (parts[], damage, etc.).

**Item** (official_items / user_items)

- **Columns:** id, (user_id), name, description, type (weapon/armor/shield/equipment), rarity, armor_value, damage_reduction, created_at, updated_at.
- **JSONB:** properties_damage (properties[], damage[], range, ability requirement, shield fields, etc.).

**Creature** (official_creatures / user_creatures)

- **Columns:** id, (user_id), name, description, level, type, size, hit_points, energy_points, created_at, updated_at.
- **JSONB:** abilities_defenses_skills_feats (abilities, defenses, skills[], feats[], resistances[], etc.).

**Species** (user_species only; no “official” species table today)

- Can mirror codex_species column set + user_id so it’s interchangeable with codex species (user’s custom species).

These shapes keep **official** and **user** tables aligned: same columns, so copy official → user is a simple insert with `user_id` set.

---

## 4. Other areas: recommendations

### 4.1 Campaigns

- **memberIds (JSONB):** Replace with a **campaign_members** table: (campaign_id, user_id, role?), so membership is queryable and indexable.
- **characters (JSONB):** List of campaign character refs (e.g. { userId, characterId }[]). Options: (A) Keep as JSONB for now, or (B) Normalize to **campaign_characters** (campaign_id, user_id, character_id). Normalizing improves consistency and allows JOINs.

### 4.2 Characters

- **Short-term (current):** Single JSONB document per character; list by user_id parses `data` for name, level, archetype, etc.
- **Long-term (recommended):** **Hybrid** — do **not** go full columnar (that would require many tables and every save touching many rows). Do add **list/index columns** on `characters`: e.g. `name`, `level`, `archetype_name`, `ancestry_name`, `status`, `visibility` (plus existing `id`, `user_id`, `updated_at`). Keep `data` (JSONB) for the full document. On every create/update, write these scalars from the document into columns. **Benefits:** List and filter without parsing JSONB; sort by level/name; future "characters level 5+", "by archetype"; analytics; one table, one write path. See **TASK-282**.

### 4.3 Encounters

- **Recommendation:** Keep **data (JSONB)** for now; optionally add **name, type, status** as real columns for list/filter if needed.
- **Rationale:** Encounter structure (combatants, round, skillEncounter) is nested and variable; primary use is load-by-id per user.

### 4.4 Campaign rolls

- **Short-term (current):** id, campaign_id, data (JSONB), created_at; list parses `data` for characterId, userId, type, title, etc.
- **Long-term (recommended):** **Hybrid** — add **list columns** to `campaign_rolls`: `character_id`, `user_id`, `type`, `title` (plus existing `id`, `campaign_id`, `created_at`). Keep `data` (JSONB) for dice, modifier, total, isCrit, etc. On every insert, set columns from payload. **Benefits:** Filter by type or character; sort/paginate by column; no JSONB parse for list views. See **TASK-283**.

### 4.5 Core rules

- **Recommendation:** Keep **id + data (JSONB)**. Categories have different shapes; normalizing would require many tables or a generic key-value style.

---

## 5. Phased implementation plan

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **1** | Rename public → official; add columnar official_* | New tables official_powers/techniques/items/creatures (scalar columns + one JSONB). Rename in API, UI. Migration: create new tables, backfill from public_* data, switch reads/writes, drop public_*. |
| **2** | User library columnar | ✅ **Done.** user_powers, user_techniques, user_items, user_creatures columnar (same columns as official + user_id); user_species unchanged. See sql/ or Supabase migrations (tables in public), TASK-272. |
| **3** | Campaign members | ✅ **Done.** campaign_members table; backfill from memberIds; RLS and API use campaign_members. See sql/ or Supabase (campaign_members in public), TASK-273. campaign_characters not done. |
| **4** | Character list columns (long-term) | If product needs “list characters by level/archetype”, **TASK-282:** Add name, level, archetype_name, ancestry_name, status, visibility to `characters`; keep data JSONB; backfill and update on save. |
| **5** | Campaign rolls list columns (long-term) | **TASK-283:** Add character_id, user_id, type, title to `campaign_rolls`; keep data JSONB; set on insert. |
| **6** | (Optional) Encounter list columns | **TASK-281:** Add name, type, status columns to encounters for filtering without parsing JSONB. |

**Queue:** Phase 1 = TASK-271, Phase 2 = TASK-272, Phase 3 = TASK-273, Phase 4 = TASK-282, Phase 5 = TASK-283, Phase 6 = TASK-281 (see AI_TASK_QUEUE.md).

---

## 6. Benefits after migration

- **Official and user content** use the same schema → easy “copy to my library”, future CSV/export, and consistent validation.
- **Naming:** “Official” clearly means admin-curated; no confusion with PostgreSQL `public`.
- **Query and scale:** Filter/sort by name, type, level, etc. without parsing JSONB; better indexing and plan stability.
- **Maintainability:** One source of truth for “power/technique/item/creature” shape; codex reference and library tables stay aligned where they share concepts.

---

## 7. Files to touch (by phase)

**Phase 1 (official rename + columnar)**  
- Schema: official_* tables in `public` (columnar); or rename public_* and add columns.  
- SQL: create official_* tables (or rename public_* and add columns); RLS.  
- API: `/api/public/[type]` → `/api/official/[type]` (or keep route with 302/alias); read/write columnar.  
- Admin: public-library → official-library; labels “Official”.  
- Hooks / components: any reference to “public” library → “official”.

**Phase 2 (user library columnar)**  
- Schema: user_powers, user_techniques, user_items, user_creatures in `public` with explicit columns + one JSONB.  
- API: user library GET/POST/PATCH to use new columns; map payload to columns.  
- Seed/copy: “Add from official” = read row from official_*, insert into user_* with user_id.

**Phase 3 (campaign members)**  
- Schema: campaign_members table in `public`; campaigns.memberIds kept in sync or deprecated.  
- API and RLS: use campaign_members for membership checks.

This doc should be updated as phases are completed and any schema decisions change.
