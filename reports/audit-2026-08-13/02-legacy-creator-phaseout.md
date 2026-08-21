# Legacy Character Creator — Migration & Deletion Inventory

**Audit date:** 2026-08-13 · **Mode:** read-only, verified in code (docs not trusted)
**Repo:** `RealmsRPG-Test` · Next.js 16.2 App Router / React 19.2 / Zustand 5 / Supabase

---

## 0. Executive summary

| Metric | Value |
|---|---|
| Legacy scope files audited | 74 (55 `character-creator` + 12 `creator` + 6 `lib/creator` + validation + store) |
| Legacy scope LOC | **12,971** (+289 collateral = 13,260) |
| **Dead code today (ORPHAN, reachable by nothing)** | **0 LOC** — every legacy file is live via `/characters/new/advanced` |
| Deletable after 4 small extractions | **~10,514 LOC** |
| Must be kept / extracted (SHARED) | **2,745 LOC** |
| Parity gaps blocking deletion | 7 (2 hard blockers) |
| Duplicated logic pairs found | 11 |
| P0 findings | 0 |
| P1 findings (user-visible, broken today) | 4 |

**Headline:** `src/components/creator/**` is **not** legacy. It is the shared standalone-creator toolkit (item / power / technique / empowered-technique / species / creature creators, crafting, character sheet, and the *guided* creator all import it). 0 of its 1,808 LOC is deletable. The real legacy surface is `src/components/character-creator/**` (7,959 deletable LOC) + the store + validation.

**Second headline:** `GuidedChoiceShell` (`src/components/shared/guided-choice/guided-choice-shell.tsx`, 135 LOC, ADR-backed) is used **only by the legacy creator**. Nothing in `src/components/guided-creator/**` imports it. It is an orphan-in-waiting despite its name.

---

## 1. Routes & reachability roots

| Route | File | LOC | Store | Status |
|---|---|---|---|---|
| `/characters/new` | `src/app/(main)/characters/new/page.tsx` | 108 | — | LIVE chooser. Renders 3 cards: Guided, Custom, **Legacy** (`page.tsx:38-43` → `/characters/new/advanced`) |
| `/characters/new/advanced` | `src/app/(main)/characters/new/advanced/page.tsx` | 71 | `character-creator-store` | **LIVE — the only legacy entry point** |
| `/characters/new/guided` | `src/app/(main)/characters/new/guided/page.tsx` | 79 | `guided-creator-store` | LIVE (both `?entry=guided` and `?entry=custom`) |

There is exactly one legacy route. Cutting the `legacy` entry in `MODES` (`characters/new/page.tsx:37-43`) plus deleting `advanced/page.tsx` orphans the entire `character-creator/steps/**` tree in one move.

Other creators sharing code: `/item-creator`, `/power-creator`, `/technique-creator`, `/empowered-technique-creator`, `/species-creator`, `/creature-creator`, `/crafting/[id]` — all consume `@/components/creator`, none consume `@/components/character-creator` or the legacy store.

---

## 2. Full file inventory

Classification key:
- **LEGACY** — reachable only from `/characters/new/advanced`; deletes with the route.
- **SHARED** — imported by guided creator, character sheet, or another creator. **Do not delete**; extract or leave in place.
- **SPLIT** — mostly legacy, but exports one or two symbols consumed outside legacy. Extract the symbol, delete the rest.
- **ORPHAN-AFTER** — reachable today only via legacy; becomes unreferenced the moment legacy is gone.

### 2.1 `src/components/character-creator/` — root (10 files, 1,349 LOC)

| path | LOC | class | imported by | action |
|---|---|---|---|---|
| `AbilityPickButton.tsx` | 53 | **SHARED** | `character-sheet/edit-archetype-modal.tsx:15`, `guided-creator/guided-path-custom-archetype.tsx:10`, legacy `archetype-step.tsx:16` | Move to `components/shared/` |
| `creator-portrait-upload.tsx` | 254 | **SHARED** | `guided-creator/guided-portrait-upload.tsx:3`, legacy `finalize/portrait-upload.tsx:4` | Move to `components/shared/` |
| `creator-step-footer.tsx` | 93 | LEGACY | 7 legacy steps only | Delete |
| `creator-tab-bar.tsx` | 196 | LEGACY | `character-creator/index.ts:7` → `advanced/page.tsx:72` | Delete |
| `index.ts` | 7 | LEGACY | `advanced/page.tsx:28` | Delete |
| `mixed-species-skill-picker.tsx` | 90 | **SHARED** | `character-sheet/edit-species-ancestry-step.tsx:8`, legacy `ancestry/ancestry-mixed-panel.tsx:7` | Move to `components/shared/` |
| `MixedSpeciesModal.tsx` | 151 | **SHARED** | `guided-creator/steps/species-step.tsx:19`, `guided-creator/steps/ancestry-step.tsx:10`, `character-sheet/edit-species-modal.tsx:12`, legacy `species-step.tsx:17` | Move to `components/shared/` (intentional non-USM per TASK-605) |
| `PathHelpCard.tsx` | 66 | **SHARED** | `character-sheet/archetype-path-identity.tsx:4` + 6 legacy steps | Move to `components/shared/` |
| `species-modal.tsx` | 266 | LEGACY | `steps/species-step.tsx:16` only | Delete |
| `TraitSection.tsx` | 173 | **SHARED** | `character-sheet/edit-species-ancestry-step.tsx:7`, legacy ancestry panels | Move to `components/shared/` |

**Shared subtotal: 787 LOC (6 files) — extract. Legacy subtotal: 562 LOC (4 files) — delete.**

### 2.2 `src/components/character-creator/steps/` — root (10 files, 3,037 LOC)

Every file below is **LEGACY**; the only importer chain is `steps/index.ts` → `character-creator/index.ts` → `advanced/page.tsx`. Action for all: **Delete**.

| path | LOC | notes |
|---|---|---|
| `archetype-step.tsx` | 391 | Forge-vs-Path mode selection |
| `species-step.tsx` | 303 | Only consumer of `species-modal.tsx` |
| `ancestry-step.tsx` | 96 | Facade over `ancestry/` |
| `abilities-step.tsx` | 185 | See §4.2 (rules drift) |
| `skills-step.tsx` | 341 | Only creator with defense + skillAbilities UI |
| `feats-step.tsx` | 458 | |
| `equipment-step.tsx` | 400 | See §4.5 (TP formula divergence) |
| `powers-step.tsx` | 428 | See §4.7 (innate energy not enforced) |
| `finalize-step.tsx` | 421 | Legacy save path |
| `index.ts` | 14 | Barrel |

### 2.3 `src/components/character-creator/steps/*` subfolders (35 files, 4,360 LOC)

All **LEGACY**, imported only by their parent step. Action for all: **Delete**.

| folder | files | LOC | files |
|---|---|---|---|
| `ancestry/` | 4 | 936 | `ancestry-mixed-panel.tsx` 270, `ancestry-single-panel.tsx` 285, `ancestry-step-checklist.tsx` 51, `use-ancestry-step-state.ts` 330 |
| `equipment/` | 6 | 904 | `equipment-catalog-panel.tsx` 401, `path-loadout-section.tsx` 187, `unarmed-prowess-panel.tsx` 151, `selected-equipment-list.tsx` 91, `step-header.tsx` 42, `list-columns.ts` 32 |
| `feats/` | 8 | 688 | `full-feat-catalog.tsx` 153, `path-feat-lists.tsx` 152, `selected-feats-summary.tsx` 126, `feat-row.tsx` 85, `apply-recommended-path-feats.ts` 73, `selected-feat-chip-row.tsx` 46, `feat-list-columns.ts` 27, `path-mode-feat-families.ts` 26 |
| `finalize/` | 7 | 602 | `build-summary.tsx` 271, `validation-modal.tsx` 102, `health-energy-section.tsx` 94, `identity-fields.tsx` 89, `step-edit-link.tsx` 18, `portrait-upload.tsx` 15, `appearance-age.ts` 13 |
| `powers/` | 10 | 1,230 | `powers-selection-modals.tsx` 245, `powers-step-chrome.tsx` 171, `use-powers-step-selectables.ts` 162, `draft-power-selection.ts` 154, `powers-selected-section.tsx` 154, `techniques-selected-section.tsx` 139, `apply-path-power-recommendations.ts` 84, `powers-step-proficiency-tp.ts` 55, `modal-empty-messages.ts` 48, `modal-columns.ts` 18 |

> `finalize/appearance-age.ts` (13 LOC) encodes the `Age: N\n…` convention that **both** creators write into `Character.appearance` (guided writes it inline at `build-character.ts:384`). Move these 13 LOC to `lib/character/` rather than deleting, or guided loses the only parser.

### 2.4 `src/components/creator/` (12 files, 1,808 LOC) — **0 deletable**

| path | LOC | class | imported by | action |
|---|---|---|---|---|
| `index.ts` | 27 | SHARED | 20+ call sites | Keep |
| `ability-score-editor.tsx` | 240 | SHARED | `guided-creator/guided-abilities-customize-panel.tsx:9`, `creature-creator-editor.tsx:20`, legacy `abilities-step.tsx:12` | Keep |
| `health-energy-allocator.tsx` | 205 | SHARED | `guided-creator/guided-health-energy-section.tsx:5`, `character-sheet/sheet-header-resources.tsx:4`, `creature-creator-editor.tsx:19`, legacy `finalize/health-energy-section.tsx:10` | Keep |
| `collapsible-section.tsx` | 173 | SHARED | item/power/technique/empowered/species/creature creators, crafting (4 sections), `guided-creator/guided-entity-detail-modal.tsx:14` | Keep |
| `creator-summary-panel.tsx` | 307 | SHARED | species, creature, item, power, technique, empowered, crafting sidebar | Keep |
| `CreatorPageShell.tsx` | 221 | SHARED | 6 standalone creator pages | Keep |
| `CreatorLayout.tsx` | 58 | SHARED | `crafting/[id]/page.tsx:14`, `CreatorPageShell.tsx:24` | Keep |
| `CreatorSaveToolbar.tsx` | 71 | SHARED | `CreatorPageShell.tsx:25` | Keep |
| `LoadFromLibraryModal.tsx` | 75 | SHARED | `CreatorPageShell.tsx:27` | Keep |
| `power-part-card.tsx` | 267 | SHARED | `power-creator-editor-power-parts.tsx:10`, `empowered-technique-editor-{power,technique}-parts.tsx:5` | Keep |
| `archetype-selector.tsx` | 130 | SHARED | `creature-creator-editor.tsx:21`; type `ArchetypeType` by `creature-creator-types.ts:5` | Keep |
| `advanced-calculations-panel.tsx` | 34 | SHARED | item, power, technique, empowered creator pages | Keep |

**Owner correction:** this directory was scoped as LEGACY in the brief. It is not. Renaming it (e.g. `components/entity-creator/`) would remove the confusion, but that is cosmetic and touches 20+ files.

### 2.5 `src/lib/creator/` (6 files, 1,303 LOC)

| path | LOC | class | imported by | action |
|---|---|---|---|---|
| `advanced-equipment-catalog.ts` | 530 | **SPLIT** | 5 legacy equipment files + `lib/library/power-technique-character-context.ts:13` (`computeUnarmedProwessTpCost` only) | Extract `UNARMED_PROWESS_*` consts + `computeUnarmedProwessTpCost` (~8 LOC) to `lib/game/unarmed-prowess.ts`; delete remaining 522 |
| `advanced-equipment-catalog.test.ts` | 300 | SPLIT | vitest | Trim to the extracted unarmed cases; delete ~270 |
| `advanced-powers-selectable.ts` | 235 | LEGACY | `steps/powers/use-powers-step-selectables.ts:16` only | Delete |
| `advanced-powers-selectable.test.ts` | 96 | LEGACY | vitest | Delete |
| `build-creator-skills.ts` | 85 | **SHARED** | `lib/guided-creator/build-character.ts:30`, legacy `finalize-step.tsx:16` | Move to `lib/character/` |
| `build-creator-skills.test.ts` | 57 | SHARED | vitest | Move with it |

### 2.6 Store, validation, hooks, collateral

| path | LOC | class | imported by | action |
|---|---|---|---|---|
| `src/stores/character-creator-store.ts` | 550 | **SPLIT** | Legacy everywhere; **outside legacy:** `CHARACTER_STARTING_CURRENCY` → `stores/guided-creator-store.ts:32`, `lib/guided-creator/path-selection-draft.ts:7`, `lib/guided-creator/equipment-currency.ts:14`, `lib/creator/advanced-equipment-catalog.test.ts:26`; type `CreatorLayer` → `shared/guided-choice/guided-choice-shell.tsx:20` | Move `CHARACTER_STARTING_CURRENCY = 200` to `lib/game/constants.ts`; delete remaining 549 |
| `src/lib/character-creator-validation.ts` | 452 | **SPLIT** | Legacy steps + tab bar; **outside legacy:** type `StepCompletion` → `guided-choice-shell.tsx:21` (itself legacy-only) | Delete all 452 once `GuidedChoiceShell` goes |
| `src/hooks/use-creator-path-data.ts` | 41 | **ORPHAN-AFTER** | 6 legacy steps only (`equipment`, `skills`, `species`, `feats`, `abilities`, `ancestry/use-ancestry-step-state`) | Delete + remove `hooks/index.ts:12` export |
| `src/components/shared/guided-choice/guided-choice-shell.tsx` | 135 | **ORPHAN-AFTER** | legacy `abilities-step.tsx:15`, `skills-step.tsx:14`, `feats-step.tsx:17`. **Zero guided-creator importers.** | Delete + drop the `GuidedChoiceShell` export from `shared/guided-choice/index.ts:1-2` and `shared/index.ts:298-301`. Retire ADR |
| `src/app/(main)/characters/new/advanced/page.tsx` | 71 | LEGACY route | Next.js router | Delete directory |
| `src/app/(main)/characters/new/page.tsx` | 108 | KEEP | router | Edit: remove `MODES[2]` legacy entry (`:37-43`) and its copy in `lib/constants/copy/guided-creator-copy.ts` (`chooser.modes.legacy`) |
| `tests/visual/creator-ux-audit.pw.ts` | 154 | **ORPHAN-AFTER** | `playwright.creator-audit.config.ts`; seeds `localStorage['character-creator-storage']` at `:140,:152` | Delete both |

**Not affected but keep in mind:** `SkillsAllocationPage` (513 LOC), `InnateToggle`, `AddSkillModal`, `AddSubSkillModal`, `UnifiedSelectionModal`, `LoadoutBudgetBar` are all shared with the sheet and/or creature creator — none become orphans.

---

## 3. Feature parity gaps — the list blocking deletion

Ranked by whether they block. **Blocking = a user can do it today in Legacy and cannot do it in Guided.**

| # | Capability | Legacy (`path:line`) | Guided | Blocks deletion? |
|---|---|---|---|---|
| **P1** | **Defense-bonus allocation at creation** | `steps/skills-step.tsx:183-188` `handleDefenseChange` → `draft.defenseVals`; costs skill points via `character-creator-validation.ts:217` | `build-character.ts:380` hard-codes `defenseVals: { ...DEFAULT_DEFENSE_SKILLS }`. `guided-skills-panel.tsx` has no defense UI; `steps/skills-step.tsx:151` passes `DEFAULT_DEFENSE_SKILLS` into the spend calc | **YES** — feature loss |
| **P1** | **Per-skill governing-ability choice** (`Lockpick` → Agility *or* Intelligence) | `steps/skills-step.tsx:147-152` `handleSkillAbilityChange` → `draft.skillAbilities`; consumed by `shared/skills-allocation-page.tsx:411` | No equivalent. `GuidedSkillsPanel` exposes no ability picker | **YES** — feature loss (but see §6 P1-3: legacy already drops it on save) |
| P2 | **Free-text `notes` field** | `steps/finalize-step.tsx:336-345` `updateDraft({ notes })`; `notes` is in `SAVEABLE_FIELDS` (`clean-for-save.ts:43`) | `GuidedDraft` has no `notes`; `build-character.ts` never emits it | No — sheet Notes tab can fill this post-create |
| P2 | **Level > 1 creation** | `draft.level` read in 10 places (`equipment-step.tsx:172`, `finalize-step.tsx:107,113,120`, `skills-step.tsx:112`, `abilities-step.tsx:37`, `feats-step.tsx:100`, `powers/powers-step-proficiency-tp.ts:54`, `finalize/health-energy-section.tsx:28`, `equipment/unarmed-prowess-panel.tsx:64`) | `build-character.ts:156` `const level = 1`; `guided-health-energy-section.tsx:36` `const level = 1`; `skills-step.tsx:118` `const level = 1`; `abilities-step.tsx:102` `calculateAbilityPoints(1,…)` | **No** — legacy has no UI to set `draft.level` either. It is always 1. Dead capability on both sides |
| P3 | **Empowered techniques as powers** | `lib/creator/advanced-powers-selectable.ts:202` `empoweredTechniqueToPowerSelectable`; wired at `steps/powers/use-powers-step-selectables.ts` | Guided `powers-techniques-step.tsx` has no empowered tab | No — reachable from the sheet's Add-to-Library modal |
| P3 | **"Forge Your Own" archetype (non-path)** | `character-creator-store.ts:253-276` `setArchetype()`; `steps/archetype-step.tsx` | Covered — `/characters/new/guided?entry=custom` → `pathLayer:'l3'` → `guided-path-custom-archetype.tsx` | No — parity reached (TASK-638) |
| P3 | **Homebrew / user-library sourcing** | `equipment-step.tsx:100` `sourceFilter`; `powers-step.tsx:178` `_source` filter | Covered — `loadout-step.tsx:471,528` + `powers-techniques-step.tsx:522,649` `SourceFilter`; `reveal-step.tsx:165-167` merges user library on save | No — parity reached |

**Not gaps (neither creator has them):** edit-an-existing-character (both are create-only; editing lives on the sheet via `EditSpeciesModal` / `EditArchetypeModal` / `LevelUpModal`), import/export, campaign linking beyond the shared `?returnTo=` param (`finalize-step.tsx:218` vs `reveal-step.tsx:98-103` — behaviourally identical, both gated by `sanitizeRedirectPath`).

**Net: 2 blocking gaps, both in the Skills step, both small.** Adding a defense-bonus section and a skill-ability picker to `guided-skills-panel.tsx` unblocks the whole deletion.

---

## 4. Duplicated logic — highest-value findings

Legend: **A** = authoritative, **D** = divergent (bug fixed in one will not reach the other).

### 4.1 Equipment Training-Points spend — **two entirely different formulas** (D, P1)

| | Legacy | Guided |
|---|---|---|
| Function | `lib/creator/advanced-equipment-catalog.ts:440-485` `computeAdvancedEquipmentProficiencyTp` | `lib/guided-creator/loadout-tp.ts:101-132` `computeGuidedLoadoutTpSummary` |
| Spend model | **Proficiency-based**: `buildRequiredProficiencies` → `dedupeHighestProficiencies` → `calculateProficiencyTP` | **Item-part-based**: `calculateItemCosts(props).totalTP` summed per item × qty (`loadout-tp.ts:67-92`) |
| Budget | `getTrainingPointLimit(level, ability)` — **no `rules`** (`:483`) | `getTrainingPointLimit(1, ability, rules)` — rules-aware (`:130`) |

The *same loadout* reports a different TP spend in each creator, and the legacy budget ignores `core_rules` overrides. This is the single largest correctness divergence found. Authoritative: guided (rules-aware, matches the item-calc GLR protocol). **Legacy is wrong twice over.**

Related: `steps/powers/powers-step-proficiency-tp.ts:10-56` is a third copy of the proficiency-TP calc (near-identical to `computeAdvancedEquipmentProficiencyTp`), and `steps/finalize-step.tsx:82-109` inlines a **fourth** copy. Four implementations, one rule.

### 4.2 Core-rules awareness — 11 call sites silently drop `rules` (D, P1)

`core_rules` (Supabase, editable at `/admin/core-rules`) can override every progression constant. These call sites ignore it and fall back to hard-coded defaults:

| Site | Call | Rules-aware counterpart |
|---|---|---|
| `character-creator-validation.ts:166` | `calculateAbilityPoints(level)` | `guided-creator/steps/abilities-step.tsx:102` ✅ |
| `character-creator-validation.ts:208` | `calculateSkillPointsForEntity(level,'character')` — `rules` is destructured at `:67` and available | `lib/level-up-guide.ts:69` ✅ |
| `character-creator-validation.ts:273` | `calculateTrainingPoints(level, ability)` | `lib/level-up-guide.ts:72` ✅ |
| `character-creator-validation.ts:323` | `calculateHealthEnergyPool(level,'PLAYER',false)` | same file `:384` passes `rules` ✅ |
| `character-creator-validation.ts:445` | `calculateAbilityPoints(level)` | |
| `character-creator-validation.ts:468` | `calculateHealthEnergyPool(...)` | |
| `character-creator/steps/abilities-step.tsx:44` | `calculateAbilityPoints(level)` | |
| `character-creator/steps/finalize-step.tsx:107` | `getTrainingPointLimit(...)` | |
| `character-creator/steps/powers/powers-step-proficiency-tp.ts:54` | `getTrainingPointLimit(...)` | |
| `lib/creator/advanced-equipment-catalog.ts:483` | `getTrainingPointLimit(...)` | |
| `shared/skills-allocation-page.tsx:141` + `guided-creator/steps/skills-step.tsx:120` | `getTotalSkillPoints(level, type)` — this function has **no `rules` parameter at all** (`lib/game/skill-allocation.ts:122-131`) | `calculateSkillPointsForEntity` (`formulas.ts:70-83`) is the rules-aware twin |

**Self-contradiction inside a single legacy step (P1):** on `9. Finalize`, `HealthEnergyAllocationSection` computes the HE pool **with** rules (`finalize/health-energy-section.tsx:35`) while the completion indicator and the Review-&-Create validator compute it **without** (`character-creator-validation.ts:323, :468`). With any non-default `PROGRESSION_PLAYER.baseHitEnergyPool` / `hitEnergyPerLevel`, the allocator shows all points spent while the gate insists points remain (or vice versa) — Create is unreachable or silently permits an invalid build.

### 4.3 Total skill points — two functions (D, P2)

`calculateSkillPointsForEntity` (`lib/game/formulas.ts:70`, rules-aware) vs `getTotalSkillPoints` (`lib/game/skill-allocation.ts:122`, hard-coded). Legacy validation uses the former (without rules); legacy UI (`skills-allocation-page.tsx:141`) and guided (`guided-creator/steps/skills-step.tsx:120`) use the latter. Three consumers, two functions, zero of them currently rules-aware. **Authoritative: `calculateSkillPointsForEntity` with `rules`.** Collapse `getTotalSkillPoints` into it.

### 4.4 Archetype feat count — hard-coded vs formula (D, P2)

- Guided: `steps/archetype-feats-step.tsx:75` `calculateMaxArchetypeFeats(1, type)` (no `rules`).
- Legacy step: `steps/feats-step.tsx:101-102` `calculateMaxArchetypeFeats(level, type)` + `calculateMaxCharacterFeats(level)` (no `rules`).
- Legacy **validation**: `character-creator-validation.ts:242-245` and again at `:454-457` **hard-codes** `power=1 / powered-martial=2 / martial=3`, plus `characterFeats.length < 1` at `:254`.

At level 1 with default rules these agree (`formulas.ts:223-242` yields 1/2/3). Override `ARCHETYPES.martialBonusFeatsBase` and the legacy step lets you pick 4 martial feats while its own validator demands exactly 3. **Authoritative: `calculateMaxArchetypeFeats` + `rules`.**

### 4.5 Starting currency — three implementations (D, P2)

| Site | Formula |
|---|---|
| `lib/guided-creator/equipment-currency.ts:49-52` `computeStartingCurrency` | `200 × 1.45^(level-1)` — **A** |
| `character-creator/steps/finalize-step.tsx:119-123` | inlines the same `1.45^(level-1)` math by hand |
| `character-creator-validation.ts:298` | flat `CHARACTER_STARTING_CURRENCY` (200), **no level growth** |

Legacy equipment-step *does* use the shared helper (`equipment-step.tsx:172`), so the validator disagrees with the step at level > 1. Latent only because level is always 1.

### 4.6 Item spend cost (D, P2)

- Legacy: `equipment-step.tsx:179-183` sums the `cost` field frozen onto the inventory row at add time (`advanced-equipment-catalog.ts:488` `cost = gold_cost || currency || 0`).
- Guided: `loadout-step.tsx:174-200` resolves live via `resolveCatalogRowUnitCost` / `resolveRefUnitCost`, which fall back to `calculateCurrencyCostAndRarity(totalCurrency, totalIP)` (`equipment-currency.ts:58-80`).

A codex price change re-prices a guided draft and does not re-price a legacy one. **Authoritative: guided.**

### 4.7 Innate Energy enforcement (D, **P1** — see §6)

- Guided: `steps/use-powers-techniques-selection.ts:112-124,:270,:327` + `guided-powers-techniques-l2-modal.tsx:173-174` reject selections that exceed `innateEnergyMax`.
- Legacy: `steps/powers-step.tsx:319-328` `togglePowerInnate` flips the flag with **no budget check**. The cap appears only as advisory copy in `powers/powers-selected-section.tsx:57-62` (`"Tap ☆ to mark innate (up to {innateThreshold} EN, {innatePools} pools)"`).

**Authoritative: guided.** Legacy lets a player mark unlimited innate powers.

### 4.8 Skill save rows — same helper, different arguments (D, P2)

Both call `buildCreatorSkillSaveRows` (`lib/creator/build-creator-skills.ts:48`), with opposite option sets:

| | `speciesSkillIds` | `includeBaseSkillName` |
|---|---|---|
| Legacy `finalize-step.tsx:159-165` | **omitted** | `true` |
| Guided `build-character.ts:233-236` | passed | **omitted** |

Result: guided characters save without a `baseSkill` display name; legacy characters save without species-granted skills **unless** the user pressed Continue on the Skills step (`skills-step.tsx:269` folds `allocationsWithSpecies` into the draft). Jumping straight to Finalize via the tab bar drops them. Pick one option set for both.

### 4.9 Path-data resolution — parallel hooks (D, P3)

`hooks/use-creator-path-data.ts` (41 LOC, legacy) vs `components/guided-creator/use-guided-path-data.ts` (36 LOC). Both resolve `path_data` from draft-or-codex; only the legacy one has the "draft has content" fallback heuristic (`:20-32`). Legacy one dies with the migration.

### 4.10 Health/Energy section — parallel wrappers (A, low risk)

`character-creator/steps/finalize/health-energy-section.tsx` (94) vs `guided-creator/guided-health-energy-section.tsx` (126). Both delegate to the same `HealthEnergyAllocator`, `allocateHealthEnergyPool`, `calculateHealthEnergyPool(…, rules)`, and `findHighestEnergyCostPick`. Genuine duplication of ~90 LOC of wiring, but no rule can drift. Delete the legacy copy with the step.

### 4.11 Selectable-row builders (D, P3)

`lib/creator/advanced-powers-selectable.ts` (235) builds `SelectableItem` rows for the legacy USM modal; `lib/guided-creator/power-technique-display.ts` (209) + `powers-techniques-l2.ts` (214) build the guided card/row facts. Both derive from `derivePowerDisplay` / `deriveTechniqueDisplay` and both emit a Training-Points column, but via different label constants and column orders. Column/label fixes land in one only.

---

## 5. Persistence & data-shape risk

**Both creators converge on the same writer.** Legacy: `finalize-step.tsx:170` `cleanForSave(...)` → `createCharacter`. Guided: `reveal-step.tsx:173` `cleanForSave(...)` → `createCharacter`. Same `SAVEABLE_FIELDS` allow-list (`lib/data-enrichment/clean-for-save.ts:14-64`), same lean ancestry/archetype/skills/feats/powers/equipment normalisation.

### Field-by-field diff of what reaches Supabase

| Field | Legacy (`character-creator-store.ts:427-551` + `finalize-step.tsx`) | Guided (`build-character.ts:346-388`) | Risk |
|---|---|---|---|
| `skills` | Record → array at `finalize-step.tsx:158-166`, `includeBaseSkillName: true`, no species ids | array at `:233`, species ids passed, no base-skill name | Cosmetic diff on the sheet; see §4.8 |
| `skillAbilities` | **Written to draft, never saved** (`getCharacter()` omits it; not in `SAVEABLE_FIELDS`) | n/a | **Data loss — §6 P1-3** |
| `defenseVals` | `draft.defenseVals` (player-allocated) | always `DEFAULT_DEFENSE_SKILLS` | Guided cannot express defense bonuses |
| `notes` | `draft.notes` | never set | Guided characters have no notes |
| `health` / `energy` objects | not emitted; back-filled by `clean-for-save.ts:122-139` | emitted directly at `:361-362` | None — same end state |
| `appearance` | `mergeAgeIntoAppearance` (`finalize/appearance-age.ts:8`) | inline `Age: ${age}\n…` (`build-character.ts:384`) | Same convention, two implementations |
| `currency` | `draft.currency ?? 200` (`store:512`) | `draft.currency ?? computeStartingCurrency(1)` (`:336-337`) | Identical at level 1 |
| `archetype` | `{ id: draft.archetype.id, type }` (`store:452`) | `{ id: String(ctx.archetype.id), type }` else `{ id: type, type }` (`:342-344`) | Guided's no-path fallback writes `id === type` (e.g. `"martial"`). Sheet resolves via `getArchetypeCodexLookupId`; verify it tolerates a type-as-id |
| `proficiencies` | `buildRequiredProficiencies` from full draft objects (`store:475`) | same fn, but ids re-resolved against official+user libraries first (`:317-333`) | Equivalent |
| `archetypeChoices` | read at `powers-step.tsx:111`, **never written** by the creator | n/a | Dead read (P3) |

### Migration / back-compat code

- `character-creator-store.ts:557-567` — `version 2`, migrate = **discard and reset**. No historical data touched (localStorage only).
- `guided-creator-store.ts:387-558` — `version 11`, ten forward migrations. localStorage only.
- Saved-character back-compat lives entirely in `clean-for-save.ts` (`:115-120` health/energy pool migration, `:180-182` legacy `species` string → `ancestry.name`, `:198-204` skills Record → array) and `lib/character/schema-normalize.ts`. **None of it is keyed to which creator produced the row.**

### Verdict

**Deleting the legacy creator cannot corrupt existing user characters.** Both stores are localStorage-only, neither is read at character load, and no saved column or JSON key is creator-specific. The only user-visible loss at deletion time is any in-flight `character-creator-storage` draft in a browser — which the store already discards on any schema bump.

**No dead DB columns identified.** `sql/supabase-ui-tooltips.sql:135-333` contains 19 tooltip rows scoped `page:/characters/new` — those target the *chooser*, which survives; only the Legacy-card copy needs review.

---

## 6. Bugs found in legacy code

### P1 — user-visible today

**P1-1 · HE-pool gate contradicts its own allocator when `core_rules` overrides progression.**
`character-creator-validation.ts:323` and `:468` call `calculateHealthEnergyPool(level, 'PLAYER', false)` with no `rules`; `finalize/health-energy-section.tsx:35` calls it *with* `rules`. On the same screen the allocator can read "0 remaining" while Review-&-Create reports "you have N Health-Energy points to allocate". Conditional on a non-default `PROGRESSION_PLAYER` row. Fix: thread `rules` (already on `ValidationContext.rules`, destructured at `:67` and used only at `:218`).

**P1-2 · Innate Energy budget is not enforced.** `steps/powers-step.tsx:319-328`. A player can mark every selected power innate; the cap is advisory copy only (`powers/powers-selected-section.tsx:57-62`). Guided blocks this (`steps/use-powers-techniques-selection.ts:112-124`). The over-budget character saves and only surfaces on the sheet as `innateEnergyOverBudget` (`use-library-section-rows.ts:254`).

**P1-3 · Per-skill governing-ability choice is silently discarded on save.** `steps/skills-step.tsx:147-152` writes `draft.skillAbilities`; `character-creator-store.ts:491-551` `getCharacter()` never returns it; `skillAbilities` is absent from `SAVEABLE_FIELDS`. `buildCreatorSkillSaveRows` then stamps `ability` from the codex **first** listed ability (`build-creator-skills.ts:65`), overwriting the choice. `clean-for-save.ts:217` faithfully persists the wrong value. A player who picks Intelligence for Lockpick gets Agility on the sheet.

**P1-4 · Equipment TP spend is computed by a formula the guided creator disagrees with, and ignores `core_rules`.** See §4.1. Two different definitions of "TP spent on equipment" ship simultaneously.

### P2

- **P2-1** `character-creator-validation.ts:242-245, :454-457` hard-code archetype feat counts instead of calling `calculateMaxArchetypeFeats` (§4.4).
- **P2-2** `character-creator-validation.ts:298` uses flat `CHARACTER_STARTING_CURRENCY` where the step uses level-scaled `computeStartingCurrency` (§4.5).
- **P2-3** Species-granted skills can be omitted from the save when the user reaches Finalize via the tab bar rather than Continue (§4.8). `canNavigateToStep` (`character-creator-store.ts:209-225`) permits the jump once `skills` is in `completedSteps`.
- **P2-4** `equipment-step.tsx:80-83` builds a `validationContext` without `rules`, so equipment validation is rules-blind even though `useGameRules` is available in sibling steps.
- **P2-5** Unarmed Prowess TP cost (`computeUnarmedProwessTpCost`, 10 + 6×(n−1)) is displayed in both creators but added to **neither** TP budget (`equipment-step.tsx:186-201`, `loadout-step.tsx:95-100`). A player can take Unarmed Prowess V for free.

### P3

- **P3-1** `steps/powers-step.tsx:111` reads `draft.archetypeChoices`, which nothing in the creator ever writes (it is a sheet-level P-M milestone field). Always `{}`.
- **P3-2** `draft.level` is read in 10 legacy files but never written — there is no level control in the creator. Dead parameterisation carrying the level-scaling bugs above.
- **P3-3** `getAllValidationIssues` (`character-creator-validation.ts:352-404`) excludes `'finalize'` from its step loop and re-implements the name + HE checks inline (`:370-401`), duplicating `getValidationIssuesForStep`'s finalize branch (`:315-342`) — with the `rules` argument present in one copy and absent in the other.
- **P3-4** `steps/finalize-step.tsx:173-188` hand-rolls `sanitizeForJsonb` to strip `undefined`, duplicating `removeUndefinedValues` already applied inside `cleanForSave` (`clean-for-save.ts:70-85, :398`). Guided omits it. Dead 16 LOC.
- **P3-5** `finalize-step.tsx:240` leaves `saving === true` when the Play-Together modal opens; if the user dismisses via a path that does not call `scheduleCreatorReset`, the Create button stays disabled. Guided has the identical pattern (`reveal-step.tsx:203`) but additionally guards with `savedCharacterId`.
- **P3-6** `character-creator-store.ts:24` exports a game constant (`CHARACTER_STARTING_CURRENCY`) from a UI store, forcing four guided-side modules to import a legacy store. Layering inversion; it is the single reason the store cannot be deleted outright.
- **P3-7** `lib/creator/advanced-equipment-catalog.ts:11` imports `wouldExceedCurrency` from `lib/guided-creator/equipment-currency.ts` — the legacy lib depends on the new lib. Harmless for deletion order (new survives), but confirms `lib/guided-creator/` is already the shared home.

---

## 7. Ordered deletion plan

Each step is independently shippable and leaves `npm run build` green.

### Step 0 — Close the 2 blocking parity gaps *(add ~120 LOC)*
1. Defense-bonus allocation in `guided-skills-panel.tsx`; persist `defenseVals` in `GuidedDraft` and emit it at `build-character.ts:380` instead of the hard-coded default.
2. Per-skill ability picker in `guided-skills-panel.tsx` → `GuidedDraft.skillAbilities`; pass through `buildCreatorSkillSaveRows` so `skill.ability` reflects the choice (this also fixes **P1-3** for the guided creator, which inherits the same defect).
3. Optional: `notes` textarea on the Reveal step (P2 gap).

**Recommended before Step 0:** fix **P1-1**, **P1-2**, **P1-4** in place if the Legacy card will remain live for more than one release. If deletion ships immediately, skip — the bugs leave with the code. **P1-3 must be fixed in guided regardless**, since `buildCreatorSkillSaveRows` is shared.

### Step 1 — Extract SHARED components *(0 LOC removed; 787 LOC moved)*
Move to `src/components/shared/`, update the barrel + ADR/allowlist (`scripts/shared-ui-allowlist.json`), repoint 9 importers:
`AbilityPickButton` (53) · `creator-portrait-upload` (254) · `mixed-species-skill-picker` (90) · `MixedSpeciesModal` (151) · `PathHelpCard` (66) · `TraitSection` (173).
Importers to repoint: `character-sheet/edit-archetype-modal.tsx`, `edit-species-modal.tsx`, `edit-species-ancestry-step.tsx`, `archetype-path-identity.tsx`, `guided-creator/guided-path-custom-archetype.tsx`, `guided-portrait-upload.tsx`, `steps/species-step.tsx`, `steps/ancestry-step.tsx`.

### Step 2 — Extract SHARED lib symbols *(0 LOC removed; ~150 LOC moved)*
- `CHARACTER_STARTING_CURRENCY` → `lib/game/constants.ts`. Repoint 4: `stores/guided-creator-store.ts:32`, `lib/guided-creator/path-selection-draft.ts:7`, `lib/guided-creator/equipment-currency.ts:14`, `lib/creator/advanced-equipment-catalog.test.ts:26`.
- `lib/creator/build-creator-skills.{ts,test.ts}` (142) → `lib/character/`. Repoint `lib/guided-creator/build-character.ts:30`.
- `UNARMED_PROWESS_BASE_TP` / `UNARMED_PROWESS_UPGRADE_TP` / `computeUnarmedProwessTpCost` / `availableUnarmedProwessLevels` (~8 LOC + the `UNARMED_PROWESS_LEVELS` table) → `lib/game/unarmed-prowess.ts`. Repoint `lib/library/power-technique-character-context.ts:13`.
- `finalize/appearance-age.ts` (13) → `lib/character/appearance-age.ts`; refactor `build-character.ts:384` to use `mergeAgeIntoAppearance` (removes §5 duplication).

### Step 3 — Cut the route *(−179 LOC)*
- Delete `src/app/(main)/characters/new/advanced/` (71).
- Remove the `legacy` entry from `MODES` in `characters/new/page.tsx:37-43` (~8) and `chooser.modes.legacy` from `lib/constants/copy/guided-creator-copy.ts`.
- Add a redirect `/characters/new/advanced` → `/characters/new` for bookmarked links.
- Delete `tests/visual/creator-ux-audit.pw.ts` (154) + `playwright.creator-audit.config.ts` (25).
- Update `src/docs/ai/BUILD_VALIDATION.md` — 24 DEV-V rows reference `/characters/new/advanced`.

> After this step the entire step tree is unreachable. Ship and soak here if you want a rollback window.

### Step 4 — Delete the component tree *(−7,959 LOC)*
`src/components/character-creator/` in full: `steps/**` (7,397) + the 4 remaining root files (`creator-step-footer` 93, `creator-tab-bar` 196, `index.ts` 7, `species-modal` 266 = 562). Directory ceases to exist.

### Step 5 — Delete legacy libs *(−1,244 LOC)*
- `lib/creator/advanced-powers-selectable.{ts,test.ts}` (331).
- `lib/creator/advanced-equipment-catalog.ts` remainder (~522) + trimmed test (~270).
- Delete `hooks/use-creator-path-data.ts` (41) + `hooks/index.ts:12` export; regenerate `FEATURE_INDEX_BARRELS.generated.md`.
- `lib/creator/` now contains nothing — remove the directory.

### Step 6 — Delete store + validation *(−1,001 LOC)*
- `src/lib/character-creator-validation.ts` (452).
- `src/stores/character-creator-store.ts` (549 after the const move) + `stores/index.ts` export.

### Step 7 — Reap the orphan shell *(−135 LOC)*
`src/components/shared/guided-choice/guided-choice-shell.tsx` (135), its exports in `guided-choice/index.ts:1-2` and `shared/index.ts:297-301`, its entry in `scripts/shared-ui-allowlist.json`, and its ADR. `GuidedLayerNav`, `GuidedInlineCatalogList` (ADR-0012) and `guided-nav-button-styles` stay — they are genuinely guided.

### Step 8 — Optional consolidation *(net ~−250 LOC)*
- Collapse `getTotalSkillPoints` into `calculateSkillPointsForEntity` and thread `rules` (§4.3) — also fixes the guided skill budget.
- Rename `src/components/creator/` → `src/components/entity-creator/` to end the naming collision (20+ import updates, 0 behaviour change).

### LOC ledger

| Step | Removed | Cumulative |
|---|---:|---:|
| 0 — parity | **+120** | +120 |
| 1 — extract components | 0 (787 moved) | +120 |
| 2 — extract lib symbols | 0 (~150 moved) | +120 |
| 3 — route + e2e | −179 | −59 |
| 4 — `character-creator/**` | −7,959 | −8,018 |
| 5 — `lib/creator/**` + hook | −1,244 | −9,262 |
| 6 — store + validation | −1,001 | −10,263 |
| 7 — `GuidedChoiceShell` | −135 | −10,398 |
| 8 — consolidation | ~−250 | **~−10,648** |

**Deletable today with zero extraction work: 0 LOC.** Nothing in the legacy tree is dead; it is all reachable from the live Legacy card. **Deletable after Steps 1–2 (≈940 LOC of moves): 10,514 LOC.** **Must be preserved: 2,745 LOC** (1,808 `components/creator` + 787 `character-creator` shared + 142 `build-creator-skills` + ~8 unarmed-prowess).

---

## 8. Verification checklist for the migration PR series

- [ ] `npm run build` after each step.
- [ ] `npm run tasks:validate` (strict reconcile; `TASK-###` in commit subjects; `related_files` must exist).
- [ ] `npm run tasks:generate-index` after the `hooks/index.ts` and `shared/index.ts` export changes.
- [ ] `npm run tasks:validate-shared-ui` after Step 1 (6 new `shared/` files) and Step 7 (1 removal).
- [ ] Vitest: `advanced-equipment-catalog.test.ts` trim, `build-creator-skills.test.ts` relocation, `build-character.test.ts` (imports `CHARACTER_STARTING_CURRENCY` from the legacy store at `:3`), `path-selection-draft.test.ts:12` (same import).
- [ ] `BUILD_VALIDATION.md`: retire DEV-V-001/008 Advanced rows (24 references), keep the guided rows.
- [ ] Manual QA: create one character via Guided and one via Custom; confirm the sheet renders skills (with `baseSkill`), defense bonuses, feats, equipment, proficiencies, and Innate Energy identically to a pre-migration Legacy-created character.
