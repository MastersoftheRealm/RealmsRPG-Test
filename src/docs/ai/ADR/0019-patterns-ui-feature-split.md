# ADR-0019: Split shared/ into ui / patterns / feature

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** owner (chat: next Architect leftover, excluding Legacy route deletion) / agent (Architect)
- **Task:** TASK-794
- **Parent:** report 04 §11; TASK-751 `shared/filters`

## Context

`src/components/shared/` mixed primitives already in `ui/`, cross-feature composites, and a few single-feature modules. Report 04 asked for three tiers. Later work (creature Inventory on sheet list sections, TASK-798/820 extracts) made most of the old “feature-only” pile genuinely shared — do not dump those into `character-sheet/` or a new `creature/` folder.

## Decision

1. **`ui/`** — primitives unchanged. Do not move `SegmentedControl` here (TASK-799 / C13).
2. **`patterns/`** — former `shared/` composites, grouped:
   - `list/` — GridListRow family, Official*/Codex shells, entity-library sections, creature stat block, skill/ability grids
   - `select/` — USM, steppers, selection/equip/innate toggles, mixed-species, add-skill
   - `filters/` — existing TASK-751 folder
   - `help/` — InfoTippy, PathHelpCard, ExpandableImage, descriptor tips
   - `chrome/` — section/point/budget/modals/theme/portrait/image picker/RollButton
   - `guided-choice/` — existing guided L1–L3 chrome
3. **Feature:** only `AddCombatantModal` → `src/components/encounters/add-combatant-modal.tsx` (combat + skill views only).
4. Public barrel `@/components/patterns` keeps the former `@/components/shared` named API **except** `AddCombatantModal`. Deep imports follow the map (`@/components/shared/foo` → `@/components/patterns/<bucket>/foo`). Delete `src/components/shared/`. No `@/components/shared` shim.
5. Allowlist roots: `ui/` + `patterns/` (feature files are not Architect-gated).
6. Do **not** delete `/characters/new/advanced`. Do not mix Prettier or TASK-799 cluster merges.

## Consequences

- Positive: Layer names match the job; encounter picker is owned by encounters; FEATURE_INDEX / unification / GLR path lists stay in sync.
- Negative / follow-ups: Monolithic patterns barrel remains (tree-shake). Intra-barrel `@/components/patterns` imports inside `patterns/` were removed in TASK-794 `/cleanup`. TASK-799 done (confirm/icon-toggle/sheet families + admin Codex delete modal). TASK-795 done (ADR-0020). TASK-796 done (ADR-0021). TASK-797 done (ADR-0022). TASK-821 done (`list-components` no longer re-exports `ui/` SearchInput/EmptyState/LoadingState; patterns barrel keeps `ErrorDisplay` only). Leftover admin CRUD scaffolding is WAITING TASK-842.
- Rejected alternatives: Full report-04 feature dump (would fork sheet list sections from creature creator). Sub-barrels-only (`@/components/patterns/list`) in this change (drive-by import rewrite). Compat re-export from `@/components/shared`.
