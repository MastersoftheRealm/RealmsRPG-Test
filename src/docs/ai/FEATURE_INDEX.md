# Feature Index — files that exist

**Status: PATCH.** The previous text described how features behave. That prose was not re-read against the functions it named, so it was removed. This file is a map of files. It is not a description of game rules or of what a screen does, except for the few import and redirect lines cited below.

Checked on this pass:

- Every `page`, `layout`, `route`, `loading`, `error`, `not-found`, `robots`, `sitemap`, and `opengraph-image` file under `src/app`, plus `src/proxy.ts`, `src/instrumentation.ts`, and `src/instrumentation-client.ts`.
- Every `index.ts` / `index.tsx` under `src`.
- Sibling source files that these barrels do **not** re-export: `src/lib/game/index.ts`, `src/lib/calculators/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`, `src/stores/index.ts`, `src/components/ui/index.ts`.
- Same-name modules and the two help widgets, by opening those files.
- Every non-test `.ts` / `.tsx` file under `src/components/patterns`, `src/components/character-sheet`, and `src/components/guided-creator`: static imports, plus the pairs named in that section, which were opened. The other files in those folders were not read line by line.
- Every non-test `.ts` / `.tsx` file under `src/components/creator`, `src/components/crafting`, `src/components/encounters`, and the creator and crafting page folders named in that section. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/components/character`, `src/components/codex`, `src/app/(main)/encounters/[id]/_components`, and `src/app/(detail)/campaigns/[id]/_components`. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/components/rolls`, `rules`, `tabletop`, `layout`, `landing`, `about`, `auth`, `legal`, `onboarding`, `providers`, and `src/app/(main)/my-account/_components`. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/components/ui` and `src/app/(main)/admin/codex`. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under the other `src/app/(main)/admin` screens, `src/lib/codex`, `src/lib/character`, `src/lib/library`, `src/lib/auth`, `src/lib/guided-creator`, and `src/lib/password-policy.ts`. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/lib/character-sheet`, `crafting`, `creator`, `encounter`, `rolls`, `rules`, `tabletop`, `validation`, `constants`, and `utils`, plus `src/lib/admin.ts` and the other loose files directly under `src/lib/`. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/lib/ancestry`, `api`, `chip`, `data-enrichment`, `detail-option`, `glr`, `observability`, `routes`, `security`, `server`, `supabase`, `tooltips`, and `ui`. The pairs in that section were opened. The files listed there as not read line by line were not.
- The modules `src/lib/game/index.ts` and `src/lib/calculators/index.ts` re-export. The pairs in that section were opened. The files listed there as not read line by line were not. The sibling files those barrels do not re-export were already named and were not re-read in that section.
- Every non-test `.ts` / `.tsx` file under public codex, library (including `components` and `hooks`), character detail, the characters list, the campaigns list (including the tabletop page), campaign detail outside `_components`, auth, encounter mixed and skill, the profile-picture upload route, and the styleguide. The pairs in that section were opened. The files listed there as not read line by line were not.
- Every non-test `.ts` / `.tsx` file under `src/hooks`, `src/services`, and `src/stores`. The pairs in that section were opened. The files listed there as not read line by line were not. The barrel-gap names already in this index were not re-read.
- The game and calculator sibling files the barrels do not re-export, and the formula and cost files named in that section. The pairs in that section were opened. The files listed there as not read line by line were not.
- Exported names outside `src/lib/game` and `src/lib/calculators`. A production import, including `import()`, counts. A test import does not. The names are in the unused-export section.

Not checked, so silence here is not "it does not exist" and not "there is no fork":

- Behavior of calculators, saves, or admin editors. This file is a map of files and copies. It is not a re-check of how every screen behaves.
- Pairs of files that are not named in a fork section below.
- The bodies named under "Not read line by line".

Export **names** for patterns, ui, hooks, and services are in [`FEATURE_INDEX_BARRELS.generated.md`](FEATURE_INDEX_BARRELS.generated.md). That generated file is not a list of what is used, and it does not read the other barrels.

`scripts/validate-feature-index.js` checks that backticked `src/...` paths in this file exist. The same script fails if an app entry, a `src` barrel, a sibling missing from the six barrels above, a loose file directly under `src/lib`, or a non-test source file in the folders listed in that script is absent from this file. It also fails if the unused-export section does not match a production-import scan, or if a guarded `math-disagree-intentional`, `math-disagree-bug`, `math-disagree-deferred`, or `math-disagree-unclassified` line is dropped from a formula math section below.

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
- `src/lib/game/creature-ability-bounds.ts`
- `src/lib/game/creator-constants.ts`
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
- `src/app/(main)/power-creator/power-creator-cost-derivation.ts`, `empowered-technique-cost-derivation.ts`, and `item-creator-cost-derivation.ts` were read through their cost hooks in **Crafting cost math** (they delegate to `@/lib/calculators`; calculator bodies are not re-summarized here).
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

## Character, codex, encounter play, and campaign detail

40 non-test `.ts` / `.tsx` files. Each one has a production importer. None are unused files.

`src/components/character/index.ts` exports `CharacterCard` and `AddCharacterCard`. It does not export `PortraitThumb`. Callers import `src/components/character/portrait-thumb.tsx` by path.

### Second implementations

- Portraits. `src/components/character/character-card.tsx` draws the portrait with `next/image`. `src/components/character/portrait-thumb.tsx` and `src/app/(detail)/campaigns/[id]/_components/character-chip.tsx` each draw an `img`. All three call `useEffectivePortrait` and `usePortraitFallbackUrl`. The card and the chip do not render `PortraitThumb`. `src/app/(detail)/campaigns/[id]/_components/add-character-modal.tsx` does.
- Editable titles. `src/app/(main)/encounters/[id]/_components/EncounterPageHeader.tsx` and `src/app/(detail)/campaigns/[id]/_components/campaign-detail-header.tsx` each render `PageHeader` while not editing, and a text `input` while editing. Enter commits and Escape cancels in both. Neither renders the other. The class strings differ.
- Initiative roll. `rollInitiative` in `src/app/(main)/encounters/[id]/_components/encounter-view-helpers.ts` and the private `rollInitiative` in `src/components/encounters/add-combatant-modal.tsx` are the same expression. The modal does not import the helper. Combat helpers and the skill view hook import the helper.
- Participant cards. `src/app/(main)/encounters/[id]/_components/combat/combat-combatant-list.tsx` renders `CombatantCard`. `src/app/(main)/encounters/[id]/_components/skill/skill-participant-list.tsx` renders `ParticipantCard` from `skill-participant-card.tsx`. `getParticipantBorderColor` in that card and `getCombatantBorderColor` in `src/components/encounters/combatant-card-helpers.ts` are separate functions. Both can return `border-l-ally` and `border-l-enemy`.
- Sort initiative buttons. `src/app/(main)/encounters/[id]/_components/combat/combat-round-controls.tsx` and `src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx` each render their own Sort Initiative button.
- Condition names on the combat sidebar. `src/app/(main)/encounters/[id]/_components/combat/combat-add-sidebar.tsx` maps `CONDITION_OPTIONS` into its own spans. It does not render the combatant card condition chips.

### Calls a shared component

- `src/components/codex/codex-feat-row.tsx` and `src/components/codex/codex-skill-row.tsx` each render `GridListRow`. They do not render each other. Codex and admin feat tabs render `CodexFeatRow`. Codex and admin skill tabs render `CodexSkillRow`. The sheet `SkillRow` does not render `CodexSkillRow`.
- `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx` renders `CombatRoundControls`, `CombatCombatantList`, `CombatAddSidebar`, `AddCombatantModal`, and `RollLog`. `src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx` renders `SkillTrackersSection`, `SkillParticipantList`, `SkillSidebar`, `AddCombatantModal`, and `RollLog`. `src/app/(main)/encounters/[id]/mixed/page.tsx` renders both views.
- `src/app/(main)/encounters/[id]/_components/combat/combat-add-sidebar.tsx` and `src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx` both render `EncounterCampaignRosterSection`. That section is a campaign select and add-all button. `src/app/(detail)/campaigns/[id]/_components/campaign-roster-section.tsx` renders `CharacterChip`. Those two roster files do different jobs.
- `src/app/(main)/encounters/[id]/_components/skill/skill-trackers-section.tsx` renders `SuccessFailureTracker`.
- `src/app/(detail)/campaigns/[id]/_components/campaign-roll-log-section.tsx` renders `RollEntryCard` from `@/components/rolls`.
- `src/app/(main)/encounters/[id]/_components/hooks/use-reorderable-list-drag.ts` is the drag state used by the combat roster actions and the skill view hook.
- `src/app/(detail)/campaigns/[id]/_components/add-character-modal.tsx` renders `Modal` and `PortraitThumb`. It does not render `UnifiedSelectionModal`.
- Combat, skill, and mixed encounter pages render `useEncounterPlayPage`, `EncounterPlayPageGate`, and `EncounterPageHeader`. Combat and mixed also render `OpenTabletopButton`.

### Not read line by line

- `src/app/(main)/encounters/[id]/_components/skill/use-skill-encounter-view.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-encounter-view.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-roster-actions.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-linked-character-sync.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-round-actions.ts`
- `src/app/(main)/encounters/[id]/_components/combat/combat-encounter-helpers.ts` past the `rollInitiative` import
- `src/app/(main)/encounters/[id]/_components/encounter-play-page-shell.tsx` past the exported types
- `src/app/(main)/encounters/[id]/_components/skill/skill-participant-card.tsx` past `getParticipantBorderColor` and its props
- `src/app/(main)/encounters/[id]/_components/skill/skill-success-failure-tracker.tsx` past the total and net lines
- `src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx` past the initiative checkbox, the sort button, the roster section, and the quick-reference card
- `src/app/(detail)/campaigns/[id]/_components/use-campaign-detail-page.ts`
- `src/app/(detail)/campaigns/[id]/_components/campaign-detail-header.tsx` past the name and description editors

### Files

Every path below is a non-test source file. The checker fails if one is missing from this document.

### `src/app/(detail)/campaigns/[id]/_components`

- `src/app/(detail)/campaigns/[id]/_components/add-character-modal.tsx`
- `src/app/(detail)/campaigns/[id]/_components/campaign-detail-header.tsx`
- `src/app/(detail)/campaigns/[id]/_components/campaign-invite-section.tsx`
- `src/app/(detail)/campaigns/[id]/_components/campaign-roll-log-scroll.ts`
- `src/app/(detail)/campaigns/[id]/_components/campaign-roll-log-section.tsx`
- `src/app/(detail)/campaigns/[id]/_components/campaign-roster-section.tsx`
- `src/app/(detail)/campaigns/[id]/_components/character-chip.tsx`
- `src/app/(detail)/campaigns/[id]/_components/use-campaign-detail-page.ts`

### `src/app/(main)/encounters/[id]/_components`

- `src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx`
- `src/app/(main)/encounters/[id]/_components/EncounterCampaignRosterSection.tsx`
- `src/app/(main)/encounters/[id]/_components/EncounterPageHeader.tsx`
- `src/app/(main)/encounters/[id]/_components/OpenTabletopButton.tsx`
- `src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx`
- `src/app/(main)/encounters/[id]/_components/encounter-play-page-shell.tsx`
- `src/app/(main)/encounters/[id]/_components/encounter-view-helpers.ts`

### `src/app/(main)/encounters/[id]/_components/combat`

- `src/app/(main)/encounters/[id]/_components/combat/combat-add-sidebar.tsx`
- `src/app/(main)/encounters/[id]/_components/combat/combat-combatant-list.tsx`
- `src/app/(main)/encounters/[id]/_components/combat/combat-encounter-helpers.ts`
- `src/app/(main)/encounters/[id]/_components/combat/combat-encounter-layout.ts`
- `src/app/(main)/encounters/[id]/_components/combat/combat-encounter-view-props.ts`
- `src/app/(main)/encounters/[id]/_components/combat/combat-round-controls.tsx`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-encounter-view.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-linked-character-sync.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-roster-actions.ts`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-round-actions.ts`

### `src/app/(main)/encounters/[id]/_components/hooks`

- `src/app/(main)/encounters/[id]/_components/hooks/use-linked-campaign-characters.ts`
- `src/app/(main)/encounters/[id]/_components/hooks/use-reorderable-list-drag.ts`

### `src/app/(main)/encounters/[id]/_components/skill`

- `src/app/(main)/encounters/[id]/_components/skill/skill-encounter-view-props.ts`
- `src/app/(main)/encounters/[id]/_components/skill/skill-participant-card.tsx`
- `src/app/(main)/encounters/[id]/_components/skill/skill-participant-list.tsx`
- `src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx`
- `src/app/(main)/encounters/[id]/_components/skill/skill-success-failure-tracker.tsx`
- `src/app/(main)/encounters/[id]/_components/skill/skill-trackers-section.tsx`
- `src/app/(main)/encounters/[id]/_components/skill/use-skill-encounter-view.ts`

### `src/components/character`

- `src/components/character/character-card.tsx`
- `src/components/character/index.ts`
- `src/components/character/portrait-thumb.tsx`

### `src/components/codex`

- `src/components/codex/codex-feat-row.tsx`
- `src/components/codex/codex-skill-row.tsx`
- `src/components/codex/index.ts`


---

## Rolls, rules, tabletop, chrome, marketing, auth, and account cards

56 non-test `.ts` / `.tsx` files. Each one has a production importer. None are unused files.

`src/components/landing/index.ts` exports `HeroSection`, `UniquenessSection`, `HowItWorksSection`, `SecondaryDiscoverySection`, `CommunitySection`, `MarketingLinkButton`, and `CreatorFunnelHero`. It does not export `MarketingExternalButton`, `LandingArtFrame`, `LandingDiceDecor`, or `LandingGradientBackdrop`. Callers import those by path.

`src/components/layout/index.ts` exports `Header`, `Footer`, `ProtectedRoute`, and `SelectionGuard`. It does not export `MainAppChrome` or `MainContentBoundary`.

### Second implementations

- Labeled inputs. `src/components/auth/form-input.tsx` and `src/components/auth/password-input.tsx` each render a raw `<input>`, the same label class (`block text-sm font-medium text-text-primary`), and the same border and focus class string. `PasswordInput` adds `pr-12` and a show/hide button. It does not render `FormInput`. `showStrength` is on `PasswordInputProps` and is not read before the remaining props are spread onto the input.
- Account password fields. `src/app/(main)/my-account/_components/account-security-cards.tsx` and `src/app/(main)/my-account/_components/account-danger-zone-card.tsx` each render `Input` from `@/components/ui` with `type="password"` and their own `<label>`. Neither renders `PasswordInput` or `FormInput`. `src/app/(main)/my-account/_components/account-password-validation.ts` checks length against `PASSWORD_MIN_LENGTH` from `@/lib/password-policy`. It does not restate a number.
- Heroes. `src/components/landing/hero-section.tsx` and `src/components/landing/creator-funnel-hero.tsx` both render `LandingGradientBackdrop` and `LandingDiceDecor` with `variant="hero"`, and both use the same light and dark gradient class string. Neither renders the other. The funnel hero skips the dice when `compact` is set.
- Header menus. In `src/components/layout/header.tsx`, `NavDropdown` and `MobileDropdown` each map `item.dropdown` into links. `NavDropdown` uses `useDisclosureMenu`. `MobileDropdown` uses its own `useState` for open. Neither renders the other.
- Document bodies. `src/components/rules/rulebook-article.tsx` is a class string around MDX children. `src/components/legal/legal-document-body.tsx` walks a copy object and emits headings, paragraphs, and lists. Neither renders the other.
- Auth chrome. `src/components/auth/auth-card.tsx` renders a `div`. It does not render `Card`. `src/components/auth/social-button.tsx` renders a `<button>`. It does not render `Button`.

### Calls a shared component

- `MarketingLinkButton` and `MarketingExternalButton` in `src/components/landing/marketing-button.tsx` each render `Button` from `@/components/ui/button`. The link button uses `next/link`. The external button uses an `<a>`.
- `src/components/rules/rulebook-shell.tsx` renders `RulebookNav`. `RulebookNav` renders `RulebookSearch`. `RulebookSearch` renders `SearchInput`.
- `src/components/layout/main-app-chrome.tsx` renders `Header`, `Footer`, and `MainContentBoundary`. On a minimal chrome route it skips `Header` and `Footer`. `MainContentBoundary` renders `ErrorBoundary`.
- `src/components/layout/protected-route.tsx` reads `useAuthStore` and renders `LoadingState` while loading or logged out. `src/components/layout/selection-guard.tsx` listens for mouseup and clears a detached selection. It returns null. Those two files do different jobs.
- `src/components/providers/auth-provider.tsx` calls `useAuth()` and returns its children. `src/components/providers/theme-provider.tsx` renders `NextThemesProvider`. `src/components/providers/query-provider.tsx` renders `QueryClientProvider`.
- `src/components/tabletop/add-monster-token-modal.tsx` renders `UnifiedSelectionModal` and `SourceFilter`. It does not render `AddCombatantModal`.
- `RollLog` in `src/components/rolls/roll-log.tsx` renders `RollEntryCard` from the same file. The campaign roll log also renders `RollEntryCard`.
- `src/components/about/about-carousel-section.tsx` renders `AboutDiceCarousel`. `src/components/about/about-slide-body.tsx` renders `MarketingExternalButton` and `MarketingLinkButton`. The about page passes that slide body into the carousel as slide content.
- `src/components/onboarding/play-together-modal.tsx` and `src/components/onboarding/sheet-tour-offer-modal.tsx` each render `Modal`. They do not render each other.

### Not read line by line

- `src/components/rolls/roll-context.tsx` past the `RollProvider`, `useRolls`, and `useRollsOptional` exports.
- `src/components/rolls/roll-log.tsx` past `RollLog` rendering `RollEntryCard`, and past the opening markup of `RollEntryCard`.
- `src/components/tabletop/tabletop-canvas.tsx` past the Konva imports, the tool-mode type, and the size and image hooks.
- `src/components/layout/header.tsx` past `NavDropdown` and `MobileDropdown`.
- `src/components/layout/footer.tsx` past the four `FOOTER_COPY` groups and the `MarketingExternalButton` import.
- `src/components/landing/uniqueness-section.tsx`, `how-it-works-section.tsx`, `secondary-discovery-section.tsx`, and `community-section.tsx` past the external-button import in the community file.
- `src/components/landing/landing-art-frame.tsx` past the aspect constant, and `landing-dice-decor.tsx` past the hero and auth opacity strings.
- `src/components/about/about-dice-carousel.tsx` past `getDisplaySlot`, `about-carousel-section.tsx` past the `AboutDiceCarousel` render, and `about-slide-body.tsx` past the two marketing-button renders.
- `src/components/rules/rulebook-nav.tsx` past `ChapterLink` and the `RulebookSearch` render. The rest of the class string in `rulebook-article.tsx` was not read.
- `src/components/onboarding/play-together-modal.tsx` past the persist handlers, `sheet-tour.tsx` past the highlight imports, and `level-up-guide-card.tsx` past the floating-card start.
- `src/app/(main)/my-account/_components/account-profile-card.tsx`, `account-preferences-cards.tsx`, `account-role-limits-card.tsx`, and `use-my-account-page.ts` past the `validateNewAccountPassword` call. `account-helpers.ts` past `usernameCharsetError` and `hasPasswordProvider`. `account-security-cards.tsx` past the password `Input`s.

### `src/components/rolls`

- `src/components/rolls/index.ts`
- `src/components/rolls/roll-log.tsx`

### `src/components/rules`

- `src/components/rules/rulebook-article.tsx`
- `src/components/rules/rulebook-nav.tsx`
- `src/components/rules/rulebook-pager.tsx`
- `src/components/rules/rulebook-search.tsx`
- `src/components/rules/rulebook-shell.tsx`

### `src/components/tabletop`

- `src/components/tabletop/add-monster-token-modal.tsx`
- `src/components/tabletop/tabletop-canvas.tsx`

### `src/components/layout`

- `src/components/layout/footer.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/index.ts`
- `src/components/layout/main-app-chrome.tsx`
- `src/components/layout/main-content-boundary.tsx`
- `src/components/layout/protected-route.tsx`
- `src/components/layout/selection-guard.tsx`

### `src/components/landing`

- `src/components/landing/community-section.tsx`
- `src/components/landing/creator-funnel-hero.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/how-it-works-section.tsx`
- `src/components/landing/index.ts`
- `src/components/landing/landing-art-frame.tsx`
- `src/components/landing/landing-dice-decor.tsx`
- `src/components/landing/landing-gradient-backdrop.tsx`
- `src/components/landing/marketing-button.tsx`
- `src/components/landing/secondary-discovery-section.tsx`
- `src/components/landing/uniqueness-section.tsx`

### `src/components/about`

- `src/components/about/about-carousel-section.tsx`
- `src/components/about/about-dice-carousel.tsx`
- `src/components/about/about-slide-body.tsx`

### `src/components/auth`

- `src/components/auth/auth-card.tsx`
- `src/components/auth/auth-google-terms-notice.tsx`
- `src/components/auth/auth-turnstile.tsx`
- `src/components/auth/form-input.tsx`
- `src/components/auth/index.ts`
- `src/components/auth/password-input.tsx`
- `src/components/auth/social-button.tsx`

### `src/components/legal`

- `src/components/legal/legal-document-body.tsx`

### `src/components/onboarding`

- `src/components/onboarding/index.ts`
- `src/components/onboarding/level-up-guide-card.tsx`
- `src/components/onboarding/play-together-modal.tsx`
- `src/components/onboarding/sheet-tour-offer-modal.tsx`
- `src/components/onboarding/sheet-tour.tsx`

### `src/components/providers`

- `src/components/providers/auth-provider.tsx`
- `src/components/providers/index.ts`
- `src/components/providers/query-provider.tsx`
- `src/components/providers/theme-provider.tsx`

### `src/app/(main)/my-account/_components`

- `src/app/(main)/my-account/_components/account-danger-zone-card.tsx`
- `src/app/(main)/my-account/_components/account-helpers.ts`
- `src/app/(main)/my-account/_components/account-password-validation.ts`
- `src/app/(main)/my-account/_components/account-preferences-cards.tsx`
- `src/app/(main)/my-account/_components/account-profile-card.tsx`
- `src/app/(main)/my-account/_components/account-role-limits-card.tsx`
- `src/app/(main)/my-account/_components/account-security-cards.tsx`
- `src/app/(main)/my-account/_components/use-my-account-page.ts`

---

## UI kit and admin codex

88 non-test `.ts` / `.tsx` files. `src/app/(main)/admin/codex/page.tsx` has no TypeScript importer because Next loads it. Every other file in these two folders has a production importer. None are unused files.

`src/components/ui/index.ts` re-exports every sibling except `src/components/ui/chip-options-panel.tsx`. That panel is imported by `expandable-chip.tsx`.

### Second implementations

- Buttons. `src/components/ui/button.tsx` and `src/components/ui/icon-button.tsx` each have their own `cva` map and render a `<button>` or a Slot. `IconButton` does not render `Button`. `Button` has a size named `icon`. `TabNavOverflowScroller` in `src/components/ui/tab-navigation.tsx` renders its own chevron `<button>` elements. It does not render `IconButton`.
- Labeled fields. `Input`, `Textarea`, and `Select` each render their own control, the same label class (`mb-1.5 block text-sm font-medium text-text-primary`), and the same focus and error border classes. None renders another. `Input`'s error paragraph has `role="alert"`. `Textarea`'s does not. `SearchInput` renders a raw `<input>` with a search icon and a clear button. It does not render `Input`.
- Chips. `DescriptorChip` in `src/components/ui/chip.tsx` renders `Chip`. `ExpandableChip` renders `DescriptorChip` only when `descriptor` is set. Otherwise it draws its own shell from `expandableChipShellClass` and, when options are open, `ChipOptionsPanel`. That shell does not render `Chip`.
- Feedback. `Alert` and `ToastItem` in `src/components/ui/toast.tsx` each use `role="alert"`, a status icon, and `IconButton` to dismiss. `ToastItem` does not render `Alert`. Toasts are portaled. Alerts are inline.
- Cards. `SelectionCard` and `SelectionCardSurface` call `cardVariants` from `src/components/ui/card.tsx`. They do not render `Card`. `SelectionCard` is a `<button>`. `Card` and `SelectionCardSurface` are `div`s.
- Copy suffix. `src/app/(main)/admin/codex/admin-codex-copy-suffix.ts` exports `COPY_NAME_SUFFIX`. `src/app/(main)/admin/codex/use-codex-spreadsheet.ts` declares its own `COPY_NAME_SUFFIX` and does not import that file. Both values are the same characters. The spreadsheet `copyRow` appends that local constant.
- Archetype list. `src/app/(main)/admin/codex/AdminArchetypesTab.tsx` renders `SearchInput` and `GridListRow`. It does not render `CodexBrowseListShell`. The other eight entity tabs do.
- Spreadsheet find bar. `src/app/(main)/admin/codex/codex-spreadsheet-toolbar.tsx` renders a raw text `<input>`, a raw checkbox, and a raw `<select>`. It does not render `SearchInput`, `Checkbox`, or `Select`.
- Feat editors. `src/app/(main)/admin/codex/admin-feat-edit-modal.tsx` renders `AdminFeatEditModalFields`. `src/app/(main)/admin/codex/admin-creature-feat-edit-modal.tsx` renders its own `Input` and `Textarea`. Neither modal renders the other. Both call `useAdminLeveledFeatSession`, `AdminFeatLevelControls`, and `codexFeatEditorIsDirty`.

### Calls a shared component

- `LoadingState` renders `Spinner`. `EmptyState` renders `Button` when its action is an object with `label` and `onClick`. `Alert`, `ToastItem`, and the modal close control render `IconButton`. `Modal` portals into `document.body`.
- The admin codex page renders `TabNavigation`, `TabContentPanel`, and either `CodexSpreadsheetView` or one of the nine tab components.
- Eight entity tabs call `useAdminCodexEntity` and render `CodexBrowseListShell` and `AdminCodexRowActions`. Feats also render `CodexFeatRow`. Skills also render `CodexSkillRow`.
- The edit modals for creature feats, equipment, parts, properties, skills, species, and traits each render `AdminCodexEditModalFooter`, `AdminCodexCopySourceBanner`, and `AdminCodexSourceField`. The feat modal renders the footer and the banner. `AdminFeatEditModalFields` renders `AdminCodexSourceField`. The archetype tab renders the footer. `admin-archetype-editor-meta.tsx` renders the banner and the source field.
- `useAdminCodexDelete` renders `DeleteConfirmModal` and `ConfirmActionModal`. `useCodexEditorLeaveGuard` renders `ConfirmActionModal`. `codexEditorDraftIsDirty` calls `creatorDraftIsDirty`.
- `CodexSpreadsheetView` renders `CodexSpreadsheetToolbar`, `CodexSpreadsheetTable`, and `Modal`. The table renders `CodexSpreadsheetTableRow`. `AdminArchetypeEditor` renders the meta, level-1, guided, and progression sections.

### Not read line by line

- `src/components/ui/modal.tsx` past the scroll-lock helpers and the portal, dialog, and close button.
- `src/components/ui/tab-navigation.tsx` past `TabContentPanel`, the overflow chevrons, and the start of `TabNavigation`.
- `ChipHeaderContent` and the cost lines above the descriptor return in `src/components/ui/expandable-chip.tsx`.
- The floating-ui setup in `src/components/ui/tooltip.tsx` between the early return and `FloatingHelpPanel`. The file does call `useFloatingHelpPopover` and `FloatingHelpPanel`.
- `src/app/(main)/admin/codex/actions.ts`.
- The eight `CodexBrowseListShell` tab files past the shared hook, shell, and row-action imports. `AdminArchetypesTab.tsx` past the workspace hook and the error return.
- The edit-modal bodies past the shared footer, banner, and source field. `admin-feat-edit-modal-fields.tsx`, `admin-codex-feat-level-fields.tsx`, and `admin-part-edit-modal-options.tsx`.
- The archetype editor sections past `AdminArchetypeEditor`'s composition, and the archetype workspace, path form, and write files.
- `use-codex-spreadsheet.ts` past `copyRow`. `codex-spreadsheet-config.ts`, `codex-spreadsheet-helpers.ts`, `codex-spreadsheet-table-row.tsx`, and `codex-column-map.ts`.
- The `*-form.ts` files.

### `src/components/ui`

- `src/components/ui/alert.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/chip-options-panel.tsx`
- `src/components/ui/chip.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/expandable-chip.tsx`
- `src/components/ui/icon-button.tsx`
- `src/components/ui/index.ts`
- `src/components/ui/input.tsx`
- `src/components/ui/modal.tsx`
- `src/components/ui/page-container.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/ui/search-input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/selection-card.tsx`
- `src/components/ui/spinner.tsx`
- `src/components/ui/tab-navigation.tsx`
- `src/components/ui/table-scroll.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/tooltip.tsx`

### `src/app/(main)/admin/codex`

- `src/app/(main)/admin/codex/AdminArchetypesTab.tsx`
- `src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx`
- `src/app/(main)/admin/codex/AdminEquipmentTab.tsx`
- `src/app/(main)/admin/codex/AdminFeatsTab.tsx`
- `src/app/(main)/admin/codex/AdminPartsTab.tsx`
- `src/app/(main)/admin/codex/AdminPropertiesTab.tsx`
- `src/app/(main)/admin/codex/AdminSkillsTab.tsx`
- `src/app/(main)/admin/codex/AdminSpeciesTab.tsx`
- `src/app/(main)/admin/codex/AdminTraitsTab.tsx`
- `src/app/(main)/admin/codex/CodexSpreadsheetView.tsx`
- `src/app/(main)/admin/codex/actions.ts`
- `src/app/(main)/admin/codex/admin-archetype-editor-config.ts`
- `src/app/(main)/admin/codex/admin-archetype-editor-guided.tsx`
- `src/app/(main)/admin/codex/admin-archetype-editor-level1.tsx`
- `src/app/(main)/admin/codex/admin-archetype-editor-meta.tsx`
- `src/app/(main)/admin/codex/admin-archetype-editor-progression.tsx`
- `src/app/(main)/admin/codex/admin-archetype-editor.tsx`
- `src/app/(main)/admin/codex/admin-archetype-path-form.ts`
- `src/app/(main)/admin/codex/admin-archetype-path-rows.tsx`
- `src/app/(main)/admin/codex/admin-archetype-workspace-mutators.ts`
- `src/app/(main)/admin/codex/admin-archetype-workspace-open.ts`
- `src/app/(main)/admin/codex/admin-archetype-workspace-save.ts`
- `src/app/(main)/admin/codex/admin-archetype-workspace-unknown-selections.ts`
- `src/app/(main)/admin/codex/admin-codex-copy-source-banner.tsx`
- `src/app/(main)/admin/codex/admin-codex-copy-suffix.ts`
- `src/app/(main)/admin/codex/admin-codex-edit-modal-footer.tsx`
- `src/app/(main)/admin/codex/admin-codex-feat-level-fields.tsx`
- `src/app/(main)/admin/codex/admin-codex-level-save.ts`
- `src/app/(main)/admin/codex/admin-codex-row-actions.tsx`
- `src/app/(main)/admin/codex/admin-codex-save-target.ts`
- `src/app/(main)/admin/codex/admin-codex-source-field.tsx`
- `src/app/(main)/admin/codex/admin-codex-unsaved-leave-guard.tsx`
- `src/app/(main)/admin/codex/admin-codex-unsaved-leave.ts`
- `src/app/(main)/admin/codex/admin-creature-feat-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-creature-feat-form.ts`
- `src/app/(main)/admin/codex/admin-equipment-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-feat-edit-modal-fields.tsx`
- `src/app/(main)/admin/codex/admin-feat-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-feat-form.ts`
- `src/app/(main)/admin/codex/admin-part-edit-modal-options.tsx`
- `src/app/(main)/admin/codex/admin-part-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-part-form.ts`
- `src/app/(main)/admin/codex/admin-property-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-property-form.ts`
- `src/app/(main)/admin/codex/admin-skill-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-species-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-species-form.ts`
- `src/app/(main)/admin/codex/admin-trait-edit-modal.tsx`
- `src/app/(main)/admin/codex/admin-trait-form.ts`
- `src/app/(main)/admin/codex/codex-archetype-write.ts`
- `src/app/(main)/admin/codex/codex-column-map.ts`
- `src/app/(main)/admin/codex/codex-spreadsheet-config.ts`
- `src/app/(main)/admin/codex/codex-spreadsheet-helpers.ts`
- `src/app/(main)/admin/codex/codex-spreadsheet-table-row.tsx`
- `src/app/(main)/admin/codex/codex-spreadsheet-table.tsx`
- `src/app/(main)/admin/codex/codex-spreadsheet-toolbar.tsx`
- `src/app/(main)/admin/codex/codex-spreadsheet-virtualization.ts`
- `src/app/(main)/admin/codex/page.tsx`
- `src/app/(main)/admin/codex/source-catalog-action.ts`
- `src/app/(main)/admin/codex/use-admin-archetype-selection-options.ts`
- `src/app/(main)/admin/codex/use-admin-archetype-workspace.ts`
- `src/app/(main)/admin/codex/use-admin-codex-delete.tsx`
- `src/app/(main)/admin/codex/use-admin-codex-entity.tsx`
- `src/app/(main)/admin/codex/use-admin-leveled-feat-session.ts`
- `src/app/(main)/admin/codex/use-codex-spreadsheet.ts`

---

## Other admin screens, and codex, character, library, auth, and guided helpers

164 non-test `.ts` / `.tsx` files. `src/app/(main)/admin/page.tsx` and `src/app/(main)/admin/layout.tsx` have no TypeScript importer because Next loads them. `src/lib/codex/fake-supabase.ts` is imported only by tests. Every other file in this slice has a production importer.

### Second implementations

- Admin home cards. `src/app/(main)/admin/page.tsx` repeats the same bordered section, heading, paragraph, and `Button` plus `Link` eight times. The Sources card reads `admin-sources-copy.ts`. The other seven write the strings in the page.
- Official-library delete. Powers, techniques, armaments, creatures, and species each call `apiFetch` with `DELETE`, then invalidate `officialLibraryKeys.all` and `officialLibraryKeys.counts`. None of those files calls a shared delete helper. Techniques and empowered techniques are one component, `AdminPublicTechniquesTab`, with a `mode` prop.
- Species list. `AdminPublicSpeciesTab` renders `OfficialEntityList`. There is no `OfficialSpeciesList`. Powers, techniques, armaments, and creatures render `OfficialPowerList`, `OfficialTechniqueList`, `OfficialItemList`, and `OfficialCreatureList`.
- Image delete. `src/app/(main)/admin/images/admin-image-delete-modal.tsx` renders `Modal` and `Button`. It does not render `DeleteConfirmModal`.
- Discard prompts. `CORE_RULES_EDITOR_DISCARD_TITLE`, `CORE_RULES_EDITOR_DISCARD_CONFIRM`, and `CORE_RULES_EDITOR_DISCARD_CANCEL` are the same strings as the codex editor title, confirm, and cancel. The descriptions differ. `src/app/(main)/admin/core-rules/core-rules-unsaved-leave.ts` does not import the codex file. The core rules page renders `ConfirmActionModal`.
- Password length. `src/lib/password-policy.ts` exports `PASSWORD_MIN_LENGTH` as `6`. The account card check uses that constant. `assertSensitiveAccountReauth` in `src/lib/auth/sensitive-account-auth.ts` rejects an empty password and then calls `signInWithPassword`. It does not import `PASSWORD_MIN_LENGTH`.
- Name length. `CHARACTER_NAME_MAX_LENGTH` in `src/lib/character/character-name-limit.ts` is `100`. `CODEX_SOURCE_NAME_MAX_LENGTH` in `src/lib/codex/sources.ts` is a private `100`. `sources.ts` does not import the character constant.
- Base skill. `isCodexBaseSkill` in `src/lib/character/sheet-skills-display.ts` and in `src/app/(main)/admin/codex/admin-archetype-path-form.ts` are both `base_skill_id == null`. Neither imports the other. `src/lib/guided-creator/curated-skills.ts` keeps a skill only when `base_skill_id !== undefined`. It does not call `isCodexBaseSkill`. The species creator skill options use `base_skill_id == null || base_skill_id === 0`. The loops in `src/lib/game/skill-allocation.ts` and `src/lib/game/skill-allocation-add.ts` skip a skill when the id is null or `0`. `buildGuidedSkillMeta` and `skills-allocation-page.tsx` treat `base_skill_id !== undefined` as sub-skill (so `0` counts as sub). See **Skill and allocation math** for modal add/remove and guided budget reads.
- Table lists. `CODEX_DATA_TABLES` in `src/lib/codex/codex-tables.ts` includes `codex_archetype_levels` and does not include `core_rules`. `CodexCollection` in `src/lib/codex/collections.ts` includes `core_rules` and does not include `codex_archetype_levels`. `CODEX_SOURCE_TABLES` is `COLUMNAR_COLLECTIONS` with `core_rules` filtered out. It is not a third hand-written list.

### Calls a shared component

- `fetchAdminCodexSourceRows` in `src/app/(main)/admin/sources/actions.ts` calls `loadAdminCodexSourceRows`. `admin-source-list.ts` imports the name helpers from `sources.ts`.
- `src/lib/auth/oauth-delete-grant.server.ts` re-exports `src/lib/auth/oauth-delete-grant-core.ts` and adds the cookie options. `buildProtectedRouteLoginUrl` calls `sanitizeRedirectPath` and `buildLoginRedirectUrl`. `buildPathAbilityChipLabels` calls `resolvePathAbilityLabels`.
- The official library page renders `TabNavigation` and one tab component. Empowered techniques are `AdminPublicTechniquesTab` with `mode="empowered"`. The enhanced-items tab renders `OfficialEnhancedList`, `DeleteConfirmModal`, and its own `Modal`.
- The image library page renders `CodexBrowseListShell`. The admin layout calls `requireAdminSession` from `src/lib/admin.ts`. That module was not opened.

### Not read line by line

- `src/app/(main)/admin/sources/page.tsx`, `sources/actions.ts` past the two fetch wrappers, `users/page.tsx`, `roles/page.tsx` past its imports, `changelogs/page.tsx` past its imports, and `images/page.tsx` past its imports.
- `src/app/(main)/admin/core-rules/page.tsx` past the `ConfirmActionModal` import, and the core-rules editor components.
- The official-library tab bodies past the delete calls. `useDeleteOfficialEnhancedItem` and the enhanced edit modal body were not read.
- `src/lib/codex/feat-list.ts`, `skill-list.ts`, and `row-map.ts` past their openings. `sources.ts` past `collapseCodexSourceName` and the length check. `fake-supabase.ts` past the class header.
- `src/lib/character/dirty-patch.ts`, `temp-modifiers.ts`, `sheet-edit-notification.ts`, and `sheet-skills-display.ts` past `isCodexBaseSkill`.
- `src/lib/library/official-power-list.ts` and `official-technique-list.ts` past their imports. `official-item-list.ts` and `power-technique-filters.ts`.
- `src/lib/auth/oauth-delete-grant-core.ts` past the cookie names and payload types.
- The large guided-creator files, including `build-character.ts`, `guided-equipment-l2.ts`, and `curated-skills.ts` past the two `base_skill_id !== undefined` filters.


### `src/app/(main)/admin` pages

- `src/app/(main)/admin/layout.tsx`
- `src/app/(main)/admin/page.tsx`

### `src/app/(main)/admin/changelogs`

- `src/app/(main)/admin/changelogs/page.tsx`

### `src/app/(main)/admin/core-rules`

- `src/app/(main)/admin/core-rules/core-rules-ability-skills-editors.tsx`
- `src/app/(main)/admin/core-rules/core-rules-archetypes-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-armament-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-category-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-combat-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-conditions-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-conditions.ts`
- `src/app/(main)/admin/core-rules/core-rules-crafting-rules-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-damage-types-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-field-editors.tsx`
- `src/app/(main)/admin/core-rules/core-rules-number.ts`
- `src/app/(main)/admin/core-rules/core-rules-progression-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-progression-preview.tsx`
- `src/app/(main)/admin/core-rules/core-rules-rarities-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-recovery-experience-editors.tsx`
- `src/app/(main)/admin/core-rules/core-rules-sizes-editor.tsx`
- `src/app/(main)/admin/core-rules/core-rules-tabs.ts`
- `src/app/(main)/admin/core-rules/core-rules-unsaved-leave.ts`
- `src/app/(main)/admin/core-rules/page.tsx`

### `src/app/(main)/admin/images`

- `src/app/(main)/admin/images/admin-image-delete-modal.tsx`
- `src/app/(main)/admin/images/admin-image-edit-modal.tsx`
- `src/app/(main)/admin/images/page.tsx`

### `src/app/(main)/admin/public-library`

- `src/app/(main)/admin/public-library/AdminPublicCreaturesTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicItemsTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicPowersTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicSpeciesTab.tsx`
- `src/app/(main)/admin/public-library/AdminPublicTechniquesTab.tsx`
- `src/app/(main)/admin/public-library/page.tsx`

### `src/app/(main)/admin/roles`

- `src/app/(main)/admin/roles/page.tsx`

### `src/app/(main)/admin/sources`

- `src/app/(main)/admin/sources/actions.ts`
- `src/app/(main)/admin/sources/admin-sources-copy.ts`
- `src/app/(main)/admin/sources/page.tsx`

### `src/app/(main)/admin/users`

- `src/app/(main)/admin/users/admin-users-directory-state.ts`
- `src/app/(main)/admin/users/admin-users-search-applied.ts`
- `src/app/(main)/admin/users/page.tsx`
- `src/app/(main)/admin/users/use-admin-users-load-more.ts`

### `src/lib/codex`

- `src/lib/codex/admin-source-list.ts`
- `src/lib/codex/admin-source-rows.ts`
- `src/lib/codex/cache-tags.ts`
- `src/lib/codex/codex-tables.ts`
- `src/lib/codex/collection-to-payload-key.ts`
- `src/lib/codex/collections.ts`
- `src/lib/codex/equipment-list.ts`
- `src/lib/codex/fake-supabase.ts`
- `src/lib/codex/feat-ability.ts`
- `src/lib/codex/feat-list.ts`
- `src/lib/codex/feat-requirement-catalog-server.ts`
- `src/lib/codex/feat-restriction-notice.ts`
- `src/lib/codex/feat-tags.ts`
- `src/lib/codex/id-allocation.ts`
- `src/lib/codex/list-rules-source-filter.ts`
- `src/lib/codex/part-type.ts`
- `src/lib/codex/postgrest-pager.ts`
- `src/lib/codex/public-table-select.ts`
- `src/lib/codex/references.ts`
- `src/lib/codex/row-map.ts`
- `src/lib/codex/skill-list.ts`
- `src/lib/codex/source-catalog.ts`
- `src/lib/codex/sources.ts`

### `src/lib/character`

- `src/lib/character/appearance-age.ts`
- `src/lib/character/build-creator-skills.ts`
- `src/lib/character/character-autosave-equal.ts`
- `src/lib/character/character-name-limit.ts`
- `src/lib/character/character-relational-save-errors.ts`
- `src/lib/character/character-size.ts`
- `src/lib/character/collect-sheet-traits.ts`
- `src/lib/character/current-follows-max.ts`
- `src/lib/character/dirty-patch.ts`
- `src/lib/character/innate-power-capacity.ts`
- `src/lib/character/notes-tab-sections.ts`
- `src/lib/character/power-energy-spend.ts`
- `src/lib/character/prune-trait-sheet-state.ts`
- `src/lib/character/quick-shield-table-display.ts`
- `src/lib/character/realtime-merge.ts`
- `src/lib/character/recovery-over-max.ts`
- `src/lib/character/recovery-uses.ts`
- `src/lib/character/relational-lean-save.ts`
- `src/lib/character/resource-value-color.ts`
- `src/lib/character/save-lock.ts`
- `src/lib/character/schema-normalize.ts`
- `src/lib/character/sheet-allocation-reset.ts`
- `src/lib/character/sheet-edit-notification.ts`
- `src/lib/character/sheet-equipment-match.ts`
- `src/lib/character/sheet-header-species-label.ts`
- `src/lib/character/sheet-interaction-mode.ts`
- `src/lib/character/sheet-skills-display.ts`
- `src/lib/character/sheet-trait-display.ts`
- `src/lib/character/temp-modifiers.ts`

### `src/lib/library`

- `src/lib/library/armament-character-context.ts`
- `src/lib/library/armament-filters.ts`
- `src/lib/library/armament-library-labels.ts`
- `src/lib/library/catalog-listing.ts`
- `src/lib/library/character-filter-persistence.ts`
- `src/lib/library/creator-load-selectables.ts`
- `src/lib/library/empowered-technique-display.ts`
- `src/lib/library/fetch-library-tab-counts.ts`
- `src/lib/library/library-tab-counts.ts`
- `src/lib/library/official-catalog-row-filter.ts`
- `src/lib/library/official-creature-list.ts`
- `src/lib/library/official-enhanced-list.ts`
- `src/lib/library/official-item-list.ts`
- `src/lib/library/official-power-list.ts`
- `src/lib/library/official-technique-list.ts`
- `src/lib/library/part-display.ts`
- `src/lib/library/power-technique-categories.ts`
- `src/lib/library/power-technique-character-context.ts`
- `src/lib/library/power-technique-filters.ts`
- `src/lib/library/published-training-points.ts`
- `src/lib/library/source-scope.ts`
- `src/lib/library/use-creator-edit-draft.ts`

### `src/lib/auth`

- `src/lib/auth/auth-page-client.ts`
- `src/lib/auth/captcha.ts`
- `src/lib/auth/oauth-delete-grant-core.ts`
- `src/lib/auth/oauth-delete-grant.server.ts`
- `src/lib/auth/oauth-delete-messages.ts`
- `src/lib/auth/oauth-google-delete-proof.ts`
- `src/lib/auth/sensitive-account-auth.ts`
- `src/lib/auth/session-persistence.ts`
- `src/lib/auth/should-clear-query-cache-on-auth-event.ts`
- `src/lib/auth/should-ignore-null-auth-session.ts`
- `src/lib/auth/sign-in-guard.ts`
- `src/lib/auth/supabase-pkce-cookies.ts`

### `src/lib/guided-creator`

- `src/lib/guided-creator/ancestry-pick-gate.ts`
- `src/lib/guided-creator/ancestry-pick-tasks.ts`
- `src/lib/guided-creator/build-character.ts`
- `src/lib/guided-creator/chapter-progress-label.ts`
- `src/lib/guided-creator/chapter-rail-lock.ts`
- `src/lib/guided-creator/creator-entry-mode.ts`
- `src/lib/guided-creator/curated-skills.ts`
- `src/lib/guided-creator/equipment-catalog-rows.ts`
- `src/lib/guided-creator/equipment-currency.ts`
- `src/lib/guided-creator/equipment-eligibility.ts`
- `src/lib/guided-creator/equipment-phase-candidates.ts`
- `src/lib/guided-creator/equipment-phase-nav.ts`
- `src/lib/guided-creator/equipment-phase-stats.ts`
- `src/lib/guided-creator/feat-selection.ts`
- `src/lib/guided-creator/feats-l2.ts`
- `src/lib/guided-creator/guided-deep-entry-landing.ts`
- `src/lib/guided-creator/guided-equipment-l2.ts`
- `src/lib/guided-creator/guided-skill-recommendations.ts`
- `src/lib/guided-creator/guided-species-resolve.ts`
- `src/lib/guided-creator/guided-substep-nav.ts`
- `src/lib/guided-creator/loadout-pool.ts`
- `src/lib/guided-creator/loadout-tp.ts`
- `src/lib/guided-creator/path-ability-labels.ts`
- `src/lib/guided-creator/path-selection-draft.ts`
- `src/lib/guided-creator/power-technique-display.ts`
- `src/lib/guided-creator/powers-phase-nav.ts`
- `src/lib/guided-creator/powers-techniques-energy-filter.ts`
- `src/lib/guided-creator/powers-techniques-l1-candidates.ts`
- `src/lib/guided-creator/powers-techniques-l2.ts`
- `src/lib/guided-creator/powers-techniques-step-helpers.ts`
- `src/lib/guided-creator/preview-ability-summary.ts`
- `src/lib/guided-creator/resolve-loadout-items.ts`
- `src/lib/guided-creator/reveal-blockers.ts`
- `src/lib/guided-creator/skill-reconcile.ts`
- `src/lib/guided-creator/species-selection-draft.ts`
- `src/lib/guided-creator/substep-satisfaction.ts`
- `src/lib/guided-creator/use-guided-deep-entry-on-arrival.ts`

### `src/lib/password-policy.ts`

- `src/lib/password-policy.ts`

---

## Sheet, crafting, creator, encounter, rolls, rules, tabletop, and loose lib files

150 non-test `.ts` / `.tsx` files. `src/lib/api-input-validation-scan.ts` and `src/lib/api-mutation-guard-route-scan.ts` are imported only by tests. Every other file in this slice has a production importer.

### Second implementations

- Password length. `loginSchema` and `registerSchema` in `src/lib/validation/schemas.ts` each use `.min(6, 'Password must be at least 6 characters')`. They do not import `PASSWORD_MIN_LENGTH`.
- Username length. `registerSchema` uses `.max(24)`. `src/lib/username-rules.ts` has a private `USERNAME_MAX_LEN` of `24`. The schema also calls `validateUsername`. The `24` on the schema is not that constant.
- Search escaping. `buildAdminUsersIlikePattern` in `src/lib/admin-users-search.ts` repeats the `/[%_\\]/` replace from `escapeIlikePattern` in `src/lib/ilike-pattern.ts`. It does not import that function.
- Official table names. `OFFICIAL_TABLE_BY_TYPE` is written in `src/lib/official-library-server.ts` and again in `src/lib/official-library-get-payload.ts`. The payload file imports the fetch functions and not the map. `TABLE_MAP` in `src/app/api/official/[type]/route.ts` is the same five table names. That route was not read past the map. `OFFICIAL_LIBRARY_COUNT_TABLES` uses the key `empoweredTechniques`. `USER_LIBRARY_COLUMNAR_TABLES` uses `empowered-techniques`.
- Description length. `CODEX_DESC_MAX_LENGTH` in `src/lib/codex-columnar-keys.ts` and `CREATOR_DESCRIPTION_MAX_LENGTH` in `src/lib/creator/creator-text-limits.ts` are both `10000`. Neither file imports the other. `CODEX_NAME_MAX_LENGTH` is `200`. The character and creator name max is `100`.
- Redirect paths. `buildCanonicalAuthRedirectUrl` and `buildAuthRedirectUrl` call `sanitizeRedirectPath` unless `sanitizeUserRedirect` is false. That branch only checks that the string starts with `/` and does not contain `://`.
- Admin session. `requireLiveAdminSession` calls `isAdmin`. It does not call `requireAdminSession`.
- Dice. `rollDie` is `Math.floor(Math.random() * max) + 1`. The initiative helpers in `encounter-view-helpers.ts` and `add-combatant-modal.tsx` hardcode `20`, add acuity, and do not call `rollDie`.
- Ids. `generateId` and `generateRollId` each build a string from `Math.random`. They do not call each other.
- Guest sign-in. The character migration and the encounter migration each keep their own flag and their own in-flight slot. Both call `beginSingleFlight`. They do not call each other. The upload bodies were not read line by line.
- Ability labels. `formatAbilityLabel` capitalizes the first character. It does not read `ABILITY_FILTER_OPTIONS`. `ABILITY_OPTIONS` and `ABILITY_FILTER_OPTIONS` are two lists of the same six keys.

### Calls a shared component

- `creator-text-limits.ts` sets `CREATOR_NAME_MAX_LENGTH` to `CHARACTER_NAME_MAX_LENGTH` and calls `clampTextToLength` and `insertTextToLength`. `campaign-roll-limits.ts` uses `CREATOR_NAME_MAX_LENGTH`.
- `getDefaultRolePolicy` copies the fields from `ROLE_LIMITS`.
- `rollParsedDamage` calls `rollDie` and `parseDamageRollGroups`.
- `official-library-get-payload.ts` calls `fetchOfficialColumnarRows` and `fetchOfficialSpeciesRows`. `character-view-enrichment-server.ts` imports the collectors from `character-view-enrichment.ts`. `library-columnar.ts` imports the key lists from `library-columnar-keys.ts`.
- `src/lib/constants/site-copy.ts` re-exports `src/lib/constants/copy`. `src/lib/data-enrichment.ts` re-exports the `data-enrichment` folder. That folder was not opened. `src/lib/validation/index.ts` re-exports `schemas.ts`. `assertCodexAdminBodyShapes` calls `codexAdminCamelBodyShapeError`.
- `src/lib/utils/index.ts` does not re-export `motion.ts` or `stabilize-vertical-scroll.ts`. Toast imports the motion file by path. The guided catalog list imports the scroll helper by path. The barrel also omits `rowMatchesNormalizedId` and `resolveNormalizedRefLabel`.

### Not read line by line

- `src/lib/constants/copy/about-copy.ts`, `guided-creator-copy.ts`, `privacy-copy.ts`, and `terms-copy.ts`.
- `src/lib/api-validation.ts`, `library-selectable-builders.ts`, `library-sync.ts`, `library-columnar.ts` past its imports, `library-persisted-contract.ts` past its imports, `codex-persisted-contract.ts` past its imports, `proficiencies.ts`, `leveled-feats.ts`, `id-constants.ts`, and `rate-limit.ts`.
- `character-view-enrichment.ts` past its header, `character-view-enrichment-server.ts` past its imports, and `src/lib/encounter/character-resource-sync.ts` past the suppress functions.
- `src/lib/tabletop/server.ts` and `src/lib/tabletop/tokens.ts`.
- `src/lib/utils/duration.ts` and `src/lib/utils/string.ts`.
- `src/lib/codex-columnar-keys.ts` past the two length constants, and the two API scan files past their headers.
- `src/lib/crafting/crafting-session-persist.ts` past the first schemas.


### `src/lib/character-sheet`

- `src/lib/character-sheet/add-modal-existing-ids.ts`

### `src/lib/crafting`

- `src/lib/crafting/crafting-session-persist.ts`

### `src/lib/creator`

- `src/lib/creator/creator-edit-query.ts`
- `src/lib/creator/creator-empty-overwrite.ts`
- `src/lib/creator/creator-missing-name-message.ts`
- `src/lib/creator/creator-save-as-copy.ts`
- `src/lib/creator/creator-save-error.ts`
- `src/lib/creator/creator-text-limits.ts`
- `src/lib/creator/creator-unsaved-guard.ts`
- `src/lib/creator/private-library-name-save.ts`

### `src/lib/encounter`

- `src/lib/encounter/character-resource-sync.ts`
- `src/lib/encounter/unique-campaign-characters.ts`

### `src/lib/rolls`

- `src/lib/rolls/campaign-roll-attribution.ts`
- `src/lib/rolls/campaign-roll-limits.ts`
- `src/lib/rolls/die.ts`
- `src/lib/rolls/modifier-label.ts`
- `src/lib/rolls/parse-damage-string.ts`
- `src/lib/rolls/personal-roll-log-storage.ts`
- `src/lib/rolls/roll-log-layout.ts`
- `src/lib/rolls/roll-parsed-damage.ts`

### `src/lib/rules`

- `src/lib/rules/rulebook-callout.ts`
- `src/lib/rules/rulebook-metadata.ts`
- `src/lib/rules/rulebook-search-load.ts`
- `src/lib/rules/rulebook-search.ts`
- `src/lib/rules/rulebook.ts`

### `src/lib/tabletop`

- `src/lib/tabletop/grid.ts`
- `src/lib/tabletop/server.ts`
- `src/lib/tabletop/tokens.ts`
- `src/lib/tabletop/visibility.ts`

### `src/lib/validation`

- `src/lib/validation/index.ts`
- `src/lib/validation/schemas.ts`

### `src/lib/constants`

- `src/lib/constants/ability-effect-blurbs.ts`
- `src/lib/constants/copy/about-copy.ts`
- `src/lib/constants/copy/archetype-category-copy.ts`
- `src/lib/constants/copy/auth-copy.ts`
- `src/lib/constants/copy/footer-copy.ts`
- `src/lib/constants/copy/guided-creator-copy.ts`
- `src/lib/constants/copy/index.ts`
- `src/lib/constants/copy/landing-copy.ts`
- `src/lib/constants/copy/legal-copy-types.ts`
- `src/lib/constants/copy/nav-copy.ts`
- `src/lib/constants/copy/onboarding-copy.ts`
- `src/lib/constants/copy/path-ability-copy.ts`
- `src/lib/constants/copy/privacy-copy.ts`
- `src/lib/constants/copy/resources-copy.ts`
- `src/lib/constants/copy/rules-copy.ts`
- `src/lib/constants/copy/shared-copy.ts`
- `src/lib/constants/copy/terms-copy.ts`
- `src/lib/constants/creator-layer-governance.ts`
- `src/lib/constants/site-copy.ts`
- `src/lib/constants/skills.ts`

### `src/lib/utils`

- `src/lib/utils/action-type.ts`
- `src/lib/utils/cn.ts`
- `src/lib/utils/defined.ts`
- `src/lib/utils/duration.ts`
- `src/lib/utils/exact-optional.ts`
- `src/lib/utils/id.ts`
- `src/lib/utils/index.ts`
- `src/lib/utils/motion.ts`
- `src/lib/utils/normalize-id.ts`
- `src/lib/utils/number.ts`
- `src/lib/utils/object.ts`
- `src/lib/utils/stabilize-vertical-scroll.ts`
- `src/lib/utils/string.ts`

### Loose files directly under `src/lib/`

- `src/lib/admin-users-search.ts`
- `src/lib/admin.ts`
- `src/lib/api-client.ts`
- `src/lib/api-error.ts`
- `src/lib/api-input-validation-guard.ts`
- `src/lib/api-input-validation-scan.ts`
- `src/lib/api-mutation-guard-route-scan.ts`
- `src/lib/api-mutation-guard.ts`
- `src/lib/api-validation.ts`
- `src/lib/attack-mode.ts`
- `src/lib/auth-email-site-origin.ts`
- `src/lib/auth-errors.ts`
- `src/lib/auth-redirect.ts`
- `src/lib/campaign-invite-code.ts`
- `src/lib/campaign-invite.ts`
- `src/lib/campaign-roster.ts`
- `src/lib/character-library-section-visibility.ts`
- `src/lib/character-library-tab-visibility.ts`
- `src/lib/character-list-columns.ts`
- `src/lib/character-persistence-server.ts`
- `src/lib/character-save.ts`
- `src/lib/character-view-enrichment-server.ts`
- `src/lib/character-view-enrichment.ts`
- `src/lib/choice-trait.ts`
- `src/lib/codex-archetype-path-save-validation.ts`
- `src/lib/codex-changelog-display.ts`
- `src/lib/codex-changelog.ts`
- `src/lib/codex-columnar-keys.ts`
- `src/lib/codex-mutation-validation.ts`
- `src/lib/codex-persisted-contract.ts`
- `src/lib/core-rules-server.ts`
- `src/lib/creator-save-handoff.ts`
- `src/lib/creature-chip-tier.ts`
- `src/lib/crop-image.ts`
- `src/lib/data-enrichment.ts`
- `src/lib/empty.ts`
- `src/lib/ensure-user-profile.ts`
- `src/lib/entity-image-enrich-server.ts`
- `src/lib/entity-image-url.ts`
- `src/lib/guest-character-migration.ts`
- `src/lib/guest-character-storage.ts`
- `src/lib/guest-encounter-migration.ts`
- `src/lib/guest-encounter-storage.ts`
- `src/lib/guest-migration-lock.ts`
- `src/lib/id-constants.ts`
- `src/lib/ilike-pattern.ts`
- `src/lib/level-up-guide.ts`
- `src/lib/leveled-feats.ts`
- `src/lib/library-columnar-keys.ts`
- `src/lib/library-columnar.ts`
- `src/lib/library-image-write.ts`
- `src/lib/library-mutation-validation.ts`
- `src/lib/library-persisted-contract.ts`
- `src/lib/library-selectable-builders.ts`
- `src/lib/library-sync.ts`
- `src/lib/list-row-image.ts`
- `src/lib/modal-close-click.ts`
- `src/lib/modal-unmount-click-guard.ts`
- `src/lib/network-error.ts`
- `src/lib/official-library-get-payload.ts`
- `src/lib/official-library-server.ts`
- `src/lib/onboarding-preferences.ts`
- `src/lib/owner-library-for-view.ts`
- `src/lib/placeholder-art.ts`
- `src/lib/portrait-storage.ts`
- `src/lib/portrait.ts`
- `src/lib/power-variant-chips.ts`
- `src/lib/proficiencies.ts`
- `src/lib/profile-display-name.ts`
- `src/lib/rate-limit.ts`
- `src/lib/realms-image-consumers.ts`
- `src/lib/realms-images-list-cursor.ts`
- `src/lib/realms-images-server.ts`
- `src/lib/realms-images.ts`
- `src/lib/role-limits.ts`
- `src/lib/role-policy.ts`
- `src/lib/role-quota-messages.ts`
- `src/lib/roll-timestamp.ts`
- `src/lib/safe-redirect.ts`
- `src/lib/sheet-tour-highlight.ts`
- `src/lib/site-url.ts`
- `src/lib/skill-extra-descriptions.ts`
- `src/lib/species-skill-migration.ts`
- `src/lib/stepper-value-memory.ts`
- `src/lib/username-rules.ts`
- `src/lib/validate-image.ts`

---

## Ancestry, API cache, chips, enrichment, lists, and clients

68 non-test `.ts` / `.tsx` files. `src/lib/glr/validate-glr-chrome-spacing.ts` is imported only by its test. `next.config.ts` imports `src/lib/security/content-security-policy.ts` and `src/lib/security/next-app-flags.ts`. Every other file in this slice has a production importer under `src`.

### Second implementations

- Library lookup. `findInLibrary` matches an id with `String(reference.id)` and a name with `toLowerCase()`. It does not call `findByNormalizedId`. That helper lowercases and trims, and it also matches `docId`.
- Power and technique enrichment. `enrichPowers` and `enrichTechniques` each call `findInLibrary` on the user library and then the public library. They do not call each other. A found power keeps the character row id. A found technique returns `libraryItem.id`. `enrichItems` is a third function. It was not read past its opening.
- Detail options. `powerToDetailOption` calls `derivePowerDisplay`. `techniqueToDetailOption` calls `deriveTechniqueDisplay`. They do not call each other. `resolveCombatDetailOption` calls one or the other.
- Species sizes. `getSpeciesSizeOptions` returns the `sizes` array when it has entries, and otherwise the single `size`. `combineSpeciesSizes` reads both fields on two species, unions them, and stops at 4. It does not call `getSpeciesSizeOptions`.
- Chip variants. `gridListChipVariant` maps `warning` to `listWarning` and `success` to `listSuccess`. `descriptorChipVariantForGridList` maps those same categories to `warning` and `success`. `gridListChipStyleVariant` calls one or the other. `partChipVariant` and `rarityChipVariant` are separate maps.
- Supabase clients. `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `createPublicClient` each build a client. They do not call each other. The browser and server factories use the publishable key and cookies. The public factory uses the publishable key and no cookies. `createServiceRoleClient` uses the service-role key.
- Session user. `sessionUserFromClaims` reads `sub`. `sessionUserFromAuthUser` reads `user.id`. `requireAuth` calls `getSession`. `requireLiveUser` calls `auth.getUser` and does not call `getSession`.
- Page access. `assertCharacterSheetHttpAccess` and `assertCampaignDetailHttpAccess` each call `fetchInternalApi` and then `denyResourcePage`. The character check returns early for a guest id. They do not call each other.

### Calls a shared component

- `enrichCharacterData` calls `enrichPowers`, `enrichTechniques`, and `enrichItems`. `getCharacterAllowedSizes` calls `getSpeciesSizeOptions`.
- `officialEntityBrowseChrome` calls `glrListChrome`. `createBrowserSupabaseCookieMethods` calls `createSupabaseAuthCookieMethods`. The server client uses that same cookie helper.
- `src/proxy.ts` calls `updateSession` and `redirectOAuthCodeToCallback`. `next.config.ts` uses `ACCOUNT_PATH_ALIAS_REWRITE` and `buildContentSecurityPolicy`.
- `src/lib/glr/index.ts` does not re-export `validate-glr-chrome-spacing.ts`. That file says the barrel must not. The barrel also omits `assertRowFactCoverage`. Tests import that function from the file. `src/lib/observability/index.ts` does not re-export `sentry-client-filter.ts`. `src/instrumentation-client.ts` imports it by path. `src/lib/detail-option/index.ts` does not re-export `format-recovery.ts`. `builders.ts` imports it.

### Not read line by line

- `src/lib/ancestry/ancestry-selection.ts` past `combineSpeciesSizes`.
- `src/lib/chip/list-row-metadata.ts`.
- `src/lib/data-enrichment/clean-for-save.ts`, `enrich-items.ts` past its opening, and `enrich-character.ts` past the three calls.
- `src/lib/detail-option/compact-facts.ts`.
- `src/lib/glr/glr-fact-catalog.ts`, `glr-density.ts`, `resolve-glr-fact-layout.ts`, `validate-glr-facts.ts`, and `validate-glr-chrome-spacing.ts` past its header.
- `src/lib/supabase/middleware.ts` past `isHardProtectedPath`, `supabase-auth-cookies.ts` past `createSupabaseAuthCookieMethods`, `database.ts`, `cached-public-read.ts`, and `verified-claims.ts`.
- `src/lib/tooltips/floating-help.tsx` past the placement helper.


### `src/lib/ancestry`

- `src/lib/ancestry/ancestry-selection.ts`
- `src/lib/ancestry/species-size-options.ts`

### `src/lib/api`

- `src/lib/api/public-catalog-cache-invalidation.ts`
- `src/lib/api/public-catalog-cache-purge.ts`
- `src/lib/api/public-catalog-list-cache-tags.ts`
- `src/lib/api/public-cdn-cache.ts`

### `src/lib/chip`

- `src/lib/chip/chip-data-helpers.ts`
- `src/lib/chip/chip-size-tokens.ts`
- `src/lib/chip/descriptor-chip-variants.ts`
- `src/lib/chip/expandable-chip-props.ts`
- `src/lib/chip/expandable-chip-shell.ts`
- `src/lib/chip/full-row-expand-layout.ts`
- `src/lib/chip/grid-list-chip-utils.ts`
- `src/lib/chip/grid-list-chip-variant.ts`
- `src/lib/chip/list-row-metadata.ts`
- `src/lib/chip/part-chip-variant.ts`
- `src/lib/chip/part-chips-from-display.ts`
- `src/lib/chip/part-data.ts`
- `src/lib/chip/rarity-chip-variant.ts`
- `src/lib/chip/species-skill-chips.ts`

### `src/lib/data-enrichment`

- `src/lib/data-enrichment/clean-for-save.ts`
- `src/lib/data-enrichment/enrich-character.ts`
- `src/lib/data-enrichment/enrich-items.ts`
- `src/lib/data-enrichment/enrich-powers.ts`
- `src/lib/data-enrichment/enrich-techniques.ts`
- `src/lib/data-enrichment/find-in-library.ts`
- `src/lib/data-enrichment/types.ts`

### `src/lib/detail-option`

- `src/lib/detail-option/builders.ts`
- `src/lib/detail-option/combat-builder.ts`
- `src/lib/detail-option/compact-facts.ts`
- `src/lib/detail-option/equipment-builder.ts`
- `src/lib/detail-option/format-recovery.ts`
- `src/lib/detail-option/index.ts`

### `src/lib/glr`

- `src/lib/glr/glr-chrome-spacing-norms.ts`
- `src/lib/glr/glr-density.ts`
- `src/lib/glr/glr-fact-catalog.ts`
- `src/lib/glr/glr-list-chrome.ts`
- `src/lib/glr/glr-surface-bindings.ts`
- `src/lib/glr/index.ts`
- `src/lib/glr/official-entity-browse-chrome.ts`
- `src/lib/glr/resolve-glr-fact-layout.ts`
- `src/lib/glr/validate-glr-chrome-spacing.ts`
- `src/lib/glr/validate-glr-facts.ts`

### `src/lib/observability`

- `src/lib/observability/config.ts`
- `src/lib/observability/index.ts`
- `src/lib/observability/report-error.ts`
- `src/lib/observability/sentry-client-filter.ts`

### `src/lib/routes`

- `src/lib/routes/funnel-chrome.ts`

### `src/lib/security`

- `src/lib/security/content-security-policy.ts`
- `src/lib/security/next-app-flags.ts`

### `src/lib/server`

- `src/lib/server/assert-resource-http-access.ts`
- `src/lib/server/internal-api-fetch.ts`
- `src/lib/server/resource-access-unavailable.ts`

### `src/lib/supabase`

- `src/lib/supabase/auth-cookies.ts`
- `src/lib/supabase/browser-auth-cookies.ts`
- `src/lib/supabase/cached-public-read.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/database.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/proxy-oauth-redirect.ts`
- `src/lib/supabase/public-client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/session.ts`
- `src/lib/supabase/supabase-auth-cookies.ts`
- `src/lib/supabase/verified-claims.ts`

### `src/lib/tooltips`

- `src/lib/tooltips/floating-help.tsx`
- `src/lib/tooltips/markdown-lite.tsx`

### `src/lib/ui`

- `src/lib/ui/status-surface-classes.ts`

---

## Game formulas and creator calculators the barrels re-export

20 non-test files. Every one has a production importer. The sibling files those barrels do not re-export were opened in the section below.

### Second implementations

- Currency growth. `calculateCreatureCurrency` in `src/lib/game/formulas.ts` uses `CREATURE_CONSTANTS.BASE_CURRENCY` and `CREATURE_CONSTANTS.CURRENCY_GROWTH`, both `200` and `1.45`. `computeStartingCurrency` in `src/lib/guided-creator/equipment-currency.ts` uses `CHARACTER_STARTING_CURRENCY` (`200`) and a private `CURRENCY_GROWTH` of `1.45`. It does not import the creature constant. Level 1 returns the character constant. Above that it uses the same `Math.ceil(base * growth ** (level - 1))` shape.
- Damage text. `formatPowerDamage` joins `amount + "d" + size + type` for an array. `formatTechniqueDamage` returns `"+" + amount + "d" + size` for one object. They do not call each other.
- Action from parts. `power-calc.ts` and `technique-calc.ts` each have a private `computeActionType`. Both call `deriveActionType`. The technique one also matches the names `Reaction`, `Quick or Free Action`, and `Long Action`. The power one does not. `computeActionTypeFromSelection` in both files is the same `actionTypeFromSelection` from `src/lib/calculators/action-type.ts`.
- Inventory kind. `normalizeCreatureInventoryType` returns `equipment` when the type is not weapon, armor, or shield. `normalizeArmamentKind` in `src/lib/library/official-item-list.ts` returns `null` for that case. They do not call each other.
- Creature speed. `calculateCreatureSpeed` calls `calculateSpeed` and then adds Speedy and Slow. It is not a second speed formula.

### Calls a shared component

- `derivePowerDisplay` calls `deriveComposedPowerDisplay`, and if that returns null it calls `derivePlainPowerDisplay`. `derivePlainPowerDisplay` calls `calculatePowerCosts`.
- `calculateEmpoweredTechniqueCosts` calls `calculatePowerCosts` and `calculateTechniqueCosts`, then multiplies the power energy by `getTechniquePartEnergyContribution`. `calculateTechniqueCosts` writes that same base-plus-options sum again and does not call `getTechniquePartEnergyContribution`.
- `buildEmpoweredAdvancedCalculationGroups` calls `buildPowerEnergySectionGroups` and `buildTechniqueEnergySectionGroups`. The technique breakdown imports `formatEnergyNumber` and `formatPercentagePartModifier` from the power breakdown. It keeps its own section id list: action, attack, damage, parts.
- `abilityDefenseBonusesFromAbilities` calls `calculateDefenses`. `formulas.ts` imports the fallback numbers from `constants.ts`.

### Not read line by line

- See **Health, energy, and cost math** for formula bodies. Character-check and path files listed under **Not read line by line** below are mapped in **Character-check and path math** when read.

### Files

- `src/lib/game/calculations.ts`
- `src/lib/game/constants.ts`
- `src/lib/game/creature-inventory.ts`
- `src/lib/game/creature-level-display.ts`
- `src/lib/game/formulas.ts`
- `src/lib/game/unarmed-prowess.ts`
- `src/lib/calculators/empowered-energy-breakdown.ts`
- `src/lib/calculators/empowered-overlap-parts.ts`
- `src/lib/calculators/empowered-technique-calc.ts`
- `src/lib/calculators/item-calc.ts`
- `src/lib/calculators/item-cost-breakdown.ts`
- `src/lib/calculators/mechanic-builder.ts`
- `src/lib/calculators/no-attack-creator-warning.ts`
- `src/lib/calculators/power-calc.ts`
- `src/lib/calculators/power-composition.ts`
- `src/lib/calculators/power-energy-breakdown.ts`
- `src/lib/calculators/power-mechanic-constants.ts`
- `src/lib/calculators/technique-calc.ts`
- `src/lib/calculators/technique-creator-section-costs.ts`
- `src/lib/calculators/technique-energy-breakdown.ts`

`src/lib/game/index.ts` and `src/lib/calculators/index.ts` re-export those modules. A dropped file in either folder fails `scripts/validate-feature-index.js`.

---

## Public codex, library, sheets, campaigns, auth, and the styleguide

Every non-test file in these folders has a production importer, or it is a page, layout, or route that Next loads. None of these files were unused.

### Second implementations

- My Codex. Seven tabs return `CodexMyCodexEmpty`. `CodexEquipmentTab` returns its own `EmptyState` when `codexMode` is `my`. `CodexSpeciesTab` loads `useUserSpecies` in that mode and does not render `CodexMyCodexEmpty`.
- Create links. `src/app/(main)/library/page.tsx` keeps a `TABS` list of create hrefs and labels. `src/app/(main)/library/components/library-entity-tab.types.ts` keeps another. The enhanced label is `From Crafting` on the page and `Go to Crafting` in `ENHANCED_LIBRARY_LABELS`. They do not import each other.
- Character cap alert. `src/app/(main)/characters/page.tsx` renders an `Alert` titled `Character limit reached` from `useCharacterQuota`. `CharacterQuotaAlert` in `src/app/(main)/characters/use-character-quota.tsx` renders that same title. The characters page does not render `CharacterQuotaAlert`. The new-character chooser does.
- Power cap. The library page calls `isAtRoleQuota` and renders its own `Alert` titled `Power limit reached`. It does not call `useCharacterQuota`.
- Password length. `changeAccountPasswordAction` in `src/app/(auth)/actions.ts` rejects `newPassword.length < 6`. `resetPasswordSchema` in `src/app/(auth)/reset-password/page.tsx` uses `.min(8)`. `loginWithPasswordAction` in `src/app/(auth)/auth-actions.ts` rejects only an empty password, then calls `signInWithPassword`. Login and register import `loginSchema` and `registerSchema`.
- Upload size. `src/app/api/upload/profile-picture/route.ts` and `src/app/api/upload/portrait/route.ts` each set `MAX_SIZE` to `5 * 1024 * 1024` and call `detectImageMime`. Neither imports the other's constant.
- Skill defaults. `prepareMixedEncounter` and `prepareSkillEncounter` each fill missing skill fields. Mixed does not call the skill function. Mixed sets `useInitiative` to true. Skill fills missing success and failure counts through `computeSkillRollResult`.
- Library tab clamp. `useCharacterSheetPage` and the campaign character view page each call `resolveLibraryActiveTab` and then `setLibraryActiveTab` when the resolved tab differs. The view page does not call `useCharacterSheetPage`.
- Campaign character cap. `joinCampaignAction` and `addCharacterToCampaignAction` each compare the roster length to `MAX_CAMPAIGN_CHARACTERS` before their own later work. They do not call each other. The constants live in `src/app/(main)/campaigns/constants.ts`.

### Calls a shared component

- The nine public codex tabs render `CodexBrowseListShell`. Feats render `CodexFeatRow`. Skills render `CodexSkillRow`. The other tabs render `GridListRow`.
- `src/app/(main)/codex/page.tsx` renders those nine tabs twice, once for each `codexMode`.
- Library powers, techniques, items, creatures, and enhanced items render `UserLibraryEntityTabShell`. Powers, techniques, items, and creatures also call `useLibraryEntitySync` and `useLibraryDuplicateConfirm`.
- `LibraryPublicContent` has one `useAddToLibraryFlow`. Powers, techniques, items, and creatures each render the matching `Official*List`.
- `src/app/(detail)/characters/[id]/page.tsx` renders `CharacterSheetRoute`. That route calls `useCharacterSheetPage`, which calls `useCharacterSheetPageData`, `useCharacterSheetPageUi`, and `useCharacterSheetActions`. `calculateStats` in `src/app/(detail)/characters/[id]/character-sheet-utils.ts` returns `calculateAllStats`. `CharacterSheetModals` renders the sheet modals from context.
- `src/app/(detail)/campaigns/[id]/page.tsx` renders `campaign-detail-route.tsx`, which renders the campaign detail components. The campaign character view page calls `useCharacterSheetDerived` and `CharacterSheetBody`. It does not render `CharacterSheetModals`.
- Mixed encounter renders `CombatEncounterView` and `SkillEncounterView` and one `RollLog`. The skill page renders `SkillEncounterView` with `showRollLog`. Both call `useEncounterPlayPage`.
- The campaigns page calls `createCampaignAction` and `joinCampaignAction`. The join button uses `isValidInviteCodeFormat`, and the action calls that same function.
- `isStyleguideServed` returns the opposite of `isProductionIndexingEnabled`. The styleguide layout calls it and then `notFound`.

### Not read line by line

- Codex tab bodies past the My Codex branch: `CodexFeatsTab.tsx`, `CodexSkillsTab.tsx`, `CodexSpeciesTab.tsx`, `CodexArchetypesTab.tsx`, `CodexEquipmentTab.tsx`, `CodexPartsTab.tsx`, `CodexPropertiesTab.tsx`, `CodexTraitsTab.tsx`, `CodexCreatureFeatsTab.tsx`.
- Library tab bodies past the shell: `LibraryPowersTab.tsx`, `LibraryTechniquesTab.tsx`, `LibraryItemsTab.tsx`, `LibraryCreaturesTab.tsx`, `LibraryEnhancedTab.tsx`, and `UserLibraryEntityTabShell.tsx`.
- `use-character-sheet-page-data.ts`, `use-character-sheet-page.ts` past the hook calls, `use-character-sheet-page-ui.ts` past the visibility save, `character-sheet-route.tsx` past the model fields, and `CharacterSheetModals.tsx` past the context read.
- The campaign character view page past `useCharacterSheetDerived`, and `campaign-detail-route.tsx` past the roster.
- `src/app/(main)/campaigns/page.tsx` past the join handler, `src/app/(main)/campaigns/actions.ts` past the two roster-length checks, and `src/app/(main)/campaigns/[id]/tabletop/page.tsx` past its imports.
- `src/app/(auth)/actions.ts` past the new-password length check, `src/app/(auth)/auth-actions.ts` past the empty-password check, and the login, register, and reset-password form bodies.
- `src/app/api/upload/profile-picture/route.ts` past the size check, and `src/app/dev/styleguide/page.tsx` past its imports.

### Files that were missing from this index

- `src/app/(main)/library/components/UserLibraryEntityTabShell.tsx`
- `src/app/(main)/library/components/library-entity-tab.types.ts`
- `src/app/(main)/library/hooks/use-library-entity-sync.ts`
- `src/app/(main)/library/hooks/use-library-duplicate-confirm.ts`
- `src/app/(detail)/characters/[id]/CharacterSheetModals.tsx`
- `src/app/(detail)/characters/[id]/character-sheet-utils.ts`
- `src/app/(main)/characters/use-character-quota.tsx`
- `src/app/(main)/campaigns/constants.ts`
- `src/app/(auth)/forgot-password/forgot-password-action-result.ts`
- `src/app/(auth)/login/login-action-result.ts`
- `src/app/(main)/encounters/[id]/mixed/prepare-mixed-encounter.ts`
- `src/app/(main)/encounters/[id]/skill/prepare-skill-encounter.ts`
- `src/app/api/upload/profile-picture/profile-picture-storage.ts`
- `src/app/dev/styleguide/styleguide-gate.ts`
---

## Hooks, services, and stores the barrels re-export

Every non-test file under `src/hooks`, `src/services`, and `src/stores` has a production importer, or it is a barrel. The barrel-gap names already listed above were not re-read. None of the files in this section were unused.

### Second implementations

- Name lookup. `findLibraryItemsByName` in `src/services/library-service.ts` asks the server with `?name=`. `findOfficialLibraryItemByName` in the same file loads the official list and compares trimmed lowercase names. They do not call each other.
- Trait lookup. `findTraitByIdOrName` in `src/hooks/codex-types.ts` matches id, then lowercase name, then a sanitized name. `findByIdOrName` in `src/lib/id-constants.ts` matches id, then a trimmed lowercase name. They do not call each other.
- Empowered rows. `useLoadModalLibrary` concatenates the user list and the public list and calls `buildEmpoweredPowerSelectableItem`. `loadEmpoweredRawItems` also merges those lists, then drops a repeated id, and the load modal does not call it.
- Official enhanced items. `useCreateOfficialEnhancedItem` and `useDeleteOfficialEnhancedItem` call `apiFetch` on `/api/official/enhanced-items`. User enhanced items call `src/services/enhanced-items-service.ts`. The official mutations do not call that service.
- Character reads. `getCharacter` uses `/api/characters`. `getCampaignCharacterForView` uses `/api/campaigns/.../characters/...`. `useCampaignCharacterView` calls the campaign function. It does not call `getCharacter`.

### Calls a shared component

- `useCraftingSessions`, `useCraftingSession`, `useCreateCraftingSession`, `useSaveCraftingSession`, and `useDeleteCraftingSession` call `src/services/crafting-service.ts`. That service is `createResourceClient('/api/crafting')`.
- `useEncounters`, `useEncounter`, `useCreateEncounter`, and `useDeleteEncounter` call `src/services/encounter-service.ts`. `useSaveEncounter` calls `persistEncounterSave`. That service is `createResourceClient('/api/encounters')`.
- `useCampaigns`, `useCampaignsFull`, `useCampaign`, `useCampaignCharacterView`, and `useCampaignCharacterEncounters` call `src/services/campaign-service.ts`.
- `useCampaignRolls` calls `getCampaignRolls`.
- `useCharacters` calls `getCharacters` and, when signed out or when guest sheets remain, `getGuestCharactersList`. `useCharacter`, `useSaveCharacter`, `useDeleteCharacter`, and `useDuplicateCharacter` call `src/services/character-service.ts`.
- `useOfficialLibrary`, `useOfficialLibraryCounts`, and `useAddOfficialToLibrary` call `src/services/library-service.ts`. `useUserPowers`, `useUserTechniques`, `useUserEmpoweredTechniques`, `useUserItems`, `useUserCreatures`, and `useUserSpecies` call one private `useUserLibrary`. `useUserLibraryCounts` calls `fetchUserLibraryCounts`.
- `useCodexFeats`, `useCodexSkills`, `useCodexSpecies`, `useCodexTraits`, `useCodexParts`, `useCodexItemProperties`, `useCodexEquipment`, `useCodexArchetypes`, and `useCodexCreatureFeats` call `useCodexCollection`. `useCodexPowerParts` and `useCodexTechniqueParts` call that same helper with the `parts` collection. `useCodexFull` calls `fetchCodex`.
- `useProfile` and `useAccountProfile` share `userProfileQueryKey` and `fetchUserProfile`. Account profile keeps email and role. The header profile does not.
- `useGuidedEquipmentL2Catalog` calls `buildGuidedEquipmentEligibilityContext`. It does not call `useGuidedEquipmentCatalog`.
- `useCreatorSave` calls `saveToLibrary` and `saveToOfficialLibrary`.
- `useTabletopScene`, `useActiveCampaignTabletop`, and `useTabletopMutations` import `src/services/tabletop-service.ts`.
- `buildSelectableItem` in `src/hooks/add-library-item/build-selectable-item.ts` calls `buildEmpoweredPowerSelectableItem` for an empowered power and `buildSelectableItem` from `src/lib/library-selectable-builders.ts` for the other types. The load modal imports the library-builders function, not the add-library dispatcher.
- `useAdmin` calls `useAuth` and `/api/admin/check`. `useCharacterResourceSync` calls `scheduleCharacterResourceSync`. `getGameRulesFallback` returns the fallback object built from `src/lib/game/constants.ts`. `useGameRules` uses that object when the query has no data.

### Not read line by line

- `src/hooks/use-auto-save.ts` past `flushDirtyAutosave`.
- `src/hooks/use-creator-save.ts` past the two library save calls.
- `src/hooks/use-game-rules.ts` past `mergeCoreRules` and `getGameRulesFallback`. The fallback object was not opened field by field.
- `src/hooks/use-load-modal-library.ts` past the empowered branch.
- `src/hooks/use-tabletop.ts` past its service imports.
- `src/hooks/use-user-library.ts` past `userSpeciesToSpecies`.
- `src/services/character-service.ts` past the start of `getCharacter`, and `src/services/tabletop-service.ts` past `updateTabletopScene`.
- `src/hooks/add-library-item/load-raw-items.ts` past `loadEmpoweredRawItems`, and `src/hooks/add-library-item/map-library-to-character.ts`.
- The barrel-gap files already named under hooks, services, and stores.

### Files

- `src/hooks/codex-types.ts`
- `src/hooks/use-admin.ts`
- `src/hooks/use-auto-save.ts`
- `src/hooks/use-campaign-rolls.ts`
- `src/hooks/use-campaigns.ts`
- `src/hooks/use-character-resource-sync.ts`
- `src/hooks/use-codex.ts`
- `src/hooks/use-crafting.ts`
- `src/hooks/use-creator-save.ts`
- `src/hooks/use-encounters.ts`
- `src/hooks/use-enhanced-items.ts`
- `src/hooks/use-game-rules.ts`
- `src/hooks/use-guided-equipment-catalog.ts`
- `src/hooks/use-guided-equipment-l2-catalog.ts`
- `src/hooks/use-is-client.ts`
- `src/hooks/use-load-modal-library.ts`
- `src/hooks/use-official-library.ts`
- `src/hooks/use-profile.ts`
- `src/hooks/use-tabletop.ts`
- `src/hooks/use-user-library.ts`
- `src/hooks/add-library-item/build-empowered-selectable-item.ts`
- `src/hooks/add-library-item/build-selectable-item.ts`
- `src/hooks/add-library-item/load-raw-items.ts`
- `src/hooks/add-library-item/map-library-to-character.ts`
- `src/hooks/add-library-item/normalize-public.ts`
- `src/hooks/add-library-item/types.ts`
- `src/services/character-service.ts`
- `src/services/library-service.ts`
- `src/services/tabletop-service.ts`

---

## Game and calculator siblings, and the formula bodies

Every non-test file under `src/lib/game` and `src/lib/calculators` is already required by the checker. `src/lib/calculators/power-composition.fixture.ts` is imported by tests, not by app pages. The exported names in these files that no other production file mentions are still called inside the same file or by a test. No unused export turned up in that check.

### Second implementations

- Path type. `getArchetypeType` in `src/lib/game/formulas.ts` returns `powered-martial` when both proficiencies are above 0, and `none` when both are 0. `inferArchetypeCategoryFromCharacter` in `src/lib/game/archetype-edit.ts` returns `powered-martial` for that split, and `power` when both are 0, unless a stored type is set. `archetypeCategoryForEnergy` in `src/lib/game/calculations.ts` returns `undefined` when both are above 0 and no type is stored. They do not call each other.
- Ability cost. `getAbilityIncreaseCost` and `calculateAbilityScoreCost` use different variables (`currentValue >= threshold` vs `target > threshold`) but each single-step cost matches. The loop does not call `getAbilityIncreaseCost`.
- Player health and creature health. `calculateMaxHealth` adds a base health. `calculateCreatureMaxHealth` in `src/lib/game/encounter-utils.ts` does not. It does not call `calculateMaxHealth` or `calculateHealthEnergyPool`.
- Item property sums. `calculateItemCosts` and `analyzeItemCosts` agree on IP and property currency per row. See **Health, energy, and cost math** for the guarded disagreement list and for copies that match.
- Energy text. `formatEnergyNumber` and `formatEnergyIntermediate` disagree on decimals by design; see `math-disagree-intentional:format-energy-intermediate-vs-format-energy-number` in that section.
- Breakdown helpers. `nearlyEqual` is written in `power-energy-breakdown.ts`, `technique-energy-breakdown.ts`, `item-cost-breakdown.ts`, and `empowered-energy-breakdown.ts`. `formatOptionSuffix` is written in the power file and the technique file. They do not call each other.
- Technique part energy. `getTechniquePartEnergyContribution` and the sum inside `calculateTechniqueCosts` are the same base-plus-options product. They do not call each other. `partEnergyContribution` in `technique-energy-breakdown.ts` is that sum again.

### Calls a shared component

- `calculateAllStats` and `computeMaxHealthEnergy` call `calculateMaxHealth` and `calculateMaxEnergyForArchetype`. `calculateMaxEnergyForArchetype` calls `calculateMaxEnergy`. `abilityPointsSpent` in `character-legality.ts` calls `calculateAbilityScoreCost`. `buildSuggestedAbilityArray` calls `calculateAbilityPoints` and `calculateAbilityScoreCost`.
- `applyProficiencyGainForLevelUp` and `applyProficiencyLossForLevelDown` call `calculateProficiency`. `applyLevelDownProficiencyUpdates` calls `applyProficiencyLossForLevelDown`. A mixed split returns null from the gain function.
- `resolveArmorDamageReduction` calls `deriveDamageReductionFromProperties`. `creatureArmorDamageReduction` picks the highest currency cost, then calls `resolveArmorDamageReduction`. `pickArmorEquipIndex` picks the highest damage reduction. It does not call `creatureArmorDamageReduction`.
- `checkFeatRequirements` calls `calculateDefenses` and `calculateSpeed`. `feat-requirements.ts` also imports `getSkillBonusForFeatRequirement`.
- `buildEmpoweredAdvancedCalculationGroups` was read through the combined-energy rows. It calls the power and technique section builders. `empowered-energy-breakdown.ts` and `empowered-overlap-parts.ts` and `dice-splits.ts` and `part-training-points.ts` were read. `computePartTrainingPointsRaw` and `computePartTrainingPoints` ignore the power-versus-technique argument.
- `formatPowerDamage` and `formatTechniqueDamage` were read through the return. They still do not call each other.
- `src/lib/game/calculations.ts` was read through `computeMaxHealthEnergy`. `encounter-utils.ts`, `creature-ability-bounds.ts`, `loadout-entries.ts`, `saved-part-id.ts`, `mixed-encounter-view-tab.ts`, `skill-allocation-add.ts`, `suggested-abilities.ts`, `path-ability-labels.ts`, `equipment-equipped.ts`, `creature-power-instances.ts`, and `dedupe-saved-parts.ts` were read.

### Not read line by line

- Health, energy, and cost formulas in the section above are read through that pass’s scope. Skill helpers in `formulas.ts` after innate energy and `skill-allocation.ts` cost helpers are in **Skill and allocation math** below.
- Character-check and path math is in **Character-check and path math** below. Creature creator budgets are in **Creature creator budget math**. Player proficiency caps and guided TP wiring are in **Player proficiency and training math**. Defense targeting and weapon attack helpers are in **Defense targeting and weapon attack math**. Crafting tables, requirements, and outcome math are in **Crafting cost math**. Size categories and carrying capacity are in **Size and path recommendation math**. `creator-cache.ts` has no cost or point formulas (skipped).

---


## Health, energy, and cost math (line-by-line pass)

This pass read the health, energy, and currency formulas in the code through the remainder named below. Skill bonus and allocation helpers are in **Skill and allocation math**. This is a map of what the code does, not a rules balance sign-off.

### Read to the end

- `calculateMaxHealth` and `computeMaxHealthEnergy` in `src/lib/game/calculations.ts`. Player max health starts from a base (default 12 from rules), adds allocated health points, and adds vitality. If vitality is negative, it is added once. If vitality is zero or higher, it is multiplied by level. When vitality is the archetype ability, the code uses strength instead of vitality for that piece. The result is clamped at zero.
- `calculateMaxEnergy`, `calculateMaxEnergyForArchetype`, and `resolveEnergyArchetypeAbility` in the same file. Max energy is archetype-ability score × level plus allocated energy points, clamped at zero. Powered-Martial uses the higher of the martial and power ability names unless the path type forces one side.
- `calculateCreatureMaxHealth` and `calculateCreatureMaxEnergy` in `src/lib/game/encounter-utils.ts`. Creature max health has no player base health. It uses vitality × level when vitality is not negative, otherwise vitality once, plus hit points from the pool. Creature max energy uses the highest non-vitality primary ability × level plus energy points. It does not call the player functions.
- `calculateHealthEnergyPool` and `allocateHealthEnergyPool` in `src/lib/game/formulas.ts`. The pool grows by level from rules defaults. Allocation puts pool points toward energy first, up to the highest power or technique energy cost, then puts the rest toward health.
- `getAbilityIncreaseCost` and `calculateAbilityScoreCost` in `src/lib/game/formulas.ts`. One step from the current score uses `currentValue >= threshold` to pick cost 1 vs 2. The total-to-reach loop uses `target > threshold` for the same split. Each single-step cost matches between the two functions.
- `calculateCreatureCurrency` in `src/lib/game/formulas.ts` and `computeStartingCurrency` in `src/lib/guided-creator/equipment-currency.ts`. Both use base 200 and growth 1.45 with `Math.ceil(base × growth ** (level − 1))` above level 1. They read constants from different files but the numbers match today.
- `analyzePowerEnergy`, `calculatePowerCosts`, `finalizePowerEnergy`, and `derivePlainPowerDisplay` in `src/lib/calculators/power-calc.ts`. Power energy adds flat parts, multiplies percentage parts, and applies a duration equation: `(flat_normal × perc_all) + ((dur_all + 1) × flat_duration × perc_dur) − (flat_duration × perc_dur)`. Published energy rounds up once and can floor at 1 EN when there was positive flat energy.
- `analyzeTechniqueEnergy` and `calculateTechniqueCosts` in `src/lib/calculators/technique-calc.ts` and `src/lib/calculators/technique-energy-breakdown.ts`. Technique energy is flat parts summed, then multiplied by the product of percentage parts. Both paths use the same math and call `finalizePowerEnergy` for publish.
- `calculateEmpoweredTechniqueCosts` in `src/lib/calculators/empowered-technique-calc.ts`. It runs the power and technique cost functions, multiplies only the technique percentage-part product into the power raw energy, adds the full technique raw energy, then applies the same publish floor.
- `formatEnergyIntermediate` in `src/lib/calculators/power-composition.ts` and `formatEnergyNumber` in `src/lib/calculators/power-energy-breakdown.ts` (via `formatCost` in `src/lib/game/creator-constants.ts`). Both format intermediate numbers for breakdown UIs; see disagreements.
- `resolvePowerComposition` in `src/lib/calculators/power-composition.ts` through its return. Composed power energy sums shared chassis energy, variant extras, choice max, modify sums, randomize face averages, and reverse drawback discounts, then calls `finalizeCompositionEnergy` (same floor as plain powers).
- `calculateItemCosts`, `analyzeItemMarketCurrency`, `resolveItemMarketPricing`, and `deriveItemDisplay` in `src/lib/calculators/item-calc.ts`. Item points and property currency sum base plus option × level per property. Market currency picks a rarity band from total IP, then `band_low × (1 + 0.125 × property currency sum)`, clamps to the band min and max, then floors for display.
- `analyzeItemCosts` and `buildItemAdvancedCalculationGroups` in `src/lib/calculators/item-cost-breakdown.ts`. Breakdown lines repeat the same per-property IP and currency sums as `calculateItemCosts`; totals add rarity and rounded-down market currency.
- `calculateArchetypeProgression` in `src/lib/game/formulas.ts` through its return. Archetype progression sets innate pools, thresholds, and bonus feat slots from proficiencies and milestone choices.
- `buildMechanicParts` and `calculateDamageOptionLevel` in `src/lib/calculators/mechanic-builder.ts` through the return. Damage uses `floor((dice × size − 4) / 2)` for option 1. Range uses `steps − 1` for Power Range. Duration maps UI values to codex option levels (including minute/hour/day index tables). Split dice calls `computeSplits` in `dice-splits.ts`. Technique attack mode adds No Attack or Add Weapon at level 0.
- `buildPowerPartsPayloadForCost` in `src/lib/calculators/power-calc.ts`. Without creator-style fields it maps saved parts and rebuilds weapon attack from `attackMode`. With creator fields it keeps user/advanced saved parts, rebuilds mechanics via `buildMechanicParts`, keeps legacy auto-mechanic rows only when the rebuild missed that name, then appends weapon attack. Every cost path uses the merged payload in `calculatePowerCosts`.
- `rawEnergyOf`, `beneficialTabExtra`, `ownRangeEnergy`, and `reverseDrawbackEnergy` in `src/lib/calculators/power-composition.ts`. Tab energy is the difference of two `calculatePowerCosts` runs on footprints (not a hand-written delta). Range extra charges the full tab range, not a refund when shorter than Shared.
- `powerCompositionEnergyLines`, `deriveComposedPowerDisplay`, and `formatPowerCompositionSummary` in `src/lib/calculators/power-composition.ts`. They format `resolvePowerComposition` results; published `energy` and `tp` on the display come from that resolution, not a second calculator.
- `weaponRangeSpaceLadder`, `weaponRangeSpacesFromOpLevel`, `deriveWeaponRangeConfig`, `formatRange`, and `resolveWeaponRangeDisplay` in `src/lib/calculators/item-calc.ts`. Thrown, reach, and ranged use fixed space ladders from `ITEM_PROPERTY_CONSTANTS`; option level picks the ladder index (clamped). Legacy `rangeLevel` is 1-based and maps to ranged option `level − 1`. Bare stored integers without properties are treated as corrupt and show Melee.
- `sumInnatePowerEnergyCosts` and `calculateRemainingInnateEnergy` in `src/lib/game/formulas.ts`. Remaining innate budget is `maxInnateEnergy` minus the sum of `cost` on innate powers. It does not call `calculatePowerCosts`.
- `computePartTrainingPoints` in `src/lib/calculators/part-training-points.ts`. Training points round base plus option products up once per part; power and technique share the same function.
- `computeSplits` in `src/lib/calculators/dice-splits.ts`. One split formula shared by mechanic builder and calculators.

### Still not read line by line (health / energy / cost scope)

- None in this slice.

### Disagreements

These IDs are required; dropping a line makes `scripts/validate-feature-index.js` exit 2. Prefix marks intent: `math-disagree-intentional` (by design), `math-disagree-bug` (code bug), `math-disagree-deferred` (known gap; fix later), `math-disagree-unclassified` (not yet classified).

**Intentional (player vs creature, power vs technique, formatting, composition display)**

- math-disagree-intentional:player-vs-creature-max-health: **Intentional.** Players and creatures use different health formulas on purpose. `calculateMaxHealth` adds a player base health (default 12) and can swap vitality for strength when vitality is the archetype ability. `calculateCreatureMaxHealth` never adds that base and always uses creature vitality.
- math-disagree-intentional:player-vs-creature-max-energy: **Intentional.** `calculateMaxEnergyForArchetype` picks the path’s archetype ability (or the higher of two on Powered-Martial). `calculateCreatureMaxEnergy` uses the highest non-vitality primary score only.
- math-disagree-intentional:power-energy-vs-technique-energy: **Intentional.** Powers and techniques use different energy equations. `analyzePowerEnergy` includes duration parts; `analyzeTechniqueEnergy` is flat sum × percentage product only.
- math-disagree-intentional:format-energy-intermediate-vs-format-energy-number: **Intentional display split.** `formatEnergyIntermediate` (composition notes) rounds to two decimals. `formatEnergyNumber` (creator breakdowns) uses `formatCost` at three decimals and strips trailing zeros.
- math-disagree-intentional:modify-variant-ceil-vs-composition-finalize: **Intentional display split.** Modify variant tabs round with `publishContribution` per tab; the published power total uses one `finalizeCompositionEnergy` on summed raw energy. Per-tab rounded sums can exceed the header total.

**Bug**

- math-disagree-bug:innate-remaining-uses-stored-cost: **Bug.** `calculateRemainingInnateEnergy` subtracts each innate power’s saved `cost` field. Live energy comes from parts via `buildPowerPartsPayloadForCost` / `calculatePowerCosts`. A stale saved `cost` makes remaining innate energy wrong.

### Same math, separate copies

- `calculateItemCosts` and `analyzeItemCosts` sum the same IP and property currency per row. Breakdown does not add training points; chip TP still comes from `trainingPointsForItemPropertyRef`.
- `getTechniquePartEnergyContribution`, the loop inside `calculateTechniqueCosts`, and `partEnergyContribution` in `technique-energy-breakdown.ts` use the same base-plus-three-options energy product.
- `calculateCreatureCurrency` and `computeStartingCurrency` use the same growth formula and the same 200 / 1.45 defaults, stored in different constant imports.
- `rawEnergyOf` and `derivePlainPowerDisplay` both feed `buildPowerPartsPayloadForCost` into `calculatePowerCosts`. Composed-power totals use the same path through `rawEnergyOf`.
- `computeSplits` in `dice-splits.ts` is the only split-dice formula; `buildMechanicParts` calls it for power and technique damage.

## Skill and allocation math (line-by-line pass)

Skill bonus, skill point totals, and allocation spend in `src/lib/game/formulas.ts` (from the Skill Helpers block through `getSkillBonusForFeatRequirement`), `src/lib/game/skill-allocation.ts` through `calculateSimpleSkillPointsSpent`, `src/lib/game/skill-allocation-add.ts`, and `src/lib/guided-creator/skill-reconcile.ts`. `getCreatureSkillBonus` in `creature-creator-skill-bonus.ts` delegates to the shared bonus helpers. Not a rules balance sign-off.

### Read to the end

- `unproficientBonus` in `src/lib/game/formulas.ts`. Negative ability mods double; non-negative mods use `Math.ceil(mod / 2)`. Used by skill, sub-skill, feat checks, and defense unprof values in `calculations.ts`.
- `calculateSkillPointsForEntity` in `src/lib/game/formulas.ts`. Characters: `skillPointsPerLevel × floor(level)`. Creatures: `skillPointsAtLevel1 + skillPointsPerLevel × (floor(level) − 1)`. Rules overrides come from `PROGRESSION_PLAYER` / `PROGRESSION_CREATURE`.
- `getLinkedAbilityKeys`, `getHighestLinkedAbilityKey`, `subSkillAllocationAbility`, `getLinkedAbilityMod` (private), `calculateSkillBonusWithProficiency`, and `calculateSubSkillBonusWithProficiency` in `src/lib/game/formulas.ts`. Proficient: ability mod plus skill values (sub-skills add base value when the base is proficient). Not proficient: `unproficientBonus` on the chosen or highest linked ability. Multi-ability skills use the chosen key when valid, else the highest score.
- `resolveParentSkillNameForSubSkill` in `src/lib/game/formulas.ts`. Resolves parent base skill name from `selectedBaseSkillId` or codex `base_skill_id`; display-only for sheet copy.
- `getSkillBonusForFeatRequirement` in `src/lib/game/formulas.ts`. Inlines base/sub bonus shapes similar to the proficiency helpers but always reads the **first** comma-separated codex ability (not highest/chosen). Draft vs sheet proficiency uses numeric thresholds (`base ≥ 0`, sub `≥ 1`) or `{ prof, val }` rows.
- `resolveSkillAllocationRules`, `getTotalSkillPoints`, `getSkillValueIncreaseCost`, `skillAllocationIncreaseCost`, `applySkillAllocationIncrease`, `applySkillAllocationDecrease`, `canIncreaseDefense`, `calculateCharacterSkillPointsSpent`, and `calculateSimpleSkillPointsSpent` in `src/lib/game/skill-allocation.ts`. Value steps cost 1 point below soft cap; at or past cap use `baseSkillPastCapCost` or `subSkillPastCapCost`. Non-species rows pay `gainProficiencyCost` once when gaining proficiency. Spent totals loop value from 1..n and sum `getSkillValueIncreaseCost(v − 1, …)`; defense spends `defenseIncreaseCost` per skill-point defense bonus.
- `getCreatureSkillBonus` in `src/app/(main)/creature-creator/creature-creator-skill-bonus.ts`. Wraps `calculateSkillBonusWithProficiency` / `calculateSubSkillBonusWithProficiency` with codex-linked abilities and parent skill lookup.
- `buildExistingSkillIdSet`, `buildExistingSkillNames`, `buildCharacterSkillsForSubModal`, `removeAllocatedSkill`, `applyAddedBaseSkills`, and `applyAddedSubSkills` in `src/lib/game/skill-allocation-add.ts`. No separate point-cost table. Base adds start at allocation `0` (proficient, zero ranks). Sub adds start at `1` (proficient sub). `autoAddBaseSkill` seeds the parent base at `0` when missing. `removeAllocatedSkill` deletes the base key and any codex sub whose `base_skill_id` matches (skips rows where `base_skill_id` is null or `0`). Proficiency for sub-modal parents uses `(allocations[id] ?? 0) >= 0`, same threshold as `readProficiency` for base skills in `getSkillBonusForFeatRequirement`.
- `pruneUnresolvedSkillAllocations`, `calculateGuidedSkillPointBudget`, and helpers in `src/lib/guided-creator/skill-reconcile.ts`. Prune drops allocation keys absent from the codex index. Budget builds `skillMeta` (`isSubSkill: base_skill_id !== undefined`), merges species and recommended path skills at default values, adds `extraSkillPoints` when species grant id `"0"` (Any), then `spentPoints = calculateSimpleSkillPointsSpent(...)` with `resolveSkillAllocationRules(rules)`. `remainingPoints = totalPoints − spentPoints`. `mergeGuidedSkillAllocationsWithDefaults` keeps orphaned keys while `skillMeta.size === 0` so a cold catalog does not wipe allocations; once the catalog loads, only resolved keys remain for spend.

### Still not read line by line (skill / allocation scope)

- None in this slice. `buildMixedSpeciesSkillOptions` in `src/lib/ancestry/ancestry-selection.ts` was not opened (species skill pick list only; no point math). Out of scope for this pass.

### Disagreements

- math-disagree-bug:feat-skill-req-first-ability-vs-sheet-highest: **Bug (Kadin).** Feat skill requirements must match the sheet: chosen linked ability when set, else highest, with the full skill bonus including proficiency. `getSkillBonusForFeatRequirement` still uses only the first codex ability string and its inline bonus path. `calculateSkillBonusWithProficiency` / `calculateSubSkillBonusWithProficiency` use `getLinkedAbilityMod` (chosen or highest). Not intentional.
- math-disagree-bug:guided-skill-total-omits-rules-on-getTotalSkillPoints: **Bug (Kadin).** Guided remaining skill points must use core rules for the base total and for skill points per level. `calculateGuidedSkillPointBudget` calls `getTotalSkillPoints(1, 'character')` without the `rules` argument while spend uses `resolveSkillAllocationRules(rules)`, so the guided creator can show a built-in normal total and skip the live `PROGRESSION_PLAYER` values. The species skill choice that grants one extra spendable point is a separate bonus and is **not** this finding.

### Same math, separate copies

- `getTotalSkillPoints` returns `calculateSkillPointsForEntity`; one skill-point total formula when callers pass the same `rules`.
- `skillAllocationIncreaseCost` and `calculateSimpleSkillPointsSpent` both call `getSkillValueIncreaseCost`; no parallel past-cap table.
- `getCreatureSkillBonus`, the character sheet, guided creator, allocation page, and creature stat block display call the same `calculateSkillBonusWithProficiency` / `calculateSubSkillBonusWithProficiency` pair (not the feat inline path).
- `getHighestLinkedAbilityKey` and private `getHighestLinkedAbility` use the same max scan; one returns the key, one the value.
- `buildGuidedSkillMeta` in `skill-reconcile.ts` and the `skillMeta` map in `skills-allocation-page.tsx` both set `isSubSkill` from `base_skill_id !== undefined`; spend loops match when given the same catalog.
- `calculateGuidedSkillPointBudget` uses the same `calculateSimpleSkillPointsSpent` and the same `extraSkillPoints` rule (`speciesSkillIds.has('0') ? 1 : 0`) as the allocation page; it fixes level at `1` for guided creation, which matches `skills-step.tsx`.

## Character-check and path math (line-by-line pass)

Save legality budgets, feat requirement checks, path publish validation, innate power eligibility, and archetype path JSON parsing. Not creator UI screens. Not a rules balance sign-off.

### Read to the end

- `findCharacterLegalityViolations` and helpers in `src/lib/game/character-legality.ts` through `evaluateCharacterLegalityForSave`. Ability budget: `calculateAbilityPoints` vs sum of `calculateAbilityScoreCost` per ability. Skill budget: `getTotalSkillPoints(level, 'character', budgetRules)` vs `skillPointsSpentFloor` (sums nonnegative `skill_val` / allocation vals plus `defenseIncreaseCost ×` defense skill totals; **not** proficiency or stepped value costs). Archetype feat cap: `calculateMaxArchetypeFeats` with `normalizeArchetypeChoices`. Character feat cap: `calculateMaxCharacterFeats`. Health–energy pool: `calculateHealthEnergyPool(level, 'PLAYER', …)` vs `healthPoints + energyPoints` (allocatable pool only; player base health is separate). Feat rows: `checkFeatRequirements` when catalog loaded.
- `checkFeatRequirements`, `getMaxQualifiedFeatLevel`, `applyTempModifiersForFeatRequirements`, and mappers in `src/lib/game/feat-requirements.ts`. Level: `lvl_req` or else `2 × featLevel` for ranks above 1. Ability reqs use raw abilities; defense reqs use `calculateDefenses(abilities, defenseVals)`. Skill reqs call `getSkillBonusForFeatRequirement`. Speed uses `calculateSpeed`. Leveled feats use `getPreviousLevelFeatId` and `ownsFeatOrUpgrade`. Sheet warning compares base vs temp-adjusted characters through the same `checkFeatRequirements`.
- `validatePathDataForPublish`, `validateLevel1Skills`, `validateLoadoutTrainingPoints`, and `validateInnatePowerRecommendations` in `src/lib/game/path-validation.ts`. Governance caps from `LAYER1_GOVERNANCE`. Loadout TP: sum `resolveItemTrainingPoints(id) × max(1, quantity)` per flattened loadout entry vs `trainingPointLimit`. Innate list delegates to `validateRecommendedInnatePowers`.
- `parseArchetypePathData`, `collectPathRecommendedIds`, guidance helpers, and codex write validators in `src/lib/game/archetype-path.ts` through the return of each export in that file. Parsing only; no progression formulas beyond finite number checks on recommended abilities.
- `validateRecommendedInnatePowers`, `evaluateInnatePowerEligibility`, `snapshotOfficialPowerForInnate`, `getLevel1InnateBudget`, duration and action predicates, and filter helpers in `src/lib/game/innate-eligibility.ts`. L1 innate budget from `calculateArchetypeProgression(1, martialProf, powerProf)` with path or default proficiencies. Per-power energy from `derivePowerDisplay` / `resolvePowerComposition` (composed variants re-call `resolvePowerComposition` for priced energy). Threshold and duration checks are local predicates; energy sum compared to `budget.innateEnergy`.

### Still not read line by line (character-check / path scope)

- None in this slice. `buildMixedSpeciesSkillOptions` and other ancestry UI remain outside this pass.

### Disagreements

- math-disagree-bug:legality-skill-spent-floor-vs-allocation-spent: **Bug (Kadin).** Available and remaining skill points must use exact math. `skillPointsSpentFloor` is a lower estimate (nonnegative rank sums plus defense totals × `defenseIncreaseCost`). `calculateSimpleSkillPointsSpent` reflects real proficiency and step costs. Legality warnings can under-report spend. Not intentional.

### Same math, separate copies

- `abilityPointsSpent` and `buildSuggestedAbilityArray` both use `calculateAbilityScoreCost`; legality does not reimplement ability step costs.
- `findCharacterLegalityViolations` and `calculateGuidedSkillPointBudget` both call `getTotalSkillPoints` with rules when computing skill **budget** (legality at character level; guided at 1).
- `validateRecommendedInnatePowers` and sheet innate pools both source threshold/energy from `calculateArchetypeProgression` via `getLevel1InnateBudget` or `calculateArchetypeProgression` directly; path validation passes path L1 proficiencies into that budget.
- `checkFeatRequirements` is the single feat gate for legality, sheet, creator, and codex filter; `getMaxQualifiedFeatLevel` loops the same function.
- Innate path validation energy uses live `derivePowerDisplay` / `resolvePowerComposition`, same family as `calculatePowerCosts` (contrast `math-disagree-bug:innate-remaining-uses-stored-cost` on the sheet budget field).
- `validateLoadoutTrainingPoints` uses `flattenLoadoutEntries` only; no second TP sum formula in this slice.

## Creature creator budget math (line-by-line pass)

Creature point budgets, spend totals, and training-point aggregation for the creature creator. Not encounter play UI. Not a rules balance sign-off.

### Read to the end

- `calculateCreatureCreatorStats` and `isCreatureOverBudget` in `src/app/(main)/creature-creator/creature-creator-derived-stats.ts`. Budgets: `calculateCreatureTrainingPoints(level, highestNonVitality)`, `calculateCreatureCurrency`, `calculateHealthEnergyPool(..., 'CREATURE', allowSubLevel)`, `calculateProficiency(..., allowSubLevel)`, `calculateAbilityPoints(..., allowSubLevel)`, `calculateSkillPointsForEntity` as creature, `calculateCreatureFeatPoints(level, martialProficiency)`. Spend: sum `calculateAbilityScoreCost` on abilities; `hitPoints + energyPoints` vs HE pool; `calculateSimpleSkillPointsSpent` on mapped creature skills via `allocationValueFromPersistedSkill`; feat sum from manual `points` plus mechanical sense/movement/resistance lines from codex maps; `computeCreatureTrainingSpent`; inventory currency × quantity. `minEnergy` is `highestNonVitality × max(1, floor(level))` without allocated `energyPoints`; `maxEnergy` uses `calculateCreatureMaxEnergy` which adds `energyPoints` to that same ability×level piece. `getCreatureAbilityBounds` in `creature-ability-bounds.ts` returns code constants only (ignores stale rules max).
- `computeCreatureTrainingSpent`, `creatureLoadoutForBudget`, and legacy fallbacks in `src/app/(main)/creature-creator/creature-creator-training-spent.ts`. With codex parts: rebuild power rows through `resolvePowerComposition` / `plainPowerProficiencyParts`, then `sumRequiredProficiencyTrainingPoints` on active loadout. Adds `storedTpWithoutParts` (rows with no `parts` use saved `tp`), equipment/armament stored TP when properties missing, plus full legacy path when no DB context. Without DB: sums stored `tp` on powers, techniques, and armaments only.
- `calculateCreatureTrainingPoints` and `calculateCreatureFeatPoints` in `src/lib/game/formulas.ts`. Creature TP: `base + ability + (level−1)×(tpPerLevelMultiplier + ability)` at L1+; sub-level uses `ceil(base×level)+ability`. Creature feat points: `baseFeat + martial` at L1 plus `(level−1)×featPointsPerLevel`.
- `calculateProficiencyTP`, `roundUpTrainingPoints`, `optionLevelForWholeTrainingPoints`, `buildRequiredProficiencies`, and `sumRequiredProficiencyTrainingPoints` in `src/lib/proficiencies.ts` through the return of `sumRequiredProficiencyTrainingPoints`. Per-row TP rounds base plus rated options (whole-number level bump via `optionLevelForWholeTrainingPoints`), then `roundUpTrainingPoints`. Loadout-wide sum dedupes identical parts before summing.

### Still not read line by line (creature budget scope)

- None in this slice.

### Disagreements

`math-disagree-unclassified` marks a difference that is not labelled intentional or bug. Dropping a line fails the validator.

- math-disagree-bug:creature-training-stored-tp-without-parts: **Bug (Kadin).** Intended rule: use live parts through `sumRequiredProficiencyTrainingPoints` when parts exist; saved `tp` only when parts cannot be found (may be stale). `computeCreatureTrainingSpent` still adds stored `power.tp` / `technique.tp` / `armament.tp` on paths where parts could be resolved, so spend can disagree with live TP when parts exist. Legacy no-DB mode uses stored sums only.

### Same math, separate copies

- Creature skill spend uses the same `calculateSimpleSkillPointsSpent` as the character sheet; creature meta skips orphan sub-skills whose base is absent from the skill list.
- Creature ability spend uses `calculateAbilityScoreCost`; same as character legality and suggested-ability builders.
- `computeCreatureTrainingSpent` and guided character save both call `sumRequiredProficiencyTrainingPoints` when part/property codex is available.
- Player training **cap** uses `calculateTrainingPoints` via `getTrainingPointLimit`; creature training **budget** uses `calculateCreatureTrainingPoints` (different formula, different entity).

## Player proficiency and training math (line-by-line pass)

Archetype proficiency caps on level change, player Training Point pool formula, and guided creator proficiency / TP spend wiring. Not creator screen UI. Not a rules balance sign-off.

### Read to the end

- `applyProficiencyGainForLevelUp`, `applyProficiencyLossForLevelDown`, `applyLevelUpProficiencyUpdates`, `applyLevelDownProficiencyUpdates`, and `applyPathProficiencyForLevel` in `src/lib/game/archetype-display.ts`. Milestone gain/loss uses `calculateProficiency(oldLevel)` and `calculateProficiency(newLevel)`; pure-side auto-assign adds or removes the cap delta on the side that holds all spent points (mixed splits return null). Level 5+ path floors use `Math.max(current, path power_prof_level5 / martial_prof_level5)` when `archetypePathId` is set. Codex fetch helpers in the same file are display/merge only.
- `calculateProficiency` and `calculateTrainingPoints` in `src/lib/game/formulas.ts`. Proficiency cap: base at low levels, then +1 per `proficiencyEveryNLevels` (default 5) via `floor(level / interval) × proficiencyPerIncrease`; sub-level can `ceil(base × level)`. Player TP pool: `base + archetypeAbility + (tpPerLevelMultiplier + archetypeAbility) × (level − 1)` from `PROGRESSION_PLAYER` defaults. `resolveArchetypeProficiencyStart` sets starting `pow_prof` / `mart_prof` from path columns or type defaults (power 2/0, martial 0/2, mixed 1/1).
- `getTrainingPointLimit` in `src/lib/proficiencies.ts` delegates to `calculateTrainingPoints(level, archetypeAbility, rules)`.
- Guided proficiency and TP in `src/lib/guided-creator/build-character.ts`: `resolvePowersForProficiency` (composition → `composedPowerProficiencyParts`), `resolveTechniquesForProficiency`, `resolveArmamentsForProficiency`, `buildGuidedProficiencyInput`, `computeGuidedRequiredTrainingSpent` (`sumRequiredProficiencyTrainingPoints`), and `computeGuidedTrainingPointsBudgetSpent` (`Math.max` of deduped proficiency spend vs listed loadout + combat TP). Save payload builds `proficiencies` via `buildRequiredProficiencies` and starting `pow_prof` / `mart_prof` via `resolveArchetypeProficiencyStart` (does not call level-up auto-assign).
- `computeGuidedLoadoutTpSummary`, `resolveItemTrainingPoints`, `combineGuidedTpBudgets`, and `sumGuidedListedCombatTrainingPoints` in `src/lib/guided-creator/loadout-tp.ts`. Loadout spend sums `Math.round(calculateItemCosts(...).totalTP)` per selected ref × quantity. Limit at guided L1 uses `getTrainingPointLimit(1, archetypeAbility, rules)` where archetype ability is max of pow/mart picks and all six scores. Listed combat TP sums catalog `tpCostOf(id)` for unique power/technique/innate ids.

### Still not read line by line (proficiency / training scope)

- None in this slice.

### Disagreements

- math-disagree-bug:guided-tp-bar-max-of-dedupe-vs-listed: **Bug (Kadin).** Training-point cost has one source of truth: the cleaned-up proficiency list used on the character sheet (`computeGuidedRequiredTrainingSpent` / `sumRequiredProficiencyTrainingPoints`). `computeGuidedTrainingPointsBudgetSpent` takes the `Math.max` of that walk and item/catalog chip TP (`loadoutEquipmentTpSpent + sumGuidedListedCombatTrainingPoints`), so the guided bar can over-count. Not intentional.

### Same math, separate copies

- `getTrainingPointLimit`, `computeGuidedLoadoutTpSummary`, and path admin `trainingPointLimit` all use `calculateTrainingPoints` for the pool size when rules match.
- `buildGuidedCharacterPayload` and `computeGuidedRequiredTrainingSpent` share `buildGuidedProficiencyInput`; save persists `buildRequiredProficiencies` rows, not the budget counter max.
- `applyProficiencyGainForLevelUp` and `applyProficiencyLossForLevelDown` use the same `calculateProficiency` cap function the sheet uses for proficiency **pools** (points spent are separate fields on the character).
- `resolveItemTrainingPoints` and path `validateLoadoutTrainingPoints` both use `calculateItemCosts` property TP; path validation sums the same way with quantity.

## Defense targeting and weapon attack math (line-by-line pass)

Power/technique “can target” defense lists and weapon attack ability / bonus resolution. Not crafting or size tables. Not a rules balance sign-off.

### Read to the end

- `normalizeTargetedDefenses`, `parseDefensesFromDescription`, `defensesFromPart`, `suggestTargetedDefenses`, `buildTargetedDefenseSelectOptions`, and format helpers in `src/lib/game/targeted-defenses.ts`. No point budgets. DB `defense` field wins; else description substring match (longest defense names first). Damage types map through `getPowerDamagePartInfo` then codex part `defenseFromPart`. Weapon/unarmed attack mode suggests **Evasion** only.
- `deriveAbilityRequirementFromProperties`, `meetsAbilityRequirement`, property detectors, `defaultWeaponAbilityUtilized`, `deriveWeaponAbilityUtilized`, `getWeaponAttackAbility`, `getWeaponAttackBonusFromProperties`, and related exports in `src/lib/game/weapon-attack-ability.ts`. Requirement level is `1 + op_1_lvl` on named `* Requirement` properties. `meetsAbilityRequirement` compares that level to `abilities[key]`. Attack ability: `getWeaponAttackAbility` checks Finesse, Thrown, Reach, Heavy, then `resolveWeaponRangeDisplay` (non-Melee → Acuity, else Strength). `deriveWeaponAbilityUtilized` checks Finesse, Heavy only when `rangeType === 'ranged'`, else range-type default. Weapon attack bonus is `abilities[attackAbility] + martialProficiency` via `getWeaponAttackAbility`.
- `getPowerDamagePartInfo` in `src/lib/calculators/mechanic-builder.ts` (damage-type → codex damage part name/id); already used in cost builds; read here only for targeted-defense damage routing.

### Still not read line by line (defense / weapon scope)

- None in this slice.

### Disagreements

- math-disagree-bug:weapon-derive-utilized-vs-get-attack-ability: **Bug in item creator (Kadin rules vs code).** Stated rules: Thrown → Strength; ranged default → Acuity; Heavy overrides range → Strength even at range; Finesse → Agility (overrides Acuity on ranged or Strength elsewhere). `getWeaponAttackAbility` on the sheet matches that order (Finesse, Thrown, Reach, Heavy, then non-Melee → Acuity). `deriveWeaponAbilityUtilized` in the item creator omits Thrown and Reach and only applies Heavy when `rangeType === 'ranged'`, so the creator default can disagree while the sheet matches the rules.

### Same math, separate copies

- `defensesFromPart`, power/technique chip formatters, and library `part-display` all call the same targeted-defense helpers; no second parse implementation.
- `getWeaponAttackBonusFromProperties` does not reimplement ability pick; it always calls `getWeaponAttackAbility`.
- `meetsAbilityRequirement` is the single threshold check for derived requirements on weapons (no duplicate in this slice).

## Crafting cost math (line-by-line pass)

General, enhanced, consumable-enhanced, and upgrade crafting requirements; successes-table outcome; crafting tool wiring. Skips size tables, path recommendations, and creator cache. Not a rules balance sign-off.

### Read to the end

- `findGeneralRow`, `getCraftingRequirements`, `getCraftingSessionLabels`, `getSuccessesTableEffect`, `calculateCraftingOutcome`, enhanced row lookup, `getMultipleUseAdjustedEnergy`, `getEnhancedCraftingRequirements`, `getConsumableEnhancedRequirements`, `getEnhancedMarketPrice`, `getUpgradeRequirements`, and all four optional modifiers in `src/lib/game/crafting-utils.ts`. General material cost is market price × `craftingCostMultiplier`; consumable time uses `Math.max(1, Math.ceil(time × consumableTimeMultiplier))`. Outcome applies successes-table percents to material retained, final cost, item worth, and extra items when delta > 7. Enhanced material cost is effective energy × table `currencyPerEnergy` or consumable `costPerEnergy`. Upgrade uses 75% of price delta, DS from the upgraded row, successes as row difference, and time delta in days (`8` hours = 1 day via `craftingDayHours`).
- `getCodexEquipmentMarketPrice`, `getLibraryItemMarketPrice`, and helpers in `src/components/crafting/get-crafting-market-price.ts`. Codex rows use `equipmentCurrency` (`currency` / `gold_cost` only). Library and public items use `resolveItemMarketPricing` from `item-calc` (same path as Library and equipment-step).
- `equipmentCurrency` and `persistEquipmentCost` in `src/lib/codex/equipment-list.ts` (read for crafting currency inputs only).
- `computeCraftingRequirements`, `computeRequirementsBreakdown`, optional-modifier max-step helpers, multiple-use index/energy wrappers, and `getEffectiveCraftingEnergy` in `src/app/(main)/crafting/[id]/_components/crafting-tool-helpers.ts`. This file applies bulk quantity multipliers, stacks optional modifiers, and merges base-item + enhancement requirements when `craftBaseItemAlso` (combined time in hours/days, summed successes and material, `Math.max` DS).
- `buildRequirementsSyncPatch`, `computeLiveCraftingOutcome`, `computeBaseOutcomeForDisplay`, session tallies, and roll DS routing in `src/app/(main)/crafting/[id]/_components/crafting-tool-derived.ts` (calls `computeSkillRollResult` from encounter-utils for roll parsing only).
- `handleComplete` in `use-crafting-tool-page.ts` was read only for whether it duplicates outcome math (it calls the same `calculateCraftingOutcome` path as `computeLiveCraftingOutcome`).
- `crafting-session-persist.ts` (full): Zod defaults and `min(0)` on `marketPrice`, `materialCost`, `enhancementMaterialCost`, `energyCost`, and `craftingOutcomeSchema` numeric fields. No formulas; `projectCraftingSessionPatch` only strips UI keys.
- `GET`/`POST` `src/app/api/crafting/route.ts` and `GET`/`PATCH` `src/app/api/crafting/[id]/route.ts` (cost paths only): `toSummary` sets hub `currencyCost` from `currency_cost` column, then `data.materialCost`, then `item.marketPrice`. `POST`/`PATCH` write `currency_cost` as `materialCost ?? item.marketPrice` (nullish coalescing only — **0** material cost does not fall through to market price). No requirement math on the API.
- `crafting-bootstrap.ts` (full): no price, cost, currency, or point math (uses-type migration from `multipleUseTableIndex` only).
- `CraftingItemSelectModal.tsx` (full for cost): every list row calls `getLibraryItemMarketPrice` (my/public armaments and equipment) or `getCodexEquipmentMarketPrice` (codex equipment tab); no other currency math.
- Creator cost-derivation hooks: `usePowerCreatorCostDerivation` builds `partsPayload` and calls `calculatePowerCosts` / `calculatePowerSectionContribution` for totals and section slices. `useItemCreatorCostDerivation` builds `propertiesPayload` (including weapon damage level `(amount×size−4)/2`, split-dice op levels, armor DR op levels) then `resolveItemMarketPricing` and `calculateItemCosts` per UI section via `combineItemSectionCosts`. `useEmpoweredTechniqueCostDerivation` calls `calculateEmpoweredTechniqueCosts` and per-section `calculatePowerCosts` / `calculateTechniqueCosts`. Crafting enhanced energy uses `derivePowerDisplay` in `buildCraftingPowerOptions`, which routes through `calculatePowerCosts` in `power-calc` for the same saved parts.

### Still not read line by line (crafting cost scope)

- None for this pass (calculator implementations behind the hooks remain in **Health, energy, and cost math** and item-calc summaries elsewhere).

### Disagreements

- math-disagree-bug:official-armament-codex-stored-currency-vs-item-calc: **Bug (Kadin).** Official armaments site-wide should use calculated currency from properties (`resolveItemMarketPricing` / `calculateItemCosts`), not a stored catalog `currency` / `gold_cost` column. `getCodexEquipmentMarketPrice` and `equipmentCurrency` still read stored values for codex equipment rows. Library and creator paths already use item-calc. Not intentional.
- math-disagree-deferred:crafting-codex-stored-currency-vs-library-resolve-market: **Deferred (Kadin).** Crafting still needs stored currency for now; crafter work is deferred. The picker still pairs `getCodexEquipmentMarketPrice` (stored) with `getLibraryItemMarketPrice` (calculated). Do not treat this crafting path as the immediate official-armament fix (see bug above).
- math-disagree-deferred:crafting-codex-currency-vs-persist-equipment-cost: **Deferred (Kadin).** Same crafter deferral: crafting codex rows use `equipmentCurrency` only while `persistEquipmentCost` can read a `cost` fallback elsewhere. Not scheduled for this fix pass.
- math-disagree-deferred:crafting-hub-currency-column-vs-requirements-market-price: **Deferred (Kadin).** The crafting hub list can show **0** when `materialCost` is defaulted while requirements use `item.marketPrice`. Fix with crafter work, not now.

### Same math, separate copies

- `crafting-tool-helpers` and `crafting-utils` share one implementation for table lookup, upgrade, enhanced/consumable enhanced reqs, multiple-use energy, and optional modifiers; the tool file only orchestrates session state and bulk/merge.
- `computeLiveCraftingOutcome`, `computeBaseOutcomeForDisplay`, and `handleComplete` all call `calculateCraftingOutcome` with the same market-price rules (`getEnhancedMarketPrice` when enhanced, else stored session item price).
- Enhanced save UI in `crafting-outcome-card.tsx` uses the same `getEnhancedMarketPrice(materialCost)` as live outcome for enhanced items (not a second multiplier formula).
- `getLibraryItemMarketPrice`, item creator `useItemCreatorCostDerivation` pricing, and crafting picker rows all call `resolveItemMarketPricing` when properties are available (same item-calc path).
- `buildCraftingPowerOptions` energy matches power creator totals for the same parts because `derivePowerDisplay` uses `calculatePowerCosts` internally.
- Creator section-cost hooks slice payloads then call the same calculator functions as their totals; they do not reimplement point formulas in the page files.

## Size and path recommendation math (line-by-line pass)

Creature size table, carrying-capacity kg formula, and archetype-path browse filtering (ref → entity id union). Not combat grid placement. Not a rules balance sign-off.

### Read to the end

- `SIZE_TABLE_BASE`, `CREATURE_SIZES`, `formatSizeHeightRangeCm`, `findSizeTableRow`, `sizeLabelForKey`, `calculateCarryingCapacityKg`, and `reconcileSizeWithAllowedOptions` in `src/lib/game/size-table.ts`. Carrying capacity is `baseCarry + perStrCarry × Strength`, floored at `minCarry` for the matched size row (`Math.max`). Size lookup is case/whitespace-insensitive on value or label. `reconcileSizeWithAllowedOptions` picks allowed species sizes; no numeric formulas beyond table fields.
- `character-size.ts` (size slice): `resolveEffectiveCharacterSize` and labels call `reconcileSizeWithAllowedOptions` / `findSizeTableRow` only; **no** carrying-capacity math.
- `creator-constants.ts` re-exports `CREATURE_SIZES` and `CARRYING_CAPACITY_HALF_LOAD_RULE` from `size-table` (single table source for creator dropdowns).
- `FALLBACK_RULES.SIZES` in `use-game-rules.ts` copies the same `CREATURE_SIZES` carry/spaces fields into the default core-rules payload; `mergeCoreRules` lets DB `SIZES` override that document client-side.
- `notes-tab.tsx` carrying display calls `calculateCarryingCapacityKg(characterSize, strength)` only (does not read `rules.SIZES` from the hook).
- Full `path-recommendation-index.ts`: filter alias expansion, `buildPathRecommendationIndex` (`indexByNormalizedIds` + name map, then `collectPathRecommendedIds` per path/kind), union/intersection helpers (`pathRecommendedEntityIds`, `rowMatchesPathRecommendedIds`, `applyLivePathFilter`). **No** TP, skill, energy, or currency arithmetic—only id/name resolution.
- `normalize-id.ts` (`normalizeId`, `indexByNormalizedIds`) read for path index lookups.
- `use-path-recommendation-index.ts` (full): memo wrapper around `buildPathRecommendationIndex` and `pathRecommendedEntityIds`; no extra formulas.
- `collectPathRecommendedIds` in `archetype-path.ts` was already read in **Character-check and path math**; path index calls it verbatim.

### Still not read line by line (size / path scope)

- None in this slice.
- `src/lib/game/creator-cache.ts`: localStorage draft helpers only (no cost/point math; not opened for formulas).

### Disagreements

- math-disagree-bug:size-hardcoded-carry-vs-core-rules-sizes: **Bug (Kadin).** Carrying capacity must use edited rules sizes from `core_rules` / `useGameRules`, not the hardcoded `CREATURE_SIZES` chart in `size-table.ts`. `calculateCarryingCapacityKg` on the notes tab ignores live `SIZES.categories`. Not intentional.

### Same math, separate copies

- `creator-constants` and `use-game-rules` fallback both source size rows from the same `size-table` export at build time; only the hook path can diverge after a DB edit (see disagreement above).
- Path browse lists share one `buildPathRecommendationIndex` via `usePathRecommendationIndex` / `usePathListFilter`; `guided-creator/feats-l2.ts` and codex list pages consume the same index helpers.
- Path filter chip logic (`expandPathFilterSelection`, `addPathFilterSelection`) does not duplicate entity resolution; matching uses the prebuilt `entityIdsByPathId` map.
- Character size pickers and sheet height hints use `findSizeTableRow` / `reconcileSizeWithAllowedOptions` from this module without a second carry table.

## Character creator screens (behavior pass)

What a player can do on each **character** creator surface: guided (and custom entry), entry chooser, and creature creator. Library entity creators (power, technique, item, species) are in **Library entity creator screens** below. Not a rules balance sign-off.

### Screens walked (read through save wiring)

**Entry chooser** — route `src/app/(main)/characters/new/page.tsx`. A person picks **Guided** or **Custom**; both links go to `/characters/new/guided` with `?entry=guided` or `?entry=custom` (optional `returnTo`). No form fields; quota alert only. Does not save anything.

**Guided / Custom character creator (one app)** — route `src/app/(main)/characters/new/guided/page.tsx` → `GuidedEntryBootstrap` applies `buildOpenGuidedPathEntryPatch` or `buildOpenCustomPathEntryPatch` from `path-selection-draft.ts`, then `GuidedCreatorShell`. State: `useGuidedCreatorStore` (Zustand + `localStorage`; legacy nine-step `character-creator-store` removed). Shell: chapter rail (`GUIDED_CHAPTERS`), mobile/desktop `CharacterPreviewPanel`, step body from `STEP_COMPONENTS` in `guided-creator-shell.tsx`.

| Sub-step | Component | What the player does | Draft fields touched |
|----------|-----------|----------------------|----------------------|
| `path` | `PathStep` | L1: pick codex archetype path (`buildPathSelectionDraftPatch`). L3: custom type + abilities (`buildCustomArchetypeDraftPatch`, `buildEnterCustomArchetypeLayerPatch`). Layer nav L1↔L3. | `archetypePathId`, `pathLayer`, `pow_abil`, `mart_abil`, clears dependents on change |
| `species` | `SpeciesStep` | Pick species or mixed pair; size where allowed. | `speciesName`, ancestry ids, size |
| `ancestry` | `AncestryStep` | Species traits, characteristic, ancestry trait, optional flaw. | `ancestry` blob, trait picks |
| `abilities` | `AbilitiesStep` | Recommended array or customize via `guided-abilities-customize-panel` + `AbilityScoreGrid`. | `abilities`, `abilitiesMode` |
| `skills` | `SkillsStep` | Species/path skills, spend budget via `calculateGuidedSkillPointBudget`, browse via `AddSkillModal` / sub-skills modal; `GuidedSkillsPanel` (not sheet `SkillRow`). | `skills`, `defenseVals`, `skillAbilities` |
| `archetype-feats` | `ArchetypeFeatsStep` | Path-recommended feats (`guided-feats-l2-modal` + path filter). | `archetypeFeatIds` |
| `character-feat` | `CharacterFeatStep` | Optional L1 character feat. | `characterFeatIds` |
| `loadout` | `LoadoutStep` | Phased weapon → armor → gear (`equipmentPhase`); path-filtered catalog; currency/unarmed via `computeStartingCurrency` / loadout TP helpers. | `loadoutWeapons`, `loadoutArmor`, `armaments`, `equipment`, `currency` |
| `powers-techniques` | `PowersTechniquesStep` | Innate, powers, techniques phases (`powersPhase`); L2 modals. | `innatePowerIds`, `powerIds`, `techniqueIds` |
| `reveal` | `RevealStep` | Name, age, appearance, portrait, HP/EN split (`GuidedHealthEnergySection`), summary; save when logged in. | identity + `hpAllocated` / `energyAllocated` |

**Save (guided/custom):** `RevealStep` builds payload with `buildGuidedCharacterPayload` (proficiencies via `buildRequiredProficiencies`, skills via `buildCreatorSkillSaveRows`, equipment via `resolve-loadout-items` + `applyStarterEquippedFlags`), then `cleanForSave`, then `persistFinishedCharacter` (`/api/characters` pattern in `persist-finished-character.ts`). Guests draft locally only; `LoginPromptModal` gates save. After save: optional `returnTo`, sheet tour via `characterSheetUrlWithTourOffer`, `resetCreator` on handoff helpers.

**Creature creator** — route `src/app/(main)/creature-creator/page.tsx` → `useCreatureCreatorWorkspace` + `CreatureCreatorEditor` inside **`CreatorPageShell`** (not `GuidedCreatorShell`). Bootstrap: `bootstrapCreatureState`, session draft `creator-cache` keyed `CREATURE_CREATOR_CACHE_KEY`.

What the screen exposes (via `creature-creator-editor.tsx` and child sections): name/description/image; **level** select; size; type; **ArchetypeSelector** (creature archetype type, not player path); **AbilityScoreEditor** + **HealthEnergyAllocator**; **SkillsAllocationPage** (same pattern as sheet allocation, not guided skills panel); defense skills; sense/movement trait chips with feat costs; manual **feat** list (`AddCreatureFeatModal`); **loadout** powers / empowered / techniques / armaments via `UnifiedSelectionModal` + `creature-creator-editor-loadout-sections`; inventory tabs. Budget bar from `calculateCreatureCreatorStats` / `isCreatureOverBudget` blocks save when over budget.

**Save (creature):** `useCreatureCreatorWorkspacePersistence` → `useCreatorSave({ type: 'creatures' })` with `stampCreatureSyncMeta` on payload; My Library vs Realms Library for admins (`saveTarget`); load/restart/save-as-copy through `CreatorPageShell` + `LoadFromLibraryModal`. Edits from library use `?edit=` query and `useCreatorEditDraftDecision`.

### Screens not walked in this pass

- **Legacy “standard” nine-step character wizard** — removed (`guided-creator-store` comment TASK-912); no route remains.
- **Character sheet in-place editing** — post-create play on `/characters/[id]`; not a creator screen.
- **Crafting tool** — out of scope (see **Crafting cost math**).
- **Library entity creators** — summarized in the sibling section below (not re-walked here).
- Every file under `src/components/guided-creator/` and `creature-creator-editor-*` not opened line-by-line beyond the paths above (**partial pass**).

### Same job, different behavior

- screen-behavior-note:custom-and-guided-share-one-shell: **Guided** and **Custom** on the chooser are not two apps. Both render `GuidedCreatorShell` and the same sub-steps; `buildOpenGuidedPathEntryPatch` vs `buildOpenCustomPathEntryPatch` only sets `creatorEntryMode`, `pathLayer`, and clears dependents. Custom lands on Path **L3** (no codex path id); guided lands on Path **L1** cards.
- screen-behavior-note:character-creator-shell-fork: **Player character create** uses `GuidedCreatorPageShell` + funnel chrome. **Creature creator** uses `CreatorPageShell` with toolbar load/save/publish like item/power creators. Same “creator” name, different shells and persistence (character row vs library creature).
- screen-behavior-note:guided-skills-panel-vs-skills-allocation-page: **Guided** skills step uses `GuidedSkillsPanel` / local `GuidedSkillRow` and `calculateGuidedSkillPointBudget`. **Creature creator** (and the live character sheet allocation UI) uses `SkillsAllocationPage` from patterns — same underlying `skill-allocation` spend functions when rules match, different UI and guided-only path/species suggestion wiring.
- screen-behavior-note:guided-ability-grid-vs-creature-ability-editor: **Guided** `AbilitiesStep` uses `AbilityScoreGrid` (+ customize panel). **Creature creator** uses `AbilityScoreEditor` from the creator barrel (different control layout; both use ability point formulas from `formulas.ts` when budgets match).

### Dead or unreachable paths (this scope)

- screen-behavior-note:legacy-character-creator-store-removed: No `character-creator-store` or non-guided multi-step character route; chooser “Custom” still opens `/characters/new/guided`.

## Library entity creator screens (behavior pass)

My Library / Realms Library authoring for powers, techniques, empowered techniques, armaments, and species. All use **`CreatorPageShell`** + `useCreatorSave` (except where noted). Routes under `src/app/(main)/*-creator/page.tsx`. **Partial pass:** workspace hooks and editor facades read; not every section island line-by-line.

### Screens walked (read through save wiring)

**Power creator** — `/power-creator` → `bootstrapPowerCreatorFormState`, `usePowerCreatorWorkspace`, `PowerCreatorEditor` (`power-creator-editor-*.tsx` islands), `usePowerCreatorCostDerivation` → `calculatePowerCosts`.

A person sets name/description/portrait and **targeted defenses** (`TargetedDefensesSection`). **Action profile** (action type, reaction, attack mode). **Range / area / duration** mechanic fields. **Power parts** and **advanced mechanic** parts from codex. **Damage** rows. **Composition band** (`PowerCreatorCompositionBand`): shared tab vs per-variant **Reverse** tabs — fields can inherit from shared (`power-creator-from-shared` override toggles). Summary: `AdvancedCalculationsPanel` + `CreatorSummaryPanel` (energy, TP, innate snapshot via `snapshotPowerCreatorForInnate` when applicable). Load: `useLoadModalLibrary('power')` + `LoadFromLibraryModal`. Save blocked when name empty, die/composition incomplete (`powerCreatorSaveBlockReason`), or power role quota (`formatRoleQuotaExceededMessage`).

**Save:** `useCreatorSave({ type: 'powers' })`; payload `getPayload()` = `{ name, data: powerData }` with parts/damage/composition in workspace. Admin can publish to Realms Library. Session cache + `?edit=` via `creatorEditReplacesDraft`.

**Technique creator** — `/technique-creator` → `bootstrapTechniqueCreatorFormState`, `useTechniqueCreatorWorkspace`, single **`TechniqueCreatorEditor`** file (inline `CollapsibleSection` sections, not split facades).

Combat config (weapon attack mode), action/reaction, **technique parts**, **damage** dice, targeted defenses. Costs via workspace / `calculateTechniqueCosts` (no composition variants). Same shell pattern: summary panel, advanced calc, load modal for `technique` library type.

**Save:** `useCreatorSave({ type: 'techniques' })`; `getPayload()` includes technique document + damage array shape from bootstrap comments.

**Empowered technique creator** — **separate route** `/empowered-technique-creator` (not a tab inside power or technique). `bootstrapEmpoweredTechniqueFormState`, `useEmpoweredTechniqueCreatorWorkspace`, `EmpoweredTechniqueCreatorEditor` (parallel **power** + **technique** section facades), `useEmpoweredTechniqueCostDerivation` → `calculateEmpoweredTechniqueCosts`. Loads **both** `usePowerParts` and `useTechniqueParts`. Attack mode picks cheaper Add Weapon part (`pickCheaperEnPart`) or technique No Attack. Single combined name/description/defenses; power damage + power parts + technique damage + technique parts.

**Save:** `useCreatorSave({ type: 'empowered-techniques' })`; one library row linking both sides in `getPayload()`.

**Item (armament) creator** — `/item-creator` (optional `?type=weapon|armor|shield` on new drafts; `?edit=` ignores type). `bootstrapItemCreatorFormState`, `useItemCreatorWorkspace`, `ItemCreatorEditor` switches **Weapon / Armor / Shield** panels. Property picks, weapon range/damage, armor DR, shield block/damage; `useItemCreatorCostDerivation` → `resolveItemMarketPricing` / `calculateItemCosts`. Summary shows currency, IP, TP, rarity (`RarityReferenceTable`). Load modal `useLoadModalLibrary('item', { itemKind })` with kind tied to armament type.

**Save:** `useCreatorSave({ type: 'items' })`; properties + mechanic fields in payload. Changing `?type=` on a draft does not remount session (`sessionKey` = edit id or `'draft'`) — workspace warns instead of silent wipe.

**Species creator** — `/species-creator` → `useSpeciesCreatorWorkspace`, `SpeciesCreatorEditor`, trait pickers via `TraitListModal` / `UnifiedSelectionModal`.

A person sets species name, type, image, description, height/weight/lifespan, **sizes** (`SIZE_OPTIONS`), two **base skills** (base skills only; `"Any"` id `0` allowed), **languages**, and trait buckets (species / ancestry / characteristic / flaw) with caps from `species-creator-bootstrap`. **No** energy/TP advanced calc panel on this page. Load works **without login** (`requireAuthToLoad: false` on `CreatorPageShell` auth).

**Save:** `useCreatorSave({ type: 'species' })`; payload is species codex shape (`species_traits`, `skills`, `sizes`, etc.) to **My Codex**; admin publish targets **Realms Codex** species.

### Screens not walked in this pass

- Every `power-creator-editor-*`, `empowered-technique-editor-*`, and `item-creator-editor-*` island beyond the facade list (**partial**).
- Admin-only codex spreadsheet editors for the same entities (different screens).
- **Crafting**, **encounters**, hub **Library** browser pages.

### Same job, different behavior

- screen-behavior-note:empowered-technique-separate-screen: **Empowered technique** is its own URL and `useCreatorSave` type `empowered-techniques`, not a mode inside power or technique creators. It merges two part databases in one form.
- screen-behavior-note:power-composition-variants-vs-technique-single-flow: **Power** alone has `PowerCreatorCompositionBand` (shared + reverse variant tabs, inheritance overrides, `hidePartsAndDamage` on shared randomize). **Technique** and **item** creators are a single form state with no variant tab strip.
- screen-behavior-note:power-facade-sections-vs-technique-monolith-editor: **Power** (and **empowered** power half) use thin `power-creator-editor.tsx` facades into many files. **Technique** keeps sections in one `technique-creator-editor.tsx` with `CollapsibleSection` + `PowerPartCard` reused for technique parts.
- screen-behavior-note:species-creator-guest-load: **Species** sets `requireAuthToLoad: false` so Load opens without `LoginPromptModal`; other entity creators default to requiring auth for load (power page uses standard auth config).
- screen-behavior-note:item-creator-type-query-vs-session-key: New item drafts can start from `?type=`, but `sessionKey` stays `'draft'` so switching type in the URL does not auto-reset; item workspace shows a type-mismatch warning instead of remounting like `?edit=` sessions do.

### Dead or unreachable paths (this scope)

- screen-behavior-note:no-empowered-mode-on-power-or-technique-routes: There is no empowered-technique editor inside `/power-creator` or `/technique-creator`; only `/empowered-technique-creator`.

## Encounter screens (behavior pass)

RM-facing encounter hub and play routes: list/create, type-specific play pages, shared play shell, combat/skill views, add-participant modal, roll log, initiative, and combat conditions. **Partial pass:** play hooks and main panels read; `add-combatant-modal` picker tabs and tabletop sync not line-by-line.

### Screens walked (read through save wiring)

**Encounters list** — `/encounters` → `EncountersContent` in `encounters/page.tsx`.

A person searches and filters (tabs All / Active / Completed, type chips combat/skill/mixed), opens a row (`handleOpen` → `/encounters/{id}/{type}`), creates via `CreateEncounterModal` (`createDefaultEncounter` + `useCreateEncounter`), marks complete (`useSaveEncounter` patches `status: 'completed'`, `isActive: false`, `currentTurnIndex: -1`), or deletes (`useDeleteEncounter`). Guests see a sign-in banner; `useEncounters` falls back to **localStorage** guest encounters (`use-encounters.ts`, `guest-encounter-storage`).

**Encounter type redirect** — `/encounters/[id]/page.tsx` loads `useEncounter` then `router.replace` to `/encounters/{id}/{encounter.type}`. No play UI on this URL.

**Combat play** — `/encounters/[id]/combat/page.tsx` → `useEncounterPlayPage` + `RollProvider` + `CombatEncounterView` (`showRollLog` default **true**).

**Skill play** — `/encounters/[id]/skill/page.tsx` → `useEncounterPlayPage({ keepaliveOnUnload: true, requireSkillEncounter: true, prepareLoaded: prepareSkillEncounter })` + `SkillEncounterView`.

**Mixed play** — `/encounters/[id]/mixed/page.tsx` → same play shell with `prepareMixedEncounter`; `SegmentedControl` switches Combat vs Skill; last tab per encounter id in **`sessionStorage`** (`readMixedEncounterViewTab` / `writeMixedEncounterViewTab`). Both `CombatEncounterView` and `SkillEncounterView` mount (CSS `hidden` on inactive tab) with `showRollLog={false}`; one shared **`RollLog`** at page bottom.

**Shared play shell** — `useEncounterPlayPage` in `encounter-play-page-shell.tsx`: hydrates encounter once per id (`prepareLoaded` optional), local `encounter` state, `useAutoSave` (1.5s debounce) → `encounterAutosaveBody` → `useSaveEncounter` or guest `persistEncounterSave` with **keepalive** only when `keepaliveOnUnload` (skill route). Header: `EncounterPageHeader` (inline name edit). Combat/mixed also expose `OpenTabletopButton` (`saveNow` before open).

**What saves:** The whole `Encounter` document (combatants, round/turn fields, `skillEncounter` blob, campaign link, status). Autosave on play pages; list “mark complete” patches status fields only. Signed-in → `/api/encounters/[id]`; guest ids → localStorage merge.

**Add combatant / participant** — `AddCombatantModal` (`add-combatant-modal.tsx`): Library creatures + campaign characters; `mode="combat"` on combat view (`onAdd` → `addCombatantsFromModal` as `TrackedCombatant[]`) or `mode="skill"` on skill view (`onAddParticipants` → `SkillParticipant[]`, plus `onAdd` for copying combatants in mixed). Not `UnifiedSelectionModal`. Initiative on add uses local `rollInitiative` in the modal (duplicate of `encounter-view-helpers.rollInitiative`).

**Initiative** — Combat: `CombatRoundControls` **Sort Initiative** → `useCombatRoundActions.sortInitiative`; per-card edit/drag on `CombatantCardInitiative`; manual reorder on `CombatCombatantList`. Skill (optional `useInitiative`): `SkillSidebar` duplicate **Sort Initiative** + sync with combat order / copy combatants to skill when `isMixedEncounter`; participant initiative via `rollInitiativeForParticipant` on `ParticipantCard`.

**Conditions** — Combat only on `CombatantCard`: `CombatantCardConditionChips` + `CombatantCardConditionsPanel` (`CONDITION_OPTIONS` from `encounter-constants.ts`); leveled conditions via chip click / context menu. Skill participants have **no** condition panel on `ParticipantCard`.

**Roll log** — `RollLog` in `components/rolls/roll-log.tsx` inside `RollProvider`; `viewOnlyCampaignId={encounter.campaignId}` when linked. Personal vs campaign log modes in-component; rolls from sheet/cards elsewhere also land in context. Mixed page: single docked log for both tabs; standalone combat/skill attach log to view and apply `ENCOUNTER_TRACKER_DOCK_FRAME_CLASS` on the grid when `showRollLog`.

### Screens not walked in this pass

- VTT / tabletop page opened by `OpenTabletopButton` (separate route).
- `EncounterCampaignRosterSection` campaign link UI beyond props wiring.
- Full `add-combatant-modal` library/campaign picker bodies.
- `/encounters/[id]/combat` is walked; **library hub** and **crafting** not started (per scope).

### Same job, different behavior

- screen-behavior-note:mixed-one-roll-log-vs-view-embedded-log: **Mixed** hides per-view `RollLog` and renders one page-level `RollLog`. **Combat** and **skill** standalone pages pass `showRollLog` so the log sits in the view layout with dock framing.
- screen-behavior-note:skill-unload-keepalive-autosave: Only the **skill** play route sets `keepaliveOnUnload: true` on `useEncounterPlayPage`, so tab-close/refresh can flush via `persistEncounterSave(..., { keepalive: true })`. Combat and mixed use the mutation path only on autosave.
- screen-behavior-note:add-combatant-modal-combat-vs-skill-mode: Same modal component; **`mode="combat"`** confirms `TrackedCombatant` payloads through `onAdd`. **`mode="skill"`** confirms `SkillParticipant` through `onAddParticipants` (and can still wire `onAdd` for combatant-shaped copies in mixed).
- screen-behavior-note:combatant-card-vs-skill-participant-card: **Combat** list renders `CombatantCard` (HP/EN/AP, conditions, initiative column). **Skill** list renders `ParticipantCard` (DS roll, successes/failures, helping); conditions UI does not exist on skill cards.
- screen-behavior-note:duplicate-sort-initiative-in-combat-and-skill-sidebars: **Sort Initiative** appears in `CombatRoundControls` and again in `SkillSidebar` when skill initiative mode is on — separate handlers (`sortInitiative` vs `sortByInitiative`), same user-facing label.
- screen-behavior-note:mixed-view-tab-session-only: Mixed Combat/Skill tab choice is stored in **browser sessionStorage**, not on the `Encounter` row; refresh within the session restores tab, other devices do not.

### Dead or unreachable paths (this scope)

- screen-behavior-note:encounter-id-redirect-no-type-page: `/encounters/[id]` never renders play; only redirects or error. A stored `encounter.type` with no matching play route file would `replace` to a missing page (redirect does not validate against known types).

## Library screens (behavior pass)

Single hub **`/library`** (`library/page.tsx`) for **My Library** (signed-in user rows) and **Realms Library** (official published rows). Legacy **`/browse`** redirects here. **Partial pass:** tab row components and `UserLibraryEntityTabShell` read; pattern `Official*List` implementations not line-by-line. **Admin** official-library editor (`/admin/public-library`) out of scope.

### Screens walked (read through save/delete wiring)

**Library hub** — one page, two scopes via `SegmentedControl` (`libraryMode` `'my' | 'public'`). Boot: `?view=realms` → start on Realms; guests always **public** (no toggle). `TabNavigation` entity tabs (counts from `useUserLibraryCounts` vs `useOfficialLibraryCounts` + `libraryTabCount`). Header **Create** link follows active tab (`TABS[].createHref`) — only in **My Library**, not guest, not Realms browse. Deletes run on the page via `DeleteConfirmModal` + type-specific `useDelete*` hooks.

| Tab id | My Library component | Realms (`LibraryPublicContent`) | Typical save / edit |
|--------|----------------------|----------------------------------|---------------------|
| `powers` | `LibraryPowersTab` | `PublicPowersList` + `OfficialPowerList` | User: `/api/user/library/...`, edit → `/power-creator?edit=`; add official: `useAddOfficialToLibrary('powers')` |
| `techniques` | `LibraryTechniquesTab` `mode="standard"` | `PublicTechniquesList` standard | Same pattern; empowered uses separate API type |
| `empowered-techniques` | `LibraryTechniquesTab` `mode="empowered"` | `PublicTechniquesList` `mode="empowered"` | `useUserEmpoweredTechniques` / `useAddOfficialToLibrary('empowered-techniques')` |
| `weapons` / `armor` / `shields` | `LibraryItemsTab` per `armamentKind` | `PublicItemsList` per kind | User items API; create → `itemCreatorTypeHref(kind)`; official items fetched once as `'items'` then filtered |
| `creatures` | `LibraryCreaturesTab` | `PublicCreaturesList` | Edit → `/creature-creator?edit=`; stat-block rows |
| `enhanced` | `LibraryEnhancedTab` | *(tab hidden)* | `useEnhancedItems`; edit → `/crafting/{id}`; create CTA → `/crafting` |

**My Library row actions** (most tabs): `UserLibraryEntityTabShell` — search/sort/filters, per-row **Edit**, **Delete** (delegates to page), **Duplicate** (`useLibraryDuplicateConfirm` + `useDuplicate*`), **Sync** when codex drift (`useLibraryEntitySync` → `saveToLibrary` patch). **Add to character** on several tabs via `LibraryAddToCharacterButton` + `useAddToCharacterFromLibrary`. Power tab can block **Create** when `isAtRoleQuota` for custom powers.

**Realms Library row actions**: read-only lists for guests (`readOnly` → no Add button); signed-in users **Add to library** → confirm modal → `useAddOfficialToLibrary` copies official row into user library (then editable in My Library).

**Species:** not a tab on `/library`. Custom species use **species creator** / My Codex flows elsewhere; official species are not browsed on this hub.

### Screens not walked in this pass

- `/admin/public-library` and other admin publish tools.
- Full bodies of `OfficialPowerList`, `OfficialTechniqueList`, `OfficialItemList`, `OfficialCreatureList` in `components/patterns`.
- **Crafting** save UI (enhanced tab only links in).
- Codex species browse (separate product surface).

### Same job, different behavior

- screen-behavior-note:library-my-vs-realms-one-page-toggle: **My Library** and **Realms Library** are not separate routes; `library/page.tsx` swaps `LibraryPowersTab` (etc.) vs `LibraryPublicContent` from `resolvedLibraryMode`.
- screen-behavior-note:library-guest-realms-read-only: Guests always see Realms lists with `readOnly` and `LibraryGuestNotice`; no scope toggle, no Create, Add prompts `LoginPromptModal`.
- screen-behavior-note:library-enhanced-tab-my-only: **Enhanced Items** tab exists only in My Library (`TABS` filtered + state clamp from `enhanced` → `powers` if user switches to Realms).
- screen-behavior-note:library-techniques-tab-empowered-dual-hook: Standard and **Empowered** are separate nav tabs but both use **`LibraryTechniquesTab`** with `mode` — only the matching `useUserTechniques` / `useUserEmpoweredTechniques` query is enabled.
- screen-behavior-note:library-realms-add-official-vs-my-sync: Realms mode **adds** via `useAddOfficialToLibrary`. My mode **updates** user rows via creators, duplicate, or drift **sync** (`saveToLibrary` with `existingId`) — not the same as official add.
- screen-behavior-note:library-creatures-tab-embeds-roll-log: Only **`LibraryCreaturesTab`** wraps the list in `RollProvider` and passes `afterList={<RollLog />}` on the entity shell; other My tabs do not embed a roll log on this page.
- screen-behavior-note:library-enhanced-edit-via-crafting-route: **Enhanced** rows edit with `router.push('/crafting/{id}')`, not item or power creators; create CTA on that tab points to `/crafting`.

### Dead or unreachable paths (this scope)

- screen-behavior-note:library-no-species-tab: There is no species tab on `/library`; species are not listed on this hub (codex / species creator instead).
- screen-behavior-note:legacy-browse-alias-redirect: `/browse` does not render; permanent redirect to `/library` (same hub as Realms guest browse).

## Character sheet screens (behavior pass)

Play and edit surfaces: character list, live sheet at `/characters/[id]`, main column sections, and library sub-tabs. **Partial pass:** `use-character-sheet-actions` and enrichment hooks skimmed; campaign **view-only** sheet URL not walked.

### Screens walked (read through save wiring)

**Character list** — `/characters` → `characters/page.tsx`.

Signed-in users see account characters (`useCharacters`), delete, duplicate (`useDuplicateCharacter`), create → `/characters/new` (role quota via `useCharacterQuota`). Signed-out users can still see **browser-local guest** sheets (`getGuestCharactersList`); create works locally with sign-in CTA. Deletes use `DeleteConfirmModal` with `deleteContext` `browser` vs `account`.

**Character sheet page** — `/characters/[id]` → `character-sheet-route.tsx` + `useCharacterSheetPage` (data in `use-character-sheet-page-data`, chrome in `use-character-sheet-page-ui`).

**Load & save:** `useCharacter` hydrates React Query; owner edits `patchCharacterDetailQuery`. **`useAutoSave`** debounces → `cleanForSave` → **dirty-field** patch via `saveCharacterWithConflictRetry` (`/api/characters/[id]`). Guest ids use guest storage branch inside character service. Owners get `CloudSyncOfflineBanner`, conflict merge (`mergeRemotePreservingDirty`), optional **realtime** merge; guests skip `useCharacterResourceSync` (encounter HP sync).

**Owner vs viewer:** `isOwner` = guest sheet **or** `character.userId === user.uid`. Non-owners see “View only”, no `SheetActionToolbar`, handlers stripped with `whenSheetOwner`. `RollProvider` sets `canRoll={isOwner}` and personal roll log id for owners.

**Interaction modes** (owner): `SheetActionToolbar` toggles **Edit** and **Temp** via `nextSheetInteractionMode` — mutually exclusive; clicking active mode turns both off. `effectiveEditMode` / `effectiveTempModifierMode` require `isOwner`. Edit unlocks ability/skill spend, library adds/removes, archetype/species modals. Temp mode drives `tempModifiers` on abilities/skills without full edit chrome.

**Header** — `SheetHeader`: name (edit mode), portrait upload, current/max HP & EN & AP, XP, level-up entry, archetype/species edit buttons (edit mode), recovery/level-up/settings modals.

**Main sections** (`CharacterSheetBody`):

| Section | Component | Play vs edit (summary) |
|---------|-----------|-------------------------|
| Abilities & defenses | `AbilitiesSection` | Edit: spend ability points, defense skills; Temp: temp modifiers |
| Skills | `SkillsSection` | Edit: add/remove/allocate (`SkillRow` from patterns); uses `AddSubSkillModal`; Temp: temp bonuses |
| Archetype & attacks | `ArchetypeSection` | Proficiencies, milestones, quick armor table, equipped attacks |
| Library (card) | `LibrarySection` | Nested tabs below; extra **EditSectionToggle** when sheet edit mode is on (library-specific edit chrome) |

**Desktop vs mobile:** Desktop shows abilities full-width, then a grid with skills / archetype / library. **Mobile** uses horizontal snap carousel (`SHEET_CAROUSEL_PANEL_OPTIONS`: Abilities, Skills, Archetype, Library) + sticky `SegmentedControl`; abilities render twice (desktop block + mobile panel).

**Library sub-tabs** (`LIBRARY_TAB_DEFS` / `library-tab-config.ts`): **Feats**, **Powers**, **Techniques**, **Inventory** (weapons, shields, armor, equipment), **Proficiencies**, **Notes** (named notes + visibility). Tab visibility toggles (settings) hide tabs in **play** mode; `resolveLibraryActiveTab` jumps to a visible tab. Add buttons open `CharacterSheetModals` → `AddLibraryItemModal` / `AddFeatModal` / etc. **Empowered techniques** are not a library tab; they are picked inside **Add power** flow (`powerSelectionMode === 'empowered'` on the modal). Powers panel splits innate vs regular; techniques use spend/energy row chrome.

**Roll log:** Page-level `RollLog` under `RollProvider` (not inside library creatures tab — that pattern is hub-only).

### Screens not walked in this pass

- `/campaigns/.../view/.../character` read-only sheet embedding.
- Every handler inside `use-character-sheet-actions.ts` line-by-line.
- Onboarding tour steps beyond modal wiring.
- Campaigns, admin, crafting, marketing (per scope).

### Same job, different behavior

- screen-behavior-note:sheet-mobile-carousel-vs-desktop-layout: **Mobile** side-scrolls four section panels; **desktop** uses a multi-column grid and shows **Abilities** outside the carousel (duplicate mount on small viewports only).
- screen-behavior-note:sheet-edit-and-temp-modes-exclusive: **Edit** and **Temp** cannot both be active; toolbar uses `nextSheetInteractionMode` to flip one off when enabling the other.
- screen-behavior-note:sheet-library-sub-edit-toggle: Sheet-level **Edit** does not immediately enable library row delete/add; **`EditSectionToggle`** on the library card toggles `showLibraryEditControls` separately.
- screen-behavior-note:sheet-library-tab-visibility-play-mode: Hidden library tabs (settings) are skipped when **not** in edit mode via `resolveLibraryActiveTab`; in edit mode all tabs stay reachable for visibility editing.
- screen-behavior-note:sheet-guest-owner-local-save: **Guest** sheets count as **owner** for edits but persist in **browser storage**, show guest banner, lock **visibility** settings, and skip encounter resource sync hooks used by signed-in sheets.
- screen-behavior-note:sheet-viewer-omits-toolbar-and-handlers: **Viewers** get no action toolbar; `whenSheetOwner` drops change handlers so controls do not appear as dead buttons.
- screen-behavior-note:sheet-empowered-in-add-power-modal: Hub library has an **Empowered** tab; the **character sheet** has no empowered library tab — empowered picks use **`AddLibraryItemModal`** power mode sub-switch.
- screen-behavior-note:sheet-skills-skill-row-vs-guided-guided-skill-row: Sheet **`SkillsSection`** uses shared `SkillRow` from patterns; guided creator uses **`GuidedSkillRow`** in `guided-skills-panel.tsx` (same spend math, different UI).

### Dead or unreachable paths (this scope)

- screen-behavior-note:sheet-no-standalone-empowered-library-tab: `LIBRARY_TAB_DEFS` has no `empowered-techniques` entry; empowered content is only via add-power modal mode.

## Campaign screens (behavior pass)

Signed-in **campaign** hub, detail, roster, shared roll log, and Realm Master (RM) **embedded read-only sheet**. Server actions in `campaigns/actions.ts` persist roster and metadata. **Partial pass:** API/SQL behind actions not opened; **VTT tabletop** route (`/campaigns/[id]/tabletop`) not walked.

### Screens walked (read through save wiring)

**Campaign list** — `/campaigns` → `campaigns/page.tsx`.

**Guests** see a sign-in wall only (no list). Signed-in users get tabs **My Campaigns**, **Create Campaign**, **Join Campaign** (`?tab=create|join` syncs tab). **Create** calls `createCampaignAction` → new row + **invite code** display. **Join** calls `joinCampaignAction` with invite code + selected character (guest characters filtered out); may set character **visibility** to campaign-wide so others can view the sheet. **My Campaigns** links to `/campaigns/{id}`.

**Campaign detail** — `/campaigns/[id]` → `campaign-detail-route.tsx` inside `ProtectedRoute` + `useCampaignDetailPage`.

**RM** (`campaign.ownerId === user.uid`): edit name/description via `updateCampaignAction`, delete campaign, copy invite (`CampaignInviteSection`), add own characters through **`AddCharacterModal`** (`addCharacterToCampaignAction`, capped by `OWNER_MAX_CHARACTERS` and `MAX_CAMPAIGN_CHARACTERS`), remove any roster entry. **Players:** view roster; remove **only their own** character; no invite section; cannot use RM add-character modal (they joined from the list **Join** tab).

**Roster** — `CampaignRosterSection`: RM block (owner’s characters + optional Add) and **Players** block. `CharacterChip` remove rules: `canRemove = isRealmMaster || userId === currentUserId`. **View sheet** link (`/campaigns/{id}/view/{userId}/{characterId}`) is passed only for **other players’** chips when the viewer is the RM (`onViewSheet`); opens in new tab. RM’s own chips have no external view link (use `/characters/{id}` for play).

**Campaign roll log** — `CampaignRollLogSection` + `useCampaignRolls`: read-only, scrollable feed of `RollEntryCard` rows (newest at bottom); realtime/refetch from campaign rolls API. This is **not** the interactive `RollLog` FAB—it's an audit trail on the detail page.

**Embedded character view (RM)** — `/campaigns/[id]/view/[userId]/[characterId]` → `useCampaignCharacterView` (roster + RM auth), **not** `useCharacter` / `/api/characters/[id]` alone. Renders `SheetHeader` + `CharacterSheetBody` with `buildReadOnlySheetContextValue` / `buildReadOnlyLibraryHandlers` (no edit toolbar, `isEditMode` false). `RollProvider` sets `campaignContext` so rolls can post to the campaign log; page-level `RollLog` for local history.

**What saves:** Campaign name/description (RM update actions); roster membership add/remove; join/create/delete campaign; rolls appended via `addCampaignRoll` when a sheet in campaign context rolls (feeds detail log). Character sheet data still saves on the owner’s `/characters/[id]` route—not on the campaign view URL.

### Screens not walked in this pass

- `/campaigns/[id]/tabletop` (encounter/tabletop play).
- Campaign server actions and Supabase policies line-by-line.
- Admin, crafting, marketing (per scope).

### Same job, different behavior

- screen-behavior-note:campaigns-guest-sign-in-wall: **`/campaigns`** is entirely gated for guests; unlike `/library`, there is no read-only campaign browse without signing in.
- screen-behavior-note:campaign-join-list-tab-vs-rm-detail-add: **Players** enter via **Join** tab + invite code. **RM** adds characters on **detail** via `AddCharacterModal` (`addCharacterToCampaignAction`); non-RM never get the detail add flow for another player’s slot.
- screen-behavior-note:campaign-detail-roll-feed-vs-sheet-roll-log: **Detail** shows a static **Campaign Roll Log** section (`useCampaignRolls`). **Character sheets** use interactive `RollLog` + `RollProvider`; when `campaignContext` is set, `addRoll` also persists to the campaign feed.
- screen-behavior-note:campaign-embedded-sheet-campaign-view-hook: RM **view** route loads **`useCampaignCharacterView`** (campaign-scoped authorization), not the owner sheet’s `useCharacter` query path.
- screen-behavior-note:campaign-view-sheet-link-rm-other-players-only: **`CharacterChip`** `onViewSheet` is set only for **other** players when viewer is RM; player chips never get view links for peers on the roster UI.
- screen-behavior-note:campaign-remove-rm-or-own-character: Remove is allowed for **RM (any)** or **the owning player (self only)**—not for a player removing someone else.
- screen-behavior-note:campaign-visibility-bump-on-join: **Join** and **add-to-campaign** actions can set character visibility to **campaign** (toast when `visibilityUpdated`) so RM/peers can open the sheet view.

### Dead or unreachable paths (this scope)

- screen-behavior-note:campaign-player-no-peer-sheet-from-roster: The roster UI does not offer “view sheet” for fellow **players**—only the RM gets the external view link on other players’ chips.
- screen-behavior-note:campaign-tabletop-not-on-detail-page: **Tabletop/VTT** is a separate route under the campaign id, not a section on the detail page walked here.

## Unused exports outside game and calculators

No production file imports these names. A test import does not count. The file that exports the name may still call it. This is not a dead function unless nothing in that file calls it either. Next.js page, layout, route, proxy, and MDX conventions are not listed. `src/lib/game` and `src/lib/calculators` were not part of this search. The hook, service, and store files the barrels omit are imported by their own paths. The names below are the extra exports in those trees, not unused files.

### Only a test imports this

- `src/app/(main)/admin/codex/admin-codex-unsaved-leave.ts`: `codexEditorWarning`, `CodexEditorExit` (type)
- `src/app/(main)/admin/codex/admin-property-form.ts`: `normalizePropertyType`
- `src/app/(main)/admin/codex/codex-column-map.ts`: `columnarDbColumns`
- `src/app/(main)/admin/codex/codex-spreadsheet-helpers.ts`: `rowDataWithoutId`
- `src/app/(main)/admin/core-rules/core-rules-conditions.ts`: `LEVELED_CONDITION_NAMES`
- `src/app/(main)/admin/core-rules/core-rules-number.ts`: `CORE_RULES_NUMBER_REQUIRED`, `CORE_RULES_NUMBER_SERVER_NEGATIVE`, `CORE_RULES_NUMBER_TOO_LARGE`, `CORE_RULES_NUMBER_WHOLE`
- `src/app/(main)/admin/core-rules/core-rules-unsaved-leave.ts`: `CORE_RULES_EDITOR_DISCARD_CONFIRM`, `CORE_RULES_EDITOR_DISCARD_DESCRIPTION`, `CORE_RULES_TAB_DISCARD_CONFIRM`
- `src/app/(main)/admin/sources/actions.ts`: `addAdminCodexSourceMembership`
- `src/app/(main)/admin/users/admin-users-directory-state.ts`: `tryApplyContinuationResult`
- `src/app/(main)/creature-creator/creature-creator-library-selectables.ts`: `codexEquipmentAsLibraryItem`
- `src/app/(main)/creature-creator/creature-creator-remove-section-confirm-placeholder.ts`: `REMOVE_SECTION_CONFIRM_CONFIRM_LABEL`, `REMOVE_SECTION_CONFIRM_DESCRIPTION`
- `src/app/(main)/creature-creator/map-creature-inventory-rows.ts`: `creatureArmamentToSheetItem`
- `src/app/(main)/creature-creator/transformers.ts`: `customEquipmentItemToCreatureArmament`
- `src/app/(main)/encounters/[id]/_components/combat/use-combat-round-actions.ts`: `encounterStateAfterEnd`, `encounterStateAfterStart`
- `src/app/(main)/encounters/[id]/_components/encounter-play-page-shell.tsx`: `encounterPlayPageGatePhase`
- `src/app/(main)/item-creator/item-creator-editor-armor.tsx`: `ARMOR_FIELD_GRID_CLASS`
- `src/app/(main)/item-creator/item-creator-helpers.tsx`: `RARITY_REFERENCE`, `formatPropertyHeaderCost`, `formatPropertyPerLevelCost`, `propertyPointTotal`
- `src/app/(main)/item-creator/item-creator-property-options.ts`: `ADD_PROPERTY_DISABLED_REASON`, `ADD_PROPERTY_SHIELD_DISABLED_REASON`
- `src/app/(main)/my-account/_components/account-profile-card.tsx`: `PROFILE_PICTURE_UPLOAD_DENIED`
- `src/app/(main)/power-creator/power-creator-composition.ts`: `overlayFlagsFromVariants`
- `src/app/(main)/power-creator/power-creator-part-actions.ts`: `nextMechanicPartToAdd`
- `src/app/(main)/species-creator/species-creator-bootstrap.ts`: `resolveSpeciesEditForm`
- `src/app/robots.ts`: `ROBOTS_DISALLOW`
- `src/app/sitemap.ts`: `SITEMAP_PATHS`
- `src/components/character-sheet/level-up-modal.tsx`: `calculateLevelGains`
- `src/components/character-sheet/library-feat-rows.tsx`: `customizationDraftDiffers`, `traitRowId`
- `src/components/character-sheet/notes-tab.tsx`: `SheetNoteField`
- `src/components/character-sheet/sheet-currency-input-layout.ts`: `SHEET_CURRENCY_INPUT_MAX_CH`, `SHEET_CURRENCY_INPUT_MAX_CHROME_CH`, `SHEET_CURRENCY_REPRO_FORMATTED`
- `src/components/character-sheet/sheet-desktop-columns.ts`: `archetypeStackedWeaponNamePx`, `sheetSkillNameCellPx`, `sheetThreeColumnFits`, `sheetWeaponNameCellPx`
- `src/components/character-sheet/sheet-header-layout.ts`: `sheetHeaderThreeColumnFits`
- `src/components/character-sheet/use-sheet-feat-actions.ts`: `traitUsesAfterDelta`
- `src/components/creator/CreatorSaveToolbar.tsx`: `CREATOR_SAVE_DISABLED_CLASS`
- `src/components/creator/LoadFromLibraryModal.tsx`: `LOAD_FROM_LIBRARY_MODAL_SIZE`
- `src/components/creator/ability-score-editor.tsx`: `abilityNextCostVisible`
- `src/components/creator/power-part-card.tsx`: `creatorPartOptionLabel`, `formatCreatorPartEnergy`
- `src/components/encounters/combatant-card-resources.tsx`: `COMBATANT_RESOURCE_NUMBER_INPUT_CLASS`
- `src/components/guided-creator/guided-choice-card.tsx`: `guidedChoiceCardSelectAriaLabel`, `isGuidedChoiceCardSelectKey`
- `src/components/guided-creator/guided-equipment-l2-grid.ts`: `ARMOR_L2_HEADER_COLUMNS`, `GEAR_L2_HEADER_COLUMNS`, `WEAPON_L2_HEADER_COLUMNS`
- `src/components/guided-creator/guided-skills-panel.tsx`: `AssignedSkillDetails`
- `src/components/layout/header.tsx`: `accountAvatarInitial`, `accountMenuPointerClickState`, `armDismissClickSwallow`, `shouldCloseDisclosureOnFocusLeave`, `shouldCloseDisclosureOnOutsidePointer`
- `src/components/patterns/chrome/cloud-sync-offline-banner.tsx`: `CLOUD_SYNC_SERVER_UNREACHABLE_BODY`, `CLOUD_SYNC_SERVER_UNREACHABLE_TITLE`
- `src/components/patterns/chrome/image-upload-modal.tsx`: `IMAGE_CROPPER_KEYBOARD_HINT`, `imageCropperA11yProps`
- `src/components/patterns/chrome/roll-button.tsx`: `rollButtonVariants`
- `src/components/patterns/list/entity-library-powers-techniques.tsx`: `powerListFactCells`
- `src/components/patterns/list/grid-list-row-chrome.ts`: `GRID_LIST_ROW_THUMBNAIL_COLUMN_WIDTH`, `collapsedNameTrackWidthPx`, `expandGridTemplateTokens`, `externalChromeFootprintWidth`
- `src/components/patterns/list/grid-list-row-columns.ts`: `columnHasInteractiveValue`, `dataColumnTrackCount`
- `src/components/patterns/list/grid-list-row.tsx`: `expandedBodyClickShouldToggle`, `selectedTextInside`
- `src/components/patterns/list/hub-list-row.tsx`: `HUB_LIST_ROW_MOBILE_CHROME_END_DEFAULT`, `HUB_LIST_ROW_MOBILE_CHROME_END_SLOT`, `hubListRowMobileChromeEnd`
- `src/components/patterns/list/list-header.tsx`: `columnSortAccessibleName`
- `src/components/patterns/select/powered-martial-slider.tsx`: `formatProficiencyPointTotal`
- `src/components/patterns/select/unified-selection-modal.tsx`: `selectionAddBlocked`
- `src/components/rolls/roll-log.tsx`: `isCreatorRoutePath`, `rollLogShowsDiceBuilder`
- `src/components/ui/button.tsx`: `buttonVariants`
- `src/components/ui/icon-button.tsx`: `iconButtonVariants`
- `src/components/ui/tab-navigation.tsx`: `scrollDeltaToRevealChild`, `tabListOverflowState`
- `src/hooks/use-auto-save.ts`: `AUTOSAVE_RETRY_DELAYS_MS`, `flushDirtyAutosave`, `nextAutosaveRetryDelayMs`
- `src/hooks/use-browser-offline.ts`: `getBrowserOfflineSnapshot`, `subscribeBrowserOffline`
- `src/hooks/use-characters.ts`: `mergeCharacterDetailQueryData`, `nextCharacterDetailQueryData`
- `src/hooks/use-library-section-collapse.ts`: `librarySectionExpandedForCount`, `librarySectionStateForMount`, `readLibrarySectionSession`, `rememberLibrarySectionSession`
- `src/hooks/use-user-library.ts`: `userLibraryAfterMutationKeys`
- `src/lib/admin-users-search.ts`: `buildAdminUsersIlikePattern`, `compareAdminUserProfilesForListing`, `profileMatchesAdminUserSearch`, `rolesMatchingAdminUserSearchQuery`
- `src/lib/ancestry/ancestry-selection.ts`: `areSpeciesTraitChoicesComplete`
- `src/lib/api-client.ts`: `ApiError`
- `src/lib/api-input-validation-scan.ts`: `collectInputValidationGaps`, `collectReExportedHandlerMethods`, `getHandlerMethod`, `handlerReadsJsonBody`, `handlerReadsQuery`, `handlerUsesRouteParams`, `splitHandlerChunks`
- `src/lib/api-mutation-guard-route-scan.ts`: `chunkInvokesMutationGuard`, `stripCommentsAndStringLiterals`
- `src/lib/api-mutation-guard.ts`: `isApiMutationMethod`
- `src/lib/api-validation.ts`: `readBodyWithLimit`
- `src/lib/api/public-catalog-cache-invalidation.ts`: `codexListedGetCacheTags`, `codexWritePurgeCacheTags`, `officialListedGetCacheTags`, `officialWritePurgeCacheTags`
- `src/lib/api/public-cdn-cache.ts`: `VERCEL_CACHE_TAG_HEADER`
- `src/lib/auth-errors.ts`: `AUTH_EMAIL_NOT_CONFIRMED_MESSAGE`, `AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE`
- `src/lib/auth-redirect.ts`: `collectAllowedRedirectHosts`, `resolveCanonicalRedirectOrigin`, `resolveTrustedRedirectOrigin`
- `src/lib/auth/auth-page-client.ts`: `buildGoogleOAuthCallbackUrl`
- `src/lib/auth/oauth-delete-grant-core.ts`: `verifyOAuthDeleteIntent`
- `src/lib/auth/session-persistence.ts`: `PERSISTENT_AUTH_SESSION_MAX_AGE_S`
- `src/lib/auth/supabase-pkce-cookies.ts`: `supabasePkceCodeVerifierCookieKey`
- `src/lib/campaign-invite-code.ts`: `INVITE_CODE_ALPHABET`, `INVITE_CODE_LENGTH`
- `src/lib/campaign-roster.ts`: `isUserCampaignParticipant`
- `src/lib/character-library-section-visibility.ts`: `DEFAULT_LIBRARY_SECTION_VISIBILITY`
- `src/lib/character-view-enrichment-server.ts`: `getCharacterViewEnrichment`
- `src/lib/character/appearance-age.ts`: `parseAgeFromAppearance`, `stripAgeFromAppearance`
- `src/lib/character/character-name-limit.ts`: `CHARACTER_DEFAULT_NAME`
- `src/lib/character/character-relational-save-errors.ts`: `CHARACTER_SAVE_FAILED_MESSAGE`, `parseCharacterRelationalValidationError`
- `src/lib/character/dirty-patch.ts`: `isStaleCharacterWrite`
- `src/lib/character/innate-power-capacity.ts`: `resolveCharacterInnateEnergy`
- `src/lib/character/notes-tab-sections.ts`: `DEFAULT_NOTES_SECTION_ORDER`
- `src/lib/character/prune-trait-sheet-state.ts`: `PruneTraitSheetStateCharacterInput` (type)
- `src/lib/character/relational-lean-save.ts`: `RELATIONAL_SAVE_ENTRY_ALLOWLIST`
- `src/lib/character/save-lock.ts`: `resetCharacterSaveLockForTests`
- `src/lib/character/sheet-allocation-reset.ts`: `resetSheetSkillAllocationRows`
- `src/lib/character/sheet-skills-display.ts`: `isCodexBaseSkill`
- `src/lib/character/temp-modifiers.ts`: `sectionHasTempModifiers`
- `src/lib/chip/chip-size-tokens.ts`: `CHIP_ENTITY_INLINE_SIZE`
- `src/lib/chip/list-row-metadata.ts`: `rankedGlrFactChips`
- `src/lib/codex-archetype-path-save-validation.ts`: `archetypePathDataFromSaveInput`, `normalizeCodexCommaListColumn`
- `src/lib/codex-changelog-display.ts`: `diffCodexChangedFields`, `parseChangedFields`, `summarizeChangedFieldNames`
- `src/lib/codex/collection-to-payload-key.ts`: `CODEX_COLLECTION_TO_PAYLOAD_KEY`
- `src/lib/codex/fake-supabase.ts`: `FakeSupabase`
- `src/lib/codex/feat-restriction-notice.ts`: `getLimitedUsesNotice`
- `src/lib/codex/id-allocation.ts`: `lowestUnusedNumericId`
- `src/lib/codex/public-table-select.ts`: `CODEX_PROPERTIES_PUBLIC_SELECT`, `CODEX_SKILLS_PUBLIC_SELECT`
- `src/lib/codex/row-map.ts`: `toNumArray`
- `src/lib/codex/sources.ts`: `CODEX_SOURCE_WHITESPACE_CODE_POINTS`, `previewCodexSourceRename`
- `src/lib/core-rules-server.ts`: `resetCoreRulesCacheForTests`
- `src/lib/creator/creator-edit-query.ts`: `bindCreatorEditClear`, `creatorEditClearPlan`, `creatorPathWithoutEdit`
- `src/lib/creator/creator-save-error.ts`: `CREATOR_DELETED_ROW_MESSAGE`
- `src/lib/creator/creator-unsaved-guard.ts`: `CreatorBackHistory` (type)
- `src/lib/crop-image.ts`: `CROPPED_IMAGE_EXTENSION`
- `src/lib/detail-option/combat-builder.ts`: `powerToDetailOption`, `techniqueToDetailOption`
- `src/lib/detail-option/compact-facts.ts`: `capitalizeSpacesTerm`, `formatCriticalRangeIncreaseFact`, `formatCurrencyFact`, `formatEnergyFact`, `formatHandednessFact`, `formatRangeFact`, `formatSpacesFact`, `formatTrainingPointsFact`, `formatWeaponAbilityFact`, `propertyDescriptorChip`
- `src/lib/encounter/character-resource-sync.ts`: `CharacterResourcePatch` (type)
- `src/lib/encounter/unique-campaign-characters.ts`: `hasDuplicateCampaignCharacters`
- `src/lib/glr/validate-glr-chrome-spacing.ts`: `assertGlrChromeSpacingSources`, `expectedRowChromeFromRowActions`, `resolvedRowChromeFlags`, `scanGlrChromeSpacingSources`, `validateCodexBrowseShellSource`, `validateCreatorEmbeddedGlrSource`, `validateGlrGridColumnSource`, `validateGlrListClassName`, `validateGlrPublicBarrelSource`, `validateGlrRowLayoutSource`, `validateMyLibraryEntityTabSource`, `validateUsmListShellSource`, `validateUsmQuantityChromeSource`
- `src/lib/glr/validate-glr-facts.ts`: `assertRowFactCoverage`, `assertSurfaceColumnConfig`, `validateRowFactCoverage`, `validateSurfaceColumnConfig`
- `src/lib/guest-character-storage.ts`: `GUEST_CHARACTER_CAP`, `GuestCharacterCapError`
- `src/lib/guided-creator/ancestry-pick-tasks.ts`: `AncestryPickSpeciesInput` (type)
- `src/lib/guided-creator/chapter-rail-lock.ts`: `findGuidedChapterRailBlockerChapter`, `findGuidedChapterRailBlockerSubStep`
- `src/lib/guided-creator/curated-skills.ts`: `GUIDED_CURATED_MIN_SUGGESTIONS`, `formatGuidedAbilityKeysLabel`, `getGuidedAbilityRecommendationTiers`, `isTooBroadSkillAbility`, `skillMatchesArchetypeAbility`
- `src/lib/guided-creator/equipment-currency.ts`: `resolveItemUnitCost`
- `src/lib/guided-creator/equipment-eligibility.ts`: `isCommonRarity`
- `src/lib/guided-creator/equipment-phase-nav.ts`: `canCompleteEquipmentPhase`, `canNavigateToEquipmentPhase`
- `src/lib/guided-creator/guided-equipment-l2.ts`: `computeL2GearSpend`
- `src/lib/guided-creator/loadout-tp.ts`: `guidedTrainingPointsOverspendAmount`
- `src/lib/guided-creator/powers-phase-nav.ts`: `isLastPowersPhase`
- `src/lib/guided-creator/powers-techniques-energy-filter.ts`: `GUIDED_L1_FULL_ENERGY_POOL`
- `src/lib/guided-creator/powers-techniques-l2.ts`: `GUIDED_POWERS_L2_HEADER_COLUMNS`, `GUIDED_TECHNIQUES_L2_HEADER_COLUMNS`
- `src/lib/guided-creator/preview-ability-summary.ts`: `PREVIEW_ABILITY_ORDER`, `formatPreviewAbilityValue`, `resolvePreviewArchetypeAbilities`
- `src/lib/guided-creator/resolve-loadout-items.ts`: `groupResolvedItemsByCategory`, `loadoutDraftFromSelection`, `resolveLoadoutItems`
- `src/lib/guided-creator/substep-satisfaction.ts`: `isGuidedDraftSaveable`
- `src/lib/leveled-feats.ts`: `featLevelChipDescription`, `levelToRomanNumeral`, `parseFeatNameRomanSuffix`
- `src/lib/library-selectable-builders.ts`: `derivePowerTechniqueBudgetFacts`, `getItemColumns`
- `src/lib/library-sync.ts`: `syncItemProperties`, `syncPowerParts`
- `src/lib/library/catalog-listing.ts`: `catalogListingToSaveTarget`
- `src/lib/library/character-filter-persistence.ts`: `LIBRARY_CHARACTER_FILTER_KEY`, `readPersistedLibraryCharacterFilterId`
- `src/lib/library/empowered-technique-display.ts`: `buildEmpoweredPowerDocument`, `buildEmpoweredTechniqueDocument`, `deriveEmpoweredTechniquePartChips`
- `src/lib/library/fetch-library-tab-counts.ts`: `LibraryCountsClient` (type)
- `src/lib/library/power-technique-filters.ts`: `normalizeActionTypeFilterKey`
- `src/lib/library/published-training-points.ts`: `publishedPowerTrainingPoints`
- `src/lib/modal-unmount-click-guard.ts`: `armModalUnmountClickGuard`, `modalUnmountShouldArmGuard`
- `src/lib/observability/sentry-client-filter.ts`: `isAbortOrCancelledRequest`, `isChunkOrDynamicImportFailure`, `isHarmlessBrowserNetworkError`, `shouldDropClientSentryEvent`
- `src/lib/onboarding-preferences.ts`: `PLAY_TOGETHER_KEY`, `SHEET_TOUR_KEY`, `TUTORIALS_ENABLED_KEY`, `TUTORIAL_MILESTONES_KEY`, `getSheetTourStatus`
- `src/lib/owner-library-for-view.ts`: `emptyLibraryForView`
- `src/lib/portrait.ts`: `PORTRAIT_SAVE_NO_URL`, `dataUrlToBlob`
- `src/lib/power-variant-chips.ts`: `buildPowerVariantChips`, `rollPowerRandomizeDie`
- `src/lib/proficiencies.ts`: `hasSufficientProficiency`
- `src/lib/profile-display-name.ts`: `PROFILE_DISPLAY_NAME_MAX_LENGTH`
- `src/lib/rate-limit.ts`: `isDurableRateLimitEnabled`, `rateLimit`
- `src/lib/role-limits.ts`: `ROLE_POLICY_LIMIT_UNLIMITED_SENTINEL`
- `src/lib/role-policy.ts`: `getDefaultRolePolicy`
- `src/lib/role-quota-messages.ts`: `ROLE_QUOTA_EXCEEDED_CODE`
- `src/lib/roll-timestamp.ts`: `normalizeRollTimestamp`
- `src/lib/rolls/campaign-roll-limits.ts`: `CAMPAIGN_ROLL_DAMAGE_TITLE_SUFFIX`
- `src/lib/rolls/die.ts`: `d20CritAdjustment`, `defaultRollOutcomeKind`, `StoredRollKind` (type)
- `src/lib/rolls/personal-roll-log-storage.ts`: `StoredRollLogEntry` (type)
- `src/lib/rolls/roll-log-layout.ts`: `ROLL_LOG_HISTORY_LIST_MIN_CLASS`
- `src/lib/rules/rulebook-search.ts`: `stripMdx`
- `src/lib/security/content-security-policy.ts`: `TURNSTILE_CSP_ORIGIN`, `buildContentSecurityPolicy`
- `src/lib/security/next-app-flags.ts`: `ACCOUNT_PATH_ALIAS_REWRITE`, `NEXT_APP_POWERED_BY_HEADER`
- `src/lib/server/resource-access-unavailable.ts`: `RESOURCE_ACCESS_UNAVAILABLE_DIGEST`
- `src/lib/sheet-tour-highlight.ts`: `SHEET_TOUR_NARROW_BOTTOM_PLACEMENT_CLASS`, `SHEET_TOUR_NARROW_MAX_WIDTH_PX`, `SHEET_TOUR_NARROW_TOP_PLACEMENT_CLASS`, `isTallSheetTourTarget`, `onboardingHighlightScrollBlock`, `sheetTourCardAnchorForViewport`, `sheetTourStepScrollBlockForViewport`
- `src/lib/stepper-value-memory.ts`: `rememberStepperValue`, `StepperValueMemory` (type)
- `src/lib/supabase/middleware.ts`: `isHardProtectedPath`
- `src/lib/supabase/proxy-oauth-redirect.ts`: `shouldRedirectOAuthCodeFromRoot`
- `src/lib/supabase/public-client.ts`: `CI_BUILD_SUPABASE_URL`, `isPublicSupabaseConfigured`
- `src/lib/supabase/server.ts`: `ServiceRoleSupabaseClient` (type)
- `src/lib/supabase/session.ts`: `sessionUserFromClaims`
- `src/lib/supabase/verified-claims.ts`: `clearVerifiedClaimsCache`
- `src/lib/tooltips/floating-help.tsx`: `floatingHelpPanelPointerClass`
- `src/lib/utils/normalize-id.ts`: `resolveNormalizedRefLabel`, `rowMatchesNormalizedId`
- `src/types/library.ts`: `LIBRARY_ITEM_TYPES`

### Nothing imports this

- `src/app/(auth)/login/login-action-result.ts`: `LoginActionFailure` (type)
- `src/app/(main)/admin/codex/admin-archetype-editor-config.ts`: `ShowToast` (type)
- `src/app/(main)/admin/codex/admin-archetype-editor-guided.tsx`: `AdminArchetypeEditorGuidedProps` (type)
- `src/app/(main)/admin/codex/admin-archetype-editor-level1.tsx`: `AdminArchetypeEditorLevel1Props` (type)
- `src/app/(main)/admin/codex/admin-archetype-editor-meta.tsx`: `AdminArchetypeEditorMetaProps` (type)
- `src/app/(main)/admin/codex/admin-archetype-editor-progression.tsx`: `AdminArchetypeEditorProgressionProps` (type)
- `src/app/(main)/admin/codex/admin-feat-edit-modal-fields.tsx`: `AdminFeatEditModalFieldsProps` (type)
- `src/app/(main)/admin/codex/admin-part-edit-modal-options.tsx`: `AdminPartEditModalOptionsProps` (type)
- `src/app/(main)/admin/codex/admin-part-edit-modal.tsx`: `AdminPartEditModalProps` (type)
- `src/app/(main)/admin/codex/admin-property-edit-modal.tsx`: `AdminPropertyEditModalProps` (type)
- `src/app/(main)/admin/codex/admin-species-edit-modal.tsx`: `AdminSpeciesEditModalProps` (type)
- `src/app/(main)/admin/codex/admin-trait-edit-modal.tsx`: `AdminTraitCreateModalProps` (type), `AdminTraitEditModalProps` (type)
- `src/app/(main)/admin/codex/codex-spreadsheet-table-row.tsx`: `CodexSpreadsheetTableRowProps` (type)
- `src/app/(main)/admin/codex/use-admin-archetype-selection-options.ts`: `AdminArchetypeSelectionOptionsInput` (type)
- `src/app/(main)/admin/codex/use-admin-codex-delete.tsx`: `AdminCodexDelete` (type)
- `src/app/(main)/admin/codex/use-admin-codex-entity.tsx`: `AdminCodexNamedEntity` (type)
- `src/app/(main)/admin/codex/use-codex-spreadsheet.ts`: `PendingRowChange` (type)
- `src/app/(main)/admin/core-rules/core-rules-conditions.ts`: `ConditionsEditorShape` (type)
- `src/app/(main)/admin/core-rules/core-rules-number.ts`: `CoreRulesNumberResult` (type)
- `src/app/(main)/admin/core-rules/core-rules-tabs.ts`: `TabDef` (type)
- `src/app/(main)/admin/core-rules/core-rules-unsaved-leave.ts`: `CoreRulesUnsavedAction` (type)
- `src/app/(main)/admin/images/admin-image-delete-modal.tsx`: `AdminImageDeleteModalProps` (type)
- `src/app/(main)/admin/images/admin-image-edit-modal.tsx`: `AdminImageEditModalProps` (type)
- `src/app/(main)/admin/sources/actions.ts`: `AdminCodexSourceMembershipResult` (type)
- `src/app/(main)/admin/users/admin-users-directory-state.ts`: `AdminUsersDirectoryAction` (type), `AdminUsersListOwner` (type)
- `src/app/(main)/admin/users/use-admin-users-load-more.ts`: `AdminUsersLoadMorePage` (type), `AdminUsersLoadMoreRow` (type)
- `src/app/(main)/crafting/[id]/_components/crafting-tool-derived.ts`: `CraftingSessionTallies` (type)
- `src/app/(main)/creature-creator/AddCreatureFeatModal.tsx`: `AddCreatureFeatModalProps` (type)
- `src/app/(main)/creature-creator/creature-creator-editor.tsx`: `CreatureCreatorStatsSlice` (type)
- `src/app/(main)/creature-creator/creature-creator-feat-armament-display.ts`: `CreatureFeatRow` (type), `CreatureFeatSourceLookup` (type)
- `src/app/(main)/creature-creator/creature-creator-library-selectables.ts`: `CreatureCodexEquipmentRow` (type), `CreatureEquipmentLibraryItem` (type)
- `src/app/(main)/creature-creator/creature-creator-remove-section-confirm-placeholder.ts`: `CreatureCreatorOptionalSectionDisplayName` (type)
- `src/app/(main)/creature-creator/creature-damage-modifiers.ts`: `DamageModifierLists` (type)
- `src/app/(main)/creature-creator/creature-over-budget-notification.ts`: `CreatureOverBudgetNotification` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-bootstrap.ts`: `EmpoweredLibraryRecord` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-cost-derivation.ts`: `EmpoweredSectionCostSlice` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx`: `EmpoweredTechniqueCreatorEditorProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-action-profile.tsx`: `EmpoweredTechniqueEditorActionProfileProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-config.ts`: `EmpoweredSectionCosts` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-meta.tsx`: `EmpoweredTechniqueEditorMetaProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-config.tsx`: `EmpoweredTechniqueEditorPowerConfigProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-damage.tsx`: `EmpoweredTechniqueEditorPowerDamageProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-parts.tsx`: `EmpoweredTechniqueEditorPowerPartsProps` (type)
- `src/app/(main)/empowered-technique-creator/empowered-technique-editor-technique-parts.tsx`: `EmpoweredTechniqueEditorTechniquePartsProps` (type)
- `src/app/(main)/encounters/[id]/_components/EncounterCampaignRosterSection.tsx`: `EncounterCampaignRosterSectionProps` (type)
- `src/app/(main)/encounters/[id]/_components/EncounterPageHeader.tsx`: `EncounterPageHeaderProps` (type), `EncounterTypeLabel` (type)
- `src/app/(main)/encounters/[id]/_components/combat/combat-add-sidebar.tsx`: `CombatAddSidebarProps` (type)
- `src/app/(main)/encounters/[id]/_components/combat/combat-combatant-list.tsx`: `CombatCombatantListProps` (type)
- `src/app/(main)/encounters/[id]/_components/combat/combat-round-controls.tsx`: `CombatRoundControlsProps` (type)
- `src/app/(main)/encounters/[id]/_components/encounter-play-page-shell.tsx`: `EncounterPlayPageGatePhase` (type), `EncounterPlayPageResult` (type), `EncounterPlayPageShared` (type)
- `src/app/(main)/encounters/[id]/_components/skill/skill-participant-list.tsx`: `SkillParticipantListProps` (type)
- `src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx`: `SkillSidebarProps` (type)
- `src/app/(main)/encounters/[id]/_components/skill/skill-trackers-section.tsx`: `SkillTrackersSectionProps` (type)
- `src/app/(main)/item-creator/item-creator-bootstrap.ts`: `ItemAbilityRequirement` (type)
- `src/app/(main)/item-creator/item-creator-cost-derivation.ts`: `ItemSectionCostSlice` (type)
- `src/app/(main)/item-creator/item-creator-editor-config.ts`: `ItemSectionCosts` (type)
- `src/app/(main)/item-creator/item-creator-editor.tsx`: `ItemCreatorEditorProps` (type)
- `src/app/(main)/item-creator/item-creator-helpers.tsx`: `PropertyCostKind` (type)
- `src/app/(main)/library/components/UserLibraryEntityTabShell.tsx`: `UserLibraryEntityTabShellProps` (type)
- `src/app/(main)/library/hooks/use-library-duplicate-confirm.ts`: `UseLibraryDuplicateConfirmOptions` (type)
- `src/app/(main)/library/hooks/use-library-entity-sync.ts`: `LibrarySyncSanitizeResult` (type), `UseLibraryEntitySyncOptions` (type)
- `src/app/(main)/power-creator/power-creator-cost-derivation.ts`: `PowerSectionCostSlice` (type)
- `src/app/(main)/power-creator/power-creator-editor-config.ts`: `PowerSectionCosts` (type)
- `src/app/(main)/power-creator/power-creator-editor.tsx`: `PowerCreatorEditorProps` (type)
- `src/app/(main)/power-creator/power-creator-help.tsx`: `PowerCreatorHelpTopic` (type)
- `src/app/(main)/species-creator/species-creator-bootstrap.ts`: `SpeciesCreatorCache` (type), `SpeciesCreatorEditPlan` (type)
- `src/app/(main)/technique-creator/technique-creator-bootstrap.ts`: `TechniqueSavedPart` (type)
- `src/components/character-sheet/character-sheet-settings-modal.tsx`: `CharacterSheetSettingsModalProps` (type), `SpeedDisplayUnit` (type)
- `src/components/character-sheet/currency-field-commit.ts`: `CurrencyFieldCommit` (type)
- `src/components/character-sheet/edit-species-ancestry-step.tsx`: `EditSpeciesAncestryStepProps` (type)
- `src/components/character-sheet/edit-species-modal.tsx`: `EditSpeciesResult` (type)
- `src/components/character-sheet/edit-species-species-step.tsx`: `EditSpeciesSpeciesStepProps` (type)
- `src/components/character-sheet/library-feat-rows.tsx`: `FeatRowInput` (type), `TraitRowInput` (type)
- `src/components/character-sheet/library-inventory-panel.tsx`: `LibraryInventoryPanelProps` (type)
- `src/components/character-sheet/library-list-helpers.ts`: `ArmorItemCombatStats` (type), `EquippedArmorQuickRef` (type)
- `src/components/character-sheet/library-powers-panel.tsx`: `LibraryPowersPanelProps` (type)
- `src/components/character-sheet/library-tab-config.ts`: `LibraryTabDef` (type)
- `src/components/character-sheet/path-level-guidance.tsx`: `PathLevelGuidanceProps` (type), `PathRemoveGuidanceProps` (type)
- `src/components/character-sheet/sheet-resource-input.tsx`: `ResourceInputProps` (type)
- `src/components/character-sheet/skills-header-pin.ts`: `SkillsHeaderPinInput` (type)
- `src/components/character-sheet/use-character-sheet-actions.ts`: `UseCharacterSheetActionsArgs` (type)
- `src/components/character-sheet/use-character-sheet-derived.ts`: `UseCharacterSheetDerivedArgs` (type)
- `src/components/character-sheet/use-edit-species-modal.ts`: `EditSpeciesStep` (type)
- `src/components/character-sheet/use-library-section-rows.ts`: `LibrarySectionRowsInput` (type)
- `src/components/character/portrait-thumb.tsx`: `PortraitThumbProps` (type)
- `src/components/creator/collapsible-section.tsx`: `CollapsibleSectionRemoveConfirmCopy` (type)
- `src/components/creator/creator-summary-panel.tsx`: `BreakdownList` (type), `CostStat` (type), `StatRow` (type), `SummaryItem` (type)
- `src/components/encounters/add-combatant-modal.tsx`: `AddCombatantModalProps` (type)
- `src/components/encounters/combatant-card-conditions.tsx`: `CombatantCardConditionChipsProps` (type), `CombatantCardConditionsPanelProps` (type)
- `src/components/encounters/combatant-card-header.tsx`: `CombatantCardHeaderProps` (type)
- `src/components/encounters/combatant-card-initiative.tsx`: `CombatantCardInitiativeProps` (type)
- `src/components/encounters/combatant-card-quick-actions.tsx`: `CombatantCardResourceQuickActionsProps` (type)
- `src/components/encounters/combatant-card-resources.tsx`: `CombatantCardResourcesProps` (type)
- `src/components/encounters/encounter-combatant-types.ts`: `Combatant` (type), `CombatantCondition` (type), `CombatantType` (type)
- `src/components/guided-creator/character-preview-panel.tsx`: `CharacterPreviewPanelProps` (type)
- `src/components/guided-creator/guided-abilities-customize-panel.tsx`: `GuidedAbilitiesCustomizePanelProps` (type)
- `src/components/guided-creator/guided-choice-card.tsx`: `GuidedChoiceCardProps` (type)
- `src/components/guided-creator/guided-creator-page-shell.tsx`: `GuidedCreatorPageShellProps` (type)
- `src/components/guided-creator/guided-detail-option-list.tsx`: `GuidedDetailOptionListProps` (type)
- `src/components/guided-creator/guided-entity-detail-modal.tsx`: `GuidedEntityDetailModalProps` (type)
- `src/components/guided-creator/guided-equipment-fact-chips.tsx`: `GuidedFactChipRowProps` (type)
- `src/components/guided-creator/guided-equipment-l1-phase.tsx`: `GuidedEquipmentL1PhaseProps` (type)
- `src/components/guided-creator/guided-equipment-l2-grid.ts`: `L2ColumnHeader` (type)
- `src/components/guided-creator/guided-equipment-l2-modal.tsx`: `GuidedEquipmentL2ModalProps` (type)
- `src/components/guided-creator/guided-equipment-phase-layout.tsx`: `GuidedEquipmentPhaseLayoutProps` (type)
- `src/components/guided-creator/guided-feats-filter-fields.tsx`: `GuidedFeatsFilterFieldsProps` (type)
- `src/components/guided-creator/guided-feats-l2-modal.tsx`: `GuidedFeatsL2ModalProps` (type)
- `src/components/guided-creator/guided-mixed-species-overview.tsx`: `GuidedMixedSpeciesOverviewProps` (type)
- `src/components/guided-creator/guided-path-custom-archetype.tsx`: `GuidedPathCustomArchetypeProps` (type)
- `src/components/guided-creator/guided-path-detail-modal.tsx`: `GuidedPathDetailModalProps` (type)
- `src/components/guided-creator/guided-path-detail-overview.tsx`: `GuidedPathDetailOverviewProps` (type)
- `src/components/guided-creator/guided-portrait-upload.tsx`: `GuidedPortraitUploadProps` (type)
- `src/components/guided-creator/guided-powers-techniques-l1-content.tsx`: `GuidedPowersTechniquesL1ContentProps` (type), `PowersTechniquesDisplayItem` (type)
- `src/components/guided-creator/guided-powers-techniques-l2-modal.tsx`: `GuidedPowersTechniquesL2ModalProps` (type)
- `src/components/guided-creator/guided-restriction-notice.tsx`: `GuidedFeatRestrictionNoticeProps` (type), `GuidedRestrictionNoticeProps` (type), `GuidedTraitRestrictionNoticeProps` (type)
- `src/components/guided-creator/guided-reveal-review-modal.tsx`: `GuidedRevealReviewModalProps` (type)
- `src/components/guided-creator/guided-section-title.tsx`: `GuidedSectionTitleLevel` (type), `GuidedSectionTitleProps` (type)
- `src/components/guided-creator/guided-skills-panel.tsx`: `GuidedSkillsPanelProps` (type)
- `src/components/guided-creator/guided-species-detail-modal.tsx`: `GuidedSpeciesDetailModalProps` (type)
- `src/components/guided-creator/guided-step-footer.tsx`: `GuidedStepFooterProps` (type)
- `src/components/guided-creator/guided-step-layout.tsx`: `GuidedStepLayoutProps` (type)
- `src/components/guided-creator/guided-trait-option-list.tsx`: `GuidedTraitOptionListProps` (type)
- `src/components/guided-creator/guided-unarmed-prowess-panel.tsx`: `GuidedUnarmedProwessPanelProps` (type)
- `src/components/guided-creator/species-reveal-panel.tsx`: `SpeciesRevealPanelProps` (type)
- `src/components/layout/footer.tsx`: `FooterProps` (type)
- `src/components/patterns/chrome/creator-portrait-upload.tsx`: `CreatorPortraitUploadLabels` (type), `CreatorPortraitUploadProps` (type), `CreatorPortraitVariant` (type)
- `src/components/patterns/chrome/edit-section-toggle.tsx`: `SheetModeToggleColors` (type)
- `src/components/patterns/chrome/image-upload-modal.tsx`: `CropShape` (type), `ImageUploadModalProps` (type)
- `src/components/patterns/chrome/loadout-budget-bar.tsx`: `LoadoutBudgetBarProps` (type)
- `src/components/patterns/chrome/point-status.tsx`: `PointStatusProps` (type)
- `src/components/patterns/chrome/roll-button.tsx`: `RollButtonProps` (type)
- `src/components/patterns/chrome/segmented-control.tsx`: `SegmentedControlProps` (type), `SegmentedOption` (type)
- `src/components/patterns/chrome/temp-modifier-toggle.tsx`: `TempModifierToggleProps` (type)
- `src/components/patterns/chrome/trait-section.tsx`: `TraitSectionProps` (type)
- `src/components/patterns/help/descriptor-chip-with-tip.tsx`: `DescriptorChipWithTipProps` (type)
- `src/components/patterns/help/expandable-image.tsx`: `ExpandableImageModalProps` (type)
- `src/components/patterns/list/ability-score-grid.tsx`: `AbilityScoreGridProps` (type)
- `src/components/patterns/list/creature-library-stat-block-rows.tsx`: `CreatureLibraryStatBlockRowProps` (type), `CreatureLibraryStatBlockRowsProps` (type)
- `src/components/patterns/list/grid-list-row-chrome.ts`: `ExternalChromeFootprintInput` (type), `MobileCollapsedGridColumnsOptions` (type)
- `src/components/patterns/list/grid-list-row-collapsed.tsx`: `GridListRowExternalChromeProps` (type)
- `src/components/patterns/list/official-entity-list.tsx`: `OfficialEntityListProps` (type), `OfficialEntityRow` (type)
- `src/components/patterns/select/ability-pick-button.tsx`: `AbilityPickButtonProps` (type)
- `src/components/patterns/select/add-skill-modal.tsx`: `AddSkillModalSkillBadge` (type)
- `src/components/patterns/select/choice-trait-option-select.tsx`: `ChoiceTraitOptionListPickerProps` (type)
- `src/components/patterns/select/mixed-species-skill-picker.tsx`: `MixedSpeciesSkillPickerProps` (type)
- `src/components/patterns/select/selection-toggle.tsx`: `IconPairToggleFloor` (type), `IconPairToggleProps` (type), `IconPairToggleSize` (type)
- `src/components/patterns/select/unified-selection-modal-footer.tsx`: `UnifiedSelectionModalFooterProps` (type)
- `src/components/patterns/select/unified-selection-modal-leave-prompt.tsx`: `UnifiedSelectionModalLeavePromptProps` (type)
- `src/components/patterns/select/unified-selection-modal-list.tsx`: `UnifiedSelectionModalListProps` (type)
- `src/components/patterns/select/unified-selection-modal-toolbar.tsx`: `UnifiedSelectionModalToolbarProps` (type)
- `src/components/patterns/select/value-stepper.tsx`: `StepperButtonProps` (type), `ValueStepperProps` (type)
- `src/components/rolls/roll-log.tsx`: `DieResult` (type), `RollEntry` (type), `RollType` (type)
- `src/components/ui/alert.tsx`: `AlertProps` (type)
- `src/components/ui/card.tsx`: `CardProps` (type)
- `src/components/ui/checkbox.tsx`: `CheckboxProps` (type)
- `src/components/ui/expandable-chip.tsx`: `ChipGroupProps` (type)
- `src/components/ui/icon-button.tsx`: `IconButtonProps` (type)
- `src/components/ui/input.tsx`: `InputProps` (type)
- `src/components/ui/select.tsx`: `SelectProps` (type)
- `src/components/ui/selection-card.tsx`: `SelectionCardProps` (type), `SelectionCardSurfaceProps` (type)
- `src/components/ui/tab-navigation.tsx`: `TabContentPanelProps` (type), `TabNavOverflowScrollerProps` (type)
- `src/components/ui/textarea.tsx`: `TextareaProps` (type)
- `src/hooks/add-library-item/load-raw-items.ts`: `RawItemsInput` (type)
- `src/hooks/use-characters.ts`: `UseCharacterOptions` (type), `UseCharactersOptions` (type)
- `src/hooks/use-codex-source-catalog.ts`: `CodexSourceCatalogState` (type)
- `src/hooks/use-codex.ts`: `CodexQueryOptions` (type)
- `src/hooks/use-creator-save.ts`: `CreatorSaveTarget` (type)
- `src/hooks/use-creator-unsaved-guard.ts`: `CreatorLeaveRequest` (type)
- `src/hooks/use-enhanced-items.ts`: `EnhancedItemsScope` (type)
- `src/hooks/use-game-rules.ts`: `GameRulesQueryOptions` (type)
- `src/hooks/use-library-section-collapse.ts`: `LibrarySectionSession` (type)
- `src/hooks/use-profile.ts`: `ProfileDisplay` (type), `UserProfileActionResult` (type)
- `src/lib/admin-users-search.ts`: `AdminUserProfileSearchRow` (type)
- `src/lib/admin.ts`: `AdminSessionResult` (type)
- `src/lib/ancestry/ancestry-selection.ts`: `AncestryTraitBuckets` (type)
- `src/lib/api-input-validation-scan.ts`: `InputValidationGap` (type)
- `src/lib/auth-errors.ts`: `AuthErrorContext` (type)
- `src/lib/auth/auth-page-client.ts`: `ResendConfirmationResult` (type)
- `src/lib/auth/oauth-delete-grant-core.ts`: `SignedOAuthDeleteIntentPayload` (type)
- `src/lib/auth/sensitive-account-auth.ts`: `SensitiveAccountReauthInput` (type)
- `src/lib/character-persistence-server.ts`: `CharacterPatchResult` (type)
- `src/lib/character-sheet/add-modal-existing-ids.ts`: `AddModalEntityType` (type)
- `src/lib/character-view-enrichment.ts`: `CharacterViewRefIds` (type)
- `src/lib/character/build-creator-skills.ts`: `BuildCreatorSkillSaveRowsOptions` (type), `CreatorSkillCodexEntry` (type), `CreatorSkillSaveRow` (type)
- `src/lib/character/character-relational-save-errors.ts`: `CharacterRelationalSaveLogIds` (type), `CharacterRelationalValidationPayload` (type)
- `src/lib/character/character-size.ts`: `SpeciesSizeSource` (type)
- `src/lib/character/collect-sheet-traits.ts`: `CollectSheetTraitsInput` (type), `SheetTraitCategory` (type), `SheetTraitRow` (type), `VanillaTraitFields` (type)
- `src/lib/character/notes-tab-sections.ts`: `NotesTabSectionDef` (type)
- `src/lib/character/realtime-merge.ts`: `SheetRealtimeMerge` (type)
- `src/lib/character/recovery-uses.ts`: `RecoveryUseSource` (type)
- `src/lib/character/sheet-edit-notification.ts`: `ComputeSheetPointPoolsArgs` (type), `SheetEditNotificationSeverity` (type), `SheetPointPools` (type)
- `src/lib/character/sheet-skills-display.ts`: `CodexSkillRef` (type)
- `src/lib/chip/chip-size-tokens.ts`: `ChipVariantSize` (type)
- `src/lib/chip/list-row-metadata.ts`: `GlrFactChipSource` (type)
- `src/lib/chip/part-chips-from-display.ts`: `DisplayPartChip` (type)
- `src/lib/codex-changelog.ts`: `CodexChangeOperation` (type)
- `src/lib/codex/admin-source-list.ts`: `AdminSourceRowDetail` (type)
- `src/lib/codex/fake-supabase.ts`: `FakeRpcCall` (type), `FakeSupabaseOptions` (type)
- `src/lib/codex/feat-list.ts`: `FEAT_SELECTABLE_HEADER_COLUMNS`, `FeatFilterOptions` (type), `FeatSelectableColumnOptions` (type), `FilterFeatsOptions` (type)
- `src/lib/codex/feat-restriction-notice.ts`: `FeatRestrictionNoticeOpts` (type), `LimitedUseEntity` (type)
- `src/lib/codex/references.ts`: `ReferenceProbe` (type)
- `src/lib/codex/skill-list.ts`: `SkillFilterOptions` (type)
- `src/lib/constants/copy/legal-copy-types.ts`: `LegalSection` (type)
- `src/lib/creator/creator-edit-query.ts`: `CreatorEditClear` (type)
- `src/lib/creator/creator-unsaved-guard.ts`: `CreatorBackLocation` (type)
- `src/lib/creator/private-library-name-save.ts`: `PrivateLibraryNameSave` (type)
- `src/lib/encounter/unique-campaign-characters.ts`: `DuplicateCampaignCharacterReport` (type)
- `src/lib/glr/glr-density.ts`: `GlrModeSpec` (type)
- `src/lib/glr/glr-fact-catalog.ts`: `GlrEntityFactMeta` (type), `GlrFactDef` (type)
- `src/lib/glr/glr-list-chrome.ts`: `GlrChromeOptions` (type)
- `src/lib/glr/glr-surface-bindings.ts`: `GLR_SURFACE_BINDINGS`
- `src/lib/glr/validate-glr-chrome-spacing.ts`: `GlrChromeSpacingScanResult` (type), `RowChromeFlags` (type)
- `src/lib/guided-creator/ancestry-pick-gate.ts`: `AncestryPickGateInput` (type)
- `src/lib/guided-creator/ancestry-pick-tasks.ts`: `AncestryPickPhase` (type), `BuildAncestryPickTasksInput` (type), `BuildMixedAncestryPickTasksInput` (type)
- `src/lib/guided-creator/build-character.ts`: `BuildGuidedCharacterContext` (type)
- `src/lib/guided-creator/chapter-rail-lock.ts`: `GuidedChapterRailRef` (type)
- `src/lib/guided-creator/curated-skills.ts`: `GuidedCuratedSkillsOptions` (type)
- `src/lib/guided-creator/equipment-currency.ts`: `CatalogRowCostFields` (type), `CurrencyLineItem` (type), `RefCostLookupItem` (type)
- `src/lib/guided-creator/equipment-eligibility.ts`: `WeaponHandValidation` (type)
- `src/lib/guided-creator/equipment-phase-candidates.ts`: `PhaseL1RankContext` (type)
- `src/lib/guided-creator/equipment-phase-nav.ts`: `EquipmentPhaseCompletionContext` (type)
- `src/lib/guided-creator/equipment-phase-stats.ts`: `BuildPhaseCardStatsInput` (type), `EquipmentPhaseCardStats` (type)
- `src/lib/guided-creator/guided-equipment-l2.ts`: `ApplyL2Result` (type), `GuidedEquipmentL2ItemData` (type)
- `src/lib/guided-creator/guided-skill-recommendations.ts`: `BuildGuidedSkillSuggestionsOptions` (type), `BuildGuidedSkillSuggestionsResult` (type), `GuidedSkillSuggestion` (type), `GuidedSkillSuggestionBadge` (type), `GuidedSkillSuggestionKind` (type)
- `src/lib/guided-creator/loadout-pool.ts`: `GuidedLoadoutDraftSelection` (type)
- `src/lib/guided-creator/path-ability-labels.ts`: `PathAbilityChipLabel` (type)
- `src/lib/guided-creator/power-technique-display.ts`: `PowerTechniqueCardFacts` (type)
- `src/lib/guided-creator/powers-phase-nav.ts`: `PowersPhaseVisibility` (type)
- `src/lib/guided-creator/powers-techniques-l1-candidates.ts`: `ResolvePowersTechniquesCanonicalId` (type)
- `src/lib/guided-creator/powers-techniques-step-helpers.ts`: `InnateSelectionWarnReason` (type)
- `src/lib/guided-creator/preview-ability-summary.ts`: `PreviewAbilityChip` (type), `PreviewAbilityHighlight` (type), `PreviewArchetypeAbilityContext` (type)
- `src/lib/guided-creator/resolve-loadout-items.ts`: `EquipmentLookupEntry` (type), `ResolvedLoadoutItem` (type)
- `src/lib/guided-creator/reveal-blockers.ts`: `GuidedChapterRef` (type)
- `src/lib/guided-creator/skill-reconcile.ts`: `GuidedSkillPointBudget` (type), `PrunedSkillAllocations` (type), `SkillIdIndex` (type)
- `src/lib/leveled-feats.ts`: `BuildFeatLevelChipsOptions` (type), `ComputeNextLeveledFeatFieldsInput` (type), `FeatFamily` (type), `FeatLevelChipSelect` (type), `LeveledFeatSourceType` (type), `MergeFeatRow` (type), `MergeFeatsInFamilyOnAddArgs` (type)
- `src/lib/library-mutation-validation.ts`: `LibraryWriteValidationMode` (type)
- `src/lib/library-selectable-builders.ts`: `PowerColumnDisplay` (type), `PowerTechniqueBudgetDisplay` (type), `PowerTechniqueBudgetFacts` (type), `TechniqueColumnDisplay` (type)
- `src/lib/library-sync.ts`: `SyncIssue` (type), `SyncIssueCode` (type), `SyncResult` (type)
- `src/lib/library/armament-filters.ts`: `ArmamentFilterProfile` (type), `ArmamentFilterableRow` (type)
- `src/lib/library/armament-library-labels.ts`: `ArmamentKindChromeLabels` (type)
- `src/lib/library/catalog-listing.ts`: `ResolveCreatorSaveTargetOptions` (type)
- `src/lib/library/fetch-library-tab-counts.ts`: `LibraryCountQuery` (type), `LibraryCountTables` (type)
- `src/lib/library/official-catalog-row-filter.ts`: `OfficialArmamentFilterableRow` (type), `OfficialArmamentRowFilters` (type), `OfficialPowerTechniqueFilterableRow` (type)
- `src/lib/library/power-technique-categories.ts`: `PartCategoryDbRow` (type), `PartCategorySource` (type)
- `src/lib/library/published-training-points.ts`: `PublishedTrainingPoints` (type)
- `src/lib/onboarding-preferences.ts`: `SheetTourStatus` (type), `TutorialMilestones` (type)
- `src/lib/rate-limit.ts`: `RateLimitResult` (type)
- `src/lib/realms-images.ts`: `REALMS_IMAGE_CATEGORIES`, `CreateRealmsImageInput` (type), `RealmsImageUsageReport` (type), `RealmsImagesListPage` (type)
- `src/lib/role-policy.ts`: `RolePolicy` (type)
- `src/lib/role-quota-messages.ts`: `RoleQuotaExceededPayload` (type), `RoleQuotaResource` (type)
- `src/lib/rolls/modifier-label.ts`: `RollModifierKind` (type)
- `src/lib/rolls/parse-damage-string.ts`: `DamageRollGroup` (type)
- `src/lib/rolls/roll-parsed-damage.ts`: `DamageRollDieResult` (type)
- `src/lib/rules/rulebook-callout.ts`: `RulebookCalloutKind` (type)
- `src/lib/rules/rulebook-search.ts`: `RulebookSearchHit` (type)
- `src/lib/rules/rulebook.ts`: `RulebookHeading` (type)
- `src/lib/sheet-tour-highlight.ts`: `ONBOARDING_FLOATING_CARD_NARROW_TOP_PIN_CLASS`, `SHEET_TOUR_NARROW_CHROME_RESERVE_PX`, `sheetTourStepScrollBlock`
- `src/lib/skill-extra-descriptions.ts`: `SkillExtraChip` (type)
- `src/lib/supabase/database.ts`: `DynamicTableFilter` (type), `DynamicTableQuery` (type)
- `src/lib/supabase/session.ts`: `SessionUser` (type)
- `src/lib/supabase/supabase-auth-cookies.ts`: `PendingSupabaseCookieWrite` (type), `SupabaseCookieStore` (type)
- `src/lib/supabase/verified-claims.ts`: `VerifiedClaimsError` (type), `VerifiedClaimsResult` (type)
- `src/lib/tabletop/server.ts`: `VttSceneRow` (type)
- `src/lib/tooltips/floating-help.tsx`: `FloatingHelpPanelProps` (type)
- `src/lib/username-rules.ts`: `UsernameValidationResult` (type)
- `src/services/campaign-roll-service.ts`: `AddCampaignRollParams` (type)
- `src/services/persist-finished-character.ts`: `PersistFinishedCharacterResult` (type)
- `src/services/resource-client.ts`: `ResourceClient` (type)
- `src/stores/guided-creator-store.ts`: `GuidedChapterId` (type), `GuidedChapterMeta` (type), `GuidedPathLayer` (type)
- `src/types/archetype.ts`: `ArchetypePathLevel` (type)
- `src/types/campaign-roll.ts`: `CampaignRollTimestamp` (type), `CampaignRollType` (type)
- `src/types/codex.ts`: `CodexRowVersion` (type)
- `src/types/core-rules.ts`: `ArchetypeProgressionEntry` (type), `MultipleUseEnergyRow` (type), `OptionalReduceDifficultyByCost` (type), `OptionalReduceDifficultyByTime` (type), `OptionalReduceTimeByCost` (type), `OptionalReduceTimeByDifficulty` (type), `RarityTier` (type), `SizeCategoryDef` (type)
- `src/types/equipment.ts`: `DamageEntry` (type)

## Left for a later pass

This index is not finished. These were not opened file by line:

- The bodies named under "Not read line by line" above and in the earlier sections. That includes creator, encounter, campaign, admin, codex, library, sheet, auth, and styleguide files, and the formula helpers still listed under health / energy / cost math.
- The barrel-gap files under `src/hooks`, `src/services`, and `src/stores` were not re-read line by line. Their unused exports are named.

No `src/app` folder still has a non-test source file that is missing from this index. This file is still a map of files and copies. It is not a re-check of how every screen behaves.
