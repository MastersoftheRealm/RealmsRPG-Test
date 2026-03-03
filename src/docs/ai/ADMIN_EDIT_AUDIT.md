# Admin Edit Modals/Pages — Database Alignment Audit

**Purpose:** Ensure all admin edit modals and pages match their database tables and allow every intended column to be adjusted. Single source of truth for schema: `SUPABASE_SCHEMA.md` and `CODEX_SCHEMA_REFERENCE.md`.

**Audit date:** 2026-03-02

---

## 1. Summary

| Area | Table(s) | Edit surface | Match status | Notes |
|------|----------|--------------|--------------|--------|
| Codex Feats | codex_feats | Modal (list view), Spreadsheet | ✅ Aligned | All columns editable in modal |
| Codex Skills | codex_skills | Modal, Spreadsheet | ✅ Aligned | base_skill_id ↔ base_skill mapped in actions |
| Codex Species | codex_species | Modal, Spreadsheet | ✅ Aligned | ave_height/ave_weight → ave_hgt_cm/ave_wgt_kg in actions |
| Codex Traits | codex_traits | Modal, Spreadsheet | ✅ Aligned | All columns present |
| Codex Parts | codex_parts | Modal, Spreadsheet | ✅ Aligned | All columns including defense |
| Codex Properties | codex_properties | Modal, Spreadsheet | ✅ Aligned | op_1_* only (no op_2/op_3 in schema) |
| Codex Equipment | codex_equipment | Modal, Spreadsheet | ✅ Aligned | No `type` column in DB; form sends type (dropped) |
| Codex Archetypes | codex_archetypes | Modal, Spreadsheet | ✅ Aligned | name, type, description |
| Codex Creature Feats | codex_creature_feats | Modal, Spreadsheet | ✅ Aligned | feat_points; form also sends points (feat_points used) |
| Official Library | official_* | Creators (Power/Technique/Item/Creature) | ✅ Aligned | Edit via creators; POST/DELETE to API |
| Core Rules | core_rules | Category editor (tabs) | ✅ Aligned | JSONB data per category |
| Admin Users | user_profiles | Role dropdown only | ✅ By design | Only role (new_player, playtester, developer); admin via env |

---

## 2. Codex List/Modal Editors

Server actions in `src/app/(main)/admin/codex/actions.ts`:

- **COLUMNAR_FIELDS** defines which camelCase keys are accepted; **toColumnarPayload** keeps only those (after converting incoming keys from snake_case to camelCase).
- **toDbPayload** converts camelCase back to snake_case for Supabase and handles aliases (e.g. `baseSkillId` → `base_skill`, `aveHeight` → `ave_hgt_cm`).

Forms send snake_case keys; the server normalizes and writes DB columns. All codex modals were checked to ensure:

1. Every DB column for that table has a corresponding form field or is optional/derived.
2. Form submit builds an object whose keys (after snake→camel) are in COLUMNAR_FIELDS.
3. No required column is missing from the form.

### 2.1 Feats (AdminFeatsTab)

- **DB columns:** id, name, description, req_desc, ability_req, abil_req_val, skill_req, skill_req_val, feat_cat_req, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period, category, ability, tags, char_feat, state_feat
- **Modal:** All of the above are present in the form (name, description, req_desc, category, feat_cat_req, lvl_req, feat_lvl, ability, ability_req/abil_req_val, skill_req/skill_req_val, uses_per_rec, rec_period, pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, tags, char_feat, state_feat).
- **Status:** ✅ Complete.

### 2.2 Skills (AdminSkillsTab)

- **DB columns:** id, name, description, ability, base_skill, success_desc, failure_desc, ds_calc, craft_failure_desc, craft_success_desc
- **Modal:** name, description, ability (array), base_skill_id (resolved to base_skill in save), success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc.
- **Mapping:** Form uses `base_skill_id`; actions map `baseSkillId` → `base_skill` (TEXT). Codex API returns `base_skill_id` for client.
- **Status:** ✅ Complete.

### 2.3 Species (AdminSpeciesTab)

- **DB columns:** id, name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages
- **Modal:** name, description, type, sizes (multi), skills, species_traits, ancestry_traits, flaws, characteristics, ave_height/ave_weight (→ ave_hgt_cm/ave_wgt_kg), adulthood_lifespan (adult/max age), languages. Form also sends `size` (singular); it is not in COLUMNAR_FIELDS and is dropped (DB has only `sizes`).
- **Status:** ✅ Complete.

### 2.4 Traits (AdminTraitsTab)

- **DB columns:** id, name, description, uses_per_rec, rec_period, flaw, characteristic, option_trait_ids
- **Modal:** All present.
- **Status:** ✅ Complete.

### 2.5 Parts (AdminPartsTab)

- **DB columns:** id, name, description, category, base_en, base_tp, op_1/2/3_desc, op_1/2/3_en, op_1/2/3_tp, type, mechanic, percentage, duration, defense
- **Modal:** All present, including defense (array).
- **Status:** ✅ Complete.

### 2.6 Properties (AdminPropertiesTab)

- **DB columns:** id, name, description, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, type, mechanic
- **Modal:** All present. Schema has only option 1 (no op_2/op_3).
- **Status:** ✅ Complete.

### 2.7 Equipment (AdminEquipmentTab)

- **DB columns:** id, name, description, category, currency, rarity
- **Modal:** name, description, category, currency, rarity. Form also sends `type: 'equipment'`; there is no `type` column in codex_equipment, so it is dropped by the allowlist.
- **Status:** ✅ Complete.

### 2.8 Archetypes (AdminArchetypesTab)

- **DB columns:** id, name, type, description
- **Modal:** name, type, description.
- **Status:** ✅ Complete.

### 2.9 Creature Feats (AdminCreatureFeatsTab)

- **DB columns:** id, name, description, feat_points, feat_lvl, lvl_req, mechanic
- **Modal:** name, description, points (saved as feat_points), feat_lvl, lvl_req, mechanic. Form sends both `points` and `feat_points`; only `feat_points` is in COLUMNAR_FIELDS (as featPoints), so it is the one persisted.
- **Status:** ✅ Complete.

---

## 3. Codex Spreadsheet View

- **Source:** `CodexSpreadsheetView.tsx`. Columns are derived from the first row (API response). Save sends each dirty row (minus `id`) to `updateCodexDoc` / `createCodexDoc`.
- **API:** Returns snake_case keys for codex tables (from Supabase `select('*')`), with some aliases (e.g. skills get `base_skill_id`). So spreadsheet rows use the same keys the modal expects; toColumnarPayload + toDbPayload handle conversion.
- **Status:** ✅ Aligned with list/modal and DB.

---

## 4. Official Library (Admin Public Library)

- **Tables:** official_powers, official_techniques, official_items, official_creatures (columnar; see sql/supabase-official-library-public-schema.sql).
- **Edit flow:** Edit opens the corresponding creator (Power/Technique/Item/Creature) with the item loaded; save overwrites via POST with same id or PATCH. No separate modal; all fields are those of the creator and match the official_* columnar schema.
- **Status:** ✅ Aligned.

---

## 5. Core Rules

- **Table:** core_rules (id, data JSONB, updated_at).
- **Edit surface:** `admin/core-rules/page.tsx` — category-based editor; each tab edits one category’s `data` object. Save calls updateCodexDoc('core_rules', categoryId, editData).
- **Status:** ✅ Aligned (JSONB per category).

---

## 6. Admin Users

- **Table:** user_profiles (id, email, display_name, username, photo_url, last_username_change, created_at, updated_at, role).
- **Edit surface:** `admin/users/page.tsx` — list of users; only **role** can be changed (dropdown: new_player, playtester, developer). Admin role is intentionally not settable via UI (set via ADMIN_UIDS env). PATCH `/api/admin/users/update-role` updates only `role`.
- **Status:** ✅ By design; only role is editable; other columns are not exposed in this admin page.

---

## 7. Recommendations

1. **Optional cleanup:** In AdminCreatureFeatsTab, the form could send only `feat_points` (and not `points`) to avoid redundancy; behavior is already correct.
2. **Optional cleanup:** In AdminSpeciesTab, the payload could omit the redundant `size` field (only `sizes` is stored).
3. **Optional:** In AdminEquipmentTab, remove the hardcoded `type: 'equipment'` from the save payload to avoid confusion (it is not in the schema and is dropped).
4. **Consistency:** When adding new columns to any codex table, add the key to COLUMNAR_FIELDS in `actions.ts` and add a form field in the corresponding admin tab (and ensure the codex API returns the new column if using spreadsheet view).

---

## 8. References

- Schema: `src/docs/SUPABASE_SCHEMA.md`
- Codex fields: `src/docs/CODEX_SCHEMA_REFERENCE.md`
- Codex actions: `src/app/(main)/admin/codex/actions.ts`
- Codex API: `src/app/api/codex/route.ts`
