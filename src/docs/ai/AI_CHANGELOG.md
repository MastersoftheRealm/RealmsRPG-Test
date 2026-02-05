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

Entry format (required fields on task completion):
- YYYY-MM-DD | agent-id | short summary | files: [comma-separated] | PR: <link-or-commit> | TASK: TASK-### | merged_at: YYYY-MM-DD

Policy: `pr_link` and `merged_at` must be present in the changelog entry and the corresponding `AI_TASK_QUEUE.md` task before marking a task `done`.
