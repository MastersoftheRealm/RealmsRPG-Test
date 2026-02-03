# UI Component Reference

This file gathers the main UI components, shared utilities, and style conventions used across the site for unification and reuse.

> Location: `src/components/*` and `src/components/shared/*` (central exports in `src/components/ui/index.ts`).

---

## Table of Contents
- Core primitives
- Chips & badges
- Part / property chips (library / codex / character)
- Expandable / collapsible patterns
- Modals and overlays
- Navigation / tabs
- List utilities and patterns
- Feedback / loading
- Buttons & icon buttons
- Shared utilities & styles
- Notes on accessibility & behavior

---

## Core primitives (exports)
Central exports are in: [src/components/ui/index.ts](src/components/ui/index.ts#L1)

- `Button` (`./button`) — primary action button with `buttonVariants` (CVA). See `src/components/ui/button.tsx` (exported from index).
- `IconButton` (`./icon-button`) — icon-only button with `variant` & `size` variants, required `label` prop for accessibility. See [src/components/ui/icon-button.tsx](src/components/ui/icon-button.tsx#L1).
- `Input`, `Select`, `Checkbox`, `Textarea` — form primitives exported from `ui` folder.
- `SearchInput` — searchable input component (re-exported in `shared/list-components.tsx`).

These primitives use `class-variance-authority` (CVA) for variant definitions and `cn` utility for class merging.

## Chips & badges

- `Chip` — small inline badge with `variant` tokens and `size` (`sm|md|lg`). Supports `interactive` variant and optional `onRemove` callback. File: [src/components/ui/chip.tsx](src/components/ui/chip.tsx#L1).
  - **Recommended variants:** `default`, `primary`, category-based (action, activation, area, duration, target, special, restriction), status (success, warning, danger)
  - **Deprecated variants:** `secondary`, `outline`, `accent`, `info`, equipment types (weapon, armor, shield), content types (feat, proficiency, weakness, power, technique) — use `default` instead, let context provide meaning
  - Key props: `variant`, `size`, `interactive`, `onRemove`.

- `ExpandableChip` — interactive chip that expands into description content, keyboard-accessible (Enter / Space), category-based styling, optional `cost`, `sublabel`. File: [src/components/ui/expandable-chip.tsx](src/components/ui/expandable-chip.tsx#L1).
  - Key props: `label`, `description?`, `category?`, `sublabel?`, `cost?`, `defaultExpanded?`, `expandable?`.

- `ChipGroup` — wrapper for chips (flex wrap). See [src/components/ui/expandable-chip.tsx](src/components/ui/expandable-chip.tsx#L1).

Usage pattern: use `Chip` for small inline tags; `ExpandableChip` for chips with descriptive content the user might want to read inline. Chip variants are mapped to design tokens in `globals.css`.

## Part / Property chips (domain-specific)

- `PartChip` — unified chip used for parts (powers/techniques) and item properties. Shows `name`, optional TP (`tpCost`) and energy cost, chevron rotation when expanded. File: [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L1).
  - Props: `part: PartData` (name, text, description, tpCost, energyCost, optionLevels, category), `isExpanded?`, `onClick?`, `size?`, `className?`.
  - Visuals: category-based `categoryStyles` (design tokens), rings when expanded, TP badge (Zap icon).

- `PartChipDetails` — expanded panel for the selected `PartChip` showing description, TP badge, option levels. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L129).

- `PartChipList` — container that manages expansion state for a list of `PartChip` instances (single-open accordion behavior). Renders expanded details below chips. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L187).

- `PropertyChipList` — thin wrapper mapping simple property strings to `PartChipList` entries for items. See [src/components/shared/part-chip.tsx](src/components/shared/part-chip.tsx#L242).

Usage pattern: prefer `PartChipList` where multiple part chips are shown and a single expanded detail panel is required; `PartChip` can be used individually inside lists/cards.

## Expandable / Collapsible patterns

- `Collapsible` — general-purpose expandable section with smooth height animation, header area (title, icon, badge, count, action), chevron rotation, `aria-expanded`. File: [src/components/ui/collapsible.tsx](src/components/ui/collapsible.tsx#L1).
  - Props: `title`, `defaultOpen?`, `open?` (controlled), `onOpenChange?`, `children`, `icon?`, `badge?`, `count?`, `action?`, `disabled?`, className variants for header/content.
  - Behavior: uses measured `scrollHeight` to animate, sets height to `auto` after animation. `onOpenChange` used for controlled mode.

- `CollapsibleGroup` — accordion-like grouping that manages which children are open; supports `allowMultiple` option. See [src/components/ui/collapsible.tsx](src/components/ui/collapsible.tsx#L138).

Pattern notes: chips and part-chips implement their own expansion handlers (local state or parent-managed in `PartChipList`). `Collapsible` is used for larger section blocks (filters, lists, attribute groups).

## Modals and overlays

- `Modal` — portal-based dialog with backdrop, entrance animation, scroll locking, optional header (title/description) and close button implemented via `IconButton`. File: [src/components/ui/modal.tsx](src/components/ui/modal.tsx#L1).
  - Props: `isOpen`, `onClose`, `title?`, `description?`, `size?` (`sm|md|lg|xl|2xl|full`), `showCloseButton?`.
  - Behavior: locks body scroll when open, listens for Escape key, backdrop click closes by default, modal content uses `animate-modal-pop` (CSS animation in design tokens).

- `LoadingOverlay` / `LoadingState` (in `spinner.tsx`) — container-level or full-screen loading overlays used in pages or modals.

Modal usage notes: any chip/list/collapsible can be used inside a modal; no modal-specific chip variants are used — components are reused inside modals.

## Navigation / Tabs

- `TabNavigation` — unified tab bar with `underline` and `pill` styles, supports icons, counts, `fullWidth`. File: [src/components/ui/tab-navigation.tsx](src/components/ui/tab-navigation.tsx#L1).
  - Props: `tabs: Tab[]` (id, label, icon?, count?, disabled?), `activeTab`, `onTabChange`, `variant?`, `size?`, `fullWidth?`.

## List utilities and patterns

Shared list helpers live in `src/components/shared/list-components.tsx` and are widely used in Codex/Library pages:

- `SearchInput` — text input for searching lists (re-exported from `ui/search-input.tsx`).
- `SortHeader` — clickable column header that toggles sort dir and shows chevron.
- `FilterSection` — collapsible filter section with show/hide and internal content wrapper.
- `ResultsCount`, `EmptyState`, `LoadingSpinner`, `ListContainer`, `ColumnHeaders` — common UI used by list pages. File: [src/components/shared/list-components.tsx](src/components/shared/list-components.tsx#L1).

Usage notes: these building blocks are composable. `FilterSection` uses the `Collapsible` pattern but is implemented specifically for list filters.

### SectionHeader (NEW - Phase 1 Unification)

Standardized section header pattern with optional add button and count display. File: [src/components/shared/section-header.tsx](src/components/shared/section-header.tsx#L1).

- Props: `title`, `count?`, `onAdd?`, `addLabel?`, `rightContent?`, `size?` (`sm|md|lg`), `bordered?`
- Usage: All section headers in character sheet (Powers, Techniques, Weapons, Armor, Equipment, Feats)
- Pattern: When `onAdd` is provided, displays a `+` IconButton — always visible (not edit-mode dependent)

```tsx
<SectionHeader 
  title="Weapons" 
  count={weapons.length}
  onAdd={onAddWeapon}
  addLabel="Add weapon"
/>
```

### GridListRow (Extended - Phase 1 Unification)

The unified expandable list row now supports character sheet use cases with new props:

- `leftSlot` — Content rendered before the name (e.g., equip toggle, innate toggle)
- `rightSlot` — Content rendered after columns (e.g., roll buttons, use button)
- `equipped` — Boolean for green equipped state styling
- `innate` — Boolean for purple innate state styling
- `uses` — `{ current: number; max: number }` for feats with limited uses

These slots allow `GridListRow` to replace custom character sheet components (PowerCard, TechniqueCard, ItemCard) while maintaining flexibility.

## Feedback / loading

- `Spinner`, `LoadingOverlay`, `LoadingState` — unified loading visuals with size and variant options. See [src/components/ui/spinner.tsx](src/components/ui/spinner.tsx#L1).
- `ToastProvider` / `useToast` — toast notification system (exported from `ui/index.ts`).
- `Alert` — inline alert component for warnings/errors.

## Buttons & icon buttons

- `Button` (primary/shared) uses CVA for variants and sizes. See [src/components/ui/button.tsx](src/components/ui/button.tsx#L1).
  - **Recommended variants:** `primary`, `secondary`, `danger`, `ghost`, `link`
  - **Deprecated variants:** `gradient` (use primary), `success` (use primary), `outline` (use secondary), `utility` (use secondary/ghost)
  
- `IconButton` — used for modal close, small icon actions; requires `label` prop. See [src/components/ui/icon-button.tsx](src/components/ui/icon-button.tsx#L1).

## Shared utilities & styles

- `cn` (class name merge helper) — used across components (`/src/lib/utils/cn` or `/src/lib/utils`).
- `class-variance-authority` (CVA) — used for components with many variants (`Chip`, `IconButton`, `Button`), enabling consistent `variant` & `size` patterns.
- `lucide-react` — icon library (Zap, ChevronDown, X, etc.).
- Design tokens / CSS variables / colors live in global styles: `src/app/globals.css` (and `public/manifest` references). Components reference tokens such as `bg-category-action`, `text-category-action-text`, `border-category-action-border`.

## Accessibility & interaction notes

- Keyboard accessibility: `ExpandableChip` and `PartChip` set `tabIndex` and `role='button'` and toggle on Enter/Space. `Collapsible` and `TabNavigation` use appropriate `aria-expanded` / `role=tablist` / `role=tab`.
- Focus rings: `IconButton` and other interactive controls include accessible focus styles (`focus-visible:ring`).
- Modal: closes on Escape and backdrop click; body scroll is locked while open.

## Where they're used (high level)
- Character sheet pages and library/codex use `PartChipList`, `PropertyChipList`, `Collapsible` sections and `Chip` variants extensively (see `src/app/(main)/characters/[id]/page.tsx` for many calls to shared components and modal usage).
- Global navigation uses `TabNavigation` and page-level headers use `PageHeader` / `Card` primitives.

## Recommendations for unification

1. Centralize category tokens (if not already) in a single design tokens file (e.g., `globals.css`) and add a short mapping doc for token names used by chips & part-chips.
2. Ensure all chip-like components (`Chip`, `ExpandableChip`, `PartChip`) share a small prop surface (e.g., `interactive`, `size`, `variant/category`) so they can be composed and themed consistently.
3. Standardize expansion behavior: consider a small `useExpandable` hook that provides keyboard handlers, aria attributes, and animation timing (used by `ExpandableChip` and `PartChipList`).
4. Add unit or visual tests for the common patterns (collapsible height animation, chip expand/collapse, modal scroll lock).

---

If you want, I can:
- produce a cross-reference of actual callsites (search results linking where each component is used), or
- generate a small `USE_COMPONENTS.md` with code snippets/examples for each component.

Updated components/docs file path: `src/docs/UI_COMPONENT_REFERENCE.md`.
