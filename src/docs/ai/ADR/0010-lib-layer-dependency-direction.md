# ADR-0010: Lib layer dependency direction

- **Status:** Accepted
- **Date:** 2026-08-03
- **Deciders:** owner (chat: TASK-662)
- **Task:** TASK-662

## Context

Audit B6: `src/lib/calculators` and `src/lib/game` (neutral domain logic) imported from `src/lib/library` and `src/lib/guided-creator`, inverting the intended dependency direction. UI/creator layers should consume domain math, not vice versa.

## Decision

Establish a downward dependency stack for `src/lib/`:

1. **`lib/game`** — neutral game-domain helpers (path data, dedupe of saved parts, loadout flattening, path ability resolution). May import `lib/calculators`, `lib/utils`, types. Must not import `lib/library`, `lib/guided-creator`, or app/components.
2. **`lib/calculators`** — cost/display math (powers, techniques, items). May import `lib/game`, `lib/utils`, types. Must not import `lib/library` or `lib/guided-creator`.
3. **`lib/library`** / **`lib/guided-creator`** — presentation, sync, and creator orchestration. May import `lib/game` and `lib/calculators`.

Moved shared pieces for TASK-662:

| Former location | New canonical location |
|-----------------|------------------------|
| `library/dedupe-saved-parts.ts` | `game/dedupe-saved-parts.ts` |
| `computePartTrainingPoints` in `library/part-display.ts` | `calculators/part-training-points.ts` |
| `flattenLoadoutEntries` in `guided-creator/resolve-loadout-items.ts` | `game/loadout-entries.ts` |
| `resolvePathAbilityLabels` in `guided-creator/path-ability-labels.ts` | `game/path-ability-labels.ts` (UI chip builder stays in guided-creator) |

## Consequences

- Positive: Calculators and game are safe foundations for library, creators, and sheet without circular imports.
- Negative / follow-ups: prefer `@/lib/calculators/part-training-points` and `@/lib/game/loadout-entries` over library/guided-creator re-exports (shims removed in TASK-662 cleanup).
- Rejected alternatives: New `lib/rules/` folder (game + calculators already cover the neutral layer); re-export shims from guided-creator (removed when consumers pointed at canonical paths).
