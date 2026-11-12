# Feature Index — files that exist

**Status: PATCH.** The previous text described how features behave. That prose was not re-read against the functions it named, so it was removed. This file is a map of files. It is not a description of game rules or of what a screen does, except for the few import and redirect lines cited below.

Checked on this pass:

- Every `page`, `layout`, `route`, `loading`, `error`, `not-found`, `robots`, `sitemap`, and `opengraph-image` file under `src/app`, plus `src/proxy.ts`, `src/instrumentation.ts`, and `src/instrumentation-client.ts`.
- Every `index.ts` / `index.tsx` under `src`.
- Sibling source files that these barrels do **not** re-export: `src/lib/game/index.ts`, `src/lib/calculators/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`, `src/stores/index.ts`, `src/components/ui/index.ts`.
- Same-name modules and the two help widgets, by opening those files.
- Every non-test `.ts` / `.tsx` file under `src/components/patterns`, `src/components/character-sheet`, and `src/components/guided-creator`: static imports, plus the pairs named in that section, which were opened. The other files in those folders were not read line by line.
- Every non-test `.ts` / `.tsx` file under `src/components/creator`, `src/components/crafting`, `src/components/encounters`, and the creator and crafting page folders named in that section. The pairs in that section were opened. The files listed there as not read line by line were not.
- A static import walk from app entries. A file loaded only by a variable `import()` would not show up. `knip` was not run, so unused exports inside a file that is imported were not measured.

Not checked, so silence here is not "it does not exist" and not "there is no fork":

- Behavior of calculators, saves, or admin editors.
- Encounter play, campaign, admin codex, and my-account folders under `src/app` beyond the page file each route imports.
- `src/components/about`, `auth`, `character`, `codex`, `landing`, `layout`, `legal`, `onboarding`, `providers`, `rolls`, `rules`, and `tabletop`.
- Loose modules under `src/lib/` outside `game/` and `calculators/`.
- Pairs of files that are not named in a fork section below.

Export **names** for patterns, ui, hooks, and services are in [`FEATURE_INDEX_BARRELS.generated.md`](FEATURE_INDEX_BARRELS.generated.md). That generated file is not a list of what is used, and it does not read the other barrels.

`scripts/validate-feature-index.js` checks that backticked `src/...` paths in this file exist. The same script fails if an app entry, a `src` barrel, a sibling missing from the six barrels above, or a non-test source file in the covered component and creator folders is absent from this file.

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

## Patterns, character sheet, guided creator

Static imports were resolved for every non-test `.ts` / `.tsx` file in these three folders. Each of those files has at least one production importer. None are unused files. An export inside a used file can still be unused; that was not measured.

### Two implementations, not one component

- Ability tiles. `src/components/character-sheet/abilities-section.tsx` renders `src/components/character-sheet/ability-stat-tile.tsx`. `src/components/patterns/list/ability-score-grid.tsx` does not render `AbilityStatTile`. Callers that render `AbilityScoreGrid`: `src/components/guided-creator/guided-path-detail-overview.tsx`, `src/components/guided-creator/guided-reveal-summary.tsx`, `src/components/guided-creator/steps/abilities-step.tsx`, and the `variant="sheet"` branch of `src/components/creator/ability-score-editor.tsx`. `src/components/guided-creator/guided-abilities-customize-panel.tsx` passes that variant. The default branch of `AbilityScoreEditor` is a third tile grid; see the creator section. `AbilityScoreGrid` keeps its own `ABILITY_DISPLAY_ORDER` and `ABILITY_DISPLAY_INFO`. `src/components/patterns/stat-tiles/ability-defense-stat-model.ts` keeps `ABILITY_ORDER` and `ABILITY_INFO`. The six keys are the same and in the same order. The grid's class string is written out in the grid file. The sheet section uses `SHEET_STAT_GRID_CLASS` from the stat model. Those class strings are not the same constant.
- Skill rows. `src/components/character-sheet/skills-section.tsx` renders `SkillRow` from `src/components/patterns/list/skill-row.tsx`. `src/components/guided-creator/guided-skills-panel.tsx` defines `GuidedSkillRow` in that file and does not render `SkillRow`.
- Armor display. `src/components/character-sheet/archetype-section.tsx` renders `QuickArmorTable` from `src/components/patterns/list/quick-armaments-sections.tsx` (an HTML table). `src/components/character-sheet/library-inventory-panel.tsx` renders `ArmorListSection` from `src/components/patterns/list/entity-library-inventory.tsx`. Neither file imports the other.
- `CodexPart` and `CodexProperty` are each declared twice. `src/components/patterns/list/creature-stat-block-helpers.ts` declares both with optional `name`. That `CodexPart` has no `defense` field. `src/components/character-sheet/library-list-helpers.ts` aliases both names to `CodexPartRow` and `CodexPropertyRow` from `src/lib/library/part-display.ts`. Those rows require `name`. `CodexPartRow` also has `defense`.

### Calls the shared component

These were opened. They are wrappers, not a second copy of the shared component.

- `src/components/guided-creator/guided-detail-option-list.tsx` and `src/components/guided-creator/guided-trait-option-list.tsx` render `DetailOptionList` from `src/components/patterns/list/detail-option-list.tsx`.
- `src/components/guided-creator/guided-portrait-upload.tsx` renders `CreatorPortraitUpload` from `src/components/patterns/chrome/creator-portrait-upload.tsx`.
- `src/components/guided-creator/guided-health-energy-section.tsx` and `src/components/character-sheet/sheet-header-resources.tsx` render `HealthEnergyAllocator` from `@/components/creator`.
- `src/components/guided-creator/guided-path-detail-modal.tsx` and `src/components/guided-creator/guided-species-detail-modal.tsx` render `GuidedEntityDetailModal` from `src/components/guided-creator/guided-entity-detail-modal.tsx`.
- `src/components/guided-creator/guided-equipment-fact-chips.tsx` renders `DescriptorChipWithTip`.
- `src/components/character-sheet/add-feat-modal.tsx`, `src/components/character-sheet/add-library-item-modal.tsx`, `src/components/character-sheet/add-proficiency-modal.tsx`, `src/components/guided-creator/guided-feats-l2-modal.tsx`, `src/components/guided-creator/guided-equipment-l2-modal.tsx`, and `src/components/guided-creator/guided-powers-techniques-l2-modal.tsx` render `UnifiedSelectionModal`. Feat steps import the guided feats modal, not the sheet add-feat modal.
- `src/components/guided-creator/steps/skills-step.tsx` renders `AddSkillModal`. `src/components/guided-creator/steps/species-step.tsx` and `src/components/guided-creator/steps/ancestry-step.tsx` render `MixedSpeciesModal`. `src/components/character-sheet/edit-species-modal.tsx` also renders `MixedSpeciesModal`.
- `src/components/patterns/list/official-power-list.tsx`, `src/components/patterns/list/official-technique-list.tsx`, `src/components/patterns/list/official-item-list.tsx`, `src/components/patterns/list/official-creature-list.tsx`, and `src/components/patterns/list/official-enhanced-list.tsx` render `OfficialEntityList`.
- `src/components/patterns/list/entity-library-sections.tsx` re-exports the section components from `entity-library-inventory.tsx`, `entity-library-powers-techniques.tsx`, `entity-library-feats.tsx`, and `entity-library-sections-columns.ts`. One implementation each.
- `src/components/patterns/list/grid-list-row.tsx` renders `GridListRowCollapsed` and `GridListRowExpandedBody`.
- `src/components/character-sheet/sheet-header.tsx` renders `SheetHeaderIdentity`, `SheetHeaderResources`, and `LargeStatBlock`.
- `src/components/guided-creator/guided-creator-shell.tsx` renders `GuidedCreatorPageShell` and the step components. `src/components/guided-creator/guided-creator-page-shell.tsx` renders `CreatorFunnelHero` from `@/components/landing`. It does not import `CreatorPageShell`.
- `src/components/character-sheet/library-powers-panel.tsx` renders `PowersListSection`. `src/components/character-sheet/library-inventory-panel.tsx` renders the weapon, shield, armor, and equipment list sections. `src/components/character-sheet/feats-tab.tsx` renders `FeatsTraitsListSection`.
- `src/components/patterns/filters/source-filter.tsx` is All / Realms Library / My Library. `src/components/patterns/filters/codex-rules-source-filter.tsx` is a codex-catalog multi-select. Different filters.
- `src/components/patterns/select/choice-trait-option-select.tsx` is a single-choice picker. `GuidedTraitOptionList` is a read-only list over `DetailOptionList`. Different jobs.

### Files

Every path below is a non-test source file. The checker fails if one is missing from this document.

### `src/components/character-sheet`

- `src/components/character-sheet/abilities-section.tsx`
- `src/components/character-sheet/ability-stat-tile.tsx`
- `src/components/character-sheet/add-feat-modal.tsx`
- `src/components/character-sheet/add-library-item-modal.tsx`
- `src/components/character-sheet/add-proficiency-modal.tsx`
- `src/components/character-sheet/archetype-path-identity.tsx`
- `src/components/character-sheet/archetype-section.tsx`
- `src/components/character-sheet/build-library-section-data.ts`
- `src/components/character-sheet/character-sheet-body.tsx`
- `src/components/character-sheet/character-sheet-context.tsx`
- `src/components/character-sheet/character-sheet-settings-modal.tsx`
- `src/components/character-sheet/currency-field-commit.ts`
- `src/components/character-sheet/edit-archetype-modal.tsx`
- `src/components/character-sheet/edit-species-ancestry-step.tsx`
- `src/components/character-sheet/edit-species-modal.tsx`
- `src/components/character-sheet/edit-species-species-filter.ts`
- `src/components/character-sheet/edit-species-species-step.tsx`
- `src/components/character-sheet/feats-tab.tsx`
- `src/components/character-sheet/index.ts`
- `src/components/character-sheet/level-up-modal.tsx`
- `src/components/character-sheet/library-entity-rows.tsx`
- `src/components/character-sheet/library-feat-rows.tsx`
- `src/components/character-sheet/library-inventory-panel.tsx`
- `src/components/character-sheet/library-list-helpers.ts`
- `src/components/character-sheet/library-powers-panel.tsx`
- `src/components/character-sheet/library-section-props.ts`
- `src/components/character-sheet/library-section-visibility-toggle.tsx`
- `src/components/character-sheet/library-section.tsx`
- `src/components/character-sheet/library-tab-config.ts`
- `src/components/character-sheet/notes-tab-edit-controls.tsx`
- `src/components/character-sheet/notes-tab.tsx`
- `src/components/character-sheet/path-level-guidance.tsx`
- `src/components/character-sheet/proficiencies-tab.tsx`
- `src/components/character-sheet/read-only-sheet.ts`
- `src/components/character-sheet/recovery-modal.tsx`
- `src/components/character-sheet/sheet-action-toolbar.tsx`
- `src/components/character-sheet/sheet-allocation-reset-button.tsx`
- `src/components/character-sheet/sheet-currency-input-layout.ts`
- `src/components/character-sheet/sheet-desktop-columns.ts`
- `src/components/character-sheet/sheet-field-focus.ts`
- `src/components/character-sheet/sheet-header-identity.tsx`
- `src/components/character-sheet/sheet-header-layout.ts`
- `src/components/character-sheet/sheet-header-name.ts`
- `src/components/character-sheet/sheet-header-resources.tsx`
- `src/components/character-sheet/sheet-header.tsx`
- `src/components/character-sheet/sheet-item-match.ts`
- `src/components/character-sheet/sheet-large-stat-block.tsx`
- `src/components/character-sheet/sheet-mobile-carousel.ts`
- `src/components/character-sheet/sheet-resource-input.tsx`
- `src/components/character-sheet/sheet-temp-modifier-controls.tsx`
- `src/components/character-sheet/sheet-viewer-edits.ts`
- `src/components/character-sheet/skills-header-pin.ts`
- `src/components/character-sheet/skills-section.tsx`
- `src/components/character-sheet/use-character-sheet-actions.ts`
- `src/components/character-sheet/use-character-sheet-derived.ts`
- `src/components/character-sheet/use-edit-species-modal.ts`
- `src/components/character-sheet/use-library-section-rows.ts`
- `src/components/character-sheet/use-library-tab-navigation.tsx`
- `src/components/character-sheet/use-sheet-auto-proficiencies.ts`
- `src/components/character-sheet/use-sheet-feat-actions.ts`
- `src/components/character-sheet/use-sheet-library-actions.ts`
- `src/components/character-sheet/use-sheet-resource-actions.ts`
- `src/components/character-sheet/use-sheet-skill-identity-actions.ts`

### `src/components/character-sheet/add-library-item`

- `src/components/character-sheet/add-library-item/add-custom-equipment-form.tsx`
- `src/components/character-sheet/add-library-item/build-custom-equipment.ts`
- `src/components/character-sheet/add-library-item/map-selection.ts`
- `src/components/character-sheet/add-library-item/modal-config.ts`
- `src/components/character-sheet/add-library-item/power-header-extra.tsx`

### `src/components/guided-creator`

- `src/components/guided-creator/character-preview-panel.tsx`
- `src/components/guided-creator/guided-abilities-customize-panel.tsx`
- `src/components/guided-creator/guided-choice-card.tsx`
- `src/components/guided-creator/guided-choice-image.ts`
- `src/components/guided-creator/guided-choice-styles.ts`
- `src/components/guided-creator/guided-creator-page-shell.tsx`
- `src/components/guided-creator/guided-creator-shell.tsx`
- `src/components/guided-creator/guided-detail-option-list.tsx`
- `src/components/guided-creator/guided-entity-detail-modal.tsx`
- `src/components/guided-creator/guided-equipment-fact-chips.tsx`
- `src/components/guided-creator/guided-equipment-l1-phase.tsx`
- `src/components/guided-creator/guided-equipment-l2-grid.ts`
- `src/components/guided-creator/guided-equipment-l2-modal.tsx`
- `src/components/guided-creator/guided-equipment-phase-layout.tsx`
- `src/components/guided-creator/guided-feats-filter-fields.tsx`
- `src/components/guided-creator/guided-feats-l2-modal.tsx`
- `src/components/guided-creator/guided-health-energy-section.tsx`
- `src/components/guided-creator/guided-mixed-species-overview.tsx`
- `src/components/guided-creator/guided-overview-section.tsx`
- `src/components/guided-creator/guided-path-custom-archetype.tsx`
- `src/components/guided-creator/guided-path-detail-modal.tsx`
- `src/components/guided-creator/guided-path-detail-overview.tsx`
- `src/components/guided-creator/guided-portrait-upload.tsx`
- `src/components/guided-creator/guided-powers-techniques-l1-content.tsx`
- `src/components/guided-creator/guided-powers-techniques-l2-modal.tsx`
- `src/components/guided-creator/guided-restriction-notice.tsx`
- `src/components/guided-creator/guided-reveal-review-modal.tsx`
- `src/components/guided-creator/guided-reveal-summary.tsx`
- `src/components/guided-creator/guided-section-title.tsx`
- `src/components/guided-creator/guided-skills-panel.tsx`
- `src/components/guided-creator/guided-species-detail-modal.tsx`
- `src/components/guided-creator/guided-species-utils.ts`
- `src/components/guided-creator/guided-step-footer.tsx`
- `src/components/guided-creator/guided-step-layout.tsx`
- `src/components/guided-creator/guided-text.ts`
- `src/components/guided-creator/guided-trait-option-list.tsx`
- `src/components/guided-creator/guided-unarmed-prowess-panel.tsx`
- `src/components/guided-creator/index.ts`
- `src/components/guided-creator/species-reveal-panel.tsx`
- `src/components/guided-creator/use-guided-path-data.ts`

### `src/components/guided-creator/steps`

- `src/components/guided-creator/steps/abilities-step.tsx`
- `src/components/guided-creator/steps/ancestry-step.tsx`
- `src/components/guided-creator/steps/archetype-feats-step.tsx`
- `src/components/guided-creator/steps/character-feat-step.tsx`
- `src/components/guided-creator/steps/index.ts`
- `src/components/guided-creator/steps/loadout-step.tsx`
- `src/components/guided-creator/steps/path-step.tsx`
- `src/components/guided-creator/steps/powers-techniques-step.tsx`
- `src/components/guided-creator/steps/reveal-step.tsx`
- `src/components/guided-creator/steps/skills-step.tsx`
- `src/components/guided-creator/steps/species-step.tsx`
- `src/components/guided-creator/steps/use-powers-techniques-selection.ts`

### `src/components/patterns/chrome`

- `src/components/patterns/chrome/cloud-sync-offline-banner.tsx`
- `src/components/patterns/chrome/confirm-action-modal.tsx`
- `src/components/patterns/chrome/creator-portrait-upload.tsx`
- `src/components/patterns/chrome/delete-confirm-modal.tsx`
- `src/components/patterns/chrome/discord-icon.tsx`
- `src/components/patterns/chrome/edit-section-toggle.tsx`
- `src/components/patterns/chrome/error-boundary.tsx`
- `src/components/patterns/chrome/image-upload-modal.tsx`
- `src/components/patterns/chrome/loadout-budget-bar.tsx`
- `src/components/patterns/chrome/login-prompt-modal.tsx`
- `src/components/patterns/chrome/point-status.tsx`
- `src/components/patterns/chrome/realms-image-picker.tsx`
- `src/components/patterns/chrome/roll-button.tsx`
- `src/components/patterns/chrome/section-cost-badge.tsx`
- `src/components/patterns/chrome/section-header.tsx`
- `src/components/patterns/chrome/segmented-control.tsx`
- `src/components/patterns/chrome/tab-summary-section.tsx`
- `src/components/patterns/chrome/temp-modifier-toggle.tsx`
- `src/components/patterns/chrome/theme-toggle.tsx`
- `src/components/patterns/chrome/trait-section.tsx`

### `src/components/patterns/filters`

- `src/components/patterns/filters/ability-requirement-filter.tsx`
- `src/components/patterns/filters/archetype-path-filter.tsx`
- `src/components/patterns/filters/armament-filters.tsx`
- `src/components/patterns/filters/character-filter.tsx`
- `src/components/patterns/filters/chip-select.tsx`
- `src/components/patterns/filters/codex-rules-source-filter.tsx`
- `src/components/patterns/filters/filter-native-select.tsx`
- `src/components/patterns/filters/filter-section.tsx`
- `src/components/patterns/filters/filter-utils.ts`
- `src/components/patterns/filters/index.ts`
- `src/components/patterns/filters/power-technique-filters.tsx`
- `src/components/patterns/filters/select-filter.tsx`
- `src/components/patterns/filters/source-filter.tsx`
- `src/components/patterns/filters/tag-filter.tsx`

### `src/components/patterns/guided-choice`

- `src/components/patterns/guided-choice/guided-inline-catalog-list.tsx`
- `src/components/patterns/guided-choice/guided-layer-nav.tsx`
- `src/components/patterns/guided-choice/guided-nav-button-styles.ts`
- `src/components/patterns/guided-choice/index.ts`

### `src/components/patterns/help`

- `src/components/patterns/help/descriptor-chip-with-tip.tsx`
- `src/components/patterns/help/expandable-image.tsx`
- `src/components/patterns/help/info-tippy.tsx`
- `src/components/patterns/help/path-help-card.tsx`

### `src/components/patterns`

- `src/components/patterns/index.ts`

### `src/components/patterns/list`

- `src/components/patterns/list/ability-score-grid.tsx`
- `src/components/patterns/list/codex-browse-list-shell.tsx`
- `src/components/patterns/list/creature-library-stat-block-rows.tsx`
- `src/components/patterns/list/creature-stat-block-display-data.ts`
- `src/components/patterns/list/creature-stat-block-helpers.ts`
- `src/components/patterns/list/creature-stat-block-panels.tsx`
- `src/components/patterns/list/creature-stat-block-section.tsx`
- `src/components/patterns/list/creature-stat-block-types.ts`
- `src/components/patterns/list/creature-stat-block.tsx`
- `src/components/patterns/list/detail-option-list.tsx`
- `src/components/patterns/list/entity-library-feats.tsx`
- `src/components/patterns/list/entity-library-inventory.tsx`
- `src/components/patterns/list/entity-library-powers-techniques.tsx`
- `src/components/patterns/list/entity-library-sections-columns.ts`
- `src/components/patterns/list/entity-library-sections-rows.tsx`
- `src/components/patterns/list/entity-library-sections-types.ts`
- `src/components/patterns/list/entity-library-sections.tsx`
- `src/components/patterns/list/grid-list-chip.tsx`
- `src/components/patterns/list/grid-list-row-chrome.ts`
- `src/components/patterns/list/grid-list-row-collapsed.tsx`
- `src/components/patterns/list/grid-list-row-columns.ts`
- `src/components/patterns/list/grid-list-row-detail.tsx`
- `src/components/patterns/list/grid-list-row-expanded.tsx`
- `src/components/patterns/list/grid-list-row-types.ts`
- `src/components/patterns/list/grid-list-row.tsx`
- `src/components/patterns/list/hub-list-row.tsx`
- `src/components/patterns/list/library-add-to-library-button.tsx`
- `src/components/patterns/list/library-row-action-slot.tsx`
- `src/components/patterns/list/list-components.tsx`
- `src/components/patterns/list/list-header.tsx`
- `src/components/patterns/list/list-row-thumbnail.tsx`
- `src/components/patterns/list/list-search-toolbar.tsx`
- `src/components/patterns/list/official-creature-list.tsx`
- `src/components/patterns/list/official-enhanced-list.tsx`
- `src/components/patterns/list/official-entity-list.tsx`
- `src/components/patterns/list/official-item-list.tsx`
- `src/components/patterns/list/official-power-list.tsx`
- `src/components/patterns/list/official-technique-list.tsx`
- `src/components/patterns/list/quick-armaments-sections.tsx`
- `src/components/patterns/list/skill-row.tsx`
- `src/components/patterns/list/skills-allocation-page.tsx`
- `src/components/patterns/list/summary-chip-list.tsx`

### `src/components/patterns/select`

- `src/components/patterns/select/ability-pick-button.tsx`
- `src/components/patterns/select/add-skill-modal.tsx`
- `src/components/patterns/select/add-sub-skill-modal.tsx`
- `src/components/patterns/select/choice-trait-option-select.tsx`
- `src/components/patterns/select/equip-toggle.tsx`
- `src/components/patterns/select/innate-toggle.tsx`
- `src/components/patterns/select/mixed-species-modal.tsx`
- `src/components/patterns/select/mixed-species-skill-picker.tsx`
- `src/components/patterns/select/powered-martial-slider.tsx`
- `src/components/patterns/select/quantity-selector.tsx`
- `src/components/patterns/select/selection-toggle.tsx`
- `src/components/patterns/select/unified-selection-modal-footer.tsx`
- `src/components/patterns/select/unified-selection-modal-helpers.ts`
- `src/components/patterns/select/unified-selection-modal-leave-prompt.tsx`
- `src/components/patterns/select/unified-selection-modal-list.tsx`
- `src/components/patterns/select/unified-selection-modal-toolbar.tsx`
- `src/components/patterns/select/unified-selection-modal-types.ts`
- `src/components/patterns/select/unified-selection-modal.tsx`
- `src/components/patterns/select/value-stepper.tsx`

### `src/components/patterns/stat-tiles`

- `src/components/patterns/stat-tiles/ability-defense-stat-model.ts`
- `src/components/patterns/stat-tiles/defense-stat-tile.tsx`
- `src/components/patterns/stat-tiles/index.ts`


---

## Creator pages, crafting, and encounters

131 non-test `.ts` / `.tsx` files. `page.tsx` and `layout.tsx` files have no TypeScript importer. Next loads them. Every other file in this slice has a production importer. None of those files are unused.

`src/app/(main)/crafting/DEFERRED.md` and `src/app/(main)/empowered-technique-creator/DEFERRED.md` are present. They were not opened.

### Second implementations

- Ability tiles, a third grid. `src/components/creator/ability-score-editor.tsx` renders `AbilityScoreGrid` only when `variant` is `sheet`. The default branch draws its own tiles and keeps its own `ABILITY_ORDER` and `ABILITY_INFO`, including a description string. `src/app/(main)/creature-creator/creature-creator-editor.tsx` renders `AbilityScoreEditor` without `variant`, so it uses that default grid. Guided customize passes `variant="sheet"`.
- Action and attack controls. Three files, and none renders another. `src/app/(main)/power-creator/power-creator-editor-action-profile.tsx` is two sections (Action Type, Attack). `src/app/(main)/empowered-technique-creator/empowered-technique-editor-action-profile.tsx` is one Shared Action Profile section. `src/app/(main)/technique-creator/technique-creator-editor.tsx` has a Combat Configuration section with its own attack select and reaction checkbox. They share `ACTION_OPTIONS` and `ATTACK_MODE_SELECT_OPTIONS`.
- Damage dice controls. Each file has its own `ValueStepper` and `DIE_SIZES` select. None renders another: `src/app/(main)/power-creator/power-creator-editor-power-damage.tsx`, `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-damage.tsx`, `src/app/(main)/empowered-technique-creator/empowered-technique-editor-technique-parts.tsx`, the Additional Damage section in `technique-creator-editor.tsx`, `src/app/(main)/item-creator/item-creator-editor-weapon-shield.tsx`, and `src/app/(main)/item-creator/item-creator-editor-shield-panels.tsx` (shield block and shield damage).
- Range, area, and duration. `src/app/(main)/power-creator/power-creator-editor-power-config.tsx` is three sections (Range, Area of Effect, Duration). `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-config.tsx` is one Power Configuration section. Both use `ValueStepper`, `AREA_TYPES`, `DURATION_TYPES`, and `DURATION_VALUES`. Neither renders the other.
- Part lists. `src/app/(main)/power-creator/power-creator-editor-power-parts.tsx`, `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-parts.tsx`, and `technique-creator-editor.tsx` each map rows onto `PowerPartCard` inside their own `CollapsibleSection`.
- Add-part handlers. `addPart` in `src/app/(main)/power-creator/power-creator-part-actions.ts` and `addPowerPart` in `src/app/(main)/empowered-technique-creator/empowered-technique-part-actions.ts` both append the first list entry with the same option-level fields. Power's mechanic add calls `nextMechanicPartToAdd`, which skips an id already selected. Empowered's mechanic add takes the first list entry and does not call that function.
- Name and description cards. `src/app/(main)/power-creator/power-creator-editor-meta.tsx`, `src/app/(main)/empowered-technique-creator/empowered-technique-editor-meta.tsx`, and `src/app/(main)/item-creator/item-creator-editor-meta.tsx` each render `CreatorNameField` and `CreatorDescriptionField`. They do not render each other. The item card also has an item-type `SegmentedControl`.
- Reset helpers. `applySpeciesCreatorReset` in `src/app/(main)/species-creator/species-creator-reset.ts` and `applyTechniqueCreatorReset` in `src/app/(main)/technique-creator/technique-creator-reset.ts` are separate functions. Both clear the draft, reset the form, forget the loaded library row, and clear the save message. Technique also calls `acceptDraft`. Species does not.
- Condition names. `CONDITIONS` in `src/lib/game/creator-constants.ts` and `CONDITION_OPTIONS` in `src/components/encounters/encounter-constants.ts` are the same 23 names in the same order. Only the encounter list stores `leveled` and `description`. `src/app/(main)/creature-creator/creature-creator-editor-traits-section.tsx` imports `CONDITIONS`. The description strings were not compared to anything else.
- Creature feats. `src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx` renders `GridListRow` for feats. It does not render `FeatsTraitsListSection`.

### Calls a shared component

- `src/components/creator/CreatorPageShell.tsx` renders `CreatorLayout`, `CreatorSaveToolbar`, `LoadFromLibraryModal`, `LoginPromptModal`, and `ConfirmActionModal`. The power, technique, empowered technique, item, species, and creature pages render `CreatorPageShell`.
- `src/components/creator/LoadFromLibraryModal.tsx` renders `UnifiedSelectionModal`. The creator barrel does not export this file. `CreatorPageShell` imports it by path.
- The creator barrel exports `CreatorSaveToolbarProps` and does not export the `CreatorSaveToolbar` function. `CreatorPageShell` imports the function by path.
- `src/components/creator/creator-text-fields.tsx` is not on the creator barrel. The meta cards and `technique-creator-editor.tsx` import it by path.
- `src/components/creator/targeted-defenses-section.tsx` renders `ChipSelect`.
- `src/components/crafting/CraftingItemSelectModal.tsx` renders `UnifiedSelectionModal`. `src/components/crafting/get-crafting-market-price.ts` calls `equipmentCurrency` and `resolveItemMarketPricing`.
- `src/app/(main)/crafting/[id]/page.tsx` renders `CreatorLayout` and the section files under `_components`. It does not render `CreatorPageShell`. `src/app/(main)/crafting/[id]/_components/crafting-summary-sidebar.tsx` renders `CreatorSummaryPanel`. `src/app/(main)/crafting/page.tsx` renders `PageContainer` and `PageHeader`.
- `src/app/(main)/creature-creator/AddCreatureFeatModal.tsx` renders `UnifiedSelectionModal`. The selection rules in that file were not read.
- `src/app/(main)/creature-creator/creature-creator-editor-inventory-section.tsx` renders `WeaponsListSection`, `ShieldsListSection`, `ArmorListSection`, and `EquipmentListSection`.
- `src/app/(main)/creature-creator/creature-creator-editor.tsx` renders `ArchetypeSelector`, `HealthEnergyAllocator`, `AbilityScoreEditor`, and `SkillsAllocationPage`.
- `src/app/(main)/power-creator/power-creator-editor.tsx`, `src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx`, and `src/app/(main)/item-creator/item-creator-editor.tsx` only compose their section files.
- `src/app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts` imports `EXCLUDED_PARTS` from `src/app/(main)/power-creator/power-creator-constants.ts`. That constant is `POWER_AUTO_MECHANIC_PART_NAMES`.
- `src/app/(main)/power-creator/power-creator-cost-derivation.ts` imports `calculatePowerCosts` from `@/lib/calculators`. `src/app/(main)/empowered-technique-creator/empowered-technique-cost-derivation.ts` imports `calculatePowerCosts`, `calculateTechniqueCosts`, and `calculateEmpoweredTechniqueCosts`. `src/app/(main)/item-creator/item-creator-cost-derivation.ts` imports `calculateItemCosts`. Those function bodies were not read.
- Species base skills in `src/app/(main)/species-creator/species-creator-editor.tsx` are two `select` elements. They do not render `SkillRow`.
- `src/components/encounters/CombatantCard.tsx` renders `CombatantCardInitiative`, `CombatantCardHeader`, `CombatantCardResources`, `CombatantCardConditionChips`, `CombatantCardResourceQuickActions`, and `CombatantCardConditionsPanel`.
- `src/components/encounters/add-combatant-modal.tsx` renders `Modal`. It does not render `UnifiedSelectionModal`. The picker body was not read.

### Not read line by line

- `src/app/(main)/power-creator/use-power-creator-workspace.ts`, `use-power-creator-composition.ts`, `power-creator-bootstrap.ts`, `power-creator-composition.ts`, `power-creator-composition-band.tsx`, `power-creator-help.tsx`, `power-creator-from-shared.tsx`, `power-creator-innate-label.ts`, `power-creator-types.ts`, `power-creator-editor-config.ts`, and `page.tsx` past the `CreatorPageShell` render.
- `src/app/(main)/technique-creator/use-technique-creator-workspace.ts`, `technique-creator-bootstrap.ts`, and `page.tsx` past the shell.
- `src/app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts` past the `EXCLUDED_PARTS` import, `empowered-technique-bootstrap.ts`, `empowered-technique-editor-config.ts`, and `page.tsx` past the shell.
- `src/app/(main)/item-creator/use-item-creator-workspace.ts`, `item-creator-bootstrap.ts`, `item-creator-helpers.tsx`, `item-creator-property-actions.ts`, `item-creator-property-options.ts`, `item-creator-save-reset.ts`, `item-creator-editor-config.ts`, `item-creator-editor-ability-properties.tsx`, `item-creator-editor-armor.tsx` past the steppers, and `page.tsx` past the shell.
- `src/app/(main)/species-creator/use-species-creator-workspace.ts`, `species-creator-bootstrap.ts`, `species-creator-editor.tsx` past the section titles and the base-skill selects, and `page.tsx` past the shell.
- `src/app/(main)/creature-creator/use-creature-creator-workspace.ts`, `creature-creator-bootstrap.ts`, `creature-creator-derived-stats.ts`, `creature-creator-feat-armament-display.ts`, `creature-creator-library-selectables.ts`, `creature-creator-skill-bonus.ts`, `creature-skill-utils.ts`, `creature-creator-training-spent.ts`, `transformers.ts`, `creature-creator-workspace-persistence.ts`, `creature-damage-modifiers.ts`, `creature-ability-points-display.ts`, `creature-feat-utils.ts`, `creature-over-budget-notification.ts`, `creature-sub-skill-highest-ability-label.ts`, `creature-trait-labels.ts`, `map-creature-inventory-rows.ts`, `creature-creator-types.ts`, `creature-creator-summaries.ts`, `creature-creator-remove-section-confirm-placeholder.ts`, `creature-creator-constants.ts`, `CreatureCreatorHelpers.tsx` past `ChipList` (its rows are spans; the cost label renders `DescriptorChip`), `AddCreatureFeatModal.tsx` past the `UnifiedSelectionModal` render, and `page.tsx` past the shell.
- `src/app/(main)/crafting/[id]/_components/use-crafting-tool-page.ts`, `crafting-tool-derived.ts`, `crafting-tool-helpers.ts`, and the section bodies in `crafting-adjustments-section.tsx`, `crafting-item-options-section.tsx`, `crafting-optional-rules-section.tsx`, `crafting-rolls-section.tsx`, and `crafting-outcome-card.tsx`.
- `src/components/encounters/combatant-card-initiative.tsx`, `combatant-card-header.tsx`, `combatant-card-conditions.tsx`, `combatant-card-quick-actions.tsx`, `combatant-card-helpers.ts`, `combatant-card-resources.tsx` past its props, and `add-combatant-modal.tsx` past the `Modal` render.
- `src/components/creator/health-energy-allocator.tsx`, `archetype-selector.tsx`, `power-part-card.tsx`, `creator-summary-panel.tsx`, and `collapsible-section.tsx` past their imports and the components named above.

### Files

Every path below is a non-test source file. The checker fails if one is missing from this document.

### `src/app/(main)/crafting/[id]/_components`

- `src/app/(main)/crafting/[id]/_components/crafting-adjustments-section.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-item-options-section.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-optional-rules-section.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-outcome-card.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-rolls-section.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-summary-sidebar.tsx`
- `src/app/(main)/crafting/[id]/_components/crafting-tool-derived.ts`
- `src/app/(main)/crafting/[id]/_components/crafting-tool-helpers.ts`
- `src/app/(main)/crafting/[id]/_components/use-crafting-tool-page.ts`

### `src/app/(main)/crafting/[id]`

- `src/app/(main)/crafting/[id]/page.tsx`

### `src/app/(main)/crafting`

- `src/app/(main)/crafting/crafting-bootstrap.ts`
- `src/app/(main)/crafting/layout.tsx`
- `src/app/(main)/crafting/page.tsx`

### `src/app/(main)/creature-creator`

- `src/app/(main)/creature-creator/AddCreatureFeatModal.tsx`
- `src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx`
- `src/app/(main)/creature-creator/creature-ability-points-display.ts`
- `src/app/(main)/creature-creator/creature-creator-bootstrap.ts`
- `src/app/(main)/creature-creator/creature-creator-constants.ts`
- `src/app/(main)/creature-creator/creature-creator-derived-stats.ts`
- `src/app/(main)/creature-creator/creature-creator-editor-inventory-section.tsx`
- `src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx`
- `src/app/(main)/creature-creator/creature-creator-editor-traits-section.tsx`
- `src/app/(main)/creature-creator/creature-creator-editor.tsx`
- `src/app/(main)/creature-creator/creature-creator-feat-armament-display.ts`
- `src/app/(main)/creature-creator/creature-creator-library-selectables.ts`
- `src/app/(main)/creature-creator/creature-creator-remove-section-confirm-placeholder.ts`
- `src/app/(main)/creature-creator/creature-creator-skill-bonus.ts`
- `src/app/(main)/creature-creator/creature-creator-summaries.ts`
- `src/app/(main)/creature-creator/creature-creator-training-spent.ts`
- `src/app/(main)/creature-creator/creature-creator-types.ts`
- `src/app/(main)/creature-creator/creature-creator-workspace-persistence.ts`
- `src/app/(main)/creature-creator/creature-damage-modifiers.ts`
- `src/app/(main)/creature-creator/creature-feat-utils.ts`
- `src/app/(main)/creature-creator/creature-over-budget-notification.ts`
- `src/app/(main)/creature-creator/creature-skill-utils.ts`
- `src/app/(main)/creature-creator/creature-sub-skill-highest-ability-label.ts`
- `src/app/(main)/creature-creator/creature-trait-labels.ts`
- `src/app/(main)/creature-creator/layout.tsx`
- `src/app/(main)/creature-creator/map-creature-inventory-rows.ts`
- `src/app/(main)/creature-creator/page.tsx`
- `src/app/(main)/creature-creator/transformers.ts`
- `src/app/(main)/creature-creator/use-creature-creator-workspace.ts`

### `src/app/(main)/empowered-technique-creator`

- `src/app/(main)/empowered-technique-creator/empowered-technique-bootstrap.ts`
- `src/app/(main)/empowered-technique-creator/empowered-technique-cost-derivation.ts`
- `src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-action-profile.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-config.ts`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-meta.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-config.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-damage.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-parts.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-technique-parts.tsx`
- `src/app/(main)/empowered-technique-creator/empowered-technique-part-actions.ts`
- `src/app/(main)/empowered-technique-creator/layout.tsx`
- `src/app/(main)/empowered-technique-creator/page.tsx`
- `src/app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts`

### `src/app/(main)/item-creator`

- `src/app/(main)/item-creator/item-creator-bootstrap.ts`
- `src/app/(main)/item-creator/item-creator-cost-derivation.ts`
- `src/app/(main)/item-creator/item-creator-editor-ability-properties.tsx`
- `src/app/(main)/item-creator/item-creator-editor-armor.tsx`
- `src/app/(main)/item-creator/item-creator-editor-config.ts`
- `src/app/(main)/item-creator/item-creator-editor-meta.tsx`
- `src/app/(main)/item-creator/item-creator-editor-shield-panels.tsx`
- `src/app/(main)/item-creator/item-creator-editor-weapon-shield.tsx`
- `src/app/(main)/item-creator/item-creator-editor.tsx`
- `src/app/(main)/item-creator/item-creator-helpers.tsx`
- `src/app/(main)/item-creator/item-creator-property-actions.ts`
- `src/app/(main)/item-creator/item-creator-property-options.ts`
- `src/app/(main)/item-creator/item-creator-save-reset.ts`
- `src/app/(main)/item-creator/layout.tsx`
- `src/app/(main)/item-creator/page.tsx`
- `src/app/(main)/item-creator/use-item-creator-workspace.ts`

### `src/app/(main)/power-creator`

- `src/app/(main)/power-creator/layout.tsx`
- `src/app/(main)/power-creator/page.tsx`
- `src/app/(main)/power-creator/power-creator-bootstrap.ts`
- `src/app/(main)/power-creator/power-creator-composition-band.tsx`
- `src/app/(main)/power-creator/power-creator-composition.ts`
- `src/app/(main)/power-creator/power-creator-constants.ts`
- `src/app/(main)/power-creator/power-creator-cost-derivation.ts`
- `src/app/(main)/power-creator/power-creator-editor-action-profile.tsx`
- `src/app/(main)/power-creator/power-creator-editor-config.ts`
- `src/app/(main)/power-creator/power-creator-editor-meta.tsx`
- `src/app/(main)/power-creator/power-creator-editor-power-config.tsx`
- `src/app/(main)/power-creator/power-creator-editor-power-damage.tsx`
- `src/app/(main)/power-creator/power-creator-editor-power-parts.tsx`
- `src/app/(main)/power-creator/power-creator-editor.tsx`
- `src/app/(main)/power-creator/power-creator-from-shared.tsx`
- `src/app/(main)/power-creator/power-creator-help.tsx`
- `src/app/(main)/power-creator/power-creator-innate-label.ts`
- `src/app/(main)/power-creator/power-creator-part-actions.ts`
- `src/app/(main)/power-creator/power-creator-types.ts`
- `src/app/(main)/power-creator/use-power-creator-composition.ts`
- `src/app/(main)/power-creator/use-power-creator-workspace.ts`

### `src/app/(main)/species-creator`

- `src/app/(main)/species-creator/layout.tsx`
- `src/app/(main)/species-creator/page.tsx`
- `src/app/(main)/species-creator/species-creator-bootstrap.ts`
- `src/app/(main)/species-creator/species-creator-editor.tsx`
- `src/app/(main)/species-creator/species-creator-reset.ts`
- `src/app/(main)/species-creator/use-species-creator-workspace.ts`

### `src/app/(main)/technique-creator`

- `src/app/(main)/technique-creator/layout.tsx`
- `src/app/(main)/technique-creator/page.tsx`
- `src/app/(main)/technique-creator/technique-creator-bootstrap.ts`
- `src/app/(main)/technique-creator/technique-creator-editor.tsx`
- `src/app/(main)/technique-creator/technique-creator-reset.ts`
- `src/app/(main)/technique-creator/use-technique-creator-workspace.ts`

### `src/components/crafting`

- `src/components/crafting/CraftingItemSelectModal.tsx`
- `src/components/crafting/get-crafting-market-price.ts`

### `src/components/creator`

- `src/components/creator/CreatorLayout.tsx`
- `src/components/creator/CreatorPageShell.tsx`
- `src/components/creator/CreatorSaveToolbar.tsx`
- `src/components/creator/LoadFromLibraryModal.tsx`
- `src/components/creator/ability-score-editor.tsx`
- `src/components/creator/advanced-calculations-panel.tsx`
- `src/components/creator/archetype-selector.tsx`
- `src/components/creator/collapsible-section.tsx`
- `src/components/creator/creator-summary-panel.tsx`
- `src/components/creator/creator-text-fields.tsx`
- `src/components/creator/health-energy-allocator.tsx`
- `src/components/creator/index.ts`
- `src/components/creator/power-part-card.tsx`
- `src/components/creator/targeted-defenses-section.tsx`

### `src/components/encounters`

- `src/components/encounters/CombatantCard.tsx`
- `src/components/encounters/add-combatant-modal.tsx`
- `src/components/encounters/combatant-card-conditions.tsx`
- `src/components/encounters/combatant-card-header.tsx`
- `src/components/encounters/combatant-card-helpers.ts`
- `src/components/encounters/combatant-card-initiative.tsx`
- `src/components/encounters/combatant-card-quick-actions.tsx`
- `src/components/encounters/combatant-card-resources.tsx`
- `src/components/encounters/encounter-combatant-types.ts`
- `src/components/encounters/encounter-constants.ts`


---

## Left for a later pass

Still not opened file by file:

- `src/components/about`, `auth`, `character`, `codex`, `landing`, `layout`, `legal`, `onboarding`, `providers`, `rolls`, `rules`, and `tabletop`.
- `src/components/ui` beyond the files its barrel does not re-export.
- `src/app/(main)/encounters/[id]/_components`, `src/app/(detail)/campaigns/[id]/_components`, `src/app/(main)/my-account/_components`, and admin codex screens beyond the page file each route imports.
- Modules under `src/lib/` other than the `game/` and `calculators/` sibling lists above (`codex`, `character`, `library`, `guided-creator`, `auth`, and the rest). `src/lib/game/creator-constants.ts` was opened only for `CONDITIONS`.
- Unused exports inside files that something already imports.
- Line-by-line comparison of files in `src/components/patterns`, `src/components/character-sheet`, and `src/components/guided-creator` that are not named in that fork section.
- The files named under "Not read line by line" in the creator section above.
