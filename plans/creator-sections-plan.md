# Creator sections — fix plan

Plan only. Checked on master `f57027a`. Dice: Kadin, Nov 20, 2026, 8:04 PM and 8:22 PM ET. Creators keep `{amount, size}`. Faces are d4, d6, d8, d10, d12 only (`DIE_SIZES`). No d2 in a creator, no d20, no mixed dice, no stepping. No dice-count cap: remove `max={20}` and `max={10}` on all seven amount steppers (power, technique, empowered power, empowered technique, weapon, shield block, shield damage). Power and technique may still show 0 in the editor, meaning no row; a saved pair is a whole number ≥ 1. Shield rows already start at 1.

The 10 and 12 in #620 are fixtures. Live `codex_parts` (same as `power-composition-parts.snapshot.json`): Magic Damage 3, Additional Damage 2, Quick ×1.25, Minute 0.75, Sphere ×1.25. Quick Action raw energy is 5.75 today and 6.25 after (published 6 then 7). A 1d4 with Apply duration and a minute badges 5.25 on power and 3 on empowered.

## Done when

- Quick, Free, Long, and Reaction scale both halves once. A non-action power percentage does not. The power half is not scaled twice.
- One `PART_IDS` section-cost function feeds damage, area, range, power parts, and power mechanics badges.
- `addMechanicPart` on the real hook inserts the first mechanic again. `nextMechanicPartToAdd` is deleted.
- Instant or 1 round clears and disables the four duration modifiers in both config components, via one pure function. Not from `empowered-technique-part-actions.ts`.
- One face list. Item `validSizes` and `computeSplits` use it. The seven steppers have no maximum.
- Every library save rejects a face outside `DIE_SIZES`, a non-whole count, or a count below 1, and accepts a large count. No schema check.
- The breakdown’s lines equal `energyRaw`.
- The empowered workspace hook warns only when `no-attack-creator-warning.ts` would: attack-dependent power parts or a cone, or technique damage parts. A buff does not warn. Any new subject line is `PLACEHOLDER_COPY` (Kadin) and does not say “this power”.
- One payload builder serves the cost hook and the four readers. With the power-parts codex they recompute. Without it they show a dash, never `totals.energy`.
- Empowered save does not dedupe `autoMechanics`. Chips and `composedPowerSavedParts` keep two rows with the same id. Item properties still collapse.

## Two PRs

REAL FIX together. PR A is behavior and is high-risk (`src/lib/game/`, `src/lib/calculators/`, and library saves). Critic plan pass here first. PR B is presentation only.

**PR A.** Section costs by `PART_IDS` (replace the name lists in `power-creator-cost-derivation.ts` ~290–355 and `empowered-technique-cost-derivation.ts` 268–365). Duration-clear function called from `power-creator-editor-power-config.tsx` (192–249) and `empowered-technique-editor-power-config.tsx` only. One add-part module; delete the skip and the duplicated handlers. Action scaler in `calculateEmpoweredTechniqueCosts`. `empowered-energy-breakdown.ts` (54–76) uses that result. Extract the payload builder from `empowered-technique-cost-derivation.ts` 93–235. Call it from the hook and from `enrich-techniques.ts`, `buildOfficialTechniqueRows`, `build-empowered-selectable-item.ts`, and `creature-creator-library-selectables.ts`. Pass the power-parts codex from `enrich-character.ts`, `LibraryTechniquesTab`, the official technique list, and guided L2. Dice check in `persistedLibraryBodyShapeError` immediately after the damage-array check at `library-persisted-contract.ts:364`, walking `damage`, `power.damage`, `technique.additionalDamage`, `shieldDR`, `shieldDamage`, and composition variant damage. User POST, user PATCH, and official POST already call `validateUserLibraryWriteBody`, so that one function covers every library save. No SQL. Stop `dedupeSavedParts` on empowered `autoMechanics`, at `enrich-techniques.ts:66`, in `empowered-technique-display.ts`, in `characterPartsToPartData`, and in `composedPowerSavedParts`.

**PR B.** Three components: dice row, action section, power-config section. From Shared, variants, and the lock are slots, not flags. The dice row takes weapon types, the shield’s fixed label, and minimum 0 or 1, and no maximum. Remove the seven `max` props here. Render tests per caller, including power From Shared and variants. Retarget `button-tiers.test.ts`, `website-bugs-batch-26.test.ts`, and the text scans in `power-creator-part-actions.test.ts`.

## Stays separate

Weapon types and the shield label stay props. Variant chrome stays in the power caller. The cheaper-energy attack pick stays in the cost hook. Technique damage has no type and no Apply Duration. `formatTechniqueDamage` stays technique-only. Item-property dedupe stays. `composedPowerProficiencyParts` stays on its damage-type rule. Range, area, and armor’s flat reduction keep their caps. Creature and species editors stay out.

## Saves

No stored die face of 2 or 20 (official and user powers, techniques, empowered, items, enhanced items, creatures). “1d2” on 33 user powers, 20 user items, 5 user techniques, and 7 user creatures is codex option text, not a chosen face. No data fix and no schema check. A later off-list face fails the next save out loud; it is not rewritten and not silently dropped.

`{amount: 5, size: 8}` round-trips through power load and empowered save/load. Three empowered rows store `totals.energy` (2 official, 1 user). Readers ignore that number.

## Tests

Each line fails on current master through the real path.

| Done when | Test |
|---|---|
| Both halves, fixture 10→12 | #620 hooks `usePowerCreatorCostDerivation` / `useEmpoweredTechniqueCostDerivation` |
| Live 5.75→6.25 and badge 3→5.25 | Same hooks, parts from `power-composition-parts.snapshot.json` |
| Non-action % does not scale the technique half | Hook, with a percentage that is not an action part |
| Range, parts, and mechanics badges match power | Same empowered hook |
| Add twice | `addMechanicPart` on the real power hook |
| 1 round clears the four flags | Empowered config handlers, not part-actions |
| No warning on a buff; warning on a cone or technique damage | Empowered workspace hook, existing warning conditions |
| Breakdown equals `energyRaw` | `buildEmpoweredAdvancedCalculationGroups` against `calculateEmpoweredTechniqueCosts` |
| Four readers ignore a stale Quick Action total | Each reader, codex loaded, stored `totals.energy` wrong; missing codex returns a dash |
| Two same-id rows stay | `enrichTechniques`, empowered display chips, `composedPowerSavedParts` |
| Server dice rule | `validateUserLibraryWriteBody`: reject size 2 and 20, reject 1.5 and 0, accept a count above 20 |

## What players see

Empowered badges include duration. Quick Action raises the technique half (that case publishes 7, not 6). The same part can be added twice and still shows twice. At 1 round, empowered drops those four modifiers. Dice counts are no longer stopped at 10 or 20. Sizes stay d4 through d12. A save with any other size is refused. Empowered warns on No Weapon/Attack only when an attack or damage is still attached.

## Flag

`dedupeSavedParts` stays for item properties only. The comment on that file already says creator saves keep every copy.
