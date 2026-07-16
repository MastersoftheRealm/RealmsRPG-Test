> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Components & Lists

Quick location table: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) § Components. Unification rule: `.cursor/rules/realms-unification.mdc`.

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
| Entity **thumbnail** in list row (left of name, click to preview) | **GridListRow** `thumbnail` + **ListRowThumbnail** | See [`03-entity-card-art.md`](03-entity-card-art.md) — species pilot shipped |

**List item actions:** GridListRow and ItemCard use the same action set (view/edit/duplicate/delete, plus quantity where applicable). Use IconButton and the same placement pattern; see `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended catalog details.

**List modal layout (add-X, load, selection):** Prefer **`UnifiedSelectionModal`** (or thin wrappers: `AddLibraryItemModal`, `LoadFromLibraryModal`, `AddFeatModal`, `AddSkillModal`) so search/sort/list/footer stay consistent. `UnifiedSelectionModal` defaults to **`flexLayout`** (sticky header/footer + scrollable list on mobile). For rare custom lists that cannot use UnifiedSelectionModal, use **useModalListState** (`@/hooks/use-modal-list-state`) for search/sort state — and apply `gridColumnsWithInlineSelection` yourself (do not pre-wrap grids passed into UnifiedSelectionModal). Structure: (1) Header (title + close), (2) Search, (3) optional filters, (4) **ListHeader**, (5) scrollable **GridListRow** list, (6) footer. Use **EmptyState** / **LoadingState**; avoid ad-hoc Spinner/divs. **Quantity (`showQuantity`):** in-row **`QuantitySelector`** (quantity-first: raise qty from 0 to select, lower to 0 to deselect) — do not place a side-column stepper that shoves the row.

See `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended component catalog (agents: prefer this guide + `realms-unification.mdc`).

## Unified patterns (verified Jun 2026)

Goal: "Learn once, use forever" — consistent UI across Library, Codex, Character Sheet, Creators. List/sort headers use **ListHeader** (single source of truth).

| Pattern | Where used |
|---------|------------|
| GridListRow | Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator |
| ListRowThumbnail + `GridListRow.thumbnail` | Codex species, Admin species (pilot); extend per [`03-entity-card-art.md`](03-entity-card-art.md) |
| GuidedChoiceCard + guided-choice-image | Guided creator choice steps (species hero art); optional `onDetails` for deep-dive |
| GuidedEntityDetailModal | Choice-card deep-dive (overview + read-only CollapsibleSection catalogs; optional Close \| Select footer) — not catalog Layer 2 |
| GuidedSpeciesDetailModal + GuidedTraitOptionList | Species deep-dive: SpeciesRevealPanel overview + DetailOptionList trait catalogs (TASK-433/435) |
| GuidedPathDetailModal + GuidedDetailOptionList | Path deep-dive: proficiency / abilities / skills overview + feat / weapon / armor / gear / power|technique catalogs (TASK-434/435; kits removed TASK-442) |
| DetailOptionList + lib/detail-option | Shared elongated option-row toolkit for deep-dive + remodeled species-modal / SpeciesRevealPanel granted traits (TASK-435) |
| GuidedLayerNav | Layer 1 expand / Layer 2+ collapse below step content — guided creator (path, species, abilities), GuidedChoiceShell (Advanced path mode) |
| SkillRow | skills-section, skills-step, creature-creator, SkillsAllocationPage. Table play view gates source chrome via `isEditing` (TASK-485) |
| ValueStepper | abilities-section, sheet-header, health-energy-allocator, dice-roller, all creators, encounters pages |
| SectionHeader | feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages |
| ListHeader | All Codex/Library/Admin list views, feats-step, UnifiedSelectionModal |
| UnifiedSelectionModal | AddFeatModal, AddSkillModal, AddLibraryItemModal, LoadFromLibraryModal (thin wrappers) |
| library-selectable-builders | Add + Load library SelectableItem shaping (shared pipeline) |
| useModalListState | Other list modals that need search/sort without UnifiedSelectionModal |

**Intentional exceptions:** Auth pages use `gray-*` / brand social colors; AddSubSkillModal uses SelectionToggle (not GridListRow); filled primary/danger controls use `text-text-on-dark` on colored backgrounds.

Quick reference: `.cursor/rules/realms-unification.mdc`, `DESIGN_SYSTEM.md`.

## Shared Component Usage (Verified)

- **GridListRow** — Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator
- **HubListRow** — Encounters hub, Crafting hub, Library Enhanced tab (list rows with icon, title, badge, subtitle, delete). **Do not use** for combat/skill encounter participants: those use **CombatantCard** and participant-specific blocks (health, initiative, roll state); HubListRow is for "open/delete" list items only.
- **SkillRow** — skills-section, skills-step, creature-creator, SkillsAllocationPage. Table variant: when `isEditing` is false, hide `(species)` / `sourceLabel` and species/locked prof opacity so sheet play view matches base skill chrome; edit + allocation (`isEditing` true) keep source markers and locked remove/prof affordances (TASK-485). Card/compact still show source labels for creator flows.
- **ValueStepper** — abilities-section, sheet-header, health-energy-allocator, dice-roller, SkillRow (all variants), skills-allocation defense, all creators, encounters. Prefer `ValueStepper` / `DecrementButton` / `IncrementButton` + `.btn-stepper`; quantities use `QuantitySelector` (same chrome). Do not hand-roll ± buttons.
- **SectionHeader** — feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages
- **AddSubSkillModal** — Uses SelectionToggle (not GridListRow) — unique base-skill selector UX
