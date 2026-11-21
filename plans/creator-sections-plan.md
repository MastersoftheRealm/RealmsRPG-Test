# Creator sections — fix plan

Plan only. Rulings are Kadin’s, Nov 20, 2026. Checked on master `f57027a`. Draft #620 still matches that tree.

Empowered badges call `calculatePowerCosts` on the section alone; power uses `calculatePowerSectionContribution`, so the same 1d4 is 12 there and 4 on empowered. Quick Action is only on the power payload, so 1d4 + 1d4 totals 10. `nextMechanicPartToAdd` skips a mechanic already on the power list. Empowered still inserts the first one, and it clears Focus, No Harm, Ends on Activation, and Sustain only for Instant. Faces are `[4, 6, 8, 10, 12]`. Count steppers stop at 20 (power, technique, empowered) and 10 (weapon, shield block, shield damage). `computeSplits` and the item cost file each hardcode that list, and the item file inlines the split. The builder drops a face under 4, so d2 never becomes a part. 1d2 is already option level 0. Empowered shows no No Attack warning.

## Done when

- Quick, Free, Long, and Reaction multiply both halves once. The #620 case is technique half 6 and total 12. Another power percentage does not scale the technique half, and the power half is not scaled twice.
- Power Mechanics Add inserts the first mechanic again. `nextMechanicPartToAdd` is deleted, not copied.
- Instant or 1 round disables and clears those four modifiers, same as power. Empowered damage, area, range, power parts, and power mechanics badges use `calculatePowerSectionContribution`.
- One list, `DIE_SIZES = [2, 4, 6, 8, 10, 12]`. No face 20. The six dice controls share one stepper helper, and their 20 and 10 caps are gone. 1d2 stays level 0 and is kept. One step walks d2 through d12, and 1d12+1d4 shows as 2d8, on each control.
- Empowered shows the existing No Attack warning for the half that matches. No new sentence.
- The #620 test fails on current master and passes after this, through the real cost hooks.

## Two implementation PRs

This draft is the plan. Both follow-ups touch `src/lib/game/` and `src/lib/calculators/`: high-risk, critic plan pass here first, `high-risk` label on those PRs. Together they are the REAL FIX. The first fixes the math and still leaves the copied editors. The second deletes the copies. The first alone leaves the fork that caused the drift.

**Behavior.** `empowered-technique-calc.ts` and its test, `empowered-technique-cost-derivation.ts`, `power-creator-part-actions.ts` and its test, `creator-constants.ts`, `dice-splits.ts`, `mechanic-builder.ts`, `item-creator-cost-derivation.ts` (call `computeSplits`), `no-attack-creator-warning.ts`, `empowered-technique-part-actions.ts`, the empowered action profile, the six dice controls, `FEATURE_INDEX.md`, and the #620 test.

**One module, stacked on that PR.** Add `src/components/creator/creator-sections.tsx` and export it: action block, damage-dice row, range / area / duration. Delete `power-creator-editor-action-profile.tsx`, `empowered-technique-editor-action-profile.tsx`, `power-creator-editor-power-damage.tsx`, `empowered-technique-editor-power-damage.tsx`, `power-creator-editor-power-config.tsx`, and `empowered-technique-editor-power-config.tsx`. Callers: power, empowered, and technique editors, plus the weapon and shield panels for the dice row only.

## Stays separate

Weapon types and the shield’s fixed bludgeoning label stay in the item files. Variant tabs, From Shared, and the action lock stay on power. The cheaper-energy attack pick stays in the empowered cost hook. Technique damage has no type and no Apply Duration. `formatTechniqueDamage` and `PowerPartCard` stay. Range steps, area level, and armor’s flat reduction keep their own caps. Creature and species stay out.

## Saves

No migration and no SQL. Dice and parts are JSON on the library row. The skip never rewrote a save, and load already keeps two rows with the same id. The dropdown cannot store a d20. A stored 2d12 or 5d8 loads and saves unchanged. A hand-edited face off the list stays on the row. The four flags clear when the user sets Instant or 1 round, not when an old row is opened. Cost already ignores them at 1 round.

## Tests

The #620 hooks. One action scaler that is not Quick Action. Add a mechanic twice, edit the second row, remove one. No reorder control, so no reorder case. Die helper on a weapon and a shield, including d2 and the 2d8 example. A saved `{amount: 5, size: 8}` and two parts with the same id round-trip through `powerLibraryRecordToFormState` and the power save mapper.

## What players see

Empowered badges include duration (that 1d4 shows 12, not 4). Quick Action raises the technique half too (that example totals 12, not 10). The same part can be added twice. At 1 round, empowered drops those four modifiers. Dice start at d2, never offer a d20, and step the same way on powers, techniques, weapons, and shields. Empowered shows the existing No Attack warning.

## Flag and question

The written rule stops at 1d12+1d4 = 2d8. The next step after 2d8 is not named, so the button must not invent it. What does one more increase after 2d8 show?
