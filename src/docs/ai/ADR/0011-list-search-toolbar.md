# ADR-0011: List search toolbar

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** owner (TASK-682 proceed ack)
- **Amended:** 2026-08-13 (TASK-721 — Filters on the search row)

## Context

`CodexBrowseListShell`, `UserLibraryEntityTabShell`, and `OfficialEntityList` each duplicated the same flex row: `min-w-[200px] flex-1` wrapper around `SearchInput` plus an optional trailing button (sync, create, etc.). Library session feedback required full-span search to the trailing control (codex parity).

A later owner request (TASK-721) required Codex / Library / Admin browse lists to match Guided/USM: **Search + Filters on one row**, Filters on the right of search. Those shells still stacked a page `FilterSection` below `ListSearchToolbar`.

## Decision

**`ListSearchToolbar`** under `src/components/shared/`:

- Props: `search`, `onSearchChange`, `placeholder`, optional `searchAriaLabel`, optional `trailing`, optional `filters` (panel body only), optional `filterActiveCount`, optional `className` (e.g. `mt-2` when below `SectionHeader`).
- **No filters:** search + optional trailing (Create/sync) as before (`flex-wrap`, `gap-3`, `flex-1` search).
- **With filters:** compose existing **`FilterSection` compact** `toolbarStart` (search) so Filters sits on the same row. `trailing` is `toolbarEnd` **after** the Filters toggle — it must not steal the Filters slot. Browse lists pass `flex-wrap` + max-md 44px toggle classes; USM/L3 omit those. Filter composites (`PowerTechniqueFilters`, `ArmamentFilters`) are panel bodies only (no nested `FilterSection`); tabs pass unwrapped filter fields.
- Shells pass trailing chrome and filter panel bodies only; toolbar owns layout. USM/L3 keep their own `FilterSection` compact `toolbarStart` (unchanged).

## Consequences

- Positive: one layout primitive for list browse search rows; ADR-0001 / ADR-0005 shells stay thin; browse Filters match guided/USM.
- Negative: none significant.
- Rejected: a third toolbar primitive; inlining the pattern in a fourth shell; moving toolbar into `SearchInput`; restyling USM/L3.
