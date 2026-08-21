# Rules Engine Audit — RealmsRPG

**Date:** 2026-08-13
**Scope:** `src/lib/game/**`, `src/lib/calculators/**`, `src/lib/chip/**`, `src/lib/glr/**`, `src/lib/detail-option/**`, `src/lib/constants/**`, checked against `src/docs/GAME_RULES.md`.
**Mode:** read-only. No files changed except this report. Live DB touched with `SELECT` only (allowed by `realms-codex-data.mdc`) to quantify numeric hazards against real codex values.
**Auditor note:** Every claim below was verified by reading the code. Where a suspected hazard turned out to be unreachable with current data, it is downgraded and labelled as such rather than reported as live.

---

## 0. Executive summary

The core progression math (`lib/game/formulas.ts`) is in good shape: I verified the Power, Martial and Powered-Martial progression tables level-by-level against the doc and they match exactly. The damage is concentrated in three places:

1. **The character sheet re-implements rules instead of calling the engine.** Two of those re-implementations are numerically wrong today (`Math.floor` where the rule says round up; a hardcoded skill-point total that disagrees with the creator).
2. **`powAbil || martAbil` is used where the rules say "the higher of the two."** Seven call sites, all copied from each other. Powered-Martial characters are systematically short on max Energy.
3. **Cost rounding contradicts the doc's global rounding rule.** Energy rounds up at the end (correct); Training Points floor per part (doc says complete all calculations, then round up).

Numeric hygiene is better than expected: `parseInt` always passes a radix, `Number.isNaN`/`Number.isFinite` guards are used consistently in the newer files, and — verified against the live DB — every codex Energy/TP/IP value is a dyadic rational, so the float arithmetic in the cost engines is currently exact. The float hazards are latent (one admin edit away), not live.

---

## 1. Formula-vs-doc comparison

### 1.1 Verified CORRECT (coverage evidence)

These were checked line-by-line against the doc, including boundary levels where the doc gives a full table.

| Rule | Code | Doc | Verification |
|---|---|---|---|
| Ability points 7, +1 every 3 levels | `game/formulas.ts:50-65` | :448 | L1=7, L3=8, L6=9, L9=10, L20=13 |
| Proficiency 2, +1 every 5 levels | `game/formulas.ts:146-161` | :451 | L1=2, L5=3, L10=4, L15=5, L20=6 — matches both progression tables (:506-525, :533-554) |
| Innate Threshold (Power) | `game/formulas.ts:365-372` | :527 | All 20 rows of the Power table (:506-525) reproduce exactly |
| Innate Pools (Power) | `game/formulas.ts:377-384` | :529 | L1=2 … L20=8 ✓ |
| Innate Energy = Threshold × Pools | `game/formulas.ts:445` | :528 | L1=16, L4=27, L20=112 ✓ |
| Martial archetype feats = level + 2 + floor((level−1)/3) | `game/formulas.ts:223-242` | :498 | All 20 rows of the Martial table (:533-554) reproduce exactly |
| Character feats = level | `game/formulas.ts:247-249` | :492 | ✓ |
| Powered-Martial innate: 6→8 first pick, +1 after | `game/formulas.ts:462` | :580 | ✓ (covered by test) |
| Armament Prof by Martial Prof (0→3 … 6→24) | `game/constants.ts:111-122` | :586-594 | ✓ |
| Ability increase cost (1 below 4, 2 at 4+) | `game/formulas.ts:259-280` | :265-270 | 3→4 costs 1, 4→5 costs 2; cumulative cost to 5 = 6 ✓ |
| Unproficient bonus (½ round up, ×2 if negative) | `game/formulas.ts:38-40` | :32 | ✓ |
| Base/sub-skill bonus formulas | `game/formulas.ts:590-654` | :340-343 | All four doc rows ✓ |
| Skill point costs (prof 1; +1/rank; past cap 3 base / 2 sub; defense 2) | `game/skill-allocation.ts:138-146, 233-268` | :362-367 | ✓ |
| Defense Bonus = Ability + skill increases; Score = 10 + Bonus | `game/calculations.ts:39-55` | :293-294 | ✓ |
| Evasion = 10 + Agility | `game/calculations.ts:77-80` | :295 | ✓ |
| Speed = 6 + ½ Agility (round up) | `game/calculations.ts:68-71` | :745 | ✓ |
| Terminal = ¼ max HP round up | `game/calculations.ts:233-235` | :796 | ✓ |
| Max Health = 8 + Vit×level; negative Vitality applied once | `game/calculations.ts:85-104` | :458-461, :81 | ✓ incl. the Vitality-is-archetype → Strength swap |
| HP/EN pool 18 +12/level (player), 26 (creature) | `game/formulas.ts:88-107`, `constants.ts:18,23,31` | :450, :471 | ✓ |
| Training points 22 + ability + (2+ability)(level−1) | `game/formulas.ts:167-173` | :452 | ✓ |
| Creature currency 200 × 1.45^(level−1) | `game/formulas.ts:213-218` | :474 | ✓ |
| Creature skill points 5 at L1, +3/level | `game/formulas.ts:76-80` | :359-360 | ✓ |
| Successes/failures (+1 per 5 over/under) | `game/encounter-utils.ts:18-25` | :402-407 | ✓ incl. critical at ±10 |
| Weapon attack ability (Finesse→AGI, Thrown→STR, Ranged→ACU, else STR) | `game/weapon-attack-ability.ts:109-123` | :711-717 | ✓ priority order correct |
| Creature negative-Vitality health rule | `game/encounter-utils.ts:98` | :81 | ✓ |
| Creature level quarter-fraction display | `game/creature-level-display.ts` | :476 | ✓ incl. FP snapping |
| XP to level up = level × 4 | `character-sheet/use-character-sheet-derived.ts:284` | :74 | ✓ |
| Armor exceptions (Psychic/Spiritual/Sonic) | `game/creator-constants.ts:92` | :608 | ✓ |
| Size / carrying capacity table | `game/creator-constants.ts:163-171` | :759-768 | ✓ all 8 rows |
| Levels by rarity | `game/creator-constants.ts:180-188` | :614-622 | ✓ |
| Power Energy rounds up at the end | `calculators/power-calc.ts:176` | :227 | ✓ |

### 1.2 Code-vs-doc MISMATCHES

| # | Sev | Rule | Code | Doc | Disagreement | Which is intended |
|---|---|---|---|---|---|---|
| M1 | P0 | Unproficient unarmed **Attack Bonus** | `components/character-sheet/archetype-section.tsx:222` | :32, :731 | `Math.floor(ability/2)` instead of `Math.ceil`. STR 3 → sheet shows **+1**, rule says **+2**. Wrong for every odd positive ability (1,3,5,7,9). | **Doc.** `unproficientBonus()` (`formulas.ts:38`) already implements it correctly and is used everywhere else. |
| M2 | P0 | Unproficient unarmed **damage** | `archetype-section.tsx:230` | :731 | `Math.max(1, Math.floor(ability/2))`. Same floor error, **plus** the `Math.max(1,…)` discards the "double the negative" rule entirely: STR −2 → shows **1**, rule says **−4**. | **Doc.** Should be `unproficientBonus(ability)`. A separate min-1 display floor, if wanted, is a product decision — but it must not silently swallow the negative case. |
| M3 | P0 | Max Energy uses the **higher** Archetype Ability | `game/calculations.ts:301`, `:351`; `stores/character-creator-store.ts:448`; `components/character-creator/steps/finalize/health-energy-section.tsx:33,41`; `components/character-creator/steps/finalize-step.tsx:116`; `components/guided-creator/guided-health-energy-section.tsx:41,57`; `lib/guided-creator/build-character.ts:174` | :142, :461 | All seven sites pass `powAbil \|\| martAbil`, i.e. Power ability always wins. A Powered-Martial character with pow_abil INT 1 / mart_abil STR 3 loses **2 Energy per level** (20 at level 10). | **Doc.** `getArchetypeAbilityScore()` (`calculations.ts:122-139`) already computes `Math.max(powVal, martVal)` and is not used for Energy. |
| M4 | P0 | Total skill points | `components/character-sheet/use-character-sheet-derived.ts:233` and `:298` (`2 + level*3 - speciesCount + (hasAny?1:0)`) vs `formulas.ts:82` / `skill-allocation.ts:130` (`3 * level`) | :358, :361 | Sheet and creator disagree whenever the species has ≠2 concrete skills: 1 concrete + 1 "Any" → sheet is **+1**; 0 species skills or a failed species lookup → sheet is **+2**. Same file uses the engine function at `:454`, so one hook reports two different totals. | **Doc + `calculateSkillPointsForEntity`.** The doc says 3/level flat and species skills are free; it never says species skills consume the pool. The `2 +` / `− speciesCount` dance is undocumented. |
| M5 | P1 | Defense bonus cap | `game/skill-allocation.ts:161-162` | :369 | `totalBonus = currentDefenseBonus + abilityBonus; if (totalBonus >= level) return false`. Doc: *"Defense bonuses from **skill point allocation** cannot exceed character level. **Ability-derived defense bonus is unrestricted.**"* A level-3 character with Agility 3 cannot buy a single point of Reflex. | **Doc.** Compare only the skill-point portion against level. |
| M6 | P1 | Training Point rounding | `calculators/power-calc.ts:157`, `technique-calc.ts:211`, `part-training-points.ts:40` | :227 | Code floors **per part**. Doc: *"Complete all calculations first, then round up only at the end."* Three Elemental Damage rows at raw 2.5 TP each → code **6**, doc-correct **ceil(7.5) = 8**. | **Ambiguous — owner decision.** Energy already follows the doc (ceil at the end); TP does not. The behaviour is locked in by `power-calc.test.ts:124`, and the inline comment at `power-calc.ts:149` says *"floor entire sum"* while the code floors per part. Pick one and make the comment, doc and test agree. |
| M7 | P1 | Ability minimum | `game/constants.ts:44` (`MIN: -2`), consumed by `formulas.ts:307` | :249, :259 | `canDecreaseAbility` uses −2 as the **absolute** floor. Doc: absolute min is **−5**; −2 is the *creation* limit only. | **Doc.** Needs the same creation/non-creation split `canIncreaseAbility` already has. |
| M8 | P2 | Proficiency split on path switch | `game/archetype-edit.ts:51-52` | :582 | `redistributeProficiency` forces `mart = ceil(total/2), pow = floor(total/2)`. Doc: *"Every 5th level: +1 to **either** Martial or Power Proficiency"* — a player choice. | **Doc**, though a sensible default is fine if the UI lets the player change it. Today it silently favours Martial. |
| M9 | P2 | Powered-Martial archetype feats | `formulas.ts:238` returns `level + 1` | :500 | Ignores milestone choices, which `calculateArchetypeProgression` (`formulas.ts:452-467`) *does* track. Two functions, two answers, for the same character. | **`calculateArchetypeProgression`.** `calculateMaxArchetypeFeats` should delegate or be scoped. |
| M10 | P2 | Feat level ≤ ½ character level | not implemented anywhere (grepped `src/`) | :54 | Only `lvl_req` (codex data) and the leveled-feat prerequisite chain are enforced (`game/feat-requirements.ts:174, :231`). A level-2 character can take a Feat Level 5 ability if its `lvl_req` allows. | **Doc**, if the ½ rule is still live. If it was superseded by `lvl_req`, delete it from the doc. |
| M11 | P2 | Rarity ↔ currency | `calculators/item-calc.ts:102-110, 218` | :826-834 | Code derives rarity from **IP** and then prices it; the doc defines rarity **by currency range**. Bracket floors also differ (Common 25 vs doc 0; Epic 2500 vs doc 1500). Worse, `currencyCost = low × (1 + 0.125 × c)` is unbounded — an item labelled Uncommon can price at 600, which is the doc's **Rare** band. | **Needs a product ruling.** Either clamp `currencyCost` to the bracket ceiling, or make the doc say rarity is IP-derived and currency is uncapped. |
| M12 | P2 | Creature Speed | `app/(main)/creature-creator/creature-creator-derived-stats.ts:140`, `components/shared/creature-stat-block.tsx:114` | :745 | Both add a **size modifier** (`+sizeModifier`, −3…+4) that the doc's Speed formula does not mention. | **Code is probably right; doc is missing the rule.** Add it to `GAME_RULES.md` and move it into `calculateSpeed`. |
| M13 | P3 | Unproficient Sub-Skill when the *base* skill is unproficient | `formulas.ts:647-648` | :343 | Doc's "Unproficient Sub-Skill" row is `Ability + Base Skill Value`; code returns `unproficientBonus(ability) + baseSkillValue` when the base is unproficient. Unreachable in practice (base value is 0 without proficiency) but the doc doesn't cover the case. | **Code.** Add the case to the doc. |
| M14 | P3 | Doc gaps (rules that exist only in code) | `constants.ts:102-105` (Range = 8 + 8×level), `power-calc.ts:391,409` (Power Range = 3 + 3×steps), `creator-constants.ts:12-18` (Long Action 3 AP / 4 AP), `game/crafting-utils.ts` (**the entire crafting system**), `encounter-utils.ts:92-112` (creatures have no +8 base health) | — | None of these appear in `GAME_RULES.md`. Crafting is the big one: ~470 lines of cost/time/DS math with no written authority to audit against, driven entirely by `core_rules.CRAFTING`. | **Doc must catch up.** Crafting numbers are unauditable today. |

---

## 2. Numeric hazards

| # | Sev | Hazard | Location | Detail |
|---|---|---|---|---|
| N1 | P1 | `parseFloat(String(level)) \|\| 1` makes **level 0 become level 1** | `formulas.ts:51, 94, 147, 179, 196, 214` | `parseFloat('0')` is `0`, which is falsy, so `\|\| 1` fires. The `if (parsedLevel < 1) return 0` guard on the next lines is **unreachable for 0** and the `allowSubLevel` branch never sees 0 either. Six functions affected. Creature levels are legitimately sub-1 (¼, ½, ¾ — `creature-level-display.ts:106`), so this is a live input range. |
| N2 | P1 | Empowered technique EN ≠ technique EN for repeated percentage parts | `empowered-technique-calc.ts:28-42` vs `technique-calc.ts:175` | `calculateTechniqueCosts` runs `dedupeSavedParts` first; `getTechniquePercentageMultiplier` does not. A payload carrying the same percentage part twice gets the multiplier **squared** on the power side of an empowered technique but applied once on the technique side. |
| N3 | P1 | Proficiency silently lost in feat checks | `game/feat-requirements.ts:265` | `characterToFeatRequirementCharacter` maps a numeric skill entry to `{ val: sk }` with **no `prof`**. Downstream `readProficiency` (`formulas.ts:696`) then returns `s?.prof ?? false`, so every skill-gated feat reports *"Requires proficiency in X."* The numeric branch of `readProficiency` (`formulas.ts:693`) would have handled it correctly if the number had been passed through unchanged. |
| N4 | P2 | NaN can reach the points-remaining UI | `game/skill-allocation.ts:264` | `Object.values(defenseSkills).reduce((a, b) => a + b, 0)` with no `?? 0`. One `undefined` in a partial `DefenseSkills` object (legacy saves, hand-edited JSON) ⇒ `NaN` spent ⇒ `NaN` remaining rendered. Contrast `creature-creator-derived-stats.ts:113-132`, which does guard every reducer with `Number.isFinite`. |
| N5 | P2 | Negative total Energy is possible and then silently hidden | `power-calc.ts:176`, `technique-calc.ts:223`, masked at `detail-option/compact-facts.ts:339` | Neither cost function clamps to ≥ 0. Codex parts have `base_en` down to **−3** (verified in DB), and reduction parts like *No Attack* exist by design. `formatEnergyFact` then does `Math.max(0, Math.floor(...))`, so a −2 EN technique displays "Energy 0" with no warning. Clamp in the engine, not the formatter. |
| N6 | P2 | Float-fragile Energy equation | `power-calc.ts:172-175` | `(dur_all + 1) * flat_duration * perc_dur − flat_duration * perc_dur` is algebraically just `dur_all * flat_duration * perc_dur`. Written this way it does two extra FP operations before `Math.ceil`, so any representation error becomes a **whole extra Energy point**. **Currently safe:** I queried the live codex — every percentage `base_en` is in {0.5, 0.75, 0.875, 1.125, 1.25, 1.5, 1.75}, duration values go down to 0.125, and the only sub-⅛ value is −0.0625. All dyadic, so all products are exact. It breaks the first time an admin types `1.1` or `0.3`. Simplify the expression and/or round to a fixed precision before `ceil`. |
| N7 | P2 | Rarity bracket gap | `item-calc.ts:103-109` | Brackets are `ipHigh: 4` / `ipLow: 4.01` etc., leaving six 0.01-wide holes. An IP landing in a hole matches **no** bracket, falls through to `rarity = 'Common'`, and is priced at 25. **Currently unreachable:** 31 of 53 codex properties have fractional IP but every value is a multiple of 0.25 (verified: {−1.5, −0.5, −0.25, 0.5, 0.75, 1.25, 1.5}), and dyadic sums are exact. One finer-grained IP value in admin opens the hole. Use `ip <= 4` / `else if (ip <= 6)` chaining instead of paired bounds. |
| N8 | P2 | Percentage part with `base_en = 0` zeroes the whole power | `power-calc.ts:142` | `perc_all *= energyContribution` — a missing/zero percentage value silently produces 0 total Energy rather than an error. No codex row has this today (`zero_base_en = 0` for percentage parts), but nothing prevents it. |
| N9 | P3 | Unbounded / unclamped derived values | `calculations.ts:102, 116` | `maxHealth`/`maxEnergy` have no lower clamp. A −2 archetype ability at level 10 yields −20 max Energy. Health is protected by the negative-once rule; Energy is not (and the doc has no negative-Energy-ability rule to point at). |
| N10 | — | **Checked and clean** | — | `parseInt` always passes radix 10 (`item-calc.ts:241,251`, `technique-calc.ts:203`, `part-training-points.ts:31`, `id-constants.ts:302-303,335,342`). `Number.isNaN`/`Number.isFinite` guards are used consistently in `compact-facts.ts`, `creature-level-display.ts`, `encounter-utils.ts`, `innate-eligibility.ts`. Supabase `numeric` columns are returned as JSON numbers by PostgREST, so no `"2" + 2 = "22"` string-concat path exists through the cost engines. |

---

## 3. Duplicate rule implementations

Every pair below computes the same rule in two or more places. These will drift.

| # | Sev | Rule | Implementations | Already divergent? |
|---|---|---|---|---|
| D1 | P0 | Total skill points | `formulas.ts:82` · `skill-allocation.ts:130` · `use-character-sheet-derived.ts:233` · `use-character-sheet-derived.ts:298` | **Yes** — see M4. Also two *identical* engine functions (`calculateSkillPointsForEntity` / `getTotalSkillPoints`) for the same formula. |
| D2 | P0 | Unproficient half-ability bonus | `formulas.ts:38-40` (`ceil`) · `archetype-section.tsx:222` (`floor`) · `archetype-section.tsx:230` (`floor` + `max(1,…)`) | **Yes** — see M1/M2. |
| D3 | P0 | "Which archetype ability?" | `calculations.ts:122-139` (`Math.max`, correct) · `calculations.ts:301` · `calculations.ts:351` · `character-creator-store.ts:448` · `health-energy-section.tsx:33,41` · `finalize-step.tsx:116` · `guided-health-energy-section.tsx:41,57` · `build-character.ts:174` (all `powAbil \|\| martAbil`) | **Yes** — see M3. |
| D4 | P1 | Speed | `calculations.ts:68-71` · `creature-creator-derived-stats.ts:140` · `creature-stat-block.tsx:114` | Partially — the two creature copies hardcode base `6`, so a `core_rules.COMBAT.baseSpeed` change would move players and leave creatures behind. |
| D5 | P1 | Evasion | `calculations.ts:77-80` · `creature-creator-derived-stats.ts:141` · `creature-stat-block.tsx:115` | Same — hardcoded `10`, ignores core rules. |
| D6 | P1 | Per-part Training Points | `power-calc.ts:150-157` · `technique-calc.ts:202-211` · `part-training-points.ts:29-40` | Not yet, but the "Additional Damage floors opt1 first" special case exists in two of the three and must be kept in sync by hand. |
| D7 | P1 | Damage option level `floor((dice×size − 4)/2)` | `mechanic-builder.ts:190-193` · `mechanic-builder.ts:199-206` · `technique-calc.ts:96-100` · `power-calc.ts:372-374` (inline) | Guards differ (`dieSize < 4` vs `total <= 0` vs call-site check); results agree for valid input. Four copies of one formula. |
| D8 | P1 | Percentage-multiplier accumulation | `technique-calc.ts:195-199` · `empowered-technique-calc.ts:32-41` | **Yes** — see N2 (dedupe applied in one, not the other). |
| D9 | P2 | Max Health / Max Energy entry point | `calculations.ts:256` (`calculateAllStats`) · `calculations.ts:320` (`computeMaxHealthEnergy`) | Two entry points with a comment at `:338` explicitly telling the reader to keep them matched by hand. One is used by the API route (`app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts:109`) and the save path (`lib/data-enrichment/clean-for-save.ts:127`), the other by the sheet. |
| D10 | P2 | Martial bonus archetype feats | `formulas.ts:233` (inline in `calculateMaxArchetypeFeats`) · `formulas.ts:389-396` (`calculateBonusArchetypeFeats`) | Equivalent today (the `level < 4` guard is a no-op because `floor((1..3−1)/3) = 0`), but they're two independent expressions of one table. |
| D11 | P2 | Skill-value cap | `skill-allocation.ts:20` (`SKILL_VALUE_CAP = 3`, live) · `constants.ts:56` (`SKILL_LIMITS.MAX_PER_SKILL = 3`, dead) | `SKILL_LIMITS.DEFENSE_MAX = 3` is worse than dead — it encodes a flat cap of 3 that **contradicts** the doc's level-based defense cap (:369). |
| D12 | P2 | Base-skill proficiency predicate | `formulas.ts:691` (`alloc >= 0`) · `skill-allocation-add.ts:40` (`alloc > 0`) | **Yes** — a base skill you paid 1 point for but put no ranks in reads as unproficient in the Add Sub-Skill modal, blocking sub-skill selection. |
| D13 | P2 | Damage-type → codex part mapping | `power-calc.ts:259-323` (two switch statements) · `mechanic-builder.ts:135-156` (a map) | Not yet — but `power-calc.ts:315` handles a `'physical'` key that its own `getDamagePartId` sibling at `:281` does not. |
| D14 | P3 | Levels-by-rarity table | `creator-constants.ts:180-188` · `item-calc.ts:102-110` (`RARITY_BRACKETS`) | Different axes (character level vs item IP) but the same seven rarity names, maintained separately. |

### Magic numbers that should come from the constants/caps tables

| Value | Location | Should be |
|---|---|---|
| `6` (speed base), `10` (evasion base) | `creature-creator-derived-stats.ts:140-141`, `creature-stat-block.tsx:114-115` | `COMBAT_DEFAULTS` / `rules.COMBAT` via `calculateSpeed` / `calculateEvasion` |
| `2 + level * 3` | `use-character-sheet-derived.ts:233, 298` | `calculateSkillPointsForEntity` |
| `2 + Math.floor(level / 5)` | `creature-creator-derived-stats.ts:74` | `calculateProficiency` (which is already imported and called two lines above at `:70`) |
| `val * 2` (defense cost) | `creature-creator-derived-stats.ts:155` | `DEFENSE_INCREASE_COST` |
| `1` / `2` / `−1` feat point fallbacks | `creature-creator-derived-stats.ts:80-83` | Named constants; today these are bare `?? 1`, `?? 2`, `?? -1` masking missing codex rows |
| `0.125` currency multiplier, bracket floors | `item-calc.ts:218`, `:103-109` | `core_rules` / constants — this is pricing policy inlined in a calculator |
| `8`, `2`, `3`, `4`, `5` fallbacks | `formulas.ts:229-230, 366-368, 378-380, 390-392, 402-403` | The `?? N` fallbacks behind `rules?.ARCHETYPES?.*` duplicate `ARCHETYPE_CONFIGS`; if the DB and constants disagree, which wins depends on the call path |

---

## 4. Purity and testability

**Good:** `formulas.ts`, `calculations.ts`, `skill-allocation.ts`, `power-calc.ts`, `technique-calc.ts`, `item-calc.ts`, `mechanic-builder.ts`, `dice-splits.ts`, `part-training-points.ts`, `encounter-utils.ts`, `crafting-utils.ts` and `innate-eligibility.ts` are pure functions of typed input with no store, fetch or global access. Rules come in through an explicit optional `rules?: Partial<CoreRulesMap>` parameter rather than a hook. This is the right shape and makes almost the whole engine testable as-is.

**Mutation:** I found no in-place mutation of a character object. `dedupeSavedParts` (`game/dedupe-saved-parts.ts:77`) builds a `merged` copy rather than writing to the input. `mergeEquipmentIntoInventory` (`skill-allocation.ts:58-82`) copies the array and spreads each row. `calculateAllStats` returns fresh objects (`calculations.ts:312-313`). `applyAddedBaseSkills`/`applyAddedSubSkills` (`skill-allocation-add.ts:48, 65`) both start from `{...allocations}`.

**Violations:**

| Sev | Issue | Location |
|---|---|---|
| P2 | `lib/game/archetype-display.ts` imports `SupabaseClient` and performs three `.from().select()` calls (`:51, :88, :95`) inside the `lib/game` rules namespace. Data loading and display-name resolution do not belong next to the formula modules; it makes `lib/game` un-importable from a pure test context without mocking. | `game/archetype-display.ts:1, 48-196` |
| P3 | `derivePowerDisplay` is used as a cost oracle by validation logic (`innate-eligibility.ts:209`) — that path only needs `calculatePowerCosts`, but pulls in range/area/duration string formatting to get one number. | `innate-eligibility.ts:203-219` |
| P3 | `calculatePowerSectionContribution` calls `calculatePowerCosts` three times to compute one badge (`:192, :198, :199`). Correct, but it makes the section badge cost 3× a full power recalculation. | `power-calc.ts:187-204` |

---

## 5. Types

| Sev | Issue | Location |
|---|---|---|
| P1 | Untyped DB rows flow into math. `computeMaxHealthEnergy` takes `Character \| Record<string, unknown>` and casts fields out one at a time (`record.level as number`, `record.healthPoints as number`). The API route (`app/api/campaigns/.../route.ts:109`) passes a raw Supabase row straight in. A schema rename produces `undefined` → `?? 1` / `?? 0` → a silently wrong max HP written back to the DB, not an error. | `calculations.ts:320-354` |
| P1 | `resolveArmorDamageReduction` uses a four-way `??` chain over `damageReduction ?? armorValue ?? armor ?? armor_value` (`:39-43`). Four field names for one concept means the type system cannot tell you which one a given row actually uses; a row with `armor: 0` correctly short-circuits, but a row with `armor: null` silently falls through to property derivation. | `game/resolve-armor-damage-reduction.ts:38-48` |
| P2 | `character as Record<string, unknown>` casts to reach normalizers. | `calculations.ts:195, 264, 327` |
| P2 | Codex `id` is `text` in Postgres but typed `string \| number` throughout, so every lookup does `String()`/`parseInt` coercion at runtime (`id-constants.ts:298-306`). A branded `PartId` type would remove ~30 coercions and the `"s377"` vs `377` alias handling in `dedupe-saved-parts.ts:23-28`. | `id-constants.ts:290-318` |
| P2 | `ActionConfig.type` is `'basic' \| 'quick' \| … \| string` — the `\| string` defeats the union entirely, so a typo like `'quik'` type-checks and silently falls through to "basic, no action part". Should be a discriminated union or a plain literal union. | `mechanic-builder.ts:40` |
| P2 | `getOptionLevel` branches on `pl.part !== undefined` to decide between two payload shapes (`power-calc.ts:76-81`). This is a hand-rolled discriminant on an interface that should be a discriminated union of `SavedPowerPart \| UiPowerPart`. | `power-calc.ts:29-81` |
| P3 | `formatWeaponAbilityFactFromProperties` uses a non-null assertion (`!`) on a function that is declared to return `string \| undefined`. | `detail-option/compact-facts.ts:148` |
| P3 | Enum-vs-literal inconsistency: damage types are `as const` arrays in `creator-constants.ts:37-92`, action types are `as const` in `:12-18`, but archetype categories are a TS type in `@/types`, and `GlrFactId` is a bare union in `glr/required-facts-registry.ts:13`. Four conventions for the same idea. | multiple |

---

## 6. Test quality

### What exists

15 test files in scope. Quality is genuinely mixed:

**Real rule assertions (good).** `formulas.test.ts:39-58` checks innate thresholds against named doc values (8 at L1, 9 at L4, 14 at L19) and the Powered-Martial 6→8→+1 sequence. `formulas.test.ts:21-26` asserts `unproficientBonus` at the negative, zero and odd-positive boundaries. `creature-feat-points.test.ts`, `creature-level-display.test.ts` and `item-calc-range.test.ts` assert stated outcomes rather than snapshots.

**Change-detector tests (weak).** `power-calc.test.ts:118-124` asserts `totalTP === 6` for three parts whose raw TP is 2.5 each. That number is the *output of the current rounding choice*, not a rule — and it is exactly the behaviour flagged in M6. The test will fail if TP is ever corrected to match the doc, which means it currently defends a possible bug. Same shape at `:147`, `:166-167`, `:301-303`: the comments explain the arithmetic of the implementation (`dur_all = 2, flat_normal = 4 → 4 + 2*4 = 12`) rather than citing a rule.

**No test at all** for: `calculations.ts` (the entire combat/derived-stat module — health, energy, defenses, speed, evasion, terminal, attack bonuses), `skill-allocation.ts`, `crafting-utils.ts` (~470 lines), `item-calc.ts` cost/rarity, `feat-requirements.ts`, `archetype-path.ts`, `encounter-utils.ts`.

### Highest-value missing tests

| # | Sev | Target | Case | Why |
|---|---|---|---|---|
| T1 | P0 | `calculateMaxEnergy` / `calculateAllStats` | Powered-Martial, `pow_abil` = intelligence 1, `mart_abil` = strength 3, level 10 → expect the **higher** ability (3) → `30 + energyPoints` | Directly pins M3; nothing guards it today |
| T2 | P0 | `unproficientBonus` parity | Table-drive the sheet's unarmed attack/damage against `unproficientBonus` for ability ∈ {−3,−2,−1,0,1,2,3,4,5} | Pins M1/M2 and prevents the next hand-rolled `floor` |
| T3 | P0 | `calculateSkillPointsForEntity` vs the sheet total | Level 1/5/20 × species with {2 concrete, 1 concrete + 1 "Any", 0 skills, unresolved species} — assert creator total == sheet total | Pins M4; the "unresolved species" row is the one that silently grants +2 |
| T4 | P1 | `canIncreaseDefense` | Level 3, ability bonus 3, current skill-point defense 0 → **must allow** (doc :369). Level 3, skill-point defense 3, ability 0 → must block | Pins M5 |
| T5 | P1 | Level boundaries on all six `parseFloat \|\| 1` functions | `level = 0` and `level = 0.25` for `calculateAbilityPoints`, `calculateProficiency`, `calculateHealthEnergyPool`, `calculateCreatureTrainingPoints`, `calculateCreatureFeatPoints`, `calculateCreatureCurrency` | Pins N1; sub-1 creature levels are a real product feature |
| T6 | P1 | `calculatePowerCosts` TP rounding | Assert the *chosen* rule explicitly with a comment citing `GAME_RULES.md:227` — either per-part floor or total ceil | Converts the existing change-detector at `power-calc.test.ts:124` into a rule test |
| T7 | P1 | `checkFeatRequirements` | Character whose `skills` is `Record<id, number>` and a feat with `skill_req` → must resolve proficiency correctly through `characterToFeatRequirementCharacter` | Pins N3 |
| T8 | P1 | `calculateEmpoweredTechniqueCosts` | Payload with the same percentage part twice → empowered EN must equal technique EN × power EN with the multiplier applied once | Pins N2 |
| T9 | P1 | `calculateAllStats` golden characters | Three fixtures — level 1 Power, level 10 Martial, level 20 Powered-Martial — asserting maxHealth, maxEnergy, terminal, speed, evasion, all six defense bonuses and scores against hand-computed doc values | The entire module has zero tests and is the single most player-visible surface |
| T10 | P1 | `calculateCurrencyCostAndRarity` | IP at every bracket boundary (4, 4.01, 6, 8, 11, 14, 16) and IP = 4.25/6.5; plus a high-`c` Uncommon item asserting the currency stays inside the doc's Uncommon band | Pins N7 and M11 |
| T11 | P2 | `crafting-utils.ts` | At minimum `getCraftingRequirements`, `calculateCraftingOutcome` and `getUpgradeRequirements` against a fixed `CraftingRules` fixture | 470 untested lines producing player-facing costs |
| T12 | P2 | Progression tables as data-driven tests | Loop levels 1–20 and assert `calculateArchetypeProgression` against the literal Power (:506-525) and Martial (:533-554) tables from the doc | These currently pass; a data-driven test makes the doc the oracle instead of three spot checks |
| T13 | P2 | `calculateSimpleSkillPointsSpent` | Species base skill, species sub-skill, non-species sub-skill at value 1/3/4 (past-cap) | Past-cap costs (3 base / 2 sub) are untested |
| T14 | P2 | `calculateAbilityScoreCost` | value ∈ {−2, 0, 1, 3, 4, 5, 10} and consistency with `getAbilityIncreaseCost` (cumulative == sum of increments) | The two functions must agree; nothing enforces it |
| T15 | P3 | `computeSkillRollResult` | roll == ds, ds±1 (partial), ds±5, ds±10 (critical) | Cheap, and the doc gives exact expectations |

---

## 7. Performance

| Sev | Issue | Location |
|---|---|---|
| P2 | `findByIdOrName` is a linear `Array.find` that allocates via `String()` and `parseInt` **per element**. The codex has 420 parts. `derivePowerDisplay` calls it once per part for costing plus once per part for chips, so rendering one power row is ~2 × parts × 420 string ops. Multiply by every row in a Library/Codex list. Build a `Map` once per parts array. | `id-constants.ts:290-318`, consumed at `power-calc.ts:117, 801`, `technique-calc.ts:178, 299` |
| P2 | `resolveItemPropertyCodexRow` does `const rows = [...propertiesData]` — a **full array copy per property lookup**, i.e. per property per item per render. | `item-calc.ts:267` |
| P2 | `calculateArmamentProficiency` copies and sorts the proficiency table on every call (`[...table].sort(...)`). The table is a module constant of 7 rows; sort it once. | `formulas.ts:345` |
| P2 | `calculatePowerSectionContribution` runs the full cost engine **three times** per section badge. | `power-calc.ts:192-199` |
| P3 | `calculateSimpleSkillPointsSpent` uses a per-rank `for` loop to sum increase costs (`:248, :253, :258`). Values are capped low so it's cheap, but it's an O(value) loop where a closed form exists. | `skill-allocation.ts:242-262` |
| P3 | `getMaxQualifiedFeatLevel` calls `checkFeatRequirements` for every feat in a family, and each call rebuilds `defenseVals` and re-runs `calculateDefenses`. Called per feat family per render in the sheet feats tab. | `feat-requirements.ts:283-296` |

No O(n²)-over-catalog loops found. The dominant cost is the repeated linear catalog scan described above.

---

## 8. Dead code

Verified by `rg` across `src/` (a symbol appearing only in its defining file and `lib/calculators/index.ts` is re-exported but unconsumed).

**Fully unreferenced:**

| Symbol | Location |
|---|---|
| `getSpeedBase` | `game/calculations.ts:215` |
| `getEvasionBase` | `game/calculations.ts:222` |
| `formatCostWithLabel` | `game/creator-constants.ts:298` |
| `getUpgradePotencyRequirements` | `game/crafting-utils.ts:311` |
| `SHARED_CONSTANTS.BASE_SKILL_POINTS` | `game/constants.ts:14` |
| `SKILL_LIMITS` (both members) | `game/constants.ts:55-58` |
| `GAME_CONSTANTS` | `game/constants.ts:92-99` |

**Superseded formula variants (still exported, still carrying duplicate rule math):**

| Symbol | Location | Superseded by |
|---|---|---|
| `buildPowerMechanicPartPayload` | `power-calc.ts:329-380` | `buildMechanicParts` — this is the file's inline copy of the damage-level formula (D7) |
| `buildPowerMechanicParts` | `mechanic-builder.ts:433-471` | `buildMechanicParts` (legacy wrapper) |
| `buildTechniqueMechanicParts` | `mechanic-builder.ts:476-490` | `buildMechanicParts` (legacy wrapper) |
| `computeAdditionalDamageLevel` | `technique-calc.ts:96-100` | `calculateTechniqueDamageLevel`; referenced only by a *comment* in `mechanic-builder.ts:201` |
| `calculateGoldCostAndRarity` | `item-calc.ts:230` | `calculateCurrencyCostAndRarity` (explicit legacy alias) |
| `formatProficiencyChip` | `item-calc.ts:517` | compact-facts chip formatters |

**Dead exports (used only inside their own module — should lose `export`):** `calculateBonuses` (`calculations.ts:157`), `sumInnatePowerEnergyCosts` (`formulas.ts:488`), `calculateBaseInnatePools` (`formulas.ts:377`), `calculateBonusArchetypeFeats` (`formulas.ts:389`), `characterSkillsToAllocations` (`skill-allocation.ts:182`), `getSuccessesTableEffect` (`crafting-utils.ts:111`), `extractProficiencies` (`item-calc.ts:447`), `calculatePowerDamageLevel` / `calculateTechniqueDamageLevel` (`mechanic-builder.ts:190, 199`), `getLevel1InnateBudget` (`innate-eligibility.ts:162`).

**Misleading comment:** `power-calc.ts:149` says `// TP calculation (floor entire sum)` directly above code that floors **per part**. See M6.

No commented-out rule code found.

---

## 9. Recommended order of work

1. **M1/M2** — replace both `Math.floor` expressions in `archetype-section.tsx` with `unproficientBonus()`. One-line fix, wrong numbers on the sheet today.
2. **M3** — introduce `getArchetypeAbilityForEnergy(character)` returning `Math.max(pow, mart)` and replace all seven `powAbil || martAbil` sites.
3. **M4** — delete both `2 + level * 3` expressions and call `calculateSkillPointsForEntity`; decide, and document, whether species skills consume the pool.
4. **M5** — fix the defense cap to compare only the skill-point portion.
5. **M6** — decide TP rounding, fix the comment, and rewrite `power-calc.test.ts:124` as a rule test.
6. **N1, N3** — level-0 coercion and the feat-requirement proficiency loss.
7. **D4/D5, D11** — route creature Speed/Evasion through the engine; delete `SKILL_LIMITS`.
8. **T9** — golden-character tests for `calculations.ts` before any further refactor of that module.
9. **M14** — write the crafting section of `GAME_RULES.md`. Until it exists, `crafting-utils.ts` cannot be audited by anyone.
