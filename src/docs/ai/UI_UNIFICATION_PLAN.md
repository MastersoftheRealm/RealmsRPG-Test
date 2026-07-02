# UI/UX Unification Plan (durable roadmap)

> **This is the guiding document for the UI/UX unification effort.** It supersedes
> ad-hoc task-queue entries for this work. The original audit + plan were produced in
> Cursor plan mode (not persisted); this file is the durable, source-controlled copy.
> Keep the **Progress** section current as phases land.

## North-star

Make the app feel like it was designed by **one team over a long time** — not twenty
independent AI sessions. For every page/component ask: *"If a user didn't know the
codebase, would they believe this belongs to the same product?"* **Unify, don't redesign.**
Preserve all functionality, workflows, pages, architecture, and branding. Improvements are
limited to standardization + minor refinement.

## Locked decisions

- **Aggressive semantic-only token re-architecture** in `globals.css` (no inverted numbered
  scales in the target state), with a **temporary compat-alias shim** so the app keeps
  building through the migration. Numbered ramps stay until components migrate, then go.
- **Two-tier tokens:** primitive ramps (tier 1) → theme-aware **semantic** tokens (tier 2)
  that are correct in *both* themes. Components consume semantic tokens; ad-hoc `dark:`
  overrides get removed as components migrate.
- **Verification-first** (no manual visual QA dependency): Playwright screenshot baselines
  + `@axe-core/playwright` + build-time WCAG-AA contrast script + hard-error ESLint
  `no-raw-color` + `/dev/styleguide` gallery, all behind `npm run verify`.
- **CI hard-blocks** (`.github/workflows/ui-verify.yml`): build/lint/contrast/a11y are strict
  pass/fail; visual-regression diffs block until an agent reviews the diff PNGs against the
  north-star test and explicitly re-approves baselines in the same change (never auto-accept).
- **Standards = dominant existing values.** When unifying a ladder (radius/elevation/spacing/
  type/container/motion/focus), adopt the value already most common in the codebase so the
  visual change is minimal; encode it as a token and migrate outliers to it.
- **Visual State Exploration Audit (VSEA)** runs **alongside** migration phases — not only on
  default page views. Explore every meaningful interactive state before refactoring a surface;
  log findings in `src/docs/ai/VISUAL_STATE_AUDIT.md`. Retroactively re-audit anything already
  migrated (Phase 1.1–1.2 queue). See § Visual State Exploration Audit below.

## Visual State Exploration Audit (cross-cutting)

Static Playwright baselines (Phase 0a) only capture **default route views**. Many inconsistencies
hide in modals, expanded accordions, selected tabs, validation errors, empty states, loading, and
hover/focus. VSEA closes that gap.

### Process (mandatory before refactoring a surface)

1. **Explore** — Use the full interaction checklist in `VISUAL_STATE_AUDIT.md` (accordions,
   dropdowns, modals, tabs, filters, selection, hover/focus/active/disabled/loading/error,
   empty vs populated, long vs short content, character sheet tabs, inventory, stat blocks,
   chips/badges in all variants). Capture screenshots where helpful.
2. **Evaluate** — For each state, score visual consistency, UX, and design-system alignment.
   Document even small drift (padding, radius, hover color, transition duration, icon spacing).
3. **Classify** — Tag each finding: `isolated` · `repeated` · `duplicate-system` ·
   `independent-evolution`. Assign fix phase (1–5).
4. **Log** — Append to the findings table in `VISUAL_STATE_AUDIT.md`; update coverage tracker.
5. **Then refactor** — Migration/fix work for that surface may proceed once exploration is logged
   (or marked `deferred` with reason). Do not skip exploration to save time.

### Retroactive review

Phase 1.1–1.2 migrated UI primitives and two shared components **before** VSEA was formalized.
The **Retroactive queue** in `VISUAL_STATE_AUDIT.md` must be cleared (re-explore all states,
confirm or fix) before those components are considered done.

### Relationship to `npm run verify`

| Layer | Catches |
|-------|---------|
| Phase 0a baselines | Default full-page views, light + dark, 3 breakpoints |
| VSEA (manual + styleguide) | Interactive states, component matrices, authenticated flows |
| Future: state Playwright suites | Regressions on high-value states (modal-open, tab-X, etc.) |

VSEA does not replace verify — it informs **what** to migrate and **which states** deserve baselines.

## Execution order

- **Phase 0a — Safety net.** Stand up verification + capture baselines from the current app. ✅ Done.
- **Phase 0 — Token re-architecture.** Rebuild `globals.css` as two-tier semantic tokens
  (both themes fully defined) + compat shim + standards ladders; prune dead CSS; rewrite
  `DESIGN_SYSTEM.md`. ✅ Done.
- **Phase 1 — Component migration.** Move components onto semantic classes (codemod-assisted,
  leaf-first); remove compat shim + dead CSS. ✅ Done (1.1–1.6).
- **Phase 2 — Component consolidation.** Adopt/retire `Card`; migrate marketing buttons to
  `<Button>`; consolidate the 4 chip systems; standardize loading + empty states. ✅ Done.
- **Phase 3 — Layout & navigation.** Normalize container widths; apply title-font decision to
  `PageHeader`; replace inline `<h1>`s; standardize page padding. ✅ Done.
- **Phase 4 — Color *meaning* migration.** Replace status/color maps with semantic tokens;
  fix light-only borders; replace arbitrary hex. ✅ Done.
- **Phase 5 — Responsive, a11y, polish.** Tables in `<TableScroll>`; touch targets; unify
  breakpoints; `prefers-reduced-motion`; motion tokens; focus rings; z-index ladder. ✅ Done.

## Progress

| Item | Status | Notes |
|------|--------|-------|
| Phase 0a safety net | ✅ | Contrast + visual + a11y + ESLint + styleguide + CI. |
| Contrast script `.dark` extraction bug | ✅ fixed | Was matching `@custom-variant`, not `.dark {}`; silently compared dark≈light. |
| Playwright stale-server foot-gun | ✅ fixed | `reuseExistingServer: false`; `verify`/update scripts build first. |
| Font determinism | ✅ fixed | Self-hosted `Nova Flat` via `next/font` (was CDN `display=swap` → reflow). |
| Phase 0.1 — complete dark theme | ✅ | Theme-aware FG tokens; filled every light-only dark token (title, category, combatant, accent, card, muted, destructive, health). Light unchanged. Contrast 56/56 both themes. |
| Phase 0.2 — collapse dual namespaces | ✅ | Legacy `:root` vars now alias `var(--color-*)` (single source of truth); removed 16 duplicated `.dark` legacy-hex lines; `body` points at canonical tokens. No external `var(--legacy)` consumers → shim removable in Phase 1. Zero visual change (baselines unchanged). |
| Phase 0.3 — standards ladders as tokens | ✅ | Added semantic `@theme` ladders (additive, no visual change): radius (`--radius-control/-card/-pill`), elevation (`--shadow-card/-raised/-overlay`), motion (`--duration-fast/-base/-slow`, `--ease-standard`), containers (`--container-narrow/-standard/-wide/-full-tool`). Values = dominant existing usage. Migration targets for Phase 1/3. |
| Phase 0.4 — prune dead CSS | ✅ | … Kept `.btn-solid/-outline-clean/-stepper*`, `.tab-nav*/.tab-pill*`, `.skeleton*`, `.page-container`, `.font-display`. Removed `.card/.interactive-card/.selection-card*` in Phase 2.3. Build + verify green. |
| Phase 0.5 — rewrite `DESIGN_SYSTEM.md` | ✅ | Added Token Architecture section (two tiers, theme-aware FG tokens, standards ladders); corrected every stale "CSS classes available" list and the inline-spinner migration example to match the post-prune reality. |
| Phase 1.1 — UI primitives → semantic *-fg tokens | ✅ | Migrated `Button` (primary → `bg-primary-button`), `Chip` status + power/martial deprecated variants, `Alert`, `Toast` off `text-*-700 dark:text-*-300` pairs onto theme-aware `text-*-fg`. Added semantic FG swatch section to `/dev/styleguide`. Styleguide baselines updated (intentional height increase); all other 48 visual baselines unchanged. Verify green. |
| Phase 1.2 — shared leaf components (batch 1) | ✅ | `PointStatus` + `TabSummarySection` highlight colors → `text-*-fg`. No visual baseline changes. Verify green. |
| Phase 1.3 — shared leaf components (batch 2) | ✅ | All `components/shared/*` status foreground text → `text-*-fg` (incl. gap-fix pass: toggles, delete icons, badges, stat values, powered-martial). Zero `dark:text-(success|danger|warning|info|power|martial)` remaining in shared/. |
| Phase 1.4 — domain surfaces → *-fg tokens | ✅ | Codemod + manual pass: `character-sheet/`, `character-creator/`, `app/` routes, `CombatantCard`, header, archetype-selector. Zero `dark:` status pairs repo-wide in TSX. Verify green. |
| Phase 1.1–1.3 sign-off | ✅ | **Scope:** `components/ui/*` + `components/shared/*` — all status/archetype foreground pairs migrated to theme-aware `*-fg` tokens. **VSEA retroactive:** styleguide default + interactive matrix (VSEA-002 ✅). TabSummarySection gradients → Phase 4.3. |
| Phase 1.5 — remove compat-alias shim | ✅ | Deleted legacy `:root` var() aliases from `globals.css` (zero external consumers). Verify green; baselines unchanged. |
| Phase 1.6 — light-only status ramp cleanup | ✅ | Migrated remaining light-only `text-*-700/800` status text to `*-fg` (roll-log, archetype-section, species-trait-card, value-stepper, library tabs, species-modal, campaigns, CodexPartsTab, hover-only danger hovers). |
| VSEA — methodology + findings log | ✅ | Added `VISUAL_STATE_AUDIT.md` (checklist, coverage tracker, retroactive queue, findings table). Integrated into plan as cross-cutting gate before surface refactors. First findings logged (VSEA-001, VSEA-002). |
| Phase 2.0 — Phase 2 framing + carryover inventory | ✅ | Sub-phases defined; Phase 1 carryover documented (Button `dark:` ramps, Chip `primary`, header nav); VSEA gate active for consolidation; VSEA-001 fixed in 1.6. |
| Phase 2.1 — marketing buttons → `<Button>` | ✅ | Migrated `/`, `/about`, `/resources` off `.btn-solid`/`.btn-outline-clean` to `<Button asChild>`. Grep-verified 0 className usage; removed dead `.btn-solid`, `.btn-outline-clean`, and unused `.alert-*` CSS from `globals.css`. 14 visual baselines updated (intentional). Verify green. |
| Phase 2.2 — chip consolidation | ✅ | All four chip systems → `chipVariants` (GridListRow, PartChip, ExpandableChip, changelogs); added `tp` variant for powers-step. Zero parallel style maps. |
| Phase 2.3 — Card / SelectionCard CVA | ✅ | All inline `bg-surface rounded-xl` panels migrated to `<Card>` (grep-verified **0** remain). Includes creator routes, character-creator steps, roll-log, creature-stat-block, sheet mini-cards. `cardVariants` uses semantic primary tokens. |
| Phase 2.4 — loading/empty standardization | ✅ | All list/search/modal/page loading + filter-empty surfaces use `LoadingState`/`EmptyState` (incl. feats-step). Auth button loading copy intentionally inline. |
| Phase 2.5 — primary semantic tokens + primitives | ✅ | Primitives + header done. **2.5b batch 1:** marketing/public/shared. **2.5b batch 2:** character-creator steps + creator chrome. **2.5b batch 3:** character-sheet, shared modals/toggles, codex, encounters, creature-creator. Added `primary-subtle-*` tokens. **Zero** `dark:text-primary-*` / `dark:bg-primary-*` / `dark:border-primary-*` in `src/`. Verify green. |
| Phase 2 carryover — TSX primary ramp codemod | ✅ | `scripts/migrate-primary-tokens.mjs` + manual pass migrated ~110 files from numbered `primary-[0-9]` class usage to semantic tokens. Cleared stragglers in sheet-action-toolbar, recovery-modal, edit-section-toggle, roll-log, header, etc. **Remaining numbered usage (intentional):** `globals.css` token defs + legacy utilities, styleguide swatches, auth layout gradient, native `accent-primary-600`. Verify green. |
| VSEA-002 — styleguide interactive matrix | ✅ | Added "Interactive State Matrix" section to `/dev/styleguide` (buttons, form, chips, tabs, overlays). 6 styleguide baselines updated (intentional height increase). Finding closed in `VISUAL_STATE_AUDIT.md`. |
| Phase 3 — PageHeader (increment 1) | ✅ | Migrated `my-account`, `characters/new`, `campaigns/[id]` (read-only), `encounters/[id]/mixed` (static title). |
| Phase 3 — layout normalization (increment 2) | ✅ | Added `PageContainer` `tool` size (1600px). Character sheet + campaign view use `size="tool"`. Removed duplicate `py-8 px-4` wrappers on creator pages (CreatorLayout owns padding). Shared `EncounterPageHeader` for combat/skill/mixed with editable title + save status. `PageHeader` supports `ReactNode` title/description, `onTitleClick`, `font-display`. Skills allocation → `PageHeader`. Character not-found → `PageHeader`. Verify green. |
| Phase 3 — remaining (increment 3) | ✅ | Removed my-account duplicate outer padding wrapper; error + not-found → `PageHeader`. Verify green. |
| Phase 3 — close-out (increment 4) | ✅ | Styleguide → `PageContainer` + `PageHeader`. `PageContainer` sizes wired to `--container-*` CSS vars. Removed dead `.page-container` CSS (zero TSX usage). **Phase 3 ✅ complete** (documented exceptions: sheet-header editable name, auth-card, global-error minimal shell, home sr-only h1). |
| Phase 4 — rarity colors (increment 1) | ✅ | Added `rarity*` chip variants + `rarityChipVariant()`. Item creator summary badge → `<Chip>`. Removed dead `RARITY_COLORS`. Styleguide rarity row. Verify green. |
| Phase 4 — category colors (increment 2) | ✅ | **Already migrated in Phase 2.2** via chip category variants + `partChipVariant()`. Removed dead `CATEGORY_COLORS` map; merged `part-category.ts` fuzzy codex labels into `part-chip-variant.ts`; deleted duplicate file. Verify green. |
| Phase 4 — TabSummarySection gradients (increment 3) | ✅ | Variants use theme-aware domain tokens (`power-light`, `martial-light`, `currency-light`, `info-light`, `surface-*`) + semantic borders; `SummaryItem` power highlight → `text-power-fg`. Dark domain border overrides. Styleguide shows all 5 variants. Verify green. |
| Phase 4 — shared power violet cleanup (increment 4) | ✅ | `PoweredMartialSlider`, `InnateToggle`, sheet level-up FAB → `text-power-fg` / `bg-power-light` / `border-power-border`. |
| Phase 4 — power/martial + encounter domain (increment 5) | ✅ | Archetype section/modals, creator archetype-step, recovery modal, GridListRow innate, sheet-header, encounters list TYPE/STATUS maps, CombatEncounterView combatant types, CombatantCard conditions → semantic domain tokens. Added `accent-fg`/`accent-border`, `info-border`. `rarityAscended` chip fixed. |
| Phase 4 — chip surface backgrounds (increment 6) | ✅ | `list*`/`tp`/`proficiency` chip variants → theme-aware `-light`/`-fg`/`-border` tokens; zero `dark:` on chip surfaces. |
| Phase 4 — encounter in-session domain (increment 7) | ✅ | `CombatantCard` + `SkillEncounterView` → ally/enemy/companion/health/energy/success/danger/warning semantic tokens. Crafting list status map. |
| Phase 4 — item creator rarity table (increment 8) | ✅ | `RARITY_REFERENCE` rows → `<Chip variant={rarityChipVariant()}>` (single rarity color system). |
| Phase 4 — recovery slider hex (increment 9) | ✅ | Manual allocation slider uses `var(--color-health)` / `var(--color-energy)`. |
| Phase 4 — gap closure (increment 10) | ✅ | `status-surface-classes.ts` helper; creator validation banners; modals hex removed; chip border tokens unified; creature-stat-block/sheet-header; admin/crafting/resources stragglers. **Phase 4 ✅ complete.** |
| Phase 5 — responsive, a11y, polish | ✅ | All increments 5.1–5.5 complete. |
| Phase 5 — foundations (increment 1) | ✅ | Z-index ladder in `@theme`; global `prefers-reduced-motion`; `<TableScroll>` wrapper; bare tables wrapped (armaments, archetype, item creator, admin users); primitives → `z-*` / `duration-base`; header/modal/toast/roll-log migrated. Verify green. |
| Phase 5 — motion tokens (increment 2) | ✅ | Primitives + shared surfaces + auth/about → `duration-base`/`duration-slow`/`ease-standard`. CSS `@apply` uses `var(--duration-*)` directly. Toast exit aligned via `MOTION_DURATION_SLOW_MS`. Verify green. |
| Phase 5 — focus rings (increment 3) | ✅ | Primitives + globals (input/search/tabs/focus-ring) → `ring-primary-outline-border`; `focus-visible` on buttons/icon-buttons/checkbox; error → `ring-danger-border`. Verify green. |
| Phase 5 — touch targets (increment 4) | ✅ | `touch-target` / `touch-target-md-compact` utilities; tab triggers; CombatantCard, RollButton, Chip dismiss; ValueStepper already compliant. Styleguide mobile baselines updated. Verify green. |
| Phase 5 — breakpoints + capitalization (increment 5) | ✅ | `.layout-shell-wide` for header/footer/home; `formatColumnKeyLabel()` for list column keys; species-creator trait labels. Verify green. |
| Phase 5 — gap closure (increment 6) | ✅ | Ad-hoc focus rings → `primary-outline-border`; auth/about motion tokens; `--z-popover` / `--z-skip-link`; toast exit uses `MOTION_DURATION_SLOW_MS`; btn-stepper + modal/fade keyframes on motion vars; home reviews/creator on `.layout-shell-wide`; CombatantCard full-variant HP/EN touch targets; admin/core-rules + tooltips + skills tables → `<TableScroll>`. **Phase 5 ✅ complete — no open gaps.** |
| Phase 0a follow-up — a11y baseline zero (TASK-384) | ✅ | Toast `role="region"`; tab `disabled` not `aria-disabled`; form errors `text-danger-fg`; privacy link underline; styleguide token/tab/toast fixes; `tab-nav-trigger-active` semantic tokens; `a11y-baseline.json` empty. Verify green. |
| **UI unification north-star** | ✅ | **Phases 0–5 complete.** TASK-384 a11y baseline zero. **TASK-385 ✅** — auth visual + a11y baselines (5 routes × 2 themes; `npm run e2e:provision` + `verify:auth-visual`). CI runs when DEV-003 secrets set. |

## Phase 1 ✅ complete

All status/archetype **foreground text in TSX** uses theme-aware `*-fg` tokens (zero `dark:`
status pairs; light-only ramp stragglers cleared in 1.6). Compat-alias shim removed.
**Phase 2 ✅ complete** (2.1–2.5 + carryover codemod). **Phase 3 ✅ complete.** **Phase 4 ✅ complete.** **Phase 5 ✅ complete.**

## Phase 2 sub-phases

| Sub-phase | Scope | Status |
|-----------|--------|--------|
| **2.0** | Framing: sub-phase numbering, Phase 1 carryover inventory, VSEA gate for consolidation | ✅ |
| **2.1** | Marketing CTAs → `<Button asChild>`; retire `.btn-solid`/`.btn-outline-clean`/`.alert-*` CSS | ✅ |
| **2.2** | **Chip consolidation** — parallel systems → `<Chip>` CVA | ✅ |
| **2.3** | Card adopt/retire (`.card` CSS vs `<Card>` component) | ✅ |
| **2.4** | Loading + empty state standardization | ✅ |
| **2.5** | Button/Chip primary-ramp `dark:` cleanup (Phase 1 carryover) | ✅ |

### Chip consolidation (2.2 — complete)

All four systems now route through `chipVariants` in `components/ui/chip.tsx`:

1. **`GridListRow`** — `ExpandableGridListChip` + `grid-list-chip-variant.ts` (`list`, `listCost`, `listWarning`, `listSuccess`)
2. **`PartChip` / `ExpandableChip`** — `part-chip-variant.ts` + category variants
3. **Admin changelogs** — operation badges → `<Chip variant="success|danger|primary">`
4. **Ad-hoc domain chips** — e.g. `powers-step` TP summary → `<Chip variant="tp|danger">`

**Not 2.2 scope:** Category color *meaning* maps in `creator-constants.ts` — removed in Phase 4.2 (dead code; chips use `partChipVariant()`).

## Operating rules for this effort

- Work in **small, testable increments**; run `npm run verify` after each token/CSS change.
- **VSEA before refactor:** explore all meaningful visual states for a surface (see
  `VISUAL_STATE_AUDIT.md`) and log findings before migrating it. Retroactively review
  Phase 1.1–1.2 components via the retroactive queue.
- **Light mode must not change** during Phase 0 (additive dark fills + semantic tokens only);
  dark-mode improvements are intentional → review regenerated baselines, then re-commit them.
- See **AGENT_GUIDE → Design-system safety net** for run commands, token architecture, and
  the hard-won gotchas (build-first, no stale server, self-hosted fonts, verify-your-verifier).
