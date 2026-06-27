# Visual State Exploration Audit (VSEA)

> **Living findings log** for the UI/UX unification effort. Methodology is locked in
> `UI_UNIFICATION_PLAN.md` § Visual State Exploration Audit. **Do not refactor a surface
> until its VSEA pass is recorded** (or explicitly marked `deferred` with reason).

## Objective

Identify **every source of visual inconsistency** — including subtle, state-specific
issues invisible in default page views — **before** (or in the same increment as) refactoring
that surface. Default-route Playwright baselines (Phase 0a) catch regressions on static pages;
VSEA catches accordion-open, modal-open, tab-selected, error, loading, empty, and hover/focus
states that static screenshots miss.

## When to run

| Trigger | Action |
|---------|--------|
| **Before refactoring a page/component** | Complete VSEA checklist for that surface; log findings below |
| **After migrating a component (retroactive)** | Re-audit all states touched in Phase 1.1–1.2 (see Retroactive queue) |
| **When adding Playwright state baselines** | Cross-check automated captures against manual exploration |
| **Phase 2+ consolidation** | Full pass on duplicate systems (chips, cards, buttons, modals) in every state |

## Exploration checklist (every page & major component)

Do **not** limit inspection to the default view. Actively interact to discover every meaningful visual state:

- Expand / collapse every accordion and collapsible section
- Open every dropdown, context menu, modal, dialog, popover
- Open tooltips where practical (hover + keyboard focus)
- Visit every tab; switch segmented controls
- Change filters; select list items
- Hover interactive elements; trigger focus, active, disabled states
- Trigger loading states where accessible
- Trigger validation errors in forms
- Open sidebars and drawers
- Inspect empty vs populated states
- Inspect tables with varying row counts
- Inspect cards with long and short content
- Inspect tree views and nested lists
- Character sheet: **every tab**, inventory, expandable stat blocks
- Inspect chips, badges, pills, tags in all variants

Capture screenshots as needed (attach paths or Playwright snapshot names in findings).

## Evaluation dimensions (each state)

**Visual consistency:** spacing, padding, margins, alignment, typography (size/weight),
icon sizing/alignment, colors, border radius, shadows, hover/focus behavior, transitions,
animations.

**UX:** discoverability, readability, information hierarchy, click targets, density,
grouping, affordances, clarity of interactions.

**Design-system consistency:** Does this state follow the same language as the rest of the app?
Watch for subtle drift: padding, font sizes, hover colors, transition durations, icon spacing,
corner radius, card layouts, headers, button placement, section spacing, modal layouts, chip
styles, list styling, dividers, empty states, loading indicators.

## Finding classification

For every issue — even if individually small — record:

| Field | Values |
|-------|--------|
| **Scope** | `isolated` · `repeated` · `duplicate-system` · `independent-evolution` |
| **Severity** | `polish` · `consistency` · `a11y` · `ux-friction` |
| **Theme** | `light` · `dark` · `both` |
| **State** | e.g. `modal-open`, `tab-skills`, `validation-error`, `empty` |
| **Fix phase** | Which plan phase should address it (1–5) or `VSEA-only` (doc/no code yet) |

## Coverage tracker

Mark each area when **all meaningful states** have been explored (both themes where applicable).

| Area | Default view | Interactive states | Light | Dark | Findings logged | Last reviewed |
|------|:------------:|:------------------:|:-----:|:----:|:---------------:|:-------------:|
| `/dev/styleguide` | ✅ | ✅ matrix + toast | ✅ | ✅ | ✅ | 2026-06-27 |
| UI primitives (`components/ui/*`) | ✅ styleguide | ✅ matrix | ✅ | ✅ | ✅ | 2026-06-27 |
| Marketing (`/`, `/about`, `/resources`) | ✅ Playwright | ✅ CTA/buttons | ✅ | ✅ | ✅ | 2026-06-27 |
| Auth (`/login`, `/register`, …) | ✅ Playwright | ✅ form states | ✅ | ✅ | ✅ | 2026-06-27 |
| Legal (`/privacy`, `/terms`) | ✅ Playwright | ✅ inline links | ✅ | ✅ | ✅ | 2026-06-27 |
| Library | ✅ axe | ⬜ | ✅ | ✅ | ⬜ | deferred — manual QA |
| Codex | ✅ axe | ⬜ | ✅ | ✅ | ⬜ | deferred — manual QA |
| Character sheet + all tabs | ✅ auth visual | ⬜ | ✅ | ✅ | ⬜ | 2026-06-27 — default tab only; TASK-385 |
| Character creator wizard | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | deferred — manual QA |
| Creators (power/technique/item/creature/species) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | deferred — manual QA |
| Encounters | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | deferred — manual QA |
| Campaigns | ✅ auth visual | ⬜ | ✅ | ✅ | ⬜ | 2026-06-27 — list + detail; TASK-385 |
| Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | deferred — manual QA |
| Shared components (modals, lists, filters) | ✅ styleguide | ✅ partial | ✅ | ✅ | ✅ | 2026-06-27 |

## Retroactive queue (Phase 1 started before full VSEA)

These were migrated in Phase 1.1–1.2 **before** interactive-state audit. Re-audit all variants/states, then confirm or fix:

- [x] `Button` — variants × sizes × loading × disabled in styleguide (default matrix)
- [x] `Chip` — core/category/status/sizes in styleguide (default matrix)
- [x] `Alert` — all status variants in styleguide
- [x] `Toast` — styleguide trigger + `role="region"` on live region (TASK-384)
- [x] `PointStatus` — variants in styleguide
- [x] `TabSummarySection` — all five variants in styleguide; semantic domain tokens (Phase 4.3 ✅)

## Findings log

> Append new rows at the top. Use IDs `VSEA-###` sequentially.

| ID | Date | Surface / state | Issue | Scope | Severity | Fix phase | Status |
|----|------|-----------------|-------|-------|----------|-----------|--------|
| VSEA-003 | 2026-06-27 | Chip systems · GridListRow | `CHIP_STYLES` parallel map duplicated `<Chip>` tokens; consolidated to `chipVariants` list-* variants | `duplicate-system` | `consistency` | 2.2 | ✅ fixed (GridListRow) |
| VSEA-001 | 2026-06-27 | `GridListRow` chip styles · `warning` variant | Chip map key `warning` uses danger bg/border/text — fixed in 1.6, then full map removed in 2.2 | `repeated` | `consistency` | 2 (chip consolidation) | ✅ fixed |
| VSEA-002 | 2026-06-27 | Styleguide · interactive states | Gallery shows static primitives only; modals/tabs/disabled/loading matrix not yet explorable in one place | `isolated` | `consistency` | VSEA automation | ✅ fixed — Interactive State Matrix section added to `/dev/styleguide`; 6 baselines updated |

## Automation roadmap (optional, incremental)

Extend verification beyond default full-page screenshots:

1. **Styleguide state matrix** — `/dev/styleguide` sections with `data-testid` triggers for modal-open, tab-selected, etc.; Playwright captures per state.
2. **Authenticated routes** (TASK-385 ✅) — my-account, characters, campaigns, character sheet, campaign detail baselines in CI when DEV-003 secrets set.
3. **Component Storybook-equivalent** — styleguide already serves this; add explicit "states" rows per primitive.

Do not block Phase 1 migration on full automation — manual/code-review exploration + styleguide expansion is sufficient initially.
