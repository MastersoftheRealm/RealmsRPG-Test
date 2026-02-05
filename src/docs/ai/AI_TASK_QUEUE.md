# AI Task Queue

This file lists prioritized actionable tasks for AI agents. Agents should update `status` when progressing work and append PR/commit links to `notes`.

---
- id: TASK-001
  title: Unify skill rows across creators
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/shared/skill-row.tsx
  created_at: 2026-02-05
  created_by: agent
  description: Replace inline skill implementations in character creator and creature creator with the shared `SkillRow` component.
  acceptance_criteria:
    - All three skill UIs use `SkillRow` with `variant` prop
    - `npm run build` passes
    - Manual verify: add skill in creator, save, reload
  notes: ""

- id: TASK-002
  title: Audit lists and modals for `ListHeader` adoption
  priority: medium
  status: not-started
  related_files: []
  created_at: 2026-02-05
  created_by: agent
  description: Ensure all list pages and selection modals use the shared `ListHeader`/`GridListRow` patterns.
  acceptance_criteria:
    - All library and creator modals use `GridListRow`
    - PR includes visual before/after screenshots
  notes: ""

# How agents pick tasks
- Prefer `priority: high` and `status: not-started` tasks
- Update `status` to `in-progress` at start, and `done` when merged
- Add `notes` with PR or commit links on completion

- id: TASK-003
  title: Show weapon damage in Library and wire Edit -> Item Creator
  priority: high
  status: not-started
  related_files:
    - src/app/(main)/library/page.tsx
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Library list (Armaments) currently does not show computed weapon damage. The Edit action should open the Item Creator with the item loaded for editing (no full page redirect if possible). Duplicating an item should copy data and stay on the library or open the creator with the copy loaded.
  acceptance_criteria:
    - Library armaments list shows a Damage column with computed damage for weapons.
    - Edit action opens `item-creator` with `?edit=<id>` (or navigates in-app) and populates the editor with the item's data.
    - Duplicate preserves data and opens creator with the new copy loaded (or performs in-place copy and updates list).
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"

- id: TASK-004
  title: Fix RTDB enrichment so list views compute EN/TP/C correctly
  priority: high
  status: not-started
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Enrichment pipeline must resolve saved part/property IDs against RTDB records and compute/display the final Energy (EN), Training Points (TP), and Currency (C) values in all list views (library, creators, character sheet). Some saved entries only include IDs and lack computed totals.
  acceptance_criteria:
    - `enrichPowers` / `enrichTechniques` produce `cost`/`tp`/`currency` fields consistently.
    - Library and creator lists display computed costs instead of blank/incorrect values.
    - `npm run build` passes and manual spot-check of 3 items shows correct values.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"

- id: TASK-005
  title: Fix Innate toggle hit area and alignment in list rows
  priority: high
  status: not-started
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/skill-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Innate (star) toggle in power/technique list rows is difficult to hit and not vertically centered. Improve click target, alignment, and accessibility so toggling innate works reliably outside edit mode.
  acceptance_criteria:
    - Innate toggle has a minimum 40x40px hit area and is vertically centered.
    - Toggle works in both list and expanded row views without requiring edit mode.
    - Manual verification on desktop/mobile passes.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"

- id: TASK-006
  title: Fix missing/incorrect EN/TP display for Powers/Techniques/Armaments
  priority: high
  status: not-started
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Lists for powers, techniques, and armaments intermittently show missing or incorrect Energy (EN) or Training Point (TP) values. Investigate where enrichment or render-time calculations drop or rename fields (energy vs cost vs energyCost) and make fields consistent across enrichment and UI.
  acceptance_criteria:
    - `data-enrichment` outputs use `cost` consistently for display.
    - List renderers read the same field names and display correct numbers.
    - Manual spot-check across library and character sheet shows correct values.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"


- id: TASK-007
  title: Library — Show weapon damage and enable in-place Edit/Duplicate
  priority: low
  status: not-started
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Library armaments currently do not display computed weapon damage in the armaments list. The Edit action should open the Item Creator with the selected item loaded for editing (prefer in-app navigation or modal), and Duplicate should create a copy and keep the user in the library or open the creator with the new copy loaded.
  acceptance_criteria:
    - Library armaments list shows a Damage column with computed damage.
    - Edit opens `item-creator` with `?edit=<id>` (or equivalent in-app flow) and preloads data.
    - Duplicate preserves data and either performs in-place copy or opens creator with copy loaded.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"

- id: TASK-008
  title: RTDB Enrichment — Resolve part IDs and compute costs in creators
  priority: medium
  status: not-started
  related_files:
    - src/lib/data-enrichment.ts
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Some saved powers/techniques store part/property IDs but do not include computed EN/TP totals. Update enrichment routines so creators and list views resolve referenced RTDB parts and compute/display final Energy (EN), Training Points (TP), and Currency (C) consistently at render-time.
  acceptance_criteria:
    - `enrichPowers` / `enrichTechniques` resolve parts and produce consistent `cost`/`tp`/`currency` fields.
    - Creator UIs and lists display computed totals.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"

- id: TASK-009
  title: Character Sheet — Innate toggle hit area & alignment (duplicate check)
  priority: high
  status: not-started
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Innate (star) toggle in list rows is difficult to hit and not vertically centered. This appears related to TASK-005 (Fix Innate toggle hit area and alignment). Confirm duplication and either close as duplicate or implement fixes described in TASK-005.
  acceptance_criteria:
    - Confirm duplication with TASK-005 or implement minimum 40x40px hit area and vertical centering for the Innate toggle.
  notes: "Duplicate candidate — see TASK-005"

- id: TASK-010
  title: Powers/Techniques/Armaments — Fix missing/incorrect EN/TP display (duplicate)
  priority: high
  status: not-started
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Lists for powers, techniques, and armaments intermittently show missing or incorrect Energy (EN) or Training Point (TP) values. This is closely related to TASK-006 and TASK-004 (enrichment fixes). Confirm duplication and either close or consolidate work under those canonical tasks.
    
    Notes:
    - To refresh the curated top section, paste raw log entries and request: "Consolidate and update curated feedback" — the agent will re-run summarization and update curated sections.
    - This file is intended to remain the canonical owner-feedback source for engineering planning and triage.
  acceptance_criteria:
    - Confirmed duplicate/consolidated into TASK-006/TASK-004 or explicit plan to fix.
  notes: "Duplicate candidate — see TASK-006 and TASK-004"

- id: TASK-011
  title: Fix login redirect to previous page
  priority: high
  status: not-started
  related_files:
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/components/shared/login-prompt-modal.tsx
    - src/components/layout/header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Login redirect to previous page is not working correctly. When clicking login from the home page and signing in with Google, users are redirected to /characters instead of returning to the home page. The sessionStorage-based redirect mechanism (`loginRedirect`) is not being set properly when clicking the login button in the header nav.
  acceptance_criteria:
    - Clicking login from any page stores that page's path in sessionStorage as `loginRedirect`.
    - After successful login (email, Google, or Apple), user is redirected to the stored path.
    - If no stored path exists, fallback to /characters.
    - sessionStorage is cleared after redirect.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"

- id: TASK-012
  title: My Account — Security audit and feature review
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/stores/auth-store.ts
    - src/hooks/use-auth.ts
    - src/lib/firebase/auth.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Conduct a security audit and feature review for My Account:
    - Can Google/Apple sign-up users change their email?
    - Add profile picture upload capability.
    - Add username change with existence check and inappropriate name filtering.
    - Rate limit username/email changes to once per week.
    - Verify Apple/Google/email sign-in all work correctly.
    - Identify any missing account settings.
    - Check for security risks or bad practices in login/account management.
  acceptance_criteria:
    - Document which settings Google/Apple users can/cannot change.
    - Profile picture upload implemented or documented as future work.
    - Username change with validation (uniqueness, appropriateness, rate limit) implemented or documented.
    - Security audit documented with any risks identified and addressed.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"

- id: TASK-013
  title: Add theme toggle (dark/light/system) in nav dropdown
  priority: medium
  status: not-started
  related_files:
    - src/components/layout/header.tsx
    - src/app/globals.css
    - src/app/layout.tsx
    - src/components/providers/theme-provider.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Add a Settings option in the profile dropdown (nav bar) for theme selection: dark mode, light mode, and system mode. Implement dark mode theming across the site following best practices (CSS variables, next-themes, or similar).
  acceptance_criteria:
    - Profile dropdown includes Settings > Theme option.
    - Theme toggle supports dark/light/system modes.
    - Theme preference persists across sessions.
    - Dark mode styling applied consistently across the site.
    - Uses best practices for Next.js dark mode implementation.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"

- id: TASK-014
  title: Replace placeholder login icon with "Login" button
  priority: low
  status: not-started
  related_files:
    - src/components/layout/header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When not logged in, the placeholder icon in the nav bar should be replaced with a clean "Login" button instead of the current icon.
  acceptance_criteria:
    - When unauthenticated, nav bar shows a clear "Login" button.
    - Button styling is consistent with site design.
    - Button navigates to /login.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"

- id: TASK-015
  title: Create reusable Powered Martial allocation slider component
  priority: high
  status: not-started
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/header-section.tsx
    - src/components/shared/value-stepper.tsx
    - src/components/creator/ability-score-editor.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The Creature Creator has a Powered Martial slider for allocating points between power and martial abilities. Extract this into a reusable component that can also be used in the character sheet edit mode for powered-martial characters. This improves UI consistency and avoids clunky independent point allocation.
  acceptance_criteria:
    - New shared component: `PoweredMartialSlider` (or similar) created.
    - Component used in Creature Creator (existing functionality preserved).
    - Component integrated into Character Sheet edit mode for powered-martial characters.
    - Smaller-scale variant available for character sheet use.
    - Consistent styling across both uses.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"

- id: TASK-016
  title: Unify ability/defense allocation and stepper styles across creators
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/defenses-section.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/shared/value-stepper.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/character-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Ability allocation and defense allocation components have visual inconsistencies between the character sheet, creature creator, and character creator. Steppers and buttons that are meant to be unified show slightly different styles. Audit and unify these components.
  acceptance_criteria:
    - Audit identifies all style differences between ability/defense allocation across sheet/creators.
    - Stepper buttons use consistent styling (use shared `ValueStepper` or unified CSS classes).
    - Visual parity achieved across character sheet, character creator, and creature creator.
    - Document any intentional differences (if any) with rationale.
  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md 2/5/2026"
