# ADR-0002: Unified ValueStepper chrome

- **Status:** Accepted
- **Date:** 2026-07-16
- **Deciders:** owner (chat: unify all steppers to guided skills bonus style)

## Context

Multiple ± control looks existed: hand-rolled guided skills buttons (`bg-surface-alt`, no border, bold ±), shared `ValueStepper` / `.btn-stepper` (bordered surface), `QuantitySelector` (parallel markup), and soft health/energy button tints. TASK-468 aligned some call sites but left the guided skills panel as a fork and kept colored button variants.

## Decision

1. **One chrome:** `.btn-stepper` matches guided skills bonus steppers — soft `bg-surface-alt`, no invasive border, `rounded-lg`, bold ± glyphs, disabled as muted text (not opaque red/green pills).
2. **One component family:** `ValueStepper` + `DecrementButton` / `IncrementButton` from `@/components/patterns`. `QuantitySelector` is a thin quantity wrapper (stopPropagation + quantity a11y) over `ValueStepper` — not a second visual system.
3. **Allowed variation:** `size`, layout `variant` (`default` | `inline` | `compact`), `enableHoldRepeat` (HP/EN pools only), and **value** coloring (`colorVariant` / `colorValue` for the number only). Buttons stay neutral everywhere.
4. **Forbidden:** hand-rolled ± buttons; `.btn-stepper-danger` / `.btn-stepper-success`; per-surface opaque colored stepper buttons.

## Consequences

- Positive: learn-once steppers; guided skills no longer a parallel style.
- Negative: HP/EN steppers lose soft green/blue button tints (bars/labels still convey domain).
- Follow docs: `DESIGN_SYSTEM.md`, `realms-unification.mdc`, `guide/02-components-and-lists.md`.
