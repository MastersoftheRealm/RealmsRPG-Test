# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-842
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-817, TASK-816, TASK-796, TASK-820, TASK-798, TASK-814, TASK-815, TASK-812, TASK-810, TASK-809, TASK-808, TASK-807, TASK-805, TASK-804, TASK-803, TASK-802, TASK-800, TASK-793, TASK-790, TASK-789, TASK-788, TASK-787, TASK-783, TASK-779, TASK-786, TASK-778, TASK-775, TASK-782, TASK-784, TASK-781, TASK-780, TASK-774, TASK-773, TASK-771, TASK-770, TASK-762, TASK-753, TASK-764, TASK-408, TASK-752, TASK-763, TASK-761, TASK-757, TASK-756, TASK-759, TASK-758, TASK-760, TASK-733, TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 20 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **Mobile audit 2026-08-18** (guest + authenticated + **loaded level-20 character**) → `reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`. **ADR-0023 accepted** (TASK-831): pointer drives hit area, viewport drives layout; Primary/Standard/Dense tiers; contracts C1–C6; `npm run verify:responsive` is the CI ratchet. **Implement the tiers** via **TASK-841** (Button/IconButton/ValueStepper + CSS). **Character sheet is the worst surface** → **TASK-838** (C1 panel stretch, 2332px dead scroll), **TASK-837** (C4 toolbar/RollLog), **TASK-835** (C2 name clip), **TASK-836** (Dense-tier dots + 13px checkbox), **TASK-839** (C3/C5 header cards, worst at 1024), **TASK-840** (C1 tab affordance). Also **TASK-826** RollLog h-scroll, **TASK-827** Codex Advanced covers last tab, **TASK-828** creature steppers, **TASK-829** guided footer, **TASK-830** form fields → Standard 44 under coarse pointer, **TASK-832** ellipsis, **TASK-833** About carousel. Do TASK-837/826/827/829/838 first; TASK-828/830/836 after or with TASK-841. Open: **TASK-818** path More details catalog chips; **TASK-813** unused `EquipmentListSection` creature Qty path; **TASK-819** encounter full-card ValueStepper; **TASK-821** drop patterns `list-components` ui re-exports; **TASK-822** type helper `SupabaseClient` params with `Database`; **TASK-825** gear play TP chip. **AddCharacterModal** is intentional non-USM. **Architect leftovers in WAITING:** TASK-799, TASK-824 (`exactOptionalPropertyTypes`; acked, retry after TASK-834). **TASK-834** WAITING owner OneDrive spot-check of 51 unmatched recovery files. **TASK-823** WAITING on owner manuscript for Glossary / The Realms chapters. Do **not** delete `/characters/new/advanced`. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415 / TASK-585 / TASK-586.

---

- id: TASK-841
  title: Apply ADR-0023 touch tiers to Button, IconButton, ValueStepper, and CSS utilities
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/ui/button.tsx
    - src/components/ui/icon-button.tsx
    - src/components/patterns/select/value-stepper.tsx
    - src/app/globals.css
    - src/docs/MOBILE_UX.md
    - src/docs/ai/ADR/0023-responsive-layout-contracts.md
  description: |
    Follow-up to TASK-831 / ADR-0023. The policy is accepted; the shared controls still implement the
    old blanket 44x44 (`min-h` + `min-w` on every Button/IconButton variant under pointer:coarse;
    `.touch-target-md-compact` and `md:min-h-0` on tab triggers still answer a pointer question with
    a viewport).

    Required code changes:
      - Button: drop `min-w-[44px]`; keep a tier-appropriate `min-h` under `@media (pointer: coarse)`
        only. `variant="link"` and `size="sm"` become Dense (no min-h slab; expanded hit if needed).
      - IconButton: explicit square size, not a global min-w.
      - ValueStepper: Dense in constrained grid cells (creature ability tiles — unblocks TASK-828).
      - `.tab-nav-trigger` / `.tab-pill-trigger` / `.hit-area-layout-neutral`: replace `md:` overrides
        with `pointer: coarse`. Delete or no-op `.touch-target-md-compact`.
  acceptance_criteria:
    - Coarse-pointer Primary actions are >=48px tall; Standard standalone buttons >=44px tall; Dense
      controls paint <=36px with a 44px expanded hit and do not overlap neighbours.
    - Fine-pointer / desktop chrome stays compact (no empty 44px padding around icons).
    - `variant="link"` and footer nav links are no longer 167x44 slabs.
    - `npm run verify:responsive` stays green (update the baseline only if a count *drops*).
    - `npm run verify:a11y` and `npm run verify:contrast` stay green; visual baselines updated if the
      styleguide Button row changes.
    - Re-run `scripts/mobile-audit.mjs` and record the new median control height vs DDB in
      reports/mobile-audit-2026-08-18/compare/metrics.json.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Coordinate with TASK-830 (form fields become Standard 44 under coarse pointer) and TASK-836
    (skill dots / Sub-Skills checkbox become Dense). Do not change Input/Select here.

- id: TASK-838
  title: Mobile sheet panels stretch to the tallest panel, adding up to 2332px of dead scroll
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/character-sheet-body.tsx
    - src/docs/MOBILE_UX.md
  description: |
    Mobile audit 2026-08-18, loaded-character pass (reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md §5.1).
    Only reproducible with a populated sheet, which is why the first pass missed it.

    Below md the sheet body is a horizontal snap carousel: four `<section>` panels (Abilities & Defenses,
    Skills, Archetype & Attacks, Library) are `basis-full` flex siblings in a `flex ... overflow-x-auto` row
    (character-sheet-body.tsx line 141). The row never sets `items-start`, so the default `align-items: stretch`
    sizes every panel to the tallest one. On a level-20 character the Library panel is 3051px, so all four
    panels become 3051px and the page is 4714px tall no matter which panel you are on.

    Measured dead space at 390px (natural content height vs rendered height):
      - Abilities & Defenses:  719px content in a 3051px panel -> 2332px blank
      - Skills:               1878px content in a 3051px panel -> 1173px blank
      - Archetype & Attacks:  1437px content in a 3051px panel -> 1614px blank
      - Library:              3051px content -> 0px blank

    User-visible effect: swipe to Abilities, scroll down, and the sheet is empty for ~3 viewport heights before
    the footer. The scrollbar length also lies — it always reflects the Library panel, not the visible one.
    Each panel already carries `overflow-y-auto`, which never engages because the panel is stretched to its
    own content height instead of being bounded.
  acceptance_criteria:
    - At 390px and 360px, scrolling any mobile sheet panel reaches the end of that panel's own content with no
      more than one viewport of trailing blank space.
    - Page scroll height reflects the active panel, not the tallest panel.
    - Horizontal snap between the four panels still works, and `[scroll-snap-stop:always]` behaviour is unchanged.
    - The md+ grid layout (`md:grid lg:grid-cols-[1fr_1fr_2fr]`) is visually unchanged.
    - Tests: npm run typecheck; npm run lint; npm run build; re-run scripts/mobile-audit-auth.mjs.
  notes: |
    Two viable shapes. (a) Add `items-start` below md so each panel sizes to its own content — smallest change,
    but the row is still as tall as the tallest panel, so the blank area becomes container background rather
    than panel. (b) Bound the carousel to the viewport (`h-[calc(100svh-…)]`) and let each panel scroll
    internally via the `overflow-y-auto` it already has — this is the pattern MOBILE_UX.md § dense layouts
    actually describes, and it also fixes the lying scrollbar. Prefer (b); coordinate with TASK-837, since a
    bounded carousel changes where the floating toolbar should dock.
    Reproduce: seeded level-20 character (see §5 of the audit), `node scripts/mobile-audit-auth.mjs --only sheet`.

- id: TASK-839
  title: Sheet header stat block collapses at every width except 768 and 1440+
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/sheet-large-stat-block.tsx
  description: |
    Mobile audit 2026-08-18, loaded-character pass (§5.2) + desktop verification pass (§6.1).
    **This is not a mobile bug — it is worst at 1024px.**

    Two compounding causes in the sheet header:

    1. Speed / Evasion / Damage Reduction / Critical Range sit in a `flex flex-1 flex-wrap items-center
       justify-center` row with content-width cards, so they never form an even grid — measured card widths
       are 100 / 100 / 186 / 153 at every width. Cards in the same set are never the same size.
    2. The header container is `flex flex-col gap-6 lg:flex-row`. The three-column layout engages at the `lg`
       breakpoint (1024px), but identity + stat block + resources do not actually fit until ~1500px, so the
       stat block is starved of width exactly in the 1024–1280 band.

    Measured stat-row width / height / row count:
      768px:  670px wide,  98px tall, 1 row   <- fine
      1024px: **119px wide, 480px tall, 4 rows** <- worst case, one card per row
      1280px: 283px wide, 326px tall, 3 rows
      1440px: 390px wide, 212px tall, 2 rows  <- acceptable
      390px:  324px wide, 318px tall, 3 rows

    At 1024px (iPad landscape and common small laptops) the header is ~530px tall, the four stat cards form a
    single narrow column, and there is a large empty region beside the portrait. See
    reports/mobile-audit-2026-08-18/desktop/sheet-header@1024.png vs sheet-header@1440.png.
  acceptance_criteria:
    - The four stat cards are equal width and form an even grid at 360, 390, 768, 1024, 1280, and 1440.
    - The stat row never exceeds two rows at any width >= 360px.
    - The header three-column layout only engages at a width where all three columns actually fit; below that
      it falls back to a stacked or two-column arrangement.
    - Header height at 1024px is comparable to 1440px, not ~2.5x it.
    - Tests: npm run typecheck; npm run lint; npm run build; re-run the multi-width probe.
  notes: |
    `grid grid-cols-2` for the card set (rather than `flex-wrap`) fixes cause 1. Cause 2 is a breakpoint
    choice — either move the three-column switch to `xl`/`2xl`, or let the stat block define a min width and
    allow the row to wrap. Longest label is "Damage Reduction", so check the fix does not re-introduce the
    label clipping tracked in TASK-835.

- id: TASK-840
  title: Tab strips hide tabs with no scroll affordance, on desktop as well as phones
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/ui/tab-navigation.tsx
    - src/components/character-sheet/library-section.tsx
    - src/app/globals.css
    - src/docs/MOBILE_UX.md
  description: |
    Mobile audit 2026-08-18, loaded-character pass (§5.3) + desktop verification pass (§6.2).
    **Not mobile-only** — `/library` still hides tabs at 1280px.

    The sheet Library tablist (`.tab-nav-list`) is 324px wide with 541px of content at 390px. Feats / Powers /
    Techniques are visible; Inventory, Proficiencies, and Notes are off the right edge. The strip scrolls
    (`overflow-x: auto`), so this is the intended side-scroll pattern, but nothing indicates there is more to
    the right — the last visible tab is cut mid-word ("Invento") with no fade, arrow, or partial-tab peek.

    Tabs hidden past the right edge, measured (client / scroll width):
      /library  @768px:  720/1229  -> 4 tabs hidden
      /library  @1024px: 960/1229  -> 2 tabs hidden
      /library  @1280px: 1216/1229 -> 1 tab hidden
      sheet     @1024px: 414/541   -> 2 tabs hidden
      sheet     @390px:  324/541   -> 3 tabs hidden
    Only 1440px is fully clear. On a laptop there is no touch-swipe either, so a hidden tab needs a trackpad
    horizontal gesture the user has no reason to attempt.
  acceptance_criteria:
    - At 360, 390, 768, 1024, and 1280 it is visually obvious the tab strip continues past the right edge
      (edge fade, chevron, or a deliberate partial-tab peek).
    - The affordance disappears when the strip is fully scrolled or does not overflow.
    - Applies to the shared tab-nav pattern, not just the sheet, so every side-scrolling tab strip benefits.
    - Keyboard and trackpad users can reach the hidden tabs without a horizontal swipe gesture.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    `.tab-nav-list` is shared chrome (globals.css, applied by `src/components/ui/tab-navigation.tsx`) — fix
    once there rather than in the sheet. A scroll-driven mask is CSS-only; a chevron needs a scroll listener.
    Check whether the active tab is scrolled into view when the panel mounts, which is a related
    discoverability gap.

- id: TASK-837
  title: Sheet action toolbar and RollLog FAB overlap sheet content and modal footers
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/rolls/roll-log.tsx
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/ui/modal.tsx
  description: |
    Mobile audit 2026-08-18, authenticated pass (reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md §2.7,
    findings-auth.json). The character sheet is the worst surface in the app on mobile: 38 overlapping
    interactive pairs at 390px, 51 with the Recovery modal open.

    Two bottom-anchored fixed elements are placed independently and collide:
      - SheetActionToolbar (line 58) is `fixed right-4 bottom-4 left-4` below md — a full-width row of five
        44px circular buttons with no backdrop and no reserved page padding, so it floats directly on top of
        whatever is at the bottom of the viewport. On load it covers the STRENGTH / VITALITY / AGILITY tiles.
      - RollLog is `fixed right-5 bottom-5` in the same corner, so its 56px FAB sits on top of the toolbar's
        rightmost button, and on top of modal footers: in the Recovery modal it covers the primary
        "Full Recovery" confirm button (screenshot shots/auth-sheet-recovery@390.png).
  acceptance_criteria:
    - At 390px and 360px no sheet content is permanently obscured by the action toolbar (reserve bottom padding,
      give the bar a solid background, or dock it).
    - The RollLog FAB and the sheet action toolbar do not overlap each other at any audited width.
    - No floating control overlaps a Modal footer action; the Recovery, Level Up, and Add Feat footers are fully
      tappable at 360px.
    - Audit probe reports 0 overlaps involving `.h-11.w-11.rounded-full` toolbar buttons and the RollLog FAB.
    - Tests: npm run typecheck; npm run lint; npm run build; re-run scripts/mobile-audit-auth.mjs.
  notes: |
    Coordinate with TASK-826 (same RollLog component, different symptom — that one is horizontal page scroll).
    Consider a single shared bottom-dock layer so floating sheet chrome is positioned in one place instead of
    two components each guessing at `bottom-4` / `bottom-5`.
    Reproduce: E2E_TEST_EMAIL/E2E_TEST_PASSWORD set, then `node scripts/mobile-audit-auth.mjs --only sheet`.

    Desktop pass (audit §6.3): not mobile-only. RollLog overlays real content at 768–1440 (the Creature
    Summary panel on /creature-creator, the Library panel on the sheet). No control-to-control collision at
    desktop, so severity is lower there, but a shared dock with a reserved gutter fixes both at once.

- id: TASK-835
  title: Character sheet name and ability tile labels clip mid-word on phones
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header-identity.tsx
    - src/components/character-sheet/ability-stat-tile.tsx
    - src/components/character-sheet/defense-stat-tile.tsx
  description: |
    Mobile audit 2026-08-18, authenticated pass (§2.8). At 390px the sheet h1 carries `truncate` but still
    overflows its container (measured 196px box, 229px content) and renders "E2E Baseline Knig" with no visible
    ellipsis. In the ability and defense grids, "INTELLIGENCE" and "DISCERNMENT" touch or cross their tile
    edges, while "MENTAL FORT." is pre-abbreviated and wraps to two lines — so tiles in the same row have
    different heights and different labelling conventions.
  acceptance_criteria:
    - Character names longer than the header width truncate with a visible ellipsis at 360px and 390px.
    - Ability and defense tile labels stay inside their tile at 360px; tiles in a row share a consistent height.
    - One labelling convention across the grid (either all full words with a smaller type ramp, or a documented
      abbreviation set) — not a mix of full and hand-abbreviated labels.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    `truncate` alone does not work when an ancestor flex item lacks `min-w-0`; check the header flex chain.

- id: TASK-836
  title: Skill proficiency dots are 16px tap targets on the sheet
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/patterns/list/skill-row.tsx
    - src/components/character-sheet/skills-section.tsx
  description: |
    Mobile audit 2026-08-18, authenticated pass (§2.9). SkillRow renders the proficiency toggle as
    `inline-block h-4 w-4 rounded-full` — a 16x16 button. The sheet shows 24 of them stacked in a narrow
    column, which is the single largest cluster of sub-minimum tap targets in the app and sits directly beside
    other interactive skill controls.

    Loaded-character re-run 2026-08-18 (§5.4) raised the count to 36 sub-44px controls on the sheet at 390px
    and found two more in the same panel:
      - `input#sheet-skills-sub-skills` (the "Sub-Skills" checkbox) is **13x13** — smaller than the dots.
      - the "Current Health" input is **48x34**, so it is under the minimum on height.
  acceptance_criteria:
    - The proficiency toggle meets the ADR-0023 Dense tier (16px painted + 44px expanded hit, 8px gap)
      while the painted dot stays 16px.
    - The Sub-Skills checkbox and the Current Health input meet the same minimum on touch viewports.
    - The Skills column does not get wider on desktop, and no fifth column or forced table min-width appears
      (TASK-800 constraint).
    - Adjacent skill controls do not overlap the enlarged hit area.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    `.hit-area-layout-neutral` (globals.css) already solves exactly this: 16px layout box, 44px `::after` hit
    area below md. Reuse it rather than growing the dot. Watch for the overlap caveat noted in the audit §3.

- id: TASK-826
  title: RollLog fixed panel causes horizontal page scroll on phones
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/rolls/roll-log.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/docs/MOBILE_UX.md
  description: |
    Mobile audit 2026-08-18 (reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md §2.1): /creature-creator is the only
    audited route with horizontal page scroll, at both 390px and 360px. RollLog renders
    `fixed right-5 bottom-5` with an absolutely positioned panel at `w-[360px] max-w-[calc(100vw-40px)]`.
    The max-w does not prevent the 360px declared width from expanding documentElement.scrollWidth, measured
    99px past the right edge. There are no sm:/md: overrides. RollLog also mounts on the character sheet, so
    the sheet is very likely affected too (not verifiable in the audit — it ran logged out).
  acceptance_criteria:
    - At 390px and 360px with touch emulation, /creature-creator has documentElement.scrollWidth <= clientWidth.
    - RollLog panel fits the viewport on phones (width driven by available space, not a fixed 360px).
    - The 56px toggle FAB stays reachable and does not overlap the guided/creator sticky footers.
    - Re-run `node scripts/mobile-audit.mjs --only creature-creator` and confirm horizontalPageScroll is false.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Do not fork a mobile-only roll log. Extend the existing component with responsive width.
    Audit ran against commit 3efe80c9 in a detached worktree because the working tree (shared/ -> patterns/
    refactor in flight) does not build.

- id: TASK-827
  title: Codex Advanced button covers the last tab in the tab strip
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/app/(main)/codex/page.tsx
    - src/components/ui/tab-navigation.tsx
    - src/app/globals.css
  description: |
    Mobile audit 2026-08-18 (§2.2). On /codex the "Advanced" Button is `flex-shrink-0` in the same flex row as
    the `overflow-x-auto` tab strip, permanently consuming ~110px. At 390px the "Archetypes" trigger renders
    underneath it (measured 75x44 overlap). A `labelMobile` is defined for these tabs but never passed through
    to TabNavigation, so full labels are used at every width.
  acceptance_criteria:
    - At 390px and 360px no tab trigger overlaps the Advanced control (audit probe reports 0 overlaps for those pairs).
    - Either the Advanced control moves out of the tab row, or the tab strip gets scroll padding / an edge fade so
      the last tab is never obscured.
    - labelMobile is actually used below md, or is removed as dead config.
    - Do not introduce a page-local tab strip; extend TabNavigation.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Check whether Library and Admin Codex share this Search + Filters + trailing-control row (ListSearchToolbar,
    TASK-721) and fix at the shared layer if so.

- id: TASK-828
  title: Creature Creator ability steppers overflow their tiles at phone widths
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/creator/ability-score-editor.tsx
    - src/app/(main)/creature-creator/creature-creator-editor.tsx
    - src/components/patterns/select/value-stepper.tsx
  description: |
    Mobile audit 2026-08-18 (§2.3, screenshot slices/creature-creator@390-s4.png). Creature Creator passes
    compact={true}, which forces grid-cols-3 below md (~100px per cell after card padding). Each cell must fit a
    44px DecrementButton, a min-w-[3rem] value, and a 44px IncrementButton — about 152px — so the +/- buttons
    escape their tile and collide with the adjacent column.
  acceptance_criteria:
    - At 390px and 360px the STR/VIT/AGI/ACU/INT/CHA steppers stay inside their tile; no interactive overlap
      between adjacent ability cells.
    - Either compact drops to grid-cols-2 below sm, or the stepper row uses the dense tier (see TASK-830).
    - Character sheet and Advanced creator ability grids are unchanged.
    - Tests: npm run typecheck; npm run lint; npm run build; re-run the audit probe on /creature-creator.
  notes: |
    Root cause interacts with the 44px touch minimum on ValueStepper (md:w-8 on desktop, w-11 on phones — the
    width is only enforced where there is no room). Coordinate with TASK-830 if that lands first.

- id: TASK-829
  title: Guided creator sticky footer is translucent so content reads through it
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-step-layout.tsx
  description: |
    Mobile audit 2026-08-18 (§2.4, shots/creator-guided@390.png). GuidedStepFooter is `fixed inset-x-0 bottom-0`
    with `bg-surface/95 backdrop-blur-md`. On a phone the Continue button appears to hover over a choice card
    rather than sit in a footer, because card content shows through the 95% bar.
  acceptance_criteria:
    - Below md the footer bar is opaque; no scrolling content is visible through it.
    - The reserved bottom padding in GuidedStepLayout still matches the rendered footer height (no dead strip,
      no clipped last control).
    - Desktop appearance is unchanged.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Keep the frosted look on md+ if desired; this is a phone-only legibility fix.

- id: TASK-830
  title: Raise Input/Select/Textarea to the button touch height on phones
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/ui/input.tsx
    - src/components/ui/select.tsx
    - src/components/ui/textarea.tsx
    - src/docs/MOBILE_UX.md
  description: |
    Mobile audit 2026-08-18 (§1). Button and IconButton apply a 44px minimum under @media(pointer:coarse);
    Input, Select, and Textarea are a fixed h-10 (40px) with no touch handling at all. On every creator form a
    40px field sits directly beside a 44px button, which is the most visible source of the "not clean" feel and
    also fails our own MOBILE_UX touch-target rule for form controls.
  acceptance_criteria:
    - Under `@media (pointer: coarse)`, Input, Select, and Textarea meet the ADR-0023 Standard tier (44px min-height).
    - Fine pointer keeps the current compact h-10 chrome.
    - FilterInput and the Codex/Library filter rows still align with their sibling selects.
    - Audit probe reports 0 sub-44px form controls on /power-creator, /item-creator, /creature-creator.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    ADR-0023 decided: pointer:coarse for hit area, viewport for layout. Implement this as the Standard
    tier (44px min-h, no min-w). Coordinate with TASK-841 so Button height and field height stay aligned.

- id: TASK-832
  title: Truncate clipped control text with an ellipsis instead of cutting mid-word
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/ui/select.tsx
    - src/components/ui/search-input.tsx
    - src/app/(main)/creature-creator/creature-creator-editor.tsx
  description: |
    Mobile audit 2026-08-18 (§2.5). Several controls clip text mid-word at 390px rather than truncating cleanly:
    Creature Creator Type/Size selects render "Huma" and "Medi"; the Codex search placeholder renders
    "Search names, tags, descri". D&D Beyond truncates list content with an ellipsis, which reads as intentional;
    a hard mid-word cut reads as broken.
  acceptance_criteria:
    - Controls that cannot fit their text truncate with an ellipsis (or shorten the copy) at 360px and 390px.
    - No control reports overflowX hidden with textOverflow clip in the audit probe on the affected routes.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Prefer shorter copy where the full string is not load-bearing (search placeholders). Reserve ellipsis for
    user data such as creature Type/Size values.

- id: TASK-833
  title: About carousel previous arrow renders off-screen on phones
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/about/about-carousel-section.tsx
  description: |
    Mobile audit 2026-08-18 (§2.6). On /about the "Previous section" control measures 431px left of the viewport
    at 390px, so it is unreachable. The carousel dot buttons measure 31-42px, below the touch minimum.
  acceptance_criteria:
    - Both carousel arrows are within the viewport and tappable at 360px and 390px.
    - Dot controls meet the touch minimum (or the Dense tier if TASK-831 lands).
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Marketing page, low traffic impact — batch with other About work rather than shipping alone.

- id: TASK-821
  title: Drop patterns list-components ui/ SearchInput EmptyState LoadingState re-exports
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/patterns/list/list-components.tsx
    - src/components/patterns/index.ts
    - src/components/ui/search-input.tsx
    - src/components/ui/empty-state.tsx
    - src/components/ui/spinner.tsx
  description: |
    patterns/list/list-components.tsx still re-exports SearchInput, EmptyState, and LoadingState from ui/ for backward compatibility, and the patterns barrel re-exports them (ListEmptyState alias). Callers should import those primitives from @/components/ui. Keep ErrorDisplay on patterns (it is real list chrome, not a ui re-export). Do not add a new patterns/ui file.
  acceptance_criteria:
    - SearchInput, EmptyState, and LoadingState are not exported from @/components/patterns or list-components.
    - All former callers import from @/components/ui (SearchInput / EmptyState / LoadingState from spinner).
    - ErrorDisplay stays on patterns. No new shared/ui file.
    - Tests: npm run typecheck; npm run lint; npm run tasks:generate-index.
  notes: |
    Filed from TASK-794 /cleanup (audit leftover / report 04 barrel hazard). Intra-patterns barrel cycles and the @/components/shared import ban already landed in that cleanup. Do not fold TASK-799 list/modal clusters into this task.

- id: TASK-818
  title: Path More details combat chips from GLR catalog
  created_at: 2026-08-17
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/lib/detail-option/combat-builder.ts
    - src/lib/glr/glr-surface-bindings.ts
    - src/lib/chip/list-row-metadata.ts
    - src/components/guided-creator/guided-path-detail-modal.tsx
  description: |
    detail-option-power is registered in glr-surface-bindings but powerToDetailOption / techniqueToDetailOption still hand-roll Energy/Action/Range/Area/Duration/Damage/TP chips. Wire DetailOptionList combat rows onto glrSurfaceDetailSections('detail-option-power') (and a technique binding if needed) so path More details follows ADR-0016 instead of a parallel chip table.
  acceptance_criteria:
    - Guided path More details power/technique chips come from layout.chipFacts (detail density), not combat-builder pushFact.
    - A valued catalog fact is column XOR chip XOR rightSlot; DetailOptionList may keep name+description columns with all facts as chips.
    - Reuse compact-facts formatters via rankedGlrFactChips; do not add a new shared/ui file.
    - Skip Legacy /characters/new/advanced. Tests: vitest on combat-builder; npm run build. Add a DEV-V-016 case when implementing.
  notes: |
    Filed from TASK-814 /cleanup. Out of scope on purpose (deep-dive catalogs).

- id: TASK-813
  title: Unify EquipmentListSection creature Qty with formatCreatureEquipmentQuantity
  created_at: 2026-08-17
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/patterns/list/entity-library-inventory.tsx
    - src/components/patterns/list/entity-library-sections-types.ts
    - src/components/patterns/list/creature-stat-block-panels.tsx
    - src/lib/game/creature-inventory.ts
    - src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx
  description: |
    TASK-812 creator selected rows already pass layout="characterSheet" plus an explicit Qty column that uses formatCreatureEquipmentQuantity. Stat-block equipment Qty already uses that helper (hand-rolled GridListRow, not EquipmentListSection). Remaining: EquipmentListSection's default layout="creature" still does e.quantity ?? 1 (and a no-op QuantitySelector) — unused today because creature creator overrides layout. Unify the default creature path + prefer routing the stat-block list through the shared section; do not change sheet characterSheet Qty steppers that default missing quantity to 1.
  acceptance_criteria:
    - EquipmentListSection layout="creature" shows stored quantity or "-" (formatCreatureEquipmentQuantity); it does not fake Qty 1.
    - Character sheet EquipmentListSection layout="characterSheet" still uses quantity steppers and may default missing quantity to 1.
    - Prefer routing creature/stat-block equipment lists through EquipmentListSection instead of a second Qty column, without a new shared/ui file.
    - Tests: targeted vitest if a helper is extracted; npm run build. Add DEV-V-016-T025 when implementing.
  notes: |
    Filed from TASK-812 /cleanup. Creator Inventory already meets TASK-812 AC via custom columns. Stat block no longer fakes Qty 1 — leftover is the unused default section path + hand-rolled columns. Do not delete /characters/new/advanced.

---

- id: TASK-819
  title: Encounter full-card HP/EN ValueStepper parity
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/encounters/combatant-card-resources.tsx
    - src/components/patterns/select/value-stepper.tsx
  description: |
    Compact CombatantCard resource chrome already pairs number inputs with ValueStepper. The full variant is raw HP/EN current+max number inputs only. Add the same ValueStepper beside those inputs for parity (ADR-0002); keep direct numeric entry. Do not change initiative click-to-edit or condition chip +/- .
  acceptance_criteria:
    - Full combatant card Health/Energy (when not linked-character read-only) show ValueStepper next to the number inputs, matching compact.
    - Linked-character read-only path is unchanged (no steppers).
    - No new shared/ui file; reuse ValueStepper. Compact layout unchanged.
    - Tests: npm run build. Add a DEV-V-008 case when implementing if the suite covers combatant cards.
  notes: |
    Filed from 2026-08-18 /global-audit → /debt. Compact already has the pattern. Initiative and condition chips stay out of scope.

---

- id: TASK-822
  title: Type helper SupabaseClient params with Database
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/lib/supabase/database.ts
    - src/lib/role-policy.ts
    - src/lib/core-rules-server.ts
    - src/app/api/codex/route.ts
    - src/lib/character-view-enrichment-server.ts
    - src/lib/entity-image-enrich-server.ts
    - src/lib/game/archetype-display.ts
    - src/lib/codex/id-allocation.ts
  description: |
    TASK-795 typed the app factories with generated Database. Helpers that take
    unparameterized SupabaseClient (or Pick<SupabaseClient, 'from'>) still strip
    that typing at the function boundary, so .from() inside those helpers is
    loosely typed again. Thread TypedSupabaseClient / SupabaseClient<Database>
    (or Tables<'core_rules'> for CoreRulesRow) through the existing helpers.
  acceptance_criteria:
    - Helper params that accept a Supabase client use Database (TypedSupabaseClient
      or equivalent); unparameterized SupabaseClient is not used for .from() helpers.
    - asLibraryCountsClient stays (TS2589). asDbJson / fromPublicTable stay (ADR-0020).
    - No behavior change; no new shared/ui file; do not delete /characters/new/advanced.
    - Tests: npm run typecheck; npm run lint; targeted helper/API tests.
  notes: |
    Filed from TASK-795 /cleanup (longevity). Do not fold TASK-797
    (noUncheckedIndexedAccess — done ADR-0022) or Zod-parse /api/codex (report 10 P1-7).
    Do not remove the JSONB / dynamic-table shims.

---

- id: TASK-825
  title: Gear play catalog — Training Points chip (sheet + creature)
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/lib/glr/glr-fact-catalog.ts
    - src/lib/glr/glr-density.ts
    - src/lib/glr/glr-fact-catalog.test.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/app/(main)/creature-creator/map-creature-inventory-rows.ts
    - src/docs/ai/ADR/0016-glr-fact-catalog.md
  description: |
    TASK-817 dropped creature equipment Total TP footers and reused character-sheet-gear.
    trainingPoints is not a gear catalog fact, so valued equipment TP is nowhere (never-neither).
    Sheet mapEquipmentRows already passes trainingPoints into glrSurfaceDetailSections, but
    ranked chips skip it. Add trainingPoints to gear; keep Codex/USM columns Category /
    Currency / Rarity (demote TP on browse/select).
  acceptance_criteria:
    - Gear play (sheet Library equipment + creature selected equipment) shows a Training Points
      chip when TP is valued; still no Total TP footer and no TP column.
    - Codex/Admin browse and add-modal gear stay Category / Currency / Rarity columns (TP chip
      only, not a fourth dense column).
    - Extend glr-fact-catalog + glr-density; do not add a new shared/ui file or surface id.
    - Tests: glr-fact-catalog.test coverage for character-sheet-gear TP chip; npm run build.
      Add a DEV-V-016 case when implementing. Skip Legacy /characters/new/advanced.
  notes: |
    Filed from TASK-817 /cleanup. Do not fold TASK-813 Qty. Do not put TP on Codex equipment
    as a column (FEATURE_INDEX gear is Category / Currency / Rarity).
