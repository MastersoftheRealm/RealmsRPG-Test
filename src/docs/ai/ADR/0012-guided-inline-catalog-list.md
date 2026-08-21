# ADR-0012: Guided L3 inline catalog list

- **Status:** Accepted
- **Date:** 2026-08-10
- **Deciders:** owner (TASK-684 pilot ack — "pilot on archetype-feats first")

## Context

Guided creator L1 steps (archetype feats, character feat, loadout weapon/armor/gear,
powers/techniques) show path-curated cards, then a "See more" nav that opens a
`UnifiedSelectionModal` (L2) for the full filtered catalog. When the player enters via
Custom chooser with no archetype path (`prefersDeepCatalogEntry`), there are no curated
cards, so the step body is effectively empty and the L2 modal auto-opens on arrival — the
entire "screen" for full Customize is a modal, with no in-page browsing surface and no
"selected X" summary visible once the modal closes.

`UnifiedSelectionModal` already has the right list-rendering internals
(`UnifiedSelectionModalList` / `UnifiedSelectionModalColumnHeaders`, both consuming the same
`SelectableItem[]` the L2 builders (e.g. `lib/guided-creator/feats-l2.ts`) already produce),
but those pieces are only exported for use inside the `Modal` chrome, and there's no place to
show "already selected" rows once picked.

## Decision

Add **`GuidedInlineCatalogList`** under `src/components/shared/guided-choice/` (exported via
`@/components/shared`):

- Reuses `UnifiedSelectionModalList` + `UnifiedSelectionModalColumnHeaders` directly for the
  browsable catalog — no parallel row-rendering or eligibility logic; the same `SelectableItem[]`
  builder that feeds the L2 modal feeds this component.
- Owns its own search + sort state (mirrors `UnifiedSelectionModal`), and accepts the same
  `filterContent` / `showFilters` shape so domain filter panels (e.g. `GuidedFeatsFilterFields`,
  extracted from `guided-feats-l2-modal.tsx`) are shared between the modal and the inline surface.
- Selection is immediate (`onToggleSelection`) — no staged "Add selected" confirm step, since the
  step's own footer Continue is the confirmation. Callers apply capped/swap selection logic
  (e.g. `applyCappedIdSelection`) the same way L1 cards already do.
- Renders a "selected" panel (GLR rows with a default remove `IconButton`, overridable via
  `renderSelectedRightSlot`) above the catalog when there is at least one selection.
  Empty state stays unmounted (no reserved hole). On select, measure the selected-region
  height (including the catalog gap) and `scrollBy` that delta on the nearest vertical
  scroller so the clicked catalog row stays under the pointer (TASK-728).
  `overflow-anchor: none` on the panel avoids double-adjustment. Do not `scrollIntoView`
  the new selected row.
- Gate: callers branch on `prefersDeepCatalogEntry(draft)`. L1 (has a path) is unchanged (cards +
  "See more" → L2 modal). L3 (no path) renders `GuidedInlineCatalogList` in the step body instead
  of auto-opening the modal, and passes an empty `recommendedIds` list (no path ⇒ no
  "Recommended" badge).
- Adopted on `archetype-feats-step.tsx`, `character-feat-step.tsx`, `loadout-step.tsx`
  (weapon/armor/gear), and `powers-techniques-step.tsx` (TASK-684). Domain filter panels (e.g.
  `GuidedFeatsFilterFields`) and equipment L2 builders stay shared with the L1→L2 modals — do not
  fork a second inline-list implementation for new guided steps.

## Intentional L3 vs Library/Codex differences (TASK-709 allowlist)

Keep these creator-only forks. Everything else (column builders, ListHeader, expand parts/properties,
SourceFilter, quantity right-slot) must match Library/Codex.

| Keep (creator context) | Do not fork |
|------------------------|-------------|
| TP / Currency / Innate Energy **budgets** (`LoadoutBudgetBar`, PointStatus, `totalCost` TP on powers) | Column/chip formatters — use Official/Codex builders |
| Eligibility gates (unmet feats hidden, max-EN / innate threshold, hand-slot, draft ability/TP; **TASK-727** innate energy-over-cap stays listed and swaps last-in via `applyInnateSelection` on L3 + path L2 USM `nextSelectedIds`) | Library `ArmamentFilters` CharacterFilter of a *saved* sheet |
| Immediate selection (no Add Selected confirm); selected panel + remove/qty; **TASK-728** selected insert `scrollBy` (no reserved empty hole) | A second GridListRow / ListHeader implementation |
| Path badge; feat-type step scoping (`hideTypeSection`); gear quantity-first | Guided-only budget columns on powers (Action/Energy/TP only) |
| Mixed weapon+shield phase: Block in Damage cell (weapon headers) | Parallel expand "Details" chips from L1 card stats |
| Feats: Category + State filters only (requirements are auto-gated) | Codex Max Level / Ability Requirement / Tags / Feat Type controls |
| SourceFilter defaults: L3 `all`; path L2 `public` | Chrome-only source toggles that do not change the catalog |

## Consequences

- Positive: one inline-catalog primitive keeps L3 list chrome (search, filters, column headers,
  disabled/warningMessage/badges/detailSections/totalCost, TP display) consistent with the L2
  modal and consistent across every guided step that adopts it; zero duplicate GLR-row mapping.
- Negative / follow-ups: search/filter toolbar state is still mirrored (not extracted) from
  `UnifiedSelectionModal` — acceptable duplication of chrome, not of eligibility; extract a shared
  filterable-list shell later only if a third consumer appears.
- Rejected alternatives: forking a bespoke inline list per screen (duplicate eligibility/rendering
  logic, drifts from the modal over time); reusing the Advanced (non-guided) creator's
  `FullFeatCatalog`/`FeatRow` pattern as-is (built for raw `Feat[]` + a single combined
  archetype/character toggle — guided steps are separate screens per feat type and already have
  `SelectableItem[]` builders wired to the modal, so building on those instead avoids a second
  data-shaping path).
