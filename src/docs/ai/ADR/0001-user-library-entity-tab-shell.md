# ADR-0001: User Library entity tab shell

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** owner (workflow overhaul authorization)

## Context

`LibraryItemsTab`, `LibraryPowersTab`, `LibraryTechniquesTab`, and `LibraryCreaturesTab` duplicated the same sync/duplicate/search/sort shell (~65–70% identical). This was the clearest AI copy-paste drift. Admin official lists already use a different consolidated path (`Official*List`) and must stay separate.

## Decision

Extract My Library–specific shell + hooks under `src/app/(main)/library/` (not `components/shared/`):

- `UserLibraryEntityTabShell`
- `useLibraryEntitySync`
- `useLibraryDuplicateConfirm`

Entity-specific row mapping, sanitize, and Creatures’ `CreatureStatBlock` stay in each tab.

## Consequences

- Positive: one sync/duplicate UX; less re-implementation surface.
- Negative: Techniques `mode` and Creatures drift Map remain tab-local complexity.
- Rejected: putting this in `src/components/shared/` (would invite admin/user mashups).

## Follow-up (TASK-475)

`UserLibraryEntityTabShell` accepts `enableSync={false}` for list chrome only (search / sort / empty / error / rows) without sync-all or duplicate modals. `LibraryEnhancedTab` uses this basic mode — enhanced items have no patch-sync or duplicate flows.
