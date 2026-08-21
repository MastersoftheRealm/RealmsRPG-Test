# ADR-0006: Temp Modifier mode (sheet-level exclusive + persist)

- **Status:** Amended
- **Date:** 2026-07-20
- **Amended:** 2026-08-15 (TASK-782)
- **Deciders:** owner (chat ack 2026-07-20; sheet notes 2026-08-15) / agent (Architect TASK-585; implementer TASK-782)

## Context

Sheet edit used a single pencil (`EditSectionToggle`) for both rules spend and informal overrides (e.g. Speed/Evasion base above default, ability/defense/skill overspend with red pencil). Owner feedback asked to split:

- **Pencil / Edit** — rules-compliant spend (no intentional overspend; red pencil only for graceful illegal state).
- **Temp Modifier** — UI convenience (not a GAME_RULES term): layered Bonus/Penalty on top of base/computed values; no pool spend; persist across refresh and campaign view; gold/danger value tint.

TASK-586 wired v1 surfaces under a nested dual affordance (edit mode revealed both spend pencils and Temp sliders via `SectionDualModeToggles`). Owner 2026-08-15: users confused permanent edits with temp deltas; dual buttons overloaded the sheet. TASK-782 splits the modes at sheet level.

## Decision

1. **Persisted shape:** `character.tempModifiers` (JSONB key on `characters.data`) — sparse integer deltas. Omit zeros. See `CharacterTempModifiers` in `src/types/character.ts`. No DB migration (document-only schema).
2. **Sheet-level exclusive modes:** Play / Edit / Temp Modifier. Entering Edit closes Temp and vice versa. Toolbar: pencil FAB for Edit; `SlidersHorizontal` FAB for Temp (do not nest Temp under the pencil). Campaign / other-user sheets stay view-only (no Edit, no Temp chrome). Level-up still opens Edit (spend), not Temp.
3. **Edit chrome:** Spend/edit only. Per-section `EditSectionToggle` opens/closes spend on Abilities and Skills (same as Library / Archetype pencils). Identity / HE pool / library eyes stay Edit-gated. No Temp toggles or dual-mode pairs.
4. **Temp chrome:** Temp only. Per-section `TempModifierToggle` on Abilities/Skills and per-stat sliders on header LargeStatBlocks + Terminal open/close that surface’s steppers — not everything editable at once. Icon tint: none = blue, + = gold, − = danger (same as the value). No spend pencils. Play view shows neither chrome; existing temp value tints still display.
5. **Tint:** Tint the **value** only (`text-warning-fg` when delta &gt; 0, `text-danger-fg` when delta &lt; 0). Never tint `RollButton`. Match over-max HP/EN warning family for positive.
6. **Ability cascade:** Ability deltas affect derived defense/skill/roll display. They do **not** change max Health / max Energy / TP maxima unless `tempModifiers.applyAbilityToResourceMaxima === true` (default off; Abilities adjust UI toggle in Temp mode).
7. **Layering:** Temp deltas stack on computed/armor defaults (DR, crit range, Speed, Evasion, Terminal, etc.) — they do not rewrite armor or ability base allocation. Header LargeStatBlocks (Speed/Evasion/DR/crit) are **Temp Modifier only** (no pencil / permanent base edit on the sheet — TASK-600). **Terminal** threshold displays as `Terminal: X` on the Health resource header (temp-mod editable; not a center quick-reference card).
8. **Helpers:** `src/lib/character/temp-modifiers.ts` is the single apply/tint/normalize API for sheet + campaign view.

## Consequences

- Positive: spend vs temp cannot be confused; one toolbar learn-once; persist survives refresh/campaign.
- Shipped: TASK-586 wired surfaces; TASK-600 removed header Speed/Evasion pencil; TASK-782 moved exclusivity to sheet context + toolbar and **deleted** unused `SectionDualModeToggles` + `TempModifierToggle`.
- Rejected: session-only temps (must persist); rewriting `speedBase`/`abilities` for temporary buffs; separate tip/tint systems per section; nested per-section pencil+Temp pairs (superseded by TASK-782).
