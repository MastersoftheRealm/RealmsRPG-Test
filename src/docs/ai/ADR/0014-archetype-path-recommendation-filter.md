# ADR-0014: Archetype Path filter reads path recommendation arrays live

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** owner (chat lock 2026-08-14: live read, ChipSelect union, all levels, chips only while filtering, player-visible only)
- **Task:** TASK-751 (follow-ups TASK-752, TASK-753)

## Context

Every archetype path already authors its recommendations inside `codex_archetypes.path_data`
(`level1`, later `levels[]`, and `level1.guidance_groups[]`). Guided L1 cards read those arrays
through `parseArchetypePathData`. We now want sitewide list filtering by path ("show me the feats
Monk or Berserker recommend") on Codex/Library browse lists, creator L2 catalogs, and add-X modals.

The tempting shortcuts all create a second copy of the same data: a `path_feats` junction table, a
denormalized `feats.paths[]` column, a seed CSV built for the filter, or a zustand/localStorage
cache of "recommended ids". Any of those can drift the moment an admin edits a path, and the admin
path editor already invalidates `['codex']` on save.

## Decision

The path recommendation arrays in `path_data` stay the **single source of truth**, read live.

1. **`lib/game/archetype-path.ts`** exposes `collectPathRecommendedIds(pathData, kind)` — the union
   of refs for one entity kind across **all authoring levels** (`level1` bags, every later
   `levels[]` bag, and `level1.guidance_groups` — the parser never attaches groups to later
   levels). `remove*` lists are not recommendations. Quantity refs (`id:qty`) collapse via
   `parseIdQuantityStrings`. This is the **filter** SoT. Guided L1 cards still read
   `level1.feats` / `unionFeatIdsFromGuidanceGroups` (curated cards, not the all-levels
   collector). Creator L2/add-X use this collector via `usePathListFilter`.
2. **`lib/game/path-recommendation-index.ts`** resolves those refs against the live entity rows —
   id/`docId` first via `indexByNormalizedIds`, then display name — and returns
   `{ options, entityIdsByPathId }`. Match is the **union** over selected paths
   (`pathRecommendedEntityIds`); chips come from `pathNamesForEntity`. Path options are
   **player-visible paths only** (`listPlayerVisiblePaths`).
3. **`hooks/use-path-recommendation-index.ts`** memoizes that index from `useCodexArchetypes`
   (query key `['codex']`) so no surface adds a fetch, store, or persisted copy.
4. **`components/shared/filters/archetype-path-filter.tsx`** is the one control, composing the
   existing `ChipSelect` (extended with optional per-option `group` → `<optgroup>` and
   `labelAccessory`). No second multi-select and no any/all toggle: union only.
5. Entity list filters consume the resolved id set as an option (`filterFeats(..., { pathRecommendedIds })`),
   so Codex and Admin share one pipeline. Path-authoring level never hides a row; `lvl_req`,
   character, and category filters stay independent.

Path name chips render on matching rows **only while at least one path is selected**, via a new
`showBadgesInName` flag on the shared `GridListRow` name-row chip slot (previously compact-only) —
not a Codex-local `nameContent` fork. They replace the expanded badge copy so a fact is not shown twice.

## Consequences

- Positive: admin path edits apply after the existing `['codex']` invalidation with zero writes;
  browse filters and creator L2/add-X share one collector; ADR-0010 respected —
  `lib/game` imports only `lib/utils` + types.
- Negative / follow-ups: matching is O(paths × refs) per index build, so it must stay memoized;
  TASK-423 seed gaps make some paths match nothing (they still list); TASK-752 wired the same
  index onto Codex/Library skills, powers (powers+innatePowers), techniques, and loadout;
  TASK-753 wired creator feat/powers/loadout L2/L3 + AddFeat/AddSkill/AddLibraryItemModal
  with same-type auto-select on path See more (Empowered add-X skipped).
- Rejected alternatives: junction table or `feats.paths[]` column (drift + migration for data we
  already have); cached recommendation store (stale after admin save); per-tab match logic
  (guarantees Codex/creator divergence); TagFilter any/all mode (owner locked union).
