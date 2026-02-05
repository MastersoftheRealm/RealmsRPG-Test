# AI Change Log

Append-only log. Agents must add an entry for each PR/merge.

- 2026-02-05 | agent:ai-copilot | Created AI docs skeleton | files: src/docs/ai/* | PR: 

- 2026-02-05 | agent:claude-opus | Session: UI fixes and new components | files: header.tsx, theme-provider.tsx, theme-toggle.tsx, powered-martial-slider.tsx, innate-toggle.tsx, grid-list-row.tsx, library-section.tsx, archetype-selector.tsx, archetype-section.tsx, layout.tsx | TASKs: TASK-005, TASK-009, TASK-011, TASK-013, TASK-014, TASK-015, TASK-016 | Summary:
  - TASK-011: Fixed login redirect (sessionStorage in header.tsx)
  - TASK-014: Replaced login icon with Button component
  - TASK-013: Added theme toggle (next-themes, ThemeProvider, ThemeToggle)
  - TASK-015: Created PoweredMartialSlider shared component
  - TASK-016: Audited stepper styles (already unified via ValueStepper)
  - TASK-005/TASK-009: Created InnateToggle with 44px touch target, updated GridListRow
  - TASK-012: Security audit complete (documented gaps: OAuth email change, username, profile pic)

- 2026-02-05 | agent:claude-opus | Session: Recovery Modal + Bug Fixes | files: recovery-modal.tsx, library-section.tsx, notes-tab.tsx, characters/[id]/page.tsx, use-rtdb.ts | TASKs: TASK-017, TASK-018, TASK-019 | Summary:
  - TASK-017: Created RecoveryModal with full/partial recovery modes, automatic optimization, HP/EN slider, feat/trait reset
  - TASK-018: Fixed negative weight/height by adding min=1 validation
  - TASK-019: Fixed inventory deletion by removing isEditMode requirement from delete buttons

- 2026-02-06 | agent:claude-opus | Session: RTDB Enrichment + Library Edit + Skill Unification + Audit | files: library/page.tsx, item-creator/page.tsx, skills-step.tsx, AI_TASK_QUEUE.md | TASKs: TASK-001, TASK-002, TASK-003, TASK-004, TASK-006, TASK-007, TASK-008, TASK-010 | Summary:
  - TASK-004/TASK-006: Fixed library page early return that blocked display while RTDB loaded (removed !partsDb.length check from PowersTab and TechniquesTab)
  - TASK-003: Added ?edit= URL parameter handling to item-creator with useSearchParams + Suspense wrapper; changed Edit button to use router.push for in-app navigation
  - TASK-001: Unified skill rows in character-creator skills-step.tsx - replaced inline SkillAllocator/SubSkillAllocator with shared SkillRow component (variant='card' for base skills, variant='compact' for sub-skills)
  - TASK-002: Audit complete - all list pages and modals already use unified patterns (GridListRow or ItemCard)
  - TASK-007/TASK-008/TASK-010: Marked as done (duplicates/related to completed tasks)

- 2026-02-05 | agent:claude-opus | Session: UI Polish - Edit Icons, Energy Buttons, Equip Toggle | files: edit-section-toggle.tsx, equip-toggle.tsx, sheet-header.tsx, library-section.tsx, characters/[id]/page.tsx, AI_TASK_QUEUE.md | TASKs: TASK-020, TASK-021, TASK-024, TASK-028, TASK-034 | Summary:
  - TASK-028: Verified ListHeader and SortHeader already use uppercase styling - all list headers display in caps
  - TASK-034: Fixed equip toggle bug - created EquipToggle component with Circle/CheckCircle2 icons; updated handlers to match by ID or name since equipment stored as {name, equipped} without ID
  - TASK-020: Removed circular backgrounds from EditSectionToggle; updated sheet-header name/XP icons to use Pencil with blue color for consistency
  - TASK-021: Character name only editable in edit mode (onNameChange conditionally passed based on isEditMode); XP always editable
  - TASK-024: Energy cost buttons for powers/techniques styled like RollButton - moved energy to rightmost column, displays just the number (not "Use (X)"), powers use blue variant, techniques use green

- 2026-02-05 | agent:claude-opus | Session: New Feedback Triage + TASK-028 | files: list-components.tsx, ALL_FEEDBACK_CLEAN.md, AI_TASK_QUEUE.md | TASKs: TASK-020 to TASK-037 created, TASK-028 partial | Summary:
  - Added 18 new tasks (TASK-020 to TASK-037) from owner feedback covering: edit icon unification, character name/XP editing, feat deletion, custom note collapse bug, energy buttons styling, innate energy text, power/technique display formatting, list header caps, column alignment, character saved prompt, top bar relocation, dice roller overhaul, chip expansion, equip toggle fix, equipment tab fixes, archetype ability indicators, ability edit centering
  - TASK-028: Updated SortHeader component to use uppercase, text-xs, font-semibold styling to match ListHeader

- 2026-02-06 | agent:claude-opus | Session: AI Workflow Enhancement - Dynamic Task Creation | files: AI_AGENT_README.md, AI_TASK_QUEUE.md, AGENT_SOURCES_OF_TRUTH.md, TASK_CREATION_GUIDE.md | Summary:
  - Updated AI workflow documentation to enable dynamic task creation during agent work sessions
  - Added "Create new tasks dynamically" section to AI_AGENT_README.md agent responsibilities
  - Added comprehensive "Creating new tasks dynamically" guidelines to AI_TASK_QUEUE.md with when/how/examples
  - Updated AGENT_SOURCES_OF_TRUTH.md workflow preferences to encourage immediate task creation during audits/investigations
  - Created TASK_CREATION_GUIDE.md - 300+ line comprehensive guide covering: philosophy, when to create tasks, how to create tasks, YAML examples, anti-patterns, workflow integration, benefits
  - Purpose: Prevent audit/review findings from being documented but not acted upon; enable agents to break down complex work, create follow-up tasks during implementation, and act on discoveries immediately

- 2026-02-05 | agent:claude-opus | Session: New Feedback + Quick Wins + Feat Deletion | files: abilities-section.tsx, sheet-header.tsx, skills-section.tsx, library-section.tsx, notes-tab.tsx, feats-tab.tsx, characters/[id]/page.tsx, ALL_FEEDBACK_CLEAN.md, AI_TASK_QUEUE.md | TASKs: TASK-022, TASK-023, TASK-025, TASK-038, TASK-040, TASK-042, TASK-043 + TASK-038-045 created | Summary:
  - Processed 8 new raw feedback entries → created TASK-038 through TASK-045
  - TASK-038: Removed enableHoldRepeat from ability/defense steppers (4 buttons in abilities-section.tsx); HP/EN and dice roller still have it
  - TASK-042: Separated species from level in header with · separator and font-medium
  - TASK-043: Hidden skill point display (PointStatus) when not in edit mode
  - TASK-025: Updated innate energy summary text + centered it
  - TASK-023: Fixed custom note name edit collapsing the note (stopPropagation on name click/input)
  - TASK-040: Capitalized Currency label, separated from armament proficiency with divider, increased tab size sm→md, changed defense roll buttons from 'defense' to 'primary' variant
  - TASK-022: Wired up feat deletion - added onRemoveFeat to LibrarySectionProps, passed through to FeatsTab, created handleRemoveFeat handler in page.tsx, removed isEditMode guard

- 2026-02-06 | agent:claude-opus | Session: High Priority Tasks + Medium Batch | files: skills-section.tsx, abilities-section.tsx, library-section.tsx, health-energy-allocator.tsx, characters/[id]/page.tsx, skills-step.tsx, creator-constants.ts, AI_TASK_QUEUE.md | TASKs: TASK-026, TASK-027, TASK-030, TASK-036, TASK-037, TASK-039, TASK-044, TASK-045 | Summary:
  - TASK-039: Implemented skill value cap (max 3) - added MAX_SKILL_VALUE constant, checks in handleSkillIncrease for both base and sub-skills, disabled increment button at max
  - TASK-044: Fixed skill point display from 5/5 to 3/3 - added characterSpeciesSkills lookup in page.tsx, subtract species count from total, exclude species proficiency from spent calculation in both page.tsx and skills-section.tsx, updated character creator to match
  - TASK-045: Unified HP/EN allocation inline variant to match card variant - replaced gradient bg with state-based borders (green/red/neutral), matching header/status bar structure
  - TASK-026: Added power display formatting - capitalize damage types, abbreviate durations (MIN/RNDS/RND/HR), "Target" for single target, strip parenthetical focus/sustain details from overview
  - TASK-036: Replaced emoji archetype indicators (🔮/⚔️) with colored borders - purple for power ability, red for martial, removed emoji labels from ability names
  - TASK-037: Centered ability/skill point displays in edit mode - switched from flex-wrap with spacer to flex-col items-center layout
  - TASK-030: Removed "Character saved" toast notification, kept only top bar save state indicator
  - TASK-027: Removed 'radiant' from selectable damage types in MAGIC_DAMAGE_TYPES and ALL_DAMAGE_TYPES, replaced with 'light' (proper Realms damage type), kept radiant→light mapping as legacy fallback

- 2026-02-06 | agent:claude-opus | Session: Polish Batch - Toolbar, Dice, Alignment, Equipment, Chips | files: sheet-action-toolbar.tsx, roll-log.tsx, roll-context.tsx, grid-list-row.tsx, library-section.tsx, characters/[id]/page.tsx, character-sheet/index.ts | TASKs: TASK-029, TASK-031, TASK-032, TASK-033, TASK-035 | Summary:
  - TASK-031: Created SheetActionToolbar floating component (fixed top-24 right-4) with Edit/Recovery/LevelUp/Save circular icon buttons; replaced sticky top bar in page.tsx
  - TASK-032: Rewrote roll-log with custom dice PNG images (D4-D20), localStorage persistence (last 20 rolls), grouped dice display with images, simplified to "Custom Roll" only, crit bonuses (+2 nat 20, -2 nat 1)
  - TASK-029: Added align prop to ColumnValue interface, restructured power/technique/weapon grid templates to match row slot layout, centered all data columns across all tabs
  - TASK-035: Added type column and rarity/cost badges to equipment rows, enabled quantity editing outside edit mode, added description prop and compact mode
  - TASK-033: Rewrote chip expansion to expand inline (same chip grows with description below label, maintaining category colors), tag chips non-expandable, removed separate detail bubble

Entry format (required fields on task completion):
- YYYY-MM-DD | agent-id | short summary | files: [comma-separated] | PR: <link-or-commit> | TASK: TASK-### | merged_at: YYYY-MM-DD

Policy: `pr_link` and `merged_at` must be present in the changelog entry and the corresponding `AI_TASK_QUEUE.md` task before marking a task `done`.
