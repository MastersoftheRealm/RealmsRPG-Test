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
   - `variants[]`: `{ id, label, description?, polarity?, …spec }` — spec fields are the power fields (`actionType`, `isReaction`, `range`, `area`, `duration`, `damage`, `parts`, `attackMode`).
   - `reverse?`: drawback spec (its own `parts`, optional `duration`/`damage`).
   - `die?` (randomize only): `{ sides, faces: variantId[] }`, `faces.length === sides`; sides ∈ 2, 4, 6, 8, 10, 12, 20, 100.
2. **Overlay.** Choice / Modify / Randomize: the top-level power is the shared chassis; a variant field that is set replaces the shared field; variant parts are appended. Alternate: each variant is a full power (no inheritance); top-level mirrors variant 1 for legacy readers.
3. **Cost** (`src/lib/calculators/power-composition.ts`, ADR-0010 layer): Choice = max(shared+variant); Modify = Σ(shared+piece); Alternate = selected variant; Randomize = chassis + Σ signed face energy, floor 1; Reverse subtracts 50% of the reverse spec's energy (its duration, else the benefit's). A composed power ignores legacy parts 371/388/401/402.
4. **TP** = deduped proficiency set over every spec via `buildRequiredProficiencies` (damage parts split by damage type); never summed per variant.
5. **Innate** = Appendix G on the whole cast (all parts, every duration); Alternate checks each variant separately.
6. **Reads.** `derivePowerDisplay` resolves composition (browse energy by default, `selectedVariantId` for play). Sheet play state is `CharacterPower.selectedVariantId`; variant chips reuse the feat-rank `ChipData` / `GridListChip` pattern (`buildPowerVariantChips` beside `buildFeatLevelChips`). Creator uses `Select` + `TabNavigation` + `CreatorLayout.aboveGrid`; no new `ui/` or `patterns/` files.
7. **Codex.** Only write: `codex_parts` 388 `op_1_en` −1.5 → −0.5 (`sql/codex-parts-reverse-effects-op1-en.sql`). The four parts stay in the codex so old payloads load; the creator hides them from the mechanic picker.

## Consequences

- Positive: one resolver for every surface; exclusive portions and concurrent pieces are priced from real specs; drawbacks follow the written 50% rule.
- Negative / follow-ups: no nested structures; techniques not covered; legacy Choice powers keep fudge math until re-authored (official examples rewritten in TASK-933).
- Rejected: a new SQL column (payload JSONB already round-trips); a new tab/chip component (TabNavigation + GridListChip carry it); calling them "options" or "levels" (collide with part option levels and feat ranks).
