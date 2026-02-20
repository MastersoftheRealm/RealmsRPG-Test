# Modal Unification Audit — List Modals, Add-X, Load

> **Date:** 2026-02-20  
> **Goal:** Unify logic, styles, and patterns across all modals that contain lists: add-X modals (add powers, feats, skills, library items to characters/creatures), load modals (Load from Library, Load Creature), and selection modals. Align with Codex/Library list patterns so modals feel like the same system.

**Context:** The original unification audit (UNIFICATION_AUDIT_2026-02-20.md) did not explicitly cover modal unification. This audit fills that gap.

---

## Executive Summary

Modals with lists already use **ListHeader**, **GridListRow**, **SearchInput**, and **useSort** in most places. Remaining issues:

1. **Structural inconsistency** — Header/content/footer layout and class names differ (e.g. `px-6 py-4` vs `px-5 py-4` vs `pb-3`; some use Modal `title`, others custom `header`; some wrap list in bordered container, others don’t).
2. **Filter patterns** — AddFeatModal and AddSkillModal use inline `<select>`/Checkbox; UnifiedSelectionModal uses **FilterSection**. No single pattern for “filters in list modals.”
3. **Empty/loading** — All use custom `<div>` + Spinner or text; none use shared **EmptyState** / **LoadingState** from list-components.
4. **LoadCreatureModal** — Does not use ListHeader/GridListRow; simple button list. Diverges from LoadFromLibraryModal and Codex/Library style.
5. **Logic duplication** — Search + sort + filter pipeline is reimplemented in each modal (filter state, useMemo for filtered/sorted items). A shared hook (e.g. `useModalListState`) could centralize this.
6. **Integration** — Add-feat/add-skill/add-library-item could be implemented as configurations of **UnifiedSelectionModal** (or a shared “list modal shell”) to guarantee one code path and one style set.

---

## 1. Inventory: Modals With Lists

| Modal | Location | Used by | List pattern | Search | Filters | Empty/Loading |
|-------|----------|--------|--------------|--------|--------|----------------|
| **UnifiedSelectionModal** | shared | creature-creator (4), character-creator powers-step (2) | ListHeader + GridListRow | SearchInput | FilterSection (optional) | Custom div + Spinner |
| **LoadFromLibraryModal** | creator | power, technique, item creators | ListHeader + GridListRow | SearchInput | None | Custom div + Spinner / Alert |
| **AddFeatModal** | character-sheet | CharacterSheetModals | ListHeader + GridListRow | SearchInput | Inline (category, ability, checkboxes) | Custom div + Spinner |
| **AddLibraryItemModal** | character-sheet | CharacterSheetModals | ListHeader + GridListRow | SearchInput | None | Custom div + Spinner |
| **AddSkillModal** | shared | CharacterSheetModals, SkillsAllocationPage | ListHeader + GridListRow | SearchInput | Inline (ability select) | Custom div + Spinner |
| **AddSubSkillModal** | shared | CharacterSheetModals, SkillsAllocationPage | SelectionToggle (no GridListRow) | SearchInput | — | — |
| **LoadCreatureModal** | creature-creator | creature-creator | **Buttons only** (no ListHeader/GridListRow) | None | None | Custom text |

**AddSubSkillModal** is a justified exception (unique base-skill selector UX). All others are candidates for unification.

---

## 2. Current State by Area

### 2.1 Modal Shell (Header / Content / Footer)

- **UnifiedSelectionModal:** Custom header (title + close), body = search → filters → ListHeader → list (in bordered scroll div), footer inside children (selection count + Cancel + Add Selected). Uses `Modal` with `flexLayout`, no `footer` prop.
- **LoadFromLibraryModal:** Custom `header` (icon + title + close), search in separate `border-b` block (`px-6 py-3`), content `flex-1 overflow-y-auto p-4`. No footer (single-select on row click).
- **AddFeatModal:** Custom `header` + `footer` props. Search + filters in `px-6 py-4 border-b border-border-subtle bg-surface-alt`. List area `px-6` then `flex-1 overflow-y-auto`, list in `px-2 pt-2 pb-2`. Size `full`, `max-h-[85vh]`.
- **AddSkillModal:** Custom `header` + `footer`. Search + filter in `px-5 py-4 border-b border-border-light bg-surface-alt`. List in `flex-1 overflow-y-auto p-4`, rows in `space-y-2 mt-2`. Size `full`, `max-h-[85vh]`.
- **AddLibraryItemModal:** Uses Modal `title={getTitle()}` (no custom header). Content = single div `flex flex-col h-[60vh]`: search `pb-3 border-b`, then list container `flex-1 min-h-0 ... border border-border-light rounded-lg`, footer inside same div. **Only one using built-in Modal title.**
- **LoadCreatureModal:** Custom header; content = either “No creatures” text or a `space-y-2` of buttons. No search, no sort, no ListHeader.

**Inconsistencies:** Padding (`px-6` vs `px-5` vs `p-4`), border class (`border-border-subtle` vs `border-border-light`), whether list has outer border, whether footer is Modal `footer` vs inside children.

### 2.2 Search + Sort

- All list modals (except LoadCreatureModal) use **SearchInput** and **useSort**. Good.
- Placements differ: search in its own bar (LoadFromLibraryModal), search + filters in one bar (AddFeat, AddSkill), search alone above list (UnifiedSelectionModal, AddLibraryItemModal).

### 2.3 Filters

- **UnifiedSelectionModal:** Optional **FilterSection** with `filterContent` node. Used when caller passes filters.
- **AddFeatModal:** Inline category/ability `<select>`, “Show state feats” / “Show blocked” Checkboxes. Not FilterSection.
- **AddSkillModal:** Inline “Filter by Ability” `<select>`. Not FilterSection.
- **AddLibraryItemModal:** No filters.
- **LoadFromLibraryModal:** No filters.

**Recommendation:** Use **FilterSection** (or a single “modal filter bar” component) for any modal that has filters, so filter UI and expand/collapse behavior match Codex/Library.

### 2.4 List Area and ListHeader

- **UnifiedSelectionModal:** List inside `border border-border-light rounded-lg`; ListHeader has `hasSelectionColumn`; rows in `space-y-2 p-2`.
- **LoadFromLibraryModal:** ListHeader `className="mx-0 mb-2"`; rows in `space-y-2`; no outer border.
- **AddFeatModal:** ListHeader in `px-6` with `className="rounded-lg mx-0"`; list in `flex flex-col gap-2 px-2 pt-2 pb-2`.
- **AddSkillModal:** ListHeader in `px-5` with `className="mx-0"`; list in `space-y-2 mt-2`.
- **AddLibraryItemModal:** ListHeader **wrapped in a div** with `bg-primary-50 dark:bg-primary-900/30 border-b ...` — duplicates ListHeader’s own styling. List in `flex flex-col gap-2 p-2` inside scroll area.

**Issue:** AddLibraryItemModal’s header wrapper may double-style the header. Others are consistent in using ListHeader as-is with minor className overrides.

### 2.5 Empty and Loading States

- None of the modals use **EmptyState** or **LoadingState** from `list-components.tsx` / `ui/`. All use ad-hoc:
  - Loading: `<div className="..."><Spinner />` sometimes with “Loading ...” text.
  - Empty: `<div className="... text-text-muted">No ... found</div>` with varying structure.

**Recommendation:** Use **LoadingState** and **EmptyState** (or a single “list content” helper that handles loading/empty/list) so messaging and layout align with Codex/Library tabs.

### 2.6 LoadCreatureModal

- Renders a list of **buttons** (one per saved creature). No search, no sort, no ListHeader, no GridListRow.
- **Recommendation:** Refactor to use ListHeader + GridListRow (e.g. columns: Name, Level, Type) and optional SearchInput, so it matches LoadFromLibraryModal and Library/Codex list style. Reuse same Modal content structure as LoadFromLibraryModal where possible.

---

## 3. Logic Duplication

Each modal implements:

- Local state: `searchQuery` / `search`, filter state (e.g. `abilityFilter`, `selectedCategory`), selection state.
- `useMemo` to filter by search (and filters).
- `useMemo` to sort (via `sortItems(filteredItems)`).
- Reset of selection/search/filters when `isOpen` becomes true.

**Opportunity:** A shared hook, e.g. `useModalListState<T>({ items, searchFields, initialSortKey, filterConfig })`, could return:

- `search`, `setSearch`, `filterState`, `setFilterState`
- `filteredItems`, `sortedItems`, `sortState`, `handleSort`
- `reset()` to call when modal opens

Then each modal would only supply `items`, search/filter config, and column defs; the shell (search bar, ListHeader, list, empty/loading) could be shared or enforced by a **ModalListShell** component.

---

## 4. Alignment With Codex and Library

- **Codex/Library** use: SearchInput, FilterSection (or equivalent), ListHeader, GridListRow, EmptyState, LoadingState, useSort, consistent container (e.g. bordered, rounded).
- **Modals** already use SearchInput, ListHeader, GridListRow, useSort. Gaps:
  - FilterSection not used in AddFeat/AddSkill (inline filters instead).
  - EmptyState/LoadingState not used; custom divs instead.
  - LoadCreatureModal does not use list components at all.
  - Minor style drift (padding, border class names).

Unifying on the same components and a single “list modal” layout will make modals visually and behaviorally consistent with Codex/Library.

---

## 5. Prioritized Recommendations

### Phase 1 — Low-risk, high-consistency

1. **Empty/Loading in list modals**  
   Use **EmptyState** and **LoadingState** (from `list-components` or `ui`) in UnifiedSelectionModal, LoadFromLibraryModal, AddFeatModal, AddLibraryItemModal, AddSkillModal. Remove ad-hoc “No X found” / Spinner divs where they duplicate these components.

2. **Modal list shell (optional)**  
   Document a standard layout in AGENT_GUIDE: “List modals: header (title + close) → search bar → optional FilterSection → ListHeader → scrollable list (bordered) → footer (count + Cancel + primary action).” Optionally add a **ModalListShell** (or reuse UnifiedSelectionModal’s layout as the reference) so new modals don’t invent new padding/border patterns.

3. **AddLibraryItemModal header**  
   Remove the extra wrapper div around ListHeader that applies `bg-primary-50 dark:bg-primary-900/30` (ListHeader already provides header styling). Avoid double background.

### Phase 2 — Filter and layout alignment

4. **Filters in AddFeatModal / AddSkillModal**  
   Replace inline `<select>` and Checkboxes with **FilterSection** (or a shared “modal filter row” that uses the same tokens). FilterSection content can still be type-specific (feat category/ability, skill ability). This aligns filter UX with Codex/Library and UnifiedSelectionModal.

5. **Standardize padding and borders**  
   Pick one pattern for “search + filters” bar (e.g. `px-4 py-3 border-b border-border-light bg-surface-alt`) and one for list container (e.g. `border border-border-light rounded-lg` with inner padding). Apply across all list modals.

### Phase 3 — Deeper unification

6. **LoadCreatureModal**  
   Refactor to ListHeader + GridListRow + optional SearchInput, reusing the same content structure as LoadFromLibraryModal (or a shared “load from library” content component). Single-select on row click; same empty/loading as other load modals.

7. **Shared list state hook**  
   Implement `useModalListState` (or similar) that encapsulates search, filters, sort, and reset-on-open. Use it in UnifiedSelectionModal, LoadFromLibraryModal, AddFeatModal, AddSkillModal, AddLibraryItemModal to reduce duplication and keep behavior consistent.

8. **Add-X modals as UnifiedSelectionModal** — **Done.** AddFeatModal, AddSkillModal, AddLibraryItemModal are thin wrappers around UnifiedSelectionModal.  
   (Implementation complete: wrappers build SelectableItem[] and render UnifiedSelectionModal.) (data source + columns + filters + onConfirm). If feasible, this gives one implementation for all “add X from list” modals and guarantees alignment with Codex/Library styles.

---

## 6. Summary Table

| Area | Current state | Unification opportunity |
|------|----------------|--------------------------|
| List components in modals | ListHeader, GridListRow, useSort everywhere | ✅ EmptyState/LoadingState added to all list modals |
| Modal shell | Documented in AGENT_GUIDE; padding standardized | ✅ px-4 py-3 border-border-light bg-surface-alt for search/filter bar |
| Filters | FilterSection in UnifiedSelectionModal, AddFeatModal, AddSkillModal | ✅ AddFeat/AddSkill use FilterSection |
| Empty/loading | EmptyState + LoadingState in all list modals | ✅ Done |
| LoadCreatureModal | ListHeader + GridListRow + SearchInput | ✅ Refactored (was button list) |
| List state logic | useModalListState hook | ✅ Implemented; used in LoadFromLibraryModal, LoadCreatureModal |
| Add-X modals | Implemented as UnifiedSelectionModal wrappers | ✅ AddFeatModal, AddSkillModal, AddLibraryItemModal use UnifiedSelectionModal |

---

## 7. Reference

- **Unification audit (general):** `src/docs/ai/UNIFICATION_AUDIT_2026-02-20.md`
- **List components:** `src/components/shared/list-header.tsx`, `list-components.tsx`, `unified-selection-modal.tsx`
- **Creator load modal:** `src/components/creator/LoadFromLibraryModal.tsx`
- **Character sheet modals:** `src/components/character-sheet/add-feat-modal.tsx`, `add-library-item-modal.tsx`; `CharacterSheetModals.tsx`
- **Shared modals:** `src/components/shared/add-skill-modal.tsx`, `add-sub-skill-modal.tsx`
- **Load creature:** `src/app/(main)/creature-creator/LoadCreatureModal.tsx`

This audit should be used to create or update tasks in `AI_TASK_QUEUE.md` and to guide PRs so that list modals share one pattern and stay aligned with Codex/Library.
