# Creator sections — fix plan

Plan only. Checked on master `f57027a`. Dice rulings are Kadin’s, Nov 20, 2026, 8:04 PM ET, and they replace the earlier ladder. Creators keep `{amount, size}`. Every creator offers d4, d6, d8, d10, and d12. No d2 in a creator (1d4 is the base; a feat’s 1d2 stays outside). No d20. No mixed dice and no +1d2 stepping in code. Do not add a new dice-count cap. The existing count maxima stay: 20 on power, technique, and empowered, and 10 on weapon, shield block, and shield damage.

The 10 and 12 in draft #620 are fixture values (Magic and Additional Damage at 4, Quick at ×1.5, Minute at 2). Live `codex_parts`, matching `power-composition-parts.snapshot.json`: Magic Damage 3, Additional Damage 2, Quick ×1.25, Minute 0.75, Sphere ×1.25. Quick Action raw energy is 5.75 today and 6.25 once the technique half is scaled (published totals round up, 6 then 7). A 1d4 with Apply duration and a minute is a damage badge of 5.25 on power and 3 on empowered. Sphere is a multiplier, so that fixture’s area 12 does not occur on live parts.

## Done when

- Quick, Free, Long, and Reaction scale both halves once. A non-action power percentage does not scale the technique half, and the power half is not scaled twice.
- The #620 test still fails on current master and passes after, labeled as fixtures. A second test loads `power-composition-parts.snapshot.json` and expects the live 5.75 → 6.25 raw case and the 3 → 5.25 damage badge.
- Damage, area, range, power parts, and power mechanics badges use one section-cost function grouped by `PART_IDS`, not by name lists.
- Power Mechanics Add inserts the first mechanic again, through `addMechanicPart` on the real hook. `nextMechanicPartToAdd` is deleted.
- Instant or 1 round clears and disables Focus, No Harm, Ends on Activation, and Sustain in both creators, via one pure function.
- `DIE_SIZES` is the only face list. Item `validSizes` and `computeSplits` use it. The picker does not offer d2 or d20. No new count cap.
- The empowered energy breakdown equals `energyRaw` from the same calculator.
- The empowered workspace hook shows the No Weapon/Attack warning. The power sentence is not reused: it must not say “this power”.
- Those four readers stop preferring stored `totals.energy` and recompute through `calculateEmpoweredTechniqueCosts`.
- Empowered save stops running `dedupeSavedParts` on `autoMechanics`. Power, technique, and empowered chips show both copies. Item properties still collapse.

## Two PRs

Together this is the REAL FIX. PR A is the behavior. PR B only moves presentation onto components that call PR A. PR A is high-risk (`src/lib/game/`, `src/lib/calculators/`). Critic plan pass on this draft first. The `high-risk` label goes on PR A.

**PR A — pure functions both creators call.** New section-cost helper keyed by `PART_IDS`, replacing the name lists in `power-creator-cost-derivation.ts` (about 290–355) and `empowered-technique-cost-derivation.ts` (268–365). One duration-clear function, called from `power-creator-editor-power-config.tsx` (192–249) and from the empowered config and `empowered-technique-part-actions.ts`. One add-part module; delete the duplicated logic in `power-creator-part-actions.ts` and `empowered-technique-part-actions.ts`. `DIE_SIZES` only. `calculateEmpoweredTechniqueCosts` applies the action scaler to the technique half. `empowered-energy-breakdown.ts` (54–76) uses that same result, not a second formula. `item-creator-cost-derivation.ts` calls `computeSplits`. Warning subject fix. Stop deduping empowered `autoMechanics`. Stop collapsing power, technique, and empowered chips in `empowered-technique-display.ts` and `characterPartsToPartData`. Recompute in `enrich-techniques.ts` (75), `build-empowered-selectable-item.ts` (37), `official-technique-list.ts` (91), and `creature-creator-library-selectables.ts` (186). `FEATURE_INDEX.md`.

**PR B — presentation only.** Three components under `src/components/creator/`: a dice row, an action section, and a power-config section. Not one grab-bag file. From Shared, variant tabs, and the action lock are children or slots, not flags. The dice row takes the weapon type list, the shield’s fixed bludgeoning label, and a minimum (0 or 1). Callers: power, empowered, technique, weapon, and both shield rows (seven dice rows, not six). Delete a route file only when it is no longer a caller. Retarget `button-tiers.test.ts`, `website-bugs-batch-26.test.ts`, and the text scans in `power-creator-part-actions.test.ts`. Render tests per caller, including power From Shared and variants.

## Stays separate

Weapon types and the shield label stay inputs to the dice row, not a second row component. Variant chrome stays in the power caller. The cheaper-energy attack pick stays in the empowered cost hook. Technique damage has no type and no Apply Duration. `formatTechniqueDamage` stays technique-only. Item-property dedupe stays (the same property not more than once). `composedPowerProficiencyParts` stays on its damage-type rule. Range, area, and armor’s flat reduction keep their own caps. Creature and species editors stay out. `composedPowerSavedParts` is a category list, not a chip; if it still hides a second elemental row, that is the same collapse and changes with the chips.

## Saves

Read-only check of official and user powers, techniques, empowered techniques, items, enhanced items, and creatures. No row stores a die face of 2 or 20, in `payload` or in the damage and shield-damage columns. Text “1d2” on 33 user powers, 20 user items, 5 user techniques, and 7 user creatures is codex option text copied onto the row (“additional 1d2”), not a chosen face. One extra creature hit was the letters `1d2` inside an id. No `1d20`. No normalizer and no data fix. Do not rewrite those sentences. A later off-list face would stay on the row and stay out of the picker.

`{amount: 5, size: 8}` is a guard that a legal pair round-trips. Cover empowered save and load as well as `powerLibraryRecordToFormState`. The four duration flags clear when the user sets Instant or 1 round, not when an old row is opened. Cost already ignores them at 1 round.

Three empowered rows store `totals.energy` (2 official, 1 user). The four readers use that number first, so a Quick Action save from today would keep showing the unscaled total. Recompute on read. Do not rewrite the three rows. The next save stores the new total. That is preferred to a one-off data fix, which would need Kadin’s OK and a backup and is not proposed.

## What players see

Empowered badges include duration (live 1d4 magic with a minute shows 5.25, not 3). Quick Action raises the technique half (that case publishes 7, not 6). The same part can be added twice, including two elemental rows, and the library and sheet show both. At 1 round, empowered drops those four modifiers. Dice pickers stay d4 through d12, with the same list on weapons and shields. Empowered shows the No Weapon/Attack warning without calling the technique a power.

## Flag

`dedupeSavedParts` is still right for item properties and wrong for power, technique, and empowered part rows. The file’s own comment already says creator saves keep every copy.
