# Feature Index — "Does this already exist?"

**Purpose:** The anti-re-implementation guardrail. Before building a new component, hook, service, route, or util, scan this index first. Most accidental duplication in this repo came from agents not knowing a feature already existed.

**How to use:** Find your topic below → open the listed file/barrel → extend it (add a prop/variant) rather than forking a parallel copy. If you add a new top-level feature/hook/shared component, add a line here.

> This is a map, not the source of truth for behavior. For schema use `SUPABASE_SCHEMA.md`, for formulas `GAME_RULES.md`, for data flow `ARCHITECTURE.md`.

---

## Pages / features (`src/app/(main)/*`)

| Feature | Route / page |
|---------|--------------|
| Character list / dashboard | `characters/page.tsx` |
| Character sheet (view + edit) | `characters/[id]/page.tsx` — layout `CharacterSheetBody` (single library mount); derived `useCharacterSheetDerived`; handlers `useCharacterSheetActions`; library lists via `entity-library-sections` + `library-entity-rows`; feats tab via `FeatsTraitsListSection` + `library-feat-rows` (player feat/trait `customName` + `note` on save; trait map `traitCustomizations`) |
| Character creator | `character-creator/` (wizard steps under `components/character-creator/steps/`) |
| Library (user + official content browse) | `library/page.tsx` |
| Codex (rules data browser) | `codex/page.tsx` |
| Realms Library, guest read-only | `library/page.tsx` + `library/LibraryPublicContent.tsx` — guests see official "Realms" content with the My-Library toggle + "Add to library" hidden. (Former `/browse` was a redundant duplicate; removed and redirected to `/library` — TASK-336.) |
| Power creator | `power-creator/page.tsx` |
| Technique creator | `technique-creator/page.tsx` |
| Empowered technique creator | `empowered-technique-creator/page.tsx` |
| Item creator | `item-creator/page.tsx` |
| Species creator | `species-creator/page.tsx` |
| Creature creator | `creature-creator/page.tsx`, `creature-skill-utils.ts` (skills ↔ allocations, load mapping) |
| Crafting (sessions + enhanced items) | `crafting/page.tsx`, `crafting/[id]/page.tsx` |
| Encounters | `encounters/page.tsx`, `encounters/[id]/page.tsx`, `encounters/[id]/combat/page.tsx`, `encounters/[id]/mixed/page.tsx`, `encounters/[id]/skill/page.tsx` |
| Campaigns | `campaigns/page.tsx` |
| Admin (official content, users, tooltips) | `admin/page.tsx` |
| Account / profile | `my-account/page.tsx` |
| Rules / resources / about / privacy / terms | `rules`, `resources`, `about`, `privacy`, `terms` |

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
| Save a creator's output | `useCreatorSave`; load into a modal: `useLoadModalLibrary` |
| Autosave (debounced) | `useAutoSave` |
| List sorting / modal list state | `useSort`, `sortByColumn`, `useModalListState` |
| Tooltips (canonical) | `public/tooltip-text.tsx` + `@tippyjs/react` — see `AGENT_GUIDE.md` § Tooltips |
| Tooltips (legacy — do not extend) | `useTooltips`, `useTooltipByKey`, `ContextHelpTooltip` — **TASK-376 (Collin only; AI skip)** |

> There is **one** codex fetch shared by all `useCodex*` and `useGameRules` (see `use-codex.ts`). Do not add a parallel codex fetch.

## Shared UI components (`src/components/shared/`, import from `@/components/shared`)

| Need | Component |
|------|-----------|
| Expandable list row (Library/Codex/sheet/creator) | `GridListRow` |
| Hub list row (Encounters/Crafting) | `HubListRow` |
| Sortable column headers | `ListHeader` |
| Selection modal (add/pick from library) | `UnifiedSelectionModal` |
| + → ✓ selection button | `SelectionToggle`; equipped toggle: `EquipToggle`; innate: `InnateToggle` |
| Source scope All / Realms / My Library | `SourceFilter` (on `SegmentedControl`) |
| 2–N pill toggle | `SegmentedControl` |
| Section header with + | `SectionHeader`; cost badge: `SectionCostBadge` |
| Dice roll button | `RollButton` |
| +/- steppers | `ValueStepper`, `DecrementButton`, `IncrementButton`; quantities: `QuantitySelector`, `QuantityBadge` |
| Point allocation display | `PointStatus`; powered/martial split: `PoweredMartialSlider` |
| Skill row / allocation | `SkillRow`, `SkillsAllocationPage`, `AddSkillModal`, `AddSubSkillModal` |
| Tab summary header section | `TabSummarySection`, `SummaryItem`, `SummaryRow` |
| Part/property chips | `PartChipComponent`, `PartChipList`, `PropertyChipList` |
| Part/property → PartData (library rows) | `lib/library/part-display.ts` — `computePartTrainingPoints`, `characterPartsToPartData`, `itemPropertiesToPartData` |
| Entity list sections (powers/techniques/weapons/armor/etc.) | `*ListSection` from `entity-library-sections` |
| Species trait cards | `SpeciesTraitCard`, `TraitGroup` |
| Creature stat block | `CreatureStatBlock` |
| Filters | `ChipSelect`, `TagFilter`, `CheckboxFilter`, `SelectFilter`, `AbilityRequirementFilter` |
| List states | `ListEmptyState`, `LoadingState`, `ErrorDisplay` |
| Search box | `SearchInput` |
| Confirm/delete/login modals | `ConfirmActionModal`, `DeleteConfirmModal`, `LoginPromptModal` |
| Image upload + crop | `ImageUploadModal` |
| Theme switch / onboarding | `ThemeToggle`, `OnboardingTour` |
| Help tooltips (legacy — Collin/TASK-376) | `ContextHelpTooltip` — **AI agents do not migrate**; Collin owns TASK-376 |

> UI primitives (Modal, Button, Chip, PageContainer, PageHeader, TabNavigation, SearchInput) live in `@/components/ui`.

## Game logic / calculators (`src/lib/`)

| Need | File |
|------|------|
| Health/skill/derived calculations (current source) | `lib/game/calculations.ts` |
| Game constants / formulas | `lib/game/constants.ts`, `lib/game/formulas.ts` |
| Skill allocation | `lib/game/skill-allocation.ts` |
| Archetype path / progression | `lib/game/archetype-path.ts` (incl. `pathHasPlayerVisibleLevel1`, `pathHiddenFromPlayerPicker`), `lib/game/archetype-display.ts`, `components/character-sheet/path-level-guidance.tsx`, `components/character-sheet/archetype-path-identity.tsx`, `components/character-sheet/edit-archetype-modal.tsx`, `app/(main)/codex/CodexArchetypesTab.tsx`, creator `skills-step` / `feats-step` apply actions |
| Crafting / encounter helpers | `lib/game/crafting-utils.ts`, `lib/game/encounter-utils.ts` |
| Power / technique / item / empowered calc | `lib/calculators/*-calc.ts`, `mechanic-builder.ts` |
| Data enrichment (minimal stored → full display) | `lib/data-enrichment.ts` |
| Library columnar mapping & sync | `lib/library-columnar.ts`, `lib/library-sync.ts`, `lib/library-selectable-builders.ts` |
| Tooltips (defaults + interpolation) | `lib/tooltips/` |
| Roles / quotas / limits | `lib/role-policy.ts`, `lib/role-limits.ts`, `lib/role-quota-messages.ts`, `lib/admin.ts` |
| API client / validation / rate limit | `lib/api-client.ts`, `lib/api-validation.ts`, `lib/validation/schemas.ts`, `lib/rate-limit.ts` |
| Supabase clients (server/client/middleware) | `lib/supabase/*` |
| Generic utils (cn, string, number, object, duration, array→ removed) | `lib/utils/*` |

## Services (`src/services/`, import from `@/services`)

| Need | Service |
|------|---------|
| Character persistence | `character-service` |
| Library fetch/save (official + user) | `library-service` (use `fetchOfficialLibrary`, not removed `fetch*Public*` aliases) |

## Stores (`src/stores/`)

Zustand stores live in `src/stores/`. Check there before adding client-side global state (auth state is via `useAuthStore`).
