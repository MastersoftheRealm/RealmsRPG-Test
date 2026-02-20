# RealmsRPG Unification Audit — Shared Logic & Centralized Sources of Truth

> **Date:** 2026-02-20  
> **Goal:** Identify opportunities for shared, unified, simplified logic across Creators, Libraries, Character/Creature logic, General UI, and background code. Reduce variability, duplicate code, and inline fixes in favor of global patterns that are easy for AI agents and multi-session work to maintain.

**Stack:** Next.js (App Router), React, Tailwind, Supabase, Prisma, Vercel

---

## Executive Summary

The codebase already has strong unification in several areas (e.g. `ValueStepper`, `useSort`, `GridListRow`, `formulas.ts`, `calculators/`). This audit surfaces **remaining duplication and inconsistency** and recommends **centralized sources of truth** so that:

1. **One pattern in one place** — Learn once, use everywhere (headers, save bars, allocation UI).
2. **Fewer variants** — Same component with props/variants instead of similar-but-different implementations.
3. **Consistent styling** — Design tokens and shared components for dark/light, accessibility, buttons.
4. **Single calculation layer** — All character/creature math and display derivation from shared modules.

**High-impact opportunities:**

| Area | Finding | Recommendation |
|------|---------|----------------|
| Creators | Save toolbar, save/load state, and handleSave logic duplicated across power, technique, item, creature creators | Extract `CreatorSaveToolbar` + `useCreatorSave` hook |
| Creators | Load-from-library + mechanic filtering documented in AGENT_GUIDE but implemented per-creator with copy-paste | Shared `useCreatorLoad(type, filterMechanics)` + load helpers per type |
| Libraries / List views | ListHeader (grid row) vs SortHeader (individual buttons) — two patterns; SortHeader row has no shared container style | Unify header row styling: shared wrapper class or ListHeader with columns everywhere |
| Character/Creature | Ability, defense, skill allocation already use shared components; minor style/centering differences reported | Audit AbilityScoreEditor, HealthEnergyAllocator, PointStatus usage for one variant per context |
| General | Private/Public toggle buttons and Save/Load/Reset repeated in every creator with same classes | Centralize in CreatorSaveToolbar |
| Background | formulas.ts, calculations.ts, calculators/, skill-allocation.ts are well separated | Keep; ensure no inline formulas in components |

---

## 1. Creators

### 1.1 Layouts & Structure

**Current state:** Power, technique, item, and creature creators share a similar layout: `PageHeader` with actions, main editor (name, description, parts/properties), sidebar (summary panel), and modals (Load from library, Login prompt).

**Unification opportunities:**

- **Layout component:** No shared `CreatorLayout` wrapper. Each creator implements its own grid (`lg:grid-cols-3`, main + sidebar). A shared `CreatorLayout({ title, description, icon, actions, children, sidebar })` would enforce consistent structure and responsive behavior.
- **Summary panel:** `CreatorSummaryPanel` is shared; usage is consistent. No change needed.
- **Collapsible sections:** `CollapsibleSection` in `src/components/creator/` is used; ensure all creators use it for optional blocks (e.g. advanced mechanics) instead of ad-hoc accordions.

### 1.2 Parts/Properties & UI-Integrated Mechanics

**Current state:** AGENT_GUIDE and creator-constants define the pattern: mechanic-only entries (damage, DR, range, duration, action type) are **not** restored into the user-selectable list; they are restored from dedicated state. List shows only non-mechanic parts/properties.

**Sources of truth:**

- **Item/armament:** `filterSavedItemPropertiesForList(savedProperties, propertiesDb)` from `@/lib/calculators`.
- **Power:** Exclude `EXCLUDED_PART` and add to list only when `!matchedPart.mechanic`.
- **Technique:** Add to `loadedParts` only when `!matchedPart.mechanic`.

**Unification opportunities:**

- **Single doc + shared types:** Document the “mechanic vs list” rule in one place (AGENT_GUIDE already does). Consider a small shared type or constant set, e.g. `CREATOR_LOAD_RULES` or a `filterMechanicEntriesForList(type, saved, db)` abstraction used by all three creator types, to avoid copy-paste of the same logic in each `handleLoad*`.
- **Chips and part display:** Part chips (cost, level) use `PartChip` and calculator helpers (`formatPowerPartChip`, `formatTechniquePartChip`, etc.). Already centralized in `lib/calculators`. Ensure creators and codex/library use the same formatters.

### 1.3 Saving Logic

**Current state:** All four creators (power, technique, item, creature) duplicate:

- State: `saveMessage`, `setSaveMessage`, `saveTarget`, `setSaveTarget`, `saving`, `setSaving`.
- Handlers: `handleSave` that checks `saveTarget === 'public'` → `saveToPublicLibrary(type, data)` else `saveToLibrary(type, data, existing ? { existingId } : undefined)`, then `setSaveMessage({ type: 'success' | 'error', text })`.
- Toolbar: Private/Public toggle (admin only), Load, Reset, Save buttons with identical class names (`bg-primary-600 text-white` vs `text-text-muted hover:text-text-secondary`).

**Recommendation:**

- **Extract `useCreatorSave(type, getData, options)`**  
  Returns: `{ saveMessage, setSaveMessage, saveTarget, setSaveTarget, saving, handleSave }`.  
  Internally uses `saveToLibrary`, `saveToPublicLibrary` from `library-service`, and optional `existing` for update flow.
- **Extract `CreatorSaveToolbar`**  
  Props: `saveTarget`, `onSaveTargetChange`, `onSave`, `onLoad`, `onReset`, `saving`, `saveDisabled` (e.g. `!name.trim()`), `showPublicPrivate` (isAdmin), `user` (for Load/Login prompt).  
  Renders: Private/Public toggle (if showPublicPrivate), Load, Reset, Save. Same styles and accessibility (e.g. title for Load when not logged in).
- **Result:** All four creators use `<CreatorSaveToolbar {...} />` and `useCreatorSave(...)`, eliminating duplicated state and UI.

### 1.4 Loading Logic

**Current state:** Each creator has its own load-from-library flow: open modal, fetch user library (or use existing hook), select item, then `handleLoadPower` / `handleLoadTechnique` / etc. that:

1. Reset state.
2. Restore dedicated mechanic fields from saved data.
3. Restore the “list” from saved data **filtered to non-mechanic entries only**.

**Unification opportunities:**

- **Shared modal:** `LoadFromLibraryModal` in `src/components/creator/LoadFromLibraryModal.tsx` is generic (items, itemType, onSelect, isLoading, error). Already reused. Ensure power, technique, item, creature creators all use it with the same list/sort patterns (they use `useSort`).
- **Load transformers:** The actual “saved → editor state” logic is type-specific (power parts vs technique parts vs item properties vs creature fields). Keep type-specific transformers but:
  - Call the same **mechanic-filtering** helpers (e.g. `filterSavedItemPropertiesForList` for items; power/technique use `EXCLUDED_PART` / `!matchedPart.mechanic`).
  - Document the three-step pattern (reset → restore mechanics → restore filtered list) in one place and reference it from each creator.

### 1.5 Admin vs Regular User

**Current state:** Creators show “My library” / “Public library” toggle only when `isAdmin` (from `useIsAdmin()` or equivalent). Save target defaults to `'private'`. Logic is repeated in each creator.

**Recommendation:** Once `CreatorSaveToolbar` exists, admin-only toggle is a single prop (`showPublicPrivate`). No further duplication.

### 1.6 Display of Created Content (Powers, Techniques, Armaments)

**Current state:** Library and Codex use `GridListRow` with columns derived from `derivePowerDisplay`, `deriveTechniqueDisplay`, `deriveItemDisplay` (from `data-enrichment.ts` and `lib/calculators`). Creators show their own editor state. Display logic is centralized; creators don’t re-implement display derivation.

**Unification:** Keep using `derive*Display` and calculator formatters everywhere. Ensure creator “preview” or summary uses the same functions so what you see in creator matches library/codex.

### 1.7 Dark/Light Mode in Creators

**Current state:** Creators use design tokens (`bg-surface`, `text-text-primary`, `border-border-light`, etc.) and shared components that already support dark mode (e.g. `ValueStepper`, `HealthEnergyAllocator`). No hardcoded `blue-*` or `gray-*` in creator-specific UI.

**Recommendation:** Spot-check creator pages for any remaining raw color classes; replace with tokens. Prefer shared components (Button, Input, SectionHeader, etc.) which are already token-based.

---

## 2. Libraries & List Views

### 2.1 Column Headers: ListHeader vs SortHeader

**Current state:**

- **ListHeader** (`src/components/shared/list-header.tsx`): Full row with a **grid** of columns. Uses `ListColumn[]`, `gridColumns`, `sortState`, `onSort`, `hasSelectionColumn`. Styling: `bg-primary-50 dark:bg-primary-900/30`, `text-primary-700 dark:text-primary-300`, uppercase. Used in character sheet `LibrarySection` (powers, techniques, weapons, armor, equipment).
- **SortHeader** (`src/components/shared/list-components.tsx`): **Single** clickable column header. Used inside a parent that builds the row. Styling: `text-text-secondary`, `text-primary-600` when active. Used in Library tabs, Codex tabs, Admin Codex tabs, add-feat/add-skill/add-library-item modals, unified-selection-modal.

**Issue:** Two patterns. Where SortHeader is used, the **row container** (flex/grid wrapper) and its background/padding are defined per page (Codex, Admin, Library). So header row **look** can vary (e.g. some tabs may not have the same rounded background as ListHeader).

**Recommendations:**

- **Option A (minimal):** Define a shared **header row wrapper** class or component used by every list view that uses SortHeader, e.g. `SortHeaderRow`, with the same classes as ListHeader’s container: `hidden lg:grid gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg mb-2 mx-1 text-xs font-semibold ...`. Each tab passes children (SortHeader buttons). This gives one visual style for all sortable list headers.
- **Option B (deeper):** Migrate all list views to use **ListHeader** with a `columns` array (and optional `gridColumns`). Then there is only one header component; Codex/Admin/Library just pass column defs. Larger refactor but single source of truth.

### 2.2 Sort Logic

**Current state:** `useSort(initialCol)` in `src/hooks/use-sort.ts` is the single source of truth. Returns `sortState`, `handleSort`, `sortItems`. Used across Library, Codex, Admin, modals. No duplication.

**Recommendation:** Keep as is. When adding new list views, always use `useSort` and pass `handleSort` to ListHeader or SortHeader.

### 2.3 List Views: GridListRow, ItemCard, ItemList

**Current state:** AGENT_GUIDE and UI_COMPONENT_REFERENCE define when to use which:

- **GridListRow:** Powers, techniques, feats, equipment in lists; sortable columns; expandable rows; modals.
- **ItemCard / ItemList:** Card layout; view/edit/duplicate/delete; used in creature creator for senses/movement blocks and historically for some browse views.

**Unification opportunities:**

- **Action buttons:** Ensure GridListRow and ItemCard use the same action set (Add/Edit/Duplicate/Delete/Quantity) and same button styles (IconButton, placement). Document in one place (e.g. “List item actions” in AGENT_GUIDE) so new features don’t invent new placements.
- **Chips inside items:** GridListRow’s `chips` / `detailSections` and PartChip/cost labels should use the same design tokens and chip styles across Library, Codex, and modals. Already aligned via shared components; verify no inline overrides.

### 2.4 Collapsed vs Expanded; Headers Within Items

**Current state:** GridListRow has a consistent collapsed (columns) + expanded (description, chips, actions) pattern. SectionHeader is used for section titles with optional “+” on the right.

**Recommendation:** Use SectionHeader for any “section title + add” pattern. Use GridListRow’s built-in expand/collapse; avoid custom accordions for the same concept.

### 2.5 Empty State, Loading, Filters

**Current state:** `EmptyState`, `LoadingState` re-exported from `list-components.tsx` (from ui). FilterSection, ChipSelect, SelectFilter, TagFilter, AbilityRequirementFilter live in shared filters. Library, Codex, and Admin tabs use them.

**Recommendation:** Keep using these everywhere. When adding a new tab, reuse the same filter/sort/empty/loading pattern as an existing tab (e.g. Codex Feats or Library Powers).

### 2.6 Dark/Light Mode for List Headers and Rows

**Current state:** ListHeader uses `bg-primary-50 dark:bg-primary-900/30` and `text-primary-700 dark:text-primary-300`. GridListRow and related components use design tokens. SortHeader uses `text-primary-600` (no explicit dark variant; inherits).

**Recommendation:** Ensure SortHeader (and any header row wrapper) uses the same token set as ListHeader for active/inactive and background so dark mode is consistent across all list views.

---

## 3. Creature/Character Logic

### 3.1 Ability Allocation

**Current state:** Shared component `AbilityScoreEditor` (`src/components/creator/ability-score-editor.tsx`) used in character creator, character sheet (edit mode), and creature creator. Uses `PointStatus`, `DecrementButton`, `IncrementButton` (from shared). Constraints (max/min, negative sum) are props, so one component serves all contexts.

**Unification:** Already unified. Optional: Audit all call sites for consistent `compact`, `hidePointsStatus`, and `useHighAbilityCost` so the same “context” (e.g. character sheet edit) always uses the same variant.

### 3.2 Skill Point Allocation

**Current state:** `SkillsAllocationPage` in `src/components/shared/skills-allocation-page.tsx` is the shared component for character creator and creature creator. Uses `PointStatus`, `SkillRow`, and logic from `lib/game/skill-allocation.ts` (e.g. `getTotalSkillPoints`, `getSkillValueIncreaseCost`). Character sheet skills section uses `SkillRow` and `PointStatus` with same formulas.

**Unification:** Already unified. Ensure species skill id `0` (“Any” / extra skill point) is handled the same everywhere (AGENT_GUIDE and GAME_RULES document this).

### 3.3 Defense Allocation

**Current state:** Defense bonuses are edited via `ValueStepper` in character sheet abilities-section and in creature creator. Same `skill-allocation.ts` constants (e.g. defense cost). No separate “defense allocator” component; it’s inline with abilities.

**Unification:** Already aligned. If desired, a single “DefenseAllocator” component (similar to AbilityScoreEditor) could standardize layout and PointStatus display; current approach is acceptable if styles match.

### 3.4 Health/Energy Allocation

**Current state:** `HealthEnergyAllocator` in `src/components/creator/health-energy-allocator.tsx` used in character creator, character sheet, creature creator. Variants: `card` (creators) and `inline` (sheet). Uses `ValueStepper` with `enableHoldRepeat` for pool allocation. Design tokens for success/danger/overspent.

**Unification:** Already unified. Verify creature creator passes same props (e.g. `enableHoldRepeat`) where intended; feedback mentioned hold-to-increase behavior.

### 3.5 Powered-Martial Slider

**Current state:** `PoweredMartialSlider` in shared used for allocating points between power and martial. Used in creature creator; character sheet edit for powered-martial characters could use the same component (task TASK-034 in queue). Unify by using this component in both places.

### 3.6 Styles, Layout, Colors, Dark Mode

**Current state:** AbilityScoreEditor, HealthEnergyAllocator, PointStatus, ValueStepper use design tokens. Owner feedback mentioned “slightly different styles” and “center skill/ability points in row.” Some of this was addressed in prior tasks.

**Recommendation:** One pass to ensure AbilityScoreEditor, skills section (PointStatus), and HealthEnergyAllocator use the same spacing, alignment, and token set in character sheet, character creator, and creature creator. Prefer a single “allocation row” layout pattern (e.g. label left, stepper center, PointStatus right) reused everywhere.

---

## 4. General UI & UX

### 4.1 Steppers and Add/Remove Buttons

**Current state:** `ValueStepper`, `DecrementButton`, `IncrementButton` are the single source of truth for +/- controls. Used across sheet, creators, encounter tracker. Hold-to-repeat is optional (`enableHoldRepeat`); ability/defense steppers should not use it (per feedback); pool allocation (HP/EN) should.

**Unification:** Keep using ValueStepper everywhere. Avoid any new “custom stepper” or raw +/- buttons. Document in AGENT_GUIDE: “Use ValueStepper; use enableHoldRepeat only for pool allocation (HP/EN), not for abilities/defenses.”

### 4.2 Add (+) Buttons

**Current state:** SectionHeader has optional `onAdd` and renders a “+” IconButton. Used for “Add Power,” “Add Feat,” etc. Consistent.

**Recommendation:** Always use SectionHeader when the pattern is “section title + add button.” Don’t add one-off “Add” buttons with different styles.

### 4.3 Remove/Delete (X) Buttons

**Current state:** GridListRow and ItemCard have delete/remove actions. IconButton with X or Trash. Modal confirmations use DeleteConfirmModal or ConfirmActionModal.

**Recommendation:** Use shared IconButton and shared confirm modal. Ensure “remove from list” (e.g. remove power from character) and “delete from library” (delete power from user library) both use the same confirmation pattern and button style.

### 4.4 Color Schemes, Dark Mode, Accessibility

**Current state:** globals.css defines design tokens (primary, success, danger, warning, surface, text-*). Components use these. Dark mode via `dark:` and next-themes. Skip-to-content and ARIA improvements were added in prior audits.

**Recommendation:** No new raw color classes. New components must use tokens. Quick audit: grep for `blue-`, `green-`, `red-`, `gray-` (outside auth) and replace with tokens. Document “Design tokens only” in AGENT_GUIDE or DESIGN_SYSTEM.

### 4.5 Buttons, Text, Fonts, Headers

**Current state:** Button and IconButton from ui; SectionHeader for section titles; PageHeader for page title and actions. Headings use consistent sizes (text-lg, text-base, etc.).

**Recommendation:** Use PageHeader for every top-level page (creators, library, codex, character sheet). Use SectionHeader for in-page sections. Same font hierarchy (e.g. one H1 per page, then section titles). Document in UI_COMPONENT_REFERENCE or AGENT_GUIDE.

---

## 5. Background Logic & Code

### 5.1 Calculations for Characters/Creatures

**Current state:**

- **`src/lib/game/formulas.ts`:** Level progression, ability points, skill points, XP. Single source for “how many points per level.”
- **`src/lib/game/calculations.ts`:** Defenses, health, energy, speed, evasion — all derived from abilities and defense skills. Single source.
- **`src/lib/game/skill-allocation.ts`:** Skill point costs, caps, defense allocation costs, total skill points for character vs creature.
- **`src/lib/calculators/`:** Power/technique/item costs and display (derivePowerDisplay, deriveTechniqueDisplay, deriveItemDisplay, filterSavedItemPropertiesForList, etc.).

**Unification:** No duplication. Components and creators should **never** inline formulas; they must call these modules. Document in AGENT_GUIDE: “All character/creature math: formulas.ts, calculations.ts, skill-allocation.ts. All power/technique/item cost and display: lib/calculators.”

### 5.2 Data Enrichment

**Current state:** `data-enrichment.ts` provides `enrichPowers`, `enrichTechniques`, `enrichItems`. Character data (IDs/names) is combined with library and Codex to produce display-ready objects. Single place.

**Recommendation:** Keep. Any new “saved ID + library/codex” display logic should go through enrichment or a shared resolver, not inline in components.

### 5.3 Database & API

**Current state:** Character CRUD via `character-service.ts`; library CRUD via `library-service.ts` and hooks (`useUserLibrary`, mutations). Codex via `/api/codex` and useCodex* hooks. Validation (Zod) and api-client pattern in place.

**Recommendation:** New features use existing services and hooks. No direct Prisma or Supabase in components; go through services or server actions.

### 5.4 Security

**Current state:** Admin check via server-side `ADMIN_UIDS`; auth via Supabase; API validation and rate limiting in place (per prior audit).

**Recommendation:** Keep admin and auth logic centralized. Creators only read `isAdmin` from a single hook or context; no duplicated admin checks.

---

## 6. Prioritized Recommendations

### Phase 1 — High impact, low risk

1. **Creator save toolbar and hook**  
   Extract `CreatorSaveToolbar` and `useCreatorSave`; refactor power, technique, item, creature creators to use them. Removes the largest block of duplicated creator UI and state.
2. **Header row styling**  
   Introduce a shared wrapper (e.g. `SortHeaderRow`) or standardize on ListHeader for all list views so column headers look the same everywhere (including dark mode).
3. **Document “mechanic vs list” load rule**  
   One short section in AGENT_GUIDE or a small `CREATOR_LOAD.md` that lists the three-step load pattern and points to `filterSavedItemPropertiesForList`, power EXCLUDED_PART, technique `!matchedPart.mechanic`.

### Phase 2 — Consistency and polish

4. **CreatorLayout**  
   Optional shared layout component for creators (header + main + sidebar + modals) to avoid layout drift.
5. **Allocation UI audit**  
   One pass: same alignment, spacing, and PointStatus/ValueStepper usage in character sheet, character creator, creature creator for abilities, defenses, skills, HP/EN.
6. **PoweredMartialSlider in character sheet**  
   Use the same component in character sheet edit for powered-martial so allocation UX matches creature creator.

### Phase 3 — Deeper unification (optional)

7. **Single list header component**  
   Migrate all SortHeader-based views to ListHeader with column arrays so there is only one header component.
8. **Shared creator load helper**  
   If beneficial, add a thin `useCreatorLoad(type, options)` that encapsulates “fetch library, open modal, onSelect → filter mechanics + restore state” and leaves type-specific mapping to callers.

---

## 7. Summary Table

| Area | Current state | Unification opportunity |
|------|----------------|--------------------------|
| Creator save/load | Duplicated in 4 creators | CreatorSaveToolbar + useCreatorSave; document load pattern |
| Creator layout | Similar but not shared | Optional CreatorLayout |
| List headers | ListHeader + SortHeader, row style varies | Shared header row style or single ListHeader everywhere |
| Sort | useSort everywhere | Keep |
| List rows | GridListRow / ItemCard / ItemList | Keep; align action buttons and chips |
| Ability/skill/defense/HP-EN | Shared components | Audit alignment and variants |
| Steppers, SectionHeader | Shared | Keep; document usage |
| Calculations | formulas, calculations, skill-allocation, calculators | Keep; no inline formulas |
| Enrichment & API | Centralized | Keep |

This audit should be used to create or update tasks in `AI_TASK_QUEUE.md` and to guide future PRs so that new code uses the same patterns and centralized sources of truth described above.
