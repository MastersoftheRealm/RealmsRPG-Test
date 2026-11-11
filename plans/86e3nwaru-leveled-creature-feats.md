# 86e3nwaru — Leveled creature feat families (Stage 1 plan)

**Status:** Plan only (Stage 1). No implementation in this PR.  
**Task:** [Leveled creature feat families (shared with character feats)](https://app.clickup.com/t/86e3nwaru)  
**Branch (implementation):** `cursor/86e3nwaru-leveled-creature-feats`  
**Risk:** High (schema + official `codex_creature_feats` data). Kadin Nov 10 fallback applies before Stage 2 merge.

---

## 1. Plain-English brief for Kadin

### What exists today

Creature feats in the official library (for example Speedy, Speedy II, Speedy III) are separate database rows. They have a level number on each row (`feat_lvl`), but nothing links a higher level back to the first level the way character feats do.

Because of that gap, the website keeps a hard-coded list of names (`creature-trait-tiers.ts`) so that when you pick “Speedy III” the builder does not also keep “Speedy” and “Speedy II”. Character feats and archetypes do not need that hack; they use one shared field (`base_feat_id`) and one shared UI pattern.

Creature **saved files** (your creatures in My Library) store chosen feats as a list of **IDs and names** inside the creature JSON payload (`user_creatures.payload` / `official_creatures.payload`). They do **not** store `base_feat_id`. This plan does not change saved creature JSON shape and does not touch Collin’s creature-row migration or PR #529’s relational character work.

### Options

| Option | What it means | Upside | Downside |
|--------|----------------|--------|----------|
| **A. Mirror `base_feat_id` on `codex_creature_feats`** (recommended) | Add the same nullable link character feats use. Backfill every multi-level family from current names + levels. Reuse `leveled-feats.ts`, `CodexFeatRow`, admin “Add level”, picker grouping, and replace-on-upgrade logic. | One mental model for players and RMs; delete the name-based tier list; admin/library/creator match character feats. | Schema change + one-time data backfill on production; a few rows have bad level numbers that need your call before we “fix” them in data. |
| **B. Separate “family” table** | New table mapping family id → member feat ids. | Could model weird edge cases in theory. | Second system to maintain; nothing in the app uses this pattern today; more SQL and UI glue for no gain. |
| **C. Do nothing** | Keep name matching in code forever. | No migration risk. | Every new leveled creature feat needs code changes; admin and library stay flat lists; diverges from character feats. |

### Recommendation

**Option A.** It matches how character feats already work, removes duplicate logic, and is what the codebase already partially expects (the creature creator’s **Library** feat tab already calls `groupFeatFamilies`; only official **creature** feats and movement/sense chips still use the name hack).

### What could break

- **Wrong family links** in the backfill would nest unrelated feats or split a family. Mitigation: backfill derived from a read-only export of every row (done for this plan); anomalies flagged below are **not** guessed in SQL.
- **Admin “Add level”** on creature feats without `base_feat_id` could create orphan levels until the column exists.
- **Movement/sense toggles** in the creator use string labels (`movementTypes` / `senses`) tied to feat IDs in `creature-creator-constants.ts`. Removing `creature-trait-tiers.ts` requires replacing it with family logic from the codex (Stage 2). Until then, speed math still keys off those string names in `calculations.ts` (out of scope for B2 effect mapping).
- **Saved creatures** keep working if we only **add** `base_feat_id` and do not change row IDs. A creature that already has feat id `37` (Speedy II) still points at the same row; the app will learn that `37` belongs to the Speedy family and can offer upgrades/replacements.

### How existing creatures keep working

- Payload feat entries remain `{ id, name, points, … }` by id.
- No migration of `user_creatures` / `official_creatures` JSON is required for ids to stay valid.
- Stage 2 will add **merge-on-add** for creature-tab feats (today only library feats use `mergeCreatureFeatsOnAdd` in `creature-feat-utils.ts`).

### Rollback plan (Stage 2, after apply)

1. **Code:** Revert the merge commit (Git).
2. **Database:** Restore Supabase snapshot taken immediately before apply (named in the implementation PR). If only `base_feat_id` was added: `UPDATE codex_creature_feats SET base_feat_id = NULL` then `ALTER TABLE … DROP COLUMN base_feat_id` is sufficient if the snapshot is unavailable (links are redundant with names).
3. **Notice failure:** Codex creature feat lists look flat again; creator may allow stacking Speedy + Speedy II until code is reverted; CI tests for grouping fail if only DB is rolled back.

---

## 2. Survey — root cause and area health

### Root cause

`codex_creature_feats` has `feat_lvl` but **no** `base_feat_id` (`SUPABASE_SCHEMA.md`, baseline DDL). `mapCodexCreatureFeat` (`row-map.ts`) does not map a base link. `groupFeatFamilies` / `getFeatFamilyId` (`leveled-feats.ts`) treat every creature feat as its own family (family id = row id).

Parallel symptom: `creature-trait-tiers.ts` hard-codes tier families by **display name** for `movementTypes` and `senses` in `use-creature-creator-workspace.ts` — overlapping names with codex rows but a different code path than the creature feat picker.

### Character-feat reference path (target behavior)

| Layer | Location |
|-------|----------|
| DB | `codex_feats.base_feat_id` |
| Types/map | `src/types/codex.ts`, `row-map.ts` |
| Grouping/UI | `leveled-feats.ts`, `CodexFeatRow`, `feat-list.ts` |
| Admin | `AdminFeatsTab.tsx`, `admin-feat-form.ts` (`computeNextLevelFormState`) |
| Library | `CodexFeatsTab.tsx` |
| Sheet/creator | `add-feat-modal.tsx`, `mergeCreatureFeatsOnAdd`, `creature-creator-feat-armament-display.ts` |

### Consumers of `codex_creature_feats`

| Area | File(s) | Current leveled behavior |
|------|---------|---------------------------|
| API | `app/api/codex/route.ts`, `row-map.ts` | Flat list |
| Hooks | `use-codex.ts` (`useCreatureFeats`) | Flat |
| Public library | `CodexCreatureFeatsTab.tsx` | Flat `GridListRow` per row |
| Admin | `AdminCreatureFeatsTab.tsx`, `admin-creature-feat-edit-modal.tsx` | Flat; no `base_feat_id` field; no “Add level” |
| Creator picker | `AddCreatureFeatModal.tsx` | **Creature** tab: flat; **Library** tab: already uses `groupFeatFamilies` |
| Creator loadout | `creature-creator-feat-armament-display.ts` | Level chips only for library feats |
| Creator merge | `creature-feat-utils.ts` | `mergeCreatureFeatsOnAdd` only for codex **character** feats |
| Movement/sense UI | `creature-trait-tiers.ts`, `creature-creator-constants.ts`, `calculations.ts` | Name-based tier replacement |
| Admin spreadsheet | `codex-spreadsheet-config.ts`, `codex-columnar-keys.ts` | No base column |
| References/delete guards | `references.ts` | No self-reference probe on creature feats |

### Area health

- **Fork:** Name-tier list vs `base_feat_id` grouping (delete tier list in Stage 2).
- **Duplicate:** Creature feat picker could share `CodexFeatRow` / admin feat level patterns instead of flat rows.
- **Dead / partial:** `creature-trait-tiers.ts` only covers a subset of leveled feats (not Champion, Slow, etc. in that file — Slow is only in movement strings).
- **Rule literals in code:** `calculateCreatureSpeed` still maps Speedy/Slow by string (`calculations.ts`); B2 may consolidate — out of scope here except tier **replacement** when toggling movement.

### Proposed Stage 2 fix label

**REAL FIX** — structural alignment with character feats; removes name-grouping hack for tiers covered by codex families.

---

## 3. Proposed SQL (not executed in Stage 1)

**Source for family list:** read-only `SELECT` on production `codex_creature_feats` (Supabase MCP, 2026-11-11).  
**Not executed anywhere in Stage 1.**

### 3.1 Migration (DDL)

```sql
-- sql/codex-creature-feats-base-feat-id.sql (proposed filename; apply only after backup + Kadin OK)

ALTER TABLE public.codex_creature_feats
  ADD COLUMN IF NOT EXISTS base_feat_id text;

COMMENT ON COLUMN public.codex_creature_feats.base_feat_id IS
  'Id of the level-1 creature feat in this family. NULL for level-1 rows; set for higher levels. Mirrors codex_feats.base_feat_id.';

-- Optional: GIN/index not required (same as codex_feats — no FK; id strings only).
```

### 3.2 Backfill — families to link

For each family: **base** = level-1 row id (`base_feat_id` stays `NULL`). **Children** set `base_feat_id = <base id>`.

| Family (base name) | Base id (level 1) | Child ids → base |
|--------------------|-------------------|------------------|
| Ambusher | 121 | 122, 123 → 121 |
| Blindsense | 13 | 14, 15, 16 → 13 |
| Blood Rage | 87 | 88, 89, 90 → 87 |
| Burrow | 8 | 9 → 8 |
| Champion | 69 | 70, 71, 72, 73, 74 → 69 |
| Constrictor | 92 | 93, 94, 95 → 92 |
| Create Thrall | 149 | 150 → 149; **151 → 149 (see anomaly)** |
| Darkvision | 10 | 11, 12 → 10 |
| Dimensional Effect | 154 | 155 → 154 |
| Elemental Affinity | 58 | 59, 60 → 58 |
| Flying | 6 | 7 → 6 |
| Instinct | 61 | 62 → 61 |
| Jump | 19 | 20, 21 → 19 |
| Lycanthrope | 64 | 65, 66 → 64 |
| Power Resistant | 77 | 78, 79 → 77 |
| Regenerative | 54 | 55, 56, 57 → 54 |
| Regional Revival | 164 | 23 → 164 |
| Resources | 42 | 43 → 42 |
| Shapeshifter | 109 | 110, 111 → 109 |
| Slow | 39 | 40, 41 → 39 |
| Spectral Movement | 116 | 137 → 116 |
| Speedy | 36 | 37, 38 → 36 |
| Sun Sickness | 25 | 26 → 25 |
| Telepathy | 27 | 28 → 27 |
| Teleport | 82 | 83, 84 → 82 |
| Tight Grapple | 96 | 97 → 96 |

**26 families**, **70 child rows** (total linked rows: 26 bases + 70 children = 96 rows in families; remaining ~68 rows are singletons).

### 3.3 Backfill SQL (transactional pattern)

```sql
BEGIN;

-- Level-1 rows: explicit NULL (no-op if already null)
UPDATE public.codex_creature_feats SET base_feat_id = NULL
WHERE id IN (
  '121','13','87','8','69','92','149','10','154','58','6','61','19','64','77','54',
  '164','42','109','39','116','36','25','27','82','96'
);

-- Children (single UPDATE per id for audit clarity; implement as one CASE in practice)
UPDATE public.codex_creature_feats SET base_feat_id = '121' WHERE id IN ('122','123');
UPDATE public.codex_creature_feats SET base_feat_id = '13'  WHERE id IN ('14','15','16');
UPDATE public.codex_creature_feats SET base_feat_id = '87'  WHERE id IN ('88','89','90');
UPDATE public.codex_creature_feats SET base_feat_id = '8'   WHERE id = '9';
UPDATE public.codex_creature_feats SET base_feat_id = '69'  WHERE id IN ('70','71','72','73','74');
UPDATE public.codex_creature_feats SET base_feat_id = '92'  WHERE id IN ('93','94','95');
UPDATE public.codex_creature_feats SET base_feat_id = '149' WHERE id IN ('150','151');
UPDATE public.codex_creature_feats SET base_feat_id = '10'  WHERE id IN ('11','12');
UPDATE public.codex_creature_feats SET base_feat_id = '154' WHERE id = '155';
UPDATE public.codex_creature_feats SET base_feat_id = '58'  WHERE id IN ('59','60');
UPDATE public.codex_creature_feats SET base_feat_id = '6'   WHERE id = '7';
UPDATE public.codex_creature_feats SET base_feat_id = '61'  WHERE id = '62';
UPDATE public.codex_creature_feats SET base_feat_id = '19'  WHERE id IN ('20','21');
UPDATE public.codex_creature_feats SET base_feat_id = '64'  WHERE id IN ('65','66');
UPDATE public.codex_creature_feats SET base_feat_id = '77'  WHERE id IN ('78','79');
UPDATE public.codex_creature_feats SET base_feat_id = '54'  WHERE id IN ('55','56','57');
UPDATE public.codex_creature_feats SET base_feat_id = '164' WHERE id = '23';
UPDATE public.codex_creature_feats SET base_feat_id = '42'  WHERE id = '43';
UPDATE public.codex_creature_feats SET base_feat_id = '109' WHERE id IN ('110','111');
UPDATE public.codex_creature_feats SET base_feat_id = '39'  WHERE id IN ('40','41');
UPDATE public.codex_creature_feats SET base_feat_id = '116' WHERE id = '137';
UPDATE public.codex_creature_feats SET base_feat_id = '36'  WHERE id IN ('37','38');
UPDATE public.codex_creature_feats SET base_feat_id = '25'  WHERE id = '26';
UPDATE public.codex_creature_feats SET base_feat_id = '27'  WHERE id = '28';
UPDATE public.codex_creature_feats SET base_feat_id = '82'  WHERE id IN ('83','84');
UPDATE public.codex_creature_feats SET base_feat_id = '96'  WHERE id = '97';

COMMIT;
```

### 3.4 Anomalies (flagged — not corrected in backfill without product OK)

| Row | Issue | Plan handling |
|-----|--------|----------------|
| **151** Create Thrall III | `feat_lvl = 1` (should be 3) | Link `base_feat_id` to 149; **separate** `UPDATE feat_lvl = 3` only if Kadin approves |
| **164** / **23** Regional Revival | Both `feat_lvl = 1` | Link 23 → 164; **feat_lvl** on 23 should likely be 2 — needs Kadin |
| **120** Tunneller | `feat_points` IS NULL | Not a family issue; fix points in a separate content task |
| **99** Charge vs **86** Charger | Same theme, different names; not same `base_name` | **Do not** link unless Kadin says Charge is a level of Charger |
| **121** Ambusher, **109** Shapeshifter, **116** Spectral Movement | Base row `feat_lvl` NULL while children have levels | `groupFeatFamilies` tolerates via Roman suffix; optional normalize `feat_lvl = 1` with Kadin |
| **Flying** vs UI label **Fly Half** / **Fly** | `MOVEMENT_TO_FEAT_ID` maps UI strings to ids 6/7 | B2 / creator button mapping — out of scope |

**Verification query after apply (read-only):**

```sql
SELECT base_feat_id, count(*) FROM codex_creature_feats
WHERE base_feat_id IS NOT NULL GROUP BY 1 ORDER BY 1;
```

---

## 4. Stage 2 file list (and deletions)

### SQL / types / docs

- `sql/codex-creature-feats-base-feat-id.sql` (new)
- `src/types/database.types.ts` (regenerate)
- `src/docs/SUPABASE_SCHEMA.md`
- `src/types/codex.ts` — `base_feat_id` on `CodexCreatureFeat`
- `src/lib/codex/row-map.ts` + `row-map.test.ts`
- `src/lib/codex/columnar-keys.ts`
- `src/lib/codex/references.ts` — probe `codex_creature_feats.base_feat_id` like `codex_feats`

### Admin + library UI

- `AdminCreatureFeatsTab.tsx` — `groupFeatFamilies`, nested `CodexFeatRow` (or shared creature-feat row), “Add level”
- `admin-creature-feat-edit-modal.tsx` + new `admin-creature-feat-form.ts` (mirror `admin-feat-form.ts` / `computeNextLevelFormState`)
- `CodexCreatureFeatsTab.tsx` — nest like `CodexFeatsTab.tsx`

### Creature creator

- `AddCreatureFeatModal.tsx` — creature tab: families, highest selectable level, replace lower
- `creature-feat-utils.ts` — extend `mergeCreatureFeatsOnAdd` for codex creature feats (`codexCreatureFeatsById`)
- `creature-creator-feat-armament-display.ts` + tests — level chips / rank change for creature feats
- `page.tsx` / `use-creature-creator-workspace.ts` — wire merge for creature-tab adds
- **Delete:** `creature-trait-tiers.ts` → replace with helper using `getFeatFamilyId` + movement/sense id maps in `creature-creator-constants.ts`
- **Update/delete:** `creature-trait-tiers.test.ts`
- Touch only if needed: `calculations.ts` / `calculations.test.ts` (tier non-stacking may move to family-aware helper)

### Explicitly out of scope (do not edit)

- PR #529 relational character tables, RPCs, `characters.data`
- Collin creature-row migration `1dfe8wf3mzj`
- B2 effect mappings for creator movement buttons

### Duplicate / dead code to remove

- Entire `TIERED_CREATURE_TRAIT_FAMILIES` constant and `replaceTieredCreatureTrait` name matching (after replacement exists).

---

## 5. Failing-then-passing test plan

| Test | File (proposed) | Fails on master because | Passes after |
|------|-----------------|-------------------------|--------------|
| Creature feat families group Slow II/III under Slow | `src/lib/leveled-feats.test.ts` or `creature-feat-utils.test.ts` | Fixtures without `base_feat_id` yield 3 separate families | Fixtures with `base_feat_id` → one family, 3 levels |
| `mergeCreatureFeatsOnAdd` replaces lower codex creature feat | `creature-feat-utils.test.ts` | Function only looks up `codex_feats` map | Uses creature feat map; adding Slow III drops Slow |
| Replace movement tier via family ids | New unit test replacing `creature-trait-tiers.test.ts` | N/A until helper exists | Speedy III replaces Speedy in movement list using codex family data |
| Optional UI/component | `creature-creator-feat-armament-display.test.ts` | No `levelMeta` for creature-source feats | Chips appear for leveled creature feats |

**Commands:** `npx vitest run src/lib/leveled-feats.test.ts src/app/(main)/creature-creator/creature-feat-utils.test.ts` (exact paths finalized in Stage 2).

---

## 6. Done when

- [ ] Named Supabase backup taken; migration + backfill applied in a single controlled window with SQL from this plan (adjusted per Kadin answers on anomalies).
- [ ] Every row in the 26 families has correct `base_feat_id`; level-1 rows NULL.
- [ ] Admin, public Codex, and creature creator **creature** feat picker show nested families like character feats; higher level replaces lower on add.
- [ ] `creature-trait-tiers.ts` name grouping removed; movement/sense tier replacement uses shared leveled-feat family logic.
- [ ] Tests above fail on pre-change master and pass on branch.
- [ ] `SUPABASE_SCHEMA.md` and types updated; fallback evidence complete in implementation PR.

## 7. Out of scope

- New feat content or renames (Charge vs Charger merge, Tunneller points, Thrall III level — unless Kadin approves separate data fixes).
- B2 creator button / effect mapping refactor.
- Creature-row relational migration `1dfe8wf3mzj`.
- PR #529 character relational storage.

---

## 8. Questions for Kadin (what)

1. **Create Thrall III (151):** Confirm `feat_lvl` should be **3** before we fix the row.
2. **Regional Revival II (23):** Confirm `feat_lvl` should be **2** and that **164** is the level-1 base (naming vs “II” on the lower id).
3. **Charge (99) and Charger (86):** Separate feats forever, or is Charge a lower tier of Charger?
4. **Ambusher / Shapeshifter / Spectral Movement bases** with null `feat_lvl`: OK to set `feat_lvl = 1` on the base row when we touch data?
5. **Tunneller (120):** What should `feat_points` be?

## 9. Questions for Collin (how) — post-review queue

1. Prefer one shared `admin-*-feat-form` module or parallel `admin-creature-feat-form.ts` mirroring character feats?
2. `references.ts`: block delete of level-1 row when children exist — mirror `codex_feats` exactly?
3. Movement tier helper: resolve by feat id from `MOVEMENT_TO_FEAT_ID` only, or also require codex load?

---

## 10. Risk by path

| Path | Touch |
|------|--------|
| Database / SQL | **Yes** — new column + backfill |
| Game rules display | Creature feat lists, creator pickers |
| Admin codex | Creature feat tab + modal |
| Official codex data | **Yes** — `codex_creature_feats` rows |

**Approvals:** Kadin (data change + anomaly fixes); Collin (SQL + how) or full fallback with senior review on implementation PR.
