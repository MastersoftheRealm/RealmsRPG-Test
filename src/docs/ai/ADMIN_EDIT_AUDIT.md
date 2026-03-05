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

**Source:** `CodexSpreadsheetView.tsx`. Single spreadsheet for all codex tabs (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats). Columns are derived from the API response (first row keys); save sends each dirty row (minus `id`) to `updateCodexDoc` / `createCodexDoc`. There is no other spreadsheet-style edit view in admin (core-rules and users use different UIs).

### 3.1 DB compliance

| Aspect | Status | Notes |
|--------|--------|--------|
| Column names | ✅ | Rows use API shape (snake_case, e.g. `base_skill_id`, `ave_height`). `toColumnarPayload` + `toDbPayload` map to DB columns (`base_skill`, `ave_hgt_cm`, etc.) on save. |
| Value types | ✅ | Arrays serialized via `toColumnValue` to comma-separated; null/undefined → null in payload. Optional numerics now preserved (API no longer forces 0). |
| Allowed keys | ✅ | Only keys in `COLUMNAR_FIELDS` are sent; extra API-only keys (e.g. `base_stam`, `tp_cost`) are dropped. |
| New row | ⚠️ | "Add row" creates `{ id: __new_${Date.now()} }`. User must fill cells; on save, only keys present in the row are sent. If `name` is never set, create may send name: null — DB may reject if NOT NULL. |

**Conclusion:** Spreadsheet is DB-compliant for existing rows and for new rows once required fields (e.g. name) are filled. Consider validating required fields before save (e.g. block Save or prompt when a new row has no name).

### 3.2 Clunky, unwieldy, or unintuitive

- **All cells are plain text:** Every column is a single-line text input. Array columns (e.g. `ability_req`, `tags`, `defense`) and comma-separated lists (`sizes`, `skills`, `species_traits`) show as JSON or comma-sep strings. Editing is freeform — easy to break JSON or introduce typos in IDs; no dropdowns or chips.
- **No column-type awareness:** Numbers and booleans are edited as text. User can type "abc" in a numeric cell; parse on blur may keep original or coerce. Booleans show "true"/"false"; no checkbox.
- **Find/Replace is global and substring:** Find replaces across **all columns** and matches **substrings** (e.g. "1" matches inside "10" or "21"). No option to limit to one column or whole-cell only; replace-all can cause unintended edits.
- **Save all with no per-row save or undo:** One "Save all changes" button persists every dirty row. No per-row save, no undo after save, no confirmation dialog. Accidental click or mis-edit can overwrite many rows.
- **Copy row behavior:** "Copy row" inserts a new row **below** the current one with a new ID but the same name (and all other fields). Two rows with the same name until the user edits; could be confusing. No indication that the new row is unsaved until Save.
- **New row is minimal:** "Add row" adds one row with only `id` set. User must type into every column they care about. No "clone from existing" except using Copy row (which duplicates the row in place).
- **Description and long text:** Description column has fixed width (220px). Long text is hard to read and edit in a small cell; no expandable textarea or modal for long fields.
- **Sticky columns:** Only row index (#) is sticky left; `id` and `name` scroll away when scrolling right, so context is lost on wide tables (feats, species, parts).
- **Column order:** Order is id, name, description, then a preferred list, then alphabetical. Some tabs have many columns; order may not match mental model (e.g. type/category buried).
- **Mobile:** No responsive treatment. Horizontal scroll on a wide table is unwieldy on small screens; toolbar and table compete for space. Does not follow MOBILE_UX.md (e.g. no full-screen-on-mobile or touch-target guidance for the sheet).
- **No loading state per cell:** While saving, the whole sheet shows saving state; no per-row or per-cell feedback.
- **Dirty indicator:** Dirty rows get a background tint (amber) but the "Copy" button column doesn’t indicate unsaved; new rows look like existing until you notice the id starts with `__new_`.

### 3.3 Recommended improvements

| Priority | Improvement | Rationale |
|----------|-------------|-----------|
| High | **Confirm before Save all** | Prevent accidental overwrite; show count of rows to be updated/created. |
| High | **Validate new rows before create** | Require `name` (and any other NOT NULL columns) for new rows; either block Save or show clear error and which row. |
| Medium | **Sticky id + name columns** | Keep id and name sticky left so context is visible when scrolling right (at least for tables with many columns). |
| Medium | **Find/Replace: optional whole-cell and column scope** | Allow "Match whole cell" and optionally "Limit to column" to reduce unintended replacements. |
| Medium | **Per-row save (optional)** | Add a small "Save" or checkmark per row so power users can save one row without committing others. |
| Low | **Column-type hints** | Use `number` input for known numeric columns (e.g. base_en, lvl_req); checkbox for booleans. Requires a small column → type map per tab. |
| Low | **Copy row: auto-append " copy" to name** | When copying a row, set name to `${name} copy` (and derive new id from it) so the duplicate is obvious and matches list-view duplicate behavior. |
| Low | **Description / long text:** | Either widen description column on demand or open a small modal/textarea for that cell. |
| Low | **Mobile:** | Consider hiding spreadsheet view on small viewports or switching to a card/list + modal pattern; or add horizontal scroll hints and ensure toolbar wraps. |

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

1. **Optional cleanup:** In AdminCreatureFeatsTab, the form could send only `feat_points` (and not `points`) to avoid redundancy; behavior is already correct. **Done 2026-03-03:** Payload already sends only `feat_points`; added comment in code to prevent adding redundant `points`.
2. **Optional cleanup:** In AdminSpeciesTab, the payload could omit the redundant `size` field (only `sizes` is stored). **Done 2026-03-03:** Payload already omits `size`; added comment in code to document intent.
3. **Optional:** In AdminEquipmentTab, remove the hardcoded `type: 'equipment'` from the save payload to avoid confusion (it is not in the schema and is dropped). **Done 2026-03-03:** Payload does not send type; added comment to document that type is not in schema.
4. **Consistency:** When adding new columns to any codex table, add the key to COLUMNAR_FIELDS in `actions.ts` and add a form field in the corresponding admin tab (and ensure the codex API returns the new column if using spreadsheet view).

---

## 8. Value and display alignment (DB as source of truth)

**Purpose:** Ensure edit modals, list views, and the spreadsheet do not interpret or display values differently from what is actually stored in Supabase (e.g. showing `0` instead of empty/null, or using column names that don’t exist in the DB). The database export format (e.g. JSON from Supabase) is the source of truth: `null`, numeric strings like `"1.5"`, and comma-separated TEXT columns.

### 8.1 API normalization that changes meaning

The Codex API (`src/app/api/codex/route.ts`) normalizes DB values before sending to the client. That can cause **save-back** to write a different value than was in the DB:

| Table | DB value | API returns | Risk |
|-------|----------|-------------|------|
| **codex_feats** | `lvl_req: null`, `uses_per_rec: null` | `lvl_req: 0`, `uses_per_rec: 0` (via `toNum(r.*) ?? 0`) | Opening edit and saving without changes **overwrites** `null` with `0` in the DB. List/modal correctly show "-" for 0/null. |
| **codex_parts** | `base_en: null`, `base_tp: null`, `op_*_en`/`op_*_tp: null` | `base_en: 0`, `base_tp: 0`, `op_*_en`/`op_*_tp: 0` (via `toNum(r.*) ?? 0`) | Same: save without editing can replace null with 0. List shows "-" for 0. |
| **codex_properties** | `base_ip`/`base_tp`/`base_c`/`op_*`: null | All normalized to `0` | Same overwrite-on-save if admin doesn’t touch those fields. |
| **codex_creature_feats** | `feat_points: null` | `points` / `feat_points: 0` (via `toNum(r.feat_points) ?? 0`) | Same: null can become 0 on save. List shows "-" for empty. |

**Recommendation:** In the API, avoid defaulting numeric fields to `0` when the DB has `null`. Return `undefined` or leave as `null` so list/modal can show "-" (or blank) and save preserves `null`. Alternatively, keep API as-is and in admin save payloads omit optional numeric fields when the value is `0` and the field is “empty” in the form (more complex and error-prone).

### 8.2 Display vs DB (list and modal)

- **Feats:** List shows "-" for `lvl_req` / `uses_per_rec` when `=== 0` or `== null`. Correct. Modal inputs use `form.lvl_req ?? ''` so empty is blank; save sends `undefined` when blank, which becomes `null` in DB. **But** because the API already turned null into 0, when you open a feat with null `lvl_req`, the form is prefilled with 0 and save writes 0.
- **Parts:** List shows "-" for EN/TP when 0 or null. Modal always sends numbers (e.g. `form.base_en`); no “clear to null” path, so 0 is always written.
- **Properties:** Same as parts: list shows "-" for 0; modal sends numbers; null can become 0 after open/save.
- **Traits:** `uses_per_rec` in API is `toNum(r.uses_per_rec)` with no `?? 0`, so null stays undefined. List and form handle null/undefined; no overwrite issue.
- **Creature feats:** List shows "-" for points/lvl_req when null or 0; modal sends `form.points ?? undefined` etc., but API already gave 0 for null, so open/save can still write 0.

### 8.3 Column names: UI/API vs DB

| Table | DB column(s) | API / UI | Notes |
|-------|----------------|----------|--------|
| **codex_skills** | `base_skill` (TEXT) | `base_skill_id` (number) in API and list/modal | Save path maps `baseSkillId` → `base_skill` in actions. Spreadsheet shows `base_skill_id` (from API); save correctly writes `base_skill`. |
| **codex_species** | `ave_hgt_cm`, `ave_wgt_kg` | `ave_height`, `ave_weight` in API | Save path maps to `ave_hgt_cm` / `ave_wgt_kg`. Spreadsheet shows API keys; toDbPayload maps on save. |
| **codex_species** | `adulthood_lifespan` (TEXT e.g. `"20, 120"`) | `adulthood_lifespan` (array `[20, 120]`) | API parses to array; save serializes back to comma-separated; aligned. |
| **codex_creature_feats** | `feat_points` | API returns `points` and `feat_points`; form uses `points`, save sends `feat_points` | Correct; no column missing. |

No UI-only or DB-only columns were found; naming differences are handled in the save pipeline.

### 8.4 Spreadsheet view

- **Source of rows:** `useCodexFull()` returns the **transformed** API response (snake_case, nulls normalized to 0 where above). So spreadsheet displays and edits the same normalized shape.
- **Empty cell:** `cellValueToString(null)` / `cellValueToString(undefined)` → `''`. So null/undefined show as blank. Correct.
- **Save:** Dirty rows are sent as-is (API-shaped). `toColumnarPayload` / `toDbPayload` convert to DB columns. So the same null→0 behavior applies: if a row has `lvl_req: 0` (from API) and the user doesn’t change it, save writes 0 to the DB even if the DB originally had null.
- **Preferred column order:** `PREFERRED_ORDER_AFTER_DESC` includes `base_skill_id` and `base_skill_id_alt`. DB has only `base_skill`; API does not return `base_skill_id_alt`. So `base_skill_id_alt` never appears as a column; no bug. `base_skill_id` is correct (mapped on save).

### 8.5 Numeric types (DB export as string)

In your Supabase JSON export, some numerics appear as strings (e.g. parts `base_en: "1.5"`, properties `base_ip: "1.5"`). That can be either:

- Supabase column type NUMERIC/DECIMAL returned as string in JSON, or  
- Column type TEXT storing numbers.

The app uses `toNum()` so string `"1.5"` becomes number `1.5`; on save we send numbers. Supabase typically accepts numbers for numeric columns; for TEXT columns it may coerce to string. No display bug; only a possible type coercion on write (acceptable if DB accepts it).

### 8.6 Summary of discrepancies (fixes implemented 2026-03-03)

| # | Issue | Where | Effect | Status |
|---|--------|--------|--------|--------|
| 1 | Feats `lvl_req` / `uses_per_rec` null → 0 in API | `route.ts` codexFeats | Save without edit wrote 0 instead of preserving null | **Fixed:** API returns `toNum(r.lvl_req)` / `toNum(r.uses_per_rec)` without `?? 0`. |
| 2 | Parts `base_en` / `base_tp` / op_* null → 0 in API | `route.ts` allParts | Same overwrite on save | **Fixed:** API returns optional cost fields without `?? 0`. AdminPartsTab form allows `undefined`, sends `?? undefined` on save, inputs use `value ?? ''` and set undefined when cleared. |
| 3 | Properties base_* / op_* null → 0 in API | `route.ts` codexProperties | Same overwrite on save | **Fixed:** API returns optional fields without `?? 0`. AdminPropertiesTab form allows `undefined`, sends `?? undefined` on save, inputs use `value ?? ''` and set undefined when cleared. |
| 4 | Creature feats `feat_points` null → 0 in API | `route.ts` codexCreatureFeats | Same overwrite on save | **Fixed:** API returns `toNum(r.feat_points)` without `?? 0`. AdminCreatureFeatsTab already sends `form.points ?? undefined`. |

No other display/interpretation mismatches (e.g. showing "0" instead of "-" for null, or missing/extra columns) were found.

---

## 10. References

- Schema: `src/docs/SUPABASE_SCHEMA.md`
- Codex fields: `src/docs/CODEX_SCHEMA_REFERENCE.md`
- Codex actions: `src/app/(main)/admin/codex/actions.ts`
- Codex API: `src/app/api/codex/route.ts`
