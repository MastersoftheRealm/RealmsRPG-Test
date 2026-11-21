# Creator sections — fix plan

Plan only. Checked on master `f57027a`. Dice: Kadin, Nov 20, 2026, 8:04 PM, 8:22 PM, and 8:46 PM ET. Creators keep `{amount, size}`. Faces are d4–d12 (`DIE_SIZES`). No d2 in a creator, no d20, no mixed dice, no stepping, no count cap.

The 10 and 12 in #620 are fixtures. Live parts (`power-composition-parts.snapshot.json`): Magic Damage 3, Additional Damage 2, Quick ×1.25, Minute 0.75, Sphere ×1.25. Quick Action raw energy is 5.75 today and 6.25 after (published 6 then 7). A 1d4 with Apply duration and a minute badges 5.25 on power and 3 on empowered.

## Done when

- Quick, Free, Long, and Reaction scale both halves once. A non-action power percentage does not. The power half is not scaled twice.
- One `PART_IDS` section-cost function feeds damage, area, range, power parts, and power mechanics badges.
- `addMechanicPart` inserts the first mechanic again. `nextMechanicPartToAdd` is deleted.
- Instant or 1 round clears the four duration modifiers from both config components, not from `empowered-technique-part-actions.ts`.
- One face list. The seven steppers have no maximum (removed in PR A).
- The library routes reject a face outside `DIE_SIZES`, a count that is not `typeof number` and `Number.isSafeInteger` and ≥ 1, and they accept a large safe integer. `shieldDamage` null and an empty damage array pass. This is an app-path check, not a database guarantee: `authenticated` has `GRANT ALL` on the user library tables, and the owner INSERT/UPDATE policies only require `user_id = auth.uid()`.
- PR C adds the database constraint. It is not applied from this draft.
- The empowered workspace hook warns only when `no-attack-creator-warning.ts` would. A buff does not. New wording is `PLACEHOLDER_COPY` (Kadin) and does not say “this power”.
- One payload builder serves the cost hook and the four readers. A missing or empty power-parts list is “not loaded” (`powerPartsDb || []` in `enrich-character.ts` 103–106, `?? []` in `creature-creator-library-selectables.ts` 181–182). That shows a dash, never `totals.energy`.
- Duplicate part rows stay on empowered `autoMechanics`, chips, `characterPartsToPartData`, `composedPowerSavedParts`, and `expandLegacyRandomizeFace` (`power-composition.ts` 475 and 489). Item properties still collapse.

## Three PRs

REAL FIX together. Critic plan pass here first. PR A and PR C are high-risk. PR B is presentation.

**PR A — behavior.** Section costs by `PART_IDS` (replace the name lists in `power-creator-cost-derivation.ts` ~290–355 and `empowered-technique-cost-derivation.ts` 268–365). Duration-clear function called from the two config components only. One add-part module. Action scaler in `calculateEmpoweredTechniqueCosts`. `empowered-energy-breakdown.ts` (54–76) uses that result. Extract the payload builder from `empowered-technique-cost-derivation.ts` 93–235 for the hook and for `enrich-techniques.ts`, `buildOfficialTechniqueRows`, `build-empowered-selectable-item.ts`, and `creature-creator-library-selectables.ts`. Pass the power-parts list from `enrich-character.ts`, `LibraryTechniquesTab`, the official technique list, and guided L2. Remove `max={20}` and `max={10}` on the seven steppers here. App-path dice check in `persistedLibraryBodyShapeError` just after `library-persisted-contract.ts:364`, used by user POST, user PATCH, and official POST through `validateUserLibraryWriteBody`. Stop `dedupeSavedParts` on empowered `autoMechanics`, at `enrich-techniques.ts:66`, in the display chips, in `characterPartsToPartData`, in `composedPowerSavedParts`, and at `expandLegacyRandomizeFace` 475 and 489.

**PR B — presentation.** Three components: dice row, action section, power-config section. From Shared, variants, and the lock are slots. The dice row takes weapon types, the shield’s fixed label, and minimum 0 or 1, and no maximum. Render tests per caller. Retarget `button-tiers.test.ts`, `website-bugs-batch-26.test.ts`, and the text scans in `power-creator-part-actions.test.ts`.

**PR C — data SQL, separate.** Not this pull request. Kadin’s OK and a named backup before anyone applies it. No row rewrite.

Use one `IMMUTABLE` function, not a trigger. The rule is a predicate. `sync_library_promoted_columns` already copies payload dice into columns; a second trigger can be skipped and can race that copy. A CHECK cannot be skipped. Arrays need the function because a column CHECK cannot loop.

The function allows null and `[]`. An object with `amount` and `size` must have `size` in (4, 6, 8, 10, 12) and `amount` a JSON integer ≥ 1 with no upper bound. It walks nested values, so a die inside `payload` is the same rule. Other objects are left alone.

Columns: `damage` on official and user powers, techniques, empowered techniques, and items; `shield_dr` and `shield_damage` on official and user items (`shield_damage` null stays valid). The same function on `payload` for those tables plus official and user creatures and `official_enhanced_items.payload`, and on `user_enhanced_items.data`.

Creature rows have no dice columns. Copies live in the creature `payload` (nested powers, techniques, weapons, shields). Those copies are covered. Character tables store ids, not dice, and stay out.

Enhanced-item routes do not call `validateUserLibraryWriteBody`. They save a base-item id and a power id. `officialEnhancedItemCreateSchema` still allows a free `payload`, so PR C checks that blob. PR A does not claim the library route covers those routes.

Add each CHECK `NOT VALID`, then `VALIDATE CONSTRAINT` in the same file. The migration’s own pre-check must see zero bad objects first; if it does not, the file stops and adds nothing. A read-only scan already found 217 dice objects, all valid, so `VALIDATE` is expected to succeed. Reads of those rows keep working. A bad insert or update fails out loud.

Rollback, shipped in the same file and not run here: `ALTER TABLE … DROP CONSTRAINT` for each check, then `DROP FUNCTION`. pgTAP runs against that canonical file: null and `[]` pass, size 2 and 20 fail, a non-integer and 0 fail, a large integer passes, a nested payload die fails, and `VALIDATE` passes on the fixture rows.

## Stays separate

Weapon types and the shield label stay props. Variant chrome stays in the power caller. The cheaper-energy attack pick stays in the cost hook. Technique damage has no type and no Apply Duration. `formatTechniqueDamage` stays technique-only. Item-property dedupe stays. `composedPowerProficiencyParts` stays on its damage-type rule. Range steps, area level, and armor’s flat reduction keep their own caps. Creature and species editors stay out of PR A and PR B.

## Saves

No stored die face of 2 or 20. “1d2” on 33 user powers, 20 user items, 5 user techniques, and 7 user creatures is codex option text. `{amount: 5, size: 8}` round-trips. Three empowered rows store `totals.energy` (2 official, 1 user). Readers ignore it. No data rewrite in any of the three PRs.

## Tests

Lines marked guard already pass on master. The others fail on current master through the real path.

| Done when | Test |
|---|---|
| Both halves, fixture 10→12 | #620 cost hooks |
| Live 5.75→6.25 and damage badge 3→5.25 | Same hooks, snapshot parts |
| Non-action % leaves the technique half alone | Guard. Hook with a non-action percentage and no action part |
| Quick plus a non-action % | Fails today. Technique half = flat technique cost × the action multiplier only |
| Range with Apply duration matches power’s section contribution | Empowered hook. Section-only pricing is the current miss |
| Power-part and mechanic badges match power | Same hook |
| Add twice | `addMechanicPart` on the real power hook |
| 1 round clears the four flags | Empowered config handlers |
| No warning on a buff; warning on a cone or technique damage | Empowered workspace hook |
| Breakdown lines equal `energyRaw` | Guard. `buildEmpoweredAdvancedCalculationGroups` |
| Live Quick Action breakdown total is 6.25 | Same builder. Today the technique line is unscaled, so the total is 5.75 |
| Four readers ignore a stale Quick Action total | Each reader, non-empty codex; empty codex returns a dash |
| Hook and one reader agree | Same saved row through the payload builder |
| Two same-id rows stay | Empowered save `autoMechanics`; `enrichTechniques`; `characterPartsToPartData`; `composedPowerSavedParts`; `expandLegacyRandomizeFace` |
| App-path dice rule | `validateUserLibraryWriteBody`: reject size 2 and 20, reject 1.5, `"4"`, and 0; accept a safe integer above 20; accept `shieldDamage: null` and `damage: []` |
| Database rule | PR C pgTAP, above |

## What players see

Empowered badges include duration. That Quick Action case publishes 7, not 6. The same part can be added twice and still shows twice. At 1 round, empowered drops those four modifiers. Dice counts are no longer stopped at 10 or 20. Sizes stay d4 through d12. A save with any other size is refused, including a direct database write once PR C is applied. Empowered warns on No Weapon/Attack only when an attack or damage is still attached.

## Flag

`dedupeSavedParts` stays for item properties only.
