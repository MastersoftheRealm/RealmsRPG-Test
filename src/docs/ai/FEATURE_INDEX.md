# Feature Index — "Does this already exist?"

**Purpose:** The anti-re-implementation guardrail. Before building a new component, hook, service, route, or util, scan this index first. Most accidental duplication in this repo came from agents not knowing a feature already existed.

**Also check:** generated barrel inventory [`FEATURE_INDEX_BARRELS.generated.md`](FEATURE_INDEX_BARRELS.generated.md) (`npm run tasks:generate-index` after changing barrel exports). CI fails if that file is stale.

**How to use:** Find your topic below → open the listed file/barrel → extend it (add a prop/variant) rather than forking a parallel copy. If you add a new top-level feature/hook/shared component, add a line here **and** regenerate the barrel file if you changed an index.ts export.

> This is a map, not the source of truth for behavior. For schema use `SUPABASE_SCHEMA.md`, for formulas `GAME_RULES.md`, for data flow `ARCHITECTURE.md`.

---

## Pages / features (`src/app/(main)/*`)

| Feature | Route / page |
|---------|--------------|
| Character list / dashboard | `characters/page.tsx` — square portrait cards (1:1 crop); no search/ListHeader |
| Character sheet (view + edit) | `characters/[id]/page.tsx` — layout `CharacterSheetBody` (single library mount; mobile side-scroll: `basis-full` + `gap-4` + PageContainer-matched `scroll-px-*` gutters — TASK-538); derived `useCharacterSheetDerived`; handlers `useCharacterSheetActions`; Library card title peer of Skills/Archetype (`text-lg`); library lists via `entity-library-sections` + `library-entity-rows` (powers/techniques: Energy header + far-right spend `rightSlot` via `CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME`; no static mid-row Energy value column); feats tab via `FeatsTraitsListSection` + `library-feat-rows` (player feat/trait `customName` + `note` on save; trait map `traitCustomizations`); library tab clamp `resolveLibraryActiveTab`; create-time tab hide via `defaultLibraryTabVisibilityForArchetype` (`libraryTabVisibility`); edit-archetype remount via `editArchetypeSessionKey` |
| Character creator | `character-creator/` (wizard steps under `components/character-creator/steps/`) |
| Character creator entry (Simple vs Advanced) | `characters/new/page.tsx` |
| Guided ("Simple") character creator | `characters/new/guided/page.tsx`, `components/guided-creator/` (incl. `GuidedSkillsPanel`, `GuidedChoiceCard`, `GuidedEntityDetailModal`, `GuidedFeatsBrowsePanel`, `GuidedPowersTechniquesL2Modal`, `reveal-step` / `GuidedRevealSummary` / `GuidedPortraitUpload` / `GuidedHealthEnergySection`), `stores/guided-creator-store.ts`, `lib/guided-creator/build-character.ts` (incl. `buildRequiredProficiencies` + `defaultLibraryTabVisibilityForArchetype` on save — custom-creator parity), save handoff `lib/creator-save-handoff.ts` (`navigateThenResetCreator`); chooser forwards `?returnTo=`. Path step groups Power / Powered-Martial / Martial with section-title `InfoTippy` (TASK-528; tips in `tooltip-text.tsx`) |
| Selection grammar (cards ↔ GridListRow; entity depth vs catalog breadth) | `REALMS_PRODUCT_OVERVIEW.md` §3.1; `guide/04-floating-ui-tooltips.md` § Related patterns; components: `GuidedChoiceCard`, `GuidedEntityDetailModal`, `GridListRow`, `GuidedLayerNav`, `DetailOptionList` |
| Guided choice-card deep-dive (TASK-432+) | **See more…** = in-card deepen (truncated copy, expandedExtra / equipment mechanic chips); **More details** = entity modal (`onDetails` → `GuidedEntityDetailModal`, path/species Close \| Select via TASK-448); **See more options** = catalog Layer 2 (`GuidedLayerNav` / browse). Do not invent specialist verbs. Shared rows: `DetailOptionList` + `@/lib/detail-option`. Wrappers: `GuidedTraitOptionList` / `GuidedDetailOptionList`. |
| Guided skills suggestions (ability-tier curation) | `lib/guided-creator/curated-skills.ts` (`curateGuidedSkillIds`, `getGuidedAbilityRecommendationTiers`, `formatGuidedSkillAbilityTag`), `guided-skill-recommendations.ts` (`buildGuidedSkillSuggestions`); consumed by `steps/skills-step.tsx` + `AddSkillModal` badges via `guided-skills-panel.tsx`. L1 rows show contributing Ability chip + Skill Bonus `InfoTippy` (`getGuidedSkillBonusHelp` in `tooltip-text.tsx`) — TASK-548 |
| Guided feat Layer 2 browse | `guided-feats-browse-panel.tsx`, `lib/guided-creator/feat-selection.ts`; wired in `archetype-feats-step.tsx` + `character-feat-step.tsx` via `GuidedLayerNav` |
| Guided equipment phased sub-flow (TASK-424 / 442 / 443 / 446 / 447 / 456 / 457 / 458 / 460 / 461 / 464–468 / 527) | `GUIDED_EQUIPMENT_PHASED_SPEC.md`, `lib/guided-creator/equipment-eligibility.ts`, `equipment-phase-stats.ts`, `equipment-currency.ts`, `equipment-phase-nav.ts`, `loadout-tp.ts`, `equipment-catalog-rows.ts`, `equipment-phase-candidates.ts`, `guided-equipment-l2.ts`, `guided-creator/guided-equipment-l1-phase.tsx`, `guided-equipment-phase-layout.tsx`, `guided-equipment-fact-chips.tsx`, `loadout-budget-bar.tsx`, `guided-equipment-l2-modal.tsx`, `guided-equipment-l2-grid.ts`, `lib/game/archetype-path.ts` (`parseLevel1LoadoutsField` metadata), `hooks/use-guided-equipment-catalog.ts`, `lib/game/weapon-attack-ability.ts`, `steps/loadout-step.tsx`. Card-first L1; optional picks; shared **`LoadoutBudgetBar`** (Currency optional + Training Points + tip **inside** PointStatus label) on L1/L2; weapon/armor/Equipment title-adjacent Currency + Training Points; See more = mechanic + named property InfoTippy chips (**i inside** chip; name-only props; no Weapon Damage / Armor Base redundancies); L2 selected items promoted onto L1 cards; Equipment Quantity adjacent on L1; L2 **in-row quantity-first** via UnifiedSelectionModal; sleek ValueStepper; no phase progress strip; no Path pick badge. No quick kits. **TASK-527:** defer `equipmentPhase` jump until catalogs/path ready; unresolved pool refs excluded from phase filters. |
| Guided powers/techniques L1 + L2 (TASK-444 / TASK-456 / TASK-458 / TASK-461 / TASK-463 / TASK-470–472) | `steps/powers-techniques-step.tsx`, `guided-powers-techniques-l2-modal.tsx`, `powers-techniques-l1-candidates.ts`, `powers-techniques-l2.ts`, `powers-techniques-energy-filter.ts`, `power-technique-display.ts`, `loadout-tp.ts`, `LoadoutBudgetBar`; L1 path cards (innate vs regular for Power); Training Points shared with Loadout on regular picks; Innate Energy PointStatus + threshold gate; innate cards title-adjacent Energy; L2 `UnifiedSelectionModal` (Energy ≤ theoretical L1 max / innate ≤ threshold); L2→L1 promotion; Action Type value-only desc chips. |
| Advanced character creator (classic 9-step) | `characters/new/advanced/page.tsx`, `stores/character-creator-store.ts` (`getCharacter` sets `libraryTabVisibility` via `defaultLibraryTabVisibilityForArchetype`) |
| Library (user + official content browse) | `library/page.tsx` |
| My Library entity tabs (sync/duplicate shell) | `library/components/UserLibraryEntityTabShell.tsx` (`enableSync` default true; `enableSync={false}` = list chrome only — no sync-all **or** duplicate modals), `library/hooks/use-library-entity-sync.ts`, `library/hooks/use-library-duplicate-confirm.ts` — sync tabs: `LibraryItemsTab` / `LibraryPowersTab` / `LibraryTechniquesTab` / `LibraryCreaturesTab`; basic: `LibraryEnhancedTab` (ADR-0001 / TASK-475) |
| Codex (rules data browser) | `codex/page.tsx` |
| Realms Library, guest read-only | `library/page.tsx` + `library/LibraryPublicContent.tsx` — guests see official "Realms" content with the My-Library toggle + "Add to library" hidden. (Former `/browse` was a redundant duplicate; removed and redirected to `/library` — TASK-336.) |
| Power creator | `power-creator/page.tsx` (advanced); guided: `power-creator/guided/page.tsx` (TASK-410+) — shell: `CreatorPageShell` |
| Technique creator | `technique-creator/page.tsx` (`CreatorPageShell`) |
| Empowered technique creator | `empowered-technique-creator/page.tsx` (`CreatorPageShell`) |
| Item creator | `item-creator/page.tsx` (`CreatorPageShell`) |
| Species creator | `species-creator/page.tsx` (`CreatorPageShell`, Load ungated) |
| Creature creator | `creature-creator/page.tsx`, `creature-skill-utils.ts` (skills ↔ allocations, load mapping); `CreatorPageShell` + reset confirm |
| Crafting (sessions + enhanced items) | `crafting/page.tsx`, `crafting/[id]/page.tsx` |
| Encounters | `encounters/page.tsx`, `encounters/[id]/page.tsx`, `encounters/[id]/combat/page.tsx`, `encounters/[id]/mixed/page.tsx`, `encounters/[id]/skill/page.tsx` |
| Campaigns | `campaigns/page.tsx` |
| Admin (official content, users, tooltips) | `admin/page.tsx` |
| Account / profile | `my-account/page.tsx` |
| Rules / resources / about / privacy / terms | `rules`, `resources`, `about`, `privacy`, `terms` |
| Site / marketing copy (edit prose here) | `lib/constants/copy/*-copy.ts` via `lib/constants/site-copy.ts` (landing, auth, about + carousel, nav, rules, resources, privacy, terms, footer, guided creator; Discord URL + motto + contact email in `shared-copy.ts`). Tooltips: `public/tooltip-text.tsx`. Screenshot audit: `playwright.site-copy-audit.config.ts`. |

## Data hooks (`src/hooks/`, import from `@/hooks`)

| Need | Hook(s) |
|------|---------|
| Auth / current user | `useAuth`, `useAuthStore`, `useProfile`, `useAdmin` |
| Codex rules data (feats, skills, species, traits, parts, equipment, properties, archetypes) | `useCodexFull` + the `useCodex*` family (aliased `useSkills`/`useSpecies`/`usePowerParts`/etc.) |
| Game rules constants | `useGameRules`, `getGameRulesFallback` |
| Trait / skill id↔name resolution | `useResolvedTraits`, `useSkillIdToNameMap`, `resolveTraitIds`, `resolveSkillIdsToNames` |
| Official library (browse + add to my library) | `useOfficialLibrary`, `useAddOfficialToLibrary` (legacy alias: `usePublicLibrary`) |
| User-created content (CRUD: powers/techniques/items/creatures/species) | `useUser*`, `useDelete*`, `useDuplicate*` from `use-user-library` |
| Characters CRUD | `useCharacters`, `useCharacter`, `useSaveCharacter`, `useCreateCharacter`, `useDeleteCharacter`, `useDuplicateCharacter` |
| Campaigns | `useCampaigns*`, `useCampaign`, `useCampaignRolls` |
| Encounters | `useEncounters`, `useEncounter`, `useCreate/Save/DeleteEncounter` |
| Crafting + enhanced items | `useCraftingSession(s)`, `useEnhancedItems` + CRUD |
| Save a creator's output | `useCreatorSave`; load into a modal: `useLoadModalLibrary` (incl. species/creature + `prefetch`) |
| Character creator path recommendations | `useCreatorPathData` — resolves `path_data` from draft or codex by `archetypePathId` |
| Guided creator path data | `useGuidedPathData` in `components/guided-creator/use-guided-path-data.ts` (returns `isLoading` while codex archetypes load for selected path — Loadout phase entry waits on it, TASK-527) |
| Autosave (debounced) | `useAutoSave` |
| List sorting / modal list state | `useSort`, `sortByColumn`, `useModalListState` |
| Tooltips (canonical) | `InfoTippy` + `WordHelpTip` (word-tied, no icon) + `public/tooltip-text.tsx` (`getAbilityHelp` / `getDefenseHelp`) — **`guide/04-floating-ui-tooltips.md`** (decision matrix) |
| Floating UI (`@floating-ui/react`) | Engine inside `InfoTippy` only today; new anchored UI → shared primitive first — see same guide appendix |

> There is **one** codex fetch shared by all `useCodex*` and `useGameRules` (see `use-codex.ts`). Do not add a parallel codex fetch.

## Shared UI components (`src/components/shared/`, import from `@/components/shared`)

| Need | Component |
|------|-----------|
| Expandable list row (Library/Codex/sheet/creator) | `GridListRow` — **fact policy (TASK-437/454/461):** dense browse keeps `ListHeader` columns when space allows (short **TP** headers OK on L3 tables); deep-dive/`DetailOptionList` omit columns → self-describing chips. Helpers: `lib/chip/list-row-metadata.ts`, `lib/detail-option` `compact-facts` (`TRAINING_POINTS_COST_LABEL`, `namedPropertyDescriptorChips`, combat+equipment builders). Chip `costLabel` defaults to **Training Points**. **Mobile (TASK-536):** `buildMobileCollapsedGridColumns` collapses vacated `hideOnMobile` tracks below `lg` so names keep width beside X/+. Apply via `--glr-desktop-grid` / `--glr-mobile-grid` classes — never inline `gridTemplateColumns`. **Body toggle (TASK-539):** header, mobile summary, and non-interactive expanded panel all expand/collapse (chip groups / buttons excluded). |
| Descriptor chip + property tip | `DescriptorChipWithTip` — non-expanding chip with **InfoTippy inside** the chip when description exists (TASK-454/465); guided cards use `GuidedFactChipRow`; GridListRow descriptors use the same tip path via `GridListChip` (TASK-461) |
| Guided Loadout budget chrome | `LoadoutBudgetBar` — shared Currency (optional) + Training Points PointStatus with tip via `labelAccessory` (phase layout, L2 footer, powers/techniques) |
| **Entity card art — click to enlarge (site-wide default)** | **`ExpandableImage`** (+ `ExpandableImageModal`); list thumbs: `ListRowThumbnail`. Also: sheet portrait (play), creature stat-block, campaign chips, account profile. Exceptions: `guide/03-entity-card-art.md` § Adoption inventory (TASK-478) |
| **Entity card art — list thumb** (44px, D&D Beyond style) | `GridListRow.thumbnail` + `ListRowThumbnail`; `ListHeader.hasThumbnailColumn`; resolve via `resolveListRowThumbnail` (`list-row-image.ts`). Wired for all art-capable kinds: species, creature, equipment, power, technique — Library/Official/Codex/Admin lists, selection modals, character sheet library sections, advanced + creature creator selected lists, CreatureStatBlock nested lists. Enhanced items deferred (TASK-500). No thumbs on feats/skills/archetypes/parts/etc. |
| **Entity card art — choice card hero** (guided creator) | `GuidedChoiceCard` (wraps `ExpandableImage`) |
| **Entity card art — admin / creator** | **`RealmsImageField`** / **`RealmsImagePicker`** (`realms-image-picker.tsx`); bank APIs `POST /api/images` (+ replace/delete/usage); helpers `lib/realms-images.ts` (ADR-0003 / TASK-495–498). Legacy `CodexArtUploadField` + `/api/upload/codex-art` removed. |
| **Realms Image Library (bank)** | `realms_images` + `realms_image_categories`; `GET/POST /api/images`, `GET/PATCH/DELETE /api/images/[id]`, `POST …/replace`, `GET …/usage` (`ADR-0003`, TASK-492). Admin UI: `/admin/images` (TASK-493). Schema: `SUPABASE_SCHEMA.md` §2.5a; SQL `sql/realms-image-library.sql` |
| **Entity card art — product/schema** | REALMS §5.0.3 + `guide/03-entity-card-art.md` + `SUPABASE_SCHEMA.md` §2.5a |
| Hub list row (Encounters/Crafting) | `HubListRow` |
| Sortable column headers | `ListHeader` — data columns asc/desc by default; only spacer/action columns `sortable: false` (TASK-488) |
| Selection modal (add/pick from library) | `UnifiedSelectionModal` (default `flexLayout` + `fullScreenOnMobile`; Cancel/Add Selected via Modal `footer` for sticky mobile actions; `maxSelections` soft limit when max ≠ 1; `maxSelections={1}` replaces selection; `confirmLabel` / optional `primaryActions`) |
| + → ✓ selection button | `SelectionToggle`; equipped toggle: `EquipToggle`; innate: `InnateToggle` |
| Source scope All / Realms / My Library | `SourceFilter` (on `SegmentedControl`) |
| 2–N pill toggle | `SegmentedControl` |
| Section header with + / collapse | `SectionHeader` (default `size="md"` / `text-sm`; Library list subsections pass `lg` / `text-base`; size on title so collapse cannot shrink it; `collapsible` + inline chevron beside title; `+` far right; collapsible rows use modest `pb-1.5` + coarse-only 44px); `useLibrarySectionCollapse`; `LibraryCollapsibleSection`; entity list sections `collapsible` prop; cost badge: `SectionCostBadge` |
| Dice roll button | `RollButton` |
| +/- steppers | `ValueStepper`, `DecrementButton`, `IncrementButton` (ADR-0002 / TASK-487 — guided skills bonus chrome); quantities: `QuantitySelector` (wraps ValueStepper), `QuantityBadge`; `UnifiedSelectionModal` `showQuantity` = in-row quantity-first |
| Point allocation display | `PointStatus`; guided Loadout/powers: `LoadoutBudgetBar`; powered/martial split: `PoweredMartialSlider` |
| Skill row / allocation | Advanced/creature: `SkillRow`, `SkillsAllocationPage`, `AddSkillModal`, `AddSubSkillModal`. Table `variant`: play view (`isEditing` false) hides `(species)` / `sourceLabel` and species-dimmed prof dots; edit/creator keep them (TASK-485). Sheet/creator edit Value column: `min-w-[7rem]` + compact `ValueStepper` so `+` is not clipped in the narrow desktop Skills panel (TASK-543). Guided L1: `GuidedSkillsPanel` (Ability chip + Skill Bonus formula tip — TASK-548); Guided L2 browse: `skills-step` + `GuidedLayerNav` → `AddSkillModal` (below recommended cards, not on the list) |
| Ability score grid | `AbilityScoreGrid` (`ability-score-grid.tsx`): display/edit tiles; `powerAbility` / `martialAbility` / `secondaryAbility` pills; `resolveDistinctSecondaryAbility`; mobile display uses `shortName` below `sm`; path pills: **Primary** / **Secondary** (guided UX for archetype vs recommended secondary); hybrids keep **Power** / **Martial** (both Archetype Abilities); full aria-label + tile top padding (TASK-452, TASK-455, TASK-544, TASK-545); roomier edit grid; ability names use `WordHelpTip` + `getAbilityHelp` (TASK-547) |
| Guided path Primary/Secondary abilities | `resolvePathAbilityLabels` (`lib/guided-creator/path-ability-labels.ts`) — Primary Ability chips for each Archetype Ability (two on powered-martial); Secondary only for distinct recommended; SoT for cards + overview + select (TASK-544/545) |
| Guided step footer | `GuidedStepFooter`: sticky Back/Continue; `completionHint` stacks above actions below `sm`, centered mid-bar on `sm+` (one mount; TASK-453) |
| Tab summary header section | `TabSummarySection`, `SummaryItem`, `SummaryRow` — solid theme fills (`bg-*-light` / `bg-surface-alt`, no gradients); sheet Inventory Currency + Armament Proficiency stack below `sm` (TASK-537) |
| Chip roles (descriptor vs expandable) | `DescriptorChip`, `ExpandableChip` (`@/components/ui`); `GridListChip` + `lib/chip/expandable-chip-props.ts`; `ChipData.kind` + `descriptorChipData()` in `lib/chip/chip-data-helpers.ts`; metadata builders in `lib/chip/list-row-metadata.ts` |
| Stable expand toggle (chips) | `ExpandableChip` + `ChipGroup` (`data-chip-group`); `applyFullRowExpandLayout` (`lib/chip/full-row-expand-layout.ts`) — grow into remaining row width; do not force `w-full` on wrap expand (TASK-445). Header **or** expanded body toggles; Options uses `data-expand-ignore` (TASK-539). |
| Feat tags (normalize + taxonomy) | `lib/codex/feat-tags.ts`, `lib/codex/feat-list.ts`; `sql/feat-tags-unification-phase*.sql` (phase 4 = live normalize chain); `docs/FEAT_TAGS.md` |
| Part/property chips | `PartChipList`, `PartChipComponent` (thin aliases); `PartData` in `lib/chip/part-data.ts`; `partChipsFromDisplay` in `lib/chip/part-chips-from-display.ts` |
| Part/property → PartData (library rows) | `lib/library/part-display.ts` — `computePartTrainingPoints`, `characterPartsToPartData`, `itemPropertiesToPartData` |
| Dedupe saved parts / entity refs | `lib/library/dedupe-saved-parts.ts` — `dedupeSavedParts`, `dedupeEntityRefs` (creators save, sync, calc, sheet chips) |
| Sheet trait assembly (no species/ancestry dupes) | `lib/character/collect-sheet-traits.ts` — `collectSheetTraits` (Feats tab) |
| Entity list sections (powers/techniques/weapons/armor/etc.) | `*ListSection` from `entity-library-sections`; multi-section tabs use `useLibrarySectionCollapse` + `SectionHeader` collapsible (empty closed; + Add expands) |
| Species trait cards | **Deprecated for catalogs** — use `DetailOptionList` + `traitToDetailOption` (deep-dive / species-modal). Selection picks: `GuidedChoiceCard`. `SpeciesTraitCard` / `TraitGroup` remain exported for rare interactive use-tracking UIs only — do not use for new read-only lists. |
| Creature stat block | `CreatureStatBlock` |
| Filters | `ChipSelect`, `TagFilter`, `CheckboxFilter`, `SelectFilter`, `AbilityRequirementFilter` |
| List states | `ListEmptyState`, `LoadingState`, `ErrorDisplay` |
| Search box | `SearchInput` |
| Confirm/delete/login modals | `ConfirmActionModal`, `DeleteConfirmModal`, `LoginPromptModal` |
| Standalone creator page shell (auth/load/save) | `CreatorPageShell` (+ `CreatorLayout`, `CreatorSaveToolbar`, `CollapsibleSection`) from `@/components/creator` |
| Image upload + crop | `ImageUploadModal` |
| Realms Image Library picker | `RealmsImagePicker` — bank browse/select; admin upload-into-bank (`resolveRealmsImagePickerCategories` in `lib/realms-images.ts`) |
| Theme switch / onboarding | `ThemeToggle`, `OnboardingTour` |
| Help tooltips | `InfoTippy` / `WordHelpTip` + `public/tooltip-text.tsx` — see `guide/04-floating-ui-tooltips.md` |

> UI primitives (Modal, Button, Chip, **DescriptorChip**, **ExpandableChip**, PageContainer, PageHeader, TabNavigation, SearchInput, **TableScroll**) live in `@/components/ui`. Modal sizes: `3xl`/`full` for high-complexity editors (admin codex add/edit use `full` + `fullScreenOnMobile`; see DESIGN_SYSTEM).

## Game logic / calculators (`src/lib/`)

| Need | File |
|------|------|
| Health/skill/derived calculations (current source) | `lib/game/calculations.ts` |
| Game constants / formulas | `lib/game/constants.ts`, `lib/game/formulas.ts` |
| Skill allocation | `lib/game/skill-allocation.ts` |
| Equipment equipped rules (single armor, create auto-equip) | `lib/game/equipment-equipped.ts` |
| Sheet header DR / Critical Range vitals | `sheet-header.tsx` (`LargeStatBlock` + enriched armor via prop/context); `getEquippedArmorQuickRef` / `deriveArmorItemCombatStats` in `library-list-helpers.ts` |
| Archetype path / progression | `lib/game/archetype-path.ts` (incl. `pathHasPlayerVisibleLevel1`, `pathHiddenFromPlayerPicker`, `innatePowers`; `PathGuidanceGroup.audience` + `filterFeatGuidanceGroups` / `resolvePathGuidanceAudience` — TASK-514/ADR-0004; shared admin parsers `parseOptionalJsonField` / `parseIdQuantityStrings` / `serializeIdQuantityStrings` / `parseRecommendedAbilities` — TASK-476), `lib/game/archetype-display.ts`, `lib/game/innate-eligibility.ts`, `lib/game/path-validation.ts` (Appendix G innate + Level 1 skills warn-cap — TASK-515), `lib/constants/creator-layer-governance.ts` (`LAYER1_GOVERNANCE.maxPathRecommendedBaseSkills` = 3), `components/character-sheet/path-level-guidance.tsx`, `components/character-sheet/archetype-path-identity.tsx`, `components/character-sheet/edit-archetype-modal.tsx`, `app/(main)/codex/CodexArchetypesTab.tsx`, `app/(main)/admin/codex/AdminArchetypesTab.tsx` (feat guidance groups character vs archetype; L1 skills ≤3 base + warn; armaments weapons/shields vs armor UI — TASK-514–516; no path-recommended species — TASK-517; recommended-ability steppers + loadout — TASK-404; Advanced Path JSON escape hatch for rare fields; selected feats expandable GridListRows + full-width qty rows — TASK-534), creator `skills-step` / `feats-step` apply actions; species L1 = `is_starter` only |
| Crafting / encounter helpers | `lib/game/crafting-utils.ts`, `lib/game/encounter-utils.ts` |
| Power / technique / item / empowered calc | `lib/calculators/*-calc.ts`, `mechanic-builder.ts` |
| Data enrichment (minimal stored → full display) | `lib/data-enrichment.ts` |
| Character sheet Library tab visibility defaults | `lib/character-library-tab-visibility.ts` (`defaultLibraryTabVisibilityForArchetype` → persisted `libraryTabVisibility`; power/martial-only create hides opposite tab) |
| Library columnar mapping & sync | `lib/library-columnar.ts`, `lib/library-sync.ts`, **`lib/library-selectable-builders.ts`** (shared add+load SelectableItem pipeline) |
| Load from library (creators) | `LoadFromLibraryModal` + `useLoadModalLibrary`; species/creature rows: `@/lib/library/creator-load-selectables` |
| Tooltips (defaults + interpolation) | `lib/tooltips/` — **`lib/tooltips/README.md`** (PR #14 onboarding), `legacy-tooltip-key-map.ts` |
| Roles / quotas / limits | `lib/role-policy.ts`, `lib/role-limits.ts`, `lib/role-quota-messages.ts`, `lib/admin.ts` |
| API client / validation / rate limit | `lib/api-client.ts` (`apiFetch`, `apiUpload`, `getErrorMessage`), `lib/api-validation.ts`, `lib/validation/schemas.ts` (auth emails trim+lowercase), `lib/rate-limit.ts` — client error convention: `ARCHITECTURE.md` § Client error handling |
| Auth error copy (login/register/reset/update-email) | `lib/auth-errors.ts` (`getAuthErrorMessage`) — do not map every message containing “email” to invalid address; my-account email change uses `update-email` context |
| Supabase clients (server/client/middleware) | `lib/supabase/*` |
| Generic utils (cn, string, number, object, motion, duration display) | `lib/utils/*` — list column labels: `formatColumnKeyLabel()` in `string.ts`; motion timing: `MOTION_DURATION_SLOW_MS` in `motion.ts`; duration layers in `duration.ts`: structured `formatDurationFromTypeAndValue` / `formatDurationWithModifiers`, any-shape `formatDurationDisplay`, compact list `formatDurationCompact` (TASK-477) |
| Stable empty fallbacks for hook deps | `lib/empty.ts` (`EMPTY_STRING_ARRAY`, `EMPTY_NUMBER_RECORD`, `EMPTY_GUIDANCE_GROUPS`) — never mutate |

## Services (`src/services/`, import from `@/services`)

| Need | Service |
|------|---------|
| Character persistence | `character-service` |
| Library entity types (official + user) | `src/types/library.ts` (`LibraryPower`, `LibraryTechnique`, `LibraryItem`, …); hooks re-export |
| Official / user enhanced items | `src/types/crafting.ts` (`OfficialEnhancedItem`, `OfficialEnhancedItemPayload`, `CreateOfficialEnhancedItemInput`); `useEnhancedItems` |
| Library fetch/save (official + user) | `library-service` (use `fetchOfficialLibrary`, not removed `fetch*Public*` aliases) |

## Stores (`src/stores/`)

Zustand stores live in `src/stores/`. Check there before adding client-side global state (auth state is via `useAuthStore`).
