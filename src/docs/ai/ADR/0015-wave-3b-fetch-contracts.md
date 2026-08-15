# ADR-0015: Wave 3B fetch contracts (enrichment + counts + codex collection)

- **Status:** Accepted (TASK-773 / TASK-774; TASK-775 acked by owner 2026-08-15)
- **Date:** 2026-08-15
- **Deciders:** owner / agent (Architect role)
- **Task:** TASK-773 / TASK-774 / TASK-775

## Context

Report 07 P2-5: RM view fires ~14 client hooks after `useCampaignCharacterView` (full codex +
official catalogs + the *viewer's* user library). `libraryForView` already replaces the viewer's
library (P0-1: referenced owner rows only). Tab counts on `/library` download every collection so
`TabNavigation` can show a number.

Report 07 P1-3: every `useCodex*` hook shares `['codex']` and `GET /api/codex` (full payload,
`cache: 'no-store'`). CodexBrowseListShell then mounts every matching row (809 feats).

`?scope=encounter` (TASK-762) stays a minimal HP/EN/AP GET. Do not reopen TASK-761 / ADR-0013.

## Decision

1. **Referenced enrichment (TASK-773).** Additive sibling of `libraryForView` on the **full**
   RM GET and on other-user `GET /api/characters/[id]` (not `?scope=encounter`, not the owner
   sheet). Shape: `{ enrichment: { feats, skills, species, traits, archetypes, equipment,
   powerParts, techniqueParts, itemProperties, officialPowers, officialTechniques,
   officialItems, empoweredTechniques } }` — **IDs the character document actually references**,
   same authorization gate as `getOwnerLibraryForView`. Never the owner's whole library or the
   viewer's. Extend `collectCharacterLibraryRefIds`; RM page drops the waterfall.

2. **Library tab counts (TASK-774).** Static routes win over `[type]`:
   `GET /api/user/library/counts` (auth) and `GET /api/official/counts` (public). JSON:
   `{ powers, techniques, empoweredTechniques, weapons, armor, shields, creatures, enhanced }`.
   `enhanced` is 0 on official. Armament split reuses `normalizeArmamentKind`. Page fetches
   **counts + the active tab's rows**; other tabs lazy-load. Delete/create invalidates counts.

3. **Codex collection (TASK-775).** `GET /api/codex` unchanged when `?collection=` is absent
   (full payload; `useCodexFull` / admin spreadsheet). Creators and browse tabs use collection
   hooks. Optional `?collection=` (one payload
   key) returns `{ [key]: … }` — the same payload shape with one key, never a bare array or a
   second shape; an unknown value is a 400 that does not echo the input. Only that collection's
   tables are queried. Hook key `['codex', collection]`, which `['codex']` invalidation still
   reaches by prefix, so admin saves need no change. `useCodexArchetypes` becomes a slice so the
   path filter (ADR-0014) does not download feats.

   Amended while implementing: **`useGameRules` moves to `['codex', 'coreRules']`** rather than
   keeping the full payload — it is mounted on most pages, so leaving it on `['codex']` would
   have kept the full download alive everywhere and made the slices additive. `powerParts`,
   `techniqueParts`, and `parts` share one `['codex', 'parts']` fetch (one table) and split via
   `lib/codex/part-type.ts`, which the route uses too, so the split rule is not forked.

   Browse rows window-virtualize inside `CodexBrowseListShell` (`@tanstack/react-virtual`); the
   shell is not rebuilt and tabs keep passing row children. Virtualization engages only past a
   row threshold, so short lists and a single grouped child (Codex Archetypes) render as before.
   List `scrollMargin` is recomputed when the shell resizes (Filters expand/collapse), not only
   on window resize.

## Consequences

- Positive: RM view is one authorized payload; Library stops 5–6 full-catalog fetches for
  badges; Codex browse fetches the open tab.
- Negative / follow-ups: miss a ref path → blank sheet row (cover with vitest on the collector).
  Owner sheet keeps the catalog waterfall (add-X needs full lists), and it now issues one small
  request per collection instead of one large shared payload — fewer bytes, more requests. A
  virtualized row that scrolls out of view unmounts, so its expanded state resets. 3C still owns
  `/rules` MDX and server-rendered codex detail pages.
- Rejected: stuffing full codex/official tables into the campaign GET; `?count=1` per `[type]`
  (six round-trips); new `/api/codex/[collection]` tree (query param keeps one route); hiding
  Library counts until a tab is visited; a comma-separated `?collection=a,b` batch (no hook can
  consume it — React Query keys are per collection); a bare-array response for a slice (second
  payload shape); paginating browse lists instead of virtualizing (changes the browse UX).
