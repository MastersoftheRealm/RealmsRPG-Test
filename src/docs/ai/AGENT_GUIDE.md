# Agent Guide — Sources of Truth

Single reference for component locations, patterns, and where to record work. Verified against codebase (Jun 2026).

> **First stop before building anything new:** [`FEATURE_INDEX.md`](FEATURE_INDEX.md) — feature/component/hook/service map to confirm it doesn't already exist. The full canonical "for X, read Y" map is in the root `AGENTS.md` (Source-of-Truth Map).
>
> **Current remediation status / open gaps:** [`REMEDIATION_STATUS_2026-06.md`](REMEDIATION_STATUS_2026-06.md).  
> **Historical audits:** see [`archive/HISTORY_INDEX.md`](archive/HISTORY_INDEX.md) — do not treat archived findings as currently open.

**Note:** When implementing a task, verify `related_files` in AI_TASK_QUEUE against the actual codebase — some entries may have been corrected; paths can become stale (e.g., `header-section.tsx` was replaced by `sheet-action-toolbar.tsx`).

## Verification Before Marking Done

Before marking a task `done`, verify:

1. **Acceptance criteria** — Every criterion is fully met. Do not mark `done` if any bullet is incomplete.
2. **Related files** — Paths in the task's `related_files` match the actual codebase. Update the task if you correct paths.
3. **Build** — `npm run build` passes.
4. **Manual check** — For UI changes, spot-check in the browser if feasible.

### If work is incomplete

Use **`status: partial`**, not `done` with "deferred" in notes:

- **`completed_work`** — bullets of what shipped
- **`remaining_work`** — open acceptance criteria
- **`follow_up_tasks`** — new TASK-### IDs for the remainder (no orphan audit findings)

Human-only steps (Dashboard, prod smoke, product decisions) go in [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md), not buried in notes.

### Build validation (QA how-to)

For **user-facing** tasks (UI, auth, campaigns, sheet, admin, security, DB RLS):

1. Set **`build_validation`** on the task (suite id + test ids) and a short **`developer_test_plan`** pointer.
2. **Add or update** granular tests in [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md) — **one behavior per DEV-V-###-T### test** (steps + expected + report line).
3. **Index** the suite in [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Build validation index.

Do **not** write cramped multi-check smoke paragraphs. Split “pick archetype AND check skills AND check feats” into separate tests under one **DEV-V-###** category.

Automated-only tasks (`npm run build`, lint) do not need build validation unless behavior is hard to verify in CI.

If a task was wrongly marked `done`, re-open as `partial` or add/finish follow-up tasks.

## Design-system safety net (UI verification)

For **any UI / token / theme change**, use the automated net (TASK-383). The guiding roadmap for this effort is [`UI_UNIFICATION_PLAN.md`](./UI_UNIFICATION_PLAN.md) (durable plan; read it before continuing UI-unification work). The net replaces manual visual QA with deterministic checks.

- **Visual State Exploration Audit (VSEA):** Static screenshots only capture default page views. Before refactoring a page or component, explore **all meaningful interactive states** (modals open, tabs selected, expanded sections, errors, loading, empty, hover/focus) and log findings in [`VISUAL_STATE_AUDIT.md`](./VISUAL_STATE_AUDIT.md). See the plan § Visual State Exploration Audit. Retroactively re-audit Phase 1.1–1.2 components via the retroactive queue there.
- **Run it:** `npm run verify` (now **builds first**, then contrast + lint + visual + a11y). The `verify`, `verify:visual:update`, and `verify:a11y:update` scripts all run `npm run build` themselves. The bare `verify:visual` / `verify:a11y` do **not** build — only use them standalone right after a build.
- **Styleguide:** `/dev/styleguide` is the canonical, auth-free gallery of every primitive + token in both themes. When adding/changing a primitive or token, render it here and confirm it looks intentional in light **and** dark. It is captured in the screenshot suite.
- **Contrast** (`scripts/check-contrast.mjs`): resolves every semantic fg/bg token pair (following `var()` indirection) in **both** themes vs WCAG AA. Baseline `scripts/contrast-baseline.json` is at 0 — keep it there. To add a token pairing, edit the `PAIRS` array.
- **Visual regression** (`tests/visual/screenshots.pw.ts`): full-page baselines across mobile/tablet/desktop x light/dark for deterministic routes. After an **intentional** change, re-baseline with `npm run verify:visual:update`, **view the regenerated PNG(s)** (and any `*-diff.png`) to confirm the change is what you intended, then commit. Baselines are OS-specific (committed set is Windows; Linux CI baselines = DEV-002).
- **Accessibility** (`tests/visual/a11y.pw.ts`): axe-core scan, ratcheted via `tests/visual/a11y-baseline.json`. Fix violations and **prune** the baseline (`verify:a11y:update`) — never use update to mask a new violation.
- **No raw colors:** ESLint `realms/no-raw-color` (hard error) bans raw Tailwind palette / bare white-black / arbitrary hex in class strings. Use semantic tokens (`bg-surface`, `text-text-primary`, `bg-primary-600`, …). Exemptions: `(auth)/`, `components/auth/`, `components/ui/` primitives, and the shrinking `eslint-rules/raw-color-backlog.mjs` list — **delete** a file from that backlog when you migrate it off raw colors (audit with `node scripts/list-raw-color-backlog.mjs`).
- **CI:** `.github/workflows/ui-verify.yml` runs all of the above as hard-blocking gates.

### Token architecture (Phase 0+)
- **Theme-aware semantic foreground tokens** exist for status/archetype: `text-success-fg`, `text-danger-fg`, `text-warning-fg`, `text-info-fg`, `text-power-fg`, `text-martial-fg`, and `bg-primary-button`. Each is correct in **both** themes (dark values live in `.dark`). **Prefer these over** pairing a numbered ramp step with an ad-hoc `dark:` override (e.g. use `text-success-fg`, not `text-success-700 dark:text-success-400`). Numbered ramps (`success-700`, etc.) remain for compat.
- **Every** semantic token now has an explicit dark value. When you add a token to `@theme`, also add its `.dark` override (or it will silently render its light value in dark mode — the original dark-mode bug class).

### Hard-won gotchas (don't relearn these the hard way)
- **Always build before visual/a11y.** These serve the production build (`npm run start` on `.next`). A stale `.next` = false pass/fail. The canonical scripts now build for you; if you invoke Playwright directly, build first.
- **Never reuse a stray server.** `playwright.config.ts` sets `reuseExistingServer: false` so the suite always serves the build under test. Tell-tale of an unstyled/stale render: links show Chrome's default dark-mode color **`#9e9eff` on white** and `body` background is transparent — that means app CSS isn't applied (wrong/old server), not a real failure.
- **Fonts are self-hosted via `next/font`** (incl. `Nova Flat` → `--font-nova-flat` → `--font-display`). Do **not** reintroduce a runtime Google-Fonts `<link>` with `display=swap`; the fallback→web-font swap reflows layout and makes screenshot baselines flaky.
- **Verify your verifier.** The contrast script once matched the `@custom-variant dark (…)` line instead of the real `.dark { }` rule and silently compared dark≈light. If a check reports identical results across themes, suspect the check before trusting it.

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
| Shared patterns | `src/components/shared/` | GridListRow, SkillRow, ValueStepper, RollButton, PointStatus, SectionHeader, **SegmentedControl**, **UnifiedSelectionModal**, **SourceFilter** |
| List utilities | `src/components/shared/list-components.tsx` | SearchInput, FilterSection, ResultsCount, EmptyState, LoadingState. **List headers:** use `ListHeader` from `src/components/shared/list-header.tsx` for all sortable list views (single source of truth; Option B). SortHeader/SortHeaderRow in list-components are legacy and unused in list views. **Do not** override ListHeader with transparent/flat `className` in modals unless there is a documented exception — keep the same bar styling as Codex/Library. |
| Character sheet | `src/components/character-sheet/` | library-section, abilities-section, skills-section, feats-tab, modals |
| Creators | `src/components/creator/` | ability-score-editor, health-energy-allocator, creator-summary-panel |
| Filters | `src/components/shared/filters/` | TagFilter, CheckboxFilter, SelectFilter, AbilityRequirementFilter, SourceFilter (All / Realms Library / My Library) |

## Segmented toggles vs tabs

| Pattern | Component | When |
|---------|-----------|------|
| My Library ↔ Realms Library; All ↔ Realms ↔ My (modals) | **SourceFilter** or **SegmentedControl** | Short mutually exclusive scopes; same pill styling site-wide |
| Two equal-width segments with optional icons (e.g. Combat/Skill, library/campaign) | **SegmentedControl** `equalWidth` + per-option `icon` | Same primary selected state as Library; non-tab segments get `aria-pressed` |
| Feat source / other modal sub-modes needing `role="tab"` | **SegmentedControl** with `tabs` + `tabPanelId` | A11y tablist when acting as tabs |
| Powers / Techniques / … primary navigation | **TabNavigation** (`variant="underline"`) | Long tab sets; keep underline tabs, do not swap for SegmentedControl |

**Tab a11y (TASK-355):** Call `useTabGroup()` in the page, pass `tabGroupId` + `sharedTabPanelId` to `TabNavigation`, wrap tab content in `<TabContentPanel tabGroupId={…} id={sharedPanelId} activeTab={…}>`. For per-tab panels in DOM, use `TabPanel` instead.

## Component Decision Tree (List/Selection UI)

| Use Case | Component | Notes |
|----------|-----------|-------|
| Powers, techniques, feats, equipment in lists | **GridListRow** | Sortable columns, leftSlot/rightSlot, expandable rows |
| Codex/Library browse, item cards | **ItemCard** (and GridListRow list rows) | Card layout, view/edit/duplicate/delete actions |
| Base-skill selector (add sub-skill) | **SelectionToggle** | Unique UX; not GridListRow |
| Species detail view, level-up wizard | Custom layouts | Justified exceptions |
| Add-feat, add-skill, add-library-item modals | **GridListRow** or **UnifiedSelectionModal** | Consistent list selection |

**List item actions:** GridListRow and ItemCard use the same action set (view/edit/duplicate/delete, plus quantity where applicable). Use IconButton and the same placement pattern; see `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended catalog details.

**List modal layout (add-X, load, selection):** Use a consistent structure so modals match Codex/Library: (1) Header (title + close), (2) Search bar (`SearchInput`), (3) optional **FilterSection** for filters, (4) **ListHeader** (sortable), (5) scrollable list in a bordered container (`border border-border-light rounded-lg`) with **GridListRow** or selectable rows, (6) footer (selection count + Cancel + primary action). Use **EmptyState** and **LoadingState** (from `@/components/ui` or shared list-components) for empty and loading; avoid ad-hoc Spinner/divs. For search + sort state, **useModalListState** (`@/hooks/use-modal-list-state`) returns `search`, `setSearch`, `filteredItems`, `sortedItems`, `sortState`, `handleSort`, `reset` — use in load/add-X modals to reduce duplication.

See `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended component catalog (agents: prefer this guide + `realms-unification.mdc`).

## Tooltips (canonical: Tippy + tooltip-text.tsx — TASK-376 ✅)

**Owner decision (2026-06-25):** Collin's `@tippyjs/react` + static copy in `public/tooltip-text.tsx` is the **only** contextual-help standard. Legacy DB tooltips were removed in TASK-376 (Jun 2026).

### Use this

| Piece | Location / usage |
|-------|------------------|
| Copy (strings + rich JSX) | `public/tooltip-text.tsx` — add exports here; keep copy in one file |
| Component | `InfoTippy` from `@/components/shared` (wraps `@tippyjs/react` + accessible Info trigger) |
| Dynamic values | Helpers in `tooltip-text.tsx` (e.g. `getAbilityPointsHelp`, `getSkillPointsHelp`, `getTooltipTextByPowerAbility`) |
| Rich HTML | `allowHTML` on `InfoTippy` when content is JSX from `tooltip-text.tsx` |
| Custom trigger | `InfoTippy` `children` prop (e.g. archetype ability buttons) or raw `Tippy` for non-Info triggers |

**Reference:** `InfoTippy`, `header.tsx` (Library/Codex), all character-creator steps, `campaigns/page.tsx`.

### Do not use

| Legacy (removed) | Replacement |
|------------------|-------------|
| `useTooltipByKey`, `useTooltips`, `ContextHelpTooltip`, `HelpTooltip` | `InfoTippy` + `tooltip-text.tsx` |
| Admin `/admin/tooltips`, `/api/tooltips`, user show-tooltips toggle | Edit `public/tooltip-text.tsx`; deploy |
| `ui_tooltips` table | Optional SQL drop — human step in `DEVELOPER_TASK_QUEUE.md` |

**Page help:** Use `InfoTippy`, not `Tooltip` from `@/components/ui` (styleguide/demo only).

## Unified patterns (verified Jun 2026)

Goal: "Learn once, use forever" — consistent UI across Library, Codex, Character Sheet, Creators. List/sort headers use **ListHeader** (single source of truth).

| Pattern | Where used |
|---------|------------|
| GridListRow | Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator |
| SkillRow | skills-section, skills-step, creature-creator |
| ValueStepper | abilities-section, sheet-header, health-energy-allocator, dice-roller, all creators, encounters pages |
| SectionHeader | feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages |
| ListHeader | All Codex/Library/Admin list views, feats-step, UnifiedSelectionModal |
| UnifiedSelectionModal | AddFeatModal, AddSkillModal, AddLibraryItemModal (thin wrappers) |
| useModalListState | LoadFromLibraryModal |

**Intentional exceptions:** Auth pages use `gray-*`; AddSubSkillModal uses SelectionToggle (not GridListRow); footer uses `bg-neutral-400`; RollButton gradients use neutral tokens.

Quick reference: `.cursor/rules/realms-unification.mdc`, `DESIGN_SYSTEM.md`.

## Key Files

| Purpose | File |
|---------|------|
| Design tokens | `src/app/globals.css` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character logic | `src/services/character-service.ts`, `src/hooks/use-characters.ts` |
| Creator state | `src/stores/character-creator-store.ts` |
| Supabase | `src/lib/supabase/` |
| **Database schema (single source of truth)** | `src/docs/SUPABASE_SCHEMA.md` — all public tables, columnar vs JSONB, API→tables; do not duplicate elsewhere |
| Database types | `src/types/database.ts` (or Supabase-generated types) |
| Codex API | `src/app/api/codex/` — fetches from Supabase |
| **Game rules** | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions; use when implementing validation, caps, tooltips, calculations |
| **Accessibility & contrast** | `src/docs/ACCESSIBILITY.md` — contrast tokens (success-700 + dark variant, power/martial-dark), form labels, headings, modals, touch targets; `src/docs/DESIGN_SYSTEM.md` — status and game-specific color tokens for light + dark mode. When editing UI, ensure new or changed text/controls follow these so both themes pass WCAG 2.1 AA. |
| **User experience goals** | `src/docs/USER_EXPERIENCE_GOALS.md` — UX goals, terminology (Realms Codex/Library, My Library), what’s implemented vs backlog, and AI checklist for onboarding/retention/copy. Read when changing landing, creator, library, or onboarding flows. |
| Architecture | `src/docs/ARCHITECTURE.md` |
| **Codex/library data** | `src/docs/DATA_HANDLING.md` — single codex fetch, query keys, cache headers, prefetch; read when adding or changing codex/library hooks or APIs |
| **Character/creature math** | `src/lib/game/formulas.ts`, `src/lib/game/calculations.ts`, `src/lib/game/skill-allocation.ts` — all ability, defense, skill, and derived stats |
| **Power/technique/item cost and display** | `src/lib/calculators/` — part costs, derive*Display helpers, filterSavedItemPropertiesForList; use for creator preview and library/codex display |
| **Crafting requirements and outcome** | `src/lib/game/crafting-utils.ts` — getCraftingRequirements, getUpgradeRequirements, getEnhancedCraftingRequirements, calculateCraftingOutcome, optional modifiers; `src/types/crafting.ts` — session and enhanced item types |

## Hooks & Services

| Need | Hook / Service |
|------|----------------|
| Auth state | `useAuth` |
| User's characters | `useCharacters` |
| User's library (powers, techniques, items, creatures) | `useUserLibrary` |
| Codex reference data (parts, skills, feats, species) | `useCodexFeats`, `useCodexSkills`, `usePowerParts`, etc. (from `use-codex.ts`; data from Supabase) |
| Character CRUD | `character-service.ts` (via useCharacters) |

**Enrichment:** Use `enrichPowers`, `enrichTechniques`, `enrichItems` from `data-enrichment.ts` when displaying character powers/techniques/items. Pass `powerPartsDb` / `techniquePartsDb` from `useCodexPowerParts()` / `useCodexTechniqueParts()` for correct EN/TP costs. See `ARCHITECTURE.md`. **Codex/library:** Use `useCodex*` hooks (single `['codex']` fetch); avoid duplicate codex fetches. See `DATA_HANDLING.md`.

## Character Creator Step Order

1. Species → 2. Powers → 3. Skills → 4. Feats → 5. Archetype → 6. Ancestry → 7. Abilities → 8. Equipment → 9. Finalize

Steps live in `src/components/character-creator/steps/` (e.g., `species-step.tsx`, `abilities-step.tsx`).

## Pages / Routes

- `(main)/characters`, `(main)/characters/[id]`, `(main)/characters/new`
- `(main)/library` — user items (powers, techniques, armaments, creatures)
- `(main)/codex` — browse all content
- `(main)/power-creator`, `(main)/technique-creator`, `(main)/item-creator`, `(main)/creature-creator`
- `(main)/encounters`, `(main)/crafting`, `(main)/my-account`, `(main)/rules`, `(main)/privacy`, `(main)/terms`, `(main)/resources`
- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `(auth)/forgot-username`

## Shared Component Usage (Verified)

- **GridListRow** — Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator
- **HubListRow** — Encounters hub, Crafting hub, Library Enhanced tab (list rows with icon, title, badge, subtitle, delete). **Do not use** for combat/skill encounter participants: those use **CombatantCard** and participant-specific blocks (health, initiative, roll state); HubListRow is for “open/delete” list items only.
- **SkillRow** — skills-section, skills-step, creature-creator
- **ValueStepper** — abilities-section, sheet-header, health-energy-allocator, dice-roller, all creators, encounters pages
- **SectionHeader** — feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages
- **AddSubSkillModal** — Uses SelectionToggle (not GridListRow) — unique base-skill selector UX

## Creator load logic (avoid duplication)

**CREATOR_LOAD_RULES** — Single reference for “mechanic vs list” when loading saved content into creators. See table below for per-type helpers.

When loading a saved item/power/technique into a creator, follow this **three-step pattern** so mechanic-driven UI and the user-selectable list stay in sync:

1. **Reset state** — Clear all creator state (or call the creator’s reset handler).
2. **Restore dedicated UI fields** — Load mechanic-driven fields from saved data (e.g. damage, DR, range, duration, actionType, weapon) into their dedicated state. Do **not** put these into the parts/properties list.
3. **Restore the list from filtered saved data** — Build the user-selectable parts/properties list from saved data **filtered to non-mechanic entries only**. Mechanic-only entries must not appear in the list or they show twice.

**Reusable helpers (single source of truth):**

| Creator | Helper / rule | Location |
|---------|----------------|----------|
| Item/armament | `filterSavedItemPropertiesForList(savedProperties, propertiesDb)` | `@/lib/calculators` — returns only non-mechanic properties for the list. Load damage, DR, range, etc. from item.damage, item.damageReduction, etc. |
| Power | Exclude `EXCLUDED_PARTS`; add to main list only when `!matchedPart.mechanic` | `handleLoadPower` in power-creator page; mechanic parts go to advanced or are skipped. |
| Technique | Add to `loadedParts` only when `!matchedPart.mechanic` | `handleLoadTechnique` in technique-creator page. |

**Rule:** Mechanic-only entries (parts/properties driven by dedicated UI) are restored from dedicated state only. Never restore them into the user-selectable list.

**Load modal state and data:** Use `useLoadModalLibrary('powers' | 'techniques' | 'items' | 'empowered-technique')` from `@/hooks` for load-modal visibility and library items. Returns `showLoadModal`, `setShowLoadModal`, `openLoadModal`, `closeLoadModal`, `selectableItems`, `rawItems`, `isLoading`, `error`, plus source-filter state. Type-specific `handleLoad*` (reset → restore mechanics → restore filtered list) stays in each creator.

## Creator layout

All four creators (power, technique, item, creature) use **CreatorLayout** from `@/components/creator` for consistent structure.

- **Props:** `icon`, `title`, `description`, `actions`, `children` (main editor), `sidebar`, `modals`, `size`, `headerClassName`
- **Structure:** `PageContainer` → `PageHeader` → optional modals → grid (`lg:grid-cols-3`) with main (`lg:col-span-2 space-y-6`) and sidebar.
- **Usage:** Main content in `children`, summary panel in `sidebar`, Load/Login/Publish (and selection) modals in `modals`. Actions use `CreatorSaveToolbar`.

## Allocation UI consistency

Ability, defense, skill, and health/energy allocation should use shared components everywhere:

- **Ability / defense editing:** `AbilityScoreEditor` (creators, character sheet) or `AbilitiesSection` (sheet) — both use `PointStatus`, `DecrementButton`, `IncrementButton` from `@/components/shared`.
- **Skill point allocation:** `SkillsAllocationPage` (character/creature creator) or skills section with `PointStatus` (character sheet).
- **Health/Energy pool:** `HealthEnergyAllocator` (creators, character sheet) with `ValueStepper`; use `enableHoldRepeat` only for pool allocation, not for ability/defense steppers.
- **Powered-martial proficiency:** `PoweredMartialSlider` from `@/components/shared` in creature creator and character sheet (ArchetypeSection) when both power and martial proficiency are present.

Use design tokens for colors; avoid raw `blue-*` / `green-*` outside auth.

## Recording Progress

| What | Where |
|------|-------|
| Tasks | `src/docs/ai/AI_TASK_QUEUE.md` |
| Changelog | `src/docs/ai/AI_CHANGELOG.md` |
| Raw feedback | `src/docs/ALL_FEEDBACK_CLEAN.md` |
| Game rules | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions |
| **Current remediation status** | `src/docs/ai/REMEDIATION_STATUS_2026-06.md` — current completion/open-gap truth and execution sequencing for deferred work. |
| Historical audits & task backup | `src/docs/ai/archive/HISTORY_INDEX.md` — June 2026 audits, full queue backup, older plans |
| Codebase audit (historical) | `src/docs/ai/archive/CODEBASE_AUDIT_2026-02-13.md` — 98-finding audit with 6-phase fix plan |
| Unification audit (historical) | `src/docs/ai/archive/UNIFICATION_AUDIT_2026-02-20.md` — shared logic, creators, libraries, allocation, centralized sources of truth |
| Modal unification audit (historical) | `src/docs/ai/archive/MODAL_UNIFICATION_AUDIT_2026-02-20.md` — list modals (add-X, load, selection): logic, styles, EmptyState/LoadingState, FilterSection, alignment with Codex/Library. See TASK-264. |
| **Performance & edge usage** | `src/docs/PERFORMANCE_AND_EDGE.md` — Vercel CDN/edge requests, proxy matcher, cache headers, prefetch, polling; checklist for new public APIs and hooks. |
| **Mobile UX** | `src/docs/MOBILE_UX.md` — breakpoints, touch targets, full-screen modals, dense-layout strategy (side-scroll vs collapse). When adding a new page or modal, follow MOBILE_UX.md and the Agent checklist there. |
| **User experience goals** | `src/docs/human/USER_EXPERIENCE_GOALS.md` — human reference; update when completing UX tasks |

## Mobile

- **Modals:** Use `fullScreenOnMobile` on `Modal` for selection, add-X, load, recovery, level-up, settings, and other large dialogs so they render full-screen on viewports &lt; 768px.
- **Dense layouts:** Prefer **side-scroll** between section panels on mobile; use **Collapsible** when sections are few or content is lighter. See MOBILE_UX.md.
- **New/edited UI:** Check the Agent checklist in MOBILE_UX.md (breakpoints, touch targets ≥44px, list/table patterns).

## Creating New Tasks

Use `src/docs/ai/AI_REQUEST_TEMPLATE.md` format. Add to `AI_TASK_QUEUE.md` with next TASK-### ID.
Create tasks when: audits reveal issues; implementation uncovers follow-up work; complex work needs phase breakdown.
Set `priority`, `status: not-started`, `related_files`, and clear `acceptance_criteria`.

## Scripts

- `node scripts/extract_feedback.js` — Convert raw feedback → tasks
- `node scripts/triage_tasks.js` — Infer related_files for tasks (--apply to update)
- `node scripts/session_submit.js "feedback..."` — Append feedback, extract, triage
- `node scripts/reconcile_tasks.js` — Verify TASK-### ↔ commits/PRs (CI runs this)
