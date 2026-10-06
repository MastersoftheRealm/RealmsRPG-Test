# ADR-0029: Power composition (built-in variants)

- **Status:** Accepted
- **Date:** 2026-09-24
- **Deciders:** owner (plan "Power composition model" accepted as Architect ack)
- **Task:** TASK-929 (epic TASK-929–TASK-933)

## Context

A power is one chassis (one `duration`, `range`, `area`, `damage[]`, `parts[]`) priced in one pass of `calculatePowerCosts`. The codex mechanic parts **Choice** (401), **Split Power Parts into Groups** (402), **Randomize** (371) and **Reverse Effects** (388) are hand-tuned discount knobs: the app cannot tell which parts are exclusive, so energy and the sheet damage button are fudged. Reverse Effects' `op_1_en` (-1.5) also disagreed with its own description (50%).

## Decision

1. **Payload contract.** Library powers may carry `composition` in the JSONB `payload` (no new SQL columns):
   - `structure`: `none | choice | alternate | modify | randomize`
   - `variants[]`: `{ id, label, description?, polarity?, overrides?, …spec }` — spec fields are the power fields (`actionType`, `isReaction`, `range`, `area`, `duration`, `damage`, `parts`, `attackMode`).
   - `overrides?` on a variant, and the same field on `reverse`: creator-forced fields (`action`, `attack`, `range`, `area`, `duration`, `damage`). A stored value that still equals Shared, including explicit none or Instant, stays overridden when this flag is set. Pricing does not treat a missing field as an override.
   - `reverse?`: drawback spec (its own `parts`, optional `duration`/`damage`, optional `overrides`).
   - `die?` (randomize only): `{ sides, faces: variantId[] }`, `faces.length === sides`; sides ∈ 2, 4, 6, 8, 10, 12, 20, 100.
2. **Overlay.** Choice / Modify / Randomize: the top-level power is the shared chassis; a variant field that is set replaces the shared field; variant parts are appended. Alternate: each variant is a full power (no inheritance); top-level mirrors variant 1 for legacy readers.
3. **Cost** (`src/lib/calculators/power-composition.ts`, ADR-0010 layer). Energies stay raw until one round-up at the end. The **1 EN** floor (`finalizePowerEnergy` / `energyFloorApplies`) applies only when positive energy is reduced below 1. No parts, only 0 EN parts, a quick-only or duration-only multiplier, and No Attack alone publish a dash. Kadin confirmed this on Oct 6.
   - **Choice** = Shared once, plus the most expensive portion. Action type is locked to Shared. Each portion’s range, area, and duration start as Shared and can be overridden (including explicit none / Instant). That portion’s parts are priced at its own footprint. A longer range adds cost only on that portion’s parts. A smaller footprint prices those parts cheaper. A Choice chip shows Shared plus that option (the same round-up as the power). The power still charges the most expensive option.
   - **Alternate** = the selected variant. Each variant keeps its own editable action type.
   - **Modify** = Shared once (range, area, and action included), plus each piece’s own parts and damage at that piece’s range, area, and duration. Action type is locked to Shared. Other mechanics start as Shared and can be overridden. A longer range adds cost only on that piece’s parts. A smaller area, including none, prices those parts cheaper. An empty piece adds 0. Kadin confirmed this footprint rule on Oct 6 (final; it replaces the earlier provisional bigger-reach note).
   - **Randomize** = Shared, plus each good face’s extra (overlay minus Shared) times its chance, minus each bad face’s reduction times its chance. A face counts once per die side it occupies. Good faces stay on the overlay-minus-Shared formula and keep their own action, range, and area. Bad faces use `drawbackReductionForAction`, do not inherit Shared’s range or area, and their action type is locked to Shared. Shared still happens on a bad roll. Speed premiums apply to good faces at the normal multiplier. An empty Shared chassis with only bad faces publishes a dash.
   - **Reverse** prices the drawback at the Reverse tab’s footprint (the benefit’s range, area, and duration until overridden, including explicit none), as a basic action, then applies `drawbackReductionForAction`. Action type stays on the benefit.
   - **Drawback reduction (final, Oct 6):** `reduction = ½ · drawback ÷ (normal action-type multiplier)`. Basic is 1×. A slower action refunds more; a quicker action refunds less. One function, `drawbackReductionForAction`, sets that direction. The multiplier is the action-type part only (quick, free, long), read through `analyzePowerEnergy`. Reaction is left out.
   A composed power ignores legacy parts 371/388/401/402.
4. **TP** = deduped proficiency set over every spec via `buildRequiredProficiencies` (damage parts split by damage type); never summed per variant. **Character requirements** (TASK-934) use the same rows via `composedPowerProficiencyParts` (each damage row carries its own `damageType`): every structure requires shared + every variant + Reverse, including every Alternate version. The chip does not change the required set or the training-point total. Energy and the damage button still follow the pick.
5. **Innate** = Appendix G on the whole cast (all parts, every duration); Alternate checks each variant separately.
6. **Reads.** `derivePowerDisplay` resolves composition (browse energy by default, `selectedVariantId` for play). Sheet play state is `CharacterPower.selectedVariantId`; variant chips reuse the feat-rank `ChipData` / `GridListChip` pattern (`buildPowerVariantChips` beside `buildFeatLevelChips`). Creator uses `Select` + `TabNavigation` + `CreatorLayout.aboveGrid`; no new `ui/` or `patterns/` files.
7. **Codex.** Only write: `codex_parts` 388 `op_1_en` −1.5 → −0.5 (`sql/codex-parts-reverse-effects-op1-en.sql`). The four parts stay in the codex so old payloads load; the creator hides them from the mechanic picker.

## Consequences

- Positive: one resolver for every surface; exclusive portions and concurrent pieces are priced from real specs; drawbacks follow the confirmed inverse action rule.
- Negative / follow-ups: no nested structures; techniques not covered; legacy Choice powers keep fudge math until re-authored (official examples rewritten in TASK-933). An empty overlay field still means "use Shared". An Override flag stores explicit none / Instant, including on Modify, Choice, and Reverse. Modify pieces carry no description of their own (normalize drops it). Reverse drawbacks render as row description text (`withPowerReverseNote`), never a chip; the structure's rule text rides on the variant section label tip (`powerCompositionHelpText` → `MetadataDetailSection.labelHelp`). Randomize good faces were left on overlay-minus-Shared; only bad faces share the Reverse reduction helper.
- Rejected: a new SQL column (payload JSONB already round-trips); a new tab/chip component (TabNavigation + GridListChip carry it); calling them "options" or "levels" (collide with part option levels and feat ranks).
