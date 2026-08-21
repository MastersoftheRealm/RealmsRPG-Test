# Shared UI / Design System Audit — 2026-08-13

**Scope read in full:** `src/components/ui/**` (22 files, 2,502 LOC), `src/components/shared/**` (101 files = 98 source + 3 co-located tests, 15,648 LOC), `src/app/globals.css` (1,036 lines), `src/docs/DESIGN_SYSTEM.md`, `scripts/shared-ui-allowlist.json`, `eslint.config.mjs` + `eslint-rules/no-raw-color.mjs`.

All LOC figures below are non-blank lines, measured consistently.

**Method:** every file read; all claims verified by grep across `src/`. Docs were read but treated as untrusted — three doc claims are contradicted by code (§3.6, §8.4).

**Severity:** P0 = broken/unusable for keyboard or SR users, or crash. P1 = real user-facing defect or systemic token/contrast failure. P2 = duplication/maintainability. P3 = nit.

---

## 0. Executive summary

The layer is **not** in bad shape structurally — the `ui/` → `shared/` dependency direction is clean (zero inversions), the `shared-ui-allowlist.json` gate is 120/120 in sync, and `realms/no-raw-color` is actually holding (zero raw palette utilities in `shared/`). Three prior consolidations really landed: `OfficialEntityList` (5 wrappers → 1 generic), `GridListRow`, `UnifiedSelectionModal`.

The problems are of three kinds:

1. **Consolidation stopped at the file boundary.** The "unified" components are internally duplicated. `value-stepper.tsx` contains the same 45-line pointer-capture button **four times**; `list-header.tsx` contains the same 57-line mobile sort menu **three times verbatim**. That is 249 LOC of copy-paste inside two files that exist specifically to prevent copy-paste.
2. **Small-component families were never deduped.** 3 icon-state toggles, 2 sheet-mode toggles, 4 confirm modals, 5 chevron-disclosure implementations, 3 hand-rolled `<select>`s, 2 hand-rolled toasts, 2 tab implementations.
3. **A documented token convention is a no-op.** `text-text-muted dark:text-text-secondary` appears **199 times** in `src/components/`. In `.dark`, `--color-text-muted` and `--color-text-secondary` are both `#8b949e` (`globals.css:407-408`). Every one of those 199 overrides emits CSS that changes nothing. The `.cursor/rules/realms-accessibility.mdc` rule that mandates the pairing is enforcing dead code.

**Quantified:** 13 duplication clusters, **~1,130 LOC** removable without behaviour change. 1 P0, 9 P1. 37 dead exported symbols + 13 dead CSS component classes (~90 lines of `globals.css`) + 9 dead cva variants/sizes.

---

## 1. Layering: primitive (`ui/`) vs composite (`shared/`)

### 1.1 The good news — no inversion (verified)

`ui/**` imports **nothing** from `shared/`, feature dirs, `stores/`, `services/`, or `app/`. Total external surface of the 22 primitives:

| Import | Files |
|---|---|
| `@/lib/utils/cn` | 21 |
| `@/lib/chip/*` (5 modules) | `chip.tsx`, `expandable-chip.tsx` |
| `@/lib/tooltips/*` | `tooltip.tsx` |
| `@/hooks/use-is-client` | `modal.tsx`, `toast.tsx` |
| `@/lib/game/creator-constants` | `expandable-chip.tsx` |
| `@/lib/utils/motion` | `toast.tsx` |

Only one of these is a genuine layering smell: **`ui/expandable-chip.tsx:13` imports `formatCostDisplay` from `@/lib/game/creator-constants`**, i.e. a primitive knows about TTRPG cost formatting. It is used once, at `expandable-chip.tsx:392`. **Fix (P3):** accept a `formatCost?: (n: number) => string` prop, default `String`, and let `GridListChip` inject the game formatter.

### 1.2 `shared/` → feature-dir inversion (P2)

Five files in `shared/` import from `@/components/rolls`, a feature directory:

- `src/components/shared/creature-stat-block.tsx:8` — `useRollsOptional`
- `src/components/shared/creature-stat-block-panels.tsx:22` — `type useRollsOptional`
- `src/components/shared/entity-library-inventory.tsx:10` — `useRollsOptional`
- `src/components/shared/quick-armaments-sections.tsx:15` — `useRollsOptional`
- `src/components/shared/official-creature-list.tsx:14` — `RollLog`, `RollProvider`

`official-creature-list.tsx` is the worst: it **renders** `<RollProvider>` and `<RollLog>` (lines 70, 91), so a "shared list component" hard-wires a feature's provider tree. **Why it matters:** `shared/` can no longer be reasoned about or tested without the rolls feature, and any consumer that already has a `RollProvider` gets a nested duplicate.

**Fix:** move `useRollsOptional` + `RollProvider`/`RollLog` to `src/hooks/use-rolls.ts` + `src/components/shared/rolls/` (they are already generic), or invert: `OfficialCreatureList` takes `wrapper?: (children) => ReactNode` and the Library page supplies the provider.

`src/components/shared/guided-choice/guided-choice-shell.tsx:20` imports `type CreatorLayer` from `@/stores/character-creator-store` — type-only, so no runtime coupling, but it binds the *guided* creator's shell to the **legacy** creator store that is being retired. **Fix (P2):** define `export type CreatorLayer = 1 | 2 | 3` in `guided-choice/` and have the store import it.

### 1.3 Feature-specific code sitting in `shared/` (P2)

`shared/` is 101 files but only ~35 are genuinely cross-feature. The following are single-consumer or single-feature and belong in a feature folder:

| File | LOC | Why it isn't shared |
|---|---|---|
| `creature-stat-block*.{ts,tsx}` (6 files) | 1,348 | Creature domain only; `creature-stat-block-display-data.ts` (333) is pure creature data mapping |
| `entity-library-*.{ts,tsx}` (7 files) | 1,112 | Character-sheet list sections; `entity-library-sections.tsx` is a 38-line re-export facade |
| `quick-armaments-sections.tsx` | 404 | Archetype-tab tables |
| `skills-allocation-page.tsx` | 513 | A whole *page*, in `components/shared/` |
| `ability-score-grid.tsx` | 314 | Sheet layout |
| `add-combatant-modal.tsx` | 414 | Encounter feature (docs even say "intentional non-USM") |
| `powered-martial-slider.tsx` | 146 | Archetype allocation |
| `realms-image-picker.tsx` | 473 | Admin image tooling |

That is **4,724 LOC (30% of `shared/`)** that is feature code. `skills-allocation-page.tsx` naming a *page* inside `components/shared/` is the clearest signal.

**Fix:** three-tier target architecture in §11.

---

## 2. Duplication clusters (highest-value section)

### 2.1 Cluster table

| # | Cluster | Members (LOC) | What differs | Consolidation | Save |
|---|---|---|---|---|---|
| C1 | Confirm / prompt modals | `confirm-action-modal` 98 · `delete-confirm-modal` 77 · `login-prompt-modal` 85 · `unified-selection-modal-leave-prompt` 59 = **319** | Icon, copy, button count/direction. All four: `Modal size="sm/md" showCloseButton={false} titleA11y` + centred icon circle + hand-rolled heading + flex button row | One `ConfirmDialog({ icon, tone, title, body, actions[] })` in `ui/`; the other three become 12-line presets | **~209** |
| C2 | Icon-pair state toggles | `selection-toggle` 81 · `equip-toggle` 79 · `innate-toggle` 65 = **225** | Icon pair (Plus/Check, Circle/CheckCircle2, ☆/★), on-colour, size map | `ui/icon-state-toggle.tsx` (~70) + 3 presets (~36) | **~119** |
| C3 | Sheet edit-mode toggles | `edit-section-toggle` 108 · `temp-modifier-toggle` 66 = **174** | Icon (Pencil vs SlidersHorizontal), tone (primary/success/danger vs warning). Class list is **verbatim identical** for 14 lines (`edit-section-toggle.tsx:77-97` ≡ `temp-modifier-toggle.tsx:43-61`) | One component + a `sheetModeToggleClass({ tone, active })` helper | **~79** |
| C4 | **`ValueStepper` internal** | `value-stepper.tsx` **472** — 4 copies of the same ~45-line pointer-capture button: L258-302, L313-357, L397-442, L459-504 | glyph `−`/`+`, which `useHoldRepeat` handle, `canDecrement`/`canIncrement`/`disabled` | Extract `StepperGlyphButton({ glyph, onActivate, disabled, size, title, hold })`; `ValueStepper`/`DecrementButton`/`IncrementButton` all render it | **~135** |
| C5 | **`ListHeader` internal** | `list-header.tsx` **511** — 3 verbatim copies of the mobile sort menu: L258-315, L399-457, L472-529 | nothing (identical markup, identical classes, identical aria) | Extract `<MobileSortMenu columns sortState onSort />` | **~114** |
| C6 | List shells / toolbars | `official-entity-list` 255 · `codex-browse-list-shell` 123 · `list-search-toolbar` 70 · `unified-selection-modal-toolbar` 67 = **515** | `ListSearchToolbar` and `UnifiedSelectionModalToolbar` are the *same component*: both build a `SearchInput` and wrap it in `FilterSection variant="compact" toolbarStart={searchField}`. `CodexBrowseListShell` = `OfficialEntityList` minus data-fetching | Delete `UnifiedSelectionModalToolbar`, use `ListSearchToolbar` with `scopeExtra`/`belowToolbar` props; make `CodexBrowseListShell` a `mode="controlled"` variant of `OfficialEntityList` | **~130** |
| C7 | Hand-rolled `<select>` filters | `add-skill-modal.tsx:171-181` · `add-sub-skill-modal.tsx:275-287` + `:291-303` · `skill-row.tsx:208` = ~45 | Duplicated class strings; two of them are `py-1.5` (~34px, sub-44px) | `FilterNativeSelect` / `SelectFilter` already exist and are exported | **~45** + fixes 2 mobile defects |
| C8 | Hand-rolled fixed toasts | `add-skill-modal.tsx:204-208` · `add-sub-skill-modal.tsx:312-316` = 10 | none — byte-identical `<Alert variant="danger" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast max-w-md">` | `useToast()` from `ui/toast` | **~10** |
| C9 | Chip removal affordance | `ui/chip.tsx:143-155` (`onRemove`) vs `filters/chip-select.tsx:68-83` (hand-rolled span + X button) | ChipSelect's chips are `bg-primary-subtle-bg` pills; `Chip variant="primary"` is `bg-primary-chip-bg`. Two different-looking "remove me" chips in the *same filter panel* as `TagFilter`, which uses `Chip onRemove` | `<Chip variant="primary" size="sm" onRemove>` | **~16** + visual consistency |
| C10 | Chevron disclosure | `section-header.tsx:92-112` · `creature-stat-block-section.tsx:22-35` · `grid-list-row-detail.tsx:59-80` · `filters/filter-section.tsx:94-123` · `filters/character-filter.tsx:67-87` = **5 impls** | Only `FilterSection` and `CharacterFilter` wire `aria-controls`; `creature-stat-block-section` uses a 28px circular button (sub-44px) and re-implements what `SectionHeader collapsible` already does | `ui/disclosure-button.tsx` (label + chevron + `aria-expanded` + `aria-controls` + touch floor); all five consume it | **~50** + a11y consistency |
| C11 | Expandable option row | `GridListRow` family 1,658 · `ui/expandable-chip` 382 · `detail-option-list` 110 (legit wrapper) · `choice-trait-option-select` 87 (`<details>/<summary>`) | The `<details>` one is the outlier and has a nested `<button>` inside `<summary>` | Migrate `ChoiceTraitOptionListPicker` to `DetailOptionList` | **~87** |
| C12 | Two parallel styling systems | `globals.css @layer components` ~20 classes (~200 lines) vs `ui/` cva variants | `.input-field` duplicates `Input`; `.list-item*` duplicates `Card`+`cardVariants`; `.tab-nav-*`/`.tab-pill-*` are the *only* source for `TabNavigation` styling (cva absent). 13 of the classes are dead | Delete the 13 dead classes; move `.tab-nav-*`/`.tab-pill-*`/`.btn-stepper` into cva in their components | **~90** |
| C13 | Tab implementations | `ui/tab-navigation.tsx` 260 (roving tabindex ✓) · `shared/segmented-control.tsx` 120 `tabs` mode (roving tabindex ✗) | `SegmentedControl` emits `role="tab"` + `aria-selected` but no arrow-key handler and no `tabIndex` management | Either drop `tabs` mode from `SegmentedControl` (use `TabNavigation variant="pill"`), or share `TabNavigation`'s `handleTabKeyDown` | **~25** + a11y |
| C14 | `list-components.tsx` shim | 68 LOC, of which 47 are pure re-exports of `ui/` (`SearchInput`, `FilterSection`, `EmptyState`, `LoadingState`) + a duplicate `SearchInputProps` type that doesn't match the real one | only `ErrorDisplay` (21 LOC) is real code | Move `ErrorDisplay` to `ui/error-display.tsx`; delete the shim and the `ListEmptyState` alias in `shared/index.ts:161` | **~47** |

**Total removable: ~1,131 LOC** (C1–C14), no behaviour change intended.

### 2.2 C4 in detail — `ValueStepper` (the single worst offender)

```258:302:src/components/shared/value-stepper.tsx
      <button
        type="button"
        onClick={enableHoldRepeat ? undefined : handleDecrement}
        onPointerDown={ enableHoldRepeat ? (e) => { /* setPointerCapture + start */ } : undefined }
        onPointerUp={ enableHoldRepeat ? (e) => { /* try releasePointerCapture + stop */ } : undefined }
        onPointerCancel={ enableHoldRepeat ? (e) => { /* try releasePointerCapture + stop */ } : undefined }
        onLostPointerCapture={enableHoldRepeat ? () => decrementHold.stop() : undefined}
        disabled={!canDecrement}
        // ... aria-label, title, className
      >
        −
      </button>
```

That exact block appears at **L258-302** (decrement), **L313-357** (increment), **L397-442** (`DecrementButton`), **L459-504** (`IncrementButton`). The `try { releasePointerCapture } catch {}` idiom is written out **six** times in one file. `ADR-0002` and the barrel comment both say "Do not hand-roll ± buttons — use ValueStepper" — the component that enforces that rule hand-rolls its own button four times.

### 2.3 C5 in detail — `ListHeader` mobile sort

`list-header.tsx` has three early-return branches (`rightSlotWidth`, `useRowChrome`, default). Each one re-emits the mobile sort menu. Diffing L258-315 against L472-529: the only textual difference is the chevron colour class on the active indicator (`text-primary-link-fg` at L520-521 vs bare at L447-449) — i.e. the copies have **already drifted**, which is exactly the failure mode duplication causes. 114 of the file's 511 lines are copy-paste.

### 2.4 What is *already* well consolidated (do not re-do)

- `OfficialEntityList` — 5 entity wrappers (`power` 157, `technique` 174, `item` 153, `enhanced` 89, `creature` 137) all delegate. Residual cost is only ~25 identical props per wrapper; acceptable.
- `GridListRow` — split across 6 co-located files with real separation of concerns.
- `UnifiedSelectionModal` — split into 6 files; `GuidedInlineCatalogList` correctly reuses `UnifiedSelectionModalList`/`ColumnHeaders` rather than forking.
- `QuantitySelector` is a genuine thin wrapper over `ValueStepper` (78 LOC, no duplication).

---

## 3. Tokens & theming

### 3.1 P1 — 199 no-op `dark:` overrides (systemic)

`globals.css:407-408`:

```407:408:src/app/globals.css
    --color-text-secondary: #8b949e;
    --color-text-muted: #8b949e; /* WCAG AA contrast on dark surfaces */
```

The two tokens are **the same colour in dark mode**. Therefore `text-text-muted dark:text-text-secondary` is a no-op. Counts:

| Metric | Count |
|---|---|
| `text-text-muted dark:text-text-secondary` in `src/components/` | **199** |
| Same pairing across all of `src/` | **335**, in 151 files |
| Same pairing in `shared/` + `ui/` | 73 |
| All `dark:text-text-secondary` in `shared/` + `ui/` | 78 |
| All `dark:` occurrences in `shared/` + `ui/` | 137 |

So **53% of every `dark:` override in the design system layer does nothing.** They are mandated by `.cursor/rules/realms-accessibility.mdc` ("If using `text-text-muted`, add `dark:text-text-secondary`"), so the rule is generating dead CSS and 335 sites of class-string noise.

**Fix:** either (a) give `--color-text-muted` a distinct dark value (e.g. `#7d8590`) and keep the pairing meaningful, or (b) drop the pairing from the rule and delete the 199 overrides. (b) is a mechanical codemod. Pick one — the current state is the worst of both.

### 3.2 P1 — `dark:` overrides that *fight* an already-themed token

`src/components/shared/guided-choice/guided-nav-button-styles.ts:12-23`:

```12:23:src/components/shared/guided-choice/guided-nav-button-styles.ts
export const guidedNavExpandClassName = cn(
  guidedNavProgressClassName,
  'bg-primary-subtle-bg hover:bg-primary-subtle-bg/80',
  'dark:bg-surface-alt dark:hover:bg-surface'
);
export const guidedNavPreviousClassName = cn(
  guidedNavProgressClassName,
  'border-primary-outline-border text-primary-outline-fg',
  'dark:border-border dark:text-text-primary'
);
```

`--color-primary-subtle-bg`, `--color-primary-outline-border`, and `--color-primary-fg` **all have explicit `.dark` values** (`globals.css:487`, `:491`, `:483`). The `dark:` classes here discard them. **Why it matters:** in dark mode the guided creator's "See more options" button loses its blue identity and becomes indistinguishable from a neutral surface — the exact visual-hierarchy loss the theme tokens were added to prevent. **Fix:** delete all six `dark:` classes; the tokens already do the right thing.

Same pattern (numbered ramp + ad-hoc `dark:` where an `-fg`/`-light`/`-border` token exists) at:

| Location | Offending classes |
|---|---|
| `shared/edit-section-toggle.tsx:46-47` | `bg-success-50 dark:bg-success-900/25`, `ring-success-200 dark:ring-success-800/50` |
| `shared/edit-section-toggle.tsx:53-54` | `bg-danger-50 dark:bg-danger-900/25`, `ring-danger-200 dark:ring-danger-800/50` |
| `shared/temp-modifier-toggle.tsx:53,56` | `ring-warning-200 dark:ring-warning-800/50`, `max-md:bg-warning-50 dark:max-md:bg-warning-900/25` |
| `shared/hub-list-row.tsx:128` | `hover:bg-danger-50 dark:hover:bg-danger-900/20` (should be `hover:bg-danger-light`) |
| `shared/ability-score-grid.tsx:124` | `dark:from-primary-900/25 dark:via-primary-900/15` |
| `shared/creature-stat-block-panels.tsx:159,163` | `dark:border-success-800/50`, `dark:border-info-800/50` (should be `border-success-border` / `border-info-border`) |
| `shared/point-status.tsx:42-46` | `border-success-200`, `border-info-200`, `border-danger-200` (should be `border-success-border` etc.) |
| `ui/alert.tsx:18-21` | `border-info-300`, `border-success-300`, `border-warning-300`, `border-danger-300` (should be `border-*-border`) |
| `ui/chip.tsx:62,75` | `border-success-300`, `border-accent-200` (should be `border-success-border`, `border-accent-border`) |

**Worst offenders by `dark:` count:** `skill-row.tsx` 13 · `quick-armaments-sections.tsx` 11 · `ability-score-grid.tsx` 8 · `creature-stat-block-panels.tsx` 6 · `edit-section-toggle.tsx` 5.

### 3.3 P1 — hardcoded rgba in arbitrary values escapes the lint guardrail

`eslint-rules/no-raw-color.mjs:37` only catches `[#hex]`:

```37:37:eslint-rules/no-raw-color.mjs
const ARBITRARY_HEX_RE = /\[#(?:[0-9a-fA-F]{3,8})\]/;
```

`rgba()` / `hsl()` inside an arbitrary value passes. Six live violations, all theme-blind (they render the same glow in light and dark):

| Location | Value | Should be |
|---|---|---|
| `shared/edit-section-toggle.tsx:45` | `drop-shadow-[0_0_3px_rgba(34,197,94,0.5)]` | `--color-success-500` |
| `shared/edit-section-toggle.tsx:48` | `drop-shadow-[0_0_6px_rgba(34,197,94,0.35)]` | ″ |
| `shared/edit-section-toggle.tsx:52` | `drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]` | `--color-danger-500` |
| `shared/edit-section-toggle.tsx:55` | `drop-shadow-[0_0_6px_rgba(239,68,68,0.35)]` | ″ |
| `shared/temp-modifier-toggle.tsx:51` | `drop-shadow-[0_0_3px_rgba(245,158,11,0.45)]` | `--color-warning-500` |
| `shared/temp-modifier-toggle.tsx:54` | `drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]` | ″ |

**Fix:** extend the rule with `/\[[^\]]*(?:rgba?|hsla?)\(/` and add `--shadow-glow-success|danger|warning` tokens to `@theme`.

### 3.4 P2 — undefined token silently renders nothing

`src/components/shared/ability-score-grid.tsx:112` and `:163` use `dark:border-primary-border`. **`--color-primary-border` is not defined anywhere in `globals.css`** (verified: zero matches). Tailwind v4 emits no `border-primary-border` utility, so the class is inert and dark-mode secondary/selected ability tiles keep the light-theme `border-primary-subtle-border`. Two dead classes plus a dark-mode visual bug. **Fix:** use `dark:border-primary-subtle-border` (already themed) or delete.

### 3.5 P2 — the raw-color guardrail is off for the whole `ui/` layer

`eslint.config.mjs:66-75` disables `realms/no-raw-color` for `src/components/ui/**`. Consequence — three live raw-colour uses in primitives:

- `ui/modal.tsx:191` — `bg-black/60` (backdrop; defensible, but should be `--color-overlay`)
- `ui/chip.tsx:150` — `hover:bg-black/10` on the chip remove button. On the dark-mode category chips (`--color-category-*` are near-black in `.dark`, e.g. `#0c2622`) a 10% black hover is **invisible**. Real defect.
- `ui/spinner.tsx:29` — `border-white/30 border-t-white` (`variant="white"`, intended for dark backgrounds; fine)

**Fix:** narrow the exemption to a per-line `eslint-disable` with a reason, so new raw colours in primitives are still caught. `ui/chip.tsx:150` → `hover:bg-current/10`.

### 3.6 P3 — radius / shadow ladders defined but unadopted

`globals.css:335-343` defines `--radius-control/card/pill` and `--shadow-card/raised/overlay` with the comment *"Additive only (no visual change until adopted)"*. Adoption after ~6 months: **zero**. Every component still uses `rounded-lg`/`rounded-xl`/`rounded-2xl`/`rounded-md`/`rounded-full` and `shadow-sm`/`shadow-md`/`shadow-lg`/`shadow-2xl` directly. Concrete drift this allows:

| Surface | Radius |
|---|---|
| `ui/card.tsx:12` (Card) | `rounded-xl` |
| `ui/modal.tsx:207` (Modal) | `rounded-2xl` |
| `shared/grid-list-row.tsx:183` (row) | `rounded-lg` |
| `shared/hub-list-row.tsx` (row, via Card) | `rounded-xl` |
| `ui/chip.tsx:101-105` | `rounded-full` / `rounded-md` / `rounded-lg` |

Three different radii for three list-row-shaped surfaces. **Fix:** either adopt the ladder in `ui/` (one PR, mechanical) or delete the unused tokens. Same for `--container-narrow` (`max-w-narrow` — 0 uses).

---

## 4. API design

### 4.1 P2 — prop explosion

| Component | Props | Note |
|---|---|---|
| `GridListRowProps` (`grid-list-row-types.ts:81-192`) | **44** | 13 are booleans |
| `GridListRowCollapsedProps` (`grid-list-row-collapsed.tsx:61-102`) | **41** | Internal; `grid-list-row.tsx:307-348` is 42 straight lines of prop plumbing |
| `UnifiedSelectionModalProps` (`unified-selection-modal-types.ts:63-163`) | **34** | |
| `OfficialEntityListProps` (`official-entity-list.tsx:39-106`) | **31** | |
| `GuidedInlineCatalogListProps` (`guided-inline-catalog-list.tsx:48-90`) | **28** | |

**Boolean-flag soup in `GridListRowProps`:** `selectable`, `disabled`, `innate`, `hideInnateBadge`, `hideUsesInName`, `equipped`, `defaultExpanded`, `expanded`, `compact`, `isSelected`. The internal resolution of these into layout is 50 lines of imperative track arithmetic (`grid-list-row.tsx:197-229`) with 8 derived booleans (`inlineSelectable`, `inlineEditDelete`, `inlineDelete`, `inlineEdit`, `inlineRightSlot`, `inlineWarning`, `externalRightSlot`, `externalSelectable`…). **Fix:** replace the 41-prop hand-off with a single context (`GridListRowContext`) or one `chrome` object; collapse `innate`/`equipped`/`disabled` into `state?: 'default' | 'innate' | 'equipped' | 'disabled'`.

### 4.2 P2 — `GridListRowProps.equipped` is a dead prop

`grid-list-row-types.ts:152-153` declares and documents `equipped?: boolean` ("Visual state: item is equipped (green border/bg styling)"). `grid-list-row.tsx:48-93` does **not** destructure it, and nothing downstream reads it. Any caller passing `equipped` gets silence. **Fix:** delete, or implement.

### 4.3 P1 — `SearchInput` external `ref` silently breaks clear-focus

```71:84:src/components/ui/search-input.tsx
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('search-input', sizes.input, showClear && value && 'pr-10', className)}
        {...props}
      />
```

`SearchInput` is not a `forwardRef` component and spreads `{...props}` **after** `ref={inputRef}`. Under React 19, `ref` is an ordinary prop for function components, so `<SearchInput ref={r} />` overwrites the internal ref → `handleClear` (L61-64) can no longer refocus the field after clearing. Silent, order-dependent breakage. **Fix:** accept `ref` explicitly and merge, or expose `inputRef` as a prop.

### 4.4 P2 — `ref` unavailable on 6 components with no `...rest` spread

These accept an explicit prop list, no `...rest`, no `ref` — so callers cannot attach a ref, `id`, `data-*`, or extra `aria-*`:

`shared/selection-toggle.tsx` · `shared/equip-toggle.tsx` · `shared/innate-toggle.tsx` · `shared/segmented-control.tsx` · `shared/point-status.tsx` · `shared/value-stepper.tsx` · `shared/list-header.tsx` · `shared/section-header.tsx` · `shared/tab-summary-section.tsx` · `shared/loadout-budget-bar.tsx` · `ui/expandable-chip.tsx` · `ui/tab-navigation.tsx`

`ui/expandable-chip.tsx` is the notable one: it has an internal `shellRef` (L109) used for layout capture, but no way for a caller to observe or scroll to the chip. **Fix:** add `...rest` + `ref` (React 19 needs no `forwardRef`).

`forwardRef` coverage is 8/21 in `ui/` (`button`, `icon-button`, `input`, `select`, `checkbox`, `textarea`, `chip`, `card`) and 2 in `shared/` (`roll-button`, `filters/filter-native-select`). Note `filter-native-select.tsx` exports `FilterInput` **with** `forwardRef` and `FilterNativeSelect` **without**, in the same 40-line file.

### 4.5 P2 — `className` merge: two conventions, one latent conflict

Two forms coexist:

- `cn(variants({ variant, size, className }))` — `ui/button.tsx:75`, `ui/chip.tsx:139`, `ui/icon-button.tsx:51`, `shared/roll-button.tsx:118`
- `cn(variants({ variant }), className)` — `ui/card.tsx:35`, `ui/selection-card.tsx:23`, `shared/value-stepper.tsx:438`

Both are correct under `twMerge`, but pick one. The real problem is `ui/search-input.tsx:78`: `cn('search-input', sizes.input, …)` mixes a **custom `@layer components` class** (`.search-input`, `globals.css:882-886`, which `@apply`s `pl-10 pr-4 py-2.5`) with utilities that conflict (`size="sm"` → `pl-8 pr-3 py-1.5`). `twMerge` cannot see inside `.search-input`, so both rule sets land in the cascade; utilities win only because of layer order. Any future layer change breaks `size="sm"` and `size="lg"` silently. **Fix:** inline `.search-input`'s declarations into the component's cva base and delete the CSS class.

### 4.6 P2 — controlled/uncontrolled inconsistency

Three different shapes for the same "optionally controlled" idea:

| Component | Controlled prop | Uncontrolled seed | Change callback |
|---|---|---|---|
| `GridListRow` | `expanded` | `defaultExpanded` | `onExpandChange` |
| `ui/expandable-chip` | `expanded` | `defaultExpanded` | `onExpandedChange` **and** `onToggle` (mutually exclusive, see `expandable-chip.tsx:186-191`) |
| `filters/filter-section` | `expanded` | `defaultExpanded` | `onExpandedChange` |
| `filters/character-filter` | — (always uncontrolled, `useState` at L46) | — | — |

`ExpandableChip` having both `onExpandedChange` and `onToggle`, where passing `onToggle` makes the component ignore its own state (`expandable-chip.tsx:186-189`), is a trap. **Fix:** one `useControllableState` hook; delete `onToggle`.

### 4.7 P2 — non-null assertion where the type allows `undefined` (latent crash)

```226:226:src/components/shared/official-entity-list.tsx
                columns={getColumns!(row)}
```

`getColumns` is optional (L55) and so is `renderRow` (L74); nothing in the type forces at least one. A caller supplying neither crashes with *"getColumns is not a function"*. Currently all five wrappers happen to supply one. **Fix:** discriminated union — `{ renderRow: … } | { getColumns: … }`.

### 4.8 P2 — `handleConfirm` mutates caller-owned objects

```202:206:src/components/shared/unified-selection-modal.tsx
    if (showQuantity) {
      selected.forEach(item => {
        (item as SelectableItem & { quantity?: number }).quantity = quantities[String(item.id)] || 1;
      });
    }
```

`selected` elements are objects from the caller's `items` array. If `items` is memoized (it is, in every wrapper — e.g. `add-skill-modal.tsx:128`), the mutation persists across modal opens and leaks a stale `quantity`. **Fix:** `onConfirm(selected.map(i => ({ ...i, quantity: … })))`.

### 4.9 P3 — `EmptyState` dual-alias props

`ui/empty-state.tsx:16-26` accepts `description` **and** `message` ("alias for backward compatibility"), and `action` is `{label,onClick,variant} | ReactNode` requiring three `as` casts at L110-113 to narrow. `shared/list-components.tsx:20-25` then declares a **second, incompatible** `SearchInputProps` type that omits `size`/`icon`/`showClear`. **Fix:** drop `message`, split `action`/`actionNode`, delete the shim type.

### 4.10 P3 — `Tooltip` vs `InfoTippy` overlap

`ui/tooltip.tsx` (163 LOC) is documented at L4 as "Styleguide/demo tooltip only. For contextual page help use `InfoTippy`". Both wrap the same `useFloatingHelpPopover`. A demo-only primitive exported from the public barrel (`ui/index.ts:40`) invites misuse. **Fix:** move to `src/app/dev/styleguide/`, or delete and give `InfoTippy` a `trigger` prop.

---

## 5. Accessibility

### 5.1 P0 — focused delete button is invisible (`hub-list-row.tsx:128`)

```119:132:src/components/shared/hub-list-row.tsx
            {onDelete && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                label={deleteAriaLabel}
                className="opacity-0 group-hover:opacity-100 text-text-muted dark:text-text-secondary hover:text-danger-fg hover:bg-danger-50 dark:hover:bg-danger-900/20 min-w-[44px] min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            )}
```

`opacity-0` with **only** a `group-hover:` escape. There is no `focus-visible:opacity-100` and no `group-focus-within:opacity-100`.

- **Keyboard:** the button is in the tab order and receives focus, but renders at zero opacity — the focus indicator is completely invisible. WCAG 2.4.7 (Focus Visible) failure on the Encounters and Crafting hub lists.
- **Touch:** no `:hover` state exists, so the delete affordance never appears on any phone or tablet. It remains tappable, so users can delete an encounter by tapping an invisible target.

**Fix:** `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 max-md:opacity-100`. Also replace `hover:bg-danger-50 dark:hover:bg-danger-900/20` with `hover:bg-danger-light`.

### 5.2 P1 — expandable list rows expose no `aria-expanded`

```151:161:src/components/shared/grid-list-row-collapsed.tsx
      <div
        data-grid-row-trigger
        role={isRowClickable ? 'button' : undefined}
        tabIndex={isRowClickable ? 0 : undefined}
        onClick={isRowClickable ? handleRowClickWithGuard : undefined}
        onKeyDown={isRowClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        } : undefined}
```

`role="button"` with no `aria-expanded` and no `aria-controls`, on the component the barrel calls the row for "ALL expandable list rows across the site" (Library, Codex, sheet modals, creators). Screen-reader users hear "button" and get no indication of collapsed/expanded state and no pointer to the revealed panel. WCAG 4.1.2. This is the single highest-blast-radius a11y defect in the layer.

**Fix:** in `grid-list-row.tsx`, pass `isExpanded` and a generated panel id down; set `aria-expanded={isExpanded}` and `aria-controls={panelId}` on the trigger, `id={panelId}` on `GridListRowExpandedBody`.

`ui/expandable-chip.tsx` gets this right (`aria-expanded` at L257 and L268) — the inconsistency is within the same design system.

### 5.3 P1 — non-unique dialog `id` breaks the accessible name of nested modals

```217:227:src/components/ui/modal.tsx
        aria-labelledby={(title && hasSimpleHeader) || (!title && hasCustomHeader) ? 'modal-title' : undefined}
        …
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {!title && hasCustomHeader && (
          <span id="modal-title" className="sr-only">{titleA11y ?? 'Dialog'}</span>
        )}
```

`modal-title` and `modal-description` are **hardcoded literals**. Every open `Modal` portals into `document.body`, so two open modals produce duplicate ids and `aria-labelledby` resolves to the first match in document order.

This is live: `unified-selection-modal.tsx:293` renders the selection `Modal` and `:367` renders `UnifiedSelectionModalLeavePrompt` (another `Modal`) as a sibling. When the "Add selected?" prompt opens, a screen reader announces the **selection modal's** title instead of the confirmation prompt's. **Fix:** `const titleId = useId()`.

### 5.4 P1 — background scroll lock is released while a modal is still open

```106:115:src/components/ui/modal.tsx
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
```

Absolute assignment with no reference counting. Reproduction with the shipped `UnifiedSelectionModal`:

1. Open a selection modal → body locked.
2. Select something, press Esc / the X → leave prompt opens (nested `Modal`, `isOpen` false→true) → still locked.
3. Dismiss the prompt (backdrop or Esc) → the prompt's effect re-runs with `isOpen: false` → `overflow = ''`.
4. The selection modal is **still open** but the page behind it now scrolls.

**Fix:** module-level lock counter, or `useBodyScrollLock()` that tracks open dialogs.

### 5.5 P1 — Escape is handled by every mounted `Modal`, open or not

```117:125:src/components/ui/modal.tsx
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) { onClose(); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
```

The listener is registered unconditionally (`Modal` runs its hooks before the `!isOpen` early return at L142). With stacked modals, one Escape keypress fires **both** `onClose` handlers. `UnifiedSelectionModal` only survives this because `handleRequestClose` has a `if (leaveConfirmOpen) return` guard (`unified-selection-modal.tsx:226`) *and* because the outer listener happens to be registered first. Any other nested pair (a `DeleteConfirmModal` inside an admin editor modal) closes both dialogs on one Escape, discarding the parent's state. **Fix:** register only when open, `stopPropagation`, and stack-aware "topmost dialog wins".

### 5.6 P1 — two TagFilters share one radio group

```72:78:src/components/shared/filters/tag-filter.tsx
            <input
              type="radio"
              name="tagMode"
              checked={tagMode === 'any'}
              onChange={() => onModeChange('any')}
```

`name="tagMode"` is a hardcoded literal (also L84). Radio-group scope is the whole document, so two `TagFilter` instances (e.g. a page filter panel plus a modal filter panel, or two codex tabs both mounted) form **one** group: switching Any→All in one visually clears the other's selection. The component already calls `useId()` at L39 for the select. **Fix:** `name={`${id}-tagMode`}` and wrap in `<fieldset><legend class="sr-only">Tag match mode</legend>`.

### 5.7 P1 — `EquipToggle` has no touch-target floor while its two siblings do

```31:35:src/components/shared/equip-toggle.tsx
const SIZE_STYLES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};
```

24px / 32px / 40px — all below 44px, with no `min-w`/`min-h` floor. Compare `selection-toggle.tsx:33-37` (`min-w-[var(--touch-target-min,44px)] min-h-…` on all three sizes) and `innate-toggle.tsx:51` (`min-w-[44px] min-h-[44px]`). Three toggles built from the same template; one of them silently violates `MOBILE_UX.md`. **Fix:** copy the `SIZE_STYLES` from `SelectionToggle` (or fold all three into C2).

### 5.8 P2 — mobile "Sort by" is a listbox with no listbox keyboard model

`list-header.tsx:280-313` (and its two clones). The trigger has `aria-expanded` + `aria-haspopup="listbox"` but **no `aria-controls`**; the popup is `role="listbox"` containing `<button role="option">` children. Problems:

- No `aria-activedescendant`, no Arrow Up/Down, no Home/End.
- No Escape handler — the only dismissal is the document `click` listener at L155-163 (which is also registered permanently, even when closed).
- `role="option"` on a `<button>` overrides the button role; the listbox itself is not focusable.

It remains operable (options stay tab-focusable), so P2 not P1. **Fix:** either use a real `<select>` on mobile, or implement the listbox pattern once in the extracted `MobileSortMenu` (C5).

### 5.9 P2 — disabled-reason exposed only via `title` on presentational elements

`grid-list-row-collapsed.tsx:319-328` and `:410-424`:

```326:327:src/components/shared/grid-list-row-collapsed.tsx
            role="presentation"
            title={disabled && warningMessage && !inlineWarning ? warningMessage : undefined}
```

`title` on an element with `role="presentation"` is not surfaced to assistive tech, so the reason a row can't be selected ("Requires Level 5", "Not enough Training Points") is invisible to SR users. Same pattern at `grid-list-row-collapsed.tsx:302` — the inline warning is an `AlertCircle` icon inside a `<div title={warningMessage}>` with no accessible text. **Fix:** put `aria-describedby` on the `SelectionToggle` pointing at an `sr-only` span carrying `warningMessage`.

### 5.10 P2 — heading hierarchy

The layer emits headings at four levels with no coordination:

| Location | Tag | Context |
|---|---|---|
| `ui/page-header.tsx:66` | `h1` | page |
| `shared/section-header.tsx:91` | `h2` | any section |
| `shared/hub-list-row.tsx:94` | `h2` | **every list row** |
| `shared/guided-choice/guided-choice-shell.tsx:103` | `h2` | step |
| `shared/guided-choice/guided-choice-shell.tsx:124` | `h3` | group |
| `ui/card.tsx:57` (CardTitle) | `h3` | card |
| `shared/grid-list-row-detail.tsx:60,82` | `h3` | chip-section label inside a row |
| `shared/confirm-action-modal.tsx:77` | `h2` | confirm dialog |
| `shared/delete-confirm-modal.tsx:53` | `h3` | **same** dialog pattern |
| `shared/error-boundary.tsx:57` | `h3` | error card |

Two concrete defects: (a) `HubListRow` makes every row an `h2`, so an encounters list with 12 rows produces 12 sibling `h2`s under the page `h1` — the heading outline becomes a flat list of row titles; (b) the same confirm-dialog pattern uses `h2` in one file and `h3` in the other (`grid-list-row-detail.tsx:60` also puts an `h3` inside a row body, below a `HubListRow` `h2` in some layouts). **Fix:** `HubListRow` title → `<p class="font-semibold">` (or accept `titleAs`); give `SectionHeader`/`CardTitle`/`DetailSectionLabel` an `as` prop; standardise confirm dialogs on `h2` via C1.

### 5.11 P2 — nested interactive content

- `shared/hub-list-row.tsx:69-82` — `role="button"` + `tabIndex={0}` on the `Card`, containing a focusable delete `IconButton`. A button inside a button; SR users get an ambiguous target.
- `shared/choice-trait-option-select.tsx:59-82` — a `<Button>` **inside** `<summary>`, with `e.preventDefault()` at L70 to stop the `<details>` toggling. Interactive content inside `summary` is discouraged by spec and behaves inconsistently: pressing Space while the inner button is focused activates the button in some engines and toggles the disclosure in others. **Fix:** move the Select button out of `<summary>`, or migrate to `DetailOptionList` (C11).

### 5.12 P2 — focus trap can pin focus with nothing to reach

`ui/modal.tsx:149-156` filters focusables with `el.offsetParent !== null`. `offsetParent` is `null` for any `position: fixed` descendant, so fixed-position controls inside a dialog are excluded from the trap. If a dialog's only focusables are inside a fixed subtree, `focusables.length === 0` and L153-155 `preventDefault()`s Tab and pins focus on the container — a keyboard trap. The selector at L65-66 also omits `[contenteditable]`, `audio[controls]`, `video[controls]`, `summary`, and `iframe`. **Fix:** use `:not([hidden])` + `getClientRects().length` for visibility, and extend the selector.

### 5.13 P2 — three competing live regions

`ui/toast.tsx:139` (`aria-live="polite"` region — correct), `shared/value-stepper.tsx:307` (`aria-live="polite"` on **every** stepper value), `shared/guided-choice/guided-choice-shell.tsx:69` (completion badge), plus `shared/loadout-budget-bar.tsx:70` (`role="status"`, implicit polite). On the character sheet, dozens of `ValueStepper`s each become a live region; a single ability-score change fires the stepper announcement, the `LoadoutBudgetBar` announcement, and the completion-badge announcement. **Fix:** drop `aria-live` from `ValueStepper` (the button's `aria-label` + the value's accessible name already convey the change) and keep one page-level status region.

### 5.14 Icon-only buttons: good

Every icon-only control checked has a label. `IconButton` **requires** `label: string` (`ui/icon-button.tsx:43`) and applies both `aria-label` and `title` — a genuinely good API decision. `SelectionToggle`, `EquipToggle`, `InnateToggle`, `EditSectionToggle`, `TempModifierToggle`, `ExpandableImage`, `InfoTippy`, `Chip`'s remove button all set `aria-label`. No violations found.

---

## 6. React / Next best practice

### 6.1 P2 — `'use client'` on 82 of 83 `shared/` `.tsx` files

The entire shared layer is client-only. Four have neither hooks, event handlers, nor portals and are pure server-renderable:

| File | LOC |
|---|---|
| `shared/entity-library-sections.tsx` | 38 — a pure `export {}` re-export facade with `'use client'` at L1 |
| `shared/library-row-action-slot.tsx` | 10 — one `<div>` |
| `shared/summary-chip-list.tsx` | 59 |
| `shared/filters/filter-native-select.tsx` | 34 |

`entity-library-sections.tsx` is the meaningful one: a `'use client'` barrel forces every module it re-exports into the client graph even for consumers that only need a type. `ui/` is better (6 of 21).

### 6.2 P2 — `useMemo` defeated by inline function props

```149:153:src/components/shared/official-entity-list.tsx
  const cardData = useMemo(() => buildRows(items), [buildRows, items]);
  const filtered = useMemo(
    () => filterRows(cardData, search, sortItems),
    [filterRows, cardData, search, sortItems]
  );
```

Three of the five wrappers pass `buildRows` as a fresh arrow every render — `official-power-list.tsx:111`, `official-technique-list.tsx:111`, `official-item-list.tsx:107` (`buildRows={(raw) => buildOfficialPowerRows(raw, partsDb)}`). `buildRows` therefore changes identity every render, both memos recompute, and the full row-build + filter + sort runs on every keystroke in the search box. Cargo-culted memoization that measurably does nothing. **Fix:** `useCallback` in the wrappers (they already do this correctly for `filterRows`).

### 6.3 P2 — six `setState` calls in the render body

```94:120:src/components/shared/unified-selection-modal.tsx
  if (isOpen && !wasOpen) {
    const ids = new Set([...initialSelectedIds].map((id) => String(id)));
    setOpenInitialIds(ids);
    setSelectedIds(ids);
    …
    setWasOpen(true);
  } else if (!isOpen && wasOpen) { … }
```

This is the sanctioned "adjust state when props change" pattern, but with six setters and a `wasOpen` sentinel it is hard to reason about and re-runs the whole block if `initialSelectedIds` identity changes mid-open. `ui/modal.tsx:91-95` does the same thing for `animating` — and there the comment ("first open paint stays opacity-0, then transitions in") is wrong: React re-renders synchronously before committing, so the `opacity-0` frame never paints and the backdrop fade is dead code. **Fix:** key the modal on an `openToken` and initialise state in `useState` initialisers, or use `useSyncExternalStore`-free `key` remount.

### 6.4 P3 — effect that should be derived state

```108:110:src/components/shared/grid-list-row.tsx
  useEffect(() => {
    if (!isExpanded) setOpenDetailSections({});
  }, [isExpanded]);
```

Detail-section open state only matters while expanded. **Fix:** read `isExpanded ? openDetailSections : EMPTY` at use site; drop the effect.

### 6.5 P3 — index-as-key (4 sites)

`shared/grid-list-row-expanded.tsx:116` (badges), `:177` (`key={sectionIdx}`), `shared/grid-list-row-collapsed.tsx:238` (badges), `shared/powered-martial-slider.tsx:143`. Badges/sections are reorderable in principle; the file already demonstrates the right approach three lines away at `grid-list-row-expanded.tsx:198` (`key={`${chip.name}-${chip.category ?? 'default'}-${chipIdx}`}`).

### 6.6 SSR / hydration: clean

All `window`/`document` access is guarded. Both portal components gate on `useIsClient()` (`ui/modal.tsx:84,142`; `ui/toast.tsx:115,134`), `window.matchMedia` is inside an effect (`ui/modal.tsx:97-104`), `document.addEventListener` calls are all in effects. No violations found. `Button`'s `onClick` guard for RSC prerendering (`ui/button.tsx:69-71`) is a thoughtful touch.

### 6.7 P3 — `React.memo` on one component only

`GridListRow` is memoized (`grid-list-row.tsx:48`), but it receives `columns`/`chips`/`badges` arrays and `onSelect`/`onEdit`/`onDelete` closures built inline by every caller (e.g. `official-entity-list.tsx:226,256-258`), so the memo compares fresh identities and never bails out. The memo costs a shallow compare of 44 props per row per render and saves nothing.

---

## 7. Mobile

### 7.1 P1 — sub-44px interactive targets

| Location | Size | Fix |
|---|---|---|
| `shared/equip-toggle.tsx:31-33` | 24 / 32 / 40px, no floor | see §5.7 |
| `shared/creature-stat-block-section.tsx:25` | `w-7 h-7` = 28px collapse button | use `SectionHeader collapsible` (C10) |
| `shared/add-sub-skill-modal.tsx:278,294` | `py-1.5` selects ≈ 34px | `FilterNativeSelect` (`h-11`) — C7 |
| `ui/icon-button.tsx:27-28` | `sm` = 28px, `md` = 32px | mitigated by `[@media(pointer:coarse)]:min-h-[44px]` at L15 — OK |
| `ui/button.tsx:42,47` | `sm` = 32px, `icon-sm` = 32px | mitigated by `[@media(pointer:coarse)]` at L29 — OK |

The `[@media(pointer:coarse)]` floor in `Button`/`IconButton` is the right pattern (44px on touch, compact on desktop, per `MOBILE_UX.md`). The three violations above simply don't use it.

### 7.2 P2 — `fullScreenOnMobile` adoption is inconsistent

`Modal` supports `fullScreenOnMobile` (`ui/modal.tsx:46`) and the mobile rule requires it for "selection, add-X, load, recovery, level-up, settings, wizards". Coverage in `shared/`:

| Uses it | Doesn't |
|---|---|
| `unified-selection-modal.tsx:299` ✓ | `unified-selection-modal-leave-prompt.tsx:33-40` ✗ |
| `confirm-action-modal.tsx:68` ✓ | |
| `delete-confirm-modal.tsx:44` ✓ | |
| `login-prompt-modal.tsx:62` ✓ | |
| `expandable-image.tsx:40` ✓ | |

The leave prompt is the one that appears *on top of* a full-screen mobile modal, so it renders as a small inset card over a full-screen sheet — the least consistent placement. (C1 fixes this by construction.)

### 7.3 Mobile handling that is genuinely good

- `buildMobileCollapsedGridColumns` (`grid-list-row-chrome.ts:218-241`) collapses desktop `fr` tracks that are `display:none` below `lg`, and the `DESIGN_INTENT` comment at `grid-list-row-collapsed.tsx:169-171` explains exactly why the template must go through a CSS variable rather than inline `style` (inline beats the media query). This is the kind of documented constraint that survives a team change.
- `ListHeader` swaps the desktop column header row for a mobile "Sort by" control rather than side-scrolling headers.
- `Modal` full-screen mode adds `pb-[env(safe-area-inset-bottom,0px)]` on the footer (`ui/modal.tsx:289`).
- `TableScroll` exists for the side-scroll case, and `ui/table-scroll.tsx` is 16 LOC — appropriately thin.

### 7.4 P3 — 360px risk spots

`ui/toast.tsx:88` sets `min-w-[300px]` on toasts plus `fixed right-5` (L137) → 300 + 20 + 20 = 340px, fits 360 with 20px to spare, but the dismiss `IconButton` and a long message will wrap tightly. `unified-selection-modal-footer.tsx:40` uses `flex-col-reverse` below `sm` with `[&_button]:flex-1` — correct. `add-combatant-modal.tsx:425` has a `w-5 h-5` custom checkbox (20px) — sub-target, though it sits inside a larger row hit area.

---

## 8. Dead code & barrel hygiene

### 8.1 Dead export table

338 exported symbols scanned across `ui/` + `shared/` (excluding tests and `index.ts`). **37 have zero references anywhere in `src/`**; 40 more are referenced only by a barrel or a test.

**Genuinely dead runtime (value) exports — delete:**

| Symbol | Location | Note |
|---|---|---|
| `tokenizeGridTemplateColumns` | `shared/grid-list-row-chrome.ts:141` | zero external refs; only used internally by `expandGridTemplateTokens` — make it module-private |
| `expandGridTemplateTokens` | `shared/grid-list-row-chrome.ts:172` | **test-only** (`grid-list-row-chrome.test.ts`); make private and test through `countGridTemplateTracks` |
| `AddSkillModalSkillBadge` (+ interface) | `shared/add-skill-modal.tsx:21` | zero refs |
| `sourceFilterLabel` | `shared/filters/source-filter.tsx:29` | not in `filters/index.ts`, no consumer |
| `StatBlockSection` | `shared/creature-stat-block-section.tsx:14` | not in any barrel; superseded by `SectionHeader collapsible` |
| `GuidedChoiceGroup` (type, but shapes the API) | `shared/guided-choice/guided-choice-shell.tsx:24` | barrel-only |

**Dead type exports (37 total; the 12 in `ui/` are the clearest):** `AlertProps`, `CardProps`, `CheckboxProps`, `ChipGroupProps`, `IconButtonProps`, `InputProps`, `SelectProps`, `SelectionCardProps`, `SelectionCardSurfaceProps`, `TabContentPanelProps`, `TabPanelProps`, `TextareaProps` — none is imported anywhere, and none is re-exported from `ui/index.ts`. In `shared/`: `AbilityScoreGridProps`, `ChoiceTraitOptionListPickerProps`, `CreatureLibraryStatBlockRowProps`, `CreatureLibraryStatBlockRowsProps`, `DescriptorChipWithTipProps`, `ExpandableImageModalProps`, `GridListRowExternalChromeProps`, `LoadoutBudgetBarProps`, `MobileCollapsedGridColumnsOptions`, `OfficialEntityListProps`, `OfficialEntityRow`, `PointStatusProps`, `RollButtonProps`, `SectionDualModeTogglesProps`, `SegmentedControlProps`, `SegmentedOption`, `StepperButtonProps`, `TempModifierToggleProps`, `ValueStepperProps`, `UnifiedSelectionModal{Footer,LeavePrompt,List,Toolbar}Props`.

Exporting a props interface for every component is a defensible convention — but then `shared/index.ts` should re-export them consistently, which it doesn't (it exports ~30 of them and skips the rest arbitrarily). Pick one rule.

### 8.2 Dead cva variants / sizes

| Component | Dead member | Location |
|---|---|---|
| `Button` | `size="icon-sm"` | `ui/button.tsx:47` |
| `Button` | `size="icon-lg"` | `ui/button.tsx:48` |
| `Modal` | `size="3xl"` | `ui/modal.tsx:58` (documented as "Dense multi-field editors (~1024px)") |
| `IconButton` | `variant="muted"` | `ui/icon-button.tsx:24` |
| `Card` | `variant="interactive"` | `ui/card.tsx:16` |
| `Spinner` | `variant="muted"` | `ui/spinner.tsx:30` |
| `PageContainer` | `size="content"` | `ui/page-container.tsx:18` |
| `Chip` | `variant="accent"` | `ui/chip.tsx:75` (`@deprecated`) |
| `Chip` | `variant="weakness"` | `ui/chip.tsx:93` (`@deprecated`) |

`Chip` carries **36 variants**, 11 of them marked `@deprecated` since an unnamed earlier phase. Two are provably dead; the rest (`secondary`, `outline`, `info`, `weapon`, `armor`, `shield`, `feat`, `proficiency`, `power`, `technique`) are only reachable through the `lib/chip/*` mapper functions, which makes usage un-greppable by design. **Fix:** make the mappers return a narrowed union type so the compiler proves which variants are reachable, then delete the rest.

### 8.3 P2 — 13 dead CSS component classes in `globals.css`

Verified: referenced only by `globals.css` itself and by docs.

| Class | Lines | Duplicates |
|---|---|---|
| `.input-field` | 653-658 | `ui/input.tsx` |
| `.skeleton-text` | 909-919 | — |
| `.skeleton-title` | 921-931 | — |
| `.skeleton-card` | 933-943 | — |
| `.divider-light` | 978-980 | — |
| `.list-header` | 988-991 | `shared/list-header.tsx` (which builds its own classes) |
| `.list-container` | 994-996 | — |
| `.list-item` | 999-1004 | `cardVariants` |
| `.list-item-selectable` | 1007-1009 | `cardVariants.selectable` |
| `.list-item-selected` | 1012-1014 | `cardVariants.selected` |
| `.list-item-expanded` | 1017-1019 | `GRID_LIST_ROW_EXPANDED_BAND_CLASS` |
| `.modal-filters` | 1022-1024 | `FilterSection` |
| `.hover-lift` | 790-798 | `cardVariants.interactive` |
| `.focus-ring` | 801-803 | inline `focus-visible:` chains |

**≈ 90 lines of dead CSS.** Live but low-use: `.skeleton` (1 file), `.range-slider` (1), `.filter-group` (7), `.layout-shell-wide` (5), `.hit-area-layout-neutral` (1), `.touch-target-md-compact` (16), `.font-display` (9).

### 8.4 P3 — `DESIGN_SYSTEM.md` documents dead API

- `DESIGN_SYSTEM.md:446` documents `.input-field` as "Standard input styling" — dead (§8.3).
- `DESIGN_SYSTEM.md:464` documents `.skeleton`, `.skeleton-text`, `.skeleton-title`, `.skeleton-card` — 3 of 4 dead.
- `ui/button.tsx:14-17` documents "DEPRECATED VARIANTS (avoid, will be removed): gradient, success, utility" — none of the three exists in the cva any more (removed). The doc comment describes a shape the code hasn't had for some time.

### 8.5 Barrel hygiene

`shared/index.ts` is **254 lines re-exporting essentially everything** (~130 symbols from ~55 modules). Consequences:

**(a) P2 — six intra-directory barrel cycles.** Files inside `shared/` import from `@/components/shared`, i.e. from the barrel that imports them:

| File | Line |
|---|---|
| `shared/add-combatant-modal.tsx` | 25 |
| `shared/loadout-budget-bar.tsx` | 4 |
| `shared/official-entity-list.tsx` | 13-20 |
| `shared/realms-image-picker.tsx` | 13 |
| `shared/skills-allocation-page.tsx` | 43 |
| `shared/skill-row.tsx` | 30 |

Each of these creates a `index.ts → module → index.ts` cycle. Bundlers tolerate it, but it (i) forces the whole 55-module graph into any chunk that touches one of these six files, (ii) makes module-init order dependent on import order, and (iii) is a live TDZ hazard if any of them ever needs a module-level const from a sibling. **Fix:** deep-import siblings (`./point-status`, not `@/components/shared`). Trivially mechanical; an ESLint `no-restricted-imports` rule scoped to `src/components/shared/**` would prevent regression.

**(b) P2 — the barrel is a tree-shaking hazard.** `entity-library-sections.tsx` (itself `'use client'`) is re-exported at `shared/index.ts:189-198`, so importing `SectionHeader` from `@/components/shared` pulls the character-sheet inventory/feats/powers modules (1,112 LOC) into the graph. Combined with 29 files importing the `@/components/ui` barrel, a page that wants one chip transitively references the whole layer. Next/Turbopack's tree shaking handles the *unused-export* case for pure ESM, but `'use client'` boundaries and the six cycles above defeat it in exactly the cases where it matters.

**(c) P3 — the barrel is also documentation, and it has drifted.** `shared/index.ts:34` still says "Note: tabs.tsx … was removed"; `:41` "Note: alert-enhanced.tsx was removed". Tombstones for files deleted long ago. `shared/index.ts:161` exports `EmptyState as ListEmptyState` — an alias that exists only to avoid a name clash the barrel itself creates.

**(d) `ui/index.ts` is fine** — 48 lines, 22 modules, no cycles, no aliases.

### 8.6 The allowlist gate works

`scripts/shared-ui-allowlist.json` lists exactly the 120 non-test `.ts`/`.tsx` files present in `ui/` + `shared/` — zero drift in either direction. Whatever `npm run tasks:validate-shared-ui` does, it is being run. This is the healthiest governance signal in the audit.

---

## 9. Prioritised findings index

### P0 (1)

| # | Finding | Location |
|---|---|---|
| 1 | Delete button is `opacity-0` with hover-only reveal → invisible when keyboard-focused (WCAG 2.4.7) and permanently invisible on touch | `shared/hub-list-row.tsx:128` |

### P1 (9)

| # | Finding | Location |
|---|---|---|
| 2 | Expandable rows expose no `aria-expanded`/`aria-controls` — affects every Codex/Library/modal/creator list | `shared/grid-list-row-collapsed.tsx:153-161` |
| 3 | Hardcoded `id="modal-title"` → nested modals announce the wrong dialog name | `ui/modal.tsx:217-227` |
| 4 | Body scroll lock released while parent modal still open (no ref counting) | `ui/modal.tsx:106-115` |
| 5 | Escape listener registered by every mounted `Modal` → one keypress closes stacked dialogs | `ui/modal.tsx:117-125` |
| 6 | Hardcoded radio `name="tagMode"` → two TagFilters share one group | `shared/filters/tag-filter.tsx:74,85` |
| 7 | `EquipToggle` 24-40px targets, no 44px floor (its two siblings have one) | `shared/equip-toggle.tsx:31-35` |
| 8 | 199 no-op `dark:text-text-secondary` overrides (identical dark token values) | `globals.css:407-408` + 199 sites |
| 9 | `dark:` classes discard already-themed tokens → guided nav loses colour identity in dark mode | `shared/guided-choice/guided-nav-button-styles.ts:12-23` |
| 10 | `SearchInput` external `ref` silently disables clear-then-focus | `ui/search-input.tsx:72,83` |

### P2 (selected)

`shared/rolls` layering inversion (5 files) · 44-prop `GridListRowProps` · dead `equipped` prop · `getColumns!` non-null assertion · `onConfirm` mutates caller objects · mobile listbox keyboard model · disabled reason in `title` on `role="presentation"` · heading hierarchy (10 sites) · nested interactive in `<summary>` · focus-trap `offsetParent` filter · three competing live regions · `'use client'` on 82/83 shared files · defeated `useMemo` in 3 Official* wrappers · 6 barrel cycles · 13 dead CSS classes · 9 dead variants · rgba escapes the lint rule · `ui/**` exempt from `no-raw-color` · 4 unadopted token ladders.

### P3 (selected)

`formatCostDisplay` in a primitive · index-as-key (4) · `openDetailSections` effect · two `cn(...)` conventions · `EmptyState` dual aliases · `Tooltip` demo-only in the public barrel · barrel tombstone comments · `DESIGN_SYSTEM.md` documents dead classes · stale `Button` deprecation comment · `React.memo` that never bails.

---

## 10. Suggested sequencing

**Week 1 — correctness (P0/P1), ~1 day of work each**
1. `hub-list-row.tsx:128` focus/touch visibility.
2. `ui/modal.tsx`: `useId()` for title/description ids; ref-counted scroll lock; open-only + stack-aware Escape. One PR, fixes findings 3-5 and de-risks every nested-modal flow.
3. `tag-filter.tsx` `useId()`-scoped radio name + `<fieldset>`.
4. `equip-toggle.tsx` touch floor.
5. `grid-list-row.tsx` + `grid-list-row-collapsed.tsx`: thread `isExpanded` + panel id, set `aria-expanded`/`aria-controls`.

**Week 2 — token decision (blocks everything else)**
6. Decide §3.1: distinct dark `--color-text-muted`, **or** codemod out all 199 pairings and amend `.cursor/rules/realms-accessibility.mdc`. Do not defer — every new file compounds it.
7. Extend `no-raw-color` to `rgba()`/`hsl()` in arbitrary values; add glow tokens; fix the 6 sites.
8. Delete the 6 `dark:` overrides in `guided-nav-button-styles.ts` and the ramp+`dark:` pairs in §3.2.

**Week 3-4 — mechanical duplication (no behaviour change, high LOC yield)**
9. C4 `ValueStepper` (~135) and C5 `ListHeader` (~114) — pure extract-function refactors inside single files, lowest risk, 249 LOC.
10. C1 `ConfirmDialog` (~209) — also fixes §5.10 heading inconsistency and §7.2 leave-prompt mobile.
11. C7/C8 (~55) — also fixes two sub-44px targets.
12. C14 delete `list-components.tsx` shim (~47) + the `ListEmptyState` alias.

**Later — structural**
13. Break the 6 barrel cycles; add `no-restricted-imports` for `@/components/shared` inside `src/components/shared/**`.
14. C2/C3/C10 toggle + disclosure families (~248).
15. Move the 4,724 LOC of feature code out of `shared/` per §11.
16. Delete the 90 lines of dead CSS + 37 dead exports + 9 dead variants; update `DESIGN_SYSTEM.md`.

---

## 11. Target architecture

The current two-tier split (`ui/` = 22, `shared/` = 101) is failing because `shared/` is doing three unrelated jobs. Split it into three tiers with an enforceable rule per tier.

```
src/components/
  ui/                    ← TIER 1: primitives (~28 files)
      Rule: no imports outside `@/lib/utils/cn` + React + lucide + cva/clsx/twMerge.
            Zero domain vocabulary. Every component: `...rest` + `ref`, cva variants, forwardRef-free (React 19).
      Keep:  button, icon-button, input, textarea, select, checkbox, search-input,
             card, selection-card, page-container, page-header, table-scroll,
             chip, expandable-chip, modal, toast, alert, spinner, empty-state,
             tab-navigation, tooltip(→styleguide)
      Add:   confirm-dialog (C1), icon-state-toggle (C2), disclosure-button (C10),
             error-display (from C14), segmented-control (moved from shared/)
      Move out: expandable-chip's `formatCostDisplay` dependency → prop

  patterns/              ← TIER 2: cross-feature composites (~30 files)
      Rule: may import `ui/` + `lib/` + `hooks/`. MUST NOT import `stores/`,
            `services/`, or any `components/<feature>/`. No entity-specific columns/copy.
      list/      grid-list-row* (6), list-header, list-search-toolbar,
                 official-entity-list, codex-browse-list-shell, detail-option-list,
                 list-row-thumbnail, grid-list-chip, summary-chip-list, hub-list-row
      select/    unified-selection-modal* (6), selection-toggle, quantity-selector,
                 value-stepper
      filters/   the 9 existing filter files
      help/      info-tippy, descriptor-chip-with-tip, expandable-image
      chrome/    section-header, section-cost-badge, tab-summary-section, point-status,
                 edit-section-toggle+temp-modifier-toggle+section-dual-mode-toggles,
                 error-boundary, theme-toggle

  <feature>/             ← TIER 3: feature-owned (moves ~4,724 LOC out of shared/)
      character-sheet/   entity-library-* (7), ability-score-grid, equip-toggle,
                         innate-toggle, quick-armaments-sections, skill-row
      creature/          creature-stat-block* (6), creature-library-stat-block-rows
      creators/          skills-allocation-page, add-skill-modal, add-sub-skill-modal,
                         loadout-budget-bar, powered-martial-slider,
                         guided-choice/* (5), choice-trait-option-select
      encounters/        add-combatant-modal
      admin/             realms-image-picker, image-upload-modal
      library/           library-add-to-library-button, library-row-action-slot,
                         official-{power,technique,item,enhanced,creature}-list
      rolls/             roll-button + the existing rolls provider (fixes §1.2)
```

**Enforcement (all three are cheap and this repo already does the hardest one):**
1. Keep `scripts/shared-ui-allowlist.json` — it works. Split it per tier so a new `patterns/` file needs an ADR but a new `<feature>/` file doesn't.
2. Add ESLint `no-restricted-imports`: `ui/**` may not import `@/components/*` (except `./`); `patterns/**` may not import `@/stores/*`, `@/services/*`, or `@/components/<feature>/*`; `src/components/shared/**` (during migration) and `patterns/**` may not import their own barrel.
3. Cap barrels: `ui/index.ts` and one barrel per `patterns/` subdirectory (`patterns/list`, `patterns/select`, …). Delete the monolithic 254-line `shared/index.ts`; feature code imports `@/components/patterns/list`, not `@/components/shared`.

**Barrel policy:** re-export only components a *different* tier consumes. Never re-export a `'use client'` facade (kills the server boundary). Never re-export types that nothing imports (37 of the current ones).

---

## Appendix — measurements

| Metric | Value |
|---|---|
| `ui/` files / LOC | 22 / 2,502 |
| `shared/` files / LOC | 98 source (+3 tests) / 15,648 |
| Exported symbols scanned | 338 |
| Dead exports (0 refs) | 37 |
| Barrel/test-only exports | 40 |
| Dead cva variants + sizes | 9 |
| Dead CSS component classes / lines | 13 / ~90 |
| `dark:` occurrences in `shared/` + `ui/` | 137 |
| — of which the no-op muted pairing | 73 (53%) |
| `text-text-muted dark:text-text-secondary` in `src/components/` | 199 |
| Same pairing repo-wide (`src/`) | 335 in 151 files |
| Raw palette utilities in `shared/` | **0** (lint holding) |
| `rgba()`/`hsl()` in arbitrary values (lint gap) | 6 |
| Undefined tokens referenced | 1 (`primary-border`, 2 sites) |
| `'use client'` in `shared/` `.tsx` | 82 / 83 |
| `forwardRef` in `ui/` | 8 / 21 |
| Intra-barrel import cycles | 6 |
| `shared/` → feature-dir imports | 5 |
| Largest prop interface | 44 (`GridListRowProps`) |
| Duplication clusters / LOC removable | 13 / ~1,131 |
| Allowlist drift | 0 / 120 |
