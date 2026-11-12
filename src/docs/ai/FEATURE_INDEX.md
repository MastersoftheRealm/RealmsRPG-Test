# Feature Index — files that exist

**Status: PATCH.** The previous text described how features behave. That prose was not re-read against the functions it named, so it was removed. This file is a map of files. It is not a description of game rules or of what a screen does, except for the few import and redirect lines cited below.

Checked on this pass:

- Every `page`, `layout`, `route`, `loading`, `error`, `not-found`, `robots`, `sitemap`, and `opengraph-image` file under `src/app`, plus `src/proxy.ts`, `src/instrumentation.ts`, and `src/instrumentation-client.ts`.
- Every `index.ts` / `index.tsx` under `src`.
- Sibling source files that these barrels do **not** re-export: `src/lib/game/index.ts`, `src/lib/calculators/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`, `src/stores/index.ts`, `src/components/ui/index.ts`.
- Same-name modules and the two help widgets, by opening those files.
- A static import walk from those app entries. A file loaded only by a variable `import()` would not show up. `knip` was not run, so unused exports inside a file that is imported were not measured.

Not checked, so silence here is not "it does not exist" and not "there is no fork":

- Behavior of calculators, saves, sheets, creators, or admin editors.
- Whether two differently named files inside `src/components/patterns`, `src/components/character-sheet`, `src/components/guided-creator`, or `src/app/(main)` do the same job.
- Which files under `src/components/patterns/` are omitted by `src/components/patterns/index.ts` (that barrel exports from subfolders; the sibling check above does not cover it). Export **names** for patterns, ui, hooks, and services are in [`FEATURE_INDEX_BARRELS.generated.md`](FEATURE_INDEX_BARRELS.generated.md). That generated file is not a list of what is used, and it does not read the other barrels.
- Loose modules under `src/lib/` outside `game/` and `calculators/`.

`scripts/validate-feature-index.js` checks that backticked `src/...` paths in this file exist. The same script fails if an app entry, a `src` barrel, or a sibling missing from the six barrels above is absent from this file.

---

## Routes with no page file

`next.config.ts` `redirects()`:

| From | To |
|------|----|
| `/browse` | `/library` |
| `/signup` | `/register` |
| `/encounter-tracker` | `/encounters` |
| `/crafting/new` | `/crafting` |
| `/characters/new/advanced` | `/characters/new` |

`src/lib/security/next-app-flags.ts` exports `ACCOUNT_PATH_ALIAS_REWRITE`: `/account` rewrites to `/my-account`. `next.config.ts` applies that rewrite. The same file exports `NEXT_APP_POWERED_BY_HEADER`. `next.config.ts` also imports `src/lib/security/content-security-policy.ts`. Those two security modules are not imported by a page.

There is no `page.tsx` at the app root. Home is `src/app/(main)/page.tsx`, which imports `@/components/landing`.

`src/app/(main)/encounters/[id]/page.tsx` does not render a play view. After `useEncounter` returns, it calls `router.replace` with `` `/encounters/${id}/${encounter.type}` ``. Play pages that exist as files are combat, skill, and mixed (listed below). This file does not check that `encounter.type` is one of those three.

---

## App entries

Each path is a file. Group headings are only the URL prefix.

### Auth

- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/auth/confirm/route.ts`

Login, register, and forgot-password import `@/app/(auth)/auth-actions`. Register also imports `@/app/(auth)/actions`. Those are two server-action modules. See [Same filename](#same-filename-different-module).

### Home, account, legal, rules, resources

- `src/app/(main)/layout.tsx`
- `src/app/(main)/page.tsx`
- `src/app/(main)/loading.tsx`
- `src/app/(main)/error.tsx`
- `src/app/(main)/my-account/layout.tsx`
- `src/app/(main)/my-account/page.tsx`
- `src/app/(main)/about/layout.tsx`
- `src/app/(main)/about/page.tsx`
- `src/app/(main)/privacy/page.tsx`
- `src/app/(main)/terms/page.tsx`
- `src/app/(main)/resources/layout.tsx`
- `src/app/(main)/resources/page.tsx`
- `src/app/(main)/rules/layout.tsx`
- `src/app/(main)/rules/page.tsx`
- `src/app/(main)/rules/[slug]/page.tsx`

Privacy and terms import `@/components/legal/legal-document-body` and `@/lib/constants/site-copy`. Rules pages import `@/components/rules/rulebook-shell`, `@/components/rules/rulebook-article`, `@/components/rules/rulebook-pager`, `@/lib/rules/rulebook`, and `@/content/rules`.

### Characters

- `src/app/(main)/characters/layout.tsx`
- `src/app/(main)/characters/page.tsx` — imports `@/components/character` (the card barrel, not the sheet barrel).
- `src/app/(main)/characters/new/page.tsx`
- `src/app/(main)/characters/new/guided/page.tsx` — imports `@/components/guided-creator` and `@/stores/guided-creator-store`.
- `src/app/(detail)/characters/[id]/layout.tsx`
- `src/app/(detail)/characters/[id]/page.tsx` — imports `./character-sheet-route`.
- `src/app/(detail)/characters/[id]/character-sheet-route.tsx` — imports `@/components/character-sheet` and `./use-character-sheet-page`.
- `src/app/(detail)/characters/[id]/use-character-sheet-page.ts` — imports `./use-character-sheet-page-data` and `./use-character-sheet-page-ui`.
- `src/app/(detail)/characters/[id]/use-character-sheet-page-data.ts`
- `src/app/(detail)/characters/[id]/use-character-sheet-page-ui.ts`

The sheet route also imports `@/components/onboarding` and `@/components/rolls`.

### Campaigns and tabletop

- `src/app/(main)/campaigns/layout.tsx`
- `src/app/(main)/campaigns/page.tsx`
- `src/app/(detail)/campaigns/[id]/layout.tsx`
- `src/app/(detail)/campaigns/[id]/page.tsx` — imports `./campaign-detail-route`.
- `src/app/(detail)/campaigns/[id]/campaign-detail-route.tsx` — imports `./_components/use-campaign-detail-page`.
- `src/app/(detail)/campaigns/[id]/_components/use-campaign-detail-page.ts`
- `src/app/(detail)/campaigns/[id]/view/[userId]/[characterId]/page.tsx` — imports `@/components/character-sheet` and `@/components/character-sheet/read-only-sheet`.
- `src/app/(main)/campaigns/[id]/tabletop/page.tsx` — imports `@/components/tabletop/tabletop-canvas` and `@/components/tabletop/add-monster-token-modal`.

### Library, codex, creators, crafting, encounters

- `src/app/(main)/library/layout.tsx`
- `src/app/(main)/library/page.tsx` — imports `./LibraryPowersTab`, `./LibraryTechniquesTab`, `./LibraryItemsTab`, `./LibraryCreaturesTab`, `./LibraryEnhancedTab`, `./LibraryPublicContent`, `./library-guest-notice`.
- `src/app/(main)/library/LibraryPowersTab.tsx`
- `src/app/(main)/library/LibraryTechniquesTab.tsx`
- `src/app/(main)/library/LibraryItemsTab.tsx`
- `src/app/(main)/library/LibraryCreaturesTab.tsx`
- `src/app/(main)/library/LibraryEnhancedTab.tsx`
- `src/app/(main)/library/LibraryPublicContent.tsx`
- `src/app/(main)/library/library-guest-notice.tsx`
- `src/app/(main)/codex/layout.tsx`
- `src/app/(main)/codex/page.tsx` — imports `./CodexFeatsTab`, `./CodexSkillsTab`, `./CodexSpeciesTab`, `./CodexEquipmentTab`, `./CodexPropertiesTab`, `./CodexPartsTab`, `./CodexTraitsTab`, `./CodexCreatureFeatsTab`, `./CodexArchetypesTab`.
- `src/app/(main)/codex/CodexFeatsTab.tsx`
- `src/app/(main)/codex/CodexSkillsTab.tsx`
- `src/app/(main)/codex/CodexSpeciesTab.tsx`
- `src/app/(main)/codex/CodexEquipmentTab.tsx`
- `src/app/(main)/codex/CodexPropertiesTab.tsx`
- `src/app/(main)/codex/CodexPartsTab.tsx`
- `src/app/(main)/codex/CodexTraitsTab.tsx`
- `src/app/(main)/codex/CodexCreatureFeatsTab.tsx`
- `src/app/(main)/codex/CodexArchetypesTab.tsx`
- `src/app/(main)/codex/CodexMyCodexEmpty.tsx` — imported by the feats, skills, parts, properties, traits, creature-feats, and archetypes tabs above. The species and equipment tabs do not import it.
- `src/app/(main)/power-creator/layout.tsx`
- `src/app/(main)/power-creator/page.tsx`
- `src/app/(main)/technique-creator/layout.tsx`
- `src/app/(main)/technique-creator/page.tsx`
- `src/app/(main)/empowered-technique-creator/layout.tsx`
- `src/app/(main)/empowered-technique-creator/page.tsx`
- `src/app/(main)/item-creator/layout.tsx`
- `src/app/(main)/item-creator/page.tsx`
- `src/app/(main)/species-creator/layout.tsx`
- `src/app/(main)/species-creator/page.tsx`
- `src/app/(main)/creature-creator/layout.tsx`
- `src/app/(main)/creature-creator/page.tsx`
- `src/app/(main)/crafting/layout.tsx`
- `src/app/(main)/crafting/page.tsx`
- `src/app/(main)/crafting/[id]/page.tsx`
- `src/app/(main)/encounters/layout.tsx`
- `src/app/(main)/encounters/page.tsx`
- `src/app/(main)/encounters/[id]/page.tsx`
- `src/app/(main)/encounters/[id]/combat/page.tsx`
- `src/app/(main)/encounters/[id]/skill/page.tsx`
- `src/app/(main)/encounters/[id]/mixed/page.tsx`

The power, technique, empowered-technique, item, species, and creature creator pages, and `src/app/(main)/crafting/[id]/page.tsx`, import `@/components/creator`. The crafting hub page does not. The guided character page imports `@/components/guided-creator`, not the creator barrel. Those barrels export different components (`CreatorPageShell` vs `GuidedCreatorShell`).

### Admin

- `src/app/(main)/admin/layout.tsx`
- `src/app/(main)/admin/page.tsx`
- `src/app/(main)/admin/codex/page.tsx` — imports `./AdminFeatsTab`, `./AdminTraitsTab`, `./AdminSpeciesTab`, `./AdminSkillsTab`, `./AdminPartsTab`, `./AdminPropertiesTab`, `./AdminEquipmentTab`, `./AdminArchetypesTab`, `./AdminCreatureFeatsTab`, `./CodexSpreadsheetView`.
- `src/app/(main)/admin/codex/AdminFeatsTab.tsx`
- `src/app/(main)/admin/codex/AdminTraitsTab.tsx`
- `src/app/(main)/admin/codex/AdminSpeciesTab.tsx`
- `src/app/(main)/admin/codex/AdminSkillsTab.tsx`
- `src/app/(main)/admin/codex/AdminPartsTab.tsx`
- `src/app/(main)/admin/codex/AdminPropertiesTab.tsx`
- `src/app/(main)/admin/codex/AdminEquipmentTab.tsx`
- `src/app/(main)/admin/codex/AdminArchetypesTab.tsx`
- `src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx`
- `src/app/(main)/admin/codex/CodexSpreadsheetView.tsx`
- `src/app/(main)/admin/core-rules/page.tsx`
- `src/app/(main)/admin/images/page.tsx`
- `src/app/(main)/admin/public-library/page.tsx` — imports `./AdminPublicPowersTab`, `./AdminPublicTechniquesTab`, `./AdminPublicItemsTab`, `./AdminPublicCreaturesTab`, `./AdminPublicSpeciesTab`, `./AdminPublicEnhancedItemsTab`.
- `src/app/(main)/admin/public-library/AdminPublicPowersTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicTechniquesTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicItemsTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicCreaturesTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicSpeciesTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx`
- `src/app/(main)/admin/roles/page.tsx`
- `src/app/(main)/admin/sources/page.tsx`
- `src/app/(main)/admin/users/page.tsx`
- `src/app/(main)/admin/changelogs/page.tsx`

Admin codex also has edit modals and archetype editor sections next to the tabs. They were not opened one by one on this pass. Start from the tab file the page imports.

### Dev and root shell

- `src/app/dev/styleguide/layout.tsx`
- `src/app/dev/styleguide/page.tsx`
- `src/app/layout.tsx`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`
- `src/app/(detail)/error.tsx`
- `src/app/opengraph-image.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/proxy.ts` — exports `proxy`. It calls `redirectOAuthCodeToCallback` on `/`, `rejectCrossOriginApiMutation` on `/api/`, then `updateSession`.
- `src/instrumentation.ts`
- `src/instrumentation-client.ts`

---

## HTTP handlers

Auth callbacks are also listed with the auth pages.

- `src/app/api/admin/changelogs/route.ts`
- `src/app/api/admin/check/route.ts`
- `src/app/api/admin/role-policies/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/update-role/route.ts`
- `src/app/api/campaigns/route.ts`
- `src/app/api/campaigns/[id]/route.ts`
- `src/app/api/campaigns/[id]/rolls/route.ts`
- `src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts`
- `src/app/api/campaigns/invite/[code]/route.ts`
- `src/app/api/characters/route.ts`
- `src/app/api/characters/[id]/route.ts`
- `src/app/api/codex/route.ts`
- `src/app/api/crafting/route.ts`
- `src/app/api/crafting/[id]/route.ts`
- `src/app/api/encounters/route.ts`
- `src/app/api/encounters/[id]/route.ts`
- `src/app/api/encounters/[id]/tabletop/route.ts`
- `src/app/api/images/route.ts`
- `src/app/api/images/[id]/route.ts`
- `src/app/api/images/[id]/replace/route.ts`
- `src/app/api/images/[id]/usage/route.ts`
- `src/app/api/official/[type]/route.ts`
- `src/app/api/official/counts/route.ts`
- `src/app/api/official/enhanced-items/route.ts`
- `src/app/api/tabletop/actions/[actionId]/route.ts`
- `src/app/api/tabletop/campaigns/[campaignId]/active-scene/route.ts`
- `src/app/api/tabletop/scenes/[sceneId]/route.ts`
- `src/app/api/tabletop/scenes/[sceneId]/actions/route.ts`
- `src/app/api/tabletop/scenes/[sceneId]/tokens/route.ts`
- `src/app/api/upload/portrait/route.ts`
- `src/app/api/upload/profile-picture/route.ts`
- `src/app/api/upload/vtt-map/route.ts`
- `src/app/api/user/enhanced-items/route.ts`
- `src/app/api/user/enhanced-items/[id]/route.ts`
- `src/app/api/user/library/counts/route.ts`
- `src/app/api/user/library/[type]/route.ts`
- `src/app/api/user/library/[type]/[id]/route.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/confirm/route.ts`

---

## Barrels

`scripts/generate-feature-index-barrels.js` reads only these four:

- `src/components/patterns/index.ts`
- `src/components/ui/index.ts`
- `src/hooks/index.ts`
- `src/services/index.ts`

Other barrels (the generator does not list their exports):

- `src/components/auth/index.ts`
- `src/components/character/index.ts` — exports `CharacterCard` and `AddCharacterCard`.
- `src/components/character-sheet/index.ts` — exports the sheet shell (`SheetHeader`, `CharacterSheetBody`, `CharacterSheetProvider`, and the modals named in that file). It does not re-export the tab files inside the folder.
- `src/components/codex/index.ts`
- `src/components/creator/index.ts`
- `src/components/guided-creator/index.ts` — exports `GuidedCreatorShell` only.
- `src/components/guided-creator/steps/index.ts`
- `src/components/landing/index.ts`
- `src/components/layout/index.ts`
- `src/components/onboarding/index.ts`
- `src/components/patterns/filters/index.ts`
- `src/components/patterns/guided-choice/index.ts`
- `src/components/patterns/stat-tiles/index.ts`
- `src/components/providers/index.ts`
- `src/components/rolls/index.ts`
- `src/content/rules/index.ts`
- `src/lib/calculators/index.ts`
- `src/lib/constants/copy/index.ts`
- `src/lib/detail-option/index.ts`
- `src/lib/game/index.ts` — `export *` from `constants`, `formulas`, `calculations`, `creature-level-display`, `creature-inventory`, and `unarmed-prowess` only.
- `src/lib/glr/index.ts`
- `src/lib/observability/index.ts`
- `src/lib/utils/index.ts`
- `src/lib/validation/index.ts`
- `src/stores/index.ts` — exports `useAuthStore` from `./auth-store` only.
- `src/types/index.ts`

`src/services/index.ts` re-exports `./character-service`, `./library-service`, and `./tabletop-service`. No TypeScript file imports `@/services` or this barrel. The generator reads it as text. The service modules are imported by their own paths.

`src/hooks/use-auth.ts` imports `useAuthStore` from `src/stores/auth-store.ts` and re-exports it. `src/hooks/index.ts` re-exports that name again. One store, two import paths (`@/hooks` and `@/stores`).

### Named exports left off a barrel that does import the file

`src/hooks/index.ts` imports `src/hooks/use-characters.ts` but the export list is `useCharacters`, `useCharacter`, `useDeleteCharacter`, `useDuplicateCharacter`, `characterViewerId`, `patchCharacterDetailQuery`, `invalidateCharacterLists`. The same file also exports `useSaveCharacter`, `nextCharacterDetailQueryData`, and `mergeCharacterDetailQueryData`.

`src/hooks/index.ts` imports types from `src/hooks/use-add-library-item-data.ts` and does not export `useAddLibraryItemData`. That file re-exports the function from `src/hooks/add-library-item/use-add-library-item-data.ts`.

`src/hooks/index.ts` exports `UseModalListStateOptions` from `src/hooks/use-modal-list-state.ts` and does not export `useModalListState`.

`src/hooks/index.ts` exports `LibrarySectionCollapseHeaderProps` from `src/hooks/use-library-section-collapse.ts` and does not export `useLibrarySectionCollapse`.

`usePathRecommendationIndex` in `src/hooks/use-path-recommendation-index.ts` is not exported from that file. `usePathListFilter` in the same file is exported, and the hooks barrel re-exports it.

---

## Not re-exported by the six checked barrels

These siblings exist. The folder's `index.ts` does not `export ... from` them. They are still imported somewhere unless noted. Do not add a second copy because the barrel omitted them.

### `src/lib/game`

- `src/lib/game/archetype-display.ts`
- `src/lib/game/archetype-edit.ts`
- `src/lib/game/archetype-path.ts`
- `src/lib/game/character-legality.ts`
- `src/lib/game/crafting-utils.ts`
- `src/lib/game/creator-cache.ts`
- `src/lib/game/creator-constants.ts`
- `src/lib/game/creature-ability-bounds.ts`
- `src/lib/game/creature-power-instances.ts`
- `src/lib/game/dedupe-saved-parts.ts`
- `src/lib/game/encounter-utils.ts`
- `src/lib/game/equipment-equipped.ts`
- `src/lib/game/feat-requirements.ts`
- `src/lib/game/innate-eligibility.ts`
- `src/lib/game/loadout-entries.ts`
- `src/lib/game/mixed-encounter-view-tab.ts`
- `src/lib/game/path-ability-labels.ts`
- `src/lib/game/path-recommendation-index.ts`
- `src/lib/game/path-validation.ts`
- `src/lib/game/resolve-armor-damage-reduction.ts`
- `src/lib/game/saved-part-id.ts`
- `src/lib/game/size-table.ts`
- `src/lib/game/skill-allocation-add.ts`
- `src/lib/game/skill-allocation.ts`
- `src/lib/game/suggested-abilities.ts`
- `src/lib/game/targeted-defenses.ts`
- `src/lib/game/weapon-attack-ability.ts`

### `src/lib/calculators`

- `src/lib/calculators/action-type.ts` — exports `deriveActionType`. This is not `src/lib/utils/action-type.ts`.
- `src/lib/calculators/dice-splits.ts`
- `src/lib/calculators/part-training-points.ts`
- `src/lib/calculators/power-composition.fixture.ts` — imported by tests, not by app pages.

### `src/hooks`

- `src/hooks/use-add-to-character-from-library.tsx`
- `src/hooks/use-auth-captcha.ts`
- `src/hooks/use-browser-offline.ts`
- `src/hooks/use-codex-source-catalog.ts`
- `src/hooks/use-creator-unsaved-guard.ts`
- `src/hooks/use-effective-portrait.ts`
- `src/hooks/use-official-power-technique-browse-filters.ts`
- `src/hooks/use-placeholder-theme.ts`
- `src/hooks/use-portrait-fallback-url.ts`
- `src/hooks/use-sort.ts` — exports `useSort`, `sortByColumn`, and `toggleSort`. Callers include library, codex, and admin tabs, which import this file directly.

### `src/services`

Not on `src/services/index.ts`. Import the file.

- `src/services/campaign-roll-service.ts`
- `src/services/campaign-service.ts`
- `src/services/crafting-service.ts`
- `src/services/encounter-service.ts`
- `src/services/enhanced-items-service.ts`
- `src/services/persist-finished-character.ts`
- `src/services/resource-client.ts`

### `src/stores`

- `src/stores/guided-creator-store.ts` — imported by `src/app/(main)/characters/new/guided/page.tsx`. Not exported from `src/stores/index.ts`.

### `src/components/ui`

- `src/components/ui/chip-options-panel.tsx` — imported by `src/components/ui/expandable-chip.tsx`. Not exported from `src/components/ui/index.ts`. There is no `chip-options-panel` file under `src/lib/chip` (asserted by `src/components/ui/chip-options-panel.lib1-044.test.ts`).

---

## Same filename, different module

| File name | What was opened |
|-----------|-----------------|
| `actions.ts` | Four `'use server'` modules, plus a fifth auth module with a different name: `src/app/(auth)/actions.ts` (profile, email, password, delete account), `src/app/(auth)/auth-actions.ts` (remember-me, password login, sign-up, password reset, resend confirmation), `src/app/(main)/admin/codex/actions.ts`, `src/app/(main)/admin/sources/actions.ts` (imports `updateCodexDoc` from the codex actions), `src/app/(main)/campaigns/actions.ts`. |
| `action-type.ts` | `src/lib/calculators/action-type.ts` exports `deriveActionType`. `src/lib/utils/action-type.ts` exports `formatActionTypeForDisplay` and `formatSavedActionTypeForDisplay`. |
| `path-ability-labels.ts` | `src/lib/guided-creator/path-ability-labels.ts` imports `resolvePathAbilityLabels` from `src/lib/game/path-ability-labels.ts` and exports `buildPathAbilityChipLabels`. |
| `server.ts` | `src/lib/tabletop/server.ts` imports `createServiceRoleClient` from `src/lib/supabase/server.ts`. |
| `skills.ts` | `src/lib/constants/skills.ts` exports ability abbreviation constants. `src/types/skills.ts` exports skill row types. |
| `use-add-library-item-data.ts` | `src/hooks/use-add-library-item-data.ts` re-exports `src/hooks/add-library-item/use-add-library-item-data.ts`. One implementation. |

`src/components/character/index.ts` and `src/components/character-sheet/index.ts` are different barrels (list cards vs sheet shell).

---

## Two help widgets

`src/components/patterns/help/info-tippy.tsx` exports `InfoTippy`. Product pages import it (codex feats, creature creator, campaigns list, and others).

`src/components/ui/tooltip.tsx` exports `Tooltip`. The file's own comment says it is the styleguide tooltip. The only JSX use found is `src/app/dev/styleguide/page.tsx`. The ui barrel still exports it.

Both call `useFloatingHelpPopover` / `FloatingHelpPanel` from `src/lib/tooltips/floating-help.tsx`.

`HelpTooltip` and `ContextHelpTooltip` are named in a comment in `info-tippy.tsx`. No function with either name is defined under `src`.

---

## Imported by tests or by `next.config.ts`, not by a page

Not dead. Not part of a screen. The static walk from app entries did not reach these, or reached them only through tests. No other `src` source file was in that leftover set.

- `src/services/index.ts` — no TypeScript importer. `scripts/generate-feature-index-barrels.js` reads the file as text.
- `src/lib/api-input-validation-guard.ts` — imported by `src/lib/api-input-validation-scan.ts`.
- `src/lib/api-input-validation-scan.ts` — imported by its tests.
- `src/lib/api-mutation-guard-route-scan.ts` — imported by route-scan tests. `src/proxy.ts` imports `src/lib/api-mutation-guard.ts`, not this scan file.
- `src/lib/codex/fake-supabase.ts` — imported by action tests.
- `src/lib/glr/glr-chrome-spacing-norms.ts`
- `src/lib/glr/validate-glr-chrome-spacing.ts` — imported by `src/lib/glr/validate-glr-chrome-spacing.test.ts`.
- `src/lib/calculators/power-composition.fixture.ts` — test fixture.
- `src/lib/security/content-security-policy.ts` and `src/lib/security/next-app-flags.ts` — imported by `next.config.ts`.

`src/types/css.d.ts`, `src/types/mdx.d.ts`, and `src/types/source-raw.d.ts` are ambient declarations.

---

## Left for a later pass

Open these before treating this index as a complete "do not build another one" list:

- `src/components/patterns/` (subfolders `chrome`, `list`, `select`, `filters`, `help`, `guided-choice`, `stat-tiles`). The generated barrel file lists export names. It was not checked against every file in those folders.
- `src/components/character-sheet/`, `src/components/guided-creator/`, and the creator page folders under `src/app/(main)/`.
- Modules directly under `src/lib/` that are not in `game/` or `calculators/` (codex, character, library, guided-creator, auth, and the rest).
- Unused exports inside files that something already imports.
