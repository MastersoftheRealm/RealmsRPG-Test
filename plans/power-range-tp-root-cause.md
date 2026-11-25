# Power Range Training Points — root cause

No fix in this note. The reported floor does not reproduce on current `master`.

## Symptom

October 5 QA saw the first Range step omit Training Points (treated as 0) and a later step take a raw 1.5 and floor it to 1. PR #129 (merged Oct 6 as `016cc0f4`, implemented in `ee6f2739`) replaced that with one round-up of the whole part: base plus options, never per term, never floored. Power Range at 6 spaces is 1 TP and at 12 spaces is 2 TP. A repeated part counts once, at its highest use. QA confirmed 6 spaces = 1 and 12 spaces = 2 on production that night.

## Proven cause

That floor is gone. Codex Power Range (part 383) is base 0.5 and option 1 is 0.5 per level. Creator steps 1, 2, 3, and 4 are 3, 6, 9, and 12 spaces; the option level is steps minus one (`mechanic-builder.ts` 300–307, `power-calc.ts` 382–400).

The unrounded sums are still 0.5, 1, 1.5, and 2 (`computePartTrainingPointsRaw`, `power-calc.ts` 285). The published price does not use that sum. `computePartTrainingPoints` (`part-training-points.ts` 78–91) raises each option to the lowest level whose product is a whole number, then `roundUpTrainingPoints` (`proficiencies.ts` 49–55, 62–73) ceils the total with the base. Nothing on this path uses `Math.floor`.

Live results through `derivePowerDisplay` / `calculatePowerCosts`:

| Spaces | Raw sum | Published |
| --- | --- | --- |
| 3 | 0.5 | 1 (badge is `Power Range \| TP: 1`, not omitted) |
| 6 | 1 | 2 |
| 9 | 1.5 | 2 (not floored to 1) |
| 12 | 2 | 3 |

`publishedPowerTrainingPoints` returns the same numbers and ignores a stale saved total.

## What changed it

`0a034775` (Oct 12, “pay a repeated part base once and round each option up”) replaced the PR #129 `Math.ceil` of the raw sum. It is the Oct 6, 4:41 PM proficiency ruling in `DECISIONS.md` line 64 and `GAME_RULES.md` 242–246: highest option level, then the lowest whole-number level, fractional base rounded up with that total. That sentence says it replaces rounding the base and options up once as a single sum. Line 48 still states the older 6 = 1 and 12 = 2 numbers and was not removed. The file’s own rule is that a newer dated ruling wins. The code follows line 64, not line 48.

## Shared versus forked

One calculator serves powers, techniques, the creator badge, the part card (`power-part-card.tsx` 125), library chips (`part-display.ts` 97), published totals, empowered range (`empowered-technique-cost-derivation.ts` 342), and stat-block part chips (`creature-stat-block-helpers.ts` 156–169). Technique Additional Damage +1d6 (base 1, option 0.5 at level 1) publishes 2 through `calculateTechniqueCosts`, the same function. The power total’s source string shows the raised level (`Opt1 2` at 6 spaces, `power-calc.ts` 288–292). The part chip text still shows the used level (`Opt1 1`, `power-calc.ts` 612–618). Technique source strings also show the used level (`technique-calc.ts` 207–214). The number is the raised price in both.

The character budget is the same rule plus one row per part. `buildRequiredProficiencies` / `mergeSamePartUses` (`proficiencies.ts` 336–383) keep the highest use, raise that level, and pay the base once. Sheet add (`map-selection.ts` 116–127) and `computeAutoProficiencies` (`use-sheet-auto-proficiencies.ts` 37–45) use that total. Guided (`build-character.ts` 249–254) and the creature creator (`creature-creator-training-spent.ts` 209–234) do too. Two powers at 6 and 12 spaces cost 3, not 5. Two copies of the 3-space range cost 1. No API route recomputes this. `tpRaw` is not shown. `Math.floor` in `loadout-tp.ts` 172 runs on a total that is already a whole number.

Items do not use that function. `trainingPointsForItemPropertyRef` and `extractProficiencies` (`item-calc.ts` 343–353 and 762–766) ceil `base + rate × used level`. The same 0.5 / 0.5 rates at used level 1 are 1 on the item chip and 2 on the character proficiency. At used level 3 the chip is 2 and the proficiency price is 3. Stat-block property chips (`creature-stat-block-helpers.ts` 220–222) are a third formula, `ceil(base × level)`, and they drop a 0.5 base when the option level is 0. Codex equipment then `Math.round`s an already whole item total (`equipment-list.ts` 156–157).

## Tests

`src/lib/calculators/power-range-tp-root-cause.test.ts` drives the creator display, the sheet add, the guided budget, the creature budget, the technique calculator, and the item forks. All six tests pass on `master`. A test that expected the PR #129 published numbers (6 spaces = 1, 12 spaces = 2) would fail, because those paths return 2 and 3. That failure would be the Oct 12 ruling, not a floor.

## Fix, not done here

Leave the calculator until one sentence is chosen. If line 64 stands, rewrite line 48 so 6 spaces is 2 and 12 spaces is 3, and decide whether item chips should use the same bump. If the PR #129 numbers still stand, stop raising the option level before the sum in `computePartTrainingPoints` and `calculateProficiencyTP`, and update the tests that expect 2 and 3. Powers, techniques, and the character budget are that one function. Item chips are separate.

## Open questions

1. Which written sentence wins for Power Range: line 48 (6 spaces = 1, 12 spaces = 2) or line 64 (the price the site publishes today)?
2. Should item creator chips and stat-block property chips use the same whole-option price as the character budget?
3. Should the part chip show the used option level or the raised level that the price was computed from?
