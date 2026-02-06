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
  notes: "DONE 2026-02-06: Created ImageUploadModal (react-easy-crop) with drag-and-drop, zoom slider, canvas crop. Rect crop (3:4) for character portrait in sheet-header.tsx. Round crop (1:1) for profile picture in my-account page. Uploads to Firebase Storage. Exported from shared/index.ts."

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