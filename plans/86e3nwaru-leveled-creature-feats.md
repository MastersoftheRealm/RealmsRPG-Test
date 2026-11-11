# 86e3nwaru — Leveled creature feat families (Stage 1 plan, revised)

**Status:** Plan only (Stage 1). No implementation in this PR.  
**Task:** [Leveled creature feat families (shared with character feats)](https://app.clickup.com/t/86e3nwaru)  
**Branch:** `cursor/86e3nwaru-leveled-creature-feats`  
**Prior plan head reviewed:** `09d6cfcd` — independent plan-pass graded **UNSOUND** (grok-4.7-high). This revision answers every blocker and should-fix with verified file:line references.

**Product (Kadin, Nov 11, 2026, 3:13 PM ET):** Option **A** (`base_feat_id` on `codex_creature_feats`). Create Thrall I–III → levels **1, 2, 3**. Regional Revival II → level **2** (base **164**). Charge and Charger **separate**. Ambusher, Shapeshifter, Spectral Movement **bases** → `feat_lvl = 1`. Tunneller → **1** feat point. **Open:** `feat_lvl` for **Spectral Movement II (137)** — not in the 3:13 list; Kadin is deciding.

**Stage 2 gate:** Plan-pass review of this revision, then implementation pass per fallback path.

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

**Option A** remains correct: add `base_feat_id`, backfill links, map it in `mapCodexCreatureFeat`, reuse **`leveled-feats.ts`** for grouping/chips/next-level math, keep creature-specific columns in existing `GridListRow` UIs. Replace-on-add uses **one shared reducer** scoped by catalog (`creature` vs `character`), not a third copy of the sheet reducer.

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
| Spectral Movement | **No** until **137** has its own positive `feat_lvl` | **Pending Kadin** (137 currently NULL; base 116 fixed to 1 in §3.2) |

Links for Spectral Movement may ship in the same migration, but **done-when for replace-on-add** excludes this family until 137’s level is set in data (not inferred from “II” in the name).

---

## 3. Proposed SQL (not executed in Stage 1)

**Live census:** 161 total; 49 child updates; 26 bases with `base_feat_id IS NULL`; 86 singletons.  
**One-shot:** Header on `sql/codex-creature-feats-base-feat-id.sql` must state “run once per environment; re-run overwrites admin edits.”

### 3.1 DDL

```sql
ALTER TABLE public.codex_creature_feats
  ADD COLUMN IF NOT EXISTS base_feat_id text;

COMMENT ON COLUMN public.codex_creature_feats.base_feat_id IS
  'Level-1 creature feat id in this family. NULL on level-1 rows. Mirrors codex_feats.base_feat_id.';
```

RLS: existing public SELECT on table (`sql/schema/0000_baseline_2026-08-13.sql:8184-8187`, `:8725-8728`); new column needs no new policy. `touch_updated_at` trigger will bump `updated_at` on updates (no changelog table).

### 3.2 Kadin-approved data corrections (same transaction, before links)

| id | name | change |
|----|------|--------|
| 151 | Create Thrall III | `feat_lvl = 3` |
| 23 | Regional Revival II | `feat_lvl = 2` |
| 121 | Ambusher | `feat_lvl = 1` |
| 109 | Shapeshifter | `feat_lvl = 1` |
| 116 | Spectral Movement | `feat_lvl = 1` |
| 120 | Tunneller | `feat_points = 1` |

**Not in §3.2 until Kadin rules:** **137** Spectral Movement II `feat_lvl`.

```sql
UPDATE public.codex_creature_feats SET feat_lvl = 3 WHERE id = '151' AND name = 'Create Thrall III';
UPDATE public.codex_creature_feats SET feat_lvl = 2 WHERE id = '23'  AND name = 'Regional Revival II';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '121' AND name = 'Ambusher';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '109' AND name = 'Shapeshifter';
UPDATE public.codex_creature_feats SET feat_lvl = 1 WHERE id = '116' AND name = 'Spectral Movement';
UPDATE public.codex_creature_feats SET feat_points = 1 WHERE id = '120' AND name = 'Tunneller';
```

### 3.3 Families to link (26 bases, 49 children)

Same 26 families as prior plan (Ambusher through Tight Grapple). **Slow (39)** links 40, 41 only — **not** Slow Walker (22).

Child updates use **`id` AND `name`** guards (example pattern):

```sql
UPDATE public.codex_creature_feats SET base_feat_id = '36'
WHERE id = '37' AND name = 'Speedy II';
UPDATE public.codex_creature_feats SET base_feat_id = '36'
WHERE id = '38' AND name = 'Speedy III';
-- … repeat for all 49 children (full list in Stage 2 SQL file)
```

Bases (26 ids): explicit `base_feat_id = NULL` with `AND name = '…'` on each base row.

### 3.4 Post-apply verification (read-only)

```sql
-- Counts
SELECT count(*) FILTER (WHERE base_feat_id IS NOT NULL) AS children FROM codex_creature_feats;
-- expect 49

SELECT count(*) FILTER (WHERE base_feat_id IS NULL AND id IN (/* 26 base ids */)) AS bases;
-- expect 26

-- No duplicate feat_lvl within a family
SELECT base_feat_id, feat_lvl, count(*)
FROM codex_creature_feats
WHERE base_feat_id IS NOT NULL
GROUP BY 1, 2
HAVING count(*) > 1;

-- One row per level 1..max per family (after 137 decided for Spectral Movement)
WITH fam AS (
  SELECT base_feat_id AS fid, feat_lvl, count(*) AS n
  FROM codex_creature_feats
  WHERE base_feat_id IS NOT NULL
  GROUP BY 1, 2
)
SELECT * FROM fam WHERE n <> 1;
```

---

## 4. Stage 2 engineering plan

### 4.1 Shared logic (`leveled-feats.ts`)

- **`computeNextLeveledFeatFields`** (name TBD): given current level-1 id, current `feat_lvl`, returns `{ feat_lvl: n+1, base_feat_id }` only.
- **`mergeFeatsInFamilyOnAdd`** (name TBD): single reducer; parameters:
  - `catalog: 'creature' | 'character'` — only removes existing rows whose saved `featSourceType` matches catalog (creature creator / creature tab).
  - `defsById: Map<string, LeveledFeatLike>` for **that catalog only** — never union creature + character maps.
  - Replace rule: remove same-family rows with **strictly lower** `getFeatLevel` (same level keeps both until data fixes duplicates — prefer tightening to `>` once levels are distinct).
- **`getFeatFamilyId` only** — do **not** copy `featPathFamilyId` from `feat-list.ts:189-191`.

Refactor **`computeNextLevelFormState`** (`admin-feat-form.ts:100-118`) to call shared helper, then apply character `lvl_req = newLevel * 2`. Creature admin modal calls the same helper, leaves **`lvl_req` blank/admin-entered** (creature level), **no** `lvl_req * 2` rule.

### 4.2 Consolidate merge reducers

| Caller | Action |
|--------|--------|
| `creature-feat-utils.ts` | Replace `mergeCreatureFeatsOnAdd` body with shared reducer (`catalog: 'character'` for library adds; `'creature'` for creature-tab adds). |
| `use-sheet-feat-actions.ts:122-141`, `:155-174` | **Follow-up** (same PR if small, else linked task): replace duplicated reduce blocks with shared reducer — **do not add a third inline copy** in the creator. |

### 4.3 Types / API / admin columnar

- `mapCodexCreatureFeat` — map `base_feat_id` like `mapCodexFeat` (`row-map.ts:124-125`).
- `CodexCreatureFeat` type + `database.types.ts` + `SUPABASE_SCHEMA.md`.
- `codex-columnar-keys.ts` — add **`baseFeatId`** to `codex_creature_feats` (mirror `codex_feats` at `:36`; creature list at `:158-166` today omits it). Admin saves must include key or column never writes.
- `references.ts` — child probe on `codex_creature_feats.base_feat_id` (mirror character feats pattern `:28-34`).

### 4.4 UI (no `CodexFeatRow` fork for creature lists)

Character `CodexFeatRow` (`codex-feat-row.tsx:13-38`) uses character columns from `feat-list.ts` — wrong for creature points / creature level req.

- **`AdminCreatureFeatsTab.tsx`** / **`CodexCreatureFeatsTab.tsx`**: `groupFeatFamilies` on mapped creature feats; keep existing `GridListRow` columns (`:26-32` public, `:143-171` admin); expand rows with **`buildFeatLevelChips`** from `leveled-feats.ts` (same chip pattern as character codex, not `checkFeatRequirements`).
- **`admin-creature-feat-edit-modal.tsx`**: “Add level” uses shared next-level helper; points/mechanic/`lvl_req` stay creature-specific; **no** new `admin-creature-feat-form.ts` file (Collin Q1 answered by constitution item 2).
- **`AddCreatureFeatModal.tsx`**: creature tab — `groupFeatFamilies`, one row per family, highest qualified level; merge on confirm via shared reducer + **creature defs map only**.
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

PR #529, `1dfe8wf3mzj`, B2 speed **values**, new feat copy, payload JSON shape changes.

---

## 5. Test plan — must fail on master

Run before Stage 2 implementation (verified **2026-11-11** on branch at plan-only commits, `npm ci`):

| Test | File (Stage 2) | Master result |
|------|----------------|---------------|
| Slow family via mapper + `groupFeatFamilies` | `src/lib/codex/row-map.test.ts` | **FAIL** — `expect(groupFeatFamilies(rows)).toHaveLength(1)` received **3** families (`mapCodexCreatureFeat` drops `base_feat_id`). Command: `npx vitest run src/lib/codex/row-map.test.ts -t "Slow family"`. |
| Catalog-scoped merge keeps character row when adding creature feat same id | `src/lib/creature-feat-utils.test.ts` (new) | **FAIL** until `mergeFeatsInFamilyOnAdd` exists — import/call new API: existing archetype id `41`, add creature Slow III id `41`, expect **2** feats; wrong single-map wiring yields **1**. |

**Do not** treat `creature-trait-tiers.test.ts:6-11` as the regression — it **passes** on master (name hack).

**Do not** pass Slow rows through `groupFeatFamilies` without `mapCodexCreatureFeat` in the first test — that bypasses the real bug.

After Stage 2: run full `npx vitest run src/lib/codex/row-map.test.ts src/lib/creature-feat-utils.test.ts` + movement helper tests replacing `creature-trait-tiers.test.ts`.

---

## 6. Done when (split)

### A. Links and data (schema + one-shot SQL)

- [ ] Named backup; §3.4 transaction applied.
- [ ] Post-apply checks: **49** children, **26** null bases, no duplicate `(base_feat_id, feat_lvl)`.
- [ ] Kadin-approved §3.2 rows corrected; **137** handled when he answers.
- [ ] `baseFeatId` on admin allowlist; types/docs updated.

### B. Replace-on-add and UI (code)

- [ ] `mapCodexCreatureFeat` exposes `base_feat_id`; lists nest via `groupFeatFamilies`.
- [ ] Shared merge reducer; **separate** creature vs character maps; payload unchanged.
- [ ] Creature-tab / movement chip replace works for families with **confirmed distinct `feat_lvl`** (§2 table).
- [ ] Spectral Movement replace-on-add — **only when** id **137** has approved `feat_lvl`.
- [ ] Tests in §5 green; `creature-trait-tiers.ts` removed.

### C. Follow-up (may be same PR or small sibling task)

- [ ] Deduplicate sheet merge blocks (`use-sheet-feat-actions.ts`).

---

## 7. Kadin product decisions

**Settled (Nov 11, 3:13 PM ET):** Thrall 1–3; Regional II = level 2; Charge/Charger separate; bases 121, 109, 116 → level 1; Tunneller 1 point.

**Open:** **137** Spectral Movement II — feat level not decided (do not infer “2” from name in code or SQL).

---

## 8. Collin (how)

1. ~~Separate `admin-creature-feat-form.ts`~~ — **No**; shared next-level in `leveled-feats.ts`.
2. `references.ts` delete guard for creature feat children — mirror feats table self-reference.
3. Movement helper: feat id from existing string maps + creature codex load for `getFeatFamilyId` (no new chip strings).

---

## 9. Risk

High: `sql/`, official `codex_creature_feats`, admin codex, creature creator. Kadin merges data change; Collin post-review on implementation.

**Verdict target after Stage 2:** REAL FIX for link column + catalog-scoped merge; partial until Spectral II level is data-complete.
