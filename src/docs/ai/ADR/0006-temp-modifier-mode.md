# ADR-0006: Temp Modifier mode (dual affordance + persist)

- **Status:** Accepted
- **Date:** 2026-07-20
- **Deciders:** owner (chat ack 2026-07-20) / agent (Architect, TASK-585)

## Context

Sheet edit used a single pencil (`EditSectionToggle`) for both rules spend and informal overrides (e.g. Speed/Evasion base above default, ability/defense/skill overspend with red pencil). Owner feedback asked to split:

- **Pencil** — rules-compliant spend (no intentional overspend; red pencil only for graceful illegal state).
- **Temp Modifier** — UI convenience (not a GAME_RULES term): layered Bonus/Penalty on top of base/computed values; no pool spend; persist across refresh and campaign view; gold/danger value tint.

TASK-586 wires v1 surfaces; this ADR locks the shared contract first.

## Decision

1. **Persisted shape:** `character.tempModifiers` (JSONB key on `characters.data`) — sparse integer deltas. Omit zeros. See `CharacterTempModifiers` in `src/types/character.ts`. No DB migration (document-only schema).
2. **Dual affordance:** Shared `SectionDualModeToggles` = `EditSectionToggle` + `TempModifierToggle` (`SlidersHorizontal`; PlusMinus family when available). Modes are mutually exclusive per section: `none` | `spend` | `tempModifier`. Do not fork per-section icon pairs.
3. **Tint:** Tint the **value** only (`text-warning-fg` when delta &gt; 0, `text-danger-fg` when delta &lt; 0). Never tint `RollButton`. Match over-max HP/EN warning family for positive.
4. **Ability cascade:** Ability deltas affect derived defense/skill/roll display. They do **not** change max Health / max Energy / TP maxima unless `tempModifiers.applyAbilityToResourceMaxima === true` (default off; Abilities adjust UI toggle in TASK-586).
5. **Layering:** Temp deltas stack on computed/armor defaults (DR, crit range, Speed, Evasion, Terminal, etc.) — they do not rewrite armor or ability base allocation. Header LargeStatBlocks (Speed/Evasion/DR/crit/Terminal) are **Temp Modifier only** (no pencil / permanent base edit on the sheet — TASK-600). Dual pencil+Temp remains on Abilities/Defenses/Skills for rules spend vs temp.
6. **Helpers:** `src/lib/character/temp-modifiers.ts` is the single apply/tint/normalize API for sheet + campaign view.

## Consequences

- Positive: one learn-once dual control; persist survives refresh/campaign; clear spend vs temp semantics for TASK-586.
- Shipped: TASK-586 wired Abilities (+ resource-maxima), Defenses, Skills (dual pencil+Temp) and header scalars; TASK-600 removed header Speed/Evasion pencil so LargeStatBlocks are Temp-only.
- Rejected: session-only temps (must persist); rewriting `speedBase`/`abilities` for temporary buffs; separate tip/tint systems per section.
