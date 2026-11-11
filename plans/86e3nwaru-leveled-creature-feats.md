# 86e3nwaru — Leveled creature feat families (Stage 1 plan, revised)

**Status:** Plan only (Stage 1). No implementation in this PR.  
**Task:** [Leveled creature feat families (shared with character feats)](https://app.clickup.com/t/86e3nwaru)  
**Branch:** `cursor/86e3nwaru-leveled-creature-feats`  
**Prior plan head reviewed:** `09d6cfcd` — independent plan-pass graded **UNSOUND** (grok-4.7-high). This revision answers every blocker and should-fix with verified file:line references.

**Product (Kadin, Nov 11, 2026):** Option **A** (`base_feat_id`). Thrall **1–3**; Regional Revival II → level **2** (base **164**); Spectral Movement **1** / Spectral Movement II → **2** (3:22 PM ET); Charge/Charger **separate**; bases 121, 109, 116 → `feat_lvl = 1`; Tunneller **1** feat point.

**Re-review (head `612e4cac`):** SOUND WITH ISSUES — data model/SQL accepted; this revision closes merge-rule and SQL checklist gaps before Stage 2.

---

## 1. Plain-English brief for Kadin

### What exists today

Official creature feats (Speedy, Speedy II, …) are separate rows with a level number but no link to the first row in the family. Character feats use `base_feat_id` plus one shared library/creator pattern.

The site also keeps a **hard-coded name list** (`creature-trait-tiers.ts`) so movement/sense **chip labels** (for example `Fly Half`, not codex name “Flying”) do not stack. That list is separate from the creature **feat picker** list.

### What we are not doing

- **Not** writing `base_feat_id` into saved creature JSON (`transformers.ts:130-136` — payload stays `{ id, name, points, description, featSourceType }`).
- **Not** touching PR #529 (`characters.data`, relational character tables/RPCs) or ClickUp `1dfe8wf3mzj` (creature-row payload migration).
- **Not** inventing level numbers from Roman numerals in code (`ARCHITECTURE_CONSTITUTION.md` item 1). Grouping and replace-on-add use **`feat_lvl` only** (`leveled-feats.ts:23-26`). `parseFeatNameRomanSuffix` is for display (`leveled-feats.ts:72-98`), not grouping.

### The id collision (critical)

Every creature feat **text id** also exists on a **different** character feat row (**161 / 161** overlap on live DB, verified read-only 2026-11-11). Examples:

| id | Creature row | Character row |
|----|--------------|---------------|
| 36 | Speedy | (different name) |
| 37 | Speedy II | (different name) |
| 41 | Slow III | (different name) |

Saved creatures reference feats by **id** in JSON only. The same numeric id can mean a library character/archetype feat or a creature feat depending on `featSourceType` (`transformers.ts:104-127`). **Do not** merge character and creature definitions into one `Map` for family replace — that would drop the wrong row.

### Recommendation

**Option A** remains correct: add `base_feat_id`, backfill links, map it in `mapCodexCreatureFeat`, reuse **`leveled-feats.ts`** for grouping/chips/next-level math, keep creature-specific columns in existing `GridListRow` UIs. Replace-on-add uses **one shared reducer** with **per-row catalog** (creature vs character/archetype), two definition maps, never unioned — not a third copy of the sheet reducer.

### Rollback (honest)

1. **Code:** Revert merge commit.
2. **Database:** Prefer **named Supabase backup** taken immediately before apply.  
   - `ALTER TABLE … DROP COLUMN base_feat_id` only removes links.  
   - It does **not** undo **`feat_lvl` / `feat_points` corrections** from §3.2 — those require the backup (or manual reverse updates).
3. **Backfill script:** **One-shot** — do not re-run on production after admins edit families; document in SQL file header.

---

## 2. Survey — root cause (verified)

| Fact | Evidence |
|------|----------|
| Creature rows lack `base_feat_id` column | `sql/schema/0000_baseline_2026-08-13.sql` `codex_creature_feats`; live DB has no column (SELECT 2026-11-11) |
| Mapper drops link even if DB had it | `mapCodexCreatureFeat` (`row-map.ts:253-266`) — no `base_feat_id` field; character feat maps at `:124-125` |
| Grouping uses `feat_lvl` + `base_feat_id` only | `getFeatLevel` (`leveled-feats.ts:23-26`); `groupFeatFamilies` (`:101-120`) — **no** Roman parse |
| Equal `feat_lvl` ⇒ both rows kept on replace | `mergeCreatureFeatsOnAdd` (`creature-feat-utils.ts:75-84`) uses `>=` — equal level does not remove lower |
| Library tab groups; creature tab flat | `AddCreatureFeatModal.tsx:205-236` vs `:251` |
| Level chips only for character/archetype on sheet | `creature-creator-feat-armament-display.ts:80-82`, `:117-118` |
| Creature picker level gate = creature `lvl_req` only | `AddCreatureFeatModal.tsx:212-214` — not `checkFeatRequirements` |
| Character “Add level” sets `lvl_req = newLevel * 2` | `admin-feat-form.ts:100-112` — **must not** copy to creature feats (Thrall family all use creature `lvl_req` 3) |
| Id collision warning exists | `transformers.ts:115-117` |
| Sheet has **two** duplicate merge reducers | `use-sheet-feat-actions.ts:122-141`, `:155-174` |
| Census (live) | **161** rows; **26** family bases; **49** children to link; **86** singletons |

### Rows that must not be one family

- **99** Charge / **86** Charger — Kadin: separate.
- **39** Slow / **22** Slow Walker — different base names (live ids); **no** `base_feat_id` link.

### Replace-on-add readiness vs links-only

| Family link in §3.3 | Replace lower on add (after code) | Blocker |
|-------------------|-------------------------------------|---------|
| Most families | Yes, when distinct `feat_lvl` on each row | — |
| Create Thrall | Yes, after §3.2 sets 151 → level 3 | Kadin approved |
| Regional Revival | Yes, after §3.2 sets 23 → level 2 | Kadin approved |
| Spectral Movement | Yes, after §3.2 sets 116 → 1, **137 → 2** | Kadin approved (Nov 11, 3:22 PM ET) |

---

## 3. Proposed SQL (not executed in Stage 1)

**Live census:** 161 total; 49 child updates; 26 bases with `base_feat_id IS NULL`; 86 singletons.  
**One-shot:** Header on `sql/codex-creature-feats-base-feat-id.sql` must state “run once per environment; re-run overwrites admin edits.”

### 3.1 DDL (executed inside §3.3 `BEGIN`)

Add nullable `base_feat_id text` + column comment (mirrors `codex_feats`). RLS unchanged (`sql/schema/0000_baseline_2026-08-13.sql:8184-8187`, `:8725-8728`). `touch_updated_at` bumps `updated_at`.

### 3.2 Kadin-approved data corrections (first updates inside §3.3)

| id | name | change |
|----|------|--------|
| 151 | Create Thrall III | `feat_lvl = 3` |
| 23 | Regional Revival II | `feat_lvl = 2` |
| 121 | Ambusher | `feat_lvl = 1` |
| 109 | Shapeshifter | `feat_lvl = 1` |
| 116 | Spectral Movement | `feat_lvl = 1` |
| 137 | Spectral Movement II | `feat_lvl = 2` (was NULL; Kadin Nov 11, 3:22 PM ET) |
| 120 | Tunneller | `feat_points = 1` |

### 3.3 Apply transaction (`§3.1` + `§3.2` + 26 base clears + 49 child links)

**Rules:**

- One `BEGIN` … `COMMIT`. No apply outside this block.
- After **each** `UPDATE`, `GET DIAGNOSTICS … ROW_COUNT` and `RAISE EXCEPTION` unless the expected count matches (pattern below). Single-row fixes expect **1**; multi-id `IN (...)` expect that count.
- **One-shot** (header comment on SQL file).

```sql
BEGIN;

-- §3.1 DDL
ALTER TABLE public.codex_creature_feats
  ADD COLUMN IF NOT EXISTS base_feat_id text;
COMMENT ON COLUMN public.codex_creature_feats.base_feat_id IS
  'Level-1 creature feat id in this family. NULL on level-1 rows. Mirrors codex_feats.base_feat_id.';

-- Helper pattern (repeat after every UPDATE in this file):
--   GET DIAGNOSTICS v_n = ROW_COUNT;
--   IF v_n <> <expected> THEN RAISE EXCEPTION '…', v_n; END IF;

-- §3.2 (each expects ROW_COUNT = 1)
UPDATE public.codex_creature_feats SET feat_lvl = 3 WHERE id = '151' AND name = 'Create Thrall III';
UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '23'  AND name = 'Regional Revival II';
UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '137' AND name = 'Spectral Movement II';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '121' AND name = 'Ambusher';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '109' AND name = 'Shapeshifter';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '116' AND name = 'Spectral Movement';
UPDATE public.codex_creature_feats SET feat_points = 1 WHERE id = '120' AND name = 'Tunneller';

-- Level-1 bases: base_feat_id NULL (26 updates, each ROW_COUNT = 1)
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '121' AND name = 'Ambusher';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '13'  AND name = 'Blindsense';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '87'  AND name = 'Blood Rage';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '8'   AND name = 'Burrow';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '69'  AND name = 'Champion';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '92'  AND name = 'Constrictor';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '149' AND name = 'Create Thrall';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '10'  AND name = 'Darkvision';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '154' AND name = 'Dimensional Effect';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '58'  AND name = 'Elemental Affinity';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '6'   AND name = 'Flying';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '61'  AND name = 'Instinct';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '19'  AND name = 'Jump';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '64'  AND name = 'Lycanthrope';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '77'  AND name = 'Power Resistant';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '54'  AND name = 'Regenerative';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '164' AND name = 'Regional Revival';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '42'  AND name = 'Resources';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '109' AND name = 'Shapeshifter';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '39'  AND name = 'Slow';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '116' AND name = 'Spectral Movement';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '36'  AND name = 'Speedy';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '25'  AND name = 'Sun Sickness';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '27'  AND name = 'Telepathy';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '82'  AND name = 'Teleport';
UPDATE public.codex_creature_feats SET base_feat_id = NULL WHERE id = '96'  AND name = 'Tight Grapple';

-- Children (49 updates, each ROW_COUNT = 1)
UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '122' AND name = 'Ambusher II';
UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id = '123' AND name = 'Ambusher III';
UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '14'  AND name = 'Blindsense II';
UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '15'  AND name = 'Blindsense III';
UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id = '16'  AND name = 'Blindsense IV';
UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '88'  AND name = 'Blood Rage II';
UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '89'  AND name = 'Blood Rage III';
UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id = '90'  AND name = 'Blood Rage IV';
UPDATE public.codex_creature_feats SET base_feat_id = '8'   WHERE id = '9'   AND name = 'Burrow II';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '70'  AND name = 'Champion II';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '71'  AND name = 'Champion III';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '72'  AND name = 'Champion IV';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '73'  AND name = 'Champion V';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id = '74'  AND name = 'Champion VI';
UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '93'  AND name = 'Constrictor II';
UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '94'  AND name = 'Constrictor III';
UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id = '95'  AND name = 'Constrictor IV';
UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '150' AND name = 'Create Thrall II';
UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id = '151' AND name = 'Create Thrall III';
UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '11'  AND name = 'Darkvision II';
UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id = '12'  AND name = 'Darkvision III';
UPDATE public.codex_creature_feats SET base_feat_id = '154' WHERE id = '155' AND name = 'Dimensional Effect II';
UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '59'  AND name = 'Elemental Affinity II';
UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id = '60'  AND name = 'Elemental Affinity III';
UPDATE public.codex_creature_feats SET base_feat_id = '6'   WHERE id = '7'   AND name = 'Flying II';
UPDATE public.codex_creature_feats SET base_feat_id = '61'  WHERE id = '62'  AND name = 'Instinct II';
UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '20'  AND name = 'Jump II';
UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id = '21'  AND name = 'Jump III';
UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '65'  AND name = 'Lycanthrope II';
UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id = '66'  AND name = 'Lycanthrope III';
UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '78'  AND name = 'Power Resistant II';
UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id = '79'  AND name = 'Power Resistant III';
UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '55'  AND name = 'Regenerative II';
UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '56'  AND name = 'Regenerative III';
UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id = '57'  AND name = 'Regenerative IV';
UPDATE public.codex_creature_feats SET base_feat_id = '164' WHERE id = '23'  AND name = 'Regional Revival II';
UPDATE public.codex_creature_feats SET base_feat_id = '42'  WHERE id = '43'  AND name = 'Resources II';
UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '110' AND name = 'Shapeshifter II';
UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id = '111' AND name = 'Shapeshifter III';
UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '40'  AND name = 'Slow II';
UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id = '41'  AND name = 'Slow III';
UPDATE public.codex_creature_feats SET base_feat_id = '116' WHERE id = '137' AND name = 'Spectral Movement II';
UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '37'  AND name = 'Speedy II';
UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id = '38'  AND name = 'Speedy III';
UPDATE public.codex_creature_feats SET base_feat_id = '25'  WHERE id = '26'  AND name = 'Sun Sickness II';
UPDATE public.codex_creature_feats SET base_feat_id = '27'  WHERE id = '28'  AND name = 'Telepathy II';
UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '83'  AND name = 'Teleport II';
UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id = '84'  AND name = 'Teleport III';
UPDATE public.codex_creature_feats SET base_feat_id = '96'  WHERE id = '97'  AND name = 'Tight Grapple II';

COMMIT;
```

**Not linked:** Slow Walker (**22**), Charge (**99**), Charger (**86**), and all singletons.

### 3.4 Post-apply verification (read-only; run after `COMMIT`)

```sql
SELECT count(*) FILTER (WHERE base_feat_id IS NOT NULL) AS linked_children FROM codex_creature_feats;
-- expect 49

-- Duplicate level within a family (includes level-1 bases)
SELECT COALESCE(base_feat_id, id) AS family_id,
       COALESCE(feat_lvl, 1) AS lvl,
       count(*) AS n
FROM codex_creature_feats
WHERE COALESCE(base_feat_id, id) IN (
  SELECT DISTINCT COALESCE(base_feat_id, id) FROM codex_creature_feats WHERE base_feat_id IS NOT NULL
     UNION SELECT id FROM codex_creature_feats WHERE id IN (
       '121','13','87','8','69','92','149','10','154','58','6','61','19','64','77','54',
       '164','42','109','39','116','36','25','27','82','96'))
GROUP BY 1, 2
HAVING count(*) > 1;
-- expect zero rows
```

---

## 4. Stage 2 engineering plan

### 4.1 Shared logic (`leveled-feats.ts`)

- **`computeNextLeveledFeatFields`**: next `feat_lvl`, `base_feat_id` only (no creature `lvl_req`, no character `2×level` rule).
- **`mergeFeatsInFamilyOnAdd`** (single reducer; lives beside other helpers in this file):

  **Mixed batch:** `AddCreatureFeatModal.tsx:348-378` can confirm creature, library, and species rows in one call; `page.tsx:427-431` passes the full `added[]` once. Catalog is decided **per added row**, not once per call.

  | Added row `featSourceType` | Definition map | May remove existing rows with |
  |---------------------------|----------------|------------------------------|
  | `creature` | `codexCreatureFeatsById` | `featSourceType === 'creature'` only, same creature-family, strictly lower `getFeatLevel` |
  | `character` or `archetype` | `codexFeatsById` (character feats) | `character` **or** `archetype`, same character-family, strictly lower level |
  | `trait` / `flaw` / `characteristic` | — | **None** (species feats are never leveled family members) |

  **Never** union the two maps into one lookup.

  **`featSourceType` missing on an existing row** (legacy saves): assign a catalog only when the saved **`name`** matches that catalog’s row name for the same `id` and does **not** match the other catalog’s name. If both match, neither, or ambiguous → **do not remove** that existing row.

  Examples (verified requirement):

  - Id **41** saved as **Astute Tracking** (character) must **not** be removed when adding creature **Slow III** (41).
  - Id **83** saved as **Fungal Empowerment** must **not** be removed when adding creature **Teleport II** (83).
  - User creature `b87f86d4-9806-4ea9-bacb-9d81d25fca3f`: **Regenerative** (54), **Constrictor II** (93), **Tight Grapple II** (97) with null `featSourceType` — names match **creature** codex names; treat as creature catalog for merge only when adding another creature feat in those families.

  Replace uses **`>`** on `getFeatLevel` (strictly lower removed), after §3.2 distinct levels.

- **`getFeatFamilyId` only** — do not copy `featPathFamilyId` (`feat-list.ts:189-191`).

Refactor **`computeNextLevelFormState`** (`admin-feat-form.ts:100-118`) to call shared helper, then apply character `lvl_req = newLevel * 2`. Creature admin keeps creature `lvl_req` entry only.

### 4.2 Consolidate merge reducers

| Caller | Action |
|--------|--------|
| `creature-feat-utils.ts` | Thin wrapper: pass **both** maps into `mergeFeatsInFamilyOnAdd` (per-row catalog inside reducer). |
| `page.tsx:427-431` | Pass `codexFeatsById` **and** `codexCreatureFeatsById` (today only character map — bug for creature-tab adds). |
| `use-sheet-feat-actions.ts:122-141`, `:155-174` | **Follow-up:** same reducer; sheet rows are character/archetype only. |

### 4.3 Types / API / admin columnar

- `mapCodexCreatureFeat` — map `base_feat_id` like `mapCodexFeat` (`row-map.ts:124-125`).
- `CodexCreatureFeat` type + `database.types.ts` + `SUPABASE_SCHEMA.md`.
- `codex-columnar-keys.ts` — add **`baseFeatId`** to `codex_creature_feats` (mirror `codex_feats` at `:36`; creature list at `:158-166` today omits it). Admin saves must include key or column never writes.
- `references.ts` — child probe on `codex_creature_feats.base_feat_id` (mirror character feats pattern `:28-34`).

### 4.4 UI (no `CodexFeatRow` fork for creature lists)

Character `CodexFeatRow` (`codex-feat-row.tsx:13-38`) uses character columns from `feat-list.ts` — wrong for creature points / creature level req.

- **`AdminCreatureFeatsTab.tsx`** / **`CodexCreatureFeatsTab.tsx`**: `groupFeatFamilies` on mapped creature feats; keep existing `GridListRow` columns (`:26-32` public, `:143-171` admin); expand rows with **`buildFeatLevelChips`** from `leveled-feats.ts` (same chip pattern as character codex, not `checkFeatRequirements`).
- **`admin-creature-feat-edit-modal.tsx`**: “Add level” uses shared next-level helper; points/mechanic/`lvl_req` stay creature-specific; **no** new `admin-creature-feat-form.ts` file (Collin Q1 answered by constitution item 2).
- **`AddCreatureFeatModal.tsx`**: creature tab — `groupFeatFamilies`; one selectable row per family = **highest `feat_lvl` whose creature `lvl_req` is met** (`lvl_req` null OR `creature.level >= lvl_req`). **Do not** use `getMaxQualifiedFeatLevel` / `checkFeatRequirements`. Merge on confirm via `mergeFeatsInFamilyOnAdd` with both maps (`:348-378`).
- **`creature-creator-feat-armament-display.ts`**: level chips for `featSourceType === 'creature'` using creature catalog map only; **no** `checkFeatRequirements` (`feat-requirements.ts:303-315` is for character feats).

### 4.5 Movement / sense chips (replace `creature-trait-tiers.ts`)

**Delete** `creature-trait-tiers.ts` after replacement.

New helper (location TBD, likely `creature-creator/`): chip string → feat id via **`MOVEMENT_TO_FEAT_ID` / `SENSE_TO_FEAT_ID`** (`creature-creator-constants.ts:153-180`), resolve family via **`getFeatFamilyId`** on creature feat defs, remove other tiers in same family, **write back the same chip string** (`Fly Half` stays `Fly Half`; codex names remain Flying / Flying II).

**Consumers to keep working (add to file list):**

- `use-creature-creator-workspace.ts:420-432`
- `creature-creator-derived-stats.ts:117-133` (feat point costs from id maps)
- `creature-trait-labels.ts` (display labels for chips)
- `calculations.ts:93-108` — speed numbers unchanged in this task (B2 owns effect values)

### 4.6 Docs

- `FEATURE_INDEX.md:177` — one clause: leveled families / `buildFeatLevelChips` also apply to **`codex_creature_feats`** once mapped.

### Explicitly out of scope

PR #529, `1dfe8wf3mzj`, B2 speed **values**, new feat copy, payload JSON shape changes, **Roman suffix removal from codex names** (see §10).

---

## 5. Test plan — must fail on master

| # | File | Assertion | Master (verified) |
|---|------|-----------|-------------------|
| 1 | `src/lib/codex/row-map.test.ts` | DB-shaped Slow / Slow II / Slow III rows through **`mapCodexCreatureFeat`**, then `groupFeatFamilies` → **1** family | **FAIL** (3 families) |
| 2 | `src/lib/leveled-feats.test.ts` (next to `mergeFeatsInFamilyOnAdd`) | Existing **archetype** `{ id: '37', name: 'Astral Projection' }`; add **creature** `{ id: '38', name: 'Speedy III' }`; pass **only** creature defs map (`36–38` with `base_feat_id`); expect **2** rows | **FAIL** on today’s `mergeCreatureFeatsOnAdd` — drops 37, length **1** (`npx vitest run src/lib/leveled-feats.test.ts -t "archetype id 37"`, 2026-11-11) |

Stage 2: add test **2** beside the new reducer in `leveled-feats.test.ts`; implement `mergeFeatsInFamilyOnAdd` until both pass. No `creature-feat-utils.test.ts` (file does not exist).

**Do not** use `creature-trait-tiers.test.ts` or same-id 41/41 as the merge regression (41/41 does not fail today’s function the same way).

After implementation: `npx vitest run src/lib/codex/row-map.test.ts src/lib/leveled-feats.test.ts` + movement-helper tests.

---

## 6. Done when (split)

### A. Links and data (schema + one-shot SQL)

- [ ] Named backup; **§3.1–§3.3** single transaction applied (ROW_COUNT guard after each UPDATE).
- [ ] **§3.4** verification: **49** linked children; no duplicate `(COALESCE(base_feat_id, id), COALESCE(feat_lvl, 1))`.
- [ ] Kadin-approved §3.2 rows corrected (includes **137** → level 2).
- [ ] `baseFeatId` on admin allowlist; types/docs updated.

### B. Replace-on-add and UI (code)

- [ ] `mapCodexCreatureFeat` exposes `base_feat_id`; lists nest via `groupFeatFamilies`.
- [ ] Shared merge reducer; **separate** creature vs character maps; payload unchanged.
- [ ] Creature-tab / movement chip replace works for families with **confirmed distinct `feat_lvl`** (§2 table).
- [ ] Spectral Movement replace-on-add after §3.2 (116 = 1, 137 = 2).
- [ ] Tests in §5 green; `creature-trait-tiers.ts` removed.

### C. Follow-up (may be same PR or small sibling task)

- [ ] Deduplicate sheet merge blocks (`use-sheet-feat-actions.ts`).

---

## 7. Kadin product decisions

**Settled (Nov 11):** Thrall 1–3; Regional II = level 2; Charge/Charger separate; bases 121, 109, 116 → level 1; Tunneller 1 point; **Spectral Movement** = level 1, **Spectral Movement II (137)** = level 2 (Kadin, 3:22 PM ET — same family pattern as character feats; Roman “II” in the **name** is a placeholder for now).

---

## 8. Collin (how)

1. ~~Separate `admin-creature-feat-form.ts`~~ — **No**; shared next-level in `leveled-feats.ts`.
2. `references.ts` delete guard for creature feat children — mirror feats table self-reference.
3. Movement helper: feat id from existing string maps + creature codex load for `getFeatFamilyId` (no new chip strings).

---

## 9. Risk

High: `sql/`, official `codex_creature_feats`, admin codex, creature creator. Kadin merges data change; Collin post-review on implementation.

**Verdict target after Stage 2:** REAL FIX for link column + catalog-scoped merge (all 26 families including Spectral Movement, with §3.2 levels distinct).

---

## 10. Follow-up task (not 86e3nwaru / not this PR): drop Roman suffixes from names

**Product intent (Kadin, Nov 11, 3:22 PM ET):** After families are linked and replace-on-add works, every level in a family should share the **same base name** in the codex (like character feats). Today’s `… II`, `… III` etc. on creature feat **row names** are **placeholders** only. Removing them is a **separate** data + engineering task after this PR.

**Why not in 86e3nwaru:** This PR adds `base_feat_id`, fixes `feat_lvl`, and keys behavior off **ids + `feat_lvl`**, not display names. Renaming rows touches saved creature JSON **name** strings, chip keys, and drive/rulebook copy — needs its own backup, Editor pass, and QA.

### Dependencies on Roman suffixes or per-level names today (audit for safe removal later)

| Area | File / symbol | What keys off suffix or level-specific name |
|------|----------------|---------------------------------------------|
| Display | `leveled-feats.ts` — `formatFeatName`, `parseFeatNameRomanSuffix`, `levelToRomanNumeral` | UI shows `Speedy II` when `name` is `Speedy` and `feat_lvl` is 2; after rename, display stays via `feat_lvl` alone |
| Creature picker / save | `creature-feat-utils.ts:53`, `AddCreatureFeatModal.tsx:100`, `:358` | `formatFeatName` when adding or listing feats |
| Character sheet / codex (character feats) | `feats-tab.tsx`, `add-feat-modal.tsx`, `codex-feat-row.tsx`, `AdminFeatsTab.tsx`, `admin-archetype-path-rows.tsx` | Same display helper (creature rename should not break these) |
| Movement chip **values** (stored on creature) | `creature-creator-constants.ts` — `MOVEMENT_TYPES[]` | `value` strings: `Speedy`, `Speedy II`, `Speedy III`, `Burrow II`, `Jump II`, …; labels/descriptions duplicate roman levels |
| Sense chip **values** | `SENSES` in same file | `Darkvision II`, `Blindsense II`, `Telepathy II`, … |
| Chip → feat id maps | `MOVEMENT_TO_FEAT_ID`, `SENSE_TO_FEAT_ID` (`creature-creator-constants.ts:153-180`) | Record keys include roman numerals; **Fly Half** / **Fly** are separate from codex “Flying” names |
| Feat point budget | `creature-creator-derived-stats.ts:117-133` | Looks up cost by map keys above |
| Chip labels / descriptions | `creature-trait-labels.ts` | `MOVEMENT_BY_VALUE` / `SENSE_BY_VALUE` keyed by chip `value` strings |
| Speed calculation (movement strings) | `calculations.ts:93-108` — keys `Speedy`, `Speedy II`, `Speedy III`, `Slow`, … | Creature `movementTypes` array uses chip values, not codex row names |
| Tests | `calculations.test.ts`, `creature-creator-derived-stats.test.ts`, `creature-trait-tiers.test.ts` | Assert on `Speedy II` style strings |
| Mechanical ids | `lib/id-constants.ts` — `CREATURE_FEAT_IDS` (`SPEEDY_II`, …) | Constant **names** only; values are numeric ids — stable across rename |
| Name-based tier hack (removed in Stage 2) | `creature-trait-tiers.ts` | Hard-coded roman name families — deleted here, not a long-term dependency |
| Official data | `codex_creature_feats.name` column (all 26 families) | Row names still `Foo II` until follow-up `UPDATE` + Editor/changelog |
| Saved library JSON | `user_creatures` / `official_creatures` payload `feats[].name`, `movementTypes[]`, `senses[]` | May embed old strings; follow-up needs read compat or one-time normalize |

**Follow-up done-when (sketch):** All levels in a linked family share one `name` in DB; UI still shows rank via `formatFeatName` + `feat_lvl`; movement/sense storage keys move to **feat id** or a single chip id + level (design TBD); regression on speed points and feat budget; Editor updates external copy.
