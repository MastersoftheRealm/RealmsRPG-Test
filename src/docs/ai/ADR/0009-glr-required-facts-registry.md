# ADR-0009: GLR required-facts registry

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** owner (proceed on TASK-629) / agent (Architect)
- **Task:** TASK-629

## Context

GridListRow fact policy (TASK-437/454/461) and `compact-facts` grammar describe *how* to format facts, but each Library / Official / Codex / sheet / add-modal list still configures columns independently. Gaps (e.g. armor **Abl. Req.** / **Crit +** before TASK-628) are rediscovered by manual audit.

CHIP_UNIFICATION_PLAN § Metadata visibility has an example table that drifts from live configs.

## Decision

Introduce a typed **required-facts registry** at `src/lib/glr/required-facts-registry.ts`:

1. **Canonical fact ids** (`GlrFactId`) — stable names for game-meaningful quick-ref facts (damage, abilityRequirement, energy, …).
2. **Surface ids** (`GlrSurfaceId`) — one entry per GLR *presentation* (e.g. `library-official-armor`, `character-sheet-power-play`, `add-modal-power`).
3. **Per-surface rules** — each required fact specifies column key matchers and/or chip label patterns. A fact is satisfied when it appears in **either** collapsed columns **or** expanded descriptor chips (never both — redundancy is a separate lint).
4. **Validation helpers** (`validate-glr-facts.ts`) — `validateSurfaceColumnConfig` for header/column keys; `validateRowFactCoverage` for sample rows with values.
5. **CI** — `required-facts-registry.test.ts` imports live column configs from builders and fails on drift.

Consumers keep their existing column constants; the registry is the SoT for *what must be visible* and tests enforce parity. New surfaces add a registry entry + test binding before shipping.

Formatting remains in `lib/detail-option/compact-facts.ts` and `lib/chip/list-row-metadata.ts`.

## Consequences

- **Positive:** Armor/weapon/power gaps caught in CI; agents have one map instead of hunting CHIP_UNIFICATION examples.
- **Negative:** New GLR surfaces need a registry row + test binding (small overhead).
- **Follow-ups:** TASK-631 (chrome/spacing CI) complements this; expand row-level fixtures as more surfaces get chip-placement rules.
- **Rejected:** Generating column configs from the registry at runtime (too invasive for TASK-629); docs-only table without CI (status quo).
