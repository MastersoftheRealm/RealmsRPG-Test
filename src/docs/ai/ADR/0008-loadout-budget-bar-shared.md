# ADR-0008: LoadoutBudgetBar in shared

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** owner (chat: start TASK-614)
- **Task:** TASK-614

## Context

`LoadoutBudgetBar` was extracted in TASK-461 for Guided Loadout budgets and reused by Advanced creator in TASK-606, but the file lived under `guided-creator/`. Advanced equipment, powers, and finalize imported across folder boundaries (`@/components/guided-creator/loadout-budget-bar`), which misrepresented ownership and blocked the shared barrel / unification table from listing it as the canonical budget chrome.

## Decision

Move `LoadoutBudgetBar` to `src/components/shared/loadout-budget-bar.tsx`, export it from `@/components/shared`, and update all Guided + Advanced call sites to import from the shared barrel. No behavior or prop API changes.

## Consequences

- Positive: Correct layer for cross-creator UI; Advanced no longer depends on `guided-creator/` for budget chrome; aligns with `PointStatus` + `realms-unification.mdc`.
- Negative / follow-ups: Default labels still read from `GUIDED_CREATOR_COPY` (acceptable — same copy keys Advanced already used via the interim import).
- Rejected alternatives: Re-export shim from `guided-creator/` (would preserve the wrong dependency direction).
