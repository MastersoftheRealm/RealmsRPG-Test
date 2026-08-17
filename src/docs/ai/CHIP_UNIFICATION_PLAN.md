# Chip & Metadata Display Unification Plan

> **Status:** Complete (TASK-415 phases A–E, 2026-07). Keep as historical reference; live chip rules live in `AGENT_GUIDE.md` / `FEATURE_INDEX.md`.
> **Parent:** `UI_UNIFICATION_PLAN.md` · **Audit:** `VISUAL_STATE_AUDIT.md` (VSEA-004+)

## Problem statement

After UI unification, chips still behave like **3–5 overlapping systems** with similar visuals but different purposes. Users cannot tell at a glance whether a chip is expandable (part/property with description) vs descriptive-only (feat type, tag, requirement). Expandable chips use pill-like rounding that **clips label text** when expanded. Metadata is sometimes duplicated (collapsed column + expanded chip), sometimes missing (DB field not shown anywhere), and sometimes rendered as **floating plain text** instead of chips.

## North-star: two chip roles (+ explicit non-chips)

| Role | Purpose | Interaction | Shape | Visual signature |
|------|---------|-------------|-------|------------------|
| **ExpandableChip** | Parts, properties, proficiencies — anything with a description and/or option levels | Click to expand in place; chevron when expandable | **Rounded rectangle** (`--radius-control` / `rounded-lg`); expanded → grow into remaining chip-group row width (stable toggle; **not** CSS `w-full` wrap reboot), same radius | Border + optional category tint; inset ring on expand; chevron |
| **DescriptorChip** | Metadata labels: feat type, category, tags, requirements, trait kind, rarity, status | **Never** expands | **Rounded rectangle**, compact (`rounded-md`) | **Opaque filled** surface (`bg-surface` or semantic `-light` solid); no chevron; no expand ring |

**Not chips** (keep separate components; do not force into chip taxonomy):

- Filter / selection pills (`ChipSelect`, `SegmentedControl`, `SourceFilter`)
- Navigation tabs (`TabNavigation` pill variant)
- Removable input tags (creator tag pickers) — may share `DescriptorChip` styles but keep remove affordance
- Inline stat badges (innate ★, quantity, uses stepper)

## Governing rules (product + engineering)

### 1. Metadata visibility

For **every** `GridListRow` (and entity-library-section) list backed by codex/DB data:

> If a field is meaningful to the player and stored on the item, it must appear in **either** the collapsed row columns **or** descriptor chips in the expanded view — not nowhere.

**SoT (TASK-806 / TASK-807 / ADR-0016):** `src/lib/glr/glr-fact-catalog.ts` (facts + bands) + `glr-density.ts` (modes/flags) + `resolve-glr-fact-layout.ts` (column vs chip vs rightSlot). Surface CI pointers: `glr-surface-bindings.ts`. CI: `glr-fact-catalog.test.ts`. Formatting: `lib/detail-option/compact-facts.ts`.

Historical examples (see `glr-surface-bindings.ts` + CI — do not edit this table without updating CI):

| Entity | Collapsed columns (preferred) | Expanded descriptors (if not in columns) |
|--------|------------------------------|------------------------------------------|
| Power | Action, Damage, Area, Duration; **play sheet:** Energy via spend `rightSlot` only | Play/select: Category, Range, TP chips. Browse: TP chip (not a Total TP footer) |
| Technique | **Play sheet:** Action, Weapon + Energy `rightSlot`. **Browse:** Energy/Weapon/TP | Play: Category, damage, TP chips. Range is extra-chrome (not a catalog fact) |
| Weapon/Armor/Shield | Library official: kind-specific (`ARMAMENT_LIBRARY_CONFIG` / browse chrome) | Play: rarity / currency / TP chips. Named properties as expandable chips |
| Feat | Browse: Req level, Category, Ability, Uses, Recovery. **Play sheet:** Uses, Recovery | Play: Req. Level / Category / Ability chips. Select: Req. Level chip |
| Gear | Browse: Category, Currency, Rarity columns | Play: those three as chips (not `Cost Nc` badges) |

### 2. No redundancy

> Do not show the same fact in collapsed columns **and** expanded descriptor chips.

Audit targets (known today):

- Feat **category** — column + `detailSections` category chip → keep column, drop chip
- Feat **type** chips — only in expanded if not inferable from list context (archetype vs character tab)
- Trait **category** — overview bar badge + floating italic subtext in `SpeciesTraitCard` → pick one surface (descriptor in collapsed row **or** single descriptor chip in expanded, not both)

### 3. One component per role

- **Expandable:** merge `ExpandableChip`, `PartChip`, `ExpandableGridListChip` → single `ExpandableChip` in `src/components/ui/`
- **Descriptor:** extend `<Chip>` with `role="descriptor"` variant **or** thin `DescriptorChip` wrapper; retire `GridListRow` `BADGE_COLORS` inline spans
- **Data model:** split `ChipData` into `ExpandableChipData` vs `DescriptorChipData` (or `expandable: boolean` with type guard)

## Current inventory (as of 2026-07-02)

### Token layer (✅ done in Phase 2.2)

- `chipVariants` in `src/components/ui/chip.tsx` — single CVA source
- `gridListChipVariant()`, `partChipVariant()`, `rarityChipVariant()` — category mappers

### Expandable components (✅ merged Phase B)

| File | Role |
|------|------|
| `ui/expandable-chip.tsx` | **Single** expand-in-place implementation (GridListRow, proficiencies, styleguide) |
| `shared/grid-list-chip.tsx` | Thin `ChipData` → `ExpandableChip` adapter for `GridListRow` |
| `lib/chip/expandable-chip-props.ts` | `PartData` / `ChipData` → `ExpandableChipProps` |
| `lib/chip/chip-options-panel.tsx` | Shared options sub-panel |
| ~~`shared/expandable-grid-list-chip.tsx`~~ | **Deleted** — use `GridListChip` |

### Still-duplicate **descriptor** patterns (Phase C ✅)

| Pattern | Where | Status |
|---------|-------|--------|
| Pill `<Chip>` for metadata | Creator, sheet, guided, admin | ✅ `DescriptorChip` |
| `GridListRow` `badges` | Trait rows | ✅ Phase A |
| Floating italic category | `SpeciesTraitCard` | ✅ Phase C |
| Ad-hoc `rounded-full` metadata spans | Hubs, item-card, steps | ✅ Phase C |
| Raw `requirements` ReactNode | Powers (range) | Phase D ✅ |
| `ChipData.category: 'tag'` | Feat tags, metadata | Phase E ✅ → `kind: 'descriptor'` |

### `ChipData.category` overload

`category: 'tag'` was removed in Phase E — use `kind: 'descriptor'` via `descriptorChipData()` or `metadataDescriptorChip()`.

## Visual spec

### ExpandableChip shape fix

**Problem:** Collapsed expandable chips inherit pill geometry (`rounded-full` via `chipVariants`) or heavy `rounded-xl`, producing capsule ends that clip multi-line expanded content.

**Fix:**

```txt
Collapsed:  inline-flex, rounded-lg (--radius-control), px-3 py-1.5, border
Expanded:   w-full min-w-0, same rounded-lg (NOT pill), ring-2 ring-offset-1
Multi-line: padding preserved; no border-radius > lg on expanded body
```

Category-colored part chips keep semantic tints; list-neutral parts use `list` variant.

### DescriptorChip opaque style

**Goal:** Visually distinct from expandable without relying only on color.

```txt
Background: bg-surface (light) / bg-surface-alt (dark) — fully opaque, not /30 alpha panels
Border:     border-border-light, 1px
Text:       text-text-secondary (body); semantic -fg only when meaning matters (rarity, status)
Radius:     rounded-md (slightly tighter than expandable)
Size:       descriptor token default (text-sm px-2.5 py-1); legacy `sm` prop maps here (TASK-699)
No chevron, no ring, no hover shadow
```

Semantic descriptors (rarity, success/warning) may use existing `-light` fills — still **opaque** tokens, not translucent `*/30` unless contrast-verified.

### Size by role

| Role | Default size | Collapsed typography | Expanded body |
|------|--------------|----------------------|---------------|
| **ExpandableChip** | `md` → `descriptor` | `text-sm`, `px-2.5 py-1` | `text-sm` when `md`; `text-xs` when `sm` |
| **DescriptorChip** | `sm` → `descriptor` | `text-sm`, `px-2.5 py-1` | N/A (non-expandable) |
| **DescriptorChip** (prominent) | `md` / `lg` | Same tokens, larger padding/type | N/A — step counters, TP totals, hero rarity only |

**Rule:** Chips in the same entity row (`data-chip-group`, GridListRow expanded sections) share the **`descriptor`** inline size — descriptor, expandable (`md`), and pill (`size="descriptor"`) must match. Use prominent `md`/`lg` descriptors only **outside** chip groups (budget counters, hero rarity). Filter toolbars keep pill `sm`.

**Variant:** Use `list`, `listWarning`, `listCost`, `power`, `technique`, and part `category` tokens — not one-off Tailwind on each call site.

### Styleguide additions

Add to `/dev/styleguide`:

1. **ExpandableChip** — collapsed + expanded side-by-side (short and long labels)
2. **DescriptorChip** — metadata row next to expandable for contrast
3. **Anti-pattern row** — pill expandable (deprecated)

## Implementation phases

### Phase A — Primitives & shape (low risk) ✅ (audited 2026-07-02)

1. Add `shape` variant to `chipVariants`: `pill` / `rounded` / `expandable` ✅
2. Add `descriptor` variant + `DescriptorChip` + `DESIGN_SYSTEM.md` ✅
3. Shared `expandableChipShellClass()` — all three expandable components use it ✅
4. `ExpandableGridListChip` routes non-expandable chips → `DescriptorChip` (tags, feat type, reqs) ✅
5. `GridListRow` badges + total cost → `DescriptorChip`; removed `BADGE_COLORS` ✅
6. Styleguide expandable + descriptor matrix ✅
7. Utils: `lib/chip/expandable-chip-shell.ts`, `lib/chip/grid-list-chip-utils.ts` ✅

**Files:** `chip.tsx`, `expandable-chip.tsx`, `expandable-grid-list-chip.tsx` (later deleted), `grid-list-row.tsx`, `add-skill-modal.tsx`, `choice-trait-option-select.tsx`, `styleguide/page.tsx`, `DESIGN_SYSTEM.md`, `FEATURE_INDEX.md`

### Phase B — Component merge ✅ (audited 2026-07-02)

1. Unified `ExpandableChip` in `ui/` — options, costs, controlled/uncontrolled, descriptor mode ✅
2. `lib/chip/expandable-chip-props.ts` + `lib/chip/index.ts` barrel ✅
3. `GridListChip` wrapper; deleted `expandable-grid-list-chip.tsx` ✅
4. `PartChipList` / `PartChip` deleted — all call sites use `ExpandableChip` + adapters ✅ (TASK-569)
5. `PartData` → `lib/chip/part-data.ts`; `ChipOptionsPanel` shared ✅
6. `shared/index` re-exports `ExpandableChip`, `GridListChip` ✅

**Files:** `ui/expandable-chip.tsx`, `lib/chip/*`, `shared/grid-list-chip.tsx`, `grid-list-row.tsx`

### Phase C — Descriptor unification ✅ (audited 2026-07-03)

1. `buildFeatDetailSections` — removed redundant Category chip ✅
2. `SpeciesTraitCard` `neutralStyle` → `DescriptorChip` ✅
3. `HubListRow`, `ItemCard`, encounters/crafting hubs ✅
4. Shared helpers: `lib/chip/descriptor-chip-variants.ts` ✅
5. **Global pass** — creator steps, sheet, guided creator, admin, creature creator, item/power creators ✅

**Intentionally still `<Chip>` (non-descriptor roles):** `ChipSelect` filters, `edit-species-modal` interactive trait pickers, removable `ChipList` tags in creature creator, styleguide pill demos.

**Files:** `descriptor-chip-variants.ts`, `species-trait-card.tsx`, `hub-list-row.tsx`, `item-card.tsx`, creator/sheet/guided/admin components (30+ call sites)

### Phase D — Metadata audit (domain) ✅ (audited 2026-07-03)

1. Per-entity checklist in this doc (append results table) ✅
2. Audit builders: `library-entity-rows.ts`, `feat-list.ts`, `official-*-list.ts`, codex tabs, creator steps, `add-library-item/*` ✅
3. Add missing descriptors; remove redundant `detailSections` entries ✅
4. Shared helpers: `lib/chip/list-row-metadata.ts`, `lib/chip/part-chips-from-display.ts` ✅

**Global audit fixes:** `creature-stat-block.tsx`, `library-selectable-builders.ts` (load modal), `creature-creator/page.tsx`, empowered technique range metadata, weapon/shield/equipment → `detailSections`, DRY part-chip mapping sitewide.

**Files:** `list-row-metadata.ts`, `part-chips-from-display.ts`, `library-entity-rows.tsx`, `creature-stat-block.tsx`, `library-selectable-builders.ts` (canonical add+load SelectableItem shaping), `build-empowered-selectable-item.ts`, `feat-list.ts`, `feats-step.tsx`, `powers-step.tsx`, `creature-creator/page.tsx`, `LibraryPowersTab.tsx`, `LibraryTechniquesTab.tsx`, `official-*-list.ts`

**Priority entities:** Powers (energy/range), Techniques, Feats, Traits, Equipment properties

### Phase E — Cleanup ✅ (2026-07-03)

1. `ChipData.kind: 'descriptor' | 'expandable'` — replaced `category: 'tag'` behavior ✅
2. Removed dead `PartChipDetails` ✅
3. Documented rules in `grid-list-row-types.ts` + `chip-data-helpers.ts` ✅
4. Playwright baselines: `tests/visual/chip-unification.pw.ts` (styleguide expanded feat + power rows) ✅

**Also:** `add-feat-modal` / `AddCreatureFeatModal` → `buildFeatDetailSections` (DRY); removed `tag` from `GridListChipCategory`.

**Phase E audit (2026-07-03):** Explicit `kind: 'descriptor'` on codex parts/equipment stats, add-skill ability chips, admin species skills; stale `category: 'tag'` comment removed from `list-row-metadata.ts`. Playwright baselines committed (`chip-unification.pw.ts` × 4). Implicit descriptors without `kind` remain only on expandable chips (options, leveled feats, traits with descriptions). Creature feat/trait uses/recovery now go through `glrSurfaceDetailSections` (TASK-814).

## Success criteria

- [x] Exactly **two** chip roles in production UI (expandable + descriptor)
- [x] Zero `BADGE_COLORS` inline spans in `GridListRow`
- [x] Zero floating italic category text where a descriptor chip or column suffices
- [x] Expanded expandable chips use rounded-rectangle geometry; no label clipping in styleguide matrix
- [x] Metadata audit passes for feats, traits, powers, techniques, weapons, armor (documented in audit table below)
- [x] No duplicate facts between columns and expanded descriptors (grep + manual pass)

## Metadata audit tracker

> Fill during Phase D. Status: ⬜ not audited · ✅ complete · ⚠️ gaps logged

| Entity | Builder file(s) | Audited | Gaps / notes |
|--------|-----------------|---------|--------------|
| Feat | `lib/codex/feat-list.ts`, `feats-step.tsx` | ✅ | Category chip removed Phase C; Type chips hidden in creator (split tabs); codex keeps Type |
| Trait | `library-feat-rows.tsx`, `species-trait-card.tsx` | ✅ | Category in collapsed badge; customization in expanded block (not chip) |
| Power | `library-entity-rows.tsx`, `official-power-list.ts`, `library-selectable-builders.ts` | ✅ | Range → descriptor chip in expanded; play sheet Energy header + spend in rightSlot only; official list has Range column |
| Technique | `library-entity-rows.tsx`, `official-technique-list.ts`, `library-selectable-builders.ts` | ✅ | Range/damage → descriptor chips; official list has Damage column; play sheet Energy header + spend in rightSlot only (no static Energy value column) |
| Weapon | `library-entity-rows.tsx` | ✅ | Range/damage/attack in columns; properties expandable |
| Armor/Shield | `library-entity-rows.tsx` | ✅ | DR/crit in columns; armor reqs → descriptor chips; properties expandable |
| Equipment | `library-entity-rows.tsx` | ✅ | Type/qty columns; rarity/cost badges; properties expandable |
| Parts (codex) | `CodexPartsTab.tsx` | ✅ | Category/energy/TP columns; Type/mechanic/percentage/options in detailSections |
| Properties | `CodexPropertiesTab.tsx` | ✅ | Type/IP/TP/cost columns; option chips expandable |
| Creature stat block | `creature-stat-block.tsx` | ✅ | Powers/techniques use detailSections; range/damage metadata chips |
| Load library modal | `library-selectable-builders.ts` | ✅ | Range/damage metadata + shared part-chip mapper |
| Species | `CodexSpeciesTab.tsx` | ⚠️ | Inline stat boxes by design; trait cards use DescriptorChip (Phase C) |

## Task linkage

- **TASK-415** — Chip taxonomy & metadata display unification (parent task)
- Sub-tasks may be split into TASK-416+ if implementation spans multiple agent sessions

## References

- `src/components/ui/chip.tsx` — CVA variants
- `src/components/shared/grid-list-row.tsx` — list row expanded body
- `src/lib/codex/feat-list.ts` — feat `detailSections` builder (reference pattern)
- `UI_UNIFICATION_PLAN.md` Phase 2.2 (token consolidation — prerequisite)
