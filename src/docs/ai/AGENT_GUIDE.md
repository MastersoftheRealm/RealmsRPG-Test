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
- **No raw colors:** ESLint `realms/no-raw-color` (hard error) bans raw Tailwind palette / bare white-black / arbitrary hex in class strings. Use semantic tokens (`bg-surface`, `text-text-primary`, `bg-primary-600`, …). Exemptions: `(auth)/`, `components/auth/`, `components/ui/` primitives. Audit with `node scripts/list-raw-color-backlog.mjs` (expect 0; `RAW_COLOR_BACKLOG` is empty).
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
| My Library ↔ Realms Library; All ↔ Realms ↔ My (modals) | **SourceFilter** or **SegmentedControl** | Short mutually exclusive scopes; same pill styling site-wide (`bg-surface-alt` track + bordered idle segments) |
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
| Entity **thumbnail** in list row (left of name, click to preview) | **GridListRow** `thumbnail` + **ListRowThumbnail** | See § **Entity card art & list thumbnails** — species pilot shipped |

**List item actions:** GridListRow and ItemCard use the same action set (view/edit/duplicate/delete, plus quantity where applicable). Use IconButton and the same placement pattern; see `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended catalog details.

**List modal layout (add-X, load, selection):** Prefer **`UnifiedSelectionModal`** (or thin wrappers: `AddLibraryItemModal`, `LoadFromLibraryModal`, `AddFeatModal`, `AddSkillModal`) so search/sort/list/footer stay consistent. `UnifiedSelectionModal` defaults to **`flexLayout`** (sticky header/footer + scrollable list on mobile). For rare custom lists that cannot use UnifiedSelectionModal, use **useModalListState** (`@/hooks/use-modal-list-state`) for search/sort state — and apply `gridColumnsWithInlineSelection` yourself (do not pre-wrap grids passed into UnifiedSelectionModal). Structure: (1) Header (title + close), (2) Search, (3) optional filters, (4) **ListHeader**, (5) scrollable **GridListRow** list, (6) footer. Use **EmptyState** / **LoadingState**; avoid ad-hoc Spinner/divs.

See `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended component catalog (agents: prefer this guide + `realms-unification.mdc`).

## Entity card art & expandable images (TASK-405 / TASK-415)

**Product authority:** `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 — three-layer image model (official/codex art, art bank, privileged user upload). **Schema authority:** `SUPABASE_SCHEMA.md` — nullable `image_url` on codex/official/user rows; **same column name and semantics everywhere** (not ad-hoc payload keys when a column exists).

**Goal:** One resolution pipeline for placeholders + DB URLs; unified **click-to-enlarge** via `ExpandableImage`; list thumbs and choice-card heroes share the same preview modal. Agents must **extend** these building blocks — not fork per page.

### Building blocks (use these)

| Piece | Location | Role |
|-------|----------|------|
| **ExpandableImage** | `src/components/shared/expandable-image.tsx` | **Default** for any meaningful inline image — wraps visible image, click opens `ExpandableImageModal` (`object-contain`, `fullScreenOnMobile`). Use `stopPropagation` inside selectable cards/rows. |
| **ExpandableImageModal** | same file | Controlled preview only (rare); prefer `ExpandableImage`. |
| **readRecordImageUrl** / **resolveChoiceCardImage** | `src/components/guided-creator/guided-choice-image.ts` | Read `image_url` / `imageUrl` from any record; fall back to typed SVG placeholders |
| **resolveListRowThumbnail** / **resolveSpeciesListRowThumbnail** | `src/lib/list-row-image.ts` | Wraps `resolveChoiceCardImage` → props for list thumbs |
| **ListRowThumbnail** | `src/components/shared/list-row-thumbnail.tsx` | 44×44 list thumb — thin wrapper over `ExpandableImage` for `GridListRow.thumbnail` |
| **GridListRow** `thumbnail` | `src/components/shared/grid-list-row.tsx` | D&D Beyond list style + `ListHeader` `hasThumbnailColumn` |
| **GuidedChoiceCard** | `src/components/guided-creator/guided-choice-card.tsx` | Choice cards — hero art via `ExpandableImage` inside card |
| **CodexArtUploadField** | `src/components/shared/codex-art-upload-field.tsx` | Admin crop/upload → `/api/upload/codex-art` |
| **codex-art.ts** | `src/lib/codex-art.ts` | Entity types, storage paths, `uploadCodexArt()` |

### Decision matrix — which surface?

| User-facing surface | Implement with | Image resolution |
|---------------------|----------------|------------------|
| **Any inline image** (species art, portrait, card hero, list thumb) | **`ExpandableImage`** wrapping `next/image` or `img` | Pass `src`, `alt`, optional `isPlaceholder` |
| Codex / Library / Admin **sortable list** | `GridListRow` `thumbnail` → `ListRowThumbnail` | `resolveListRowThumbnail(…)` |
| Guided creator **choice card** | `GuidedChoiceCard` (uses `ExpandableImage` internally) | `imageKind` + `imageRecord` / `imageUrl` |
| Species **reveal** / preview **portraits** | `ExpandableImage` directly | `resolveChoiceCardImage` or portrait URL |
| Admin / official **authoring** | `CodexArtUploadField` | `codex-art.ts` upload API |
| Decorative / redundant (`alt=""` only) | Plain `Image` / `img` — **no** expand | — |

### Shipped vs extend later

| Entity | List `thumbnail` | Choice card | Upload |
|--------|------------------|-------------|--------|
| **Species** | ✅ Codex + Admin species tabs | ✅ Guided species + reveal | ✅ Admin species editor |
| Weapons / armor / shield | Extend when art exists | Future | ✅ Official Item Creator (`?edit=`) |
| Powers / techniques / creatures | TASK-405 phase 2+ | Future | Planned |
| Simple equipment (`codex_equipment`) | Art **bank** only (TASK-415) | Bank picker | No per-row codex column |

When adding list thumbs for a new entity: (1) ensure API returns `image_url`, (2) pass `thumbnail={resolveListRowThumbnail('<kind>', row, row.name)}` on `GridListRow` — **do not** add a new grid column for art.

### Agent checklist (before shipping UI with art)

1. Grep `FEATURE_INDEX.md` + this section — do not add parallel thumb/modal/lightbox components.
2. Placeholders only via `resolveChoiceCardImage` — never hardcode `/images/placeholder-*.svg` in feature pages.
3. Wrap meaningful images in **`ExpandableImage`** (list thumbs use `ListRowThumbnail`; choice cards use `GuidedChoiceCard` or `ExpandableImage` directly).
4. Use `thumbnail` on `GridListRow`, not `leftSlot` (leftSlot is for equip/innate toggles).
5. `stopPropagation` on expand click when inside selectable rows/cards (`ExpandableImage` default `true`).
6. Pair **`ListHeader` `hasThumbnailColumn`** with `GridListRow` `thumbnail`.
7. For user-library parity / art bank, follow TASK-415.

### Anti-patterns

- Custom `<img>` + one-off lightbox / new preview modal per page.
- Storing card art only in `payload` when `image_url` column exists for that table.
- Different placeholder art per page.
- `codex_equipment.image_url` — simple gear uses **bank** presets only (§5.0.3).

## Floating UI & contextual help (TASK-376 ✅ / TASK-392 ✅)

**Authority for agents:** This section is the decision guide for `@floating-ui/react`, `InfoTippy`, and related patterns. Product vision context: `REALMS_PRODUCT_OVERVIEW.md` § 2.6.

**Owner decision (2026-06-25):** Static copy in `public/tooltip-text.tsx` is the **only** contextual-help standard. Legacy DB tooltips were removed in TASK-376 (Jun 2026). **Engine:** `@floating-ui/react` via `InfoTippy` (TASK-392, Jun 2026).

### If you authored PR #14 (Collin-tooltipExperimentation)

Your Floating UI work **is in the repo** — it was extracted into shared primitives during the KadinBranch + `master` merge (`0e62d157`). Read **`src/lib/tooltips/README.md`** first.

| You remember… | Look here now |
|---------------|---------------|
| `tooltip.tsx` with inline `useFloating` | `floating-help.tsx` (panel/placement) + `tooltip.tsx` (thin wrapper) |
| `ContextHelpTooltip` + `tooltipKey` | `InfoTippy` + `tooltip-text.tsx`; keys → `legacy-tooltip-key-map.ts` |
| `HelpTooltip` | `InfoTippy` |
| Skills help inside `skills-allocation-page.tsx` | Parent passes `headingAddon` / `addSubSkillAddon` (`skills-step.tsx`, creature creator) |
| DB `/api/tooltips`, admin tooltips page | **Removed** — edit `tooltip-text.tsx` and deploy |

### Two layers — do not conflate them

| Layer | What it is | When agents touch it |
|-------|------------|----------------------|
| **`@floating-ui/react`** | Positioning + interaction **engine** (flip/shift, portal, hover/focus/dismiss, ARIA). Successor to Popper/Tippy. | Import **only inside shared primitives** (`InfoTippy` today). Do **not** sprinkle `useFloating` across feature pages unless adding a **new shared** anchored component (see below). |
| **`InfoTippy`** | **Product component** for contextual **help**: Info trigger (or custom child), copy from `tooltip-text.tsx`, mobile touch-hold, interactive JSX lists. | Any time you add optional “what is this?” / rules help on a page or step. |

`InfoTippy` is **not** a generic tooltip primitive. It is opinionated help chrome. Do not use it for nav menus, filters, or dynamic stat breakdowns.

### Decision matrix — what to use when

| User need | Use | Do **not** use |
|-----------|-----|----------------|
| Optional rules / step help beside a heading | **`InfoTippy`** + export in `tooltip-text.tsx` | Raw Floating UI on the page, `Tooltip` from `@/components/ui`, `title=` only |
| Help on a non-Info control (e.g. ability pick button) | **`InfoTippy`** with `children` + `label` / child `aria-label` | Separate tooltip library |
| Level-aware help copy (points at level N) | Helper in **`tooltip-text.tsx`** (e.g. `getAbilityPointsHelp`) → **`InfoTippy`** | Inline paragraph duplicating rules |
| Rich help (bullets, bold, JSX) | JSX export in **`tooltip-text.tsx`** → **`InfoTippy`** `content` | DB tooltips, markdown in random components |
| Full-screen or multi-step flow | **`Modal`** (`fullScreenOnMobile` on mobile) | InfoTippy |
| Pick one option from a list (filters, sort) | **`Select`**, **`SelectFilter`**, **`ChipSelect`**, native `<select>` | InfoTippy |
| Nav dropdown (Library links, account menu) | Existing header / menu pattern; **future:** shared **`AnchoredMenu`** on Floating UI | InfoTippy |
| Click-to-open panel (actions, compact picker) | **Future:** shared **`AnchoredPopover`** on Floating UI; until then, extend nearest existing pattern | InfoTippy, one-off `absolute top-full` without a plan to unify |
| Post-activation sheet tour / highlight chain (TASK-388) | Dedicated tour/highlight system (not built) | InfoTippy chain for walkthroughs |
| Primary step guidance (Path mode) | **`PathHelpCard`**, **`GuidedChoiceShell`** `guidance` slot, step description prose | InfoTippy alone as the only guidance |
| Styleguide / demo only | **`Tooltip`** from `@/components/ui` | InfoTippy |

**Rule of thumb:** If the user can **ignore it and still complete the task**, and copy is **static and reviewable**, use **`InfoTippy`**. If the UI **must be used to proceed** or is **navigation**, use the appropriate modal/menu/select pattern.

### When to use `InfoTippy` (all should be true)

1. Copy lives in (or is returned from) **`public/tooltip-text.tsx`**
2. Help is **supplementary** — not the only explanation of a required action
3. Panel is **small** (~320px max; strings or short JSX)
4. Trigger is the **Info icon** (default) or a **single DOM element** via `children`

### When to use `@floating-ui/react` directly

Use the dependency **inside `@/components/shared` or `@/components/ui`**, not ad hoc on feature pages, when:

- Adding a **new reusable** anchored pattern (popover, menu, combobox, context menu)
- Refactoring an existing **manual `absolute` + portal** floater that appears in **multiple** places (e.g. header dropdowns)

**Before creating a new Floating UI wrapper:** grep for existing components; extend with a prop/variant first. Name future primitives clearly (`AnchoredPopover`, `AnchoredMenu`) — not `InfoTippy`.

**Not yet in the repo:** `AnchoredPopover` / `AnchoredMenu`. Until they exist, do not block feature work — but avoid copying positioning logic; note a follow-up to consolidate.

### Surfaces — wired today vs planned

| Surface | Status | Notes |
|---------|--------|-------|
| Character creator (all steps) | ✅ Wired | `size="inline"` on step headings; archetype ability buttons use `children` |
| `characters/new` page header | ✅ Wired | |
| Navbar Library / Codex | ✅ Wired | `placement="bottom"` |
| Campaigns hub | ✅ Wired | |
| Character sheet | ⬜ Planned | First-exposure help per `REALMS_PRODUCT_OVERVIEW.md` § 11 |
| Standalone creators (power, technique, item, …) | ⬜ Planned | When Layer 1 UX lands |
| Encounters, crafting, Codex/Library browse | ⬜ Planned | Scoped section help only where dense |

### How to add contextual help (agent checklist)

1. **Search** — grep `tooltip-text.tsx` and existing `InfoTippy` on the same surface; reuse or extend copy.
2. **Copy** — add a string, JSX export, or helper to `public/tooltip-text.tsx` (one file; no DB).
3. **Wire** — import `InfoTippy` from `@/components/shared`:
   - Page/step title: `<InfoTippy content={…} label="…" size="inline" />`
   - Default icon trigger: omit `children`; **`label` is required** (becomes `aria-label`).
   - Custom trigger: pass `children` (single element); child needs its own `aria-label`; keep `label` for consistency.
4. **Mobile** — default touch-hold (~400ms) is built in; do not add parallel click handlers.
5. **A11y** — every trigger has a discernable name; do not rely on `title` alone.
6. **Verify** — hover, keyboard focus, touch-hold on ~360px width; JSX lists allow pointer into panel.

### `InfoTippy` API (quick reference)

| Prop | Purpose |
|------|---------|
| `content` | `string` or JSX from `tooltip-text.tsx` |
| `label` | Accessible name (required) |
| `size` | `'icon'` (default, 44px touch) or `'inline'` (compact, step headings) |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` |
| `children` | Optional custom trigger element |
| `allowHTML` | **Deprecated** — no-op; kept for call-site compat |

Implementation: `src/components/shared/info-tippy.tsx` (product API) + shared Floating UI chrome in `src/lib/tooltips/floating-help.tsx` (arrow, transitions, placement — ported from Collin PR #14). Styleguide `Tooltip` in `@/components/ui` reuses the same primitive. Types: `InfoTippyProps` exported from `@/components/shared`.

### Do not use (removed / wrong tool)

| Legacy or wrong | Replacement |
|-----------------|-------------|
| `useTooltipByKey`, `useTooltips`, `ContextHelpTooltip`, `HelpTooltip` | `InfoTippy` + `tooltip-text.tsx` |
| Admin `/admin/tooltips`, `/api/tooltips`, user show-tooltips toggle | Edit `tooltip-text.tsx`; deploy |
| `ui_tooltips` table / `show_tooltips` column | Dropped 2026-06-30 (DEV-376) — `sql/drop-legacy-ui-tooltips-2026-06.sql` |
| `@tippyjs/react`, `tippy.js` | Removed (TASK-392) |
| `Tooltip` from `@/components/ui` for product help | `InfoTippy` only |

### Related patterns (not InfoTippy)

- **`PathHelpCard` / `GuidedChoiceShell` / `GuidedLayerNav`** — path-mode prose and **Layer 1 ↔ 2/3** chrome. **`GuidedLayerNav`**: expand = `outline` button below content; collapse = `secondary` button below content (same slot). Use on guided creator steps and any creator step with progressive disclosure.
- **Selection grammar (cards ↔ GridListRow)** — Canonical rules in [`REALMS_PRODUCT_OVERVIEW.md`](../REALMS_PRODUCT_OVERVIEW.md) **§3.1**:
  - **Ladder A (entity depth):** Glance → **Read more** / row expand → **More details** / rich chips. Same facts whether chrome is a card or a GridListRow.
  - **Ladder B (catalog breadth):** Curated cards → **See more options** (filtered GridListRow browse) → **See all** / Forge.
  - **When:** few curated picks → `GuidedChoiceCard`; many / searchable → `GridListRow`. Do not densify cards into column grids.
  - **Layer 1 choice principle:** identity and fighting-style steps still require deliberate picks (no weapon/armor quick kits). Soft defaults OK for ability arrays and optional gear Add-all.
- **Choice-card deep-dive vs catalog Layer 2** — Do **not** conflate (subset of §3.1):
  | Affordance | Component | Opens |
  |------------|-----------|--------|
  | **Read more…** | `GuidedChoiceCard` inline | Longer in-card copy / `expandedExtra` |
  | **More details** | `GuidedChoiceCard` `onDetails` → `GuidedEntityDetailModal` | Read-only entity overview + collapsible option catalogs (does **not** select the card) |
  | **Property details** / **Hide properties** | Equipment L1 `GuidedChoiceCard` expand | In-card property chips only — do **not** reuse **More details** for this (that label is deep-dive modal) |
  | **See more options** / browse | `GuidedLayerNav` / browse panels / `UnifiedSelectionModal` | Catalog Layer 2–3 (more choices to pick from) |
  Label deep-dive **More details** (see `GUIDED_CREATOR_COPY.choiceCard`); never reuse **See more** for the modal path. REALMS §3.1 / §5.0.1 / §5.7; TASK-432+.
  **Option rows inside deep-dive (and remodeled legacy lists):** use `DetailOptionList` + builders in `@/lib/detail-option` (`traitToDetailOption`, `featToDetailOption`, `equipmentRefToDetailOption`, `powerToDetailOption` / `techniqueToDetailOption` / `resolveCombatDetailOption`, `propertyChipsFromRefs`). Prefer flat equipment recommendation builders over kit helpers after TASK-442. Do not fork parallel GridListRow markup for the same catalogs.
  **GridListRow fact policy (sitewide):** If a fact would normally be a list column (Damage, Range, Damage Reduction, Action Type, Energy, Uses, Duration, etc.), either keep a real column with a header **or** put a **self-describing expanded chip** that states the label and value together (e.g. `Damage Reduction 2`, `Range Melee`). Never demote a column to an unlabeled or context-free chip.
  - **Dense browse lists** (Library, Codex, add modals, sheet library): keep **ListHeader** columns when space allows; chips supplement (properties/parts), they do not replace column facts.
  - **Deep-dive / progressive-disclosure catalogs** (`DetailOptionList`, choice-card More details): Name + Description only is fine (`showColumnHeaders={false}`); every omitted column fact must appear as a labeled chip in the expanded row.
  - **Audit inventory (TASK-437):** Library / Official / sheet sections column-complete. Codex + Admin Equipment: Damage + Dmg. Red. columns (Weight chip). Add/load powers: Energy/Action/Duration/Area/Damage + `Range:` chip. Creator powers: compact columns + Duration/Area/Range chips; techniques keep Action; empowered remap preserves Duration/Area as chips. Creature creator: power Duration chip; armament Damage/Range/DR chips. Sheet inventory cost badge = `Cost Nc`. Equipment-step weapons: Range chip. Do not strip browse columns to chip-ify them.
- **Stable expand toggle (sitewide, TASK-445):** Click-to-expand controls must keep the toggle under the pointer so a second click closes without mouse travel. Expanding may push siblings and grow content; the opened control’s origin (especially vertical) must not jump. Aligns with accordion best practice (whole header is the target; animate/grow the panel below — CMS DS, NN/g Fitts’s law) and WCAG target-size guidance.
  - **ExpandableChip / ChipGroup:** Host wrap groups with `data-chip-group` (ChipGroup does this). Do **not** force `w-full` on expand inside flex-wrap — that reboots the wrap row. ExpandableChip measures remaining row width (`measureStableExpandWidth`) from the collapsed left edge; equal collapsed/expanded header padding; header labels truncate (no wrap).
  - **GridListRow / CollapsibleSection:** Expand content below the header/trigger; keep the trigger fixed (`items-start`; fixed one-line meta slot).
  - **GuidedChoiceCard:** Read more / Read less / More details sit **below** body copy (product placement). Card height is stabilized via density min-height; chip/row expands still follow stable-toggle.
  - **Avoid:** Wrapping an expanded chip in `w-full` / `flex-1` solely to “make room.” Putting “Read more” under growing text.
- **`Modal`** — Layer 2/3 selection, wizards, and choice-card deep-dive; `fullScreenOnMobile` per `MOBILE_UX.md`.
- **Marketing / landing copy** — `src/lib/constants/copy/*`; do not merge into `tooltip-text.tsx` (TASK-390).

## Unified patterns (verified Jun 2026)

Goal: "Learn once, use forever" — consistent UI across Library, Codex, Character Sheet, Creators. List/sort headers use **ListHeader** (single source of truth).

| Pattern | Where used |
|---------|------------|
| GridListRow | Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator |
| ListRowThumbnail + `GridListRow.thumbnail` | Codex species, Admin species (pilot); extend per § Entity card art |
| GuidedChoiceCard + guided-choice-image | Guided creator choice steps (species hero art); optional `onDetails` for deep-dive |
| GuidedEntityDetailModal | Choice-card deep-dive (read-only overview + CollapsibleSection catalogs) — not catalog Layer 2 |
| GuidedSpeciesDetailModal + GuidedTraitOptionList | Species deep-dive: SpeciesRevealPanel overview + DetailOptionList trait catalogs (TASK-433/435) |
| GuidedPathDetailModal + GuidedDetailOptionList | Path deep-dive: proficiency / abilities / skills overview + feat / weapon / armor / gear / power|technique catalogs (TASK-434/435; kits removed TASK-442) |
| DetailOptionList + lib/detail-option | Shared elongated option-row toolkit for deep-dive + remodeled species-modal / SpeciesRevealPanel granted traits (TASK-435) |
| GuidedLayerNav | Layer 1 expand / Layer 2+ collapse below step content — guided creator (path, species, abilities), GuidedChoiceShell (Advanced path mode) |
| SkillRow | skills-section, skills-step, creature-creator |
| ValueStepper | abilities-section, sheet-header, health-energy-allocator, dice-roller, all creators, encounters pages |
| SectionHeader | feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages |
| ListHeader | All Codex/Library/Admin list views, feats-step, UnifiedSelectionModal |
| UnifiedSelectionModal | AddFeatModal, AddSkillModal, AddLibraryItemModal, LoadFromLibraryModal (thin wrappers) |
| library-selectable-builders | Add + Load library SelectableItem shaping (shared pipeline) |
| useModalListState | Other list modals that need search/sort without UnifiedSelectionModal |

**Intentional exceptions:** Auth pages use `gray-*` / brand social colors; AddSubSkillModal uses SelectionToggle (not GridListRow); filled primary/danger controls use `text-text-on-dark` on colored backgrounds.

Quick reference: `.cursor/rules/realms-unification.mdc`, `DESIGN_SYSTEM.md`.

## Key Files

| Purpose | File |
|---------|------|
| Design tokens | `src/app/globals.css` |
| Data enrichment | `src/lib/data-enrichment.ts` |
| Character logic | `src/services/character-service.ts`, `src/hooks/use-characters.ts` |
| Creator state | `src/stores/character-creator-store.ts` (Advanced) · `src/stores/guided-creator-store.ts` (Simple/Guided) |
| Supabase | `src/lib/supabase/` |
| **Database schema (single source of truth)** | `src/docs/SUPABASE_SCHEMA.md` — all public tables, columnar vs JSONB, API→tables; do not duplicate elsewhere |
| Database types | `src/types/database.ts` (or Supabase-generated types) |
| Codex API | `src/app/api/codex/` — fetches from Supabase |
| **Game rules + user-facing terms** | `src/docs/GAME_RULES.md` — formulas, caps, **Terminology & Definitions** (capitalize game terms; prefer/avoid vocab; Score = Bonus + 10; no em dash in new UI copy; **spell game terms in full on Layer 1/2**, e.g. Currency not `c`). Read before writing labels, tips, or guided copy. |
| **Entity card art (list thumb, choice cards, upload)** | `REALMS_PRODUCT_OVERVIEW.md` §5.0.3 + **this guide** § Entity card art & list thumbnails; `guided-choice-image.ts`, `list-row-image.ts`, `codex-art.ts` |
| **Accessibility & contrast** | `src/docs/ACCESSIBILITY.md` — contrast tokens (success-700 + dark variant, power/martial-dark), form labels, headings, modals, touch targets; `src/docs/DESIGN_SYSTEM.md` — status and game-specific color tokens for light + dark mode. When editing UI, ensure new or changed text/controls follow these so both themes pass WCAG 2.1 AA. |
| **User experience goals** | `src/docs/USER_EXPERIENCE_GOALS.md` — UX goals, terminology (Realms Codex/Library, My Library), what’s implemented vs backlog, and AI checklist for onboarding/retention/copy. Read when changing landing, creator, library, or onboarding flows. |
| Architecture | `src/docs/ARCHITECTURE.md` |
| **Codex/library data** | `src/docs/DATA_HANDLING.md` — single codex fetch, query keys, cache headers, prefetch; read when adding or changing codex/library hooks or APIs |
| **Character/creature math** | `src/lib/game/formulas.ts`, `src/lib/game/calculations.ts`, `src/lib/game/skill-allocation.ts` — all ability, defense, skill, and derived stats |
| **Power/technique/item cost and display** | `src/lib/calculators/` — part costs, derive*Display helpers, filterSavedItemPropertiesForList; use for creator preview and library/codex display |
| **Crafting requirements and outcome** | `src/lib/game/crafting-utils.ts` — getCraftingRequirements, getUpgradeRequirements, getEnhancedCraftingRequirements, calculateCraftingOutcome, optional modifiers; `src/types/crafting.ts` — session types, `UserEnhancedItem`, `OfficialEnhancedItem` / `OfficialEnhancedItemPayload`, create/patch inputs; hooks in `use-enhanced-items.ts` |

## Hooks & Services

| Need | Hook / Service |
|------|----------------|
| Auth state | `useAuth` |
| User's characters | `useCharacters` |
| User's library (powers, techniques, items, creatures) | `useUserLibrary` |
| Codex reference data (parts, skills, feats, species) | `useCodexFeats`, `useCodexSkills`, `usePowerParts`, etc. (from `use-codex.ts`; data from Supabase) |
| Character CRUD | `character-service.ts` (via useCharacters) |

**Enrichment:** Use `enrichPowers`, `enrichTechniques`, `enrichItems` from `data-enrichment.ts` when displaying character powers/techniques/items. Pass `powerPartsDb` / `techniquePartsDb` from `useCodexPowerParts()` / `useCodexTechniqueParts()` for correct EN/TP costs. See `ARCHITECTURE.md`. **Codex/library:** Use `useCodex*` hooks (single `['codex']` fetch); avoid duplicate codex fetches. See `DATA_HANDLING.md`.

## Character Creator — two models (DECIDED 2026-06-30)

See **`REALMS_PRODUCT_OVERVIEW.md` §5.0** for product intent. Two creators coexist; do not merge stores or routes.

| Creator | Route | Store | Steps |
|---------|-------|-------|-------|
| **Simple (Guided)** | `/characters/new/guided` | `guided-creator-store.ts` | 6 chapters, 10 sub-steps — `src/components/guided-creator/steps/` |
| **Advanced (Classic)** | `/characters/new/advanced` | `character-creator-store.ts` | 9 steps — `src/components/character-creator/steps/` |
| **Entry chooser** | `/characters/new` | — | Simple vs Advanced cards; home CTAs land here |

**Guided shell:** `GuidedCreatorShell` — chapter rail, `CharacterPreviewPanel`, `GuidedStepFooter`, landing-cohesive `CreatorFunnelHero`. Path data via `useGuidedPathData`. Save via `buildGuidedCharacterPayload` → `createCharacter`.

**User-facing copy:** Edit static prose in `src/lib/constants/copy/guided-creator-copy.ts` (chooser labels, step titles/descriptions, chapter rail, modals). Codex names (paths, species, feats) still come from the database.

**Guided DB fields** (see `SUPABASE_SCHEMA.md`): `codex_species.is_starter`, `codex_archetypes.level1_recommended_abilities`, `level1_loadouts` (metadata: `armorStep` / `sharedEquipment` only — no kits). Seed: `sql/guided-creator-schema-seed.sql` (applied as migration `guided_creator_schema_seed`; kit payload later cleared TASK-442).

**Advanced step order** (unchanged):

1. Species → 2. Powers → 3. Skills → 4. Feats → 5. Archetype → 6. Ancestry → 7. Abilities → 8. Equipment → 9. Finalize

Steps live in `src/components/character-creator/steps/` (e.g., `species-step.tsx`, `abilities-step.tsx`).

## Database operations (Supabase MCP)

Agents should apply schema and seed SQL via the **Supabase plugin** when it is enabled — not only document “run in Dashboard.” Human-only fallback: `DEVELOPER_TASK_QUEUE.md`.

| Operation | MCP tool | Notes |
|-----------|----------|-------|
| DDL (`ALTER`, `CREATE`, indexes) | `apply_migration` | `project_id`, snake_case `name`, SQL body. Preferred for tracked schema changes. |
| Seed / verify DML | `execute_sql` | `UPDATE`/`INSERT` seeds, or `SELECT` to verify after migrate. |
| Pre-flight | `list_tables` | Confirm table/column names match `SUPABASE_SCHEMA.md`. |
| Post-flight | `get_advisors` | Security/performance warnings after RLS or policy changes. |

**Project:** RealmsRPG-Test → `lbqhiwudvifmkjtkccdg`.

**Agent checklist:** (1) Read `SUPABASE_SCHEMA.md`. (2) Add idempotent SQL under `sql/` if reusable. (3) `apply_migration` for DDL + seed when appropriate. (4) `execute_sql` to verify rows. (5) Update `SUPABASE_SCHEMA.md` and `DEVELOPER_TASK_QUEUE.md` (mark DEV-### done or note MCP apply date).

**Guided creator example:** migration `guided_creator_schema_seed` — columns above + Berserker (id=`1`) abilities/loadouts + starter species flags.

## Pages / Routes

- `(main)/characters`, `(main)/characters/[id]`
- `(main)/characters/new` — Simple vs Advanced chooser
- `(main)/characters/new/guided` — Guided ("Simple") creator
- `(main)/characters/new/advanced` — Classic 9-step creator
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

**Load modal state and data:** Use `useLoadModalLibrary('power' | 'technique' | 'item' | 'empowered-technique' | 'species' | 'creature')` from `@/hooks` for load-modal visibility and library items. Optional `{ prefetch: true }` keeps rows fetching while the modal is closed (creature `?edit=`). Returns `showLoadModal`, `openLoadModal`, `closeLoadModal`, `selectableItems`, `rawItems`, `isLoading`, `error`, `emptyMessage`, `emptySubMessage`, plus source-filter state (`source` / `setSource`) and `columns` / `gridColumns`. Species/creature row builders live in `@/lib/library/creator-load-selectables` (not duplicated in pages). Render with **`LoadFromLibraryModal`** (thin `UnifiedSelectionModal` wrapper, `confirmLabel="Load"`, `maxSelections={1}`). Other selectable shaping is shared with Add Library Item via **`@/lib/library-selectable-builders`** (empowered load uses `buildEmpoweredPowerSelectableItem`). Canonical library row types: **`src/types/library.ts`**. Type-specific `handleLoad*` stays in each creator; load-success toasts use `save.setSaveMessage({ type: 'success', text: '… loaded successfully!' })` across all six.

Avoid `max-h-[…vh]` on UnifiedSelectionModal without an `md:` prefix — uncapped mobile full-screen needs the full viewport; use e.g. `className="md:max-h-[60vh]"`.

## Creator layout

Standalone creators (power, technique, empowered technique, item/armament, species, creature) use **`CreatorPageShell`** from `@/components/creator` for shared auth/load/save chrome.

- **Shell** (`CreatorPageShell`): loading/error early UI (gate on critical codex deps — parts/properties/skills/traits/feats as each page needs), `CreatorSaveToolbar`, sticky sidebar (`lg:sticky` only), `LoginPromptModal` with save vs load `reason`, publish confirm, optional `LoadFromLibraryModal` + `resetConfirm`, `extraModals`.
- **Not the same as** `GuidedCreatorPageShell` (`components/guided-creator/`) — funnel hero chrome only; do not merge.
- **Layout** (`CreatorLayout`): inner `PageContainer` → `PageHeader` → grid. Prefer shell for load/save routes; crafting may use layout alone (Back vs Load/Save).
- **Auth:** Soft gate (login modal) — no hard redirect. Species Load stays ungated (`requireAuthToLoad: false`); toolbar Load label follows that flag.
- **Sidebar:** Default sticky on `lg+`; pass `stickySidebar={false}` for short summaries (species).
- **Collapsibles:** Use **`CollapsibleSection`** only (`ui/Collapsible` removed). Expand control is a dedicated `<button>`; `rightSlot`/Remove sit outside it; section titles are `h2` (under page `h1`). Ad-hoc chrome screenshot audit: `npm run verify:shell-creators-audit` → `.shell-creators-audit/`.
- **Domain logic** (cost math, `handleLoad*`, section islands) stays in each page `children`.

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
