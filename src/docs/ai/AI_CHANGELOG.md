# AI Change Log

Append-only log. Agents must add an entry for each PR/merge.

- 2026-02-06 | agent:cursor | Session: Reconciliation tasks TASK-078 through TASK-089 | files: dice-roller.tsx, library-section.tsx, unified-selection-modal.tsx, add-skill-modal.tsx, add-sub-skill-modal.tsx, LoadFromLibraryModal.tsx, resources/page.tsx, notes-tab.tsx, button.tsx, globals.css, recovery-modal.tsx, skill-row.tsx, grid-list-row.tsx, archetype-section.tsx, tab-summary-section.tsx, innate-toggle.tsx, ability-score-editor.tsx, ancestry-step.tsx, feats-step.tsx, equipment-step.tsx, codex/page.tsx, power-creator/page.tsx, technique-creator/page.tsx, item-creator/page.tsx, characters/[id]/page.tsx, proficiencies-tab.tsx, filter-section.tsx, creature-stat-block.tsx, list-components.tsx, AI_TASK_QUEUE.md | TASKs: TASK-078, TASK-079, TASK-080, TASK-081, TASK-082, TASK-083, TASK-084, TASK-085, TASK-086, TASK-087, TASK-088, TASK-089 | Summary:
  - TASK-078: Dice roller uses custom PNGs; die type selection with images + labels; DieResultDisplay for roll results
  - TASK-079: Weapon columns include Attack bonus (+N Abbr)
  - TASK-080: Unified Selection Modal "Add" header replaced with empty slot
  - TASK-081: Add Skill/Sub-Skill modals use ListHeader + sort; item count removed from sub-skill
  - TASK-082: LoadFromLibraryModal footer (item count) removed
  - TASK-083: Button gradients removed (resources, notes-tab); deprecated gradient variant removed
  - TASK-084: Dark mode pass — recovery-modal, skill-row, grid-list-row, archetype-section, tab-summary-section, notes-tab, library-section, innate-toggle, ability-score-editor, ancestry/feats/equipment steps, codex
  - TASK-085: Power/technique/item creator summaries sticky (top-24, max-h)
  - TASK-086: Full recovery only resets feats with Full/Partial recovery; one-time-use preserved
  - TASK-087: Unused Chevron imports removed from library-section, proficiencies-tab
  - TASK-088: Chevron layout shift fixed — filter-section, creature-stat-block, list-components use single icon + rotation
  - TASK-089: LoadFromLibraryModal uses GridListRow, ListHeader, sortable columns
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-074, TASK-075 — Dark mode + session API | files: globals.css, list-header.tsx, grid-list-row.tsx, value-stepper.tsx, sheet-header.tsx, server.ts, SECRETS_SETUP.md, AI_TASK_QUEUE.md | TASKs: TASK-074, TASK-075 | Summary:
  - TASK-074: Dark mode — softer chip, stepper, ListHeader, GridListRow, health/energy, power/martial colors; CSS vars for status colors
  - TASK-075: Added GOOGLE_APPLICATION_CREDENTIALS_JSON support for full service account JSON from Secret Manager
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-072, TASK-073, TASK-076, TASK-077 — Character sheet + storage + username | files: characters/[id]/page.tsx, sheet-header.tsx, storage.rules, my-account/page.tsx, AI_TASK_QUEUE.md, ALL_FEEDBACK_CLEAN.md | TASKs: TASK-072, TASK-073, TASK-076, TASK-077 | Summary:
  - TASK-072: Health/Energy allocation — when increasing max and current===max, bump current by same delta
  - TASK-073: Speed/Evasion — pencil icon toggles base edit; red when base>default, green when base<default
  - TASK-076: Storage rules — added portraits/{userId}/** and profile-pictures/{fileName} for authenticated users
  - TASK-077: Username pattern — changed to [-a-zA-Z0-9_]+ to fix invalid character class error
  - Build passes

- 2026-02-05 | agent:cursor | Session: Roll Log, Modals, Buttons — feedback implementation | files: roll-context.tsx, roll-log.tsx, abilities-section.tsx, skills-section.tsx, add-feat-modal.tsx, add-skill-modal.tsx, modal.tsx, roll-button.tsx, dice-roller.tsx, ALL_FEEDBACK_CLEAN.md | Summary:
  - Roll Log titles: Removed "Save"/"Check"; abilities/defenses use display name only (e.g. "Acuity", "Discernment"); skills use "Athletics (STR)" format
  - Roll Log layout: Single-row boxes (1d20 X + Bonus = Total); roll=light grey, bonus=green, total=blue; smaller timestamp
  - Modals: overflow-hidden for uniform rounded corners; add-feat uses ListHeader, removed Add column title; add-skill header rounded/inset
  - Buttons: RollButton, roll-log, dice-roller use solid colors (no gradients); matching btn-solid/btn-outline-clean style
  - Build passes

- 2026-02-05 | agent:cursor | Session: TASK-068, TASK-070 — Creature creator modals + summary | files: creature-creator/page.tsx, creator-summary-panel.tsx, AI_TASK_QUEUE.md | TASKs: TASK-068, TASK-070 | Summary:
  - TASK-068: Replaced ItemSelectionModal with UnifiedSelectionModal for powers/techniques/feats/armaments; GridListRow list with sortable columns
  - TASK-070: CreatorSummaryPanel resourceBoxes + lineItems; creature summary: resource boxes at top, stat rows, line items (Skills: X +3, Resistances: Y)

- 2026-02-05 | agent:cursor | Session: Creature creator + stepper tasks (TASK-065–071) | files: creature-creator/page.tsx, powered-martial-slider.tsx, grid-list-row.tsx, globals.css, abilities-section.tsx, AI_TASK_QUEUE.md | TASKs: TASK-065, TASK-066, TASK-067, TASK-069, TASK-071 | Summary:
  - TASK-065: Added enableHoldRepeat to creature creator HealthEnergyAllocator
  - TASK-066: Removed enableHoldRepeat from creature creator DefenseBlock
  - TASK-067: GridListRow expanded content — py-3/py-4 equal padding, description mb-3
  - TASK-069: PoweredMartialSlider min=1, max=maxPoints-1 when maxPoints>1; clamps on init
  - TASK-071: Defense steppers xs→sm; btn-stepper colors softened (red-50/green-50)
  - Build passes

- 2026-02-06 | agent:cursor | Session: TASK-064 — Game rules audit fixes | files: creature-stat-block.tsx, item-creator/page.tsx, creature-creator/page.tsx, encounter-tracker/page.tsx, GAME_RULES_AUDIT.md, AI_TASK_QUEUE.md | TASK: TASK-064 | Summary:
  - CreatureStatBlock: Realms ability order (STR, VIT, AGI, ACU, INT, CHA); legacy map for intellect/perception/willpower; grid-cols-6
  - Item creator: "ability score" → "Ability"
  - Creature creator + encounter-tracker: "Reflex" → "Reflexes"
  - Build passes

- 2026-02-06 | agent:cursor | Session: GAME_RULES workflow + audit | files: AGENTS.md, realms-tasks.mdc, AGENT_GUIDE.md, GAME_RULES_AUDIT.md, AI_TASK_QUEUE.md, README.md | Summary:
  - Added GAME_RULES.md to agent workflows: AGENTS.md (reference when needed), realms-tasks.mdc (before implementing + feedback cross-reference), AGENT_GUIDE.md (when to use)
  - Created GAME_RULES_AUDIT.md: audit of code vs Core Rulebook — terminology, descriptions, schema mismatches
  - Created TASK-064: Fix CreatureStatBlock ability schema (intellect/perception/willpower → acuity/intelligence/charisma), "ability score" → "Ability" in copy, Reflex → Reflexes

- 2026-02-05 | agent:cursor | Session: TASK-062, TASK-063 — Section heights and creature creator alignment | files: characters/[id]/page.tsx, creature-creator/page.tsx | TASKs: TASK-062, TASK-063 | Summary:
  - TASK-062: Added min-h-[400px] to Skills, Archetype, and Library section wrappers for uniform height when adjacent
  - TASK-063: Basic Info layout — Name/Level/Type/Size in single responsive row; Level w-20, Type w-36, Size w-28; items-end for alignment

- 2026-02-06 | agent:cursor | Session: Documentation overhaul — architecture, game rules, agent guide | files: ARCHITECTURE.md, GAME_RULES.md, AGENT_GUIDE.md, UI_COMPONENT_REFERENCE.md, DOCS_AUDIT_REPORT.md, README.md, UNIFICATION_STATUS.md, AGENTS.md, ALL_FEEDBACK_CLEAN.md | Summary:
  - Created ARCHITECTURE.md: Firebase structure, data flow, enrichment pipeline, hooks/services
  - Created GAME_RULES.md: Skill caps (3), defense caps, progression, ability costs, recovery rules
  - Updated AGENT_GUIDE: Common file path corrections, component decision tree, hooks table, character creator step order
  - Updated UI_COMPONENT_REFERENCE: Component decision tree (GridListRow vs ItemCard vs ItemList)
  - Updated DOCS_AUDIT_REPORT: Reflected resolved items, added new docs section
  - Updated README, UNIFICATION_STATUS, AGENTS.md, ALL_FEEDBACK_CLEAN with new doc references

- 2026-02-05 | agent:cursor | Session: TASK-049 — Sortable list headers in library-section | files: library-section.tsx | TASK: TASK-049 | Summary:
  - Library-section had clickable ListHeaders but data wasn't sorted
  - Added sortByCol helper and useMemo for all 6 lists (innate/regular powers, techniques, weapons, armor, equipment)
  - Clicking column headers now sorts the displayed data

- 2026-02-05 | agent:cursor | Session: TASK-053 — Feat deletion confirmation | files: characters/[id]/page.tsx, feats-tab.tsx, delete-confirm-modal.tsx | TASK: TASK-053 | Summary:
  - Added DeleteConfirmModal before feat removal on character sheet
  - FeatsTab onRemoveFeat now accepts (featId, featName) for modal display
  - Extended DeleteConfirmModal with deleteContext prop (library/character)
  - Clicking feat delete opens confirmation; Cancel closes, Confirm removes

- 2026-02-05 | agent:cursor | Session: TASK-054 — Agent verification guidelines | files: AGENT_GUIDE.md, AI_TASK_QUEUE.md | TASK: TASK-054 | Summary:
  - Added "Verification Before Marking Done" section to AGENT_GUIDE with 4-step checklist
  - Covers acceptance criteria, related_files paths, build, manual check
  - Marked TASK-054 done

- 2026-02-05 | agent:cursor | Session: Docs & task compliance audit | files: DOCS_AUDIT_REPORT.md, AI_TASK_QUEUE.md, AGENTS.md, AGENT_GUIDE.md, UNIFICATION_STATUS.md | Summary:
  - Created DOCS_AUDIT_REPORT.md with compliance findings
  - TASK-022: Added compliance gap note (missing confirmation dialog); created TASK-053
  - TASK-048: Marked done (already implemented)
  - Fixed stale related_files in TASK-016, TASK-027, TASK-030, TASK-031, TASK-032
  - Added TASK-053 (feat deletion confirmation), TASK-054 (agent verification guidelines)
  - Updated AGENTS.md, AGENT_GUIDE.md with verification steps

- 2026-02-05 | agent:cursor | Session: Cursor workflow optimization | files: .cursor/rules/*.mdc, AGENTS.md, src/docs/ai/AGENT_GUIDE.md, src/docs/UNIFICATION_STATUS.md, src/docs/README.md, equipment-step.tsx | Summary:
  - Created .cursor/rules/ with realms-project, realms-unification, realms-tasks rules
  - Created root AGENTS.md for Cursor agent instructions
  - Replaced AI_AGENT_README + AGENT_SOURCES_OF_TRUTH with single AGENT_GUIDE.md (verified against codebase)
  - Deleted AGENT_SESSION_PROMPT.md, TASK_CREATION_GUIDE.md (consolidated into AGENT_GUIDE)
  - Created UNIFICATION_STATUS.md with verified component usage from codebase audit
  - Fixed equipment-step.tsx: bg-gray-100 → bg-surface-alt for design token consistency
  - Added src/docs/README.md as docs index; updated AI_TASK_QUEUE, ALL_FEEDBACK_CLEAN references

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
