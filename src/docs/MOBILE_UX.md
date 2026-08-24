# Responsive UX — RealmsRPG

Single reference for breakpoints, touch targets, and layout contracts.

> **Scope note:** despite the filename this document covers **every viewport**, not just phones. The 2026-08-18 audit found the app's worst layout failures at **1024px**, not on a phone (`reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md` §6). The file keeps its historical name because `AGENTS.md`, `.cursor/rules/`, and many task entries link to it.

**Authority:** [`ADR-0023`](ai/ADR/0023-responsive-layout-contracts.md) — responsive layout contracts and tiered touch targets.
**See also:** `.cursor/rules/realms-mobile.mdc`, `DESIGN_SYSTEM.md`, `ACCESSIBILITY.md`.

---

## The one rule to internalise

**Input method drives hit area. Viewport drives layout.** They are different questions and must not share a mechanism.

| Question | Mechanism | Examples |
|---|---|---|
| How big is the tappable region? | `@media (pointer: coarse)` | button min-height, expanded hit areas, stepper glyphs |
| How is the page arranged? | viewport breakpoints | column counts, stacking, side-scroll vs grid, full-screen modals |

Viewport width is a *proxy* for input method, and it is wrong at both ends — a touchscreen laptop at 1400px needs a big hit area; a 700px-wide desktop window does not.

**Migrated (TASK-841):** `Button` / `IconButton` / `ValueStepper` / tab triggers / `.hit-area-layout-neutral` use `@media (pointer: coarse)`. Modal/screen Primary CTAs (Add Selected, Save, Continue, Confirm) use `Button size="lg"` (48px under coarse). Dense expanded hit is `.hit-area-dense` (height-first) or `.hit-area-dense-square` (icon-only). **TASK-836:** sheet proficiency dots stay 16px paint + `.hit-area-layout-neutral`; Sub-Skills label is Dense; `ResourceInput` current value is Standard 44 under coarse. **TASK-830:** shared `Input` / `Select` / `Textarea` / `SearchInput` use Standard 44 (`touch-tier-standard`, no `min-w`) under coarse pointer; fine pointer keeps compact `h-10` (Textarea keeps `min-h-[100px]`). Filter rows stay `FILTER_CONTROL_CLASS` `h-11`. **TASK-847:** Codex spreadsheet toolbar, list **Filters**, and RollLog send dropped viewport `md:` / `max-md:` 44 slabs (pointer tiers / shared `Button`). **TASK-865:** core-rules add-row links, rulebook nav + chapter prev/next, CharacterFilter header, and Codex spreadsheet row hits dropped `md:min-h-0` / `md:min-h-5` / `md:min-h-[36px]` slabs (`touch-tier-standard` / `IconButton`). **TASK-866:** `SegmentedControl` default size is Standard 44 under coarse (`touch-tier-standard`); item-creator handedness uses that control, not a custom always-on 44 pair.

---

## Breakpoints

| Viewport | Tailwind | Use |
|----------|----------|-----|
| Phone | &lt; 640px | Single column, full-screen modals, side-scroll or collapse for dense sections. |
| Large phone / small tablet | `sm` (640px) – `md` (768px) | Usually same as phone; 2-column where it clearly helps. |
| Tablet / small laptop | `md` (768px)+ | Multi-column layouts, centered modals. |
| Laptop | `lg` (1024px)+ | List headers visible. **Highest-risk band — see C5.** |
| Desktop | `xl` (1280px)+ | Site header inline nav; hamburger hidden. |
| Wide | `2xl` (1536px)+ | Widest arrangements only. |

**Rule of thumb:** `< md` (768px) is the cutoff for *layout* mobile behaviour (full-screen modals, side-scroll, stacking). Use `< sm` for phone-specific tweaks like gutters. Never use a breakpoint to decide hit area.

---

## Touch targets — three tiers

| Tier | Coarse pointer | Fine pointer | Applies to |
|---|---|---|---|
| **Primary** | 48×48 min | natural | The one main action per screen or modal footer (Save, Continue, Add Selected) |
| **Standard** | 44×44 min | natural, compact | Standalone buttons, list row actions, tab triggers, form fields |
| **Dense** | 32×32 painted **+ 44×44 expanded hit area**, min 8px gap | natural | `size="sm"`, `variant="link"`, inline chips, steppers in constrained grid cells, proficiency dots, sort carets, footer nav links |

**Dense is the tier that makes density possible.** The painted box stays small; the hit area expands via a pseudo-element, so a 16px proficiency dot is still a 44px target. Use `.hit-area-layout-neutral` (`globals.css`) — 16px layout box, `::after { inset: -14px }`. This is why "make it dense" and "make it tappable" are no longer in conflict.

**Constraints:**

- **Height, not width.** `min-h` under coarse pointer makes a control tappable in a vertical list. `min-w` turns text links into slabs — do not add it. Icon-only controls set an explicit square size instead.
- **Expanded hit areas may not overlap.** That is what the Dense tier's 8px minimum gap is for. The layout gate checks it.
- **Do not inflate desktop chrome.** Never "fix" desktop by applying mobile min-size padding that leaves empty painted space around icons (`EditSectionToggle`, sheet header actions).
- **Spacing supplements, never replaces, target size.** Small targets stay hard to hit accurately even when well spaced.
- **Owner feedback is desktop-first** unless prefixed `mobile feedback:`. Do not read a desktop screenshot as a request to enlarge targets sitewide.
- **Legal note:** WCAG 2.1 **AA** has no target-size criterion. 44px is our choice (2.5.5 is AAA, plus Apple HIG / Material). Prefer cleanliness on desktop where they conflict.

---

## The six layout contracts

These say what must be **true**, not which utility to use. Both of the audit's worst defects were faithful to the old "prefer side-scroll" wording — that is why the rules are now contracts.

### C1 — Side-scroll

A horizontal panel carousel must:

- **bound its own height** so panels scroll internally instead of lengthening the page;
- **not stretch panels to the tallest sibling** (a flex row defaults to `align-items: stretch` — this produced 2332px of dead scroll on the character sheet);
- **show a visible affordance** that more content exists horizontally (edge fade, chevron, or deliberate partial-item peek);
- **be reachable without a swipe** — keyboard and trackpad users must be able to get to off-screen items.

Gutters: size panels with `basis-full` (not `min-w-full`) inside the same content width as the header above (`PageContainer` already supplies `px-4` / `sm:px-6`). Leave `gap-4` between panels so snap stops stay aligned — do **not** pad the scroller itself (`px-4` + `scroll-px-4` + `basis-full` desyncs snap on WebKit). Within a panel: vertical scroll only. The height-bound column and the carousel flex item also need `min-w-0` so `min-width: auto` from those panels cannot widen the header (C6). Below `md`, the sheet `PageContainer` must not use `mx-auto`: auto side margins on a column-flex item cancel stretch, so the carousel sizes the header to its scroll width.

**When to collapse instead:** few sections, lighter content, or sub-sections inside a panel. Use the domain's collapsible pattern (for creator sections, `creator/collapsible-section.tsx`).

### C2 — Truncation

Any `truncate` / `line-clamp` needs `min-w-0` on **every** flex ancestor between the text and its constraining box — `truncate` alone silently does nothing when an ancestor flex item is `min-width: auto`. Text may never be clipped by `overflow: hidden` without `text-overflow: ellipsis`.

**Wrap strategy (TASK-897):** Prefer word/token boundaries over character-by-character breaks. Do **not** use `break-words` or `break-all` on identity text in dense list/table name columns — in a narrow track they produce one-letter lines and inflate row height. Use `truncate` (or `line-clamp-*` with `break-normal`) so overflow becomes an ellipsis; the expanded row / tooltip / detail view carries the full string. Multi-word labels that may stack (stat tile titles, ability names in fixed tiles) use `break-normal` so wraps happen at spaces. Reserve `break-words` only for prose/description blocks where mid-token breaks are acceptable. Never blanket `whitespace-nowrap` on names if it causes C6 page scroll.

### C3 — Fixed-count card sets

A known-length set of sibling cards uses `grid` with equal tracks. `flex-wrap` with content-width children **cannot** produce an even row — the sheet's four stat cards measured 100/100/186/153 at every width.

### C4 — Floating chrome

One dock owns each screen corner. Components **register** with the dock; they do not each declare their own `position: fixed` coordinates. The dock reserves page padding so content is never permanently covered. Two components independently choosing `bottom-4` and `bottom-5` is how the sheet toolbar and roll-log FAB ended up stacked on each other.

**Landed (TASK-837 / TASK-843):** `--dock-*` tokens + `.floating-dock-bottom-right` (RollLog) and `.sheet-mobile-action-dock` (sheet actions below `md`, FAB-sized end slot). `#main-content:has(.floating-dock-bottom-right)` reserves `--dock-reserved-end` from `md` up. The C1 sheet frame uses `--sheet-mobile-bottom-reserve` (owner `.has-sheet-mobile-dock` → `--sheet-mobile-dock-height`; RM / no-toolbar frames stay 0 and pad panels with `--sheet-mobile-fab-gutter`). `body:has([aria-modal='true'])` hides both so Recovery / Level Up / Add Feat footers stay tappable. Do not add a third `fixed bottom-*`.

### C5 — Breakpoint honesty

A layout switch happens at a width where the target arrangement **actually fits**, not at a nominal breakpoint name. Verify every layout switch at **360 / 390 / 768 / 1024 / 1280 / 1440**.

**Landed (TASK-839 / TASK-885):** Speed / Evasion / DR / Crit sit in an equal-track `grid` (C3: 2-col below `md`, 4-col from `md`, 2×2 in the middle column). The cluster is `w-max` and centered so tiles stay compact/squarish and do not fill the middle track. Three-column identity | stats | resources engages at `lg` (1024) as equal `minmax(0,1fr)` tracks — not leftover flex — so stats are never a 119px column. From `xl`, side tracks cap (`minmax(0,20rem)` / `minmax(16rem,20rem)`). Below `lg`: identity | resources, stats spanning. The mobile frame/column/carousel use `min-w-0` so the C1 scroller cannot stretch the header past the viewport.

### C6 — Overflow

No horizontal page scroll at any audited width. Horizontal scroll exists only inside explicit scroll containers that satisfy C1's affordance requirement.

Closed floating panels must be **unmounted** or `display: none`. `w-0` / `opacity-0` / `overflow-hidden` still lays out children; those boxes report past the viewport right edge (`overflowRight` on `/creature-creator` — TASK-826). `TableScroll` is `relative min-w-0` so `sr-only` table headers cannot use the initial containing block and widen `documentElement.scrollWidth`.

---

## Modals

- **Full-screen on mobile:** for selection/add modals, wizards, recovery, level-up, settings, and other large dialogs set **`fullScreenOnMobile`** on `Modal`. Below `md` it renders full-screen (sticky header/footer, scrollable content); `md+` keeps existing size behaviour.
- **Sticky action buttons:** primary actions (**Add Selected**, Confirm, Load, Pick Me) go in the Modal **`footer`** prop — never inside `children`. Those Primary CTAs use **`Button size="lg"`** (48px min-h under coarse pointer); Cancel / secondary stay default `md` (Standard 44). The footer is `shrink-0` outside the scroll region. Modal applies footer inset (`px-4 py-3` / `md:px-6 md:py-4`) — do not add a second `p-4`/`px-6`. `UnifiedSelectionModal` already wires Cancel / Add Selected (or `confirmLabel` / `primaryActions`) through `footer`. **AddCombatantModal** (non-USM) puts Library/Campaign **Add** in `footer` the same way (qty + combatant-type radios stay in content — TASK-846). Avoid bottom padding on scroll content that creates a blank strip above the sticky footer (`pb-0` on USM content — TASK-574).
- **List-first selection chrome (TASK-564 / TASK-815):** the scrollable list is the primary focus. Search and a **Filters** toggle share one compact toolbar row. **Primary mode tabs** (Powers/Empowered, Armaments/Equipment, feat-source, inventory type) and the sheet **Add equipment custom-item form** stay always visible via `scopeExtra` under search. SourceFilter and advanced filters live in a collapsed-by-default `FilterSection` as `headerExtra` / `filterContent`. Optional `optionsSummary` / `optionsActiveCount` show secondary options when Filters are closed.
- **List-first browse chrome (TASK-721):** Codex, Library (Official + My), and Admin Codex/Images GLR filter pages use the same Search + Filters row via `ListSearchToolbar` composing FilterSection. Create/sync (`searchTrailing`) sits after Filters, not in the Filters slot. USM/L3 unchanged.
- **Add-modal header help (TASK-574):** prefer **no** `description` under the title, or one short sentence. No multi-sentence "click row / Add Selected" instructions — the list + sticky footer teach the grammar.
- **Leave with selection (TASK-574):** `UnifiedSelectionModal` prompts **Add selected?** (or **Load selected?**) when Cancel / X / backdrop / Escape would discard unconfirmed picks.
- **Which modals:** add/load/settings/level-up/recovery, unified selection, add feat/skill/library item, confirm-action and delete-confirm when tall, login prompt (`LoginPromptModal` actions in `footer` so **Continue Without Saving** stays pinned). Small confirmations can stay centered.
- **Crafting:** item selection happens within `/crafting` session flows, not a standalone `/crafting/new`. DeleteConfirmModal for session delete uses `fullScreenOnMobile`.

---

## Dense layouts (character sheet, etc.)

Side-scroll between section panels is the preferred pattern — subject to **C1**, which is not optional.

**Character sheet:** below `md`, side-scroll of Abilities, Skills, Archetype, Library (`character-sheet-body.tsx`). The sheet frame is viewport-bounded (`calc(100svh-5rem)` minus the C4 dock). Each panel scrolls internally instead of stretching to the tallest sibling (C1 / TASK-838). The sheet header is not an inner scroller; vertical touch/wheel on it bridges to the active panel, and scrolling a panel fully collapses the header (`max-h-0`) so it does not keep half the lower section (TASK-868 / TASK-902). Collapse uses hysteresis (hide after ~48px; restore only at `scrollTop === 0`) so scrolling up does not snap-lock the header mid-gesture. The carousel allows both `pan-x` and `pan-y` (do not use `touch-pan-x` alone — that blocks vertical scroll on panel content). Library list content uses the panel scroller below `md` (no nested `overflow-y-auto`). At rest the carousel reuses the tab-strip C1 edge fade (`tabListOverflowState` + `data-overflow-*` mask — no `-mx`/`scroll-px` peek). Snap panels share the header’s PageContainer width (no carousel padding). Below `md` the site footer is hidden while `.character-sheet-mobile-frame` is mounted so the document stays viewport-bounded. The dock is an opaque bottom strip; the RollLog FAB sits in its end slot (not a second `fixed bottom-*`). Header Speed / Evasion / DR / Crit cards are an equal-track grid; three-column identity | stats | resources starts at `lg` with equal tracks, capped sides from `xl` (C3/C5 / TASK-839). The mobile column/carousel use `min-w-0` so the scroller cannot widen the header. Panels share PageContainer gutters with the sheet header; gap between panels during swipe (TASK-538 / TASK-868). Library → Inventory summary stacks Currency and Armament Proficiency below `sm` so labels do not overlap (TASK-537). Skills spend/temp steppers sit in the Bonus/Value cell (`editControlsPlacement="inline"`) so the narrow desktop Skills column needs no fifth column, forced table min-width, or inner `TableScroll` (TASK-800). Skill names use `WordHelpTip` `compact` for Codex descriptions (TASK-803).

**Other dense pages:** same idea for encounter tracker and campaign detail; collapse when sections are few.

---

## Lists and tables

- **ListHeader:** desktop shows column headers in a grid (`hidden lg:grid`). Mobile shows no column headers — instead an expandable **"Sort by"** control using the same `sortState` / `onSort`. Tap to expand and choose; tapping the same option toggles A→Z / Z→A.
- **GridListRow:** use `hideOnMobile` on non-essential columns. Below `lg` the row collapses empty desktop data-column tracks (`buildMobileCollapsedGridColumns`) so the name keeps `minmax(0, 1fr)` beside X/+ actions. Apply data-column templates via `--glr-desktop-grid` / `--glr-mobile-grid` classes — **never** inline `gridTemplateColumns` on the name/column grid (inline styles override the mobile media query). The chrome stretch-grid (TASK-710) may set its own template inline; that is not the data-column template. **Expand hit target:** header trigger, mobile summary body, and non-interactive expanded-panel areas all toggle expand/collapse (buttons, links, chip groups excluded). **Collapsed vs expanded (TASK-868):** mobile summary column facts hide while the row is expanded (body shows them); blank / `-` values are omitted. **Expanded reflow (TASK-898):** when a row expands, column facts (Uses, Recovery, Energy, etc.) move out of the collapsed header grid into the expanded body at every width — header tracks are too narrow for stepper + text pairs. Interactive column values (steppers) stack label above control and span full width on two-column stat grids; text facts stay side-by-side where space allows. `min-w-0` on every flex ancestor (C2).
- **Tabs:** `TabNavigation` uses `overflow-x-auto` with a C1 overflow affordance (edge fade + chevrons that hide when the strip does not overflow; chevrons sit in the fade with an 8px gap to unfaded labels; arrow keys and chevrons scroll **the tablist only**, not ancestor carousels). A control beside the strip (Codex **Advanced**) is `trailing` — stacked below `md`, in-bar from `md` outside the tablist (TASK-827). `labelMobile` is the below-`md` label. Legacy `CreatorTabBar` and Guided chapter rail reuse the same `.tab-nav-scroll` chrome (`TabNavOverflowScroller`) — TASK-848.

---

## Agent checklist (new or edited pages)

1. **Page**
   - Does the layout stack or single-column below `md`?
   - Dense (many sections)? Side-scroll per **C1**, or collapse when sections are few.
   - Touch targets assigned a tier (Primary / Standard / Dense) — not defaulted to 44px everywhere.
   - No horizontal page scroll at 360px (**C6**).
2. **Modal**
   - `fullScreenOnMobile` for selection / add-X / load / recovery / level-up / settings / wizards.
   - Actions in Modal `footer`, not scrolled children.
   - At ~360px, several list rows visible between toolbar and footer.
3. **List / table**
   - `ListHeader` (hidden on mobile) + `GridListRow` with sensible `hideOnMobile`.
   - **Expanded column facts (TASK-898):** when a row expands, Uses/Recovery/etc. move to the expanded body at all widths; interactive values (steppers) stack full-width — no header-track overlap at 360px or in narrow sheet panels.
   - **Stable vertical expand:** expand-in-place chips keep their collapsed vertical row, move to the chip group's left edge, and take the full group width; every chip from that row onward reflows below. Header or expanded body toggles (Options / nested controls excluded). See AGENT_GUIDE → Stable expand toggle.
4. **Verification — all six widths**
   - Check **360 / 390 / 768 / 1024 / 1280 / 1440** (**C5**). "Mobile and desktop" is not sufficient; 1024 is where things break.
   - Run `npm run verify:responsive` — probes every width and ratchets against `tests/visual/responsive-baseline.json`. It fails when a violation count **increases**.
   - Contrast and labels per `ACCESSIBILITY.md`.

---

## Key components

| Component | Location | Responsive behavior |
|-----------|----------|---------------------|
| Header | `src/components/layout/header.tsx` | Menu button below `xl` is `IconButton` md (coarse square, compact on fine — TASK-851); inline nav `xl+` only (avoids mid-width overflow). |
| Modal | `src/components/ui/modal.tsx` | `fullScreenOnMobile` → full-screen below `md`; actions in `footer` (sticky). |
| Collapsible section | `src/components/creator/collapsible-section.tsx` | Within-panel sub-sections or lighter pages. |
| ListHeader | `src/components/patterns/list/list-header.tsx` | Desktop column grid; mobile expandable "Sort by". |
| ExpandableChip / ChipGroup | `src/components/ui/expandable-chip.tsx` | Wrap groups use `items-start`; expand keeps its row, moves left, takes full group width. |
| GridListRow | `src/components/patterns/list/grid-list-row.tsx` | `hideOnMobile` columns; mobile grid collapses vacated `fr` tracks; summary/body toggle expand. |
| TabNavigation | `src/components/ui/tab-navigation.tsx` | `overflow-x-auto` + C1 edge fade/chevrons (TASK-840). Wizard rails reuse `TabNavOverflowScroller` (TASK-848). |
| RollLog | `src/components/rolls/roll-log.tsx` | `.floating-dock-bottom-right` (C4 / TASK-837). Panel width `min(22.5rem, 100svw − 2×gap)`; hidden while `aria-modal` is open. |
| SheetActionToolbar | `src/components/character-sheet/sheet-action-toolbar.tsx` | `.sheet-mobile-action-dock` below `md`; top-right column from `md`. |
| GuidedStepFooter | `src/components/guided-creator/guided-step-footer.tsx` | Opaque `bg-surface` below `md`; frosted from `md+` (TASK-829). Layout `pb-24` / `pb-32` matches bar height. |
| TableScroll | `src/components/ui/table-scroll.tsx` | Horizontal scroll wrapper for data tables (`relative min-w-0` so `sr-only` headers cannot expand the page — TASK-826 / C6). |
| Sheet ability/defense tiles | `character-sheet/abilities-section.tsx` | C3 equal-track 2-col phone / 3-col `sm` / 6-col `lg`; GAME_RULES full names wrap inside the tile (TASK-835). |
| PageContainer | `src/components/ui/page-container.tsx` | `px-4 sm:px-6 lg:px-8`. |
