# Agent Guide — Deep Reference (on demand)

**Not a session-start mandatory read.** Always-loadable core: [`ARCHITECTURE_CONSTITUTION.md`](ARCHITECTURE_CONSTITUTION.md). Open tasks: [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md). SoT map: root `AGENTS.md`.

Verified against codebase (Jun 2026+). Use this hub when you need component locations, list/selection patterns, art pipeline, or creator load rules — then open the matching appendix under [`guide/`](guide/).

> **First stop before building anything new:** [`FEATURE_INDEX.md`](FEATURE_INDEX.md) + barrels.  
> **Remediation status:** [`REMEDIATION_STATUS_2026-06.md`](REMEDIATION_STATUS_2026-06.md).  
> **History:** [`archive/HISTORY_INDEX.md`](archive/HISTORY_INDEX.md) — not current open work.

**Note:** When implementing a task, verify `related_files` in [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md) against the actual codebase — some entries may have been corrected; paths can become stale (e.g., `header-section.tsx` was replaced by `sheet-action-toolbar.tsx`).

## Table of contents (appendices)

| # | Topic | File |
|---|-------|------|
| 01 | Verification before `done`, design-system safety net, tokens, gotchas | [`guide/01-verification-and-ui-gates.md`](guide/01-verification-and-ui-gates.md) |
| 02 | Segmented toggles, decision tree, list modals, unified patterns | [`guide/02-components-and-lists.md`](guide/02-components-and-lists.md) |
| 03 | Entity card art, list thumbs, ExpandableImage | [`guide/03-entity-card-art.md`](guide/03-entity-card-art.md) |
| 04 | Floating UI, InfoTippy, selection grammar / chips | [`guide/04-floating-ui-tooltips.md`](guide/04-floating-ui-tooltips.md) |
| 05 | Key files, hooks & services | [`guide/05-key-files-and-hooks.md`](guide/05-key-files-and-hooks.md) |
| 06 | Character creators, load rules, layout, allocation UI | [`guide/06-creators-and-loadouts.md`](guide/06-creators-and-loadouts.md) |
| 07 | Database operations (MCP / Dashboard policy) | [`guide/07-database-operations.md`](guide/07-database-operations.md) |
| 08 | Routes, progress recording, mobile, tasks, scripts | [`guide/08-workflows-routes-and-progress.md`](guide/08-workflows-routes-and-progress.md) |

## Common File Path Corrections

Task `related_files` may reference outdated paths. When implementing, prefer these verified paths:

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
| Shared patterns | `src/components/shared/` | GridListRow, SkillRow, **ValueStepper** / Dec/Inc (ADR-0002; QuantitySelector wraps it), RollButton, PointStatus, SectionHeader, **SegmentedControl**, **UnifiedSelectionModal**, **AddCombatantModal** (encounter/session participants — non-USM), **SourceFilter** |
| List utilities | `src/components/shared/list-components.tsx` | SearchInput, FilterSection, ResultsCount, EmptyState, LoadingState. **List headers:** use `ListHeader` from `src/components/shared/list-header.tsx` for all sortable list views (single source of truth; Option B). SortHeader/SortHeaderRow in list-components are legacy and unused in list views. **Do not** override ListHeader with transparent/flat `className` in modals unless there is a documented exception — keep the same bar styling as Codex/Library. |
| Character sheet | `src/components/character-sheet/` | library-section, abilities-section, skills-section, feats-tab, modals |
| Creators | `src/components/creator/` | ability-score-editor, health-energy-allocator, creator-summary-panel |
| Filters | `src/components/shared/filters/` | TagFilter, SelectFilter, AbilityRequirementFilter, ChipSelect, SourceFilter (All / Realms Library / My Library) |

Deep list/selection rules → [`guide/02-components-and-lists.md`](guide/02-components-and-lists.md).

## Unification

Goal: "Learn once, use forever." Prefer shared components over forks.

- Rule (always-on when editing TSX): `.cursor/rules/realms-unification.mdc`
- Pattern inventory & usage map: [`guide/02-components-and-lists.md`](guide/02-components-and-lists.md) § Unified patterns
- Entity art pipeline: [`guide/03-entity-card-art.md`](guide/03-entity-card-art.md)
- Contextual help: [`guide/04-floating-ui-tooltips.md`](guide/04-floating-ui-tooltips.md)
- Tokens: `DESIGN_SYSTEM.md`
