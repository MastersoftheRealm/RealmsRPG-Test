# Chip & Metadata Display Unification Plan

> **Status:** Planning (owner feedback 2026-07-02). Phase 2.2 consolidated *token maps*; this plan addresses the remaining **semantic taxonomy**, **shape**, **metadata coverage**, and **redundancy** gaps.
> **Parent:** `UI_UNIFICATION_PLAN.md` · **Audit:** `VISUAL_STATE_AUDIT.md` (VSEA-004+)

## Problem statement

After UI unification, chips still behave like **3–5 overlapping systems** with similar visuals but different purposes. Users cannot tell at a glance whether a chip is expandable (part/property with description) vs descriptive-only (feat type, tag, requirement). Expandable chips use pill-like rounding that **clips label text** when expanded. Metadata is sometimes duplicated (collapsed column + expanded chip), sometimes missing (DB field not shown anywhere), and sometimes rendered as **floating plain text** instead of chips.

## North-star: two chip roles (+ explicit non-chips)

| Role | Purpose | Interaction | Shape | Visual signature |
|------|---------|-------------|-------|------------------|
| **ExpandableChip** | Parts, properties, proficiencies — anything with a description and/or option levels | Click to expand in place; chevron when expandable | **Rounded rectangle** (`--radius-control` / `rounded-lg`); expanded → full-width block, same radius | Border + optional category tint; ring on expand; chevron |
| **DescriptorChip** | Metadata labels: feat type, category, tags, requirements, trait kind, rarity, status | **Never** expands | **Rounded rectangle**, compact (`rounded-md`) | **Opaque filled** surface (`bg-surface` or semantic `-light` solid); no chevron; no expand ring |

**Not chips** (keep separate components; do not force into chip taxonomy):

- Filter / selection pills (`ChipSelect`, `SegmentedControl`, `SourceFilter`)
- Navigation tabs (`TabNavigation` pill variant)
- Removable input tags (creator tag pickers) — may share `DescriptorChip` styles but keep remove affordance
- `SkillSourceChip` (large touch-target source picker)
- Inline stat badges (innate ★, quantity, uses stepper)

## Governing rules (product + engineering)

### 1. Metadata visibility

For **every** `GridListRow` (and entity-library-section) list backed by codex/DB data:

> If a field is meaningful to the player and stored on the item, it must appear in **either** the collapsed row columns **or** descriptor chips in the expanded view — not nowhere.

Apply per entity type (examples):

| Entity | Collapsed columns (preferred) | Expanded descriptors (if not in columns) |
|--------|------------------------------|------------------------------------------|
| Power | Action, Damage, Area, Duration; Energy in right slot or column | Range, TP total, part-level energy not in part chips |
| Technique | Action, Energy, Weapon | Range, damage breakdown, TP |
| Weapon/Armor | DR, crit, type, etc. | Properties without descriptions as descriptors; with descriptions as expandable |
| Feat | Req level, Category, Ability, Uses, Recovery | Tags, type (character/archetype/state), requirements **only if not already in columns** |
| Trait | Description, Uses, Recovery | Trait kind (ancestry/flaw/characteristic) **only if not in overview/header** |
| Species part/property | As codex defines | Same rule |

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
| `shared/part-chip.tsx` | Thin `PartData` wrappers; `PartChip` deprecated alias |
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
Size:       sm default in list rows (text-xs px-2 py-0.5)
No chevron, no ring, no hover shadow
```

Semantic descriptors (rarity, success/warning) may use existing `-light` fills — still **opaque** tokens, not translucent `*/30` unless contrast-verified.

### Size by role

| Role | Default size | Collapsed typography | Expanded body |
|------|--------------|----------------------|---------------|
| **ExpandableChip** | `md` | `text-sm`, `px-3 py-1.5` | `text-sm` when `md`; `text-xs` when `sm` |
| **DescriptorChip** | `sm` | `text-xs`, `px-2 py-0.5` | N/A (non-expandable) |
| **DescriptorChip** (prominent) | `md` / `lg` | Same tokens, larger padding/type | N/A — step counters, TP totals, hero rarity only |

**Rule:** Size follows **role**, not page. GridListRow expanded chips, `SummaryChipList`, and `PartChipList` use **`md`** expandable chips. Row/card metadata stays **`sm`**. Do not use prominent `md`/`lg` descriptors for entity names that have descriptions — use `ExpandableChip` instead.

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

**Files:** `chip.tsx`, `expandable-chip.tsx`, `expandable-grid-list-chip.tsx`, `part-chip.tsx`, `grid-list-row.tsx`, `add-skill-modal.tsx`, `choice-trait-option-select.tsx`, `styleguide/page.tsx`, `DESIGN_SYSTEM.md`, `FEATURE_INDEX.md`

### Phase B — Component merge ✅ (audited 2026-07-02)

1. Unified `ExpandableChip` in `ui/` — options, costs, controlled/uncontrolled, descriptor mode ✅
2. `lib/chip/expandable-chip-props.ts` + `lib/chip/index.ts` barrel ✅
3. `GridListChip` wrapper; deleted `expandable-grid-list-chip.tsx` ✅
4. `PartChipList` uses `ExpandableChip` directly; `PartChip` kept as deprecated alias ✅
5. `PartData` → `lib/chip/part-data.ts`; `ChipOptionsPanel` shared ✅
6. `shared/index` re-exports `ExpandableChip`, `GridListChip` ✅

**Files:** `ui/expandable-chip.tsx`, `lib/chip/*`, `shared/grid-list-chip.tsx`, `shared/part-chip.tsx`, `grid-list-row.tsx`

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

**Files:** `list-row-metadata.ts`, `part-chips-from-display.ts`, `library-entity-rows.tsx`, `creature-stat-block.tsx`, `library-selectable-builders.ts`, `build-*-selectable-item.ts`, `feat-list.ts`, `feats-step.tsx`, `powers-step.tsx`, `creature-creator/page.tsx`, `LibraryPowersTab.tsx`, `LibraryTechniquesTab.tsx`, `official-*-list.ts`

**Priority entities:** Powers (energy/range), Techniques, Feats, Traits, Equipment properties

### Phase E — Cleanup ✅ (2026-07-03)

1. `ChipData.kind: 'descriptor' | 'expandable'` — replaced `category: 'tag'` behavior ✅
2. Removed dead `PartChipDetails` ✅
3. Documented rules in `grid-list-row-types.ts` + `chip-data-helpers.ts` ✅
4. Playwright baselines: `tests/visual/chip-unification.pw.ts` (styleguide expanded feat + power rows) ✅

**Also:** `add-feat-modal` / `AddCreatureFeatModal` → `buildFeatDetailSections` (DRY); removed `tag` from `GridListChipCategory`.

**Phase E audit (2026-07-03):** Explicit `kind: 'descriptor'` on codex parts/equipment stats, add-skill ability chips, admin species skills; `buildUsesRecoveryDetailSections` DRYs creature feat/trait uses metadata; stale `category: 'tag'` comment removed from `list-row-metadata.ts`. Playwright baselines committed (`chip-unification.pw.ts` × 4). Implicit descriptors without `kind` remain only on expandable chips (options, leveled feats, traits with descriptions).

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
| Power | `library-entity-rows.tsx`, `official-power-list.ts`, `build-power-selectable-item.ts` | ✅ | Range → descriptor chip in expanded; energy in rightSlot (collapsed); official list has Range column |
| Technique | `library-entity-rows.tsx`, `official-technique-list.ts`, `build-technique-selectable-item.ts` | ✅ | Range/damage → descriptor chips; official list has Damage column; energy column + use button OK |
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
