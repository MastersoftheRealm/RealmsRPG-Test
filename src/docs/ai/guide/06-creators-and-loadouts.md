> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Creators, Load Logic & Allocation

## Character Creator — two models (DECIDED 2026-06-30)

See **`REALMS_PRODUCT_OVERVIEW.md` §5.0** for product intent. Two creators coexist; do not merge stores or routes.

| Creator | Route | Store | Steps |
|---------|-------|-------|-------|
| **Simple (Guided)** | `/characters/new/guided` | `guided-creator-store.ts` | 6 chapters, 10 sub-steps — `src/components/guided-creator/steps/` |
| **Advanced (Classic)** | `/characters/new/advanced` | `character-creator-store.ts` | 9 steps — `src/components/character-creator/steps/` |
| **Entry chooser** | `/characters/new` | — | Simple vs Advanced cards; home CTAs land here |

**Guided shell:** `GuidedCreatorShell` — chapter rail, `CharacterPreviewPanel`, `GuidedStepFooter`, landing-cohesive `CreatorFunnelHero`. Path data via `useGuidedPathData`. Save via `buildGuidedCharacterPayload` → `cleanForSave` → `createCharacter` (same lean schema as custom finalize). Payload builds required `proficiencies` from official library parts/properties via `buildRequiredProficiencies` before lean strip — custom `getCharacter` parity. Both save paths set `libraryTabVisibility` via `defaultLibraryTabVisibilityForArchetype` (power/martial-only hides the opposite sheet Library tab; eye toggle can unhide). Guest save uses shared `LoginPromptModal` (same as Advanced). `?returnTo=` forwarded by chooser and honored on finish (`sanitizeRedirectPath`); skips play-together when set. **Ancestry:** `selectedTraits` = ancestry picks only — species traits stay on the species codex and are assembled on the sheet via `collectSheetTraits` (TASK-546). Power/technique/feat id lists are deduped on save.

**Save → sheet handoff (TASK-489):** Do **not** call `resetCreator()` before create succeeds or before navigation is scheduled. Use `navigateThenResetCreator` from `@/lib/creator-save-handoff` (guided `reveal-step`, advanced `finalize-step`). Keep Finish/Create disabled after success (including while the play-together modal is open) so a second create cannot fire. On failure, leave the draft and step intact.

**User-facing copy:** Edit static prose in `src/lib/constants/copy/guided-creator-copy.ts` (chooser labels, step titles/descriptions, chapter rail, modals). Codex names (paths, species, feats) still come from the database.

**Guided DB fields** (see `SUPABASE_SCHEMA.md`): `codex_species.is_starter`, `codex_archetypes.level1_recommended_abilities`, `level1_loadouts` (metadata: `armorStep` / `sharedEquipment` only — no kits). Seed: `sql/guided-creator-schema-seed.sql` (applied as migration `guided_creator_schema_seed`; kit payload later cleared TASK-442).

**Advanced step order** (`STEP_ORDER` in `character-creator-store.ts`):

1. Archetype → 2. Species → 3. Ancestry → 4. Abilities → 5. Skills → 6. Feats → 7. Equipment → 8. Powers → 9. Finalize

Steps live in `src/components/character-creator/steps/` (e.g., `archetype-step.tsx`, `species-step.tsx`). Matches BUILD_VALIDATION DEV-V-001.

## Creator load logic (avoid duplication)

**CREATOR_LOAD_RULES** — Single reference for "mechanic vs list" when loading saved content into creators. See table below for per-type helpers.

When loading a saved item/power/technique into a creator, follow this **three-step pattern** so mechanic-driven UI and the user-selectable list stay in sync:

1. **Reset state** — Clear all creator state (or call the creator's reset handler).
2. **Restore dedicated UI fields** — Load mechanic-driven fields from saved data (e.g. damage, DR, range, duration, actionType, **attackMode**) into their dedicated state. Do **not** put these into the parts/properties list. (Legacy rows may still carry `weapon` / `weaponName`; derive mode via `lib/attack-mode.ts` — do not restore a weapon picker.)
3. **Restore the list from filtered saved data** — Build the user-selectable parts/properties list from saved data **filtered to non-mechanic entries only**. Mechanic-only entries must not appear in the list or they show twice.

**Reusable helpers (single source of truth):**

| Creator | Helper / rule | Location |
|---------|----------------|----------|
| Item/armament | `filterSavedItemPropertiesForList(savedProperties, propertiesDb)` | `@/lib/calculators` — returns only non-mechanic properties for the list. Load damage, DR, range, etc. from item.damage, item.damageReduction, etc. |
| Power | Exclude `EXCLUDED_PARTS`; add to main list only when `!matchedPart.mechanic` | `handleLoadPower` in `use-power-creator-workspace`; mechanic parts go to advanced or are skipped. |
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
- **Domain logic** (cost math, `handleLoad*`, draft cache) lives in each creator’s **workspace hook** where extracted (TASK-381): `use-power-creator-workspace`, `use-item-creator-workspace`, `use-creature-creator-workspace`. **Section islands** (presentational only): power → `power-creator-editor.tsx`; item → `item-creator-editor.tsx` + helpers; creature → `creature-creator-editor.tsx`; technique → `technique-creator-editor.tsx`; empowered → `empowered-technique-creator-editor.tsx`. Page wires `CreatorPageShell` + modals + editor. **Admin Archetypes** (same pattern, not CreatorPageShell): `use-admin-archetype-workspace` + `admin-archetype-editor` + `admin-archetype-path-form` / `admin-archetype-path-rows`; thin `AdminArchetypesTab` shell.
- **Character sheet actions** (TASK-381 Phase 2): facade `useCharacterSheetActions` composes domain hooks — auto-proficiencies, library, resources/recovery/level-up, feats/traits/state, skills/identity; equipment id/name/index match via `sheet-item-match.ts`. Public return shape stays stable for `characters/[id]/page.tsx`.

## Allocation UI consistency

Ability, defense, skill, and health/energy allocation should use shared components everywhere:

- **Ability / defense editing:** `AbilityScoreEditor` (creators, character sheet) or `AbilitiesSection` (sheet) — both use `PointStatus`, `DecrementButton`, `IncrementButton` from `@/components/shared`.
- **Skill point allocation:** `SkillsAllocationPage` (character/creature creator) or skills section with `PointStatus` (character sheet).
- **Health/Energy pool:** `HealthEnergyAllocator` (creators, character sheet) with `ValueStepper` (ADR-0002 neutral button chrome; `colorVariant` colors the value only); use `enableHoldRepeat` only for pool allocation, not for ability/defense steppers.
- **Powered-martial proficiency:** `PoweredMartialSlider` from `@/components/shared` in creature creator and character sheet (ArchetypeSection) when both power and martial proficiency are present.

Use design tokens for colors; avoid raw `blue-*` / `green-*` outside auth.
