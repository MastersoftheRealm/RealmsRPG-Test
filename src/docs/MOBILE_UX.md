# Mobile UX — RealmsRPG

Single reference for mobile breakpoints, touch targets, and layout patterns. Use when implementing or editing any page, modal, or layout so the site stays usable on phones without zoom.

**See also:** `.cursor/rules/realms-mobile.mdc`, `AGENT_GUIDE.md` (Mobile subsection), `ARCHITECTURE.md`.

---

## Breakpoints

| Viewport | Tailwind | Use |
|----------|----------|-----|
| Phone | &lt; 640px | Primary mobile: single column, full-screen modals, side-scroll or collapse for dense sections. |
| Tablet | `sm` (640px) – `md` (768px) | Often same as phone for modals/layout; can start 2-column where it helps. |
| Desktop | `md` (768px)+ | Multi-column layouts, centered modals, full nav. |
| Large | `lg` (1024px)+ | List headers visible, character sheet 3-column grid. Site header still uses the menu button through `lg`. |
| Wide | `xl` (1280px)+ | Site header inline desktop nav (`header.tsx`); hamburger hidden. |

**Rule of thumb:** Use **&lt; 768px (`md`)** as the cutoff for “mobile” behavior (full-screen modals, section side-scroll, stacked layout). Use **&lt; 640px (`sm`)** when you need phone-specific tweaks (e.g. smaller gutters).

---

## Touch targets

- **Scope:** The 44×44px minimum applies to **mobile/touch viewports** (e.g. below `md`), not as a blanket rule for the whole site. WCAG 2.1 AA does not require a minimum target size; WCAG 2.5.5 (Level AAA) and platform guidelines (Apple HIG, Material) recommend 44–48pt for touch. We enforce 44px on phones so the site is usable without zoom — **not** so desktop chrome matches phone chrome.
- **Desktop vs mobile (do not compromise either):** Design **two densities**. Mobile gets full-screen modals, side-scroll panels, and 44px targets. Desktop (`md+`) prefers **icon-hugging** controls (pencils, steppers, inline icons) without large empty hit-box chrome. Never “fix” desktop by applying mobile min-size padding that leaves empty painted space around icons (`EditSectionToggle`, sheet header actions, etc.).
- **Owner feedback convention:** Feedback is **desktop-first** unless the owner prefixes **`mobile feedback:`**. Do not reinterpret desktop screenshots as a request to enlarge touch targets sitewide.
- **Minimum size (on touch):** Below `md`, tappable controls (buttons, icon buttons, steppers, tab triggers, toolbar icons, links in dense UI) should be at least 44×44px. On desktop (`md+`), controls can be smaller (e.g. compact steppers, icon-only pencils) since pointer precision is higher.
- **Spacing:** Leaving enough gap between targets (e.g. 8px) helps avoid mis-taps. Spacing **supplements** but does not replace a minimum target size on touch: small targets remain hard to tap accurately even with spacing.
- **Implementation:** Prefer responsive sizing: `touch-target-md-compact` (utility in `globals.css`), `min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0`, or `--touch-target-min: 44px` on steppers/toggles. Use `@media(pointer:coarse)` on `Button`/`IconButton` where the control stays compact on desktop only.
- **Legal / AA note:** WCAG 2.1 AA has no 44px target requirement; 44px is our mobile UX choice (AAA / platform HIG). Prefer UI cleanliness on desktop over AAA target size when they conflict.
- **Reference:** `--touch-target-min: 44px` and `--mobile-gutter: 0.75rem` in `globals.css` (optional; use in components when helpful).

Audit: `ValueStepper`, `IconButton`, `EditSectionToggle`, sheet action toolbar, tab triggers, list row actions.

---

## Modals

- **Full-screen on mobile:** For selection/add modals, wizards, recovery, level-up, settings, and other large dialogs, set **`fullScreenOnMobile`** on `Modal`. When viewport is &lt; `md`, the modal renders full-screen (sticky header/footer, scrollable content). On `md+`, existing size behavior applies.
- **Sticky action buttons:** Put primary actions (**Add Selected**, Confirm, Load, Pick Me, etc.) in the Modal **`footer`** prop — never inside `children`. The footer is `shrink-0` outside the scroll region so users do not scroll to reach it on phones. `UnifiedSelectionModal` already wires Cancel / Add Selected (or `confirmLabel` / `primaryActions`) through `footer`. Avoid bottom padding on the scroll content that creates a blank strip above the sticky footer (`pb-0` on USM content — TASK-574).
- **List-first selection chrome (TASK-564):** In add/load/`UnifiedSelectionModal` flows, the **scrollable list is the primary focus**. Search and a **Filters** toggle share one compact toolbar row. **Primary mode tabs** (Powers/Empowered, Armaments/Equipment, feat-source, inventory type) stay **always visible** via `scopeExtra` under search. SourceFilter, custom-add forms, and advanced filters live in a **collapsed-by-default** `FilterSection` (`variant="compact"`) as `headerExtra` / `filterContent`. Optional `optionsSummary` / `optionsActiveCount` show secondary options when Filters are closed.
- **Add-modal header help (TASK-574):** Prefer **no** `description` under the title, or a **single short sentence**. Do not use multi-sentence “click row / Add Selected” instructions — the list + sticky footer already teach the grammar.
- **Leave with selection (TASK-574):** `UnifiedSelectionModal` prompts **Add selected?** (or **Load selected?**) when Cancel / X / backdrop / Escape would discard unconfirmed picks. **Add Selected** confirms; **Don't add** discards; closing the prompt keeps browsing.
- **Which modals:** Add/load/settings/level-up/recovery, unified selection, add feat/skill/library item, confirm-action and delete-confirm when content is tall, login prompt. Small confirmations can stay centered without full-screen.
- **Crafting:** Item selection happens within `/crafting` session flows (`/crafting` + `/crafting/[id]`), not a standalone `/crafting/new` page. DeleteConfirmModal for session delete uses fullScreenOnMobile. Touch targets ≥44px for roll inputs, steppers, and buttons on crafting session pages.

---

## Dense layouts (character sheet, etc.)

- **Preferred:** **Horizontal (side) scrolling** between section panels on mobile. Each section is a full-width panel; user swipes or scrolls left/right (e.g. Abilities → Skills → Archetype → Library). Use `overflow-x-auto`, `scroll-snap-type: x mandatory`, `scroll-snap-align: start` on panels, and optional section strip/dots for current panel and tap-to-jump.
- **Panel gutters (keep content aligned with the page):** Bleed the scroller with matching negative margin + padding (`-mx-4 px-4` / `sm:-mx-6 sm:px-6` to match `PageContainer`), set the same values as `scroll-padding-inline` (`scroll-px-4 sm:scroll-px-6`), size panels with `basis-full` (not `min-w-full` of the outer viewport), and leave a `gap-4` between panels so snap stops stay centered with the header above.
- **Within each panel:** Vertical scroll only. No horizontal scroll inside the panel.
- **When to use collapse instead:** Few sections, lighter content, or sub-sections inside a panel (e.g. Library’s Powers/Techniques/Equipment as collapsible blocks). Use the current app collapsible pattern components in the relevant domain (for creator sections, `creator/collapsible-section.tsx`).

**Character sheet:** Below `md`, use side-scroll of Abilities, Skills, Archetype, Library (`character-sheet-body.tsx`). Panels share PageContainer gutters with the sheet header; gap between panels during swipe (TASK-538). Sheet header and toolbar stay responsive (stack resources, toolbar position for thumb reach). Library → Inventory summary stacks Currency and Armament Proficiency below `sm` so labels do not overlap on phone widths (TASK-537). Skills edit Value steppers: table min-width + `TableScroll` so `+` is not clipped in the narrow desktop Skills column (TASK-543; data-table scroll exception, not panel side-scroll).

**Other dense pages:** Same idea — side-scroll between major sections where it fits (e.g. encounter tracker, campaign detail); collapse when sections are few.

---

## Lists and tables

- **ListHeader:** Desktop: column headers in a grid (`hidden lg:grid`). **Mobile:** no column headers; instead an expandable **"Sort by"** control that uses the same sort logic (sortState, onSort). Tap to expand and choose sort criteria (e.g. Name, Damage, Energy); tap an option to sort; tap same option again toggles A→Z / Z→A. Same behavior as desktop column clicks.
- **GridListRow:** Use `hideOnMobile` on columns that aren’t essential on small viewports (e.g. hide secondary columns, show name + primary value). Expanded row shows full details. Below `lg`, the row collapses empty desktop data-column tracks (`buildMobileCollapsedGridColumns`) so the name keeps `minmax(0, 1fr)` beside X/+ actions instead of wrapping into a narrow first `fr` track. Apply **data-column** templates via `--glr-desktop-grid` / `--glr-mobile-grid` classes — never inline `gridTemplateColumns` on the name/column grid (inline styles override the mobile media query). The chrome stretch-grid (header + action columns, TASK-710) may set its own template inline; that is not the data-column template. **Expand hit target:** header trigger, mobile summary body, and non-interactive expanded-panel areas all toggle expand/collapse (buttons, links, chip groups excluded).
- **Tabs:** TabNavigation uses `overflow-x-auto`; ensure tab strip scrolls horizontally on narrow screens instead of wrapping into a tall block.

---

## Agent checklist (new or edited pages)

When **creating or editing** a page or modal:

1. **Page**
   - Responsive breakpoints: stack or single column below `md`?
   - **Dense layout (many sections)?** Prefer **side-scroll** between section panels on mobile; use **collapse** when sections are few or content is lighter.
   - Touch targets ≥ 44px for interactive elements **on mobile** (below `md`)?
   - No horizontal scroll at ~360px width for main content (tabs can scroll horizontally).

2. **Modal**
   - For selection, add-X, load, recovery, level-up, settings, wizards: set **`fullScreenOnMobile`** so it goes full-screen below `md`. Header/footer sticky, content scrollable.
   - Confirm / Add Selected / Load actions go in Modal **`footer`** (not scrolled children).
   - Selection/add modals: list-first chrome — Filters collapsed by default; verify ~360px still shows several list rows between toolbar and footer.

3. **List/table**
   - Use `ListHeader` (hidden on mobile) and `GridListRow` with sensible `hideOnMobile` columns so mobile sees name + key info, details on expand.
   - **Stable vertical expand:** Expand-in-place chips keep their collapsed vertical row, move to the chip group’s left edge, and take the full group width. Every chip from the same row onward reflows below the expanded chip. The pointer/finger stays vertically aligned, though horizontal re-aiming is expected. Header **or expanded body** toggles (Options / nested controls excluded). GridListRow: header, mobile summary, or non-interactive expanded body. See AGENT_GUIDE → Stable expand toggle.

4. **Verification**
   - Resize to 360px width (or use DevTools device mode); confirm no pinch-zoom needed, modals usable, controls tappable.
   - For accessibility: contrast and labels per `src/docs/ACCESSIBILITY.md`; touch targets ≥ 44px on mobile (above).
   - Expand a chip mid-row: confirm it does not jump vertically, becomes left-aligned/full-width, and all same-row/later chips move below it.
---

## Key components

| Component | Location | Mobile behavior |
|-----------|----------|-----------------|
| Header | `src/components/layout/header.tsx` | Menu button below `xl`; inline nav `xl+` only (avoids mid-width document overflow). |
| Modal | `src/components/ui/modal.tsx` | `fullScreenOnMobile` → full-screen below `md`; put actions in `footer` (sticky). |
| Collapsible section pattern | `src/components/creator/collapsible-section.tsx` | Use for within-panel sub-sections or lighter pages. |
| ListHeader | `src/components/shared/list-header.tsx` | Desktop: column header grid. Mobile: expandable "Sort by [criteria] (A→Z)" using same sortState/onSort; no column headers. |
| ExpandableChip / ChipGroup | `src/components/ui/expandable-chip.tsx` | Wrap groups use `items-start`; expand keeps its row, moves left, and takes full group width; header or body toggles. |
| GridListRow | `src/components/shared/grid-list-row.tsx` | `hideOnMobile` on column values; mobile grid collapses vacated `fr` tracks so names aren’t squeezed by X/+; summary/body also toggle expand. |
| TabNavigation | `src/components/ui/tab-navigation.tsx` | Tabs use `overflow-x-auto` in globals; triggers have `min-h` touch target below `md`. |
| TableScroll | `src/components/ui/table-scroll.tsx` | Wrap data tables for horizontal scroll on narrow viewports. |
| PageContainer | `src/components/ui/page-container.tsx` | `px-4 sm:px-6 lg:px-8`; adjust if audit shows overflow. |
