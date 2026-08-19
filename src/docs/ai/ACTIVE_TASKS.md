# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-846
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA. Do not keep implementation-complete tasks in this file waiting for QA.

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 19 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **Mobile audit 2026-08-18** (guest + authenticated + **loaded level-20 character**) → `reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`. **ADR-0023 accepted** (TASK-831): pointer drives hit area, viewport drives layout; Primary/Standard/Dense tiers; contracts C1–C6; `npm run verify:responsive` is the CI ratchet. **TASK-841 partial** (Button/IconButton/ValueStepper + CSS tiers landed; Primary CTA call-sites + Dense overlap AC still open). **TASK-837 partial** (C4 dock coded; overlap probe + `verify:responsive` still open). **TASK-838 partial** (C1 height-bound sheet carousel coded; `verify:responsive` + `mobile-audit-auth` still open). **Character sheet remaining** → **TASK-835** (C2 name clip), **TASK-836** (Dense-tier dots + 13px checkbox), **TASK-839** (C3/C5 header cards, worst at 1024), **TASK-840** (C1 tab affordance). Also **TASK-826** RollLog h-scroll (panel width already fixed in 837 — confirm creature-creator scrollWidth), **TASK-827** Codex Advanced covers last tab, **TASK-828** creature steppers (unblocked by 841 Dense ValueStepper), **TASK-829** guided footer, **TASK-830** form fields → Standard 44 under coarse pointer. Do TASK-837 remaining probes with TASK-838; then TASK-826/827/829. TASK-828/830/836 after TASK-841. TASK-843/844 are C4 leftovers from 837 `/cleanup`. Open: **TASK-818** path More details catalog chips; **TASK-813** unused `EquipmentListSection` creature Qty path; **TASK-822** type helper `SupabaseClient` params with `Database`; **TASK-825** gear play TP chip. **AddCharacterModal** is intentional non-USM. **TASK-824 done** (ADR-0024 Accepted; `exactOptionalPropertyTypes` in main tsconfig). **TASK-845** restores Admin Codex `askDelete` after 824 HEAD-tab recovery. **TASK-799 done** (confirm/icon-toggle/sheet families + admin Codex delete modal; leftover F-18 scaffolding is WAITING TASK-842). **WAITING:** TASK-842 (Architect ack), TASK-834 (owner OneDrive spot-check; content recovery only), TASK-823 (owner manuscript). Do **not** delete `/characters/new/advanced`. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415 / TASK-585 / TASK-586.

---

- id: TASK-841
  title: Apply ADR-0023 touch tiers to Button, IconButton, ValueStepper, and CSS utilities
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: partial
  related_files:
    - src/components/ui/button.tsx
    - src/components/ui/button-tiers.test.ts
    - src/components/ui/icon-button.tsx
    - src/components/patterns/select/value-stepper.tsx
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/patterns/help/info-tippy.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/ADR/0023-responsive-layout-contracts.md
    - src/docs/DESIGN_SYSTEM.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - reports/mobile-audit-2026-08-18/compare/metrics.json
  follow_up_tasks:
    - TASK-828
    - TASK-830
  description: |
    Follow-up to TASK-831 / ADR-0023. Shared controls still used a blanket 44x44 under
    pointer:coarse; tab compact utilities answered a pointer question with a viewport.
  acceptance_criteria:
    - Coarse-pointer Primary actions are >=48px tall; Standard standalone buttons >=44px tall; Dense
      controls paint <=36px with a 44px expanded hit and do not overlap neighbours.
    - Fine-pointer / desktop chrome stays compact (no empty 44px padding around icons).
    - variant=link and footer nav links are no longer 167x44 slabs.
    - npm run verify:responsive stays green (update the baseline only if a count drops).
    - npm run verify:a11y and npm run verify:contrast stay green; visual baselines updated if the
      styleguide Button row changes.
    - Re-run scripts/mobile-audit.mjs and record the new median control height vs DDB in
      reports/mobile-audit-2026-08-18/compare/metrics.json.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Do not change Input/Select (TASK-830). Do not retag USM/modal footers to size=lg without owner
    ack (out of related_files).
  completed_work: |
    Dropped Button/IconButton global coarse min-w/min-h 44. Wired Primary (lg/xl 48), Standard
    (md height-only 44), Dense (sm/link hit-area-dense; IconButton sm square). ValueStepper compact
    paint + height-first hit. Tab triggers and hit-area-layout-neutral use pointer:coarse.
    Footer links dropped min-h 44 slabs. button-tiers vitest added. Codex median still 44 vs DDB 36;
    12 Codex controls left the 44-52 slab. verify:responsive 48/48; contrast green.
    Deleted unused .touch-target CSS; WordHelpTip compact uses .hit-area-dense.
  remaining_work: |
    - Primary AC: modal/screen CTAs (e.g. USM Add Selected) are still default md + min-h-11 (44).
      Owner ack to retag size=lg, or accept DEV-V-055 (Primary = size lg only).
    - Dense overlap AC: leftover painted overlaps on /creature-creator → TASK-828.

- id: TASK-838
  title: Mobile sheet panels stretch to the tallest panel, adding up to 2332px of dead scroll
  created_at: 2026-08-18
  created_by: agent
  priority: high
  status: partial
  related_files:
    - src/components/character-sheet/character-sheet-body.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/docs/MOBILE_UX.md
  description: |
    Mobile audit 2026-08-18, loaded-character pass (reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md §5.1).
    Below md the sheet carousel stretched every panel to the tallest sibling (Library ~3051px).
  acceptance_criteria:
    - At 390px and 360px, scrolling any mobile sheet panel reaches the end of that panel's own content with no
      more than one viewport of trailing blank space.
    - Document height is viewport-bounded (C1); it does not follow the tallest sibling. Panels scroll internally.
    - Horizontal snap between the four panels still works, and `[scroll-snap-stop:always]` behaviour is unchanged.
    - The md+ grid layout (`md:grid lg:grid-cols-[1fr_1fr_2fr]`) is visually unchanged.
    - Tests: npm run typecheck; npm run lint; npm run build; npm run verify:responsive;
      re-run scripts/mobile-audit-auth.mjs.
  notes: |
    Shape (b): bound carousel to remaining viewport (`calc(100svh-5rem)` under Header `h-20`).
    Panel `pb-4` is content inset only; TASK-837 moved dock reservation onto
    `--sheet-mobile-dock-height` on the frame (`max-md:pb-[var(--sheet-mobile-dock-height)]`).
  completed_work: |
    - Owner + RM view wrap header+body in CharacterSheetColumn + CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME.
    - Mobile panels are h-full overflow-y-auto; carousel overflow-y-hidden; md+ grid uses contents.
    - typecheck, lint, build. DEV-V-009 T058 filed.
  remaining_work: |
    - npm run verify:responsive (layout ratchet at 360/390/768/1024/1280/1440).
    - node scripts/mobile-audit-auth.mjs --only sheet (needs E2E_TEST_EMAIL/PASSWORD + loaded level-20 seed).
  follow_up_tasks:
    - TASK-837
    - TASK-843

- id: TASK-837
  title: Sheet action toolbar and RollLog FAB overlap sheet content and modal footers
  created_at: 2026-08-18
  created_by: agent
  implemented_by: agent
  priority: high
  status: partial
  related_files:
    - src/app/globals.css
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/rolls/roll-log.tsx
    - src/components/character-sheet/character-sheet-body.tsx
    - src/components/character-sheet/index.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/DESIGN_SYSTEM.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/ADR/0023-responsive-layout-contracts.md
  follow_up_tasks:
    - TASK-826
    - TASK-843
    - TASK-844
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T059
  developer_test_plan: |
    Suite DEV-V-009 T059 — see BUILD_VALIDATION.md
  description: |
    Mobile audit 2026-08-18: sheet toolbar (fixed bottom-4 left-4 right-4) and RollLog
    (fixed bottom-5 right-5) stacked on each other and on Recovery/Level Up/Add Feat footers.
  acceptance_criteria:
    - At 390px and 360px no sheet content is permanently obscured by the action toolbar.
    - The RollLog FAB and the sheet action toolbar do not overlap each other at any audited width.
    - No floating control overlaps a Modal footer action at 360px.
    - Audit probe reports 0 overlaps involving toolbar buttons and the RollLog FAB.
    - Tests: npm run typecheck; npm run lint; npm run build; re-run scripts/mobile-audit-auth.mjs.
  notes: |
    Coordinate with TASK-826 (same RollLog, horizontal page scroll). Desktop: reserved gutter
    so RollLog does not sit on Library / Creature Summary. Do not add a new shared/ui dock.
    2026-08-18 `/audit`: coded but marked done before the overlap probe and
    `verify:responsive` ran — reopened as partial.
  completed_work: |
    Wired C4 dock tokens (--dock-*) plus .sheet-mobile-action-dock and
    .floating-dock-bottom-right. Sheet frame reserves --sheet-mobile-dock-height.
    Main content reserves --dock-reserved-end from md when RollLog is mounted.
    body:has([aria-modal=true]) hides both docks. Closed RollLog panel is w-0.
    No new shared/ui file. DEV-V-009 T059 filed.
  remaining_work: |
    - Audit probe: 0 overlaps involving .h-11.w-11.rounded-full toolbar buttons and the RollLog FAB.
    - node scripts/mobile-audit-auth.mjs --only sheet (needs E2E_TEST_EMAIL/PASSWORD + loaded level-20 seed).
    - npm run verify:responsive at 360/390/768/1024/1280/1440, including the
      --dock-reserved-end gutter on non-sheet RollLog pages from md.

- id: TASK-843
  title: RM campaign sheet reserves owner action-dock height without a toolbar
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/components/character-sheet/character-sheet-body.tsx
    - src/app/globals.css
  description: |
    TASK-837 C4 frame class CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME always applies
    max-md:pb-[var(--sheet-mobile-dock-height)] (~4.5rem). The RM campaign view uses
    that frame but has no SheetActionToolbar and no has-sheet-mobile-dock, so phones
    keep an empty owner-dock strip while the FAB sits at --dock-gap.
  acceptance_criteria:
    - At 360/390 the RM campaign character view does not reserve a full owner-dock
      strip when no action toolbar is mounted.
    - RollLog FAB stays reachable and does not cover sheet content (FAB-only gutter is enough).
    - Owner /characters/[id] dock reservation is unchanged.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    Split frame padding from the C1 height-bound class, or use a FAB-only reserve token.
    Do not add a new shared/ui dock. Do not change owner-sheet dock behavior.
    Filed from TASK-837 /cleanup.

- id: TASK-844
  title: Re-check sheet tour Next against the C4 action dock
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/lib/sheet-tour-highlight.ts
    - src/components/onboarding/sheet-tour.tsx
    - src/components/rolls/roll-log.tsx
    - src/app/globals.css
  description: |
    2026-08-06 feedback: tour Next was behind the dice FAB. TASK-388 raised z-tour and
    used bottom-20 / right-20. TASK-837 replaced the FAB with a 4.5rem opaque bottom
    dock; ONBOARDING_FLOATING_CARD_CLASS still uses bottom-20. Re-measure after the
    dock — do not assume the old fix still clears Next.
  acceptance_criteria:
    - At 360/390 with the tour running, Next is fully tappable (not under the dock or FAB).
    - Tour card stays visible; body:has([aria-modal=true]) must not hide the dock during
      the tour (SheetTour is role=dialog without aria-modal).
    - Desktop tour card still clears the FAB.
    - Re-run DEV-V-029-T004 after any geometry change.
    - Tests: npm run typecheck; npm run lint; npm run build.
  notes: |
    ALL_FEEDBACK_CLEAN 2026-08-06 disposition is TASK-388; this is a geometry re-check
    after TASK-837, not a reopen of TASK-388. Prefer adjusting ONBOARDING_FLOATING_CARD_CLASS
    against --sheet-mobile-dock-height rather than a new overlay.
    Filed from TASK-837 /cleanup.

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
    TASK-837 already moved RollLog onto `.floating-dock-bottom-right` and dropped the closed
    `w-[360px]` (open panel is `min(22.5rem, 100svw − 2×gap)`). Remaining: confirm
    `/creature-creator` `scrollWidth <= clientWidth` under touch emulation.
    Audit originally ran against commit 3efe80c9 in a detached worktree.

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
    TASK-841 Dense ValueStepper unblocked the 44×44 layout slab. Post-841 probe still reported 16
    painted overlaps on /creature-creator. Remaining: compact grid-cols-3 + min-w-[3rem] value —
    drop to grid-cols-2 below sm if tiles still collide. Coordinate with TASK-830 if that lands first.

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
    tier (44px min-h, no min-w). TASK-841 already aligned Button height; keep field height on the same
    Standard 44 under coarse pointer.

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

- id: TASK-845
  title: Wire Admin Codex tabs to askDelete and drop requestDelete
  created_at: 2026-08-18
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/admin/codex/use-admin-codex-delete.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/use-admin-archetype-workspace.ts
  follow_up_tasks:
    - TASK-842
  build_validation: |
    suite: DEV-V-028
    tests:
      - DEV-V-028-T005
  developer_test_plan: |
    Suite DEV-V-028 T005 — see BUILD_VALIDATION.md
  description: |
    TASK-824 recovered truncated Admin Codex tabs from HEAD. Those tabs still call
    `requestDelete(id)` (confirm copy uses the id) and keep two-click
    `deleteConfirm` / “Click again to confirm delete” in row trash and edit-modal
    Delete. TASK-799 already landed `askDelete(id, name)` + `DeleteConfirmModal`.
    Wire every entity tab (and archetype workspace) onto `askDelete` with the
    row name; delete the `requestDelete` alias.
  acceptance_criteria:
    - `requestDelete` is gone from `AdminCodexDelete` and no caller remains.
    - Row trash and edit-modal Delete on all nine Codex entity surfaces open
      `DeleteConfirmModal` titled with the entity name, not a second-click button
      and not confirm copy that shows the raw id.
    - Referential-integrity second modal (`still referenced / Delete anyway`) is
      unchanged. Do not fold TASK-842 F-18 CRUD scaffolding.
    - Tests: npm run typecheck; npm run lint; DEV-V-028 T005 (existing).
  notes: |
    Filed from TASK-824 /cleanup. Do not reopen TASK-824. Do not delete
    `/characters/new/advanced`. Canonical hook is `useAdminCodexDelete.askDelete`.
