# ADR-0005: Codex browse list shell

- **Status:** Accepted
- **Date:** 2026-07-20
- **Deciders:** owner (TASK-576 proceed ack)

## Context

Admin Codex tabs, Codex browse tabs, and Admin Images each hand-roll `SectionHeader` + `SearchInput` + filters + `ListHeader` + loading/empty. `OfficialEntityList` already consolidates Realms Library grids (powers/techniques/items/creatures/enhanced) with `GridListRow` builders — folding Codex entity tabs into that generic would mash browse/admin row contracts and invent a second Official fork.

## Decision

Add **`CodexBrowseListShell`** under `src/components/patterns/list/` for Admin Codex + Codex browse sortable list chrome only:

- Optional `SectionHeader` (`sectionTitle` / `onAdd`) — admin
- Search row (+ optional `searchTrailing` after Filters; `filters` panel body in ListSearchToolbar compact FilterSection — TASK-721)
- `ListHeader` + loading / empty / `children` rows

Keep **`OfficialEntityList`** for official library entity grids. Do **not** put My Library sync chrome here (ADR-0001).

**Out of scope (stay tab-local):**

- `AdminArchetypesTab` — bordered path rows without a standard sortable `ListHeader` grid
- Nested modal lists (e.g. AdminTraits choice picker, AdminSpecies trait USM)
- `codexMode === 'my'` early empties (`CodexMyCodexEmpty`)

`CodexArchetypesTab` uses the shell for Search + ListHeader chrome; path-card row bodies stay tab-local. Admin Images adopts the same shell for its bank list; page-level `PageHeader` stays outside.

## Consequences

- Positive: one chrome for Codex admin/browse (including Codex Archetypes header); FEATURE_INDEX points here.
- Negative: Admin Archetypes remains a documented exception until product wants a path-card admin shell. Admin entity CRUD (save / row actions / edit-modal footer) is ADR-0025 (TASK-842), not an extension of this shell.
- Rejected: extending `OfficialEntityList` for Codex rows; a second Official* wrapper fork.
