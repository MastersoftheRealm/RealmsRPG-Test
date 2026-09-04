> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Floating UI & Contextual Help (TASK-376 ✅ / TASK-392 ✅)

**Authority for agents:** This appendix is the decision guide for `@floating-ui/react`, `InfoTippy`, and related patterns. Product vision context: `REALMS_PRODUCT_OVERVIEW.md` § 2.6.

**Owner decision (2026-06-25):** Static copy in `public/tooltip-text.tsx` is the **only** contextual-help standard. Legacy DB tooltips were removed in TASK-376 (Jun 2026). **Engine:** `@floating-ui/react` via `InfoTippy` (TASK-392, Jun 2026).

## If you authored PR #14 (Collin-tooltipExperimentation)

Your Floating UI work **is in the repo** — it was extracted into shared primitives during the KadinBranch + `master` merge (`0e62d157`). Read **`src/lib/tooltips/README.md`** first.

| You remember… | Look here now |
|---------------|---------------|
| `tooltip.tsx` with inline `useFloating` | `floating-help.tsx` (panel/placement) + `tooltip.tsx` (thin wrapper) |
| `ContextHelpTooltip` + `tooltipKey` | `InfoTippy` + `tooltip-text.tsx` (legacy DB keys documented in `lib/tooltips/README.md`) |
| `HelpTooltip` | `InfoTippy` |
| Skills help inside `skills-allocation-page.tsx` | Parent passes `headingAddon` / `addSubSkillAddon` (`skills-step.tsx`, creature creator) |
| DB `/api/tooltips`, admin tooltips page | **Removed** — edit `tooltip-text.tsx` and deploy |

## Two layers — do not conflate them

| Layer | What it is | When agents touch it |
|-------|------------|----------------------|
| **`@floating-ui/react`** | Positioning + interaction **engine** (flip/shift, portal, hover/focus/dismiss, ARIA). Successor to Popper/Tippy. | Import **only inside shared primitives** (`InfoTippy` today). Do **not** sprinkle `useFloating` across feature pages unless adding a **new shared** anchored component (see below). |
| **`InfoTippy`** | **Product component** for contextual **help**: Info trigger (or custom child), copy from `tooltip-text.tsx`, mobile touch-hold, interactive JSX lists. | Any time you add optional "what is this?" / rules help on a page or step. |

`InfoTippy` is **not** a generic tooltip primitive. It is opinionated help chrome. Do not use it for nav menus, filters, or dynamic stat breakdowns.

## Copy scoping — global term tips vs guided / L1 tips

By default, product help copy lives in **`public/tooltip-text.tsx`**. Scope the **export name and length**, not a second tip system; the State feat domain-copy exception is documented below.

| Scope | Purpose | Naming | Examples |
|-------|---------|--------|----------|
| **Global term tip** | Same definition everywhere the term appears (sheet, Path overview, Codex, etc.) | Plain term + `Help` — no `guided` prefix | `armamentProficiencyHelp`, `getAbilityHelp` / `getDefenseHelp`, `defenseScoreHelp`, `trainingPointsHelp`, `innateEnergyHelp` / `innatePowersHelp` (TASK-726) |
| **Guided / L1-simplified tip** | Shorter teaching copy for creator steps or More details (may omit formulas the sheet assumes) | `guided*` prefix | `guidedArchetypePathHelp`, `guidedArchetypeAbilityHelp`, `guidedPowerPathTypeHelp` / `guidedMartialPathTypeHelp` / `guidedPoweredMartialPathTypeHelp`, `getGuidedAutoAllocateHelp` (TASK-729) |

**Rules for agents**

1. **Reuse global tips** when the label is the same game term sitewide. Do **not** invent a second Armament / Ability / Defense string for Path vs sheet.
2. **Use guided / L1 tips** when creator teaching needs a shorter or step-specific explanation that would feel wrong on the play sheet (e.g. Primary vs Secondary Ability in Path More details).
3. If a guided tip later becomes the sitewide definition, **rename/move** to the global name and update all call sites — do not leave duplicates.
4. Marketing / landing copy stays in `src/lib/constants/copy/*` (not `tooltip-text.tsx`).

**Armament Proficiency (TASK-578 / TASK-581):** `armamentProficiencyHelp` is the single global export. Path More details (Weapons and Armor) and sheet Inventory both consume it.

**State feat teaching (TASK-759):** `STATE_FEAT_RESTRICTION_NOTICE` in
`lib/codex/feat-restriction-notice.ts` is an intentional domain-copy exception because
`getFeatRestrictionNotice` and the creator/Codex/Admin State Feats filter tips must use
the exact same operational sentence. Do not duplicate it in `tooltip-text.tsx`.

## Decision matrix — what to use when

| User need | Use | Do **not** use |
|-----------|-----|----------------|
| Optional rules / step help beside a heading | **`InfoTippy`** + export in `tooltip-text.tsx` | Raw Floating UI on the page, `Tooltip` from `@/components/ui`, `title=` only |
| Help on a non-Info control (e.g. ability pick button) | **`InfoTippy`** with `children` + `label` / child `aria-label` | Separate tooltip library |
| Definition tip on a label word (ability/defense/skill name or Score value; no icon) | **`WordHelpTip`** + `getAbilityHelp` / `getDefenseHelp` / `defenseScoreHelp` in `tooltip-text.tsx` (name tips say the name once — e.g. “Acuity reflects…”, not “Acuity. Acuity…”). Skill names pass Codex `description` and `compact` (TASK-803). | Info icon sibling, `title=` only |
| Level-aware help copy (points at level N) | Helper in **`tooltip-text.tsx`** (e.g. `getAbilityPointsHelp`) → **`InfoTippy`** | Inline paragraph duplicating rules |
| Rich help (bullets, bold, JSX) | JSX export in **`tooltip-text.tsx`** → **`InfoTippy`** `content` | DB tooltips, markdown in random components |
| Full-screen or multi-step flow | **`Modal`** (`fullScreenOnMobile` on mobile) | InfoTippy |
| Pick one option from a list (filters, sort) | **`Select`**, **`SelectFilter`**, **`ChipSelect`**, native `<select>` | InfoTippy |
| Nav dropdown (Library links, account menu) | Existing header / menu pattern; **future:** shared **`AnchoredMenu`** on Floating UI | InfoTippy |
| Click-to-open panel (actions, compact picker) | **Future:** shared **`AnchoredPopover`** on Floating UI; until then, extend nearest existing pattern | InfoTippy, one-off `absolute top-full` without a plan to unify |
| Post-activation sheet tour / highlight chain (TASK-388) | `SheetTour` + `sheet-tour-highlight.ts` (`ONBOARDING_FLOATING_CARD_CLASS`, `z-tour` above roll-log FAB) | InfoTippy chain for walkthroughs |
| Primary step guidance (Path mode) | **`PathHelpCard`**, step description prose | InfoTippy alone as the only guidance |
| Styleguide / demo only | **`Tooltip`** from `@/components/ui` | InfoTippy |

**Rule of thumb:** If the user can **ignore it and still complete the task**, and copy is **static and reviewable**, use **`InfoTippy`**. If the UI **must be used to proceed** or is **navigation**, use the appropriate modal/menu/select pattern.

## When to use `InfoTippy` (all should be true)

1. Copy lives in (or is returned from) **`public/tooltip-text.tsx`**
2. Help is **supplementary** — not the only explanation of a required action
3. Panel is **small** (~320px max; strings or short JSX)
4. Trigger is the **Info icon** (default) or a **single DOM element** via `children`

## When to use `@floating-ui/react` directly

Use the dependency **inside `@/components/patterns` or `@/components/ui`**, not ad hoc on feature pages, when:

- Adding a **new reusable** anchored pattern (popover, menu, combobox, context menu)
- Refactoring an existing **manual `absolute` + portal** floater that appears in **multiple** places (e.g. header dropdowns)

**Before creating a new Floating UI wrapper:** grep for existing components; extend with a prop/variant first. Name future primitives clearly (`AnchoredPopover`, `AnchoredMenu`) — not `InfoTippy`.

**Not yet in the repo:** `AnchoredPopover` / `AnchoredMenu`. Until they exist, do not block feature work — but avoid copying positioning logic; note a follow-up to consolidate.

## Surfaces — wired today vs planned

| Surface | Status | Notes |
|---------|--------|-------|
| Character creator (all steps) | ✅ Wired | step headings; archetype ability buttons use `children` |
| `characters/new` page header | ✅ Wired | |
| Navbar Library / Codex | ✅ Wired | `placement="bottom"` |
| Campaigns hub | ✅ Wired | |
| Character sheet | ◐ Partial | Ability + defense name tips via `WordHelpTip` (TASK-547); skill names via `WordHelpTip` `compact` + Codex description (TASK-803); defense Score values via `defenseScoreHelp` (TASK-587); Inventory Armament Proficiency via `armamentProficiencyHelp` (TASK-581); broader first-exposure tour still planned per `REALMS_PRODUCT_OVERVIEW.md` § 11 |
| Standalone creators (power, technique, item, …) | ◐ Partial | **Power creator advanced** InfoTippy wired (TASK-408). Technique/item/species/creature still planned. Guided power L1 deferred (TASK-410–414). |
| Encounters, crafting, Codex/Library browse | ⬜ Planned | Scoped section help only where dense |

## How to add contextual help (agent checklist)

1. **Search** — grep `tooltip-text.tsx` and existing `InfoTippy` on the same surface; reuse or extend copy.
2. **Copy** — add a string, JSX export, or helper to `public/tooltip-text.tsx` (one file; no DB).
3. **Wire** — import `InfoTippy` / `WordHelpTip` from `@/components/patterns`:
   - Page/step title: `<InfoTippy content={…} label="…" />` (layout-neutral hit; do not add `min-h-*` className)
   - Default icon trigger: omit `children`; **`label` is required** (becomes `aria-label`).
   - Custom trigger: pass `children` (single element); child needs its own `aria-label`; keep `label` for consistency.
   - Label-word tip (no icon): `<WordHelpTip content={getAbilityHelp(…)} label="About Strength">Strength</WordHelpTip>` (ability/defense names; tip copy names the term once). Dense table labels: `compact` (Dense tier — 44px expanded hit under coarse pointer).
4. **Mobile** — default touch-hold (~400ms) is built in; do not add parallel click handlers.
5. **A11y** — every trigger has a discernable name; do not rely on `title` alone.
6. **Verify** — hover, keyboard focus, touch-hold on ~360px width; JSX lists allow pointer into panel.

## Label / heading layout (TASK-725)

`InfoTippy` next to a filter label or section title **must not** increase that row’s height or wrap the title. The 16px Info icon stays in the line box; `.hit-area-layout-neutral` expands the tap target with an overlay (`::after`), not `min-h-8` / 44px in-flow padding.

- Filter labels use `FILTER_LABEL_ROW_CLASS` (`h-5`). Put `labelAccessory` (InfoTippy) in that row — do not add per-page `!min-h-*` on the trigger.
- `GuidedSectionTitle` `titleAddon` is `shrink-0` so the (i) stays on the title line.
- Do **not** switch sitewide help to `WordHelpTip` — that is for word-tied definitions (ability/defense/skill names).
- New call sites: omit extra `className` sizing on `InfoTippy`; the shared trigger already preserves 44px touch without stretching flex/grid tracks.

## `InfoTippy` / `WordHelpTip` API (quick reference)

| Prop | Purpose |
|------|---------|
| `content` | `string` or JSX from `tooltip-text.tsx` |
| `label` | Accessible name (required) |
| `tone` | `InfoTippy` only (TASK-707): `'info'` (default, `text-primary-link-fg`) · `'tp'` (`text-tp-text` on Training Points PointStatus) · `'current'` (inherit chip/status text). Prefer `tone` over `className` color fights. |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` |
| `children` | `InfoTippy`: optional custom trigger element. `WordHelpTip`: visible label text/spans |

Implementation: `src/components/patterns/help/info-tippy.tsx` (`InfoTippy` + `WordHelpTip`) + shared Floating UI chrome in `src/lib/tooltips/floating-help.tsx` (arrow, transitions, placement — ported from Collin PR #14). Styleguide `Tooltip` in `@/components/ui` reuses the same primitive. Types: `InfoTippyProps` / `InfoTippyTone` / `WordHelpTipProps` exported from `@/components/patterns`.

## Do not use (removed / wrong tool)

| Legacy or wrong | Replacement |
|-----------------|-------------|
| `useTooltipByKey`, `useTooltips`, `ContextHelpTooltip`, `HelpTooltip` | `InfoTippy` + `tooltip-text.tsx` |
| Admin `/admin/tooltips`, `/api/tooltips`, user show-tooltips toggle | Edit `tooltip-text.tsx`; deploy |
| `ui_tooltips` table / `show_tooltips` column | Dropped 2026-06-30 (DEV-376) — `sql/drop-legacy-ui-tooltips-2026-06.sql` |
| `@tippyjs/react`, `tippy.js` | Removed (TASK-392) |
| `Tooltip` from `@/components/ui` for product help | `InfoTippy` only |

## Related patterns (not InfoTippy)

- **`PathHelpCard` / `GuidedLayerNav`** — path-mode prose and **Layer 1 ↔ 2/3** chrome. **`GuidedLayerNav`**: below step content (not footer); one action → bottom left; two+ actions → shallower left, deeper right; expand/trailing hatch = outline + hatch fill `lg`; collapse = outline `lg` (matches footer Back weight). Use on guided creator steps and any creator step with progressive disclosure.
- **Selection grammar (cards ↔ GridListRow)** — Canonical rules in [`REALMS_PRODUCT_OVERVIEW.md`](../../REALMS_PRODUCT_OVERVIEW.md) **§3.1**:
  - **Ladder A (entity depth):** Glance → **See more** (in-card) → **More details** (modal or lots of chip/fact disclosure). Same facts whether chrome is a card or a GridListRow.
  - **Ladder B (catalog breadth):** Curated cards → **See more options** (filtered GridListRow browse) → **See all** / Forge.
  - **When:** few curated picks → `GuidedChoiceCard`; many / searchable → `GridListRow`. Do not densify cards into column grids.
  - **Layer 1 choice principle:** identity and fighting-style steps still require deliberate picks (no weapon/armor quick kits). Soft defaults OK for ability arrays and optional gear Add-all.
- **Choice-card disclosure vs catalog Layer 2** — Do **not** conflate (subset of §3.1). Copy: `GUIDED_CREATOR_COPY.choiceCard`.
  | Affordance | Component | Opens |
  |------------|-----------|--------|
  | **See more…** / **See less** | `GuidedChoiceCard` inline expand | Truncated description, notices, content that stays *on the card* |
  | **More details** / **Less details** | `onDetails` → `GuidedEntityDetailModal` | Entity modal — opening More details alone does **not** select; path/species detail footers offer **Close** (left) + **Select** (right) to apply without returning to the card |
  | **See more options** / browse | `GuidedLayerNav` / `UnifiedSelectionModal` | Catalog Layer 2–3 (more *choices*) |
  Do **not** invent specialist verbs ("Property details", "Read more", "Hide properties"). REALMS §3.1 / §5.0.1 / §5.7.
  **Chapter rail vs Back/Continue:** `setSubStep` (chapter chrome / edit jump) sets `navigationIntent: 'first'` so multi-screen steps land on their first inner screen (Foundation → path; Ancestry → species overview; Archetype → skills; Loadout → first equipment phase). Footer **Continue** (`nextSubStep`, intent `forward`) also lands on the first inner screen — never jumps to furthest progress. Footer **Back** (`prevSubStep`, intent `back`) resumes the last inner screen (sequential history).
  **Option rows inside deep-dive (and remodeled legacy lists):** use `DetailOptionList` + builders in `@/lib/detail-option` (`traitToDetailOption`, `featToDetailOption`, `equipmentRefToDetailOption`, `powerToDetailOption` / `techniqueToDetailOption` / `resolveCombatDetailOption`, **`namedPropertyDescriptorChips` / compact-facts formatters**). Prefer flat equipment recommendation builders over kit helpers after TASK-442. Do not fork parallel GridListRow markup for the same catalogs.
  **GridListRow fact policy (sitewide) — column vs chip (TASK-454 / TASK-461):** If a fact would normally be a list column (Damage, Range, Damage Reduction, Action Type, Energy, Uses, Duration, etc.), either keep a real column with a header **or** put a **self-describing** chip using natural language — never "Header: value" and never an unlabeled leftover.
  - **Keep columns** in dense comparison / browse views (Library, Codex, add modals, sheet library, L2 equipment grids): `ListHeader` columns when space allows; chips supplement (properties/parts), they do not replace column facts. Do **not** flatten full comparison tables into chips. Dense L3 table headers may keep short **TP**; chip `costLabel` / L1–L2 chrome use full **Training Points** (`TRAINING_POINTS_COST_LABEL`).
  - **Compact into chips** when columns are omitted (deep-dive catalogs, choice cards, progressive disclosure). Use `@/lib/detail-option/compact-facts` — do not recreate these strings in feature components:
    | Fact | Chip language |
    |------|----------------|
    | Ability Requirement | `Strength Requirement 3+` (never "Ability Requirement Strength…", never "Weapon/Armor …") |
    | Handedness | `Two-handed` (never "Handedness: Two-handed") |
    | Damage | `2d6 Slashing Damage` (capitalize Damage; do not also chip Weapon Damage) |
    | Weapon Ability | `Strength Weapon` / `Agility Weapon` (Finesse) / `Acuity Weapon` (ranged non-Finesse) |
    | Range / Spaces | `Range 16 Spaces` / `3 Spaces` (capitalize Spaces) |
    | Action Type (desc chip) | Value only: `Quick Action` / `Basic Reaction` (`actionTypeFactChip` / `formatActionTypeValue`) — column header or ListHeader keeps the **Action Type** label; use `formatActionTypeFact` only for labeled metadata when no Action Type column exists |
    | Energy | `Energy 4` (`energyFactChip`) |
    | Currency / Training Points | `Currency 12` / `Training Points 4` (full words in L1/L2) |
  - **Do not repeat if already represented:** When a dedicated compact-fact / column covers a mechanic (Damage, Damage Reduction, Range, Ability Requirement), omit the matching named property chip. **Armor Base** / **Shield Base** are calculation-only — never user-facing chips.
  - **L1 named property chips:** property **name only** (Graze, Cleave) — do not append Training Points on those desc chips; budgets stay in title-adjacent Currency / Training Points. Pass `includeCost: true` only for dense browse surfaces that still need TP on the chip.
  - **Non-mechanic properties** (Graze, Cleave, …): non-expanding `kind: 'descriptor'` chips via `namedPropertyDescriptorChips` / `propertyDescriptorChip`. When a description exists, render with **`DescriptorChipWithTip`** — InfoTippy **inside** the chip (not a sibling beside it). Guided cards: `GuidedFactChipRow`. GridListRow: `GridListChip` routes descriptors through `DescriptorChipWithTip`. Same inside-pattern for section help (e.g. Training Points `InfoTippy` via `PointStatus.labelAccessory` in `LoadoutBudgetBar`).
  - **Character sheet parts/properties (TASK-505 / TASK-583):** Always expandable chips with dense `TP: N` (`partDataToChips` + `TP_COST_LABEL`). Do **not** use descriptor + InfoTippy *on the chips* for sheet Parts & Proficiencies — the sheet is a play surface where users expand chips to delve deeper. The **section** (Parts/Properties & Proficiencies) defaults collapsed sitewide with a chevron + label InfoTippy (`labelHelpKey` / `tooltip-text` family tips). Guided L1/L2 keeps spelled-out **Training Points** and descriptor tips for metadata facts.
  - **Loadout budgets (Guided + Advanced):** reuse `LoadoutBudgetBar` from `@/components/patterns` (Currency optional + Training Points + tip inside label) — Guided phase layout / L2 footer / powers; Advanced equipment / powers / finalize (TASK-606 / TASK-614 / TASK-706). Put extra trackers in `leading` (Innate Energy + `innateEnergyHelp` via `labelAccessory` — TASK-726) or `trailing` (finalize Energy) — same inline PointStatus size. Do not fork PointStatus chrome. Innate Powers section titles use `GuidedSectionTitle` `titleAddon={<InnatePowersHelpTip />}` (same module as `InnateEnergyPointStatus`). Advanced powers has no Innate Energy tracker / Innate Powers heading — skip.
  - **Deep-dive / progressive-disclosure catalogs** (`DetailOptionList`, choice-card More details): Name in the collapsed row is fine (`showColumnHeaders={false}` still hides the Name header); description lives in the expanded body; every omitted column fact must appear as a self-describing chip in the expanded row.
  - **Card anatomy / disclosure boundary:** Supporting facts, chips, and controls belong **above** See more / See less / More details. Do **not** append orphan facts or controls below that disclosure row. Guided weapon/armor cards (TASK-457): **Currency** / **Training Points** are `titleMeta` beside the name; mechanic + named-property chips live in `expandedExtra` (See more) via `DescriptorChipWithTip` — never expandable chips in the collapsed body, never chips under the disclosure row.
  - **Audit inventory (TASK-437 / TASK-461 / TASK-505 / TASK-629 / TASK-806 / TASK-807):** Required quick-ref facts: `lib/glr/glr-fact-catalog.ts` + density/resolver (ADR-0016). Bind a surface in `glr-surface-bindings.ts`; CI `glr-fact-catalog.test.ts`. Library / Official / sheet sections column-complete; sheet expandable part/property chips use `TP`; guided L1/L2 keep Training Points cost labels. Codex + Admin Equipment: Category / Currency / Rarity columns only — mixed browse is gear (no Damage / Damage Reduction / Weight fact chips; named property chips stay when present). Add/load powers: Energy/Action/Duration/Area/Damage + Range chip from `buildSelectableItem` detailSections. Creator powers: Official browse columns + TP `rightSlot` (`creatorBudget`); techniques keep Action; empowered remap preserves Duration/Area as chips. Creature creator: power/technique select density. Sheet inventory: rarity/currency/TP as demoted chips (not `Cost Nc` badges). Play power expand: category/range/TP chips. Density `demoteFacts` (not omit) so overflow still chips. Equipment-step weapons: Range chip. Sheet armor: DR/Crit columns + ability/agility descriptor chips in expanded metadata. Do not strip browse columns to chip-ify them.
  - **Id keys:** prefer `normalizeId` from `@/lib/utils` for trim+lowercase map/Set keys (guided equipment catalog helpers).
- **Stable vertical expand (sitewide, TASK-445 / TASK-504 / TASK-539):** Click-to-expand controls must keep the opened control on its collapsed vertical row. Horizontal movement is allowed for a clearer reading layout: the expanded chip moves to the group’s left edge and occupies the full width. Every chip from that same row onward reflows below it. **Hit target:** header/trigger **or** expanded body toggles; Options accordion, buttons, links, and `[data-expand-ignore]` are excluded.
  - **ExpandableChip / ChipGroup:** Host wrap groups with `data-chip-group` (ChipGroup does this). `applyFullRowExpandLayout` centrally promotes the chip or its local action wrapper to a full-width row, preserves all earlier rows, and orders same-row/later siblings below it. Do not implement per-call-site expansion widths or ordering. Shell click toggles when the tap is not on a nested control (description body collapses/expands the chip).
  - **GridListRow / CollapsibleSection:** Expand content below the header/trigger; keep the trigger fixed (`items-start`; fixed one-line meta slot). GridListRow also toggles from the mobile summary and non-interactive expanded-panel areas (chip groups own their own expand).
  - **GridListRow description teaser:** Collapsed rows may show a truncated `columns` entry with `key: 'description'`. When the default expanded body also renders `description`, GridListRow **hides that teaser while expanded** (desktop column, mobile summary, flex stats) so the full text appears once in the panel — Carbon/NN/g progressive disclosure (expanded panel = supplementary detail, not a second copy). Description-only column layouts span the name across the vacated tracks.
  - **GuidedChoiceCard:** See more / See less / More details sit **below** body copy (product placement). **Nothing** (facts, chips, quantity, cost) may render **under** that disclosure row. Use `titleMeta` for title-adjacent budget chips; `expandedExtra` for See more facts; `beforeDisclosure` for controls that must stay visible above the row (e.g. Equipment quantity). Card height is stabilized via density min-height; empty disclosure action-row is reserved while collapsed, not when expanded with only an info notice (feats/traits). Chip/row expands still follow stable-toggle.
  - **Avoid:** Per-call-site `w-full`, `flex-1`, width measurement, or sibling reordering for expanded chips; the shared primitive owns that behavior. Putting "See more" under growing text.
- **`Modal`** — Layer 2/3 selection, wizards, and choice-card deep-dive; `fullScreenOnMobile` per `MOBILE_UX.md`.
- **Marketing / landing copy** — `src/lib/constants/copy/*`; do not merge into `tooltip-text.tsx` (TASK-390).
