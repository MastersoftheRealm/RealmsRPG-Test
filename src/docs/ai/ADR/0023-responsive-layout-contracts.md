# ADR-0023: Responsive layout contracts and tiered touch targets

- **Status:** accepted
- **Date:** 2026-08-18
- **Deciders:** owner (approved 2026-08-18) / agent (Architect role)
- **Supersedes:** the blanket 44×44 rule in `MOBILE_UX.md` § Touch targets
- **Resolves:** TASK-831

## Context

The mobile audit of 2026-08-18 (`reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`) measured the app at 360/390px against D&D Beyond, then re-measured the same structural checks at 768/1024/1280/1440. Two findings drive this ADR.

**1. The size scale is flat.** `Button` and `IconButton` apply `min-h-[44px] min-w-[44px]` under `@media(pointer:coarse)` for every variant and size, so 95% of Codex controls land in one 44–52px band (median control height 44px vs D&D Beyond's 36px; 5% of our controls under 44px vs their 64%). Nothing reads as primary, nothing recedes, and the page looks like a stack of equally heavy slabs. `min-w-[44px]` also inflates `variant="link"` and footer nav links into 167×44px boxes around 39–117px of text. Header bloat is *not* the cause — we beat D&D Beyond on chrome-before-first-row (546px vs 579px).

**2. The rules name patterns instead of stating contracts, and only describe two viewports.** `MOBILE_UX.md` says "prefer horizontal side-scroll for dense sections." Two separate defects (audit §5.1, §5.3) are *faithful to that rule as written* — one built a side-scroll carousel with an unbounded container that stretched every panel to the tallest sibling and produced 2332px of dead scroll, the other with no affordance that the strip scrolls at all. Meanwhile the worst breakpoint in the app is **1024px**, which no rule mentions: the character sheet header is 480px tall there with four stat cards in a 119px column, versus 212px at 1440px.

The same rule is also implemented three different ways today — `@media(pointer:coarse)` on `Button`/`IconButton`/`ValueStepper`, viewport `md:` on `.tab-nav-trigger` / `.tab-pill-trigger` / `.touch-target-md-compact`, and nothing at all on `Input`/`Select`/`Textarea` (fixed `h-10`). A touchscreen laptop and an iPad get different behaviour from the same intent.

## Decision

### 1. Input method drives hit area; viewport drives layout

These are different questions and must stop sharing a mechanism.

| Concern | Mechanism | Examples |
|---|---|---|
| How large is the tappable region | `@media (pointer: coarse)` | min-height on buttons, expanded hit areas, stepper glyph size |
| How is the page arranged | viewport breakpoints (`sm`/`md`/`lg`/`xl`) | column counts, stacking, side-scroll vs grid, full-screen modals |

Viewport width is a proxy for input method and it is wrong at both ends: a touchscreen laptop at 1400px needs a large hit area, and a 700px-wide desktop browser window does not. `.touch-target-md-compact` and the `md:min-h-0` in `.tab-nav-trigger` / `.tab-pill-trigger` are therefore **deprecated** — they answer a pointer question with a viewport answer.

### 2. Three touch-target tiers

| Tier | Coarse pointer | Fine pointer | Applies to |
|---|---|---|---|
| **Primary** | 48×48 min | natural | The one main action per screen or modal footer (Save, Continue, Add Selected) |
| **Standard** | 44×44 min | natural, compact | Standalone buttons, list row actions, tab triggers, form fields |
| **Dense** | 32×32 painted **+ 44×44 expanded hit area**, min 8px gap to neighbours | natural | `size="sm"`, `variant="link"`, inline chips, steppers in constrained grid cells, proficiency dots, sort carets, footer nav links |

The Dense tier is the important one: the **painted box stays small while the hit area expands via a pseudo-element**, so density and tappability stop being in conflict. `.hit-area-layout-neutral` in `globals.css` already implements exactly this (16px layout box, `::after { inset: -14px }` → 44px hit area) and becomes the canonical Dense mechanism — with its `md:` inset override converted to `pointer: coarse`.

**Expanded hit areas may not overlap.** That is why Dense carries a minimum 8px gap; the layout gate checks for it.

### 3. Drop `min-w` from the button minimum

Height is what makes a target tappable in a vertical list. Width is what turns text links into slabs. `Button` keeps a tier-appropriate `min-h` under coarse pointer and **loses `min-w-[44px]` entirely**. Icon-only controls set an explicit square size rather than relying on a global `min-w`.

### 4. Six layout contracts

Rules state what must be true, not which utility to reach for.

- **C1 Side-scroll.** A horizontal panel carousel must bound its own height so panels scroll internally rather than lengthening the page; must not stretch panels to the tallest sibling; must show a visible affordance that more content exists horizontally; and must let keyboard and non-touch users reach off-screen items without a swipe gesture.
- **C2 Truncation.** Any `truncate` / `line-clamp` requires `min-w-0` on **every** flex ancestor between the text and its constraining box. Text may never be clipped by `overflow: hidden` without `text-overflow: ellipsis`.
- **C3 Fixed-count card sets.** A known-length set of sibling cards uses `grid` with equal tracks — never `flex-wrap` with content-width children, which cannot produce an even row.
- **C4 Floating chrome.** One dock owns each screen corner. Components register with the dock; they do not each declare their own `position: fixed` coordinates. The dock reserves page padding so content is never permanently covered.
- **C5 Breakpoint honesty.** A layout switch happens at a width where the target arrangement actually fits, not at a nominal breakpoint name. Every switch is verified at 360 / 390 / 768 / 1024 / 1280 / 1440.
- **C6 Overflow.** No horizontal page scroll at any audited width. Horizontal scroll exists only inside explicit scroll containers that satisfy C1's affordance requirement.

### 5. The contracts are enforced, not just documented

`tests/visual/responsive-layout.pw.ts` (config `playwright.responsive.config.ts`, `npm run verify:responsive`) probes every audited width and ratchets against `tests/visual/responsive-baseline.json`: known violations are recorded per route/width, and the gate fails when any count **increases**. Wired into `ui-verify.yml`.

## Consequences

- **Positive:** density and tappability stop trading off, so the "everything looks bulky" complaint is fixable without regressing touch. One mechanism per question. The 1024–1280 band gets first-class coverage. The contracts are checkable, so the rules can no longer silently rot — and new violations are blocked at PR time rather than found in the next audit.
- **Negative / follow-ups:** **TASK-841 landed** `Button` / `IconButton` / `ValueStepper` / tab triggers / `.hit-area-layout-neutral` on pointer:coarse tiers; modal/screen Primary CTAs (USM Add Selected, Save, Continue, Confirm) use `size="lg"`. **TASK-857 landed** deleting the viewport Dense-hit alias; remaining Dense expanded hit is `.hit-area-dense` / `.hit-area-dense-square`. **TASK-837 landed** C4 `--dock-*` tokens, `.floating-dock-bottom-right`, and `.sheet-mobile-action-dock`. **TASK-843 landed** splitting C1 frame padding from the owner-dock strip (RM view uses `--sheet-mobile-fab-gutter` on panels). **TASK-839 landed** C3 equal-track sheet-header stat cards and C5 three-column header from `lg` (equal `minmax(0,1fr)` tracks; capped sides from `xl`; column/carousel `min-w-0` so the C1 scroller cannot widen the header). **TASK-826 landed** unmount-when-closed RollLog (C6 — `w-0` still overflowed). **TASK-828 landed** compact ability 2/3/6 grid + Dense steppers. **TASK-827 landed** `TabNavigation` `labelMobile` (below `md`) and `trailing` (Codex Advanced stacked below `md`, in-bar from `md` outside the tablist). **TASK-840 landed** C1 tab-strip overflow fade + chevrons on `.tab-nav-list` (hide when fully scrolled). **TASK-848 landed** the same chrome on Legacy `CreatorTabBar` and Guided chapter rail (`TabNavOverflowScroller`). **TASK-835 landed** sheet ability/defense tiles on the AbilityScoreGrid 2/3/6 tracks with GAME_RULES full names (wrap inside the tile; row siblings share height). **TASK-836 landed** sheet proficiency dots on `.hit-area-layout-neutral` (16px paint; coarse row `py-4` for the 8px gap), Sub-Skills Dense label, and `ResourceInput` Standard 44 under coarse. **TASK-829 landed** GuidedStepFooter opaque `bg-surface` below `md` (frosted from `md+`); ChapterRail sticky chrome the same with `bg-background`. **TASK-830 landed** `Input` / `Select` / `Textarea` / `SearchInput` Standard 44 under coarse (`touch-tier-standard`; fine pointer keeps compact `h-10`). **TASK-846 landed** AddCombatantModal **Add** on Modal `footer`. **TASK-847 landed** leftover viewport hit slabs on Codex spreadsheet toolbar, list Filters, and RollLog send (pointer tiers / shared `Button`; compact Filters is Standard `md`). **TASK-865 landed** remaining viewport 44 slabs on core-rules add-row links, rulebook nav + chapter prev/next, CharacterFilter header, and Codex spreadsheet row hits (`touch-tier-standard` / `IconButton`). The gate adds ~2–3 min to `ui-verify`.
- **Rejected — keep the blanket 44px:** it is the direct cause of the flat scale, and it is our own choice rather than a requirement (WCAG 2.1 **AA** has no target-size criterion; 2.5.5 is AAA). Keeping it means accepting the bulk.
- **Rejected — viewport-only sizing (`md:`):** simpler and already partly in place, but wrong for touchscreen laptops and for narrow desktop windows, and it is half of why three mechanisms exist today.
- **Rejected — drop `min-h` too and rely on spacing:** spacing supplements target size, it does not replace it; small targets stay hard to hit accurately.
- **Rejected — a new `RESPONSIVE_UX.md` filename:** `MOBILE_UX.md` is referenced from `AGENTS.md`, `.cursor/rules/`, `DESIGN_SYSTEM.md`, and many task entries. The file keeps its name and states its true scope in the header.
