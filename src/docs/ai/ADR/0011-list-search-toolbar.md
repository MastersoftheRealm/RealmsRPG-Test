# ADR-0011: List search toolbar

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** owner (TASK-682 proceed ack)

## Context

`CodexBrowseListShell`, `UserLibraryEntityTabShell`, and `OfficialEntityList` each duplicated the same flex row: `min-w-[200px] flex-1` wrapper around `SearchInput` plus an optional trailing button (sync, create, etc.). Library session feedback required full-span search to the trailing control (codex parity).

## Decision

Add **`ListSearchToolbar`** under `src/components/shared/`:

- Props: `search`, `onSearchChange`, `placeholder`, optional `searchAriaLabel`, optional `trailing`, optional `className` (e.g. `mt-2` when below `SectionHeader`).
- Shells pass trailing chrome only; toolbar owns layout (`flex-wrap`, `gap-3`, `flex-1` search).

## Consequences

- Positive: one layout primitive for list browse search rows; ADR-0001 / ADR-0005 shells stay thin.
- Negative: none significant.
- Rejected: inlining the pattern in a fourth shell or moving toolbar into `SearchInput` (trailing is shell-specific).
