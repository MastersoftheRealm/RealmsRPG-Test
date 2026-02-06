# Agent Guide — Sources of Truth

Single reference for component locations, patterns, and where to record work. Verified against codebase (Feb 2026).

**Note:** When implementing a task, verify `related_files` in AI_TASK_QUEUE against the actual codebase — some entries may have been corrected; paths can become stale (e.g., `header-section.tsx` was replaced by `sheet-action-toolbar.tsx`).

## Verification Before Marking Done

Before marking a task `done`, verify:

1. **Acceptance criteria** — Every criterion is fully met. Do not mark done if any bullet is incomplete (e.g., "Confirmation dialog before deletion" means a dialog must exist).
2. **Related files** — Paths in the task's `related_files` match the actual codebase. Use file search or `list_dir` to confirm. Update the task if you correct paths during implementation.
3. **Build** — `npm run build` passes.
4. **Manual check** — For UI changes, spot-check in the browser if feasible.

If a task was marked done but a criterion was missed, create a follow-up task (e.g., TASK-053 for TASK-022's missing confirmation dialog).

## Common File Path Corrections

Task queue `related_files` may reference outdated paths. When implementing, prefer these verified paths:

| Stale / Wrong | Correct |
|--------------|---------|
| `header-section.tsx` | `sheet-action-toolbar.tsx` (character sheet actions) |
| `defenses-section.tsx` | Defenses are in `abilities-section.tsx` |
| `src/lib/constants/power-parts.ts` | `src/lib/game/creator-constants.ts` |
| `public/images/dice/` | Dice images in `public/images/` (D4.png, D6.png, etc.) |

## Components

| Category | Location | Notes |
|----------|----------|-------|
| UI primitives | `src/components/ui/` | Button, IconButton, Input, Select, Checkbox, Textarea, Modal, Chip, etc. |
| Shared patterns | `src/components/shared/` | GridListRow, SkillRow, ValueStepper, RollButton, PointStatus, SectionHeader |
| List utilities | `src/components/shared/list-components.tsx` | SearchInput, SortHeader, FilterSection, ResultsCount, EmptyState, LoadingState |
| Character sheet | `src/components/character-sheet/` | library-section, abilities-section, skills-section, feats-tab, modals |
| Creators | `src/components/creator/` | ability-score-editor, health-energy-allocator, creator-summary-panel |
| Filters | `src/components/shared/filters/` | TagFilter, CheckboxFilter, SelectFilter, AbilityRequirementFilter |

## Component Decision Tree (List/Selection UI)

| Use Case | Component | Notes |
|----------|-----------|-------|
| Powers, techniques, feats, equipment in lists | **GridListRow** | Sortable columns, leftSlot/rightSlot, expandable rows |
| Codex/Library browse, item cards | **ItemCard** / **ItemList** | Card layout, view/edit/duplicate/delete actions |
| Base-skill selector (add sub-skill) | **SelectionToggle** | Unique UX; not GridListRow |
| Species detail view, level-up wizard | Custom layouts | Justified exceptions |
| Add-feat, add-skill, add-library-item modals | **GridListRow** or **UnifiedSelectionModal** | Consistent list selection |

See `UI_COMPONENT_REFERENCE.md` for full component details.

## Key Files

| Purpose | File |
|---------|------|
| Design tokens | `src/app/globals.css` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character logic | `src/services/character-service.ts`, `src/hooks/use-characters.ts` |
| Creator state | `src/stores/character-creator-store.ts` |
| Firebase | `src/lib/firebase/` |
| **Game rules** | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions; use when implementing validation, caps, tooltips, calculations |
| Architecture | `src/docs/ARCHITECTURE.md` |

## Hooks & Services

| Need | Hook / Service |
|------|----------------|
| Auth state | `useAuth` |
| User's characters | `useCharacters` |
| User's library (powers, techniques, items, creatures) | `useUserLibrary` |
| RTDB reference data (parts, skills, feats, species) | `useRTDB` |
| Character CRUD | `character-service.ts` (via useCharacters) |

**Enrichment:** Use `enrichPowers`, `enrichTechniques`, `enrichItems` from `data-enrichment.ts` when displaying character powers/techniques/items. Pass `powerPartsDb` / `techniquePartsDb` from `useRTDB()` for correct EN/TP costs. See `ARCHITECTURE.md`.

## Character Creator Step Order

1. Species → 2. Powers → 3. Skills → 4. Feats → 5. Archetype → 6. Ancestry → 7. Abilities → 8. Equipment → 9. Finalize

Steps live in `src/components/character-creator/steps/` (e.g., `species-step.tsx`, `abilities-step.tsx`).

## Pages / Routes

- `(main)/characters`, `(main)/characters/[id]`, `(main)/characters/new`
- `(main)/library` — user items (powers, techniques, armaments, creatures)
- `(main)/codex` — browse all content
- `(main)/power-creator`, `(main)/technique-creator`, `(main)/item-creator`, `(main)/creature-creator`
- `(main)/encounter-tracker`, `(main)/my-account`, `(main)/rules`, `(main)/privacy`, `(main)/terms`, `(main)/resources`
- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `(auth)/forgot-username`

## Shared Component Usage (Verified)

- **GridListRow** — Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator
- **SkillRow** — skills-section, skills-step, creature-creator
- **ValueStepper** — abilities-section, sheet-header, health-energy-allocator, dice-roller, number-stepper, encounter-tracker
- **SectionHeader** — feats-tab, proficiencies-tab, notes-tab, archetype-section
- **AddSubSkillModal** — Uses SelectionToggle (not GridListRow) — unique base-skill selector UX

## Recording Progress

| What | Where |
|------|-------|
| Tasks | `src/docs/ai/AI_TASK_QUEUE.md` |
| Changelog | `src/docs/ai/AI_CHANGELOG.md` |
| Raw feedback | `src/docs/ALL_FEEDBACK_CLEAN.md` |
| Game rules audit | `src/docs/GAME_RULES_AUDIT.md` — code vs. rulebook mismatches |

## Creating New Tasks

Use `src/docs/ai/AI_REQUEST_TEMPLATE.md` format. Add to `AI_TASK_QUEUE.md` with next TASK-### ID.
Create tasks when: audits reveal issues; implementation uncovers follow-up work; complex work needs phase breakdown.
Set `priority`, `status: not-started`, `related_files`, and clear `acceptance_criteria`.

## Scripts

- `node scripts/extract_feedback.js` — Convert raw feedback → tasks
- `node scripts/triage_tasks.js` — Infer related_files for tasks (--apply to update)
- `node scripts/session_submit.js "feedback..."` — Append feedback, extract, triage
- `node scripts/reconcile_tasks.js` — Verify TASK-### ↔ commits/PRs (CI runs this)
