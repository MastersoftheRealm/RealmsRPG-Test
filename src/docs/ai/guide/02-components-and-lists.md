> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Components & Lists

Quick location table: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) § Components. Unification rule: `.cursor/rules/realms-unification.mdc`.

## Segmented toggles vs tabs

| Pattern | Component | When |
|---------|-----------|------|
| My Library ↔ Realms Library; All ↔ Realms ↔ My (modals) | **SourceFilter** or **SegmentedControl** | Short mutually exclusive scopes; same pill styling site-wide (`bg-surface-alt` track + bordered idle segments). Default track **hugs** pills (`inline-flex`); pass `equalWidth` when the group should stretch. |
| Two equal-width segments with optional icons (e.g. Combat/Skill, library/campaign) | **SegmentedControl** `equalWidth` + per-option `icon` | Same primary selected state as Library; non-tab segments get `aria-pressed` |
| Feat source / other modal sub-modes needing `role="tab"` | **SegmentedControl** with `tabs` + `tabPanelId` | A11y tablist when acting as tabs |
| Powers / Techniques / … primary navigation | **TabNavigation** (`variant="underline"`) | Long tab sets; keep underline tabs, do not swap for SegmentedControl |

**Tab a11y (TASK-355):** Call `useTabGroup()` in the page, pass `tabGroupId` + `sharedTabPanelId` to `TabNavigation`, wrap tab content in `<TabContentPanel tabGroupId={…} id={sharedPanelId} activeTab={…}>`. For per-tab panels in DOM, use `TabPanel` instead.

## Component Decision Tree (List/Selection UI)

| Use Case | Component | Notes |
|----------|-----------|-------|
| Powers, techniques, feats, equipment in lists | **GridListRow** | Sortable columns, leftSlot/rightSlot, expandable rows; below `lg` collapses empty `hideOnMobile` tracks so names aren’t squeezed beside X/+ (`buildMobileCollapsedGridColumns` via `--glr-desktop-grid` / `--glr-mobile-grid`, never inline `gridTemplateColumns`) |
| Character sheet Powers/Techniques energy cost | **GridListRow** `rightSlot` spend `RollButton` + **`CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME`** (`rowChrome.rightSlotLabel: 'Energy'`) | Play lists: cost **only** on the far-right spend control under an **Energy** header — no static Energy value column in the middle (`mapPowerRows` / `mapTechniqueRows` + `CHARACTER_SHEET_TECHNIQUE_*`). Browse/creator/stat-block lists may keep an Energy column when there is no spend button. Do not pass noop `onUse*` handlers (omit them for view-only). |
| Codex/Library browse | **GridListRow** (+ Official*List shells) | Sortable columns; view/edit/duplicate/delete via row actions |
| Base-skill selector (add sub-skill) | **SelectionToggle** | Unique UX; not GridListRow |
| Species detail view, level-up wizard | Custom layouts | Justified exceptions |
| Add-feat, add-skill, add-library-item modals | **GridListRow** or **UnifiedSelectionModal** | Consistent list selection |
| Add combatant / session participant (encounters, VTT, downtime) | **AddCombatantModal** | Intentional non-USM shared shell (TASK-571); extend for new session-play surfaces |
| Mixed species (exactly two species) | **MixedSpeciesModal** | Intentional non-USM dual `<select>` picker (TASK-605); Advanced species-step + sheet Edit Species + Guided Species L2 + Ancestry mixed overview change — not list add-X / USM |
| Entity **thumbnail** in list row (left of name, click to preview) | **GridListRow** `thumbnail` + **ListRowThumbnail** | See [`03-entity-card-art.md`](03-entity-card-art.md) § Adoption inventory (TASK-478) |

**List item actions:** GridListRow uses a shared action set (view/edit/duplicate/delete, plus quantity where applicable). Use IconButton and the same placement pattern; see `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended catalog details.

**List modal layout (add-X, load, selection):** Prefer **`UnifiedSelectionModal`** (or thin wrappers: `AddLibraryItemModal`, `LoadFromLibraryModal`, `AddFeatModal`, `AddSkillModal`, `AddSubSkillModal`, `AddCreatureFeatModal`, `AddProficiencyModal`, `CraftingItemSelectModal`, guided L2 feats/equipment/powers, AdminSpecies trait Add) so search/sort/list/footer stay consistent. Encounter/session participants use **`AddCombatantModal`** (non-USM; see decision tree — TASK-571), not USM. AdminTraits **choice-option** multi-select stays **inline editor chrome** inside the trait edit Modal (useModalListState + ListHeader + GLR; do not nest USM — TASK-572). `UnifiedSelectionModal` defaults to **`flexLayout`** + **`fullScreenOnMobile`** and passes Cancel / Add Selected through Modal’s **`footer`** slot so actions stay pinned on phones (do not put confirm buttons inside scrollable children). For rare custom lists that cannot use UnifiedSelectionModal, use **useModalListState** (`@/hooks/use-modal-list-state`) for search/sort state — and apply `gridColumnsWithInlineSelection` yourself (do not pre-wrap grids passed into UnifiedSelectionModal). Structure: (1) Modal title (+ optional **one-line** `description` or omit — TASK-574), (2) **compact toolbar** — Search + optional **Filters** toggle on one row, (3) **`scopeExtra`** — always-visible primary mode tabs (Powers/Empowered, Armaments/Equipment, etc.), (4) collapsible options panel (`headerExtra` + `filterContent` via `FilterSection` `variant="compact"`, collapsed on open — SourceFilter, advanced filters, custom-add), (5) **ListHeader**, (6) scrollable **GridListRow** list (primary focus), (7) Modal **`footer`** flush under the list (no content `pb` gap). Put catalog-identity tabs in **`scopeExtra`**; put SourceFilter / custom-add / advanced filters in **`headerExtra`** (TASK-564). Optional `optionsSummary` / `optionsActiveCount` surface secondary options when collapsed. Dismiss with unconfirmed picks → **Add selected?** / **Load selected?** prompt (TASK-574). Use **EmptyState** / **LoadingState**; avoid ad-hoc Spinner/divs. **Quantity (`showQuantity`):** in-row **`QuantitySelector`** (quantity-first: raise qty from 0 to select, lower to 0 to deselect) — do not place a side-column stepper that shoves the row.

**Sortable ListHeader columns:** Every data column (Name, Action Type, Energy, Training Points, Currency, Damage, Description, etc.) must be sortable ascending/descending. `ListHeader` / `UnifiedSelectionModal` default `sortable !== false`. Only spacer/action columns (`_actions`, empty label, thumbnails, `_sel`, `_innate`) use `sortable: false`. Mobile uses the same sort state via ListHeader’s “Sort by” control (`MOBILE_UX.md`). **Exception:** `DetailOptionList` deep-dive rows are not ListHeader sort chrome (no column-sort affordance).

**GLR chrome + spacing (TASK-631 / TASK-637 / TASK-674 / TASK-702 / TASK-710):** Library / Official / Codex browse lists use shell default `flex flex-col gap-1` row containers — do not override with `space-y-3` or loose `gap-*`. **UnifiedSelectionModal** list body uses `DEFAULT_USM_LIST_CLASSNAME` (`flex flex-col gap-1 min-w-0`). **Creator-embedded** GLR lists (e.g. creature creator loadout) register in `CREATOR_EMBEDDED_GLR_SOURCES`. Pair `ListHeader` `rowChrome` with row actions (`edit` / `delete` / `leftSlot` / `rightSlot`). When slot content is **conditional** (e.g. My Library patch-sync `rightSlot` only on drift), pass the **same** `rowChrome` on `GridListRow` (or `CreatureStatBlock`) so empty rows keep header alignment. **Master row layout:** `GridListRow` is a stretch grid — collapsed header + edit/delete/+ /qty share row 1 (icons vertically centered, `GRID_LIST_ROW_ACTION_ICON_BUTTON_SIZE`); expanded `GRID_LIST_ROW_EXPANDED_BAND_CLASS` continues into the action column so there is no empty band beside the description (actions stay in the header so + never overlays body). Hover is on that grid so the qty stepper shares the highlight (`[data-glr-row] .btn-stepper` is transparent so it does not punch a `bg-surface-alt` / `hover:bg-surface` hole). Data-only `gridColumns` must not include a trailing `40px` action track. Data-column templates stay on `--glr-desktop-grid` / `--glr-mobile-grid`; the chrome stretch-grid may set its template inline. Register new My Library tabs in `MY_LIBRARY_ENTITY_TAB_SOURCES`, Codex/Admin in `CODEX_BROWSE_SHELL_SOURCES`. CI: `lib/glr/validate-glr-chrome-spacing.test.ts` (runs via `npm test`).

See `src/docs/human/UI_COMPONENT_REFERENCE.md` for extended component catalog (agents: prefer this guide + `realms-unification.mdc`).

## Unified patterns (verified Jun 2026)

Goal: "Learn once, use forever" — consistent UI across Library, Codex, Character Sheet, Creators. List/sort headers use **ListHeader** (single source of truth).

| Pattern | Where used |
|---------|------------|
| GridListRow | Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator |
| ListRowThumbnail + `GridListRow.thumbnail` | Codex/Admin species lists; expand other art entities per [`03-entity-card-art.md`](03-entity-card-art.md) § Adoption inventory |
| GuidedChoiceCard + guided-choice-image | Guided creator choice steps (species hero art); optional `onDetails` for deep-dive |
| GuidedEntityDetailModal | Choice-card deep-dive (overview + read-only CollapsibleSection catalogs; optional Close \| Select footer) — not catalog Layer 2 |
| GuidedSpeciesDetailModal + GuidedTraitOptionList | Species deep-dive: SpeciesRevealPanel overview + DetailOptionList trait catalogs (TASK-433/435) |
| GuidedPathDetailModal + GuidedDetailOptionList | Path deep-dive: proficiency / abilities / skills overview + feat / weapon / armor / gear / power|technique catalogs (TASK-434/435; kits removed TASK-442) |
| DetailOptionList + lib/detail-option | Shared elongated option-row toolkit for deep-dive + remodeled species-modal / SpeciesRevealPanel granted traits (TASK-435) |
| GuidedLayerNav | Layer 1 expand / Layer 2+ collapse below step content — guided creator (path, species, abilities), GuidedChoiceShell (Advanced path mode) |
| SkillRow | skills-section, skills-step, creature-creator, SkillsAllocationPage. Table play view gates source chrome via `isEditing` (TASK-485) |
| ValueStepper (ADR-0002) | abilities-section, sheet-header, health-energy-allocator, GuidedSkillsPanel Dec/Inc, roll-log, all creators, encounters; QuantitySelector wraps it |
| SectionHeader | feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages |
| ListHeader | All Codex/Library/Admin list views, feats-step, UnifiedSelectionModal |
| UnifiedSelectionModal | AddFeat/Skill/SubSkill/LibraryItem/Proficiency, LoadFromLibrary, CraftingItemSelect, AddCreatureFeat, guided L2 (feats/equipment/powers), AdminSpecies trait Add |
| library-selectable-builders | Add + Load library SelectableItem shaping (shared pipeline) |
| useModalListState | Rare non-USM list shells only (AdminTraits choice-option editor chrome — TASK-572) |

**Intentional exceptions:** Auth pages use `gray-*` / brand social colors; AddSubSkillModal uses SelectionToggle (not GridListRow); filled primary/danger controls use `text-text-on-dark` on colored backgrounds.

Quick reference: `.cursor/rules/realms-unification.mdc`, `DESIGN_SYSTEM.md`.

## Shared Component Usage (Verified)

- **GridListRow** — Library, Codex, add-feat-modal, add-library-item-modal, add-skill-modal, equipment-step, feats-tab, library-section, creature-creator
- **HubListRow** — Encounters hub, Crafting hub, Library Enhanced tab (list rows with icon, title, badge, subtitle, delete). **Do not use** for combat/skill encounter participants: those use **CombatantCard** and participant-specific blocks (health, initiative, roll state); HubListRow is for "open/delete" list items only.
- **SkillRow** — skills-section, skills-step, creature-creator, SkillsAllocationPage. Table variant: when `isEditing` is false, hide `(species)` / `sourceLabel` and species/locked prof opacity so sheet play view matches base skill chrome; edit + allocation (`isEditing` true) keep source markers and locked remove/prof affordances (TASK-485). Card/compact still show source labels for creator flows.
- **ValueStepper** (ADR-0002) — abilities-section, sheet-header, health-energy-allocator, SkillRow, GuidedSkillsPanel (Dec/Inc), skills-allocation defense, all creators, encounters. One chrome: soft `bg-surface-alt` / no invasive border / bold ± (`.btn-stepper`). Quantities: `QuantitySelector` wraps `ValueStepper`. `colorVariant` colors the **value** only; buttons stay neutral. `enableHoldRepeat` for HP/EN pools only. Do not hand-roll ± buttons.
- **SectionHeader** — feats-tab, proficiencies-tab, notes-tab, archetype-section, crafting pages
- **AddSubSkillModal** — Uses SelectionToggle (not GridListRow) — unique base-skill selector UX
