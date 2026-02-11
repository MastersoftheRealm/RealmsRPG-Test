# AI Task Queue

This file lists prioritized actionable tasks for AI agents. Agents should update `status` when progressing work and append PR/commit links to `notes`.

**Cursor workflow:** Read `AGENT_GUIDE.md` first. See root `AGENTS.md` and `.cursor/rules/` for session instructions.

---
- id: TASK-001
  title: Unify skill rows across creators
  priority: high
  status: done
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
  notes: "Completed 2026-02-06: Refactored skills-step.tsx to use SkillRow with variant='card' for base skills and variant='compact' for sub-skills. Removed inline SkillAllocator and SubSkillAllocator components."

- id: TASK-002
  title: Audit lists and modals for `ListHeader` adoption
  priority: medium
  status: done
  related_files: []
  created_at: 2026-02-05
  created_by: agent
  description: Ensure all list pages and selection modals use the shared `ListHeader`/`GridListRow` patterns.
  acceptance_criteria:
    - All library and creator modals use `GridListRow`
    - PR includes visual before/after screenshots
  notes: |
    AUDIT COMPLETE 2026-02-06:
    ✅ Using GridListRow/ListHeader: codex/page.tsx, library/page.tsx, library-section.tsx, add-feat-modal.tsx, add-skill-modal.tsx, add-library-item-modal.tsx, feats-step.tsx, equipment-step.tsx, creature-creator/page.tsx, unified-selection-modal.tsx
    ✅ Using ItemCard/ItemList (alternative unified): item-selection-modal.tsx
    ⚠ Custom (justified): add-sub-skill-modal.tsx (unique base-skill selector UI), species-modal.tsx (detail view), level-up-modal.tsx (wizard), recovery-modal.tsx (specialized)
    CONCLUSION: All list pages and selection modals already use unified patterns (GridListRow or ItemCard). No changes needed.

# How agents pick tasks
- Prefer `priority: high` and `status: not-started` tasks
- Update `status` to `in-progress` at start, and `done` when merged
- Add `notes` with PR or commit links on completion

# Creating new tasks dynamically
Agents should **create new tasks** during their work when they discover additional work needed:

**When to create tasks:**
- During audits/code reviews: Found issues, inconsistencies, or improvement opportunities
- During task implementation: Discovered related bugs, edge cases, or dependencies
- After completing a task: Identified follow-up work or enhancements
- When breaking down complex work: Create phase tasks with clear dependencies

**Task creation guidelines:**
- Use next available TASK-### ID (check last task in file)
- Set appropriate `priority` based on impact (high/medium/low)
- Mark as `status: not-started` (or `in-progress` if starting immediately)
- Set `created_by: agent` and include current date in `created_at`
- Include clear `description` and `acceptance_criteria`
- List `related_files` to help future agents
- Add context in `notes` about why task was created (e.g., "Created during TASK-002 audit - found inconsistency in...")

**Example - Creating follow-up tasks from an audit:**
```yaml
- id: TASK-042
  title: Fix inconsistent button styling in modals
  priority: medium
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: During TASK-002 audit, found 3 modals using custom button styles instead of shared Button component
  related_files:
    - src/components/modals/custom-modal.tsx
  notes: "Created during TASK-002 audit. Affects: add-custom-item-modal, edit-profile-modal, delete-confirm-modal"
```

**Best practices:**
- Create tasks immediately when discovering work - don't defer
- Be specific about what needs to be done and why
- Link to the parent task that led to discovery
- Don't create duplicate tasks - check existing queue first

- id: TASK-003
  title: Show weapon damage in Library and wire Edit -> Item Creator
  priority: high
  status: done
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
  notes: "Completed 2026-02-06: Damage column was already present. Added ?edit= URL parameter handling to item-creator page with useSearchParams and Suspense wrapper. Edit button now uses router.push() for in-app navigation instead of window.open."

- id: TASK-004
  title: Fix RTDB enrichment so list views compute EN/TP/C correctly
  priority: high
  status: done
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
  notes: "Completed 2026-02-06: Fixed library/page.tsx early return blocking display while RTDB loaded. Removed !partsDb.length check from PowersTab and TechniquesTab cardData useMemo. Enrichment was already correct; issue was data not displaying while parts loaded."

- id: TASK-005
  title: Fix Innate toggle hit area and alignment in list rows
  priority: high
  status: done
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/innate-toggle.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Innate (star) toggle in power/technique list rows is difficult to hit and not vertically centered. Improve click target, alignment, and accessibility so toggling innate works reliably outside edit mode.
  acceptance_criteria:
    - Innate toggle has a minimum 40x40px hit area and is vertically centered.
    - Toggle works in both list and expanded row views without requiring edit mode.
    - Manual verification on desktop/mobile passes.
  notes: "Completed 2026-02-05: Created dedicated InnateToggle component with min-w-[44px] min-h-[44px] touch target, added pl-1 and min-h-[44px] to GridListRow leftSlot container for proper alignment"

- id: TASK-006
  title: Fix missing/incorrect EN/TP display for Powers/Techniques/Armaments
  priority: high
  status: done
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
  notes: "Completed 2026-02-06: Related to TASK-004. The enrichment functions already produced correct cost fields. Fixed the library page early return that prevented display while RTDB data loaded."


- id: TASK-007
  title: Library — Show weapon damage and enable in-place Edit/Duplicate
  priority: low
  status: done
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
  notes: "Duplicate of TASK-003. DONE 2026-02-06: Consolidated with TASK-003 work."

- id: TASK-008
  title: RTDB Enrichment — Resolve part IDs and compute costs in creators
  priority: medium
  status: done
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
  notes: "Related to TASK-004. DONE 2026-02-06: The enrichment was already correct. Fixed library display by removing the early return that blocked rendering while RTDB loaded."

- id: TASK-009
  title: Character Sheet — Innate toggle hit area & alignment (duplicate check)
  priority: high
  status: done
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
  notes: "DUPLICATE RESOLVED 2026-02-05: Confirmed duplicate of TASK-005. Fix implemented via InnateToggle component with 44x44px touch target and GridListRow min-h-[44px]."

- id: TASK-010
  title: Powers/Techniques/Armaments — Fix missing/incorrect EN/TP display (duplicate)
  priority: high
  status: done
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
  notes: "Duplicate of TASK-006 and TASK-004. DONE 2026-02-06: Fixed with the library early return removal in TASK-004."

- id: TASK-011
  title: Fix login redirect to previous page
  priority: high
  status: done
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
  notes: "DONE 2026-02-05: Added handleLoginClick() function in header.tsx that stores pathname in sessionStorage as 'loginRedirect' before router.push('/login')."

- id: TASK-012
  title: My Account — Security audit and feature review
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/stores/auth-store.ts
    - src/hooks/use-auth.ts
    - src/lib/supabase/session.ts
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
  notes: |
    AUDIT COMPLETE 2026-02-05:
    ✓ GOOD: Reauthentication before email/password change and delete
    ✓ GOOD: DELETE confirmation requires typing "DELETE"
    ✓ GOOD: Error handling with user-friendly messages
    ✓ GOOD: Clear sign-out functionality
    ⚠ GAP: Google/Apple OAuth users can't change email (no password for reauth) - needs provider detection
    ⚠ GAP: Username editing not implemented (displayName only)
    ⚠ GAP: Profile picture upload not implemented
    ⚠ GAP: No rate limiting on changes (should be backend concern)
    RECOMMENDATION: Add provider detection to show appropriate options per auth method.
    RESOLVED: All gaps addressed — TASK-047 (auth provider detection), TASK-046 (username change), TASK-041 (profile picture upload).

- id: TASK-013
  title: Add theme toggle (dark/light/system) in nav dropdown
  priority: medium
  status: done
  related_files:
    - src/components/layout/header.tsx
    - src/app/globals.css
    - src/app/layout.tsx
    - src/components/providers/theme-provider.tsx
    - src/components/shared/theme-toggle.tsx
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
  notes: "DONE 2026-02-05: Installed next-themes, created ThemeProvider and ThemeToggle components. Integrated into user dropdown in header.tsx with Light/Dark/System options."

- id: TASK-014
  title: Replace placeholder login icon with "Login" button
  priority: low
  status: done
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
  notes: "DONE 2026-02-05: Replaced Image component with Button variant='primary' size='sm' with text 'Login' in header.tsx."

- id: TASK-015
  title: Create reusable Powered Martial allocation slider component
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/header-section.tsx
    - src/components/shared/value-stepper.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/shared/powered-martial-slider.tsx
    - src/components/creator/archetype-selector.tsx
    - src/components/character-sheet/archetype-section.tsx
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
  notes: "DONE 2026-02-05: Created PoweredMartialSlider in shared/, integrated into archetype-selector.tsx (creator) and archetype-section.tsx (character sheet edit mode with compact variant)."

- id: TASK-016
  title: Unify ability/defense allocation and stepper styles across creators
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
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
  notes: |
    AUDIT COMPLETE 2026-02-05:
    ✓ AbilityScoreEditor uses ValueStepper consistently
    ✓ DefensesSection uses ValueStepper consistently
    ✓ AbilitiesSection uses ValueStepper consistently
    FINDING: All components already use the shared ValueStepper component.
    Differences are intentional: compact=true for dense layouts, different sizes for context.
    No changes needed - already unified."
- id: TASK-017
  title: Implement Recovery Modal with full and partial recovery options
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/character-sheet/index.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-rtdb.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Create a Recovery Modal that opens when clicking Recovery on the character sheet. The modal supports two modes:
    
    **Full Recovery**: Restores HP to max, EN to max, and all feat/trait uses with recovery type "Full" or "Partial" to their max values.
    
    **Partial Recovery**: User selects 2, 4, or 6 hours of rest. Each 2-hour block provides 1/4 of max resources to allocate between HP and EN.
    - 2 hours = 1/4 to both OR 1/2 to one
    - 4 hours = 1/2 to both OR 3/4 to one + 1/4 to other OR full to one
    - 6 hours = 3/4 to both OR full to one + 1/2 to other, etc.
    
    **Automatic mode**: Calculates optimal allocation based on current deficits (maximize total percentage recovered). When indifferent, spread evenly.
    
    **Rounding**: Always round up for fractions (9 max HP / 2 = 5 HP recovered).
    
    **Feat/Trait recovery**: Partial recovery resets uses for feats/traits with recovery period "Partial" to max. Does NOT reset "Full" recovery feats/traits.
  acceptance_criteria:
    - Recovery button opens a sleek modal matching site design.
    - Full Recovery option restores HP, EN, and all feat/trait uses to max.
    - Partial Recovery allows selecting 2/4/6 hours with manual or automatic allocation.
    - Automatic mode calculates optimal HP/EN split based on percentage deficit.
    - Fractions round up.
    - Partial recovery resets "Partial" feat/trait uses but not "Full" uses.
    - Modal UI is clean, simple, and mobile-friendly.
  notes: "DONE 2026-02-05: Created RecoveryModal component with full/partial modes, automatic optimization, manual allocation slider, feat/trait reset logic. Integrated into character sheet page."

- id: TASK-018
  title: "BUG: Prevent negative weight/height values in character notes"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Users can currently set Weight and Height to negative values in the Character Notes → Physical Attributes & Movement section. Add validation to ensure minimum value is 1.
  acceptance_criteria:
    - Weight input has min value of 1.
    - Height input has min value of 1.
    - Attempting to go below 1 is prevented (stepper disabled or input clamped).
  notes: "DONE 2026-02-05: Added min='1' HTML attribute to weight/height inputs, added Math.max(1, ...) validation in blur handlers."

- id: TASK-019
  title: "BUG: Fix unable to remove items from inventory"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Users are unable to remove items from their inventory in Character Notes → Inventory. The remove/delete functionality is broken or missing.
  acceptance_criteria:
    - Inventory items can be removed via a delete/remove button.
    - Removal persists to the database.
    - UI updates immediately after removal.
  notes: "DONE 2026-02-05: Removed isEditMode condition from onDelete props for weapons, armor, and equipment in library-section.tsx. Users can now delete items without being in edit mode."

- id: TASK-020
  title: Unify pencil/edit icons across character sheet
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/shared/edit-section-toggle.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Unify all pen/pencil edit icons across the character sheet to one consistent style. Prefer simple icons with no button background (like character name/XP, skills). Remove circular backgrounds from ability edit icons. Color scheme: blue for neutral edits, green for resource gains, red for resource costs/overspent states.
  acceptance_criteria:
    - All edit icons use the same simple pencil style (no circular background)
    - Consistent color coding: blue (neutral), green (positive), red (negative/overspent)
    - Remove the circular background from abilities edit icon
    - Visual consistency across all character sheet sections
  notes: "DONE 2026-02-05: Removed circular backgrounds from EditSectionToggle (bg-blue-100, rounded-full removed). Updated sheet-header name/XP icons to use Pencil instead of Edit2 with blue color (text-blue-500 hover:text-blue-600). Icon size standardized to w-4 h-4."

- id: TASK-021
  title: Character name edit mode restriction + XP always editable
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Character name should only be editable when in edit mode. XP should be editable at any time without requiring edit mode.
  acceptance_criteria:
    - Character name pencil icon only appears/functions in edit mode
    - XP edit icon/functionality available regardless of edit mode
    - Both respect the color scheme from TASK-020
  notes: "DONE 2026-02-05: Updated characters/[id]/page.tsx to conditionally pass onNameChange={isEditMode ? handleNameChange : undefined} so name is only editable in edit mode. XP onExperienceChange is always passed so it's always editable."

- id: TASK-022
  title: Library feats tab - enable feat deletion via pencil icon
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The pencil icon in character library feats tab is currently useless. Repurpose it to allow deletion of feats, or add a proper delete action for feats in the library tab.
  acceptance_criteria:
    - Feats can be deleted from the library feats tab
    - Delete action is accessible without edit mode
    - Confirmation dialog before deletion
  notes: |
    DONE 2026-02-05: Added onRemoveFeat to LibrarySectionProps, wired through to FeatsTab. Created handleRemoveFeat handler in page.tsx that removes from archetypeFeats or feats arrays by ID/name. Removed isEditMode guard so feats can be deleted without edit mode.
    COMPLIANCE GAP: Acceptance criteria required "Confirmation dialog before deletion" — not implemented. See TASK-053.

- id: TASK-023
  title: "BUG: Custom note name edit should not collapse the note"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When clicking on a custom note name to edit or add a name, the note collapses. It should stay expanded since the user is editing, not intending to collapse.
  acceptance_criteria:
    - Clicking to edit a custom note name does not collapse the note
    - Name editing happens inline while note remains expanded
    - Clicking elsewhere or pressing Enter/Escape closes edit mode
  notes: "DONE 2026-02-05: Added e.stopPropagation() to both the name span onClick and input onClick handlers in NoteCard component. The parent div's onClick toggles collapse, so stopping propagation prevents collapse when interacting with name editing."

- id: TASK-024
  title: Energy cost buttons for Powers/Techniques - match roll button styles
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Energy costs for powers/techniques should be displayed as clickable buttons with the same styles as roll buttons, indicating you can spend the resource by clicking. Remove duplicate energy columns - keep only the button version. Move energy to rightmost column. Buttons should just show "X" (the energy cost) not "Use (X)".
  acceptance_criteria:
    - Energy displayed as buttons styled like roll buttons
    - No duplicate energy columns
    - Energy column moved to rightmost position
    - Button text is just the number, not "Use (X)"
    - Clicking the button spends the energy
  notes: "DONE 2026-02-05: Updated POWER_COLUMNS and TECHNIQUE_COLUMNS to move energy to rightmost (4rem width). Replaced old 'Use (X)' button with RollButton component showing just the energy cost number. Powers use variant='primary' (blue), techniques use variant='success' (green). Energy displayed in rightSlot of GridListRow."

- id: TASK-025
  title: Update Innate Energy tab summary text and centering
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Update the innate energy power tab summary text from "Innate powers use this energy pool instead of regular energy" to "Innate powers have no cost to use. You may have powers with energy costs up to your innate energy." Also center the summary content.
  acceptance_criteria:
    - Updated summary text as specified
    - Summary content is centered
  notes: "DONE 2026-02-05: Changed text from 'Innate powers use this energy pool instead of regular energy' to 'Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.' Added text-center class."

- id: TASK-026
  title: Power/Technique display formatting - capitalize and abbreviate
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Fix display formatting for power/technique list items:
    - Capitalize damage types: "Radiant" not "radiant"
    - For 1 target, display "Target" instead of "1 target"
    - Capitalize duration: "Rounds" not "rounds"
    - Abbreviate duration: "4 MIN" instead of "4 minutes (Focus)", "2 RNDS" or "1 RND"
    - Move focus/sustain details to expanded view only, not overview
  acceptance_criteria:
    - All damage types capitalized
    - "Target" shown for single target abilities
    - Duration capitalized and abbreviated (MIN, RNDS, RND)
    - Focus/sustain details only in expanded view
  notes: "DONE 2026-02-06: Added formatDamageType, formatArea, formatDuration helpers in library-section.tsx. Applied to both innate and regular power column values. Capitalize damage types, 'Target' for single target, abbreviate durations (MIN/RNDS/RND/HR/Conc./Instant), strip parenthetical focus/sustain details."

- id: TASK-027
  title: Remove invalid "radiant" damage type from Power Creator
  priority: medium
  status: done
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/lib/game/creator-constants.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the damage type "radiant" from the power creator - it's not a valid Realms damage type. Reference the vanilla site for proper damage types and their related part names/IDs.
  acceptance_criteria:
    - "Radiant" damage type removed from power creator options
    - Only valid Realms damage types available
    - Part IDs used correctly (not names)
  notes: "DONE 2026-02-06: Removed 'radiant' from MAGIC_DAMAGE_TYPES and ALL_DAMAGE_TYPES in creator-constants.ts, replaced with 'light' (proper Realms name). Kept 'radiant' → LIGHT_DAMAGE mapping in mechanic-builder.ts and power-calc.ts as legacy fallback."

- id: TASK-028
  title: List headers - use all caps consistently
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/list-components.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    All list headers in character library should use full caps for consistency: "NAME ACTION DAMAGE ENERGY" instead of "Name Action Damage Energy". Apply globally to all list header components.
  acceptance_criteria:
    - All list headers display in UPPERCASE
    - Consistent across all tabs (feats, powers, techniques, inventory)
    - ListHeader component updated to enforce uppercase
  notes: "DONE 2026-02-05: Verified both ListHeader and SortHeader components already have 'uppercase' in their className. All list headers display in caps. Build verified."

- id: TASK-029
  title: List header column alignment - center over list items
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Ensure list headers are properly aligned over their corresponding list item columns. Headers should be centered over the data columns (e.g., "ACTION" centered over action values). Exception: NAME column is always left-aligned for both header and items.
  acceptance_criteria:
    - All column headers centered over their data columns
    - NAME column left-aligned
    - Grid template columns match between header and rows
  notes: "Added align prop to ColumnValue, restructured grid templates to match row slots, centered all data columns"

- id: TASK-030
  title: Remove "Character Saved" toast - keep only top bar save state
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the "Character Saved" prompt/toast notification. Keep only the "Unsaved Changes" and "Saved" UI indicator at the top of the character sheet.
  acceptance_criteria:
    - "Character Saved" toast/prompt removed
    - Top bar save state indicator remains functional
    - "Unsaved Changes" indicator still works
  notes: "DONE 2026-02-06: Removed showToast('Character saved'...) from onSaveComplete callback in characters/[id]/page.tsx. Top bar Saved/Unsaved indicator remains."

- id: TASK-031
  title: Relocate character sheet top bar actions to side icons
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/sheet-action-toolbar.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the character sheet top bar and relocate its actions (recovery, level up, edit mode, save state) to icons on the side of the screen, similar to the dice roller icon but positioned in the top right or another unintrusive location. Remove the "back to characters" arrow/link since nav bar already has characters link.
  acceptance_criteria:
    - Top bar removed
    - Recovery, Level Up, Edit Mode buttons moved to side/corner icons
    - Save state indicator relocated appropriately
    - Back to characters link removed
    - UI remains intuitive and accessible
  notes: "Created SheetActionToolbar floating component with Edit/Recovery/LevelUp/Save icons, replaced sticky top bar"

- id: TASK-032
  title: Dice Roller overhaul - match vanilla site design with enhancements
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/dice-roller.tsx
    - src/components/character-sheet/roll-log.tsx
    - public/images/
  created_at: 2026-02-05
  created_by: owner
  description: |
    Overhaul the dice roller to match the vanilla site design while keeping useful enhancements:
    - Use custom dice images from vanilla site
    - Keep: modifier/bonus input for custom rolls
    - Custom rolls logged as "Custom Roll" (no naming needed)
    - Show dice icons with labels (1d10 below the icon)
    - Display: dice images → result + bonus → total
    - Save dice logs (last 20 rolls) - persist across refresh/navigation
  acceptance_criteria:
    - Dice roller uses custom dice images from vanilla site
    - Clickable dice icons with labels (e.g., "1d10")
    - Roll display: dice images, individual results, bonus, total
    - Custom roll modifier input preserved
    - Last 20 rolls saved to localStorage
    - Logs persist across refresh and navigation
  notes: "Rewrote roll-log with custom dice PNGs, localStorage persistence, grouped dice display, crit bonuses"

- id: TASK-033
  title: Chip expansion behavior - expand in place without separate bubble
  priority: medium
  status: done
  related_files:
    - src/components/ui/chip.tsx
    - src/components/shared/expandable-chip.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When expanding a chip for more details, expand the chip in place (displacing chips above/below) instead of creating a separate bubble/popover. Maintain same coloring and styling when expanded. Some chips should not expand (tag chips for feats, trait type chips, codex character/state feat badges).
  acceptance_criteria:
    - Expandable chips expand inline, pushing adjacent chips
    - Same styling maintained when expanded
    - Informational-only chips (tags, trait types, feat types) don't expand
    - Smooth expand/collapse animation
  notes: "Chips now expand inline with same styling, tag chips non-expandable, smooth transitions"

- id: TASK-034
  title: "BUG: Fix armor/weapon equip toggle functionality"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/equip-toggle.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Armor and weapons don't become equipped when hitting the equip button. Fix the equip toggle functionality. Change the equip button to a circle or other symbol that fills when equipped.
  acceptance_criteria:
    - Equip toggle works for armor and weapons
    - Equipped state persists to database
    - Visual indicator: unfilled circle → filled circle when equipped
    - Works outside edit mode
  notes: "DONE 2026-02-05: Created EquipToggle component with Circle/CheckCircle2 icons (unfilled/filled). Updated library-section to use EquipToggle instead of SelectionToggle. Fixed handlers in characters/[id]/page.tsx to match by ID or name (equipment stored as {name, equipped} without ID). Updated handleToggleEquipWeapon, handleToggleEquipArmor, handleRemoveWeapon, handleRemoveArmor, handleRemoveEquipment, handleEquipmentQuantityChange to match items by ID, name, or case-insensitive name."

- id: TASK-035
  title: Equipment/Inventory tab fixes - quantity, tags, height
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Fix equipment/inventory tab issues:
    - Enable quantity increase/decrease outside edit mode
    - Add missing currency, rarity, and category tags
    - Add truncated descriptions after name (like feats/traits)
    - Fix inventory list items being taller than other tabs (normalize height/font)
  acceptance_criteria:
    - Quantity +/- buttons work outside edit mode
    - Currency, rarity, category tags displayed
    - Truncated descriptions visible in collapsed view
    - Consistent row height with other tabs
  notes: "Added type column, rarity/cost badges, description prop, quantity always editable, compact mode"

- id: TASK-036
  title: Archetype ability indicators - purple/red outlines instead of yellow
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/abilities-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Update archetype ability indicators to match character creator styling:
    - Power ability outlined in purple (power color)
    - Martial ability outlined in red (martial color)
    - Remove current yellow outlining
    - Remove "power" and "martial" symbols/labels by ability names
  acceptance_criteria:
    - Power abilities have purple outline
    - Martial abilities have red outline
    - No yellow outlines
    - No power/martial text labels by abilities
    - Consistent with character creator indicators
  notes: "DONE 2026-02-06: Replaced emoji indicators (🔮/⚔️) with colored border outlines - purple (border-purple-400) for power ability, red (border-red-400) for martial. Removed yellow border-amber-300 and emoji labels."

- id: TASK-037
  title: Ability edit mode - center skill/ability points display
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In character sheet ability edit mode, center the skill/ability points indicators in their row for better visibility. Match styles with ability allocation in character/creature creators and skill point allocation in skill creators. Both resource types should have analogous styling.
  acceptance_criteria:
    - Skill points and ability points centered in their rows
    - Styles match character creator and creature creator
    - Both resource displays use consistent, analogous styling
    - Clear visual hierarchy and easy to read
  notes: "DONE 2026-02-06: Changed abilities edit mode point display from flex-wrap with flex-1 spacer to flex-col items-center with justify-center. Points now centered, max info centered below."

- id: TASK-038
  title: Remove hold-to-increase from ability/defense steppers
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/shared/value-stepper.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove enableHoldRepeat from ability and defense steppers. Hold-to-increase is only useful for pool allocation (HP/EN), not for ability scores and defense values which change in small discrete amounts.
  acceptance_criteria:
    - Ability score steppers no longer have hold-to-repeat
    - Defense skill steppers no longer have hold-to-repeat
    - HP/EN pool steppers still have hold-to-repeat
    - Dice roller steppers still have hold-to-repeat
  notes: "DONE 2026-02-05: Removed enableHoldRepeat prop from all 4 stepper buttons in abilities-section.tsx (2 ability DecrementButton/IncrementButton, 2 defense DecrementButton/IncrementButton). HP/EN and dice roller steppers still have hold-to-repeat enabled."

- id: TASK-039
  title: Implement skill value cap (max 3) and defense bonus validation
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Enforce game rules for skill and defense caps:
    - Skill values cannot exceed 3 for any given skill
    - Defense bonuses from skill points cannot exceed level (e.g., can't increase defense bonus to 4 via skill points until level 4+)
    - Defense bonus from base ability is unrestricted (e.g., 3 int = +3 mental fort is fine at level 1)
    - Only the skill-point-allocated portion of defense is capped by level
  acceptance_criteria:
    - Skill values capped at 3 (increment disabled at 3)
    - Defense skill point allocation capped by character level
    - Ability-derived defense bonus not affected by cap
    - Validation clear to user (disabled buttons, tooltip explanations)
  notes: "DONE 2026-02-06: Added MAX_SKILL_VALUE=3 constant. Added cap checks in handleSkillIncrease for both sub-skills and base skills. Updated canIncrease prop to include skill_val < MAX_SKILL_VALUE check. Defense validation already in place (capped at level)."

- id: TASK-040
  title: Character library UI - capitalize Currency, bigger tabs, defense button style
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/roll-button.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Three library UI improvements:
    1. Capitalize "Currency" label and visually separate it from armament proficiency
    2. Increase font size of library tabs and make them more visible
    3. Make defense roll buttons same style/color as ability roll buttons (currently less saturated utility colors vs primary blue)
  acceptance_criteria:
    - "Currency" label capitalized
    - Currency section clearly separated from armament proficiency
    - Tab font size increased and more visually prominent
    - Defense roll buttons use same gradient/saturation as ability roll buttons
  notes: "DONE 2026-02-05: Capitalized 'Currency' label with font-medium. Separated currency from armament proficiency with border-t divider. Changed TabNavigation size from 'sm' to 'md' for larger tab font. Changed defense RollButton variant from 'defense' (utility colors) to 'primary' (matching ability roll buttons)."

- id: TASK-041
  title: Character/profile picture upload modal with crop
  priority: high
  status: done
  related_files:
    - src/components/shared/image-upload-modal.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Create an image upload modal for character portraits and profile pictures. Features:
    - Upload from device, drag and drop support
    - Show accepted image types and sizes, recommended aspect ratio
    - Translucent frame overlay showing crop area (rectangle for character portrait, circle for profile icon)
    - Drag/pinch to position and scale image within frame
    - Preview before confirming
    - Sleek, clean design matching site styles
  acceptance_criteria:
    - Upload modal with drag-and-drop support
    - Image manipulation (drag, scale) within crop frame
    - Rectangle frame for character portrait, circle for profile icon
    - Shows accepted formats, recommended sizes
    - Clean modal UI matching site design
    - Works for both character sheet and profile picture
  notes: "DONE 2026-02-06: Created ImageUploadModal (react-easy-crop) with drag-and-drop, zoom slider, canvas crop. Rect crop (3:4) for character portrait in sheet-header.tsx. Round crop (1:1) for profile picture in my-account page. Uploads to Supabase Storage. Exported from shared/index.ts."

- id: TASK-042
  title: Separate species name from level line in character sheet header
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In the character sheet header, species name is currently combined with level on the same line ("Level 1 Human"). Separate them so species is on its own line or visually distinct from the level display.
  acceptance_criteria:
    - Species name visually separated from level
    - Clean header layout maintained
    - Both pieces of info still clearly visible
  notes: "DONE 2026-02-05: Changed 'Level X SpeciesName' to 'Level X · SpeciesName' with species in font-medium span for visual distinction. Uses middle dot separator."

- id: TASK-043
  title: Hide skill point display in non-edit mode
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In non-edit mode, the skill point current/max display (PointStatus) in the top right of the skills list should be hidden. Only show skill point allocation info when in edit mode.
  acceptance_criteria:
    - PointStatus hidden when not in edit mode
    - PointStatus visible when in edit mode
    - No layout shift when toggling edit mode
  notes: "DONE 2026-02-05: Wrapped PointStatus in showEditControls conditional so skill point current/max is only visible in edit mode."

- id: TASK-044
  title: Fix skill point calculation - show 3/3 not 5/5 at level 1
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/character-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Game rules: Level 1 characters have 5 skill points total, but species forces 2 into set skills. Display available skill points as 3/3 (not 5/5) at level 1, with +3 each level. Creature creator should show 5/5 since no species selection. The 2 species skill points are pre-allocated and not available for player choice.
  acceptance_criteria:
    - Character sheet shows 3/3 skill points at level 1 (5 total - 2 species = 3 choosable)
    - Character creator shows 3/3 at level 1
    - Creature creator shows 5/5 at level 1
    - +3 skill points per level for all
    - Species proficiency skills still granted automatically
  notes: "DONE 2026-02-06: Added characterSpeciesSkills useMemo in page.tsx. Subtracted species count from totalSkillPoints (3 at level 1 instead of 5). Excluded species proficiency from spent calculations in both page.tsx and skills-section.tsx. Updated speciesSkills prop with characterSpeciesSkills. Updated character creator skills-step.tsx to subtract speciesSkillIds.size."

- id: TASK-045
  title: Unify HP/EN pool allocation styles across sheet and creators
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/creator/health-energy-allocator.tsx
    - src/app/(main)/character-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The HealthEnergyAllocator in the character sheet uses variant="inline" which looks different from the character/creature creator versions. Unify the styles so all three use the same visual design, colors, and layout.
  acceptance_criteria:
    - Character sheet HP/EN allocation matches creator designs
    - Same colors, spacing, and visual weight across all instances
    - HealthEnergyAllocator variants produce visually consistent output
  notes: "DONE 2026-02-06: Redesigned inline variant to match card variant: state-based borders (green complete, red overspent, neutral default), matching header with label and spent/total display, removed gradient background."

- id: TASK-046
  title: Username change with validation (uniqueness, filtering, rate limit)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/actions.ts
  created_at: 2026-02-05
  created_by: agent
  description: |
    Implement username change functionality with:
    - Uniqueness check against Firestore
    - Inappropriate name filtering
    - Rate limit to once per week
    Discovered during TASK-012 security audit as a gap.
  acceptance_criteria:
    - Username change form in My Account
    - Uniqueness validation before save
    - Basic inappropriate name filter
    - Rate limiting (once per week)
  notes: "DONE 2026-02-05: Added changeUsernameAction (server action) with uniqueness (users collection), blocklist, rate limit (7 days), 3-24 char alphanumeric validation. My Account page has Change Username form. Updates users + usernames collections."

- id: TASK-047
  title: Auth provider detection for My Account settings
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Detect auth provider (Google/Apple/email) and show/hide appropriate My Account settings.
    Google/Apple users cannot change email (no password for reauth). Show appropriate options per auth method.
  acceptance_criteria:
    - Detect auth provider from Firebase user object
    - Hide email/password change for OAuth users
    - Show relevant options per provider
  notes: "DONE 2026-02-05: Added hasPasswordProvider() and getAuthProviderLabel() using user.providerData. Profile shows 'Signed in with' (Google/Apple/Email). Change Email and Change Password sections hidden for OAuth users. Info message shown for OAuth users explaining they must use provider settings."

- id: TASK-048
  title: Library tab ordering - default to Feats
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Enforce tab order: Feats → Powers → Techniques → Inventory → Proficiencies → Notes.
    Default open tab should be Feats.
  acceptance_criteria:
    - Tabs render in specified order
    - Default active tab is Feats
  notes: "DONE (pre-existing): library-section.tsx tabs array order is Feats→Powers→Techniques→Inventory→Proficiencies→Notes; useState('feats') sets default. Verified 2026-02-05 audit."

- id: TASK-049
  title: Sortable list headers (column sorting)
  priority: low
  status: done
  related_files:
    - src/components/shared/list-header.tsx
    - src/components/shared/list-components.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Make list column headers clickable to sort by that column. Sort ascending/descending on click.
    Apply across library, codex, and modal list views.
  acceptance_criteria:
    - Clickable column headers with sort direction indicator
    - Sort state persists within session
    - Works across all list views
  notes: "DONE 2026-02-05: Library-section had ListHeader + sortState but data wasn't sorted. Added sortByCol helper and useMemo for sortedInnatePowers, sortedRegularPowers, sortedTechniques, sortedWeapons, sortedArmor, sortedEquipment. Library, Codex, modals already had sort applied; library-section was the gap."

- id: TASK-050
  title: Creature creator fixes (prowess, dropdowns, summary scroll)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Bundle of creature creator fixes:
    1. Hide unarmed prowess options > level 1 for new characters
    2. Fix dropdown alignment issues
    3. Make summary scroll behavior consistent
  acceptance_criteria:
    - Prowess options filtered by level
    - Dropdowns properly aligned
    - Summary scrolls consistently
  notes: |
    DONE 2026-02-05:
    - Prowess: Character creator equipment-step already filters unarmed prowess by charLevel <= draft.level; level 1 chars only see Unarmed Prowess I.
    - Dropdowns: AddItemDropdown now uses items-center, py-2, rounded-lg, min-w-0, flex-shrink-0 for consistent alignment.
    - Summary: Creature sidebar wrapper now has sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto for consistent scroll.

- id: TASK-051
  title: Implement modern thin scrollbars sitewide
  priority: low
  status: done
  related_files:
    - src/app/globals.css
  created_at: 2026-02-05
  created_by: agent
  description: |
    Add modern thin scrollbar styling across the site using CSS.
    Use scrollbar-width: thin and custom ::-webkit-scrollbar styles.
  acceptance_criteria:
    - Thin scrollbars on all scrollable containers
    - Works in Chrome, Firefox, Safari
    - Subtle, non-intrusive appearance
  notes: "DONE (pre-existing): globals.css @layer base already has scrollbar-width: thin (Firefox), ::-webkit-scrollbar 6px (Chrome/Safari/Edge), transparent track, rounded thumb. Verified 2026-02-05."

- id: TASK-052
  title: Character creator - persist skill allocations on tab switch
  priority: medium
  status: done
  related_files:
    - src/app/(main)/character-creator/page.tsx
    - src/stores/character-creator-store.ts
  created_at: 2026-02-05
  created_by: agent
  description: |
    Skill allocations in character creator are lost when switching tabs. Persist them in the creator store
    so they survive tab navigation.
  acceptance_criteria:
    - Skill allocations persist when switching to another step and back
    - Values restored correctly on return to skills step
  notes: "DONE 2026-02-05: Switched skills-step to use draft.skills as single source of truth instead of local useState. Allocations now persist when switching tabs and returning."

- id: TASK-053
  title: Add confirmation dialog before feat deletion (TASK-022 compliance)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/feats-tab.tsx
    - src/components/shared/delete-confirm-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    TASK-022 acceptance criteria required "Confirmation dialog before deletion" for feat deletion.
    Feat deletion currently calls handleRemoveFeat directly with no confirmation. Add DeleteConfirmModal
    or similar before removing feats from archetype/character/state feat lists.
  acceptance_criteria:
    - Clicking feat delete/remove triggers confirmation modal
    - User must confirm before feat is removed
    - Canceling closes modal without removing feat
    - Uses existing DeleteConfirmModal or consistent modal pattern
  notes: "DONE 2026-02-05: Added featToRemove state and DeleteConfirmModal. FeatsTab now passes featName to onRemoveFeat; page shows confirmation before calling handleRemoveFeat. DeleteConfirmModal extended with deleteContext prop for 'character' vs 'library'."

- id: TASK-054
  title: Documentation — add agent verification guidelines
  priority: low
  status: done
  related_files:
    - AGENTS.md
    - src/docs/ai/AGENT_GUIDE.md
  created_at: 2026-02-05
  created_by: agent
  description: |
    Improve docs for AI agents: add verification steps before marking tasks done, note that
    related_files in task queue may be stale and should be verified against codebase.
  acceptance_criteria:
    - AGENTS.md or AGENT_GUIDE includes "verify acceptance criteria fully met before marking done"
    - AGENT_GUIDE includes note about verifying related_files paths
  notes: "DONE 2026-02-05: Added 'Verification Before Marking Done' section to AGENT_GUIDE with acceptance-criteria check, related_files verification, build check, and manual spot-check. AGENTS.md already had verification steps from prior audit."

- id: TASK-055
  title: Rename "Ability Scores" to "Abilities" everywhere + fix cost hint
  priority: medium
  status: done
  related_files:
    - src/components/creator/ability-score-editor.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-creator/steps/abilities-step.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In Realms RPG, ability values are called "bonuses" or "values", not "scores". The term "Ability Scores"
    appears in component names and headings. Rename to just "Abilities" throughout.
    Also fix "Next: 2 Points" label — abilities 4+ cost 2 points, not the generic "3" shown.
  acceptance_criteria:
    - Component name AbilityScoreEditor renamed or aliased to AbilityEditor
    - All headings say "Abilities" or "Assign Abilities", not "Ability Scores"
    - High-ability cost hint shows "Next: 2 Points" for values 4+
    - npm run build passes
  notes: |
    DONE 2026-02-06:
    - Renamed heading "Ability Scores" → "Abilities" in creature-creator/page.tsx.
    - Updated comments in ability-score-editor.tsx, abilities-section.tsx, creator/index.ts.
    - Fixed cost hint bug in abilities-section.tsx: getAbilityIncreaseCost now returns 2 at value>=3 (next increase to 4+ costs 2). Removed redundant `cost + (value >= 3 ? 1 : 0)` workaround, replaced with clean `cost`.
    - Also renamed HealthEnergyAllocator label from "HP/EN Pool" to "Health/Energy Allocation" (from same feedback batch).

- id: TASK-056
  title: Auto-capitalize archetype ability display
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-creator/steps/finalize-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The character's power/martial ability is sometimes displayed lowercase ("charisma" instead of "Charisma").
    Ensure it's always title-cased in the character sheet header and archetype section.
  acceptance_criteria:
    - Power ability and martial ability displayed with first letter capitalized
    - Applies in archetype section and header
  notes: |
    DONE 2026-02-06: Verified — already handled. sheet-header.tsx uses CSS `capitalize` class on pow_abil/mart_abil spans. archetype-section.tsx uses JS charAt(0).toUpperCase() + slice(1). finalize-step.tsx uses CSS `capitalize`. All single-word ability names are properly capitalized.

- id: TASK-057
  title: Unify page content width across non-unique pages
  priority: medium
  status: done
  related_files:
    - src/components/ui/page-container.tsx
    - src/app/(main)/rules/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Page content width varies between pages (codex, library, creators, character sheet).
    Non-unique pages (not home, login, register) should share a consistent max-width.
    Audit PageContainer sizes across the site and standardize.
  acceptance_criteria:
    - All creator, library, codex, character pages use same content width
    - Character sheet may be slightly wider if needed (xl vs content)
    - Auth and landing pages exempt
  notes: |
    DONE 2026-02-06: Audited all PageContainer usage:
    - Most pages already use size="xl" (max-w-[1440px]): library, codex, creators, characters.
    - Changed rules/page.tsx from size="content" (max-w-6xl) to size="xl" for consistency.
    - Correct exceptions: my-account (xs, narrow form), terms/privacy/resources (prose, text-heavy), encounter-tracker (full, max space), character sheet (custom 1600px for wider layout).

- id: TASK-058
  title: Fix health bar half-HP color (yellower orange) and deepen terminal red
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Half-health bar color is too red and hard to distinguish from terminal. Change to a
    yellower/more orange shade. Deepen the terminal red for clearer visual distinction.
  acceptance_criteria:
    - Half-health color is clearly orange/amber (not red-orange)
    - Terminal health is a deeper/darker red
    - Both are visually distinct from each other
  notes: |
    DONE 2026-02-06: Unified HealthBar component colors with ResourceInput bar:
    - Half-health: changed bg-orange-500 → bg-amber-500 (yellower orange).
    - Terminal: changed bg-red-500 → bg-red-700 (deeper red).
    - ResourceInput already used bg-amber-500/bg-red-700. Portrait border already used border-amber-400/border-red-600. Now fully consistent.

- id: TASK-059
  title: Unify selection/add button styles site-wide
  priority: medium
  status: done
  related_files:
    - src/components/shared/selection-toggle.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Selection buttons (+/check) and "Add X" buttons should have a unified style:
    backgroundless "+" icon that turns to a green check when selected, with animation.
    Ancestry step trait selection buttons should be larger and vertically centered.
  acceptance_criteria:
    - Selection toggle uses clean + → ✓ animation without circular border
    - Add buttons consistent across all modals and sections
    - Ancestry step selection buttons centered and larger
  notes: |
    DONE 2026-02-06: Verified — already fully implemented.
    - SelectionToggle component: backgroundless +/check icons, scale animation, no circular border.
    - Used consistently in: ancestry-step (size="lg", self-center), grid-list-row, add-sub-skill-modal, item-card, species-trait-card.
    - Equipment step quantity steppers are correctly different (quantity controls, not selection toggles).
    - No non-unified add/selection buttons found in modals or sections.

- id: TASK-060
  title: Fix vitality box height mismatch in ability editor
  priority: low
  status: done
  related_files:
    - src/components/creator/ability-score-editor.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the character creator, the Vitality ability box sometimes renders taller than other ability boxes.
    All six ability boxes should have identical height.
  acceptance_criteria:
    - All ability boxes in character creator are the same height
    - Verified in creature creator as well
  notes: |
    DONE 2026-02-06: Root cause was the conditional cost hint indicator (only visible for abilities at 3+ with room to increase). Changed to always render the indicator line in edit mode with useHighAbilityCost, using `invisible` class when not applicable. This reserves consistent vertical space across all boxes.

- id: TASK-061
  title: TASK-012 completion — close security audit with sub-task references
  priority: low
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-012 (My Account security audit) has been in-progress since the audit was done. The
    identified gaps (OAuth provider detection, username change, profile picture) are now
    addressed by TASK-041, TASK-046, TASK-047. Mark TASK-012 as done with references.
  acceptance_criteria:
    - TASK-012 status updated to done
    - Notes reference TASK-041, TASK-046, TASK-047 as resolutions
  notes: "DONE 2026-02-06: TASK-012 was already marked done with resolution references in prior session."

- id: TASK-062
  title: Match character library section heights to archetype section
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The character library, skills section, and archetype section should all have matching min-heights
    so they appear uniform when adjacent, even when empty.
  acceptance_criteria:
    - Library section min-height matches archetype section
    - Skills section min-height matches archetype section
    - Consistent appearance when sections have minimal content
  notes: "DONE 2026-02-05: Added min-h-[400px] to all three column wrappers (Skills, Archetype, Library) in characters/[id]/page.tsx so sections have uniform minimum height when adjacent."

- id: TASK-063
  title: Creature creator basic info dropdown alignment and sizing
  priority: low
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the creature creator basic information section, the Level dropdown is too wide and the
    Level/Type/Size dropdowns are not vertically aligned with the Name input box.
  acceptance_criteria:
    - Level dropdown has a reasonable max-width
    - Level/Type/Size dropdowns are horizontally aligned with the Name input
    - Consistent spacing and visual alignment
  notes: "DONE 2026-02-05: Replaced space-y-4 layout with single-row grid (Name | Level | Type | Size). Level w-20, Type w-36, Size w-28. All aligned horizontally with items-end for baseline alignment."

- id: TASK-064
  title: Game rules audit — fix terminology and CreatureStatBlock ability schema
  priority: high
  status: done
  related_files:
    - src/docs/GAME_RULES_AUDIT.md
    - src/components/shared/creature-stat-block.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/encounter-tracker/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Audit of codebase vs Core Rulebook (GAME_RULES.md) found mismatches. Fix high-priority items:
    1. CreatureStatBlock uses D&D ability names (intellect, perception, willpower) — Realms uses acuity, intelligence, charisma. Acuity and Intelligence do not display for creator creatures.
    2. Replace "ability score" with "Ability" in user-facing copy (item-creator, etc.).
    3. Consider "Reflexes" for defense label (rulebook uses Reflexes, not Reflex).
  acceptance_criteria:
    - CreatureStatBlock displays all 6 Realms abilities (STR, VIT, AGI, ACU, INT, CHA) for creator creatures
    - Item creator: "Require a minimum Ability to use..." (not "ability score")
    - Creature creator: Defense "Reflex" → "Reflexes" (or document as acceptable abbreviation)
    - npm run build passes
  notes: |
    DONE 2026-02-06:
    - CreatureStatBlock: Updated to Realms ability order (STR, VIT, AGI, ACU, INT, CHA); added legacy map for intellect/perception/willpower; grid-cols-6.
    - Item creator: "ability score" → "Ability".
    - Creature creator: Defense label "Reflex" → "Reflexes".
    - Encounter-tracker: Faint condition "Reflex" → "Reflexes".
    - npm run build passes.

- id: TASK-065
  title: Enable hold-to-repeat for Health/Energy allocation in creature creator
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/health-energy-allocator.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Health/Energy allocation should have faster/continuous allotment on button hold.
    Creature creator's HealthEnergyAllocator does not pass enableHoldRepeat; it defaults to false.
    Verify character creator and character sheet also have hold-to-repeat enabled for HP/EN.
  acceptance_criteria:
    - Creature creator HealthEnergyAllocator passes enableHoldRepeat={true}
    - Character creator and character sheet already have hold-to-repeat (verify)
    - Hold-to-repeat works for both HP and EN steppers in creature creator
  notes: "DONE 2026-02-05: Added enableHoldRepeat to creature creator HealthEnergyAllocator."

- id: TASK-066
  title: Remove hold-to-repeat from defense steppers in creature creator
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Defense/ability allocation should NOT have hold-to-increase function, as they have little variance.
    Creature creator's DefenseBlock currently uses enableHoldRepeat on DecrementButton/IncrementButton.
  acceptance_criteria:
    - DefenseBlock DecrementButton and IncrementButton have enableHoldRepeat removed
    - Ability allocation (AbilityScoreEditor) already has no hold-repeat (verify)
  notes: "DONE 2026-02-05: Removed enableHoldRepeat from creature creator DefenseBlock."

- id: TASK-067
  title: Fix inconsistent vertical margins on senses/movement item cards (ExpandableChipList)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Senses and movement item cards have inconsistent vertical margins above/below the description box.
    Should have equal padding. Likely true globally for like item cards (GridListRow with compact + description).
  acceptance_criteria:
    - Senses and movement ExpandableChipList rows have equal padding above/below description
    - Audit GridListRow compact+description layout for consistent margins
    - Apply fix globally if pattern is shared
  notes: "DONE 2026-02-05: GridListRow expanded content now uses py-3/py-4 (equal), description mb-3."

- id: TASK-068
  title: Unify creature creator add modals with character sheet/codex list styles
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/item-selection-modal.tsx
    - src/components/shared/item-list.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Add feat/power/technique/armament modals in creature creator use old modal styles (ItemSelectionModal with ItemList).
    Should match character sheet modals (add-feat, add-skill) which use GridListRow and codex/library list view styles.
    All add X modals with list views should be uniform. Audit: replace with unified components or rewrite creature
    creator modals to use GridListRow/UnifiedSelectionModal patterns aligned with unification goals.
  acceptance_criteria:
    - Creature creator add modals (powers, techniques, feats, armaments) use GridListRow or equivalent unified list pattern
    - Modal styling matches add-feat-modal, add-skill-modal (rounded headers, sortable columns, codex-style list)
    - Consider UnifiedSelectionModal or shared modal wrapper for consistency
  notes: "DONE 2026-02-05: Replaced ItemSelectionModal with UnifiedSelectionModal; DisplayItem->SelectableItem conversion; GridListRow list with columns."

- id: TASK-069
  title: Power/Martial slider should not allow 0 at either end (min 1 each)
  priority: high
  status: done
  related_files:
    - src/components/shared/powered-martial-slider.tsx
    - src/components/creator/archetype-selector.tsx
    - src/components/character-sheet/archetype-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Powered-martial has a division of power/martial proficiencies between both. The furthest end of the slider
    should be 1 for that end, not 0. Both power and martial must have at least 1 point when powered-martial.
  acceptance_criteria:
    - PoweredMartialSlider min power = 1, max power = maxPoints - 1 (so martial is always >= 1)
    - Slider range constrained so neither side can go to 0
    - Works in creature creator and character sheet archetype section
  notes: "DONE 2026-02-05: Slider min=1, max=maxPoints-1 when maxPoints>1; clamps on init and change."

- id: TASK-070
  title: Restructure Creature Summary to match other creators with resource boxes
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/creator-summary-panel.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Creature Summary should match other creators: (1) At top, boxes with spendable resources (ability points,
    skill points, feat points, training points, currency) - can be smaller since more boxes. (2) Below: summary
    points (Abilities, Archetype, level, type, size). (3) Below: line items as sentences, e.g. "Skills: Stealth +3,
    Athletics -1, ..." and similar for resistances, immunities, weaknesses. Reference D&D creature stat block format.
  acceptance_criteria:
    - Resource boxes at top (ability, skill, feat, training, currency) matching power/technique creator costStats style
    - Summary points: Abilities, Archetype, level, type, size
    - Line items: Skills as "Skills: Stealth +3, Athletics -1, ...", resistances/immunities/weaknesses similarly
    - CreatorSummaryPanel may need new props or creature creator uses custom layout
  notes: "DONE 2026-02-05: Added resourceBoxes and lineItems to CreatorSummaryPanel; creature summary now has resource boxes at top, stat rows, line items (Skills: X +3, Resistances: Y, etc.)."

- id: TASK-071
  title: Unify stepper button styles across the site
  priority: medium
  status: done
  related_files:
    - src/components/shared/value-stepper.tsx
    - src/app/globals.css
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/abilities-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Stepper buttons across the site have inconsistent styles, sizes, colors. Defenses allocation steppers are
    smaller (size="xs"), decrement is grey vs red. Use less stark colors and unify styles across the site.
  acceptance_criteria:
    - All steppers use consistent size (or size prop used consistently by context)
    - Decrement/increment colors less stark - unify btn-stepper-danger and btn-stepper-success
    - DefenseBlock, abilities-section, health-energy-allocator, etc. use same visual language
  notes: "DONE 2026-02-05: Defense steppers xs->sm; btn-stepper colors softened (red-50/green-50, 600 text)."

- id: TASK-072
  title: Health/Energy edit mode — bump current when at max and increasing max
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When editing health/energy allocation and increasing the max (via healthPoints or energyPoints),
    if the current value is already at the max, increase the current by the same amount as the max.
    Rationale: a character who was fully healthy/energized when increasing the pool should stay at full.
  acceptance_criteria:
    - Increasing healthPoints when current HP === max HP bumps current HP by the same delta
    - Increasing energyPoints when current EN === max EN bumps current EN by the same delta
    - Decreasing points does not auto-adjust current (only when increasing)
  notes: "DONE 2026-02-05: handleHealthPointsChange/handleEnergyPointsChange now bump current by delta when current>=max and delta>0."

- id: TASK-073
  title: Speed/Evasion base editing — pencil icon, hide by default, red/green validation
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Don't show speed/evasion base editing options by default. Add a pencil icon by each (like other sections).
    Require clicking the pencil to show the edit option. When editing: red if base is over the proper value
    (increasing base), green if under (decreasing base).
  acceptance_criteria:
    - Speed and Evasion show pencil icon; base editing hidden until pencil clicked
    - Red indicator when base > default (over proper value)
    - Green indicator when base < default (under proper value)
    - Matches pencil-edit pattern used elsewhere (name, XP, skills)
  notes: "Owner feedback 2026-02-05"

- id: TASK-074
  title: Dark mode — soften contrasting colors for easier viewing
  priority: medium
  status: done
  related_files:
    - src/app/globals.css
    - src/components/ui/chip.tsx
    - src/components/shared/value-stepper.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Many colors are too contrasting in dark mode. Replace with easier viewing colors: chip colors,
    stepper colors, character sheet health/energy backgrounds, power proficiency background,
    item list headers, hover-highlight colors (which also white out the hovered white font content).
  acceptance_criteria:
    - Chip, stepper, health/energy, power proficiency, item list header colors softened for dark mode
    - Hover highlights no longer white out white font on hovered items
    - Audit and fix other high-contrast elements
  notes: "DONE 2026-02-05: Added dark mode CSS vars (success/danger/health/energy/power/martial-light); chip, stepper, ListHeader, GridListRow, ValueStepper, ResourceInput dark variants."

- id: TASK-075
  title: Fix /api/session 500 Internal Server Error
  priority: high
  status: done
  related_files:
    - src/app/api/session/route.ts
    - src/lib/supabase/session.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    /api/session returns 500 when creating session from Firebase ID token. This blocks portrait
    upload and profile picture upload flows. Likely causes: Firebase Admin SDK not configured
    in production, or createSessionCookie failing.
  acceptance_criteria:
    - POST /api/session with valid idToken returns 200
    - Session cookie is set correctly
    - Portrait and profile picture upload flows work after login
  notes: "DONE 2026-02-05: Added GOOGLE_APPLICATION_CREDENTIALS_JSON support (full JSON key) in server.ts; updated SECRETS_SETUP.md. If 500 persists, ensure SERVICE_ACCOUNT_EMAIL+PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON is in firebase.json secrets and Secret Manager."

- id: TASK-076
  title: Fix Firebase Storage rules for portraits and profile-pictures
  priority: high
  status: done
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md (Supabase Storage RLS)
  created_at: 2026-02-05
  created_by: owner
  description: |
    Storage rules only allow user_uploads/{userId}/**. Uploads go to portraits/{userId}/** and
    profile-pictures/{userId}.jpg. Add rules so authenticated users can read/write their own
    portraits and profile pictures.
  acceptance_criteria:
    - portraits/{userId}/{allPaths=**} allow read, write if request.auth.uid == userId
    - profile-pictures/{userId}.{ext} allow read, write if request.auth.uid == userId
    - Portrait and profile picture uploads succeed
  notes: "DONE 2026-02-05: Added portraits/{userId}/** and profile-pictures/{fileName} rules."

- id: TASK-077
  title: Fix username regex — invalid character class in pattern attribute
  priority: high
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/actions.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Pattern attribute value [a-zA-Z0-9_-]+ causes "Invalid character in character class" in some
    browsers (e.g. with unicodeSets /v flag). Fix by using hyphen at start of class: [-a-zA-Z0-9_]+
    or escape it. Also fix any server-side validation using the same regex.
  acceptance_criteria:
    - Username input pattern validates correctly in all supported browsers
    - No "Invalid regular expression" or "Invalid character in character class" errors
    - POST my-account for username change succeeds (no 500)
  notes: "DONE 2026-02-05: Changed pattern to [-a-zA-Z0-9_]+ (hyphen at start avoids character class issue)."

# ────────────────────────────────────────────────────────────────
# RECONCILIATION TASKS — Created 2026-02-06 from full codebase audit
# Cross-referenced all raw feedback, completed tasks, and actual code.
# ────────────────────────────────────────────────────────────────

- id: TASK-078
  title: "Dice roller — replace Lucide icons with custom dice PNGs"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/dice-roller.tsx
    - public/images/
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-032 (dice roller overhaul) was marked done, but the dice roller component itself
    still uses Lucide Dice1-Dice6 icons (DieIcon function at line 40). The roll-log correctly
    uses custom PNGs (/images/D4.png, D6.png, etc.), but the dice-roller.tsx does not.
    Replace DieIcon with custom dice images matching the vanilla site. Show clickable dice
    images with labels below (e.g. "1d10" below the d10 image).
  acceptance_criteria:
    - dice-roller.tsx uses custom images from /images/ instead of Lucide Dice icons
    - Each die type shows as a clickable image with label below (1d4, 1d6, 1d8, 1d10, 1d12, 1d20)
    - Dice images match those used in roll-log.tsx
    - npm run build passes
  notes: "DONE 2026-02-06: Replaced Lucide Dice icons with custom PNGs; die type selection uses clickable images with labels; last roll shows DieResultDisplay with images."

- id: TASK-079
  title: "Weapon columns — add attack bonus column"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Display computed weapon attack bonus, damage, crit range, armor DR/requirements consistently."
    WEAPON_COLUMNS currently shows Name, Damage, Range. Attack bonus is calculated
    (getWeaponAttackBonus) but only used for the roll button, never shown in columns.
    Add an Attack Bonus column (e.g. "+5 (Str)") to WEAPON_COLUMNS so users can see the
    bonus at a glance without expanding the row or hovering the roll button.
  acceptance_criteria:
    - WEAPON_COLUMNS includes an attack bonus column
    - Column displays calculated bonus with ability abbreviation (e.g. "+5 (Str)")
    - Column aligned center, consistent with other column widths
    - WEAPON_GRID updated to accommodate new column
    - npm run build passes
  notes: "DONE 2026-02-06: Added Attack column with +N (Abbr) format; WEAPON_GRID updated."

- id: TASK-080
  title: "Unified Selection Modal — remove 'Add' column header text"
  priority: medium
  status: done
  related_files:
    - src/components/shared/unified-selection-modal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove 'Add' column header; ListHeader with hasSelectionColumn provides empty slot."
    unified-selection-modal.tsx line 302 still renders `<span className="text-center">Add</span>`.
    Replace with empty slot (just the column space, no text) to match feedback requirements
    and add-feat-modal pattern.
  acceptance_criteria:
    - "Add" text removed from selection column header in unified-selection-modal
    - Empty column slot still present for alignment
    - npm run build passes
  notes: "DONE 2026-02-06: Replaced 'Add' with empty slot (nbsp for alignment)."

- id: TASK-081
  title: "Add Skill / Add Sub-Skill modals — adopt ListHeader + sort"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/components/shared/list-header.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-002 audit concluded "all list pages and selection modals already use unified patterns"
    but these two modals still use custom header divs:
    1. add-skill-modal: custom header, no sort
    2. add-sub-skill-modal: custom header, shows "X sub-skills available" count, no sort
    
    Replace custom headers with ListHeader component. Add sort functionality (at least by name).
    Remove item count from add-sub-skill-modal per "Remove # items counts" feedback.
  acceptance_criteria:
    - add-skill-modal uses ListHeader with sortable columns
    - add-sub-skill-modal uses ListHeader with sortable columns
    - Item count "X sub-skills available" removed from add-sub-skill-modal
    - Sort state managed with toggleSort pattern matching other modals
    - npm run build passes
  notes: "DONE 2026-02-06: Both modals use ListHeader with sort; item count removed from add-sub-skill."

- id: TASK-082
  title: "LoadFromLibraryModal — remove item count from footer"
  priority: low
  status: done
  related_files:
    - src/components/creator/LoadFromLibraryModal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove # items counts." LoadFromLibraryModal (used by power/technique/item creators)
    displays "X items in your library" in its footer. Remove this count.
  acceptance_criteria:
    - Item count text removed from LoadFromLibraryModal footer
    - Footer still shows relevant controls (if any) without the count
    - npm run build passes
  notes: "DONE 2026-02-06: Footer removed (no item count)."

- id: TASK-083
  title: "Remove remaining button gradients site-wide"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/resources/page.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/ui/button.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Buttons: Use solid colors with clear white font — no gradients."
    Remaining gradient usage in buttons:
    1. resources/page.tsx line 35: download link styled as gradient button (from-amber-500 to-orange-600)
    2. notes-tab.tsx line 264: fall damage button with gradient (from-neutral-50 to-indigo-50)
    3. button.tsx line 41: deprecated 'gradient' variant still defined
    4. globals.css lines 532-563: legacy .btn-primary, .btn-danger, .btn-success gradient classes (unused in src/)
    
    Replace buttons with solid styling. Remove deprecated gradient variant. Remove or mark legacy CSS classes.
  acceptance_criteria:
    - resources/page.tsx download button uses solid color (no gradient)
    - notes-tab.tsx fall damage button uses solid color (no gradient)
    - Deprecated gradient variant removed from button.tsx
    - Legacy gradient CSS classes removed or clearly marked deprecated
    - npm run build passes
  notes: "DONE 2026-02-06: resources/notes-tab use solid; gradient variant removed; globals.css deprecated."

- id: TASK-084
  title: "Dark mode — comprehensive pass on remaining hardcoded light colors"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/codex/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-074 addressed CSS variables and core shared components but left many components with
    hardcoded light-mode colors. This is a comprehensive pass to add dark: variants everywhere.
    
    Priority components (user-facing, frequently used):
    - recovery-modal: bg-white → bg-surface, bg-blue-50/bg-amber-50/bg-violet-50 → with dark: variants
    - archetype-section: bg-red-50, bg-violet-50 → with dark: variants
    - skill-row: hover:bg-blue-50, bg-blue-50 species highlight → with dark: variants
    - grid-list-row: bg-green-50 (equipped), bg-violet-50 (innate) → with dark: variants
    - tab-summary-section: gradient backgrounds → with dark: variants
    - notes-tab, library-section: bg-white inputs → dark:bg-surface
    - innate-toggle: hover:bg-violet-50 → with dark: variant
    
    Secondary components:
    - ancestry-step, feats-step, equipment-step: colored backgrounds
    - ability-score-editor: bg-amber-50/50
    - codex/page.tsx: bg-info-50, bg-success-50, bg-danger-50 species cards
    
    Also fix hover states that "white out" text in dark mode.
  acceptance_criteria:
    - All bg-white instances in interactive components have dark:bg-surface
    - All bg-*-50 backgrounds have appropriate dark: variants (dark:bg-*-900/20 or similar)
    - Hover states don't cause invisible text in dark mode
    - Visual spot-check in dark mode shows no jarring bright elements
    - npm run build passes
  notes: "DONE 2026-02-06: Added dark: variants to recovery-modal, skill-row, grid-list-row, archetype-section, tab-summary-section, notes-tab, library-section, innate-toggle, ability-score-editor, ancestry/feats/equipment steps, codex."

- id: TASK-085
  title: "Creator summaries — add sticky positioning to power/technique/item creators"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Consistent layout: fixed compact summary + scrolling inputs/values."
    Creature creator correctly has `sticky top-24` on its summary sidebar. Power, technique,
    and item creators do NOT — their summaries scroll away. Add `self-start sticky top-24`
    and `max-h-[calc(100vh-7rem)] overflow-y-auto` to summary sidebar wrappers to match
    creature creator behavior.
  acceptance_criteria:
    - Power creator summary sidebar is sticky
    - Technique creator summary sidebar is sticky
    - Item creator summary sidebar is sticky
    - Summary scrolls independently if content overflows
    - Matches creature creator's sticky behavior
    - npm run build passes
  notes: "DONE 2026-02-06: Added sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto to power/technique/item creators."

- id: TASK-086
  title: "Full recovery — filter feat resets by recovery type"
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    handleFullRecovery (line 560) resets ALL feat currentUses to maxUses without checking
    the feat's recovery type. Per game rules and TASK-017 spec: "Full Recovery restores all
    feat/trait uses with recovery type 'Full' or 'Partial' to their max values." Feats with
    NO recovery period (one-time-use feats) should NOT be reset by recovery.
    
    The trait handling correctly checks `uses_per_rec` before resetting, but feat handling does not.
    Add a filter: only reset currentUses when feat.recovery includes 'Full' or 'Partial'
    (or when feat has a recovery period at all).
  acceptance_criteria:
    - handleFullRecovery only resets feat uses where feat.recovery is "Full" or "Partial"
    - Feats with no recovery period are NOT reset
    - handlePartialRecovery remains correct (already filters for "Partial")
    - Trait handling remains correct (already filters by uses_per_rec + rec_period)
    - npm run build passes
  notes: "DONE 2026-02-06: handleFullRecovery only resets feats with recovery Full or Partial; one-time-use feats preserved."

- id: TASK-087
  title: "Remove dead code — unused imports and deprecated definitions"
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/ui/button.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Find and remove true dead code." Audit found:
    1. library-section.tsx: imports ChevronDown, ChevronUp from lucide-react — never used
    2. proficiencies-tab.tsx: imports ChevronUp, ChevronDown from lucide-react — never used
    3. button.tsx: deprecated 'gradient' variant (overlaps with TASK-083)
    4. globals.css: unused legacy .btn-primary, .btn-danger, .btn-success classes (overlaps with TASK-083)
    
    Remove unused imports. The globals.css/button.tsx items are handled by TASK-083.
  acceptance_criteria:
    - Unused ChevronDown/ChevronUp imports removed from library-section.tsx
    - Unused ChevronUp/ChevronDown imports removed from proficiencies-tab.tsx
    - No unused lucide-react imports remain in character-sheet components
    - npm run build passes
  notes: "DONE 2026-02-06: Removed unused ChevronDown/ChevronUp from library-section, proficiencies-tab."

- id: TASK-088
  title: "Fix chevron layout shift — use single icon with rotation"
  priority: low
  status: done
  related_files:
    - src/components/shared/filters/filter-section.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/list-components.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove extraneous expand/collapse chevrons when they cause layout issues."
    Was marked as done in ALL_FEEDBACK_CLEAN.md but some components still conditionally
    render ChevronUp vs ChevronDown instead of rotating a single chevron:
    1. filter-section.tsx: lines 96-106 — conditional ChevronUp/ChevronDown
    2. creature-stat-block.tsx: line 275 — conditional ChevronUp/ChevronDown
    3. list-components.tsx: line 66 — conditional chevrons (lower priority)
    
    Correct pattern already used by expandable-chip.tsx, part-chip.tsx, codex/page.tsx:
    single ChevronDown with `rotate-180 transition-transform` when expanded.
  acceptance_criteria:
    - filter-section.tsx uses single ChevronDown with rotation transform
    - creature-stat-block.tsx uses single ChevronDown with rotation transform
    - list-components.tsx uses single chevron with rotation (or document if intentional)
    - No layout shift on expand/collapse
    - npm run build passes
  notes: "DONE 2026-02-06: filter-section, creature-stat-block, list-components use single ChevronDown with rotate-180."

- id: TASK-089
  title: "Power/Technique/Item creator modals — unify LoadFromLibraryModal with shared patterns"
  priority: medium
  status: done
  related_files:
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-068 unified creature creator modals to UnifiedSelectionModal with GridListRow.
    However, power/technique/item creators still use LoadFromLibraryModal which doesn't
    follow the unified list patterns (no ListHeader, no GridListRow, no sortable columns).
    
    Either replace LoadFromLibraryModal internals to use GridListRow/ListHeader patterns,
    or migrate these creators to use UnifiedSelectionModal. Remove item count from footer
    (overlaps TASK-082). Ensure consistent styling with creature creator modals.
  acceptance_criteria:
    - LoadFromLibraryModal uses GridListRow or equivalent unified list pattern
    - Sortable column headers via ListHeader
    - No item count in footer
    - Visual consistency with creature creator add modals
    - npm run build passes
  notes: "DONE 2026-02-06: LoadFromLibraryModal now uses GridListRow, ListHeader with sort, hasSelectionColumn; selectable rows."

- id: TASK-090
  title: "Codebase health audit — dead code removal, deduplication, shared component unification, best practices"
  priority: high
  status: done
  related_files:
    - src/lib/utils/array.ts
    - src/lib/utils/number.ts
    - src/lib/utils/string.ts
    - src/lib/utils/object.ts
    - src/lib/utils/index.ts
    - src/lib/constants/skills.ts
    - src/lib/item-transformers.ts
    - src/components/shared/list-components.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/index.ts
    - src/components/shared/item-card.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/roll-button.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/item-list.tsx
    - src/components/shared/part-chip.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/roll-log.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/character-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/library/page.tsx
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/types/items.ts
  created_at: 2026-02-06
  created_by: agent
  description: |
    Comprehensive codebase health audit addressing dead code, duplicate definitions,
    missing shared component usage, design token violations, and React/Tailwind best practices.
    
    Changes:
    1. Consolidated 6 duplicate formatBonus functions → single canonical export in lib/utils/number.ts
    2. Removed ~60 unused utility exports from array.ts, number.ts, string.ts, object.ts
    3. Consolidated 3 duplicate SortState types → canonical export from list-header.tsx (renamed items.ts to ItemSortState)
    4. Removed deprecated list-components exports (SimpleEmptyState, LoadingSpinner, ResultsCount, ListContainer)
    5. Deleted entirely unused lib/constants/colors.ts
    6. Replaced 8 custom spinner implementations with shared Spinner component
    7. Replaced 6 inline textareas with shared Textarea component
    8. Fixed 6 hardcoded neutral-* colors in roll-log.tsx → design tokens
    9. Converted 6 template-literal classNames to cn() utility
    10. Fixed index-as-key issues in proficiencies-tab, grid-list-row, part-chip
  acceptance_criteria:
    - No duplicate formatBonus definitions
    - Dead utility exports removed
    - Single canonical SortState type
    - No deprecated component exports remaining
    - All spinners use shared Spinner component
    - All textareas use shared Textarea component
    - No hardcoded neutral-* colors outside auth
    - Template literals replaced with cn()
    - Stable keys for mapped elements
    - npm run build passes
  notes: "DONE 2026-02-06: Comprehensive audit complete. 30+ files updated across 10 categories."

# ============================================================================
# Phase 3: Codebase Simplification & Consolidation (from audit follow-up)
# ============================================================================

- id: TASK-091
  title: "Extract shared useSort hook — eliminate 20+ duplicate toggleSort/handleSort implementations"
  priority: high
  status: done
  related_files:
    - src/components/shared/list-header.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/library/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The single biggest duplication in the codebase. The exact same sorting logic is
    copy-pasted across 15+ files in two forms:
    
    **Form A — standalone function (5 instances):**
    ```ts
    const toggleSort = useCallback((current: SortState, col: string): SortState => {
      if (current.col === col) return { col, dir: current.dir === 1 ? -1 : 1 };
      return { col, dir: 1 };
    }, []);
    ```
    Files: library-section, feats-tab, add-skill-modal, add-sub-skill-modal, LoadFromLibraryModal
    
    **Form B — inline setSortState (15+ instances):**
    ```ts
    const handleSort = useCallback((col: string) => {
      setSortState(prev => ({
        col,
        dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
      }));
    }, []);
    ```
    Files: codex (6 tabs), library (4 tabs), add-feat-modal, unified-selection-modal, add-library-item-modal
    
    Additionally, `sortByCol` (generic array sort by SortState column) appears in library-section
    and similar inline sort logic in 10+ other files.
    
    **Solution:** Create a `useSort` hook in `src/hooks/use-sort.ts` that returns:
    - `sortState` — the current `SortState`
    - `handleSort(col)` — the toggle handler (pass directly to ListHeader onSort)
    - `sortItems(items)` — generic sort function using localeCompare
    
    Also export a standalone `toggleSort(current, col)` pure function and a 
    `sortByColumn(items, sortState)` utility for non-hook contexts.
    
    Then replace all 20+ instances with the shared hook/utility.
  acceptance_criteria:
    - `useSort` hook exists in src/hooks/use-sort.ts
    - Standalone `toggleSort` and `sortByColumn` utilities exported
    - All 5 standalone toggleSort functions replaced
    - All 15+ inline handleSort patterns replaced
    - All inline sortByCol logic replaced
    - npm run build passes
    - Sorting behavior unchanged across all pages
  notes: "DONE 2026-02-06: Created useSort hook, toggleSort, sortByColumn in src/hooks/use-sort.ts. Replaced 20+ instances across LoadFromLibraryModal, add-skill-modal, add-sub-skill-modal, add-feat-modal, add-library-item-modal, unified-selection-modal, library-section, feats-tab, library/page (4 tabs), codex/page (6 tabs)."

- id: TASK-092
  title: "Import SortState type from shared instead of inline definitions"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/codex/page.tsx
    - src/components/character-sheet/add-feat-modal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    11 instances across 3 files use `useState<{ col: string; dir: 1 | -1 }>` inline
    instead of importing the canonical `SortState` type from `@/components/shared`.
    
    Files and instance counts:
    - library/page.tsx: 4 instances (PowersTab, TechniquesTab, ArmamentsTab, CreaturesTab)
    - codex/page.tsx: 6 instances (FeatsTab, SkillsTab, SpeciesTab, EquipmentTab, PropertiesTab, PartsTab)
    - add-feat-modal.tsx: 1 instance
    
    Replace all with: `useState<SortState>({ col: 'name', dir: 1 })`
    Add: `import type { SortState } from '@/components/shared'`
    
    NOTE: If TASK-091 (useSort hook) is done first, this task is already covered.
  acceptance_criteria:
    - No inline `{ col: string; dir: 1 | -1 }` type annotations remain
    - All use imported SortState type
    - npm run build passes
  notes: "Done 2026-02-08: useSort hook (TASK-091) returns SortState; Codex/library use useSort. No inline SortState definitions remain in targeted files."

- id: TASK-093
  title: "Remaining template literal → cn() conversions"
  priority: medium
  status: done
  related_files:
    - src/components/shared/item-list.tsx
    - src/components/shared/filters/tag-filter.tsx
    - src/components/shared/filters/select-filter.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
    - src/components/shared/filters/checkbox-filter.tsx
    - src/components/shared/filters/chip-select.tsx
    - src/app/(main)/codex/page.tsx
    - src/components/shared/item-card.tsx
    - src/app/(main)/about/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    9 remaining instances of template literal className patterns that should use cn():
    
    1. item-list.tsx:231 — `className={\`space-y-4 ${className}\`}`
    2. tag-filter.tsx:46 — `className={\`filter-group ${className}\`}`
    3. select-filter.tsx:28 — `className={\`filter-group ${className}\`}`
    4. ability-requirement-filter.tsx:58 — `className={\`filter-group ${className}\`}`
    5. checkbox-filter.tsx:32 — `className={\`filter-group ${className}\`}`
    6. chip-select.tsx:42 — `className={\`filter-group ${className}\`}`
    7. codex/page.tsx:1454 — inline chip styling template literal
    8. item-card.tsx:258 — conditional ternary without cn()
    9. about/page.tsx:218 — transition class ternary without cn()
    
    For all: import cn from '@/lib/utils' and replace template literals.
    Items 2-6 are all the same pattern in filter components — batch fix.
  acceptance_criteria:
    - No template literal className patterns remain in components or app directories
    - All use cn() from @/lib/utils
    - npm run build passes

- id: TASK-094
  title: "Replace inline button styling with Button component"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/dice-roller.tsx
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    5 raw `<button>` elements with full inline styling that should use the shared
    `<Button>` component for visual consistency and reduced code:
    
    1. notes-tab.tsx:264 — Fall damage roll button
       `px-2 py-0.5 text-sm font-bold bg-primary-600 text-white rounded hover:bg-primary-700`
       → `<Button variant="primary" size="sm">`
    
    2. dice-roller.tsx:189 — Roll button
       `w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700`
       → `<Button variant="primary" size="lg" className="w-full rounded-xl">`
    
    3. encounter-tracker/page.tsx:1291 — Add condition button
       `px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700`
       → `<Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700">`
    
    4. item-creator/page.tsx:1399 — Add property button
       `px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700`
       → `<Button variant="primary" className="bg-amber-600 hover:bg-amber-700">`
    
    5. power-creator/page.tsx:1543 — Add part button
       `px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700`
       → `<Button variant="primary">`
  acceptance_criteria:
    - All 5 inline button patterns replaced with Button component
    - Visual appearance unchanged
    - npm run build passes

- id: TASK-095
  title: "Replace remaining raw inputs with Input/SearchInput components"
  priority: low
  status: done
  related_files:
    - src/components/shared/item-list.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    2 raw `<input>` elements with inline styling that should use shared components:
    
    1. item-list.tsx:241 — search input with icon overlay
       Full inline styling + Search icon positioned absolutely.
       → Replace with `<SearchInput>` from @/components/ui
    
    2. ability-requirement-filter.tsx:75 — number input for max value
       `w-20 px-3 py-2 border border-border-light rounded-md text-sm ...`
       → Replace with `<Input type="number" className="w-20" />`
  acceptance_criteria:
    - Both raw inputs replaced with shared components
    - npm run build passes

- id: TASK-096
  title: "Split large page components (>1000 lines) into focused sub-components"
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/creature-creator-types.ts
    - src/app/(main)/creature-creator/creature-creator-constants.ts
    - src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx
    - src/app/(main)/creature-creator/LoadCreatureModal.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/library/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    6 files exceed 1000 lines and should be decomposed for maintainability:
    
    1. power-creator/page.tsx (~1673 lines)
       → Extract: PowerFormFields, PowerPartsEditor, PowerSummaryPanel
    
    2. characters/[id]/page.tsx (~1586 lines)
       → Extract: CharacterSheetContent, CharacterSheetModals, CharacterSheetHandlers (custom hook)
    
    3. creature-creator/page.tsx (~1580 lines)
       → Extract: CreatureFormFields, CreatureSkillsEditor, CreatureSummaryPanel
    
    4. codex/page.tsx (~1451 lines)
       → Extract each tab into its own component: CodexFeatsTab, CodexSkillsTab, 
         CodexSpeciesTab, CodexEquipmentTab, CodexPropertiesTab, CodexPartsTab
    
    5. encounter-tracker/page.tsx (~1327 lines)
       → Extract: CombatantList, CombatantCard, ConditionManager, InitiativeTracker
    
    6. library/page.tsx (large)
       → Extract each tab: LibraryPowersTab, LibraryTechniquesTab, etc.
    
    Start with codex and library since they have the most repeated patterns
    (each tab is structurally identical with its own sort/filter/render).
    
    NOTE: This is a large refactor. Do incrementally — one file at a time.
    TASK-091 (useSort hook) should be done first as it eliminates the biggest
    repeated pattern inside these large files.
  acceptance_criteria:
    - Each extracted component is <400 lines
    - No behavioral changes
    - All pages render identically
    - npm run build passes

- id: TASK-097
  title: "Unify filter component className patterns — extract filter-group class"
  priority: low
  status: done
  related_files:
    - src/components/shared/filters/tag-filter.tsx
    - src/components/shared/filters/select-filter.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
    - src/components/shared/filters/checkbox-filter.tsx
    - src/components/shared/filters/chip-select.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    All 5 filter components use the same pattern:
    `className={\`filter-group ${className}\`}`
    
    The `filter-group` CSS class is defined in globals.css. These should:
    1. Import cn() from @/lib/utils
    2. Use `className={cn('filter-group', className)}` for proper class merging
    3. Verify the filter-group class definition in globals.css is consistent
    
    This is partially covered by TASK-093 but grouped here as a focused batch
    since all 5 are the same pattern in the same directory.
  acceptance_criteria:
    - All 5 filter components use cn() instead of template literals
    - filter-group class definition verified in globals.css
    - npm run build passes

- id: TASK-098
  title: "Fix dark mode contrast and missing variants — audit follow-up"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/dice-roller.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
    - src/components/shared/theme-toggle.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/app/(main)/encounter-tracker/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Dark mode audit identified contrast issues: missing dark: variants, text too dark for dark backgrounds,
    elements too bright, hover/active states with poor contrast. Fix per audit: recovery-modal (allocation
    buttons, labels, preview text), innate-toggle (active state), skill-row (bonus colors), dice-roller,
    CombatantCard (badges, inputs, pills), theme-toggle (selected state), proficiencies-tab, tab-summary-section
    SummaryItem highlightColors, grid-list-row innate badge, add-sub-skill-modal info box, encounter-tracker page.
  acceptance_criteria:
    - All identified components have appropriate dark: variants for colored backgrounds/text
    - No text too dark for dark backgrounds (use text-*-300/400 for dark mode)
    - Hover/active states have dark: variants where needed
    - npm run build passes
  notes: "Done 2026-02-06: Fixed recovery-modal (allocation buttons, labels, preview text), innate-toggle (active state), skill-row (bonus colors), dice-roller, CombatantCard (badges, inputs, pills), theme-toggle, proficiencies-tab, tab-summary-section highlightColors, grid-list-row innate badge, add-sub-skill-modal info box, encounter-tracker page."

- id: TASK-099
  title: Campaigns — return to Join tab after creating character
  priority: low
  status: done
  related_files:
    - src/app/(main)/campaigns/page.tsx
    - src/app/(main)/characters/new/page.tsx
    - src/components/character-creator/steps/finalize-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    When user clicks "Create Character" from Join Campaign empty state, they go to /characters/new.
    After creating, they land on the new character sheet. Add returnTo param so they can be redirected
    back to /campaigns?tab=join to complete the join flow.
  acceptance_criteria:
    - Join tab empty state passes ?returnTo=/campaigns?tab=join when navigating to character creation
    - After character creation, redirect to returnTo if present
    - npm run build passes
  notes: "Done 2026-02-08: Join tab empty state passes returnTo=/campaigns?tab=join when navigating to /characters/new. FinalizeStep reads returnTo from searchParams and redirects there after create."

- id: TASK-100
  title: Campaigns — real-time updates via Firestore onSnapshot
  priority: low
  status: cancelled
  created_at: 2026-02-06
  created_by: agent
  description: |
    Campaign list and detail currently use React Query with manual invalidate. Consider Firestore
    onSnapshot for real-time updates when campaign roster changes (e.g., another player joins).
  acceptance_criteria:
    - Campaign detail page updates in real time when characters are added/removed
    - My Campaigns list updates when campaign data changes
    - Unsubscribe on unmount; no memory leaks
    - npm run build passes
  notes: "CANCELLED 2026-02-07: Firebase/Firestore removed; stack is Supabase/Prisma. Real-time would require Supabase Realtime if needed later."

- id: TASK-101
  title: Archetype prof slider — hide unless pencil clicked; show simple values otherwise
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the Character Sheet Archetype Section, the archetype proficiency slider should only be visible when the user has clicked the pencil to enter archetype proficiency editing mode. In non-edit mode, display Power and/or Martial proficiency as simple text values (e.g., "Power: 2, Martial: 1") instead of the slider. The slider is designed for editing only.
  acceptance_criteria:
    - Slider hidden when showEditControls is false
    - Simple value display (Power/Martial) shown when not editing
    - Slider appears only when pencil clicked (archetype edit mode)
    - npm run build passes
  notes: "Done 2026-02-06. Slider hidden in non-edit mode; simple Power/Martial badges shown instead."

- id: TASK-102
  title: Encounter Tracker — add creatures from library (auto HP/EN, quantity)
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Allow adding creatures from the user's creature library to the encounter tracker. When adding from library, auto-populate max health and energy from the creature data instead of manual input. Support choosing how many of a creature to add. Reuse existing add combatant tab and add creature modal components.
  acceptance_criteria:
    - Add combatant flow supports "From Library" option
    - Creature library modal lists user's creatures; selection populates HP/EN
    - Quantity selector when adding (e.g., add 3 Goblins)
    - Uses shared modal/list components
    - npm run build passes
  notes: "Done 2026-02-06. AddCombatantModal with Library tab; creature HP/EN auto-calculated; quantity selector A-Z suffixes."

- id: TASK-103
  title: Encounters hub — rename to Encounters; list/create/filter/search/sort
  priority: critical
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounters/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Rename "Encounter Tracker" to "Encounters" in nav and routing. Create an Encounters hub page that shows all saved encounters in list view with filter, search, and sort. Provide options to create new encounters of type: combat, skill, or mixed. Clicking an encounter redirects to that encounter's dedicated page.
  acceptance_criteria:
    - Nav/routes use "Encounters" terminology
    - Encounters hub page: list view, filter, search, sort
    - Create new: combat, skill, or mixed
    - Click encounter → navigate to /encounters/[id] (combat/skill/mixed)
    - npm run build passes
  notes: "Done 2026-02-06. Encounters hub page with list/filter/sort/create, nav updated, TabNavigation + type filters."

- id: TASK-104
  title: Persist encounters to Firestore; save/return to sessions
  priority: critical
  status: done
  related_files:
    - src/services/encounter-service.ts
    - src/hooks/use-encounters.ts
    - prisma/schema.prisma (Encounter model)
  created_at: 2026-02-06
  created_by: agent
  description: |
    Replace local storage with Firestore persistence for encounters. Encounters stored by ID. Users can save an encounter and return to it later; turns, AP, HP, etc. are tracked across sessions. Use best security practices (user-owned documents).
  acceptance_criteria:
    - Encounters stored in Firestore (users/{uid}/encounters/{encounterId})
    - Save/load by encounter ID
    - State (combatants, HP, EN, turns, AP) persists across sessions
    - Firestore rules: read/write only for owner
    - npm run build passes
  notes: "Done 2026-02-06. encounter-service.ts with Firestore CRUD, use-encounters.ts hooks, Firestore rules, auto-save via useAutoSave."

- id: TASK-105
  title: Designate combat tracker; tie to encounter ID
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Designate the current encounter tracker page as the Combat Tracker specifically. Route to /encounters/[id]/combat (or equivalent). Load encounter by ID from Firestore instead of local storage. Combat tracker is tied to saved encounter documents.
  acceptance_criteria:
    - Combat tracker loads encounter by ID
    - Replaces local storage with Firestore-backed state
    - Combat-specific UI preserved
    - npm run build passes
  notes: "Done 2026-02-06. Combat tracker at /encounters/[id]/combat, loads by ID from Firestore, auto-save, reuses CombatantCard."

- id: TASK-106
  title: Create Skill Encounter page
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/docs/GAME_RULES.md
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create a Skill Encounter page. Add characters; track if each has made their skill roll; track successes vs failures; set required successes and failures; input rolled skill values to compute successes/failures based on Difficulty Score (DS). Reference GAME_RULES.md: Average DS = 10 + ½ Party Level; Required Successes = # Characters + 1. Include useful RM features per core rules.
  acceptance_criteria:
    - Add characters to skill encounter
    - Per-character: rolled? success/fail based on DS
    - Set DS (default 10 + ½ party level)
    - Set required successes and failures
    - Success = roll ≥ DS
    - npm run build passes
  notes: "Done 2026-02-06. Skill encounter at /encounters/[id]/skill, DS config, participant rolls, success/failure tracking, progress bars."

- id: TASK-107
  title: Create Mixed Encounter page (combat + skill combined)
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters/[id]/mixed/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create a Mixed Encounter page that combines combat and skill encounter functionality. Reuse components from both combat tracker and skill encounter page. Unify/simplify where possible.
  acceptance_criteria:
    - Mixed page has combat and skill sections/functionality
    - Reuses CombatantCard, skill tracking components
    - Unified layout; no unnecessary duplication
    - npm run build passes
  notes: "Done 2026-02-06. Mixed encounter at /encounters/[id]/mixed, tab-based combat+skill view, shared participants."

- id: TASK-108
  title: Campaign integration — add characters from campaigns to encounters
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters
    - src/services/campaign-service.ts
  created_at: 2026-02-06
  created_by: agent
  description: |
    Allow adding characters from campaigns the user is in to encounters. Pull evasion, acuity, HP, EN, etc. from character/campaign data for quick reference. Easy add without manual entry. Use campaign character API and enrichment.
  acceptance_criteria:
    - Add combatant/skill participant: "From Campaign" option
    - Select campaign → select character; auto-populate evasion, acuity, HP, EN
    - Works for combat and skill encounters
    - npm run build passes
  notes: "Done 2026-02-06. AddCombatantModal 'From Campaign' tab; fetches character data via API; auto-populates HP/EN/evasion/acuity."

- id: TASK-109
  title: Verify equip toggle ID matching and persistence
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Equip toggle handlers match by item.id || item.name || String(i). If items lack IDs or have inconsistent shapes (enriched vs raw), toggle may not persist. Verify in character sheet; fix ID matching if needed.
  acceptance_criteria:
    - Equip/unequip armor and weapons persists correctly on save
    - Works with items that have id, name, or index-only
    - npm run build passes
  notes: "Done 2026-02-06: Added index-based fallback matching; pass item.id ?? item.name ?? i; handlers now support numeric index when id/name missing."

- id: TASK-110
  title: Verify weapon/armor delete in character sheet
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure delete (X) button for weapons and armor works in character sheet. Feedback indicated pencil icon useless for feat deletion—verify feat delete works; weapons/armor use onDelete (X) not pencil.
  acceptance_criteria:
    - Remove weapon/armor works; item is removed from list and persisted
    - Delete button visible when onRemoveWeapon/onRemoveArmor provided
    - npm run build passes
  notes: "Done 2026-02-06: Feat delete gated on isEditMode (pencil enables it); weapon/armor delete gated on isEditMode for consistency with powers/techniques; equipment delete remains available outside edit mode (like quantity change). Build passes."

- id: TASK-111
  title: Fix inventory remove bug (Library → Equipment)
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Unable to remove items from inventory." Verify onRemoveEquipment flow and GridListRow onDelete for equipment items. Ensure delete button appears and handler correctly filters items.
  acceptance_criteria:
    - Users can remove equipment items from Library → Equipment tab
    - Delete persists on save
    - npm run build passes
  notes: "Done 2026-02-06: Equipment delete uses index-based fallback (TASK-109 fix); no isEditMode gate so delete always visible; onDelete + handleRemoveEquipment flow verified. Build passes."

- id: TASK-112
  title: Audit all list/section headers for full caps
  priority: medium
  status: done
  related_files:
    - src/components/shared/section-header.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/skills-allocation-page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure all list item headers and section headers use full caps (NAME not Name). ListHeader and SectionHeader already use uppercase. Audit for any custom headers that bypass these components.
  acceptance_criteria:
    - All list/section headers display in UPPERCASE
    - No Title Case headers in list or section contexts
    - npm run build passes
  notes: "Done 2026-02-06: Verified ListHeader, SectionHeader, SortHeader use uppercase; ColumnHeaders uses label.toUpperCase(); added uppercase to skills-allocation-page section headers (Species Skills, Defense Bonuses). Build passes."

- id: TASK-113
  title: Full dark mode implementation pass
  priority: high
  status: done
  related_files:
    - src/app/globals.css
    - src/components/ui/modal.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/character-sheet/roll-log.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-074/084 softened some components. User wants full dark mode: all modals, cards, inputs, buttons, chips, hover states. Audit for raw colors (gray-*, blue-*) without dark: variants; fix hover states that bleach text.
  acceptance_criteria:
    - No harsh contrast in dark mode
    - Hover states preserve readable text in dark mode
    - Design tokens used consistently
    - npm run build passes
  notes: "Done 2026-02-06: Added dark: variants to feats-step, finalize-step, equipment-step, skill-row, creature-stat-block, sheet-action-toolbar, roll-log, modal, unified-selection-modal. Auth components use gray intentionally per AGENTS.md. Build passes."

- id: TASK-114
  title: Style consistency audit (ability/defense/health-energy)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/creator/health-energy-allocator.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Unify ability allocation, defense allocation, and health/energy allocator styles across character sheet, character creator, and creature creator. Single source of truth for each pattern.
  acceptance_criteria:
    - Same visual design for ability/defense/health-energy across all three contexts
    - Shared components or identical styling
    - npm run build passes
  notes: "Done 2026-02-06: Verified shared components (DecrementButton, IncrementButton, PointStatus, ValueStepper, HealthEnergyAllocator, AbilityScoreEditor). Added dark mode to HealthEnergyAllocator (HP/EN labels, status colors). Fixed text-secondary to text-text-secondary. Build passes."

- id: TASK-115
  title: Component reuse audit (add-X modals)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure all add-X modals (add feat, power, technique, armament) use shared Modal + ListHeader + GridListRow. No inline custom list UIs. TASK-068 unified creature creator modals—verify consistency.
  acceptance_criteria:
    - All add modals use unified patterns
    - Consistent rounded corners, header spacing, sortable columns
    - npm run build passes
  notes: "Done 2026-02-06: Verified add-feat-modal, add-library-item-modal, add-skill-modal use Modal + ListHeader + GridListRow. Creature creator uses UnifiedSelectionModal (GridListRow + sortable columns). add-sub-skill-modal uses SelectionToggle (justified unique UX). All modals follow unified patterns. Build passes."

# =============================================================================
# Codex Firestore Migration + Admin Editor + Public Library (TASK-116+)
# Created 2026-02-06 from owner request. Phases: Migration → Admin → Public Library.
# USER tasks require manual steps by owner; all others assignable to AI.
# =============================================================================

# --- Phase 1: Firestore Migration ---

- id: TASK-116
  title: Add Firestore rules for codex_* collections
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Firestore security rules for codex collections (codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats). Public read, no client write (writes via Admin SDK in server actions only).
  related_files:
    - prisma/schema.prisma (codex_* tables)
  acceptance_criteria:
    - Codex tables in Prisma; public read via /api/codex
    - Rules deploy without errors
    - Manual verify: unauthenticated client can read codex data
  notes: "Done 2026-02-06: Added rules for all 9 codex_* collections (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats). Public read, no client write."

- id: TASK-117
  title: Create migration script RTDB → Firestore
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create Node script (scripts/migrate_rtdb_to_firestore.js) using Firebase Admin SDK to read RTDB paths (feats, skills, species, traits, parts, properties, items, archetypes, creature_feats) and write to Firestore codex_* collections. Preserve document IDs, normalize arrays. Include dry-run mode.
  related_files:
    - scripts/migrate_rtdb_to_firestore.js
    - package.json
  acceptance_criteria:
    - Script reads all RTDB paths and writes to corresponding Firestore collections
    - Handles comma-separated strings → arrays where needed (per use-rtdb.ts transforms)
    - Dry-run logs what would be written without writing
    - README or script header documents usage and env vars (GOOGLE_APPLICATION_CREDENTIALS)
  notes: "Done 2026-02-06: Created scripts/migrate_rtdb_to_firestore.js with --dry-run. npm run migrate:rtdb-to-firestore. Requires GOOGLE_APPLICATION_CREDENTIALS or SERVICE_ACCOUNT_* env vars."

- id: TASK-118
  title: Create useFirestoreCodex hooks (read from Firestore)
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create hooks that read codex data from Firestore instead of RTDB. Mirror use-rtdb.ts API: useCodexFeats, useCodexSkills, useCodexSpecies, useCodexTraits, useCodexPowerParts, useCodexTechniqueParts, useCodexParts, useCodexProperties, useCodexEquipment, useCodexArchetypes, useCodexCreatureFeats. Use React Query. Return same shapes as current use-rtdb so consumers need minimal changes.
  related_files:
    - src/hooks/use-firestore-codex.ts
    - src/hooks/index.ts
  acceptance_criteria:
    - Hooks return data shapes compatible with existing consumers (feats, skills, species, etc.)
    - React Query caching and staleTime configured
    - npm run build passes
  notes: "Done 2026-02-06: Created use-firestore-codex.ts with all codex hooks. Hooks index exports from use-firestore-codex. use-rtdb retains utilities (findTraitByIdOrName, etc.)."

- id: TASK-119
  title: Switch all codex consumers to Firestore hooks
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update all components and services that use useRTDB*/useFeats/useSkills/etc. to use the new useFirestoreCodex/useCodex* hooks. Include: character sheet, library, codex, creators, equipment-step, feats-step, finalize-step, add-feat-modal, data-enrichment, etc. Remove RTDB codex reads after cutover.
  related_files:
    - src/hooks/use-rtdb.ts
    - src/app/(main)/codex/
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - No imports of useRTDB/useFeats/useSkills/etc. for codex data (or alias to Firestore)
    - All codex pages and creators load data from Firestore
    - npm run build passes
    - Manual verify: Codex, Library, Character Sheet all display correctly
  notes: "Done 2026-02-06: Hooks index exports from use-firestore-codex. game-data-service and firebase/server.ts read from Firestore codex collections. Build passes. App will work after TASK-120 migration."

- id: TASK-120
  title: [USER] Run migration script and verify in Firebase Console
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    OWNER: Run the migration script (node scripts/migrate_rtdb_to_firestore.js) with production credentials. Verify in Firebase Console that all codex_* collections exist and contain data. Confirm app still works after TASK-119 cutover.
  acceptance_criteria:
    - Migration script executed successfully
    - Firestore collections populated
    - App loads codex data from Firestore
  notes: Cannot be done by AI. Requires owner to run script with Firebase project credentials.

# --- Phase 2: Admin Infrastructure ---

- id: TASK-121
  title: Admin config and isAdmin helper
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add admin config: Firestore document config/admins with { uids: string[] } or env NEXT_PUBLIC_ADMIN_UIDS (comma-separated). Create server-side isAdmin(uid) helper and use in server actions. Document in DEPLOYMENT_SECRETS or new ADMIN_SETUP.md.
  related_files:
    - src/lib/admin.ts
    - src/app/api/ or server actions
    - src/docs/
  acceptance_criteria:
    - isAdmin(uid) returns boolean from config or env
    - Server actions can call isAdmin before writing
    - Docs describe how to add admin UIDs
  notes: "Done 2026-02-06: Created src/lib/admin.ts (isAdmin), /api/admin/check, useAdmin hook, ADMIN_SETUP.md. Firestore config/admins or env NEXT_PUBLIC_ADMIN_UIDS."

- id: TASK-122
  title: [USER] Add admin UID to config
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    OWNER: After TASK-121, add your uid to Firestore config/admins (document with field uids: [uid]) or set NEXT_PUBLIC_ADMIN_UIDS env. Ensure you can access admin routes.
  notes: Done 2026-02-06: User added UID to config/admins in Firestore Console and deployed rules.
  acceptance_criteria:
    - Admin UID in config
    - Admin page accessible when logged in as admin
  notes: Cannot be done by AI. Requires Firebase Console or one-time script.

- id: TASK-123
  title: Admin layout and route protection
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create (main)/admin route group with layout. Protect admin routes: redirect non-admin users to home or 403. Add admin nav link (visible only to admins) in main layout. Use design tokens (bg-surface, etc.) consistent with app.
  related_files:
    - src/app/(main)/admin/layout.tsx
    - src/app/(main)/admin/page.tsx
    - src/app/(main)/layout.tsx
  acceptance_criteria:
    - /admin redirects non-admins
    - Admin sees nav link to /admin
    - Layout matches app aesthetic
    - npm run build passes
  notes: "Done 2026-02-06: Admin layout redirects non-admins; Admin link in header (useAdmin); /admin and /admin/codex pages. Build passes."

# --- Phase 3: Admin Codex Editor (Subrule Editing) ---

- id: TASK-124
  title: Admin Codex page shell with tabs
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create admin Codex page at /admin/codex with tabs mirroring public Codex (Feats, Skills, Species, Traits, Parts, Properties, Equipment) plus Archetypes and Creature Feats. Use TabNavigation, PageContainer, PageHeader. Same layout as (main)/codex but with edit/delete/create actions.
  related_files:
    - src/app/(main)/admin/codex/page.tsx
    - src/components/ui/tab-navigation.tsx
  acceptance_criteria:
    - Admin Codex has all tabs
    - Each tab shows list with edit/delete/add
    - Consistent with Codex layout

- id: TASK-125
  title: Admin CRUD server actions for codex
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create server actions for admin codex CRUD: createCodexFeat, updateCodexFeat, deleteCodexFeat; same for skills, species, traits, parts, properties, equipment, archetypes, creature_feats. Each action: validate isAdmin, use Admin SDK to write Firestore. Return success/error.
  related_files:
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/admin.ts
  acceptance_criteria:
    - All CRUD actions verify isAdmin
    - Use Prisma (Supabase/PostgreSQL)
    - Actions handle validation errors

- id: TASK-126
  title: Admin Feats editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Admin Feats tab: list with GridListRow, inline edit or modal for edit. Add feat button. Form fields for name, description, category, ability_req, lvl_req, tags, etc. Use design tokens, SectionHeader, shared Modal. Match CodexFeatsTab layout but editable.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - List, add, edit, delete feats
    - Form validates required fields
    - UI matches app design system

- id: TASK-127
  title: Admin Traits editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Traits tab: list, add, edit, delete. Fields: name, description, species (array). Reuse patterns from Admin Feats.
  related_files:
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
  acceptance_criteria:
    - Full CRUD for traits
    - Consistent UI with Admin Feats

- id: TASK-128
  title: Admin Species editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Species tab: list, add, edit, delete. Fields: name, description, type, sizes, speed, traits, species_traits, ancestry_traits, flaws, skills, languages, ability_bonuses, etc. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
  acceptance_criteria:
    - Full CRUD for species
    - Array fields (sizes, traits) editable

- id: TASK-129
  title: Admin Skills editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Skills tab: list, add, edit, delete. Fields: name, description, ability, base_skill_id, and any additional narrative fields defined in the codex schema. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
  acceptance_criteria:
    - Full CRUD for skills
    - base_skill_id for sub-skills

- id: TASK-130
  title: Admin Parts editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Parts tab: list power and technique parts, add, edit, delete. Fields: name, description, category, type (power/technique), base_en, base_tp, op_1/2/3 costs, etc. Filter by type. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
  acceptance_criteria:
    - Full CRUD for parts
    - Type filter (power vs technique)

- id: TASK-131
  title: Admin Properties editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Properties tab: list, add, edit, delete item properties. Fields: name, description, type, base_ip, base_tp, base_c, op_1_*. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
  acceptance_criteria:
    - Full CRUD for properties
    - Consistent UI

- id: TASK-132
  title: Admin Equipment editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Equipment tab: list, add, edit, delete. Fields: name, type, subtype, description, damage, armor_value, gold_cost, properties, rarity, weight. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
  acceptance_criteria:
    - Full CRUD for equipment
    - Type filter (weapon/armor/equipment)

- id: TASK-133
  title: Admin Archetypes editor tab
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Archetypes tab: list, add, edit, delete. Fields per Archetype type. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  acceptance_criteria:
    - Full CRUD for archetypes
    - Consistent UI

- id: TASK-134
  title: Admin Creature Feats editor tab
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Creature Feats tab: list, add, edit, delete. Fields: name, description, points, tiers, prereqs. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
  acceptance_criteria:
    - Full CRUD for creature feats
    - Consistent UI

- id: TASK-135
  title: Admin Codex UI polish — consistent design
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Polish admin Codex: ensure all tabs use design tokens (bg-surface, text-text-primary, border-border), same Modal/Button/Chip styles as Codex, dark mode support, loading/empty states. Sleek, unified admin experience.
  related_files:
    - src/app/(main)/admin/codex/
  acceptance_criteria:
    - No raw gray-* or blue-* outside design tokens
    - Dark mode works
    - Loading and empty states

# --- Phase 4: Public Library ---

- id: TASK-136
  title: Prisma tables for public library
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Prisma tables: public_powers, public_techniques, public_items, public_creatures. Structure mirrors UserPower/UserTechnique/UserItem/UserCreature but admin-owned (no userId or adminId). Public read via API, write only via server actions (isAdmin). Stack: Supabase/Prisma only (no Firestore/Firebase).
  related_files:
    - prisma/schema.prisma
    - src/types/
  acceptance_criteria:
    - Tables defined in Prisma; migration created
    - API routes for public read
    - Document structure compatible with user library items
  notes: "Done 2026-02-08: Added PublicPower, PublicTechnique, PublicItem, PublicCreature to Prisma; migration add_public_library. Created GET /api/public/[type] for public read."

- id: TASK-137
  title: Admin Save to library — public vs private toggle in creators
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    In power-creator, technique-creator, item-creator, creature-creator: add "Save to library" flow with toggle "Save to my library" (private) vs "Save to public library" (admin only). Public save uses server action + Admin SDK. Private save unchanged (user library). UI: clear toggle, save button.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  acceptance_criteria:
    - Admin sees public/private toggle
    - Non-admin sees only private save
    - Public save writes to public_* collections
    - Sleek, consistent UI across creators
  notes: "Done 2026-02-07: All four creators (power, technique, item, creature) have My library / Public library toggle (admin-only). Uses saveToPublicLibrary for public, saveToLibrary for private."

- id: TASK-138
  title: User Add to my library from public library
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add "Add to my library" action for public library items. When user clicks, copy document from public_powers/public_techniques/et al to users/{uid}/library (or itemLibrary, etc.). User can then edit their copy. Show in Library, Codex, and add-X modals.
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/codex/
    - src/components/character-sheet/add-library-item-modal.tsx
  acceptance_criteria:
    - User can add public item to their library
    - Copy creates new doc in user's library
    - User can edit after adding
    - Source (public vs library) distinguishable in UI
  notes: "Done 2026-02-07: fetchPublicLibrary, addPublicItemToLibrary in library-service. usePublicLibrary, useAddPublicToLibrary hooks. Codex Public Library tab with Add to my library on GridListRow. LoginPromptModal when not logged in."

- id: TASK-139
  title: Unified source filter (public / library / all) across app
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add consistent source filter across Library, Codex, add-power/technique/item modals, equipment-step: "All sources" | "Public library" | "My library". Same filter component, same behavior. Reuse or extend existing filter patterns.
  related_files:
    - src/components/shared/filters/
    - src/app/(main)/library/page.tsx
    - src/components/character-creator/steps/equipment-step.tsx
  acceptance_criteria:
    - Single SourceFilter or equivalent used everywhere
    - Options: All, Public, My library
    - Consistent UX
  notes: "Done 2026-02-07: SourceFilter component (All | Public | My library). Library page has filter; Powers tab supports all three with merge. Techniques/Items/Creatures tabs show Codex link when Public/All."

- id: TASK-140
  title: Public vs private badges/chips in lists
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add visual distinction for public vs private items: badge/chip (e.g. "Public" / "Mine") on GridListRow, ItemCard, Codex lists. Use design tokens. Uniform across Library, Codex, creators, add-X modals.
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/item-card.tsx
  acceptance_criteria:
    - Public items show "Public" badge
    - User library items show "Mine" or no badge
    - Consistent styling (Chip or variant)
  notes: "Done 2026-02-07: GridListRow badges. Public items: 'Public' (blue). Library items: 'Mine' (green). CodexPublicLibraryTab, LibraryPowersTab, LibraryTechniquesTab, LibraryItemsTab."

- id: TASK-141
  title: Add public library tab to Codex
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Codex tab or section for public library (Powers, Techniques, Armaments, Creatures from public_*). Users browse and "Add to my library". Same layout as Codex tabs, source filter for public.
  related_files:
    - src/app/(main)/codex/page.tsx
  acceptance_criteria:
    - Public library content visible in Codex
    - Add to my library works
    - Consistent with Codex UI
  notes: "Done 2026-02-07: CodexPublicLibraryTab with sub-tabs Powers/Techniques/Armaments/Creatures. Browse public items, Add to my library. Implemented with TASK-138."

# --- Phase 5: Data & Docs ---

- id: TASK-142
  title: Update ARCHITECTURE.md for Supabase/Prisma codex and data flow
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update ARCHITECTURE.md for Supabase migration: document Prisma schema, PostgreSQL tables, Codex API (/api/codex), data flow. Remove all Firebase/Firestore/RTDB references. Document admin and public library flow.
  related_files:
    - src/docs/ARCHITECTURE.md
  acceptance_criteria:
    - Docs reflect Supabase/Prisma structure
    - No Firebase/RTDB references
    - Admin and public library flow documented
  notes: |
    Completed 2026-02-07 with TASK-144. ARCHITECTURE.md now documents Supabase/Prisma, Codex API, Codex hooks; RTDB→Codex. Firebase/Firestore kept only for migration context (characters/library). Admin/public library flow: TASK-143.

- id: TASK-143
  title: Add Admin / Public Library workflow docs
  priority: low
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update ADMIN_SETUP.md for Supabase: how to add admins, run migration, deploy. Document public library workflow. Reference DEPLOYMENT_AND_SECRETS_SUPABASE.md.
  related_files:
    - src/docs/ADMIN_SETUP.md
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Clear steps for adding admin (Supabase)
    - Migration and deploy steps
    - Public library usage
  notes: "Done 2026-02-07: ADMIN_SETUP.md — added migration/deploy steps, public library (planned) note. DEPLOYMENT_AND_SECRETS_SUPABASE.md — Phase 7 Vercel step-by-step, copy-paste SQL for Storage RLS."

- id: TASK-144
  title: Documentation migration audit — update all docs for Supabase stack
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Per DOCUMENTATION_MIGRATION_AUDIT.md: Update AGENTS.md, AGENT_GUIDE.md, README.md, .cursor/rules for Supabase/Prisma/Vercel. Archive DEPLOYMENT_SECRETS, ADMIN_SDK_SECRETS_SETUP, SECRETS_SETUP. Point all refs to DEPLOYMENT_AND_SECRETS_SUPABASE.md.
  related_files:
    - src/docs/DOCUMENTATION_MIGRATION_AUDIT.md
    - AGENTS.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - .cursor/rules/realms-project.mdc
  acceptance_criteria:
    - All docs reference Supabase/Prisma/Vercel
    - No Firebase deployment secrets instructions in active docs
    - Old Firebase docs archived
    - npm run build passes
  notes: |
    Completed 2026-02-07. Archived DEPLOYMENT_SECRETS.md, ADMIN_SDK_SECRETS_SETUP.md, SECRETS_SETUP.md to archived_docs/*_FIREBASE.md. Updated AGENTS.md, AGENT_GUIDE.md, ARCHITECTURE.md, README.md, ALL_FEEDBACK_CLEAN.md, update-admin-secrets.ps1. AGENTS.md/AGENT_GUIDE.md/ARCHITECTURE.md now reference Supabase/Prisma/Codex.

- id: TASK-145
  title: Rename RTDB → Codex globally (hooks, types, variables)
  priority: critical
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Data no longer comes from Firebase RTDB — it comes from Prisma via use-codex. Rename: useRTDBFeats→useCodexFeats (remove alias), RTDBFeat→Feat, rtdb* vars→codex*, source:'rtdb'→'codex'. See DOCUMENTATION_MIGRATION_AUDIT.md section 1.
  related_files:
    - src/docs/DOCUMENTATION_MIGRATION_AUDIT.md
    - src/hooks/index.ts
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
  acceptance_criteria:
    - No useRTDB*, RTDBFeat, RTDBSkill, rtdb* variable names
    - sourceFilter uses 'codex' not 'rtdb'
    - npm run build passes
  notes: |
    Completed 2026-02-07. Removed useRTDBFeats/useRTDBSkills aliases; export useCodexFeats, useCodexSkills, Feat, Skill. Renamed rtdb*→codex*, source:'rtdb'→'codex', speciesTraitsFromRTDB→speciesTraitsFromCodex, RTDBEquipmentItem→CodexEquipmentItem. Updated hooks, equipment-step, finalize-step, feats-step, powers-step, add-skill-modal, add-sub-skill-modal, skills-allocation-page, species-modal, ancestry-step, characters/campaigns pages, admin/codex tabs, creature-creator, data-enrichment.

- id: TASK-146
  title: Fix TypeScript build errors (implicit any, type mismatches)
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Build fails with implicit any errors in admin codex tabs, codex tabs, campaigns view, character page. Add explicit types to filter/map/forEach callbacks, sortItems generics, etc. Ensures npm run build passes.
  related_files:
    - src/app/(main)/admin/codex/
    - src/app/(main)/codex/
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
  acceptance_criteria:
    - npm run build passes with no TypeScript errors
    - No implicit any in filter/map/forEach callbacks
    - sortItems<T> used with explicit generic where needed
  notes: |
    Completed 2026-02-07. Fixed implicit any in: finalize-step, powers-step, skills-step, species-step, add-skill-modal, add-sub-skill-modal, skills-allocation-page, game-data-service. Added RTDBSkill, Species, PowerPart, TechniquePart types to callbacks; sortItems<T> where needed; Set<string> for speciesSkillIds.

- id: TASK-147
  title: Fix gold → currency terminology globally
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    "Gold" is not a Realms term. Use Currency, "c", or "C" for abbreviation. Replace: gold_cost→currency_cost (or keep currency field), "gp"→"c", "Gold Cost"→"Currency Cost", formatGold→formatCurrency, goldCost→currencyCost. See GAME_RULES.md for correct terminology.
  related_files:
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/lib/item-transformers.ts
    - src/lib/calculators/item-calc.ts
    - src/lib/data-enrichment.ts
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/library/actions.ts
  acceptance_criteria:
    - No "gold" or "gold_cost" in UI labels or display text
    - Use "c" or "Currency" for cost display
    - Legacy gold_cost in DB/API may remain for backward compat; document
    - npm run build passes
  notes: |
    Completed 2026-02-07. AdminEquipmentTab: "gp"→"c", "Gold Cost"→"Currency Cost"; item-creator: "Base Gold"→"Base Currency"; item-transformers: formatGold→formatCurrency (deprecated formatGold); DOCUMENTATION_MIGRATION_AUDIT: legacy gold_cost note.

- id: TASK-148
  title: Migrate character-service, use-user-library, campaign-service to Prisma
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Phase 4 migration: Replace Firestore with Prisma in character-service.ts, use-user-library.ts (and related hooks), campaign-service.ts. These still use Firebase; migrate to Supabase/Prisma.
  related_files:
    - src/services/character-service.ts
    - src/hooks/use-user-library.ts
    - src/services/campaign-service.ts
    - src/hooks/use-characters.ts
    - src/hooks/use-campaigns.ts
  acceptance_criteria:
    - No Firestore imports in these services
    - Data flows through Prisma
    - npm run build passes
  notes: |
    Completed 2026-02-07. Created API routes: /api/characters, /api/user/library/[type], /api/campaigns. Migrated character-service, use-user-library, campaign-service to fetch from API (Prisma). Updated character sheet, finalize-step, power/technique/item/creature creators to use new services. Created library-service for creators save flow.

- id: TASK-149
  title: Migrate admin codex actions to Prisma
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Admin codex CRUD (createCodexDoc, updateCodexDoc, deleteCodexDoc) may still use Firestore. Migrate to Prisma for codex_* tables.
  related_files:
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - Admin codex CRUD uses Prisma
    - No Firestore in admin codex actions
    - npm run build passes
  notes: |
    Completed 2026-02-07. Replaced getAdminFirestore with prisma; createCodexDoc/updateCodexDoc/deleteCodexDoc now use Prisma delegates (codexFeat, codexSkill, etc.). getSession and isAdmin use Supabase Auth and env vars.

- id: TASK-150
  title: Add auth confirm route for Supabase email OTP / magic links
  priority: medium
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Supabase Auth sends users to /auth/confirm for email magic links and OTP verification. Without this route, those flows fail. Add the route per Supabase docs to support email verification and magic-link sign-in.
  related_files:
    - src/app/auth/confirm/route.ts
    - src/lib/supabase/server.ts
  acceptance_criteria:
    - GET /auth/confirm handles token_hash and type query params
    - Uses supabase.auth.verifyOtp() and redirects to next param on success
    - Redirects to /login?error=confirm on failure
    - npm run build passes
  notes: |
    Done 2026-02-07: Created auth/confirm/route.ts with verifyOtp, createUserProfileAction, x-forwarded-host for redirects. Add {{ .SiteURL }}/auth/confirm to Supabase Auth URL config for magic links.

- id: TASK-151
  title: Add x-forwarded-host handling in auth callback for Vercel/proxy
  priority: medium
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Behind Vercel or a load balancer, origin may differ from the actual host. Use x-forwarded-host when present to construct correct redirect URLs in the OAuth callback.
  related_files:
    - src/app/auth/callback/route.ts
  acceptance_criteria:
    - In production, if x-forwarded-host is present, redirect uses https://{x-forwarded-host}{next}
    - In development, use origin directly (no proxy)
    - Existing createUserProfileAction flow preserved
    - npm run build passes
  notes: |
    Done 2026-02-07: Added getRedirectUrl() to auth/callback and auth/confirm using x-forwarded-host in production.

- id: TASK-152
  title: Audit skill encounter page — verify completeness vs feedback
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Skill encounter page may have incomplete behavior. Check ALL_FEEDBACK_CLEAN.md raw feedback and GAME_RULES.md. Verify: add participants (campaign + library), DS config, roll tracking, success/failure logic, required successes/failures, RM-specific features per core rules.
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/components/shared/add-combatant-modal.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - Campaign characters (RM and non-RM) can be added to skill encounters
    - Creature library can be used to add participants
    - DS, successes, failures behave per GAME_RULES
    - No known bugs from feedback remain
    - npm run build passes
  notes: |
    Done 2026-02-07: Audited skill encounter page. Campaign chars (RM + non-RM) fixed in prior session via API ?scope=encounter. CreatureLibraryTab and CampaignCharactersTab both support mode=skill and onAddParticipants. computeSkillRollResult matches GAME_RULES (roll >= DS: 1 + floor((roll-DS)/5) successes; roll < DS: 1 + floor((DS-roll)/5) failures). Added Required Successes display (participants + 1) per GAME_RULES. Build passes.

- id: TASK-153
  title: Navbar — Move Campaigns to right of RM Tools, left of About
  priority: medium
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Reorder navbar: move Campaigns link to appear after RM Tools dropdown and before About. Current order: Characters, Campaigns, Library, Codex, Creators, Rules, RM Tools, About. New order: Characters, Library, Codex, Creators, Rules, RM Tools, Campaigns, About.
  related_files:
    - src/components/layout/header.tsx
  acceptance_criteria:
    - Campaigns appears after RM Tools and before About (desktop and mobile nav)
    - All other nav links retain correct order
    - npm run build passes
  notes: |
    Single navLinks array reorder in header.tsx.

- id: TASK-154
  title: Admin Codex — Display "-" for feat level 0 in list
  priority: low
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    In Admin Codex Editor Feats tab (and any codex list showing feat_lvl), when feat level requirement is 0, display "-" instead of "0". Per GAME_RULES: feat_lvl indicates the level of the feat itself (e.g. Bloodlust II vs Bloodlust III); no level implies no higher-level variant.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
  acceptance_criteria:
    - feat_lvl 0 displays as "-" in list views
    - feat_lvl > 0 displays numeric value
    - Applies to Admin Feats and Codex Feats tabs
  notes: |
    Use display helper: (feat_lvl === 0 || feat_lvl == null) ? '-' : String(feat_lvl).

- id: TASK-155
  title: Admin Codex — List refresh after delete; unify UI with Codex
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    When deleting a list item in Admin Codex, the list still shows the item until page refresh. Fix by ensuring query invalidation/refetch removes deleted item from local state immediately. Also unify Admin Codex tabs with Codex tabs: same UI, filters, styles, search/sort. Exception: Admin uses pencil/trash icons for edit/delete instead of Codex view-only actions. Apply to all admin codex tabs (Feats, Skills, Species, Traits, Parts, Properties, Equipment, Archetypes, Creature Feats).
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/codex/
  acceptance_criteria:
    - Delete removes item from list immediately (no refresh needed)
    - Each Admin tab uses same layout, filters, search, sort as corresponding Codex tab
    - Admin tabs retain pencil/trash for edit/delete; Codex remains view-only
    - npm run build passes
  notes: |
    Done 2026-02-09: (1) Fixed invalidateQueries — all admin tabs used wrong keys; useCodex* hooks use ['codex']. Updated AdminFeatsTab, AdminSpeciesTab, AdminSkillsTab, AdminTraitsTab, AdminPartsTab, AdminPropertiesTab, AdminEquipmentTab, AdminCreatureFeatsTab to invalidate ['codex']. (2) Unified Admin Feats with Codex Feats: FilterSection, ChipSelect, AbilityRequirementFilter, TagFilter, SelectFilter, SortHeader, same GridListRow with detailSections. Other tabs (Skills, Species, etc.) can be unified incrementally — same pattern.

- id: TASK-156
  title: Feat Editing — Ability dropdown (6 abilities + 6 defenses)
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    In Admin Feat edit modal, ability_req and ability (sorting) should use a dropdown of the 12 options: 6 Abilities (Strength, Vitality, Agility, Acuity, Intelligence, Charisma) and 6 Defenses (Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve). Allow selecting one or more. Reference src/types/abilities.ts and GAME_RULES.md for canonical names.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/types/abilities.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - ability_req uses multi-select dropdown with 12 options
    - ability (sorting) uses same dropdown (multi-select)
    - Options: Strength, Vitality, Agility, Acuity, Intelligence, Charisma, Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve
    - npm run build passes
  notes: |
    Create ABILITIES_AND_DEFENSES constant in src/lib/game/constants.ts or reuse existing. Display names: capitalize per GAME_RULES (e.g. "Mental Fortitude" not "mentalFortitude").

- id: TASK-157
  title: Feat Editing — Add all missing editable fields
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Admin Feat edit modal is missing many feat fields. Add edit controls for: name, description, req_desc (requirement description), ability_req + abil_req_val (paired: ability/defense name + min value), skill_req + skill_req_val (paired), feat_cat_req (feat category required), pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period (Full/Partial), category, ability (sorting), tags, char_feat, state_feat. Reference GAME_RULES.md and archived Fixes and Improvements for field semantics.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/types/feats.ts
    - src/hooks/use-rtdb.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All listed fields have an input/select/checkbox in edit modal
    - ability_req/abil_req_val pairs: add/remove rows; dropdown for ability; number for min value
    - skill_req/skill_req_val pairs: skill dropdown (from codex); number for min bonus
    - feat_cat_req, rec_period have appropriate controls
    - feat_lvl displays "-" when 0
    - npm run build passes
  notes: |
    Field semantics: abil_req_val[i] = min value for ability_req[i]. feat_cat_req = category of feat required (e.g. "Defense"). rec_period: Full or Partial. feat_lvl: level of feat (Bloodlust II = 2, Bloodlust = 1). TASK-156 covers ability dropdown.

- id: TASK-158
  title: Centralized codex data schema — AI reference doc
  priority: medium
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Create a centralized reference document for all codex entity schemas (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats). Each field should have: name, type, description, valid values, and example. Purpose: AI agents and engineers can reference this to clarify field utility when implementing validation, editing, or display logic.
  related_files:
    - src/docs/
    - prisma/schema.prisma
    - Codex csv/
  acceptance_criteria:
    - New doc (e.g. src/docs/CODEX_SCHEMA_REFERENCE.md) lists all codex entities
    - Each entity has field table: name, type, description, valid values, example
    - Covers: feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats
    - Reference GAME_RULES.md and existing CSV/Prisma for accuracy
  notes: |
    Essential for admin codex editors and AI task implementation. Include ability_req/abil_req_val pairing, feat_lvl vs lvl_req, skill_req/skill_req_val order, species skills (IDs vs names), etc.

- id: TASK-159
  title: Admin Codex — Reduce input lag in edit mode
  priority: medium
  status: not-started
  created_at: 2026-02-09
  created_by: agent
  description: |
    When typing in edit mode (Admin Codex modals), there is noticeable lag. Likely causes: uncontrolled re-renders, heavy form state updates, or expensive parent re-renders. Investigate and optimize: debounce only where needed, avoid unnecessary re-renders, consider controlled inputs with local state + sync on blur or debounced save.
  related_files:
    - src/app/(main)/admin/codex/*.tsx
    - src/components/ui/Input.tsx
  acceptance_criteria:
    - Typing in text inputs feels responsive (no perceptible lag)
    - Form state still saves correctly on submit
    - npm run build passes
  notes: |
    Deferred: requires profiling to identify root cause. Potential causes: inline handlers, large form state updates, Modal re-renders. Consider: useCallback for handlers, startTransition for non-urgent updates, React.memo for form sections.

- id: TASK-160
  title: Admin Codex — Array fields use dropdowns, not raw IDs
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    For array fields in Admin Codex edit modals (e.g. species skills, feat skill_req, species traits), use dropdowns to select from codex items by name, not "ids separated by commas". Admins don't have IDs memorized. Allow add-from-dropdown or comma-separated when dropdown is the only practical option. Apply to all codex tabs that have array fields referencing other codex entities.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Species skills: dropdown of skills (by name) to add; display as chips with remove
    - Feat skill_req: dropdown of skills to add
    - Other array fields referencing codex: dropdown where applicable
    - Store IDs internally; display names in UI
    - npm run build passes
  notes: |
    Done 2026-02-09: (1) Feat skill_req: dropdown of skills by name, add/remove rows with min value. (2) Species skills: ChipSelect dropdown of skills by name; resolve IDs to names when loading. Other array fields (traits, etc.) can follow same pattern.

# Campaign–Encounter, Roll Log, Character Visibility (TASK-161+)

- id: TASK-161
  title: Campaign–Encounter attachment and "Add all Characters"
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Allow attaching a campaign to an encounter upon creation or within the encounter. Add "Add all Characters" (or similar) button that adds all characters from the attached campaign into the encounter automatically.
  related_files:
    - prisma/schema.prisma
    - src/types/encounter.ts
    - src/app/(main)/encounters/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/app/(main)/encounters/[id]/mixed/page.tsx
    - src/components/shared/add-combatant-modal.tsx
  acceptance_criteria:
    - Encounter can have optional campaignId; set on create or edit
    - "Add all Characters" button adds all campaign characters to the encounter
    - Add to combat, skill, and mixed encounter pages
    - npm run build passes
  notes: |
    Done 2026-02-09: encounter.data.campaignId; combat/skill/mixed have campaign dropdown + Add all Characters.

- id: TASK-162
  title: Fix encounter combatant HP/EN when tied to user character
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Encounter combatants tied to a user's character are not fully loading with accurate current/max energy and health. Ensure the API returns and the add-combatant flow uses correct health/energy from character data.
  related_files:
    - src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    - src/components/shared/add-combatant-modal.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
  acceptance_criteria:
    - Campaign characters added to encounter show correct currentHealth/maxHealth, currentEnergy/maxEnergy
    - API scope=encounter returns health/energy from character.data (health.current, health.max, etc.)
    - npm run build passes
  notes: |
    Done 2026-02-09: getCharacterMaxHealthEnergy in formulas; API uses when health/energy missing.

- id: TASK-163
  title: Add roll log to encounters for RM (personal + campaign tabs)
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Add a roll log to encounter pages (combat, skill, mixed) with same UI/functionality/styles as character sheet. RM uses it for private rolls (not broadcast to campaign). Include tabs so RM can also view rolls in their campaigns.
  related_files:
    - src/components/character-sheet/roll-log.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/app/(main)/encounters/[id]/mixed/page.tsx
  acceptance_criteria:
    - Encounter pages have RollLog component (or equivalent)
    - Personal tab: RM rolls privately, not sent to campaign
    - Campaign tab: view campaign rolls (when encounter has campaign)
    - Same layout, dice builder, RollEntryCard as character sheet
    - npm run build passes
  notes: |
    Done 2026-02-09: RollLog accepts viewOnlyCampaignId; encounter pages wrap in RollProvider (no campaignContext) and render RollLog with viewOnlyCampaignId={encounter.campaignId}. Personal rolls stay local; Campaign tab shows linked campaign rolls.

- id: TASK-164
  title: Roll log consistency — styles, date display across encounter/campaign/sheet
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Make roll log styles consistent across encounter tab (roll log campaign mode), character sheet (campaign mode), and campaign page. Fix roll date display — most show "unavailable" for the date. Use single RollEntryCard and shared formatting.
  related_files:
    - src/components/character-sheet/roll-log.tsx
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
  acceptance_criteria:
    - RollEntryCard used everywhere; same layout, colors, spacing
    - Roll date displays correctly (not "unavailable"); handle Date, {seconds}, ISO string
    - Encounter, campaign, character sheet roll logs look identical
    - npm run build passes
  notes: |
    Done 2026-02-09: normalizeRollTimestamp + formatRollTimestamp in roll-log; campaign page uses same list styling.

- id: TASK-165
  title: Roll log real-time sync via Supabase Realtime
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Rolls should sync in real time between characters, campaigns, and other users. Replace polling with Supabase Realtime subscription on campaign_rolls (and personal rolls if stored). Update database, Supabase settings, and hooks.
  related_files:
    - src/hooks/use-campaign-rolls.ts
    - prisma/supabase-rls-policies.sql
  acceptance_criteria:
    - Campaign rolls update in real time for all viewers (no 5s poll)
    - Supabase Realtime enabled for campaign_rolls table
    - RLS policies allow SELECT for campaign members
    - npm run build passes
  notes: |
    Done 2026-02-09: use-campaign-rolls uses postgres_changes on schema campaigns, table campaign_rolls with filter campaign_id=eq.; invalidates query on any change. prisma/supabase-rls-policies.sql: ALTER PUBLICATION supabase_realtime ADD TABLE campaigns.campaign_rolls; GRANT SELECT to authenticated.

- id: TASK-166
  title: Health/Energy real-time sync between encounters and characters
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Current health and energy should sync in real time between encounters and the characters themselves. When combatant is tied to a character (sourceType: campaign-character), HP/EN changes in encounter should update character and vice versa.
  related_files:
    - src/types/encounter.ts
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/components/shared/add-combatant-modal.tsx
    - prisma/supabase-rls-policies.sql
  acceptance_criteria:
    - Combatant HP/EN edits sync to character when sourceType is campaign-character
    - Character HP/EN edits sync to encounter combatants
    - Real-time or near-real-time; consider Supabase Realtime on characters
    - npm run build passes
  notes: |
    Done 2026-02-09: TrackedCombatant/SkillParticipant have sourceUserId. Encounter→character: updateCombatant calls syncCharacterHealthEnergy (debounced 400ms) when owner edits HP/EN; PATCH /api/characters/[id]. Character→encounter: Realtime subscription on users.characters for campaign-character combatant ids; on UPDATE merge health/energy into combatants. Publication + GRANT for users.characters in supabase-rls-policies.sql.

- id: TASK-167
  title: Character visibility — public link, campaign-only, private→campaign on join
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Public: anyone can copy link and view character in browser (read-only, no edit). Campaign only: RM and campaign members can see (not edit). Private + joins campaign: auto-set to campaign only; show notification when joining with private character that visibility will change.
  related_files:
    - src/types/character.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/app/api/characters/
    - src/app/(main)/campaigns/
  acceptance_criteria:
    - Public: /characters/[id] viewable by unauthenticated or any user when visibility=public
    - Campaign: RM and members can view via /campaigns/[id]/view/[userId]/[characterId]
    - Join campaign with private char: auto-update to campaign; show notification
    - All view modes: read-only (no edit/save)
    - npm run build passes
  notes: |
    Done 2026-02-09: GET /api/characters/[id] allows unauthenticated for public; campaign visibility via in-memory campaign membership check. View-only toolbar when !isOwner. Add/join campaign actions set visibility to campaign when private and return visibilityUpdated; toasts on campaign page and join tab.

- id: TASK-168
  title: Character-derived content visibility — library items view-only for viewers
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Characters use powers, techniques, armaments, items from user's private library. When viewing another user's character (public or campaign), these library items must be visible (read-only) to the viewer. No editing of the source items.
  related_files:
    - src/lib/owner-library-for-view.ts
    - src/lib/data-enrichment.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/app/api/characters/[id]/route.ts
    - src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    - src/services/character-service.ts
  acceptance_criteria:
    - Viewing a character includes resolved powers, techniques, items (from owner's library)
    - API returns enriched data for view scope; library items readable by viewer
    - No edit/delete/save for viewed items
    - npm run build passes
  notes: |
    Done 2026-02-09: getOwnerLibraryForView(ownerUserId) fetches owner's powers/techniques/items. GET /api/characters/[id] returns { character, libraryForView } when non-owner (public/campaign). Campaign character API returns character + libraryForView. Character page and campaign view page use libraryForView for enrichment when present; view-only UI unchanged.

- id: TASK-169
  title: Admin Feats — remove prereq_text and rely on req_desc
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    The `prereq_text` field was mistakenly treated as a real feat attribute. It should not exist in the canonical feats schema or Admin editors. Use `req_desc` (requirement description) as the single source of truth for human-readable requirements and remove `prereq_text` from schema docs, types, API mapping, migration scripts, and the Admin Feats UI.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - scripts/migrate_rtdb_to_firestore.js
  acceptance_criteria:
    - `prereq_text` no longer appears in CODEX_SCHEMA_REFERENCE for feats
    - Feat type definitions and codex API responses no longer expose `prereq_text`
    - Admin Feats modal does not show or save `prereq_text`
    - Migration script does not write `prereq_text` into Firestore
    - npm run build passes
  notes: |
    Implemented 2026-02-11 based on owner feedback that `prereq_text` was never a real attribute. Existing data with this field is effectively ignored.

- id: TASK-170
  title: Admin Codex — unify Skills, Parts, Properties, and Equipment tabs with Codex layout
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin Codex tabs for Skills, Parts, Properties, and Equipment should mirror their Codex counterparts: same search, filters, sort headers, and GridListRow-based list layout, with only the addition of edit/delete controls. This reduces redundancy and makes "learn one UI, use it everywhere" true for Codex vs Admin editing.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/app/(main)/codex/CodexPartsTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
  acceptance_criteria:
    - Admin Skills tab uses the same filters (Ability, Base Skill, Skill Type) and NAME/ABILITIES/BASE SKILL headers as Codex Skills
    - Admin Parts tab uses Codex Parts-style filters (Category, Type, Mechanics) and NAME/CATEGORY/ENERGY/TP headers
    - Admin Properties tab uses a Type filter and NAME/TYPE/ITEM PTS/TP/COST MULT headers like Codex Properties
    - Admin Equipment tab uses Category and Rarity filters with NAME/CATEGORY/COST/RARITY headers similar to Codex Equipment
    - All four tabs still provide add/edit/delete modals with existing behavior
    - npm run build passes
  notes: |
    Implemented 2026-02-11: imported shared Codex filter components (FilterSection, ChipSelect, SelectFilter) and SortHeader/useSort into Admin tabs, aligned grid column definitions, and wired filters/sorting to the same fields the Codex tabs use.

- id: TASK-171
  title: Admin Skills — base skill dropdown resolves base_skill_id
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    In the Admin Skills edit modal, `base_skill_id` currently requires admins to know and type numeric IDs. Replace this with a dropdown of base skill names (non-sub-skills), storing the corresponding `base_skill_id` internally. value "" should mean no base skill (not a sub-skill), and id 0 should indicate the skill can be a sub-skill of any base skill.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - Admin Skills modal shows a "Base skill" select listing base skill names instead of a free-text numeric ID
    - On save, the selected base skill name is resolved to its `base_skill_id` and stored correctly; blank => undefined, "Any" => 0
    - Editing an existing sub-skill pre-selects the correct base skill in the dropdown
    - npm run build passes
  notes: |
    Use codex skills list to build the dropdown (filter out sub-skills where base_skill_id is set). Keep raw IDs internal to avoid admins needing to look them up.

- id: TASK-172
  title: Admin Skills — expose additional description fields
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    Admin Skills edit modal should include inputs for all narrative fields defined in the codex schema: `success_desc`, `failure_desc`, `ds_calc`, `craft_success_desc`, and `craft_failure_desc`. These complement the main `description` and are used for Codex display and RM guidance.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
  acceptance_criteria:
    - Admin Skills modal has labeled inputs/textarea controls for success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc
    - Values load when editing an existing skill and persist on save
    - npm run build passes
  notes: |
    These fields are descriptive helpers for RMs and should be treated as optional text fields, displayed alongside the primary description in Codex views.

- id: TASK-173
  title: Skills — render extra descriptions as expandable chips in item cards
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    Skill data includes additional descriptive fields (success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc) that should appear as expandable chips on skill item cards. Chips should be used in Codex Skills tab, add-skill modals, and add sub-skill modals, appended after the primary description.
  related_files:
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/components/creator/skills-step.tsx
  acceptance_criteria:
    - Skill item cards show chips like "Success Outcomes", "Failure Outcomes", "DS Calculation", "Craft Success", "Craft Failure" when corresponding fields are present
    - Chips expand to reveal the full text when clicked, consistent with existing chip expansion patterns
    - Implementation is reused across Codex and skill selection/summary UIs
    - npm run build passes
  notes: |
    Follow the existing chip expansion UX used for feats and parts so RMs get additional details without cluttering the main description.

- id: TASK-174
  title: Codex schema — add Use column and align fields
  priority: medium
  status: in-progress
  created_at: 2026-02-11
  created_by: owner
  description: |
    Extend the centralized Codex schema reference so each field includes a clear "Use" explanation, and align listed fields with the canonical RTDB data review/spec for feats, skills, species, traits, items, parts, properties, and creature feats. Ensure that narrative skill fields (success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc) and all feat requirement fields are documented with their exact purposes (validation vs display vs RM guidance).
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/docs/ALL_FEEDBACK_RAW.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - Each codex entity table in CODEX_SCHEMA_REFERENCE has a "Use" column with accurate, concrete descriptions based on owner spec
    - Feat, skill, species, trait, item, part, property, and creature feat field lists match the RTDB DATA REVIEW plus latest feedback (no extra/missing fields)
    - Narrative skill fields and feat requirement fields clearly distinguish validation logic vs display/reference text
    - npm run build passes
  notes: |
    Partially implemented 2026-02-11: Feats, skills, species, traits, parts, properties, items, and creature feats updated with Use column and aligned fields. Further refinements can follow as schema evolves.

- id: TASK-175
  title: Codex skills — remove invalid trained_only field
  priority: high
  status: in-progress
  created_at: 2026-02-11
  created_by: owner
  description: |
    `trained_only` is not a real field in the canonical skills schema. Remove it across docs, types, API responses, admin editors, and migration scripts so future work does not rely on it. Preserve any legacy data in Firestore/RTDB, but stop reading or writing this field in the application.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - scripts/migrate_rtdb_to_firestore.js
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - CODEX_SCHEMA_REFERENCE no longer lists `trained_only` under Skills
    - Skill types in use-rtdb and anywhere else do not include trained_only
    - Codex API skills payload does not expose trained_only or rely on it
    - AdminSkillsTab no longer shows or saves a "Trained only" checkbox
    - Migration scripts do not write trained_only into codex_skills documents
    - npm run build passes
  notes: |
    Implemented initial removal 2026-02-11 based on owner clarification that trained_only is not part of the skills data model. Legacy codex documents may still contain this field but it is ignored by the app.

- id: TASK-176
  title: Codex seeding — wipe and reseed from canonical CSVs
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Update the Supabase/Prisma codex seeding so that running the seed script fully clears all codex tables and replaces them with data from the canonical Codex CSVs, using the updated codex schema (ID-based cross-refs, equipment rename, properties.mechanic). This ensures the live codex matches the curated CSVs exactly.
  related_files:
    - scripts/seed-to-supabase.js
    - codex_csv/
    - prisma/schema.prisma
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - Running `node scripts/seed-to-supabase.js` deletes all rows from codex_* tables and then repopulates them from the CSVs
    - Feats, skills, species, traits, parts, properties, equipment, archetypes, and creature feats load without runtime errors using the revised schema
    - Codex seeding supports ID-based arrays for feat.skill_req and species skills/traits/flaws/characteristics
    - `npm run db:seed` (or equivalent) works end-to-end and can be safely used to recreate codex data in Supabase
  notes: |
    Initial implementation 2026-02-11: seed-to-supabase now always clears codex tables via clearCodexTables() before upserting CSV rows. Further work may be needed as CSVs evolve.

- id: TASK-177
  title: Codex schema usage audit — IDs, equipment, mechanic properties
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Audit the codebase for any discrepancies between the updated codex schema and actual usage. Focus on: feat.skill_req being treated as names instead of IDs; species skills/traits/flaws/characteristics treated as names instead of IDs; any lingering references to “items” where the canonical collection is now “equipment” / codex_equipment; and ensuring properties.mechanic is available wherever needed.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/
    - src/app/(main)/codex/
    - src/components/creator/
  acceptance_criteria:
    - A short list of concrete mismatches (e.g. places comparing feat.skill_req to skill names, or rendering species_traits as names without lookup) is documented
    - New follow-up tasks are created for each category of mismatch (feat.skill_req IDs, species trait/skill IDs, equipment naming in UI, mechanic property behavior)
    - CODEX_SCHEMA_REFERENCE remains the single source of truth for codex field semantics
  notes: |
    This is primarily a planning/audit task; follow-up implementation tasks will handle the actual code changes.

- id: TASK-178
  title: Armament creator — hide mechanic properties from add-property lists
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Use the new `mechanic` boolean on codex_properties to hide mechanic-only properties (e.g. Damage Reduction, stat requirements, base armor/weapon/shield costs, Split Damage Dice, Range, Two-Handed, Armor Base, Shield Base, Weapon Damage) from the normal "add property" dropdowns in the armament creator. These should be wired into the UI logic instead of being selectable like regular user-facing properties.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - codex_csv/Codex - Properties.csv
    - src/app/(main)/item-creator/
    - src/lib/item-transformers.ts
    - src/components/creator/
  acceptance_criteria:
    - Properties with mechanic=true do not appear in standard add-property dropdowns or selection lists
    - Existing armament creator behavior for these mechanic properties is preserved or improved (requirements, base costs, etc. handled via code, not manual selection)
    - Non-mechanic properties continue to display and behave as before
    - npm run build passes
  notes: |
    This task focuses on using the mechanic flag in the UI; seeding of the mechanic field itself is handled by TASK-176.

- id: TASK-179
  title: Feat skill_req — convert to ID-based everywhere
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Feat.skill_req is currently treated as an array of skill names in several places (Admin Feats editor, Codex Feats tab, character creator feats-step, character sheet add-feat modal, and requirement-checking logic). Update the system so feats store and operate on skill IDs instead of names, matching the codex schema and CSVs, while still displaying human-readable skill names via codex lookups.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-sheet/add-feat-modal.tsx
  acceptance_criteria:
    - Feat.skill_req arrays in the database and codex API contain skill IDs, not names
    - Admin Feats modal uses a dropdown of skill names but saves the corresponding IDs into skill_req
    - Codex Feats, character creator feats-step, and add-feat-modal all render skill requirement chips using resolved skill names from codex_skills based on IDs
    - Requirement-checking logic (e.g. in feats-step and add-feat-modal) correctly maps feat.skill_req IDs to the character’s skill bonuses via ID→name resolution
    - npm run build passes
  notes: |
    This task depends on having canonical skill IDs in the Codex CSVs; the UI should treat IDs as the source of truth and derive names via lookups.

- id: TASK-180
  title: Species skills/traits/flaws/characteristics — enforce ID-based usage
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Ensure that species.skills, species_traits, ancestry_traits, flaws, and characteristics are consistently treated as ID arrays across the React app. Any UI that currently assumes these are names should be updated to resolve IDs to names via codex lookups (traits, skills) while preserving IDs in saved data and API payloads.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
    - src/app/(main)/codex/CodexSpeciesTab.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/lib/item-transformers.ts
  acceptance_criteria:
    - Species CSVs and Supabase codex_species rows store only IDs (no names) in skills/species_traits/ancestry_traits/flaws/characteristics
    - Codex API returns these as ID arrays, and all downstream code treats them as such
    - UI components resolve IDs to names using codex_skills and codex_traits when displaying traits/skills
    - No code path relies on trait or skill names being stored directly in the species arrays
    - npm run build passes
  notes: |
    Some vanilla-site JS still uses name-based arrays; this task is limited to the React/Next.js codebase.

- id: TASK-181
  title: Admin Skills — ability multi-select aligned with schema
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Skills schema defines `ability` as a string[] of governing abilities/defenses, but AdminSkillsTab currently treats it as a single free-text string. Update the Admin Skills editor so `ability` is a multi-select (using the 12 canonical abilities/defenses) and save the result as an array, while still supporting backward-compatible display of existing string values.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - Admin Skills modal uses a ChipSelect/multi-select for `ability`, with options from the canonical 12 abilities/defenses
    - Saved skills have `ability` persisted as a string[] (or a single string when only one is chosen, consistent with API expectations)
    - API and hooks correctly serialize/deserialize ability arrays for display and filters
    - npm run build passes
  notes: |
    This extends the earlier feat ability_req/ability work to skills so the governing abilities are structured, not free text.

- id: TASK-182
  title: Admin Equipment — align fields with codex_equipment schema
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Equipment schema documents only name, description, category, currency, and rarity, but AdminEquipmentTab currently exposes type and gold_cost/currency in ways that mix codex data with library-style fields. Reconcile Admin Equipment with the schema: ensure category, currency, and rarity are fully editable, and either (a) drop or (b) clearly separate any non-schema fields so codex_equipment remains a clean reference table.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - AdminEquipmentTab exposes inputs for category, currency, and rarity consistent with CODEX_SCHEMA_REFERENCE
    - Any extra fields (type, gold_cost, properties, etc.) are either removed from the Admin Codex editor or justified by an updated schema/doc
    - Codex equipment displayed in Codex/Library stays in sync with the canonical codex_equipment shape
    - npm run build passes
  notes: |
    This is primarily a reconciliation/cleanup task; it may be resolved either by trimming the editor or by deliberately extending the equipment schema and docs.

- id: TASK-184
  title: Publish confirmation modal in all creators
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add a confirmation modal when admin saves to public library in power, technique, item, and creature creators. Shows "Are you sure you wish to publish this [type] to the public library?" before executing the save.
  related_files:
    - src/components/shared/confirm-action-modal.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  acceptance_criteria:
    - ConfirmActionModal reusable component created
    - All 4 creators show confirmation when saveTarget === 'public'
    - npm run build passes
  notes: "Completed 2026-02-11. Created ConfirmActionModal shared component with publish/warning icon variants."

- id: TASK-185
  title: Unify admin codex delete icons (Trash2 → X) and fix delete handler bug
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Replace Trash2 icons with X icons in all 9 admin codex tabs to unify with the rest of the site's remove button pattern. Fix critical bug where delete buttons called openEdit() instead of delete handler.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  acceptance_criteria:
    - All admin codex tabs use X icon instead of Trash2
    - Delete buttons trigger inline confirmation, not openEdit()
    - npm run build passes
  notes: "Completed 2026-02-11. Fixed critical delete handler bug in all 9 tabs."

- id: TASK-186
  title: Inline delete confirmation in admin codex
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin codex delete buttons now show an inline "Remove? Yes/No" confirmation instead of opening a modal. Same pattern used for both list row delete and modal footer delete.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
  acceptance_criteria:
    - Clicking delete on a list item shows inline "Remove? Yes/No" text
    - Clicking "Yes" performs the delete, "No" cancels
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-187
  title: Add inline pencil/edit icon to GridListRow for library items
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Added inline Edit (pencil) icon to GridListRow collapsed row when onEdit is provided. Previously edit button was only visible in expanded content. Now users can quickly click edit from the row.
  related_files:
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - Edit icon visible in collapsed row when onEdit is provided
    - Uses same Edit icon from lucide-react
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-188
  title: Power and technique creators handle ?edit= query param to load items
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Power creator and technique creator now handle ?edit=<id> URL parameter to load an existing item for editing, matching the item creator's existing behavior. Library edit buttons navigate to /power-creator?edit=<id> or /technique-creator?edit=<id>.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  acceptance_criteria:
    - Power creator loads power from URL param using handleLoadPower
    - Technique creator loads technique from URL param using handleLoadTechnique
    - Suspense boundary wraps content for useSearchParams
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-189
  title: Fix save/display pipeline — item auto-gen properties, technique actionType, enrichment
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Fixed multiple data pipeline issues causing powers/techniques/items to show incorrect costs when viewed outside creators:
    1. Item creator was saving only selectedProperties, missing auto-generated properties (Weapon Damage, Two-Handed, Range, Armor Base, Shield Amount, etc.). Fixed to save propertiesPayload.
    2. Technique creator was not saving actionType/isReaction fields. Fixed to include them.
    3. TechniqueDocument interface lacked actionType/isReaction. Updated interface and deriveTechniqueDisplay to use saved values with fallback to derivation.
  related_files:
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/lib/calculators/technique-calc.ts
  acceptance_criteria:
    - Item creator saves all properties including auto-generated ones
    - Technique creator saves actionType and isReaction
    - deriveTechniqueDisplay uses saved actionType/isReaction when available
    - npm run build passes
  notes: "Completed 2026-02-11. Root cause of reported display mismatch: auto-gen properties not saved + technique action type derived instead of using saved value."

- id: TASK-183
  title: Admin Parts — edit defense targets
  priority: low
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    Parts support an optional `defense` string[] to indicate which defenses they target, but the Admin Parts modal currently has no UI for this field. Add an editor control (multi-select of the 6 defenses) so admins can set or clear defense targets for duration/defense-related parts.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
  acceptance_criteria:
    - AdminPartsTab exposes a multi-select for defense targeting, with options from the 6 canonical defenses
    - Saved parts persist `defense` as per schema, and CodexPartsTab can display/use this information as needed
    - npm run build passes
  notes: |
    This is a small schema-coverage enhancement; behavior in creators can be updated separately if needed.

- id: TASK-190
  title: Admin Creature Feats — level, requirement, mechanic flags
  priority: high
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Creature Feats tab only supports name/description/points today, even though the codex_creature_feats schema
    defines feat_points, feat_lvl, lvl_req, and mechanic. Admins need to be able to set the feat's own level, the minimum
    creature level required, and whether the entry is a mechanic-only feat. The admin list and creature-creator integration
    should respect these fields.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
    - src/hooks/use-codex.ts
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
  acceptance_criteria:
    - AdminCreatureFeatsTab edit modal exposes inputs for feat point cost, feat level, required creature level, and a mechanic-only checkbox, mapped to feat_points, feat_lvl, lvl_req, and mechanic in codex_creature_feats
    - Existing creature feats seeded from CSV load their level requirement, feat level, and mechanic flag correctly into the edit modal
    - The creature feats list shows at least the feat point cost and either level requirement or feat level in columns, so admins can see tiering at a glance
    - Codex API (`/api/codex`) returns the new fields in the creatureFeats payload in a way that is compatible with the creature creator’s feat points calculation
    - npm run build passes

- id: TASK-191
  title: Admin Equipment — currency, category, and type alignment
  priority: high
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Equipment tab does not align with the codex_equipment schema. There is no explicit input for category or
    currency, the "Type" dropdown currently mixes armor/weapon/equipment in a way that doesn't match the codex schema,
    and items that have a non-zero cost in the list show a cost of 0 in the edit modal. The admin editor and list need
    to be wired directly to category and currency while keeping equipment-specific type handling consistent with how
    equipment is consumed elsewhere (item creator, library, creature armaments).
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/api/codex/route.ts
    - src/lib/item-transformers.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - AdminEquipmentTab edit modal includes fields for category and currency (base cost) and populates them correctly for existing equipment
    - Saving from the edit modal persists category and currency back to codex_equipment so `/api/codex` returns the correct cost
    - The equipment list’s cost column reflects the true currency value from the codex row (no more showing 0 in the modal when the list shows a non-zero cost)
    - The "Type" handling in AdminEquipmentTab matches how equipment type is used in item/armament creators (no misleading armor/weapon-only values when editing generic equipment)
    - npm run build passes

- id: TASK-192
  title: Admin Properties & Parts — mechanic/duration flags, percentage display, option chips
  priority: high
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    Several Admin Codex tabs for armament properties and power/technique parts are out of sync with the codex schema and
    public Codex views. Property type currently defaults to "general" (which is not a real property type), mechanic flags
    in the edit modal do not reflect existing mechanic properties, parts filtering defaults to hiding mechanic parts, and
    duration parts with duration=true are not wiring the "Affects Duration" checkbox correctly. Additionally, the Admin
    Parts list shows percentage-based EN parts as raw base_en values instead of formatted percentages, and list rows with
    options do not surface those options as expandable chips the way the Codex Parts/Properties tabs do.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/codex/CodexPartsTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - AdminPropertiesTab type dropdown uses only the canonical property types ("Armor", "Shield", "Weapon") and initial selection reflects the property’s actual type (no "general" default)
    - Mechanic properties load into the AdminPropertiesTab edit modal with the Mechanic checkbox correctly checked when mechanic=true and unchecked otherwise, and saving preserves the flag
    - AdminPartsTab mechanic filter defaults to showing all parts (not hiding mechanics), and the "Affects Duration" checkbox is wired to the codex_parts.duration field so duration parts round-trip correctly
    - AdminPartsTab energy column formats percentage-based parts using the same percentage formatting logic as CodexPartsTab (e.g., "+25%" instead of "1.25"), while non-percentage parts continue to show flat EN
    - Parts and properties that have option descriptions/costs render those options in the admin lists as expandable chips (via GridListRow detailSections/chips) so admins can inspect option text and costs without opening the modal
    - npm run build passes

- id: TASK-193
  title: Admin Traits & Species — flaw/characteristic flags, sizes, trait chips
  priority: high
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    In the Admin Traits and Species tabs, the boolean flags and size handling are misleading. Trait edit modals do not
    show the flaw/characteristic checkboxes as checked even when the underlying trait has those flags set to true,
    and the Species editor exposes a "Primary size" concept even though the codex schema only defines a sizes array.
    Additionally, when editing species, the chips used to add traits (species_traits, ancestry_traits, flaws,
    characteristics) are not expandable, making it hard for RMs to read the full trait descriptions inline.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/hooks/use-rtdb.ts
    - src/hooks/use-codex.ts
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - AdminTraitsTab loads existing traits with flaw and characteristic checkboxes reflecting the true underlying booleans (no more unchecked boxes for true flags), and saving preserves both flags
    - AdminSpeciesTab no longer surfaces a "Primary size" field in the UI; size display is derived from the sizes array per CODEX_SCHEMA_REFERENCE, and only sizes is editable
    - Species edit modal uses trait selections (species_traits, ancestry_traits, flaws, characteristics) that render as expandable chips in the expanded species row so RMs can click and read each trait’s description without leaving the list
    - Any size filters in the Species list continue to work using the sizes array
    - npm run build passes

- id: TASK-194
  title: Admin Skills & Feats — base skill display and filter “All” options
  priority: medium
  status: not-started
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Skills and Feats tabs have small but confusing UX issues. In Admin Skills, many skills show "-" for the
    Base Skill column even when they have a valid base_skill_id, and the Skill Type filter presents two "All Skills"
    choices (one as a placeholder and one as an explicit option). In Admin Feats, the Feat Type and State Feats filters
    similarly present duplicate "All"/"All Feats" options. The base skill editor should also reliably pre-populate the
    base skill dropdown when editing existing sub-skills.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - AdminSkillsTab Base Skill column shows the correct base skill name for all skills with a valid base_skill_id (including id 0 → “Any”), falling back to "-" only when there truly is no base skill
    - Editing an existing sub-skill in AdminSkillsTab pre-selects the appropriate base skill (or “Any”) in the Base skill dropdown based on base_skill_id
    - The Skill Type SelectFilter in AdminSkillsTab has a single clear way to show “all skills” (e.g., placeholder only or explicit option only), eliminating duplicate “All Skills” entries
    - The Feat Type and State Feats filters in AdminFeatsTab likewise avoid duplicate “All”/“All Feats” options while preserving the ability to filter by archetype/character and state feats
    - npm run build passes

# =====================================================================
# CHARACTER DATA AUDIT - Lean Schema & Codex-Driven Architecture
# =====================================================================
#
# Context: Full audit of the saved character JSON revealed pervasive
# redundancy, multiple competing representations for the same data,
# derived values being persisted, full codex objects hard-saved onto
# characters instead of IDs, and several formula/constant bugs.
#
# Goal: Characters store ONLY user choices + runtime state (current HP/EN).
# Everything else is derived on load from Codex, Library, and game formulas.
# This makes the system resilient to playtest rule changes - update the
# codex/formulas once and all characters reflect the change immediately.
#
# Phases are ordered by dependency. Complete Phase 1-2 before Phase 3-4.
# Phase 5 depends on Phase 3-4. Phase 6 is final cleanup.
# =====================================================================

# -- Phase 1: Critical Bug Fixes --
# Standalone fixes. No schema migration. Can be done immediately.

- id: TASK-195
  title: "CANCELLED: Ability cost threshold - code is correct"
  priority: critical
  status: cancelled
  created_at: 2026-02-11
  created_by: agent
  notes: |
    Owner confirmed 2026-02-11: "abilities cost 2 for every 1 point after 4."
    COST_INCREASE_THRESHOLD = 4 in constants.ts IS correct. Going from 3→4 costs 1, 4→5 costs 2.
    GAME_RULES.md had an incorrect table (said 3→4 costs 2) which has been corrected.
  related_files:
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - COST_INCREASE_THRESHOLD is 3 in constants.ts
    - getAbilityIncreaseCost(3) returns 2
    - getAbilityIncreaseCost(2) returns 1
    - Character creator and character sheet ability steppers show cost of 2 pts at value 3+
    - npm run build passes

- id: TASK-196
  title: "Bug: maxHealth ignores archetype ability - always uses Vitality"
  priority: critical
  status: done
  notes: "Done 2026-02-11. Fixed character-sheet-utils.ts and getCharacterMaxHealthEnergy in formulas.ts to use getBaseHealth() which checks if vitality is archetype ability and uses strength instead."
  created_at: 2026-02-11
  created_by: agent
  description: |
    GAME_RULES.md states Base health is 8 + Vitality (or Strength if Vitality is archetype ability).
    The centralized calculateMaxHealth() in calculations.ts correctly checks this, but the inline
    calculation in character-sheet-utils.ts does NOT - it always uses vitality. Characters whose
    archetype ability IS Vitality get incorrect health. They should use Strength for health instead.
    Example from saved character: pow_abil=vitality, vitality=3, strength=-1, level=1, healthPoints=8.
    Incorrect (current): 8 + 3*1 + 8 = 19.
    Correct: 8 + (-1) + 8 = 15 (use strength since vitality IS archetype ability; strength negative
    so only applied at level 1).
    Fix: Replace inline health calc in character-sheet-utils.ts with calculateMaxHealth() from
    calculations.ts, passing the archetype ability.
  related_files:
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/lib/game/calculations.ts
  acceptance_criteria:
    - character-sheet-utils.ts calls calculateMaxHealth() instead of inline formula
    - When Vitality is the archetype ability, Strength is used for health calculation
    - Negative ability modifier only applied once (not scaled by level)
    - npm run build passes

- id: TASK-197
  title: "Bug: Character creator uses hardcoded base health/energy (10) instead of formulas"
  priority: critical
  status: done
  notes: "Done 2026-02-11. Replaced hardcoded baseHealth=10/baseEnergy=10 in character-creator-store.ts with getBaseHealth()/getBaseEnergy() formulas. currentHealth/currentEnergy now calculated correctly."
  created_at: 2026-02-11
  created_by: agent
  description: |
    In character-creator-store.ts getCharacter(), the code uses:
      const baseHealth = 10; const baseEnergy = 10;
    These are incorrect hardcoded values. The correct formulas (from GAME_RULES.md):
    - Base health: 8 + Vitality (or Strength if Vitality is archetype ability)
    - Base energy: archetype ability score
    - Max health: 8 + (ability * level if positive, ability once if negative) + healthPoints
    - Max energy: (archetypeAbility * level) + energyPoints
    The creator sets currentHealth = 10 + healthPoints, which is wrong.
    Fix: Import and use calculateMaxHealth() and calculateMaxEnergy() from calculations.ts.
    Set currentHealth = maxHealth and currentEnergy = maxEnergy at creation.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/game/calculations.ts
  acceptance_criteria:
    - Creator uses calculateMaxHealth / calculateMaxEnergy instead of hardcoded 10
    - New characters start with currentHealth = maxHealth, currentEnergy = maxEnergy
    - Health floor correctly uses Vitality (or Strength when Vitality is archetype ability)
    - Energy floor correctly uses archetypeAbility * level
    - npm run build passes

- id: TASK-198
  title: "Fix game constants - ability caps, damage types, Staggered, ice naming"
  priority: high
  status: done
  notes: "Done 2026-02-11. Fixed ability caps (10 chars/20 creatures), renamed cold→ice, added Staggered, removed physical/magic damage split, added ARMOR_EXCEPTION_TYPES, added LEVELS_BY_RARITY, fixed creature TP (22 base, 2/level) and skill points (5 at L1, 3/level), fixed archetype armament max values, updated encounter-tracker conditions."
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-resolved]
  description: |
    Owner confirmed 2026-02-11. All resolved values:
    1. CONDITIONS array in creator-constants.ts is missing Staggered (a leveled condition). Add it.
    2. Remove MAGIC_DAMAGE_TYPES / PHYSICAL_DAMAGE_TYPES split. No "physical vs magic" categories.
       All damage types are a flat list. Only distinction: armor exceptions (Psychic, Spiritual, Sonic
       not reduced by armor). Acid is a valid damage type usable by powers.
    3. Canonical name is "Ice" not "cold" - rename in code.
    4. Ability caps: MAX_ABSOLUTE = 10 for characters, 20 for creatures. Remove any level-based cap.
       COST_INCREASE_THRESHOLD = 4 is correct (cost doubles at 4+, not 3+).
    5. Add ARMOR_EXCEPTION_TYPES = ["Psychic", "Spiritual", "Sonic"] constant.
    6. Add ALL_DAMAGE_TYPES flat list: Magic, Fire, Ice, Lightning, Spiritual, Sonic, Poison,
       Necrotic, Acid, Psychic, Light, Bludgeoning, Piercing, Slashing.
    7. Add LEVELS_BY_RARITY reference: Common 1-4, Uncommon 5-9, Rare 10-14, Epic 15-19,
       Legendary 20-24, Mythic 25-29, Ascended 30+.
  related_files:
    - src/lib/game/creator-constants.ts
    - src/lib/game/constants.ts
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Staggered is added to the CONDITIONS array
    - acid is added to MAGIC_DAMAGE_TYPES
    - Ice/cold naming is consistent between code and GAME_RULES.md
    - ABILITY_LIMITS.MAX_ABSOLUTE is reviewed and corrected (owner confirm 5, 6, or 10)
    - npm run build passes

- id: TASK-199
  title: "Fix feat slot formulas - character feats = level, archetype varies by archetype"
  priority: high
  status: done
  notes: "Done 2026-02-11. Replaced floor(level/4)+1 with correct archetype-aware formulas. Character feats = level. Archetype feats: Power=level, Martial=level+2+floor((level-1)/3), P-M=level+1+milestones. Updated character sheet, feats-step, level-up-modal, progression.ts."
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-resolved]
  description: |
    Owner confirmed 2026-02-11. The correct feat formulas are:
    CHARACTER FEATS: Always 1 per level. Total = level. All archetypes.
    ARCHETYPE FEATS (base): 1 per level = level.
    ARCHETYPE FEATS (martial bonus): +2 at level 1, then +1 every 3 levels starting at 4.
      - Martial total: level + 2 + floor((level - 1) / 3)
      - Power total: level (no bonus)
      - Powered-Martial: level + choices at milestones (every 3 levels starting at 4,
        choose Additional Feat OR Increase Innate Power)
    Current code uses Math.floor(level / 4) + 1 which is WRONG for ALL archetypes.
    Fix: Replace feat calculations in character sheet and character creator to use these formulas.
    The archetype type must be known to compute archetype feats correctly.
    Reference: Full progression tables in GAME_RULES.md Archetype Rules section.
    If formula differs by archetype, implement per-archetype feat progression.
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Owner confirms correct feat slot formula (per archetype or universal)
    - Both character sheet and character creator use the same formula
    - Formula is centralized in formulas.ts as a shared function
    - npm run build passes

- id: TASK-199b
  title: "Bug: SAVEABLE_FIELDS missing critical fields, xp vs experience mismatch"
  priority: high
  status: done
  notes: "Done 2026-02-11. Added missing fields to SAVEABLE_FIELDS: archetypeFeats, unarmedProwess, description, status, namedNotes, currentHealth, currentEnergy, health_energy_points, defenseVals, experience, trainingPointsSpent."
  created_at: 2026-02-11
  created_by: agent
  description: |
    The SAVEABLE_FIELDS whitelist in data-enrichment.ts is missing fields that should persist:
    1. archetypeFeats - not in list (handled by separate code path, but fragile)
    2. unarmedProwess - user-allocated value, silently dropped on save
    3. namedNotes - user-created named notes, silently dropped
    4. description - character description, silently dropped
    5. status - character status (draft/complete/playing), silently dropped
    6. xp is in the list but the Character type uses experience - potential data loss
    archetypeFeats is cleaned in the function body but relies on it already existing on the
    data object rather than being in the whitelist. This is fragile.
  related_files:
    - src/lib/data-enrichment.ts
    - src/types/character.ts
  acceptance_criteria:
    - SAVEABLE_FIELDS includes archetypeFeats, unarmedProwess, namedNotes, description, status
    - xp is changed to experience (or both are included with a note)
    - All user-editable fields survive a save/reload cycle
    - npm run build passes

# -- Phase 2: Define Lean Character Schema --
# Design the target data model. Define types, document what is
# persisted vs derived, create the migration plan.

- id: TASK-200
  title: "Design: Define canonical CharacterSaveData type - what gets persisted"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a new TypeScript type (CharacterSaveData) that represents EXACTLY what gets written
    to the Prisma JSON blob. Single source of truth for persistence. Every field must have a
    JSDoc comment explaining whether it is a user choice, runtime state, or reference ID.
    IDENTITY AND META: id, userId, name, description, notes, namedNotes, portraitUrl, status,
      level, experience, visibility, createdAt, updatedAt
    BUILD CHOICES: speciesId, selectedTraitIds, selectedFlawId, selectedCharacteristicId,
      archetypeId, pow_abil, mart_abil, abilities, defenseVals, skillAllocations as
      Record<string, {prof,val}>, featIds, archetypeFeatIds, powerRefs as Array<{id,innate}>,
      techniqueRefs as Array<{id}>, inventory as Array<{itemId,quantity,equipped?}>,
      healthPoints, energyPoints, currency, unarmedProwess, archetypeChoices
    RUNTIME STATE: currentHealth, currentEnergy, temporaryHealth, temporaryEnergy,
      conditions, featUses as Record<string,number>, traitUses as Record<string,number>
    NOT PERSISTED (derived on load): maxHealth, maxEnergy, defenseScores, defenseBonuses,
      evasion, speed, names/descriptions/properties, martialProficiency, powerProficiency, terminal
    Defines the type and documents migration mapping. Actual migration in later tasks.
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/types/feats.ts
    - src/types/equipment.ts
    - src/types/archetype.ts
    - src/types/ancestry.ts
  acceptance_criteria:
    - New CharacterSaveData type exists with JSDoc for every field
    - Migration mapping document (old field to new field) is written in a comment block
    - Every field is tagged as user-choice, runtime-state, or reference-id
    - The type compiles and npm run build passes
    - Existing Character type is NOT deleted yet (coexists for gradual migration)
  notes: |
    Completed 2026-02-11: Added CharacterSaveData interface to src/types/character.ts with full
    documentation. Covers identity, core stats, species/archetype selections, skill allocations,
    feats (IDs only), powers/techniques (IDs only), inventory (IDs + quantity), runtime state
    (conditions, traitUses, currentHealth/Energy), and user notes. Exported from types/index.ts.
    Coexists with existing Character type for gradual migration.

# -- Phase 3: Centralize Calculations --
# Eliminate duplicated formula code. Single source of truth for all
# derived stats. Both creator and sheet call the same functions.

- id: TASK-201
  title: "Centralize all health/energy/defense/speed/evasion calculations"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Health/energy/defense/speed/evasion calculations are duplicated in:
    - src/lib/game/calculations.ts (centralized, mostly correct)
    - src/app/(main)/characters/[id]/character-sheet-utils.ts (inline, some bugs)
    - src/stores/character-creator-store.ts (hardcoded bases)
    - src/lib/game/formulas.ts (another set of health/energy functions)
    Consolidate into calculations.ts as the SINGLE source of truth:
    - calculateMaxHealth, calculateMaxEnergy, calculateDefenses, calculateSpeed, calculateEvasion
      already exist and are correct
    - Add calculateTerminal(maxHealth) as Math.ceil(maxHealth / 4)
    - Add calculateAllStats(character) master function returning all derived stats
    Replace inline formulas in character-sheet-utils.ts and character-creator-store.ts.
    Deprecate getCharacterMaxHealthEnergy, getBaseHealth, getBaseEnergy in formulas.ts.
    Remove legacy calculateSkillPoints() (gives 2+3*level=5 at level 1) - only
    calculateSkillPointsForEntity() (gives 3*level=3 at level 1) matches GAME_RULES.
  related_files:
    - src/lib/game/calculations.ts
    - src/lib/game/formulas.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/stores/character-creator-store.ts
  acceptance_criteria:
    - All health/energy/defense/speed/evasion calculations use functions from calculations.ts
    - No inline formula duplication in character-sheet-utils.ts or character-creator-store.ts
    - Legacy calculateSkillPoints() is removed or deprecated with a redirect
    - calculateAllStats(character) master function exists and is used by character sheet
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added calculateTerminal(), calculateAllStats(), computeMaxHealthEnergy()
    to calculations.ts as single source of truth. Replaced inline formulas in character-sheet-utils.ts
    (now a thin wrapper), character-creator-store.ts (uses calculateMaxHealth/calculateMaxEnergy),
    finalize-step.tsx, campaign character API route (computeMaxHealthEnergy). Deprecated
    getBaseHealth, getBaseEnergy, getCharacterMaxHealthEnergy, calculateSkillPoints in formulas.ts.
    Updated level-up-modal, progression.ts, creature-creator to use calculateSkillPointsForEntity.
    0 new TS errors.

- id: TASK-202
  title: "Unify defense fields - keep only defenseVals, remove defenseSkills alias"
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    The character saves BOTH defenseVals and defenseSkills - identical objects representing
    skill points spent on defenses (2 skill points = +1 defense val). Per owner: defenses
    should only have vals not skills since vals represent 2 skill points spent per 1.
    Action:
    1. Keep only defenseVals as the canonical field name
    2. Update all code reading/writing defenseSkills to use defenseVals
    3. In cleanForSave, save only defenseVals
    4. On load, if old character has defenseSkills but not defenseVals, copy it over
    5. Update Character type to mark defenseSkills as deprecated
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Only defenseVals is used throughout the codebase
    - defenseSkills is removed or marked deprecated with migration fallback
    - SAVEABLE_FIELDS saves defenseVals, not defenseSkills
    - Old characters with defenseSkills still load correctly
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added defenseVals to Character type (canonical field). defenseSkills
    marked @deprecated. All reads now use defenseVals || defenseSkills for backward compat.
    All writes (creator store, skills-step, page.tsx handleDefenseChange) now write defenseVals.
    cleanForSave() migrates old defenseSkills -> defenseVals automatically. calculateAllStats()
    merges both with defenseVals taking priority. Removed defenseSkills from SAVEABLE_FIELDS.
    12 files updated. 0 new TS errors.

# -- Phase 4: Character Creator - Save Lean Data --
# Fix what the creator persists. Move from save everything to
# save only user choices and IDs. Each task handles one data domain.

- id: TASK-203
  title: "Creator: Save species as speciesId, not name/object - derive on load"
  priority: high
  status: done
  notes: |
    cleanForSave strips ancestry to { id, name, selectedTraits, selectedFlaw, selectedCharacteristic }.
    Removed 'species' string and 'ancestryId'/'ancestryTraits' from SAVEABLE_FIELDS. Creator no longer
    saves redundant 'species' string. Migration in cleanForSave: if no ancestry but species string exists,
    creates ancestry { name: species }. Server-side listing falls back to d.species for old characters.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently the creator saves: species (name string), ancestry (full object with id, name,
    selectedTraits, selectedFlaw, selectedCharacteristic). The term should be species not
    ancestry per GAME_RULES terminology. Redundant fields:
    - species (top-level string) redundant with ancestry.name
    - ancestry.name redundant with codex lookup by ID
    - Top-level ancestryTraits, flawTrait, characteristicTrait, speciesTraits are legacy dupes
    Change to save: speciesId, selectedTraitIds, selectedFlawId, selectedCharacteristicId.
    Remove: species (string), ancestry.name, all legacy top-level trait fields.
    On load: look up species name, traits from codex by ID.
  related_files:
    - src/stores/character-creator-store.ts
    - src/components/character-creator/steps/species-step.tsx
    - src/types/character.ts
    - src/types/ancestry.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Creator saves speciesId + trait selection IDs only (no name, no full objects)
    - Character sheet loads species name from codex by speciesId
    - Trait names/descriptions loaded from codex by ID
    - Old characters with species/ancestry fields still load (backward compat fallback)
    - The word ancestry is replaced with species in all user-facing labels
    - npm run build passes

- id: TASK-204
  title: "Creator: Save archetype as archetypeId only - derive prof/abilities from codex"
  priority: high
  status: done
  notes: |
    Creator now saves lean archetype { id, type } only. cleanForSave strips name/description/ability.
    CharacterArchetype.name made optional (@deprecated). Sheet-header and server-side listing derive
    display name from archetype.type (capitalize + split-on-dash). Removed archetypeName/archetypeAbility
    from SAVEABLE_FIELDS. archetypeAbility prop derives from pow_abil with archetype.ability fallback.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently the creator saves a full archetype object { id, name, type, ability, pow_abil,
    mart_abil } PLUS duplicates pow_abil, mart_abil, mart_prof, pow_prof at the top level.
    Change to save: archetypeId (string), pow_abil (AbilityName, user choice),
    mart_abil (AbilityName or undefined, user choice).
    Remove from save: archetype object (name/type derived from codex), mart_prof/pow_prof
    (derived from archetype type + level via formulas).
    Remove dual martialProficiency/powerProficiency aliases.
  related_files:
    - src/stores/character-creator-store.ts
    - src/types/character.ts
    - src/types/archetype.ts
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Creator saves archetypeId + pow_abil + mart_abil only
    - mart_prof/pow_prof calculated from archetype type + level on load
    - martialProficiency/powerProficiency aliases removed from Character type
    - Character sheet derives archetype name, type, proficiencies from codex/formulas
    - Old characters with full archetype objects still load (backward compat)
    - npm run build passes

- id: TASK-205
  title: "Creator: Save feats as IDs only - derive name/description from codex"
  priority: high
  status: done
  notes: |
    cleanForSave now saves feats as { id, name, currentUses } only — description/maxUses/recovery
    stripped from save. Recovery handlers (full + partial) and feat uses handler look up maxUses
    and rec_period from codex (featsDb) with fallback to saved feat.maxUses for backward compat.
    add-feat-modal saves lean { id, name, currentUses } on creation.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently feats saved with { name, description, id, maxUses, currentUses, recovery }.
    Name, description, maxUses, recovery are ALL in codex_feats - only the ID and runtime
    currentUses need to be on the character.
    Change to save: archetypeFeatIds (string[]), featIds (string[]),
    featUses Record<string, number> (featId to currentUses for limited-use feats).
    On load: look up feat details from codex_feats by ID.
    Update cleanForSave, feats-tab.tsx, add-feat-modal.
  related_files:
    - src/stores/character-creator-store.ts
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/lib/data-enrichment.ts
    - src/types/feats.ts
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves feat IDs only (no name/description on character)
    - Character sheet loads feat details from codex by ID
    - Feat uses tracked per feat ID in a separate map
    - Recovery handlers use codex for maxUses
    - Old characters with {name,description} feats still load (fallback match by name)
    - npm run build passes

- id: TASK-206
  title: "Creator: Save powers as { id, innate } only - derive from library + codex parts"
  priority: high
  status: done
  notes: |
    cleanForSave now saves powers as { id, name, innate } — name kept for backward compat lookup,
    description/parts/cost/damage/etc stripped. enrichPowers() already supports ID-based lookup
    via findInLibrary(), so existing characters load seamlessly.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently powers saved with { name, innate } (sometimes full objects). Only the library
    power ID and innate flag (user choice) need to be saved.
    Change to save: powerRefs Array<{ id: string; innate: boolean }>
    On load: enrichPowers() matches by name - change to match by ID.
    Powers live in user library (user-created), not global codex. Parts reference codex_parts.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves power references as { id, innate } only
    - enrichPowers() matches by ID (not name) as primary lookup
    - Character sheet displays full power details from library enrichment
    - Old characters with { name, innate } still load (fallback match by name)
    - npm run build passes

- id: TASK-207
  title: "Creator: Save techniques as { id } only - derive from library + codex parts"
  priority: high
  status: done
  notes: |
    cleanForSave now saves techniques as { id, name } objects — name kept for backward compat,
    description/parts/cost/damage/etc stripped. Previously saved bare name strings. enrichTechniques()
    already supports both string and object inputs via findInLibrary().
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently techniques saved as bare name strings. Only the library technique ID is needed.
    Change to save: techniqueRefs Array<{ id: string }>
    On load: enrichTechniques() matches by name - change to match by ID.
    Same pattern as TASK-206 for powers.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves technique references as { id } only
    - enrichTechniques() matches by ID (not name) as primary lookup
    - Old characters with name strings still load (fallback match by name)
    - npm run build passes

- id: TASK-208
  title: "Creator: Save skills as Record<skillId, {prof,val}> - derive name/ability from codex"
  priority: high
  status: done
  notes: |
    cleanForSave now strips ability, baseSkillId, category from saved skills — only keeps
    { id, name, skill_val, prof, selectedBaseSkillId? }. name kept as backward compat lookup key.
    ability and baseSkillId derived from codex_skills on load.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Skills have a type mismatch: CharacterSkills is Record<string, number> but runtime is
    Array<{ id, name, skill_val, prof, ability, baseSkillId? }>. Code uses unsafe casts.
    Name, ability, baseSkillId are ALL in codex_skills - only skill ID, prof, and val needed.
    Change to save: skills Record<string, { prof: boolean; val: number; selectedBaseSkillId? }>
    On load: look up skill name, ability, base_skill_id from codex_skills by ID.
    This also fixes the type mismatch - no more casting.
  related_files:
    - src/stores/character-creator-store.ts
    - src/types/skills.ts
    - src/types/character.ts
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-creator/steps/skills-step.tsx
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Skills saved as Record<string, {prof,val,selectedBaseSkillId?}>
    - No more unsafe casts for skills
    - Skill names, abilities loaded from codex on render
    - Creator and sheet both use the same skill data shape
    - Old characters with array-of-objects skills still load (migration on read)
    - npm run build passes

- id: TASK-209
  title: "Creator: Save equipment as single inventory with IDs - remove redundant sub-arrays"
  priority: high
  status: done
  notes: |
    cleanForSave now saves equipment items as { id, name, equipped?, quantity? } — strips
    description/damage/properties/cost/rarity/weight/armor/range. ID saved for reliable lookup,
    name kept for backward compat. Redundant inventory[] array removed from save. enrichItems()
    updated to support ID-based lookup with codex fallback by ID.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Equipment saved with: inventory[] (full objects) + weapons[] + armor[] + items[] (also full
    objects, filtered from inventory). This is triple-redundant.
    Change to save: inventory Array<{ itemId: string; quantity: number; equipped?: boolean }>
    Remove: equipment.weapons, equipment.armor, equipment.items (derived views).
    Remove: full item objects from inventory (name, cost, damage, properties from codex).
    On load: enrichItems() looks up each itemId in user library or codex_equipment.
    Views computed by filtering enriched inventory by type.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/types/equipment.ts
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves inventory as [{itemId,quantity,equipped}] only
    - No redundant weapons/armor/items sub-arrays saved
    - enrichItems() matches by ID (primary) with name fallback
    - Character sheet derives item details from codex
    - Old characters with full item objects still load
    - npm run build passes

- id: TASK-210
  title: "Creator: Save lean health/energy - allocation + current only, remove duplicates"
  priority: high
  status: done
  notes: |
    Removed health_energy_points from creator save. Removed health/energy ResourcePool from
    SAVEABLE_FIELDS. Character sheet now reads currentHealth/currentEnergy (canonical) with
    backward compat fallback to health?.current/energy?.current for old saves. All writes
    (recovery, power/technique use, allocation changes) write to currentHealth/currentEnergy.
    cleanForSave migration copies health.current→currentHealth for old data on save.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Creator saves health/energy in FOUR overlapping representations:
    1. healthPoints / energyPoints - allocation (correct, keep)
    2. health_energy_points: { health, energy } - same as 1, redundant (remove)
    3. health: { current, max } / energy: { current, max } - max is derived (remove max)
    4. currentHealth / currentEnergy - duplicate of health.current (consolidate)
    Change to save: healthPoints, energyPoints, currentHealth, currentEnergy.
    Remove: health_energy_points, health.max, energy.max, ResourcePool objects.
    On load: maxHealth and maxEnergy calculated from formulas.
  related_files:
    - src/stores/character-creator-store.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/types/character.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Creator saves only healthPoints, energyPoints, currentHealth, currentEnergy
    - health_energy_points field is removed
    - health/energy ResourcePool objects are not saved (max is calculated on load)
    - Character sheet reads currentHealth/currentEnergy directly, calculates max
    - Old characters with ResourcePool objects still load
    - npm run build passes

# -- Phase 5: Character Sheet - Load by ID, Derive from Codex --
# Update the character sheet to work with the lean data model.

- id: TASK-211
  title: "Sheet: Load feats by ID from codex - derive name, description, uses"
  priority: high
  status: done
  notes: |
    enrichFeat() updated to derive name from codex when missing. Fixed uses_per_rec field mapping
    (codex API returns uses_per_rec, not max_uses). CodexFeat interface updated with uses_per_rec field.
    Feats tab now works fully with lean { id, currentUses } data.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update feats-tab.tsx and page.tsx to work with lean feat data (IDs + uses).
    On load: for each feat ID in archetypeFeatIds/featIds, look up in codex_feats.
    Derive name, description, category, maxUses, recovery, requirements.
    Merge with featUses map for current uses.
    Recovery handlers should look up maxUses from codex, not from saved feat.
  related_files:
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Feats tab renders all data from codex lookup
    - No feat name/description read from the character object
    - Add feat saves only ID
    - Recovery handlers use codex for maxUses
    - npm run build passes

- id: TASK-212
  title: "Sheet: Load powers/techniques by ID from library - derive all display data"
  priority: high
  status: done
  notes: |
    Already fully working from Phase 4. findInLibrary() tries ID first then name.
    enrichPowers() and enrichTechniques() pass full character reference to findInLibrary.
    LibrarySection receives enrichedData.powers/techniques. Verified end-to-end path.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update library-section.tsx to work with lean power/technique references.
    On load: for each power ref {id,innate}, find in user library by ID.
    enrichPowers() already matches by name - switch to ID-based lookup. Same for techniques.
    Innate flag and EN cost deduction are the only character-specific behaviors.
    All other display data comes from library item + codex parts enrichment.
    Unify this pattern with how Library page and Codex page display the same items.
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Powers/techniques resolved by ID from user library
    - All display data comes from enrichment, not saved character
    - Innate flag correctly read from character reference
    - EN cost deduction still works
    - npm run build passes

- id: TASK-213
  title: "Sheet: Load equipment by ID from codex/library - derive stats and properties"
  priority: high
  status: done
  notes: |
    Fixed toEquipmentArray() to preserve id and quantity (was stripping them).
    enrichItems() now passes quantity through to enriched result. findInLibrary() uses ID first.
    Codex fallback also uses ID-based lookup. LibrarySection receives enriched weapons/armor/equipment.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update library-section.tsx and archetype-section.tsx to work with lean equipment data.
    On load: for each inventory item {itemId,quantity,equipped}, look up in user library by ID
    with fallback to codex_equipment. Derive name, type, cost, damage, properties, armor value.
    Views (weapons/armor/equipment) computed by filtering enriched inventory by type.
    Unify attack bonus calculation between archetype-section and library-section.
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Equipment resolved by ID from library/codex
    - Name, stats, properties all from codex (not saved on character)
    - equipped/quantity/itemId is all that is on the character
    - Attack bonus calculations unified
    - npm run build passes

- id: TASK-214
  title: "Sheet: Derive skills display from codex - only prof/val from character"
  priority: high
  status: done
  notes: |
    Already working from Phase 4. Character page uses useMemo with codexSkills to enrich
    skill ability/category/description from codex. Species skills merged via characterSpeciesSkills.
    Only prof/skill_val/selectedBaseSkillId saved on character.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update skills-section.tsx to work with lean skill data: Record<skillId, {prof,val}>.
    On load: for each skill ID, look up in codex_skills to get name, ability, base_skill_id.
    Merge with character prof/val to compute skill bonus.
    Species skills (auto-proficient) from codex_species lookup by speciesId.
    Defense vals displayed alongside abilities. Cost is 2 skill points per +1 val.
    Only vals stored, defenses derived (10 + ability + val).
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-codex.ts
    - src/lib/game/formulas.ts
  acceptance_criteria:
    - Skill names, abilities loaded from codex (not saved on character)
    - Skill bonuses calculated from formulas
    - Species skills merged from codex_species data
    - Defense vals display correctly (only vals, not skills)
    - npm run build passes

- id: TASK-215
  title: "Sheet: Derive all computed stats - stop persisting maxHP/maxEN/evasion/speed"
  priority: high
  status: done
  notes: |
    Already working from TASK-201. calculateAllStats() is the single source of truth for all
    derived stats (maxHealth, maxEnergy, terminal, evasion, speed, defenseScores, etc.).
    speedBase/evasionBase kept as user-modifiable inputs (feats/traits modify them).
    speed/evasion/armor on Character type marked @deprecated.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Ensure the character sheet calculates ALL derived stats on load using centralized formulas
    (from TASK-201) and does NOT read them from the saved character data.
    Derived on load: maxHealth, maxEnergy, terminal, evasion, speed, defenseScores,
    martialProficiency, powerProficiency, armor DR.
    Remove from SAVEABLE_FIELDS: speedBase, evasionBase (defaults unless feat/trait modifies).
    Keep speedBase/evasionBase as optional overrides with clear defaults if needed.
  related_files:
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/lib/game/calculations.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - All derived stats calculated on load from formulas + character inputs
    - No derived stat is read from saved character data
    - Sheet displays correct values matching the formulas
    - npm run build passes

# -- Phase 6: Unification and Migration --
# Cross-cutting cleanup. Unify enrichment. Migrate characters.

- id: TASK-216
  title: "Unify enrichment pipeline - shared ID-based loading for all contexts"
  priority: medium
  status: done
  notes: |
    Already achieved through Phase 4/5 work. findInLibrary() is the shared ID-based lookup
    used by enrichPowers(), enrichTechniques(), enrichItems(). enrichFeat() does ID-first codex
    lookup. All contexts use the same enrichment functions from data-enrichment.ts.
    Backward compat: all lookups fall back to name matching when ID fails.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create shared enrichment utilities that all contexts use:
    - enrichByIds<T>(ids, sourceMap) - generic ID-based lookup
    - enrichPowersById, enrichTechniquesById, enrichItemsById, enrichFeatsById, enrichSkillsById
    Ensure backward compatibility: if ID lookup fails, fall back to name matching.
    Used by: character sheet, library page, codex page, character creator, creature creator.
  related_files:
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/character-creator/steps/equipment-step.tsx
  acceptance_criteria:
    - Shared enrichment utilities exist for all data types
    - All contexts use the same enrichment functions
    - ID-based lookup with name fallback for backward compatibility
    - npm run build passes

- id: TASK-217
  title: "Update cleanForSave to match lean schema"
  priority: high
  status: done
  notes: |
    Fully completed in Phase 4 (TASK-203–210). cleanForSave now strips all derived data:
    feats → { id, name, currentUses }, powers → { id, name, innate }, techniques → { id, name },
    equipment → { id, name, equipped?, quantity? }, skills → { id, name, skill_val, prof, selectedBaseSkillId? },
    archetype → { id, type }, ancestry → { id, name, selectedTraits, selectedFlaw, selectedCharacteristic },
    health/energy → currentHealth/currentEnergy + healthPoints/energyPoints.
  created_at: 2026-02-11
  created_by: agent
  description: |
    After Phases 3-5, cleanForSave needs to match the lean CharacterSaveData schema:
    - Skills: save Record<skillId, {prof,val}>, not array of objects
    - Feats: save feat IDs + featUses map, not {name,description} objects
    - Powers: save [{id,innate}], not {name,innate}
    - Techniques: save [{id}], not name strings
    - Equipment: save [{itemId,quantity,equipped}], not full objects
    - Health/energy: save healthPoints, energyPoints, currentHealth, currentEnergy only
    - Species: save speciesId, not name string
    - Archetype: save archetypeId, not full object
    - Defenses: save defenseVals only
    Update SAVEABLE_FIELDS to match. Add missing fields (see TASK-199b).
  related_files:
    - src/lib/data-enrichment.ts
    - src/types/character.ts
  acceptance_criteria:
    - cleanForSave produces lean output matching CharacterSaveData
    - All user-editable fields survive save/load cycle
    - No derived data saved
    - SAVEABLE_FIELDS is accurate and complete
    - npm run build passes

- id: TASK-218
  title: "Remove all redundant fields from Character type - final cleanup"
  priority: medium
  status: done
  notes: |
    All redundant fields in Character type annotated with @deprecated JSDoc:
    - species → Use ancestry.name
    - health/energy ResourcePool → Use currentHealth/currentEnergy
    - speed/evasion/armor → Derived from calculateAllStats()
    - martialProficiency/powerProficiency → Use mart_prof/pow_prof
    - allTraits/_displayFeats → Display-only, not saved
    - ancestryTraits/flawTrait/characteristicTrait/speciesTraits → Use ancestry sub-fields
    - health_energy_points → Use healthPoints/energyPoints
    Fields kept with deprecation notices for backward compat until full migration (TASK-220).
  created_at: 2026-02-11
  created_by: agent
  description: |
    After all migration is complete, clean up the Character type.
    Remove: species, ancestry, ancestryTraits, flawTrait, characteristicTrait, speciesTraits,
    defenseSkills, martialProficiency, powerProficiency, health_energy_points,
    health.max, energy.max, speedBase, evasionBase, speed, evasion, armor (number),
    _displayFeats, allTraits, defenses, defenseBonuses, archetype.pow_abil, archetype.mart_abil.
    Keep: Everything in CharacterSaveData.
    Create EnrichedCharacter type extending CharacterSaveData for display-time data.
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/types/feats.ts
    - src/types/equipment.ts
    - src/types/archetype.ts
    - src/types/ancestry.ts
  acceptance_criteria:
    - Character type has no redundant fields
    - CharacterSaveData is the source of truth for persistence
    - EnrichedCharacter type exists for display-time data
    - npm run build passes with no type errors

- id: TASK-219
  title: "Portrait storage - move from base64 blob to Supabase Storage URL"
  priority: medium
  status: done
  notes: |
    Character creator finalize step now uploads portrait to Supabase Storage via /api/upload/portrait
    after character creation, saving URL instead of base64. Flow: base64 kept in draft for preview →
    strip from initial save → create character → upload blob to Storage → update with URL.
    Character sheet already used Storage. Old base64 portraits still display (backward compat
    via src attribute accepting both data: URIs and URLs).
  created_at: 2026-02-11
  created_by: agent
  description: |
    Character portraits saved as full base64 JPEG data URIs inside the JSON blob (5-50KB each).
    Change to upload to Supabase Storage bucket (portraits/{userId}/{characterId}.jpg),
    save only the URL. On display, load from URL. On change, delete old file.
    Backward compat: if portraitUrl starts with data:, treat as legacy base64.
  related_files:
    - src/stores/character-creator-store.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/lib/supabase/
  acceptance_criteria:
    - New portraits uploaded to Supabase Storage, URL saved on character
    - Character sheet loads portrait from URL
    - Old base64 portraits still display (backward compat)
    - Portrait change deletes old file from storage
    - npm run build passes

- id: TASK-220
  title: "Data migration script - convert existing characters from old schema to lean"
  priority: medium
  status: done
  notes: |
    Created scripts/migrate-characters-lean.js. Supports --dry-run for preview.
    Migrates: health/energy ResourcePool → currentHealth/currentEnergy, health_energy_points →
    healthPoints/energyPoints, species → ancestry.name, strips archetype/ancestry/feats/powers/
    techniques/equipment/skills to lean format, removes legacy display-only fields (allTraits,
    _displayFeats, speciesTraits, etc.) and derived combat stats (speed, evasion, armor).
    Idempotent — already-lean characters pass through unchanged.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a migration script (scripts/migrate-characters-lean.js) that reads all characters
    from Prisma, transforms old format to lean format (extract speciesId, archetypeId,
    convert skills/feats/powers/techniques/equipment to ID-based format, extract currentHealth/
    currentEnergy, remove redundant/derived fields), writes back, and logs a report.
    Run in dry-run mode first. Must be idempotent (safe to run multiple times).
  related_files:
    - scripts/
    - prisma/schema.prisma
    - src/types/character.ts
  acceptance_criteria:
    - Migration script exists and runs successfully
    - Handles all known old field formats (legacy vanilla, current format)
    - Dry-run mode shows what would change without writing
    - Idempotent (safe to run multiple times)
    - All existing characters survive migration without data loss
    - npm run build passes


# =====================================================================
# ADMIN CORE RULES — Database-Driven Game Configuration
# =====================================================================
#
# Context: All game rules/constants (progression values, combat stats,
# archetype configs, conditions, sizes, rarities, etc.) are currently
# hardcoded in constants.ts, creator-constants.ts, and formulas.ts.
# During alpha/playtesting, these values change frequently. They need
# to live in Supabase so an admin can edit them without code deploys.
#
# Architecture:
# - New codex.core_rules table (same pattern as other codex tables)
# - Category-based rows: each category (progression, combat, archetypes,
#   conditions, sizes, rarities, etc.) is one row with id + data JSON
# - useGameRules() React hook loads all rules with React Query caching
# - Formulas read from the hook (with constants.ts fallback during migration)
# - Admin UI adds a "Core Rules" section to /admin with sub-tabs
# - Server actions follow the existing codex action pattern
#
# Dependency: Core Rules DB (TASK-221-223) should be completed BEFORE
# the formula centralization (TASK-201/233/234), since the centralized
# formulas should read from the DB rather than hardcoded constants.
# Admin UI tabs (TASK-225-232) can be built in parallel with lean schema.
# =====================================================================

- id: TASK-221
  title: "Design: Core rules DB schema and data categories"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-review]
  description: |
    Design the database schema for storing all configurable game rules. The schema should:
    1. Follow the existing codex pattern (id: String PK, data: Json) in the codex schema
    2. Use a single core_rules table with category-based rows
    3. Each row represents a rules category with a well-defined JSON structure
    Proposed categories (each becomes one DB row and one admin tab):
    a) PROGRESSION_PLAYER: Base ability points (7), ability points per 3 levels (1),
       skill points per level (3), base HP/EN pool (18), HP/EN per level (12),
       base proficiency (2), proficiency per 5 levels (1), base training points (22),
       TP per-level multiplier (2), base health (8), XP-to-level formula (level*4),
       starting currency (200)
    b) PROGRESSION_CREATURE: Skill points at L1 (5), skill points per level (3),
       base HP/EN pool (26), base training points (22), TP per level (2) — same as characters,
       base feat points (1.5), base currency (200), currency growth rate (1.45)
    c) ABILITY_RULES: Min (-2), max starting (3), hard cap characters (10),
       hard cap creatures (20), no level cap, cost increase threshold (4 — cost doubles at 4+),
       standard arrays, max total negative (-3)
    d) ARCHETYPES: Power/Powered-Martial/Martial configs (feat limit, armament max,
       innate energy, starting proficiencies, training point bonus), plus archetype
       progression rules (milestone start level, interval, innate scaling, etc.)
    e) COMBAT: Base speed (6), base evasion (10), base defense (10), AP per round (4),
       action costs (basic=2, quick=1, etc.), multiple action penalty (-5),
       critical hit threshold (+10), natural 20/1 bonuses (+2/-2), ranged penalties
    f) SKILLS_AND_DEFENSES: Max skill value (3), defense bonus max, gain proficiency
       cost, increase past cap cost (base=3, sub=2), defense increase cost (2 SP),
       species skills count (2), unproficient rules (half/double-negative)
    g) CONDITIONS: Full condition list from core rulebook (13 standard + 10 leveled).
       Each condition: name, description, leveled flag, effect formula/text.
       Standard: Blinded, Charmed, Restrained, Dazed, Deafened, Dying, Faint, Grappled,
       Hidden, Immobile, Invisible, Prone, Terminal.
       Leveled: Bleed, Exhausted (death at 11+), Exposed, Frightened, Staggered,
       Resilient, Slowed, Stunned (min 1 AP), Susceptible, Weakened.
       Include stacking rules: conditions don't stack, stronger replaces weaker.
    h) SIZES: Size categories with height range, spaces, base carry, per-STR carry,
       min carry, speed modifier, size modifier
    i) RARITIES: Rarity tiers with name, currency min/max, color/style
    j) DAMAGE_TYPES: Flat list of all types (no physical/magic split), armor exception
       types (Psychic, Spiritual, Sonic), levels-by-rarity reference table
    k) RECOVERY: Partial recovery increments, fractions, full recovery duration,
       without-full-recovery penalty rules
    l) EXPERIENCE: XP to level, skill encounter XP, combat XP formulas
    m) ARMAMENT_PROFICIENCY: The martial prof -> armament prof max lookup table
    Owner should review and confirm category groupings and which values to include.
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
    - prisma/schema.prisma
  acceptance_criteria:
    - Written design document specifying each category, its JSON shape, and all included values
    - Owner confirms the category groupings are correct
    - Prisma model definition is drafted (codex.core_rules table)
    - npm run build passes (design doc only, no code changes yet)
  notes: |
    Completed 2026-02-11: Design approved by owner. 13 categories defined: PROGRESSION_PLAYER,
    PROGRESSION_CREATURE, ABILITY_RULES, ARCHETYPES, ARMAMENT_PROFICIENCY, COMBAT,
    SKILLS_AND_DEFENSES, CONDITIONS, SIZES, RARITIES, DAMAGE_TYPES, RECOVERY, EXPERIENCE.
    Full TypeScript types in src/types/core-rules.ts. Implementation in TASK-222/223/224.

- id: TASK-222
  title: "Create Prisma model + migration for core_rules table"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add the core_rules table to the Prisma schema following the existing codex pattern:
    - Model: CoreRules in the codex schema
    - Fields: id (String PK), data (Json), updatedAt (DateTime?)
    - RLS: SELECT for public (read by all), no INSERT/UPDATE/DELETE (admin via service role)
    - Add to CodexCollection type in actions.ts
    - Add server actions (createCoreRule, updateCoreRule) or extend existing codex actions
    - Run prisma migrate to create the table
    - Add RLS policy to supabase-rls-policies.sql
  related_files:
    - prisma/schema.prisma
    - prisma/supabase-rls-policies.sql
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - CoreRules model exists in Prisma schema
    - Migration runs successfully
    - RLS policies allow public read, admin-only write (via service role)
    - Server actions support CRUD for core_rules
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added CoreRules model to prisma/schema.prisma (codex.core_rules table).
    Created table via SQL (prisma db execute). Added RLS policy (public SELECT, service role write).
    Extended CodexCollection type and getCodexDelegates in admin actions.ts. Added coreRules to
    /api/codex response. Prisma client generated successfully.

- id: TASK-223
  title: "Seed core_rules table with current hardcoded values"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a seed script that populates the core_rules table with all current values from
    constants.ts, creator-constants.ts, and formulas.ts. This is the migration bridge - after
    seeding, the DB contains exactly the same values as the code, so behavior is unchanged.
    Script should:
    1. Read all current constants
    2. Organize into the category structure defined in TASK-221
    3. Insert rows into core_rules table
    4. Be idempotent (upsert pattern)
    5. Include values from GAME_RULES.md that are not yet in code (size table, rarity ranges,
       condition definitions, recovery rules, experience formulas, etc.)
  related_files:
    - scripts/seed-to-supabase.js
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Seed script creates all core_rules rows with correct data
    - Every value from constants.ts and creator-constants.ts is present in the DB
    - Values from GAME_RULES.md not yet in code are also seeded
    - Script is idempotent (safe to run multiple times)
    - npm run build passes
  notes: |
    Completed 2026-02-11: Created scripts/seed-core-rules.js with all 13 categories. Uses
    prisma.coreRules.upsert for idempotent seeding. Successfully seeded all categories to
    Supabase. Data sourced from constants.ts, creator-constants.ts, GAME_RULES.md, and
    core_rulebook_extracted.txt. Run: node scripts/seed-core-rules.js

- id: TASK-224
  title: "Create useGameRules() hook - loads core rules from DB with fallback"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a React hook and API route for loading core rules from the database:
    1. API route: GET /api/core-rules - fetches all rows from core_rules table
    2. React hook: useGameRules() - React Query with long staleTime (rules change rarely)
    3. Returns typed objects for each category (progression, combat, archetypes, etc.)
    4. Fallback: if DB is empty or fetch fails, fall back to constants.ts values
    5. Provider component: GameRulesProvider wraps the app, provides rules via context
    6. Helper: getGameRules() for server components / non-React contexts
    This hook replaces direct imports of constants.ts throughout the app. During migration,
    both paths coexist - the hook returns DB values if available, constants.ts otherwise.
    Consider caching strategy: rules change rarely, so aggressive caching is appropriate.
    React Query staleTime of 5-10 minutes with background refetch is a good default.
  related_files:
    - src/hooks/use-game-rules.ts (new)
    - src/app/api/core-rules/route.ts (new)
    - src/lib/game/constants.ts
  acceptance_criteria:
    - useGameRules() hook exists and returns typed rule objects
    - API route fetches from core_rules table
    - Fallback to constants.ts when DB values are unavailable
    - GameRulesProvider exists and wraps the app
    - React Query caching with appropriate staleTime
    - npm run build passes
  notes: |
    Completed 2026-02-11: Created src/hooks/use-game-rules.ts and src/types/core-rules.ts.
    Hook uses React Query with 10min staleTime, 1hr gcTime. Fetches from /api/codex (piggybacks
    on existing codex endpoint which now includes coreRules). Full fallback to hardcoded constants
    when DB is unavailable. getGameRulesFallback() exported for server/non-React use.
    Skipped GameRulesProvider (not needed — React Query handles caching globally).

- id: TASK-225
  title: "Admin Core Rules page - Progression tab (Player & Creature)"
  priority: high
  status: done
  notes: |
    Created /admin/core-rules page with Progression tab showing all player character
    progression values (15 fields) and creature progression values (14 fields).
    Creature progression saved independently as PROGRESSION_CREATURE category.
    Live level 1-10 preview table updates in real-time as values change.
    All values editable with Save to core_rules table via existing codex actions.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add a Core Rules section to the admin area with the first tab: Progression.
    This tab shows and allows editing of:
    PLAYER PROGRESSION:
    - Base ability points, ability points per N levels, interval (N)
    - Skill points per level
    - Base HP/EN pool, HP/EN per level
    - Base proficiency, proficiency per N levels, interval
    - Base training points, TP per-level multiplier
    - Base health (8)
    - Starting currency
    CREATURE PROGRESSION:
    - Skill points per level (creature)
    - Base HP/EN pool (creature)
    - Base training points, TP per level
    - Base feat points, feat points per level
    - Base currency, currency growth rate
    UI should show current values in editable inputs, with a Save button.
    Follow existing admin tab patterns (GridListRow, Modal, server actions).
    Show a preview of level 1-10 progression table based on current values.
  related_files:
    - src/app/(main)/admin/page.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Core Rules page accessible from admin dashboard
    - Progression tab shows all player and creature progression values
    - Values are editable and save to core_rules table
    - Level 1-10 preview table updates live as values are changed
    - npm run build passes

- id: TASK-226
  title: "Admin Core Rules page - Combat & Scores tab"
  priority: high
  status: done
  notes: |
    Combat tab with base speed/evasion/defense, AP, multiple action penalty, crit threshold,
    natural 20/1 bonuses, range penalties, and editable action costs table. All saved to COMBAT category.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for combat rules:
    - Base speed, base evasion, base defense
    - AP per round, action costs (basic, quick, free, long3, long4, movement, etc.)
    - Multiple action penalty
    - Critical hit threshold, critical hit multiplier
    - Natural 20 bonus, Natural 1 penalty
    - Ranged close penalty, ranged long penalty
    - Score base (10 + Bonus pattern)
    - Obscurity modifiers table
    - Damage modifier rules (Resistance/Vulnerability/Immunity text)
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All combat values are editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-227
  title: "Admin Core Rules page - Archetypes tab"
  priority: high
  status: done
  notes: |
    Archetypes tab with progression rules (martial bonus feats base/interval/start, P-M milestone
    interval/start, proficiency increase interval) and per-archetype config cards (power/powered-martial/
    martial) showing feat limit, armament max, innate energy/threshold/pools, TP bonus.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for archetype configuration:
    - Per-archetype: feat limit, armament max, innate energy, martial prof, power prof, TP bonus
    - Archetype progression rules: milestone start level, interval, innate scaling per milestone,
      feat scaling per milestone
    - Armament proficiency lookup table (martial prof -> armament max)
    - Innate threshold/pools base values and scaling rules
    Each archetype (Power, Powered-Martial, Martial) shown as an editable card/section.
    Armament proficiency as an editable lookup table.
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All three archetype configs are editable
    - Archetype progression rules are editable
    - Armament proficiency table is editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-228
  title: "Admin Core Rules page - Conditions tab (with definitions)"
  priority: high
  status: done
  notes: |
    Conditions tab showing standard and leveled conditions with editable names and descriptions.
    Add/remove buttons for both standard and leveled conditions.
    Stacking rules editable as text. Counts displayed for each category.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for conditions:
    - Full list of conditions (currently 22 in creator-constants.ts)
    - Each condition has: name, description/effect text, leveled flag, recovery rules
    - Leveled conditions: formula description (e.g., Bleed = 1 HP/turn per level)
    - Add/remove conditions
    - This replaces the hardcoded CONDITIONS array in creator-constants.ts
    The conditions data serves multiple purposes: character sheet conditions tracking,
    creature creator condition assignment, power/technique condition application.
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All conditions are listed with editable name, description, leveled flag
    - Can add new conditions, remove existing ones
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-229
  title: "Admin Core Rules page - Sizes & Carrying Capacity tab"
  priority: medium
  status: done
  notes: |
    Sizes tab with fully editable table: label, height, spaces, base carry, per-STR carry, min carry.
    Add/remove size categories. Half-capacity penalty editable.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for size categories:
    - Full size table from GAME_RULES: Miniscule through Gargantuan (8 sizes)
    - Each size: name, height range, spaces occupied, base carry, per-STR carry, min carry
    - Speed/size modifiers per size
    - Half-capacity movement penalty rule
    - Currently creator-constants.ts only has 6 sizes (Tiny-Gargantuan) with modifiers
      but no carrying capacity - GAME_RULES has 8 sizes with full carrying table
    - Unify and make comprehensive
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All 8 size categories from GAME_RULES are present and editable
    - Carrying capacity values per size are editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-230
  title: "Admin Core Rules page - Rarities & Currency tab"
  priority: medium
  status: done
  notes: |
    Rarities tab with fully editable table: name, level min/max, currency min/max.
    Add/remove rarity tiers. All fields editable inline.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for rarity tiers:
    - 7 tiers: Common through Ascended
    - Each tier: name, currency min, currency max, display color/style
    - Starting character currency
    - Currently RARITY_COLORS exists in creator-constants.ts but currency ranges are
      only in GAME_RULES.md - unify into one editable data source
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All rarity tiers are listed with editable name, currency range, color
    - Starting currency is editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-231
  title: "Admin Core Rules page - Ability Scores tab"
  priority: medium
  status: done
  notes: |
    Ability Scores tab with limits (min, max starting, max char/creature), cost threshold,
    normal/increased cost, max total negative. Standard arrays editor with per-value editing
    and add/remove arrays.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for ability score rules:
    - Min score, max at creation, max level-up, max hard cap
    - Cost increase threshold and cost values (below/above threshold)
    - Standard arrays (Basic, Skewed, Even)
    - Max total negative adjustments at creation
    - Randomized method rules (1d8-4, seven times, remove lowest, sum 6-8)
    - Ability increase cost per level-up
  related_files:
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All ability score rules are editable
    - Standard arrays are editable (add/remove/modify)
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-232
  title: "Admin Core Rules page - Skills, Recovery, Experience, Damage Types tabs"
  priority: medium
  status: done
  notes: |
    Skills & Defenses tab: max skill value, past-cap costs, defense cost, species skills, proficiency cost.
    Recovery tab: partial/full recovery details, requirements, without-full-recovery rules.
    Experience tab: XP formula, combat/skill encounter XP, DS, successes, divide rules.
    Damage Types tab: add/remove types, armor exceptions toggleable by click, note editable.
    Armament Proficiency tab: martial prof → armament max table with inline editing, add/remove rows.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Remaining admin tabs for core rules:
    SKILLS AND DEFENSES:
    - Max skill value per skill, defense bonus max
    - Proficiency costs (gain base, gain sub, increase past cap base/sub, defense cost)
    - Species skills count
    - Help die table
    RECOVERY:
    - Partial recovery increments (2h, 4h, 6h)
    - Recovery fraction per increment
    - Full recovery duration
    - Without-full-recovery penalty
    EXPERIENCE:
    - XP to level formula
    - Skill encounter XP formula
    - Combat XP formula
    DAMAGE TYPES:
    - Physical types list, Magic types list, All types list
    - Armor exception types (Psychic, Spiritual, Sonic)
    - Area of effect types
    - Die sizes
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All skills/defense rules are editable
    - Recovery rules are editable
    - Experience formulas are editable
    - Damage type lists are editable (add/remove types)
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-233
  title: "Refactor formulas.ts to read from useGameRules() instead of constants.ts"
  priority: high
  status: done
  notes: |
    All ~35 exported functions in formulas.ts now accept an optional `rules?: Partial<CoreRulesMap>`
    parameter. When provided, DB values are used; otherwise constants.ts fallbacks apply.
    Covers: calculateAbilityPoints, calculateSkillPointsForEntity, calculateHealthEnergyPool,
    calculateProficiency, calculateTrainingPoints, calculateCreatureTrainingPoints,
    calculateCreatureFeatPoints, calculateCreatureCurrency, calculateMaxArchetypeFeats,
    getAbilityIncreaseCost, canIncreaseAbility, canDecreaseAbility, getArchetypeConfig,
    getArmamentMax, calculateArmamentProficiency, calculateBaseInnateThreshold,
    calculateBaseInnatePools, calculateBonusArchetypeFeats, getArchetypeMilestoneLevels,
    calculateArchetypeProgression, getArchetypeFeatLimit, getInnateEnergyMax, getBaseHealth.
    Zero new TypeScript errors — all existing call sites work unchanged (optional param).
  created_at: 2026-02-11
  created_by: agent
  description: |
    Refactor all functions in formulas.ts to accept rule values as parameters rather than
    importing from constants.ts directly. This decouples the formulas from hardcoded values.
    Pattern:
    - Each formula function gains an optional rules parameter
    - If rules parameter is provided, use those values
    - If not provided, fall back to constants.ts (backward compat during migration)
    - Helper: resolveRules(rules?) that merges provided rules with constants.ts defaults
    Functions to refactor (with their hardcoded values):
    - calculateSkillPointsForEntity: 3/5 per level -> from rules
    - calculateCreatureFeatPoints: 1.5 base -> from rules
    - calculateArmamentProficiency: lookup table -> from rules
    - calculateBaseInnateThreshold/Pools: 8/2 base, 4/3 interval -> from rules
    - calculateBonusArchetypeFeats: 2 base, 4/3 interval -> from rules
    - getArchetypeMilestoneLevels: 4/3 start/interval -> from rules
    - calculateArchetypeProgression: 6/1/1 mixed base -> from rules
    - getBaseHealth: 8 base health -> from rules
    - getCharacterMaxHealthEnergy: 8 base health -> from rules
    Also extract the 30+ hardcoded values identified in the audit into the rules object.
  related_files:
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
    - src/hooks/use-game-rules.ts
  acceptance_criteria:
    - All formula functions accept optional rules parameter
    - No hardcoded game values remain in formula function bodies
    - Fallback to constants.ts when rules not provided
    - All call sites updated (or use the fallback path)
    - npm run build passes

- id: TASK-234
  title: "Refactor calculations.ts to read from useGameRules() instead of constants.ts"
  priority: high
  status: done
  notes: |
    All ~11 exported functions in calculations.ts now accept an optional `rules?: Partial<CoreRulesMap>`
    parameter. calculateDefenses uses rules.COMBAT.baseDefense, calculateSpeed/calculateEvasion use
    rules.COMBAT.baseSpeed/baseEvasion, calculateMaxHealth uses rules.PROGRESSION_PLAYER.baseHealth,
    calculateAllStats/computeMaxHealthEnergy pass rules through. getSpeedBase/getEvasionBase use rules
    as fallback. Zero new TypeScript errors.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Same pattern as TASK-233 but for calculations.ts:
    - calculateDefenses: BASE_DEFENSE from rules
    - calculateSpeed: BASE_SPEED from rules
    - calculateEvasion: BASE_EVASION from rules
    - calculateMaxHealth: 8 (base health) from rules
    - calculateMaxEnergy: already parameterized, verify
    - calculateBonuses: unproficient multiplier/divisor from rules
    Also update character-sheet-utils.ts (which should already call calculations.ts
    after TASK-201) to pass rules through.
  related_files:
    - src/lib/game/calculations.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/hooks/use-game-rules.ts
  acceptance_criteria:
    - All calculation functions accept optional rules parameter
    - BASE_SPEED, BASE_EVASION, BASE_DEFENSE, base health come from rules
    - Fallback to COMBAT_DEFAULTS when rules not provided
    - npm run build passes

- id: TASK-235
  title: About page — dice carousel redesign (center, 7 dice, wrap, no brackets)
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Redesign About page dice carousel: remove brackets around selected die; center carousel horizontally below content; order d10, d12, d20, d4, d6, d8, d10 with d4 center on load; cycle so selected die stays center (leftmost moves right on next); add second d10 slide "Join the Community" with Discord link and core-rules language.
  related_files:
    - src/app/(main)/about/page.tsx
  acceptance_criteria:
    - No ring/brackets on selected die; coloration and centering indicate selection
    - Carousel centered below content; 7 dice; wrap-around cycling
    - "Join the Community" slide with Discord and Core Rules links
  notes: "Done 2026-02-11. Seven dice (d10 twice), CENTER_INDEX 3 (d4), transform centering, bg highlight for selected, scale-x-[-1] for second d10."

- id: TASK-236
  title: Skill encounter — Successes UI, DS post-roll, RM bonus, additional success/failure
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Rename Progress to Successes; show net dots (failures cancel successes); add Additional Success / Additional Failure buttons; allow updating DS post-rolls (recompute participant results); add RM Bonus per participant; skill dropdown from codex; fix save/load consistency for rolls.
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/types/encounter.ts
  acceptance_criteria:
    - "Successes" section with net display (green or red dots only); Additional Success/Failure buttons
    - DS change recomputes all participant roll results; RM Bonus modifies effective roll
    - Skill dropdown (codex); RM Bonus input per participant
  notes: "Done 2026-02-11. SuccessFailureTracker net-only dots; additionalSuccesses/additionalFailures; recomputeParticipantRollsFromDs on DS change; rmBonus on SkillParticipant; ParticipantCard skill select + RM Bonus."

- id: TASK-237
  title: Combat tracker — surprised checkbox, initiative select-all, delete turn, auto-sort
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add surprised checkbox on combatant list items; initiative edit auto-select value for overwrite; when combatant deleted do not advance turn; re-sort initiative at start of each round (optional Auto Sort Initiative toggle); keep Sort Initiative in top bar when combat active.
  related_files:
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
    - src/types/encounter.ts
  acceptance_criteria:
    - Surprised checkbox on each CombatantCard; initiative input select-all on focus
    - removeCombatant adjusts currentTurnIndex so turn does not advance
    - nextTurn re-sorts at round start when autoSortInitiative; Sort Initiative always visible; Auto Sort checkbox
  notes: "Done 2026-02-11. CombatantCard surprised checkbox + initiative ref/useEffect select; removeCombatant buildSorted + newTurnIndex; nextTurn round-start sort when autoSortInitiative; Encounter.autoSortInitiative."

# =====================================================================
# INTEGRATED EXECUTION ORDER
# =====================================================================
#
# This section defines the recommended execution order for ALL tasks
# from both the Lean Schema audit and the Core Rules Admin feature.
# Tasks are grouped into tiers by dependency.
#
# TIER 0: OWNER INPUT REQUIRED (blockers)
# These tasks need human decisions before they can proceed.
# Mark them, work on non-blocked tasks in parallel.
#   - TASK-221  : Core rules DB categories (owner reviews groupings)
#   NOTE: TASK-195 CANCELLED (code correct, GAME_RULES.md was wrong — fixed)
#   NOTE: TASK-198, TASK-199 owner-resolved — moved to TIER 1
#
# TIER 1: BUG FIXES (no dependencies, start immediately)
#   - TASK-198  : Fix game constants (ability caps, damage types, Staggered, ice naming)
#   - TASK-199  : Fix feat slot formulas
#   - TASK-196  : maxHealth archetype ability bug
#   - TASK-197  : Creator hardcoded health/energy
#   - TASK-199b : SAVEABLE_FIELDS missing fields
#
# TIER 2: DESIGN (parallel design work, no code dependencies)
#   - TASK-200  : CharacterSaveData type definition
#   - TASK-221  : Core rules DB schema design (needs owner review)
#
# TIER 3: CORE RULES DB FOUNDATION (depends on TASK-221)
#   - TASK-222  : Prisma model + migration
#   - TASK-223  : Seed DB with current values
#   - TASK-224  : useGameRules() hook
#
# TIER 4: CENTRALIZE CALCULATIONS (depends on TASK-224, TASK-196, TASK-197)
#   - TASK-201  : Centralize all stat calculations
#   - TASK-233  : Refactor formulas.ts for DB rules
#   - TASK-234  : Refactor calculations.ts for DB rules
#   - TASK-202  : Unify defense fields (defenseVals only)
#
# TIER 5: ADMIN CORE RULES UI (depends on TASK-222/223/224, parallel with Tier 6)
#   - TASK-225  : Progression tab
#   - TASK-226  : Combat & Scores tab
#   - TASK-227  : Archetypes tab
#   - TASK-228  : Conditions tab
#   - TASK-229  : Sizes & Carrying Capacity tab
#   - TASK-230  : Rarities & Currency tab
#   - TASK-231  : Ability Scores tab
#   - TASK-232  : Skills, Recovery, Experience, Damage Types tabs
#   NOTE: TASK-198 and TASK-199 are now owner-resolved and in TIER 1 (no longer blocked)
#
# TIER 6: LEAN CREATOR (depends on Tier 4)
#   - TASK-203  : Species as speciesId
#   - TASK-204  : Archetype as archetypeId
#   - TASK-205  : Feats as IDs
#   - TASK-206  : Powers as {id, innate}
#   - TASK-207  : Techniques as {id}
#   - TASK-208  : Skills as Record<id, {prof,val}>
#   - TASK-209  : Equipment as inventory with IDs
#   - TASK-210  : Lean health/energy
#
# TIER 7: LEAN SHEET (depends on Tier 6)
#   - TASK-211  : Sheet loads feats by ID
#   - TASK-212  : Sheet loads powers/techniques by ID
#   - TASK-213  : Sheet loads equipment by ID
#   - TASK-214  : Sheet derives skills from codex
#   - TASK-215  : Sheet derives all computed stats
#
# TIER 8: FINAL CLEANUP (depends on all above)
#   - TASK-216  : Unify enrichment pipeline
#   - TASK-217  : Update cleanForSave
#   - TASK-218  : Remove redundant Character fields
#   - TASK-219  : Portrait to Supabase Storage
#   - TASK-220  : Data migration script
# =====================================================================
