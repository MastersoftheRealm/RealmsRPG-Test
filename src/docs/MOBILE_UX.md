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
| Large | `lg` (1024px)+ | Header nav bar, list headers visible, character sheet 3-column grid. |

**Rule of thumb:** Use **&lt; 768px (`md`)** as the cutoff for “mobile” behavior (full-screen modals, section side-scroll, stacked layout). Use **&lt; 640px (`sm`)** when you need phone-specific tweaks (e.g. smaller gutters).

---

## Touch targets

- **Minimum size:** 44×44px for any tappable control (buttons, icon buttons, steppers, tab triggers, toolbar icons, links in dense UI).
- **Spacing:** Leave enough gap between targets so taps don’t hit the wrong one.
- **Reference:** `--touch-target-min: 44px` and `--mobile-gutter: 0.75rem` in `globals.css` (optional; use in components when helpful).

Audit: `ValueStepper`, `IconButton`, sheet action toolbar, tab triggers, list row actions.

---

## Modals

- **Full-screen on mobile:** For selection/add modals, wizards, recovery, level-up, settings, and other large dialogs, set **`fullScreenOnMobile`** on `Modal`. When viewport is &lt; `md`, the modal renders full-screen (sticky header/footer, scrollable content). On `md+`, existing size behavior applies.
- **Which modals:** Add/load/settings/level-up/recovery, unified selection, add feat/skill/library item, confirm-action and delete-confirm when content is tall, login prompt. Small confirmations can stay centered without full-screen.

---

## Dense layouts (character sheet, etc.)

- **Preferred:** **Horizontal (side) scrolling** between section panels on mobile. Each section is a full-width panel; user swipes or scrolls left/right (e.g. Abilities → Skills → Archetype → Library). Use `overflow-x-auto`, `scroll-snap-type: x mandatory`, `scroll-snap-align: start` on panels, and optional section strip/dots for current panel and tap-to-jump.
- **Within each panel:** Vertical scroll only. No horizontal scroll inside the panel.
- **When to use collapse instead:** Few sections, lighter content, or sub-sections inside a panel (e.g. Library’s Powers/Techniques/Equipment as collapsible blocks). Use existing `Collapsible` from `@/components/ui/collapsible.tsx`.

**Character sheet:** Below `md`, use side-scroll of Abilities, Skills, Archetype, Library. Sheet header and toolbar stay responsive (stack resources, toolbar position for thumb reach).

**Other dense pages:** Same idea — side-scroll between major sections where it fits (e.g. encounter tracker, campaign detail); collapse when sections are few.

---

## Lists and tables

- **ListHeader:** Already `hidden lg:grid` — column headers are hidden on small screens; rows still show key info.
- **GridListRow:** Use `hideOnMobile` on columns that aren’t essential on small viewports (e.g. hide secondary columns, show name + primary value). Expanded row shows full details.
- **Tabs:** TabNavigation uses `overflow-x-auto`; ensure tab strip scrolls horizontally on narrow screens instead of wrapping into a tall block.

---

## Agent checklist (new or edited pages)

When **creating or editing** a page or modal:

1. **Page**
   - Responsive breakpoints: stack or single column below `md`?
   - **Dense layout (many sections)?** Prefer **side-scroll** between section panels on mobile; use **collapse** when sections are few or content is lighter.
   - Touch targets ≥ 44px for interactive elements?
   - No horizontal scroll at ~360px width for main content (tabs can scroll horizontally).

2. **Modal**
   - For selection, add-X, load, recovery, level-up, settings, wizards: set **`fullScreenOnMobile`** so it goes full-screen below `md`. Header/footer sticky, content scrollable.

3. **List/table**
   - Use `ListHeader` (hidden on mobile) and `GridListRow` with sensible `hideOnMobile` columns so mobile sees name + key info, details on expand.

4. **Verification**
   - Resize to 360px width (or use DevTools device mode); confirm no pinch-zoom needed, modals usable, controls tappable.

---

## Key components

| Component | Location | Mobile behavior |
|-----------|----------|-----------------|
| Modal | `src/components/ui/modal.tsx` | `fullScreenOnMobile` prop → full-screen below `md`. |
| Collapsible | `src/components/ui/collapsible.tsx` | Use for within-panel sub-sections or lighter pages. |
| ListHeader | `src/components/shared/list-header.tsx` | `hidden lg:grid` — headers hidden on small screens. |
| GridListRow | `src/components/shared/grid-list-row.tsx` | `hideOnMobile` on column values. |
| TabNavigation | `src/components/ui/tab-navigation.tsx` | Tabs use `overflow-x-auto` in globals. |
| PageContainer | `src/components/ui/page-container.tsx` | `px-4 sm:px-6 lg:px-8`; adjust if audit shows overflow. |
