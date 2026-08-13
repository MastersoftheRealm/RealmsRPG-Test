# Codex & Library Layer — Independent Engineering Audit

**Date:** 2026-08-13 · **Scope:** `src/lib/codex/**`, `src/lib/library/**`, `src/lib/library-*.ts`, `src/app/(main)/{library,codex}/**`, `src/types/{codex,library}.ts`, `src/components/shared/official-*-list.tsx` (as consumers), `src/app/api/{codex,official,user/library}` (contract only).
**Method:** every in-scope file read in full; every claim verified in code, not docs. Reference counts produced with ripgrep across `src/**`. Read-only — no files changed except this report.

**Layer size:** ~9,300 LOC across 68 non-test files.
**Headline:** two P0 data-integrity defects (name-as-primary-key on save; swallowed read errors rendered as "empty library"), and ~2,700 LOC (~29% of the layer) removable by collapsing 6 copy-paste clusters into entity-config-driven implementations. Dead code is *not* the problem here — only ~70 LOC is genuinely unreachable. Duplication and untyped DB boundaries are.

---

## 1. Findings by severity

### P0 — user content loss / duplication

---

#### P0-1 · Creator saves resolve the target row by **display name**, silently overwriting a different item

`src/hooks/use-creator-save.ts:123-124`
`src/services/library-service.ts:40-51`
`src/app/api/user/library/[type]/[id]/route.ts:126`

```123:124:src/hooks/use-creator-save.ts
          const existing = await findLibraryItemByName(type, name.trim());
          await saveToLibrary(type, payload, existing ? { existingId: existing.id } : undefined);
```

`useCreatorSave` never receives the id of the row being edited. All six creators (`use-power-creator-workspace.ts:218`, `use-technique-creator-workspace.ts:270`, `use-empowered-technique-creator-workspace.ts:278`, `use-item-creator-workspace.ts:229`, `creature-creator-workspace-persistence.ts:36`, `use-species-creator-workspace.ts:143`) pass only `{ type, getPayload }`. The save target is therefore whatever row happens to share the entered name.

Three concrete failures:

1. **Overwrite.** Create a *new* power named `Fireball` while a saved `Fireball` exists → `findLibraryItemByName` returns the old row's id → `PATCH` shallow-merges the new payload over it (`route.ts:126` `merged = { ...currentItem, ...data }`). The original is destroyed, with a green "Saved successfully!" toast.
2. **Orphan + duplicate.** Open `/power-creator?edit=<id>`, rename to something unused, save → no name match → `POST` creates a second row. The original stays under the old name. The user now has two.
3. **Arbitrary target.** `findLibraryItemByName` takes `matches[0]` (`library-service.ts:49`) with no ordering, so when duplicates already exist the overwrite hits a non-deterministic one.

Shallow merge compounds (1): fields the new payload omits are inherited from the destroyed item, producing a chimera row.

**Fix.** Thread the `edit=<id>` search param through each creator workspace into `useCreatorSave` as `existingId`, and PATCH by that id. Keep `findLibraryItemByName` only to drive a "You already have a power called *Fireball*. Overwrite it, or save as a copy?" prompt on save-as-new. `findLibraryItemByName` should also return all matches so the prompt can be honest.

---

#### P0-2 · Library reads swallow Supabase errors and render the "no content yet" empty state

`src/app/api/user/library/[type]/route.ts:97-100, 112, 68, 80`
`src/lib/owner-library-for-view.ts:37-40`

```97:103:src/app/api/user/library/[type]/route.ts
      const { data: rows } = await supabase
        .from(TABLE[type])
        .select('*')
        .eq('user_id', user.uid);
      const list = (rows ?? []) as Record<string, unknown>[];
```

`error` is discarded. On an RLS denial, a transport failure, or a missing column, `rows` is `null`, the route returns `200 []`, and `UserLibraryEntityTabShell:123` renders *"No powers yet — create your first power to see it here."* The user is told their content does not exist. The shell already has a correct error branch (`:113`) that is unreachable in this path.

Two amplifications:

- `route.ts:68` and `:80` (the `?name=` lookup) have the same shape. A failed lookup returns "no match", which routes P0-1 into its `POST` branch — so a transient error during save creates a duplicate.
- `src/lib/owner-library-for-view.ts:37-40` discards all four `error` fields, so a shared/campaign character renders with an empty inventory and no powers rather than an error.

**Fix.** Destructure `error` on every query in these three files; return `500` (the client's `apiFetch` already throws on non-2xx and the tabs already render `ErrorDisplay` with retry). Never coerce a query failure to `[]`.

---

### P1 — silent content drops, scale failures, type holes reaching the rules engine

---

#### P1-3 · Every codex/library read is an unbounded `select('*')`; PostgREST truncates at 1000 rows with no error

| Location | Query |
|---|---|
| `src/app/api/codex/route.ts:65-74` | 10 × `select('*')` (feats, skills, species, traits, parts, properties, equipment, archetypes, archetype_levels, creature_feats) |
| `src/app/api/official/[type]/route.ts:123, 147` | `select('*')` on `codex_species` / `official_*` |
| `src/app/api/user/library/[type]/route.ts:99, 112` | `select('*')` on `user_*` |
| `src/lib/owner-library-for-view.ts:31-34` | 4 × `select('*')` |
| `src/app/api/official/[type]/route.ts:68` | `select('id')` over all of `codex_species` |

Supabase's default `db-max-rows` is 1000. Past that the row set is **silently truncated** — no error, no `Content-Range` check anywhere in the codebase. `codex_parts` already issues ids at 415 (`src/lib/id-constants.ts:90` `NO_ATTACK: 415`). At 10× content, feats and parts cross the cap, and powers built from high-id parts start rendering with missing part chips and wrong Energy/TP totals — because `findByIdOrName` will not find the definition and `derivePowerDisplay` skips it. This is the failure mode most likely to be misdiagnosed as a calculator bug.

**Fix.** Page with `.range()` and assert against the returned `count`, or set an explicit `.limit(N)` and hard-fail when `rows.length === N`. Do this before content grows, not after.

---

#### P1-4 · `/api/codex` ships one monolithic payload with `cache: 'no-store'`

`src/lib/api-client.ts:96-98` · `src/hooks/use-codex.ts:13-19` · `src/app/api/codex/route.ts:431-444`

```96:98:src/lib/api-client.ts
export async function fetchCodex(): Promise<CodexPayload> {
  return apiFetch<CodexPayload>('/api/codex', { cache: 'no-store' });
}
```

All 12 collections — including every part's `description` plus three `op_N_desc` strings, every feat's `description`, every species' `description` — are transferred as one body. The eleven `useCodexX` hooks correctly share one query key (`['codex']`) and narrow with `select`, which saves *renders*, not *bytes*. `refetchOnMount: true` + `staleTime: 5 min` + `no-store` means the Codex Properties tab (which needs `itemProperties`) re-downloads archetypes, archetype levels, all parts, and core rules.

**Fix.** Split into per-collection routes (or `?keys=parts,properties`) with independent query keys, and drop `no-store` — the route's `private, max-age=0, must-revalidate` header (`route.ts:448`) is already designed for revalidation but `no-store` on the client defeats it.

---

#### P1-5 · "Sync with current patch" **deletes** saved parts whose codex row can't be matched by id *or name*

`src/lib/library-sync.ts:410-456` (`sanitizePowerForSync` / `sanitizeTechniqueForSync` / `sanitizeItemForSync`) · `:206-216` · `src/lib/id-constants.ts:290-318`

```206:216:src/lib/library-sync.ts
    if (!def) {
      issues.push({
        code: 'missing_part',
        ...
      });
      if (!options.dropMissingRefs) nextParts.push({ ...part });
      continue;
    }
```

The three `sanitize*ForSync` functions pass `{ dropMissingRefs: true }`, so any unresolved ref is removed from the persisted payload. `findByIdOrName` falls back to a name match (`id-constants.ts:312-315`), which means **renaming a codex part** — a routine admin action — makes every legacy name-only reference unresolvable. Clicking "Sync with current patch" then deletes those parts from the user's power/technique/item permanently. The confirmation copy is a single sentence with no list of what will be removed (`library-entity-tab.types.ts:58`), and there is no undo.

`handleSyncAll` (`use-library-entity-sync.ts:73-111`) loops these writes with **no partial-failure handling**: a throw on item 4 of 20 aborts the loop, leaves items 1-3 written, and reports "Failed to sync all powers" with no indication of which succeeded.

**Fix.** Do not delete on sync. Mark the ref `orphaned: true`, keep it in the payload, render it greyed with a tooltip, and require an explicit per-ref removal. Make `handleSyncAll` collect per-item results and report `n synced, m failed` instead of aborting.

---

#### P1-6 · Empowered techniques are drift-checked against the wrong parts table

`src/app/(main)/library/LibraryTechniquesTab.tsx:71, 94, 121`

```71:72:src/app/(main)/library/LibraryTechniquesTab.tsx
  const { data: partsDb = [] } = useTechniqueParts();
  const { data: powerPartsDb = [] } = usePowerParts({ enabled: mode === 'empowered' });
```

`getTechniqueSyncResult(row.raw, partsDb)` and `sanitizeTechniqueForSync(source, partsDb)` are called with the *technique* parts db for both modes, but empowered payloads store refs under `payload.power.parts`, `payload.power.mechanics`, `payload.technique.parts` and `payload.technique.autoMechanics` (`empowered-technique-display.ts:29-47`, `use-empowered-technique-creator-workspace.ts:230-247`) — never at `raw.parts`.

Result today: `hasRefs` is always `false`, drift is always `false`, and the "Sync with current patch" button on the Empowered tab is permanently disabled while still being rendered. Worse for the legacy rows that `empowered-technique-display.ts:44-45` exists to handle ("*Legacy rows may still store technique parts at the top level*"): those top-level refs include **power** part ids, which do not exist in `techniquePartsDb` (both come from one `codex_parts` table split by `type` at `api/codex/route.ts:253-254`), so they resolve as `missing_part` and P1-5 drops them.

**Fix.** Give empowered its own sync path that walks both nested part lists against both dbs, or gate the sync chrome off when `mode === 'empowered'` until that exists.

---

#### P1-7 · `/api/codex` launders the entire payload through a double assertion; no generated Supabase types exist

`src/app/api/codex/route.ts:444` · `src/lib/supabase/server.ts:19`

```431:444:src/app/api/codex/route.ts
  return {
    feats: codexFeats,
    ...
    coreRules,
  } as unknown as CodexPayload;
```

Every row is `Row = Record<string, unknown>` (`:49`), every field is built as `r.name ?? ''` (static type `unknown`), and `as unknown as CodexPayload` erases the mismatch wholesale. Nothing in the route is actually checked against the declared contract.

Concrete divergences the cast hides:

| `CodexPayload` declares | Route produces | Consumer |
|---|---|---|
| `CodexFeat.lvl_req: number` | `toNum(r.lvl_req)` → `number \| undefined` | `feat-list.ts:97` `if (f.lvl_req > 0)` |
| `CodexFeat.uses_per_rec: number` | `toNum(...)` → possibly `undefined` | `feat-list.ts:232-236` |
| `CodexSkill.id: string` | `r.id` (Postgres int or text) | `buildSkillIdToName:80` `String(s.id)` |
| `CodexCreatureFeat.points: number` | `toNum(r.feat_points)` | `CodexCreatureFeatsTab.tsx:76` |
| `CodexPart = CodexPowerPart & {type}` where `base_en: number` required | technique parts have no `base_en` | `power-calc` / `technique-calc` |

Existing call sites happen to defend with `?? 0` / `!= null`, so this is a latent hole rather than a live crash — but the declared type tells every future author these fields are guaranteed, and `CodexFeat` flows straight into `lib/game/feat-requirements.ts` and the guided creator. **This is the type hole that reaches the rules engine.**

There are **no generated Supabase types anywhere in the repo** (`rg "export type Database"` → 0 hits; no `src/types/supabase.ts`), and `createServerClient` (`src/lib/supabase/server.ts:19`) / `createBrowserClient` (`client.ts:13`) are called without the `Database` generic. Every `.from('codex_feats').select('*')` is therefore untyped at the source.

**Fix.** `supabase gen types typescript` → `src/types/supabase.ts`, parameterise both clients, then replace the cast with a Zod parse at the route boundary (Zod 4 is already a dependency and `lib/api-validation.ts` already uses it for writes). Make the optional fields optional in `CodexFeat`/`CodexSkill`/`CodexCreatureFeat` rather than asserting them away.

---

#### P1-8 · Codex species ids are reused after deletion

`src/app/api/official/[type]/route.ts:67-82`

```78:81:src/app/api/official/[type]/route.ts
  for (let i = 1; i <= max + 1; i++) {
    if (!used.has(i)) return String(i);
  }
```

`allocateLowestUnusedSpeciesCodexId` returns the lowest unused integer. Delete species `7`, create a new one, and it becomes species `7`. Every saved character, creature, and draft that persisted `species: "7"` now resolves to a different species — wrong content shown, no error, no migration. (Also inherits P1-3: the `select('id')` scan truncates at 1000.)

**Fix.** Monotonic allocation (`max + 1`, never backfill), or a real sequence/UUID.

---

#### P1-9 · "Add to My Library" from Realms Library has no idempotency

`src/services/library-service.ts:75-86` · `src/app/(main)/library/LibraryPublicContent.tsx:78-84` · `src/components/shared/official-entity-list.tsx:245-252`

```85:85:src/services/library-service.ts
  return saveToLibrary(type, { ...data, createdAt: new Date().toISOString() });
```

`addOfficialItemToLibrary` strips `id`/`docId`/`_source` and always POSTs a new row. Pressing "Add" twice on the same Realms item yields two byte-identical rows, and nothing in the list indicates the item is already owned — `OfficialEntityList` has `addToCharacter.isOnCharacter` (`:236`) but no equivalent `isInLibrary`. No `source_official_id` is persisted, so there is no way to detect the duplicate after the fact.

**Fix.** Persist `source_official_id` on copy, dedupe server-side on `(user_id, source_official_id)`, and swap the Add button for a "In your library" state when present.

---

### P2 — duplication, correctness nits, perf

| # | Location | Issue | Fix |
|---|---|---|---|
| P2-10 | see §2 | Six copy-paste clusters, ~2,700 LOC removable | entity-config registries |
| P2-11 | `components/shared/list-search-toolbar.tsx`, `components/ui/search-input.tsx` | **No debounce or `useDeferredValue` anywhere** in the search chain. Every keystroke re-filters the full array in all 9 codex tabs and 5 library tabs. `CodexFeatsTab.tsx:105-114` additionally runs `checkFeatRequirements` per feat per keystroke when a character filter is active. | `useDeferredValue` in `ListSearchToolbar`, or a 150 ms debounce on `onSearchChange` |
| P2-12 | `lib/library/official-item-list.ts:274` + `lib/library/armament-filters.ts:68-71` | `filterOfficialItemRows`'s generic declares `properties?: WeaponPropertyRef[]`, but `OfficialItemRow` (`:110-131`) has no `properties` field. `resolveRowAbilityRequirement`'s fallback is unreachable from both library lists; it works only because `abilityReq` is precomputed. A future caller passing raw rows silently loses the ability gate. | drop `properties` from the generic, or make `abilityReq` required |
| P2-13 | `lib/library-columnar.ts:309` vs `:539` | `rowToItem` returns `{...payload, ...base}` (columns win); `rowToItemSpecies` returns `{...base, ...payload}` (payload wins). Opposite precedence for the same concept — a stale `payload.name` beats the `name` column for species only. | one precedence rule, tested both directions |
| P2-14 | `app/(main)/codex/CodexSpeciesTab.tsx:56-59` | Resolves species skills with `skillIdToName.get(...) \|\| String(skillId)` and does not special-case `'0'`, so the Codex renders a literal `0` where `resolveSkillIdsToNames` (`hooks/codex-types.ts:73-79`) renders "Any". | call the shared resolver |
| P2-15 | `lib/library/official-item-list.ts:134`; `lib/id-constants.ts:268-275` | `ARMOR_COLUMN_PROPERTY_NAMES = new Set(['critical range +1'])` keys off a display string when `PROPERTY_IDS.CRITICAL_RANGE_PLUS_1 = 22` exists two files away. `GENERAL_PROPERTY_NAMES` shadows `GENERAL_PROPERTY_IDS` with 17 hand-typed strings. Rename the property in the codex and the column/chip dedupe silently stops working. | key off ids; delete the name sets |
| P2-16 | `lib/library/official-item-list.ts:150-153`; `lib/library-selectable-builders.ts:608-612` | Chips are matched back to saved props by lowercased **name** to recover `op_1_lvl`. Two properties sharing a name get each other's option level. | carry `op_1_lvl` through `namedPropertyDescriptorChips` instead of re-joining |
| P2-17 | see §4 | Nine id/name resolvers with mutually inconsistent rules | one `resolveCodexRef` |
| P2-18 | `lib/codex/skill-list.ts:141-144, 170-171` | `s.name === filters.baseSkill` — exact, **case-sensitive** string equality as a join key. The only case-sensitive matcher in the layer. | match by `base_skill_id` |
| P2-19 | `lib/id-constants.ts:314` vs `:351` | `findByIdOrName` name fallback is trim + case-insensitive; `findByIdOrNameValue` is `item.name === idOrName` (exact). Two functions, one file, opposite semantics. | share one comparator |
| P2-20 | `app/(main)/codex/CodexArchetypesTab.tsx:232-234` | Pulls three official-library collections (powers, techniques, items) purely to render recommendation *labels* | a `/api/official/labels?type=` id→name endpoint |
| P2-21 | `app/(main)/library/page.tsx:110-120` | Mounts 5 user queries + 5 official queries to compute tab badge counts, even though one tab renders | a single `/api/user/library/counts` |
| P2-22 | `lib/library-sync.ts:417, 433, 449` | `changed` is always `true`: `withSyncMeta` (`:116`) stamps a fresh `syncedAt`, so `JSON.stringify(power) !== JSON.stringify(nextValue)` can never be false. Only `hasDrift` actually gates the write (`use-library-entity-sync.ts:51`), so the flag is decorative and misleading to callers. | compare excluding `syncMeta.syncedAt` |
| P2-23 | `lib/library-sync.ts:260-267` | `syncTechniqueParts` is a verbatim `return syncPowerParts(...)` alias | delete; call `syncPowerParts` |
| P2-24 | `lib/library-columnar.ts:585-587` | `toDbRowSpecies` is `return toDbRow(obj)` | delete; call `toDbRow` |
| P2-25 | `lib/library-sync.ts:328, 415` | `getPowerSyncResult` fingerprints the **raw** `power.parts`; `sanitizePowerForSync` fingerprints the **deduped/sanitized** `partsResult.value`. A saved row with duplicate part refs therefore never converges — it re-reports `definitions_changed` after every successful sync. | fingerprint the same normalized value on both sides |

### P3 — nits

| # | Location | Issue |
|---|---|---|
| P3-26 | `app/(main)/library/LibraryCreaturesTab.tsx:69-72, 99-102` | Eight `as never` / `as unknown as Record<string, unknown> as never` casts to call `getCreatureSyncResult`. `CreatureLike` (`library-sync.ts:458-477`) should be `Pick<LibraryCreature, 'id'\|'docId'\|'name'\|'powers'\|'techniques'\|'armaments'>`. |
| P3-27 | `lib/library-selectable-builders.ts:52` vs `types/library.ts:11` | Two different unions exported under the same name `LibraryItemType` (7 UI kinds vs 6 API kinds). Rename the builder one to `SelectableEntityKind`. |
| P3-28 | `types/codex.ts:251` | `EquipmentItem` alias has no consumer (only re-export lines in `hooks/codex-types.ts:29` and `hooks/index.ts`). |
| P3-29 | `lib/codex/feat-tags.ts:20-26` | `formatFeatTagsForDb` — zero references repo-wide. Dead. |
| P3-30 | `app/(main)/codex/page.tsx:134-159` | The `isPublic` and `!isPublic` blocks duplicate the same 9-tab if-ladder; 8 of the 9 `my` branches render the identical `<CodexMyCodexEmpty />`. |
| P3-31 | `app/(main)/codex/CodexPartsTab.tsx:154-161`, `CodexPropertiesTab.tsx:113-121` | Hand-rolled sort switches instead of `sortByColumn` from `use-sort.ts` (which every other tab uses). |
| P3-32 | `app/(main)/library/LibraryCreaturesTab.tsx:171-172` | `onDelete`/`onDuplicate` use `row.docId` while `key`/`rightSlot`/sync use `row.id = String(c.docId ?? c.id)`. Two id conventions in one component. |
| P3-33 | `lib/library/official-creature-list.ts:67-69` | `formatOfficialCreatureType` is a one-line pass-through to `formatListCellLabel`. |

---

## 2. Duplication clusters (highest-value output)

The app has 9 browsable entity types × 2 scopes (Realms / My) × 2 surfaces (page list / selection modal). Each combination was written by hand.

| # | Cluster | Files (LOC) | Total | What actually differs | Target | **Removable** |
|---|---|---|---|---|---|---|
| **C1** | **Entity list shells + per-entity wrappers (Realms *and* My Library)** | `official-entity-list.tsx` 255 · `official-power-list.tsx` 157 · `official-technique-list.tsx` 174 · `official-item-list.tsx` 153 · `official-creature-list.tsx` 137 · `official-enhanced-list.tsx` 89 · `UserLibraryEntityTabShell.tsx` 229 · `library-entity-tab.types.ts` 103 · `use-library-entity-sync.ts` 113 · `use-library-duplicate-confirm.ts` 40 · `LibraryPowersTab` 215 · `LibraryTechniquesTab` 257 · `LibraryItemsTab` 212 · `LibraryCreaturesTab` 167 · `LibraryEnhancedTab` 139 · `LibraryPublicContent` 234 | **2,674** | Only three things: (a) data hook (`useOfficialLibrary(t)` vs `useUserX()`), (b) action set (Realms = add-to-library; Mine = edit/delete/duplicate/sync), (c) empty/error copy. `buildRows`, `filterRows`, `gridColumns`, `headerColumns`, `getColumns`, `getDetailSections`, `getTotalCost`, `getThumbnail`, the filter panel, filter state, character context and `filterActiveCount` are **literally the same expressions written twice per entity** — compare `official-power-list.tsx:104-162` with `LibraryPowersTab.tsx:119-224`. | one `EntityBrowseList` (extend `OfficialEntityList` with `scope: 'official' \| 'user'` + an `ownerActions` capability) + one `LIBRARY_ENTITY_CONFIG` registry entry per entity + two ~40-line call sites | **~1,300** |
| **C2** | **Codex browse tabs** | `CodexFeatsTab` 249 · `CodexSkillsTab` 191 · `CodexSpeciesTab` 290 · `CodexArchetypesTab` 295 · `CodexEquipmentTab` 140 · `CodexPropertiesTab` 144 · `CodexPartsTab` 201 · `CodexTraitsTab` 81 · `CodexCreatureFeatsTab` 76 · `codex/page.tsx` 148 · `CodexMyCodexEmpty` 19 | **1,834** | Filter *fields*, the row renderer, and the column set. Everything else repeats 9×: the `codexMode === 'my'` early return, `<ErrorState onRetry={refetch}/>`, `useSort`, the name+description search predicate, the `useMemo` filter→sort pipeline, and the ~12 `CodexBrowseListShell` props. `page.tsx:134-159` then hard-codes an 18-branch if-ladder over the same 9 ids. | `CODEX_ENTITY_CONFIG` registry (`useData`, `headerColumns`, `gridColumns`, `renderFilters`, `filterFn`, `renderRow`) + one `CodexEntityTab`; `page.tsx` becomes `<CodexEntityTab id={activeTab} mode={codexMode} />` | **~850** |
| **C3** | **`filterOfficial*Rows` search predicates** | `official-power-list.ts:113-148` 36 · `official-technique-list.ts:116-153` 38 · `official-item-list.ts:266-296` 31 · `official-creature-list.ts:51-65` 15 · `official-enhanced-list.ts:50-66` 17 | **137** | Only the list of searched string fields, and which advanced-filter function runs. Structure is byte-identical: lowercase search → `.filter(includes)` → optional `applyXFilters` → `sortItems`. | `buildRowFilter({ searchFields, advanced })` | **~95** |
| **C4** | **`lib/library/official-*-list.ts` grid/header/id boilerplate** | `official-power-list.ts` 141 · `official-technique-list.ts` 145 · `official-item-list.ts` 279 · `official-creature-list.ts` 91 · `official-enhanced-list.ts` 59 | **715** | Row *mapping* is genuinely per-entity and should stay. But `OFFICIAL_*_GRID` + `OFFICIAL_*_HEADER_COLUMNS` + `official*RowColumns` (a hand-maintained parallel array that must stay index-aligned with the headers) + the repeated `id: String(x.id ?? x.docId ?? '')` are pure boilerplate. `armamentRowColumns` (`official-item-list.ts:241-264`) already shows the better pattern — derive columns from the header list via a `byKey` map. | one `defineEntityColumns({ key, label, align, value })[]` per entity; grid string generated | **~130** |
| **C5** | **`library-sync.ts` ref-sync triplets** | `syncPowerParts`/`syncTechniqueParts`/`syncItemProperties` `:184-321` 138 · `getPower/Technique/ItemSyncResult` `:323-408` 86 · `sanitizePower/Technique/ItemForSync` `:410-456` 47 · `getCreatureSyncResult`/`sanitizeCreatureForSync` `:479-600` 122 | **393** | The refs key (`parts` vs `properties`), the option count (3 vs 1), the fingerprint builder, and the noun in the message string. The nine functions are otherwise the same 26 lines. The two creature functions differ only by `{ dropMissingRefs: true }`. | `createRefSync({ refsKey, optionCount, buildFingerprint, noun })` returning `{ check, sanitize }` | **~260** |
| **C6** | **Modal `SelectableItem` builders vs list row builders** | `library-selectable-builders.ts` 650 (esp. `getItemColumns` `:366-458`, `getModalGridColumns` `:460-477`, `getListHeaderColumns` `:479-521`) | **~200 of 650** | A second, parallel column/grid/header definition for the *same* entities, derived from the *same* `derivePowerDisplay` / `deriveTechniqueDisplay` / `calculateItemCosts` calls — with different labels (`Training Pts` vs `TP`, `Attack` vs `ATTACK`) and a different column order. This is a live UX inconsistency: the Add-to-character modal and the Library list show the same power with different columns. | reuse the C4 column definitions with a `density: 'list' \| 'modal'` flag | **~150** |
| | | **Cluster footprint ≈ 6,270** | | | **≈ 2,785 (~29% of the 9,300-LOC layer)** |

**Sequencing.** C5 first (smallest, highest risk-reduction — it is the code that deletes user data, and it currently has zero tests). Then C3+C4 (pure lib, mechanical, fully unit-testable). Then C1 (largest payoff, but it touches every user-facing list — needs the `BUILD_VALIDATION` pass). C2 and C6 last.

**What *not* to consolidate.** `useUserLibrary` (`hooks/use-user-library.ts:87-102`) and its six type-bound wrappers, plus the `useDeleteLibraryItem` / `useDuplicateLibraryItem` factories (`:199-239`), are already correctly generic. `OfficialEntityList` is already the right abstraction — it just needs the `user` scope added rather than a second shell beside it.

---

## 3. Duplicate / competing type definitions

Every pair below is *live*: both definitions are exported and both have consumers.

| Concept | Definition A | Definition B | Why it bites |
|---|---|---|---|
| **`Skill`** | `types/skills.ts:17` — `id: number \| string`, `category?: SkillCategory`, `ability?: string` | `types/codex.ts:248` — `type Skill = CodexSkill`: `id: string`, `ability: string` (required), `base_skill_id?`, `success_desc?`, `ds_calc?` | Same exported name. `import { Skill } from '@/types'` gives A; `from '@/types/codex'` or `from '@/hooks'` gives B. `skill-list.ts` and `codex-skill-row.tsx` use B; `types/index.ts:35` re-exports A. Silent drift. |
| **`Feat`** | `types/feats.ts:16` — `category?: FeatCategory` (5-value union), `prerequisites?`, `benefits?`, `stackable?` | `types/codex.ts:247` — `= CodexFeat`: `category: string` (required), `ability_req: string[]`, `abil_req_val: number[]`, `tags: string[]` | `category` is a closed union in A and free `string` in B. `feat-list.ts:142` compares `f.category` against filter strings and only type-checks because it resolves to B. |
| **`ItemProperty`** | `types/equipment.ts:77` — `{ id, name, value? }` | `types/codex.ts:246` — `= CodexItemProperty`: `base_ip`, `base_tp`, `base_c`, `op_1_*` | `types/index.ts:57` exports A. `Item.properties?: string[] \| ItemProperty[]` therefore means A — so any calculator reading `base_tp` off an `Item.properties` entry is unsound. `hooks/codex-types.ts:24` exports B under the same name. |
| **Carried item** | `types/equipment.ts:55` `Item` (`damage?: string \| DamageEntry[]`) | `types/library.ts:105` `LibraryItem` (`damage?: SavedDamage[]`, `properties: SavedProperty[]`) | `types/codex.ts:154` `CodexEquipmentItem` (`damage?: string`, `properties: string[]`) — three shapes for one domain concept, three `damage` encodings. |
| **Species** | `types/codex.ts:118` `CodexSpecies` — 8 required arrays | `types/library.ts:132` `LibrarySpecies` — everything optional | `types/ancestry.ts:*` `Ancestry` is a third. `userSpeciesToSpecies` (`use-user-library.ts:123-146`) bridges B→A with `?? []` on seven fields — a bridge that only exists because the two were never unified. |
| **Part definition** | `types/codex.ts:14` `CodexPowerPart` (`base_en: number` required) | `types/codex.ts:38` `CodexTechniquePart` (`base_en?`) | `types/codex.ts:59` `CodexPart = CodexPowerPart & { type: … }`. `api/codex/route.ts:227-254` builds **one** `allParts` array and hands the same objects out as all three types. |
| **Saved part ref** | `types/library.ts:28` `SavedPart` (`id?: number`) | `lib/library-sync.ts:5` `PartLike` (`id?: string \| number`) | `lib/game/dedupe-saved-parts.ts:12` `SavedPartLike` (+ nested `part`) · `lib/library-columnar.ts:19` `PartLike` (4th) · `lib/library/part-display.ts:37` `PartPayload` (5th). Five shapes for one persisted ref; `SavedPart.id?: number` contradicts codex ids being `string`. |
| **Saved property ref** | `types/library.ts:99` `SavedProperty` | `lib/library-sync.ts:19` `PropertyLike` | `lib/library/part-display.ts:45` `PropertyPayload` (3rd). |
| **Creature** | `types/library.ts:157` `LibraryCreature` | `lib/library-sync.ts:458` `CreatureLike` | `components/shared/creature-stat-block-types` `CreatureData` (3rd). `LibraryCreaturesTab.tsx:69-72` bridges with eight `as never` casts. |
| **`LibraryItemType`** | `types/library.ts:11` — 6 API kinds (`powers \| techniques \| empowered-techniques \| items \| creatures \| species`) | `lib/library-selectable-builders.ts:52` — 7 UI kinds (`power \| technique \| weapon \| shield \| armor \| equipment \| item`) | **Identical exported name, disjoint unions.** Import the wrong one and the mistake type-checks anywhere the value is widened. |
| **Library kind enum** | `types/library.ts:19` `LIBRARY_ITEM_TYPES` (6) | `lib/library-columnar.ts:16` `COLUMNAR_LIBRARY_TYPES` (5, no species) | Both are the `[type]` route param domain; `api/user/library/[type]/route.ts:29` hand-writes a **third** `VALID_TYPES` list. |
| **Armament kind** | `lib/library/armament-library-labels.ts:5` `ArmamentLibraryKind` (definition) | re-exported at `official-item-list.ts:39` and `official-item-list.tsx:33` | One definition, three import paths — cosmetic, but it makes "where does this type live" a grep. |

**Optional-everything types forcing defensive code.** 193 lines in scope contain a `?? ''` / `?? []` / `?? 0` fallback, concentrated in `api/codex/route.ts` (38), `library-sync.ts` (51), `library-selectable-builders.ts` (13), `official-creature-list.ts` (9) and `official-item-list.ts` (8). `LibrarySpecies` and `LibraryCreature` declare almost every field optional, so every consumer re-establishes the same defaults. Root cause is P1-7: with no generated DB types, nobody can tell which columns are actually `NOT NULL`.

---

## 4. Normalization / ID hygiene

### Every resolver in the layer

| Helper | Location | Id rule | Name rule |
|---|---|---|---|
| `findByIdOrName` | `lib/id-constants.ts:290` | string-eq, then `parseInt` numeric-eq | trim + lowercase |
| `findByIdOrNameValue` | `lib/id-constants.ts:324` | `parseInt` numeric-eq only | **exact, case-sensitive** |
| `findInLibrary` | `lib/data-enrichment/find-in-library.ts:4` | `item.id === String(ref.id)` | lowercase, **no trim** |
| `findTraitByIdOrName` | `hooks/codex-types.ts:40` | string-eq | lowercase, no trim, **plus** two slugified variants (`\s+`→`_`, strip non-`[a-z0-9_-]`) |
| `resolvePartDef` / `partLookupKey` | `lib/library/power-technique-categories.ts:23, 40` | trim | trim + lowercase |
| `normalizeId` / `findByNormalizedId` | `lib/utils/normalize-id.ts:5, 26` | trim + lowercase | n/a (id only) |
| `partDedupeKey` | `lib/game/dedupe-saved-parts.ts:30` | trim + lowercase, **plus** strips a leading `s` before digits (`s377` ≡ `377`) | trim + lowercase |
| `partPayloadToPartData` | `lib/library/part-display.ts:69` | via `findByIdOrName` | fallback lowercase, no trim |
| `itemPropertiesToPartData` | `lib/library/part-display.ts:114` | `String(p.id) === String(propId)` | lowercase, no trim |
| `findOfficialLibraryItemByName` | `services/library-service.ts:61` | n/a | trim + lowercase |
| `findLibraryItemByName` | `services/library-service.ts:40` | n/a | server `ilike` + JS trim/lowercase |

**Nine mutually inconsistent rules.** Nothing anywhere applies Unicode normalization (`String.prototype.normalize('NFC')`) or strips diacritics, so a species named `Fëanor` saved from one keyboard layout will not match one typed with a combining diaeresis. Only `dedupeSavedParts` understands the `s377`/`377` id alias — so a saved part with id `"s377"` deduplicates correctly but `findByIdOrName` may still miss it if the codex row stores `377` as text (`parseInt("s377")` is `NaN`).

**Fix:** one `resolveCodexRef(db, ref)` in `lib/utils/`, with `normalizeKey = s => String(s ?? '').normalize('NFC').trim().toLowerCase()` and the `s`-prefix alias, and delete the other eight.

### Name used as a join key (each is a silent-drop risk)

| # | Location | Ref |
|---|---|---|
| 1 | `hooks/use-creator-save.ts:123` | **Name is the primary key for every creator save** → P0-1 |
| 2 | `hooks/use-creator-save.ts:154` + `services/library-service.ts:61-69` | Publishing to Realms Library replaces the official row whose *name* matches — two official items sharing a name overwrite each other |
| 3 | `lib/library-sync.ts:202, 287` (via `findByIdOrName`) | Renaming a codex part orphans every name-only saved ref → P1-5 deletes it |
| 4 | `lib/library/official-item-list.ts:134` | `ARMOR_COLUMN_PROPERTY_NAMES` hardcodes `'critical range +1'` instead of `PROPERTY_IDS.CRITICAL_RANGE_PLUS_1` |
| 5 | `lib/id-constants.ts:268-275` | `GENERAL_PROPERTY_NAMES` — 17 display strings shadowing `GENERAL_PROPERTY_IDS` |
| 6 | `lib/library/official-item-list.ts:150-153` | Chip→prop re-join by lowercased name to recover `op_1_lvl` |
| 7 | `lib/library-selectable-builders.ts:608-612` | Same re-join in the modal path |
| 8 | `lib/codex/skill-list.ts:141-144` | `s.name === filters.baseSkill` (case-sensitive) instead of `base_skill_id` |
| 9 | `lib/codex/skill-list.ts:170-171` | `sortSkillsForBaseFilter` compares names |
| 10 | `lib/library/part-display.ts:75, 86, 124, 140` | Four name fallbacks when the id lookup misses |
| 11 | `lib/utils/normalize-id.ts:68-83` + `CodexArchetypesTab.tsx:86-103` | Archetype path recommendations resolve via `byId` **then** `byName` — the DB columns (`codex_archetype_levels.feats`, `level1_powers`, …) are free-text arrays that may hold display names |
| 12 | `hooks/codex-types.ts:40-57` | Trait resolution has a **slug** fallback (`Long_Lasting_State` ↔ `long-lasting-state`), i.e. a third key space beyond id and name |

### Display names persisted as references

- `types/library.ts:28-35` `SavedPart` and `:99-103` `SavedProperty` persist both `id` **and** `name`. Every creator writes both (`use-power-creator-workspace.ts:164-166`, `use-item-creator-workspace.ts:166-169`). The stored `name` is a snapshot that goes stale on any codex rename and is then used as a fallback join key (#3 above).
- `codex_archetypes.level1_feats` / `level1_powers` / `level1_techniques` / `level1_armaments` / `level1_equipment` and `codex_archetype_levels.*` are `text[]`/CSV parsed by `toStrArray` (`api/codex/route.ts:391-403`); `resolveNormalizedRefLabel` explicitly accepts a name fallback, confirming names are in there.
- `types/library.ts:83` `LibraryTechnique.weapon?: { id?, name? }` — deprecated but still read.

---

## 5. `library-sync.ts` specifically

**What it syncs.** Nothing to a server. It is a pure client-side reconciler between a saved library row's part/property references and the current codex tables, in three phases: detect (`get*SyncResult`), rewrite (`sanitize*ForSync`), persist (`use-library-entity-sync.ts` → `saveToLibrary(..., { existingId })` → `PATCH`).

**When.** `get*SyncResult` runs on **every render** of the four My Library tabs, inside `useMemo` over the whole row set (`LibraryPowersTab.tsx:68-78`, `LibraryTechniquesTab.tsx:92-102`, `LibraryItemsTab.tsx:95-101` — the items tab calls it *twice*, once for `driftedIds` and again per row at `:172`). `sanitize*` runs only on an explicit user click (per-row sync icon or "Sync with current patch").

**Detected issues.** `missing_part`, `missing_property`, `missing_option_1/2/3`, `definitions_changed` (stored fingerprint ≠ recomputed), `never_synced` (refs present, no fingerprint yet).

**Idempotent?** No, on three counts:
1. `changed` is unconditionally `true` because `withSyncMeta:116` stamps `syncedAt: new Date().toISOString()` (P2-22). Only `hasDrift` prevents a write loop.
2. The detect and rewrite paths fingerprint **different** values — raw `power.parts` at `:328` vs deduped/sanitized `partsResult.value` at `:415`. A row with duplicate part refs never converges and re-reports `definitions_changed` forever (P2-25).
3. `never_synced` is issued for any row with refs and no `syncMeta` — i.e. every row created before this feature — so the badge count on a mature library is "all of them" until each is clicked.

**Can it duplicate or delete user content?** **Delete: yes.** `sanitize*ForSync` pass `{ dropMissingRefs: true }` and `:214`/`:299` drop unresolved refs from the persisted payload with no preview and no undo (P1-5). Duplicate: no — it always PATCHes an existing id.

**Partial failure?** Not handled. `handleSyncAll` (`use-library-entity-sync.ts:73-111`) awaits writes in a `for` loop inside one `try`; a throw at item *k* leaves items `0..k-1` persisted, skips the rest, and shows a single "Failed to sync all powers" with no per-item result. `handleSyncOne` is fine.

**Is it reachable and needed?** Reachable from all four My Library tabs. Needed in principle — the codex is admin-editable and saved payloads embed a snapshot — but the current implementation is the riskiest code in the layer and has **zero tests** (550 LOC). Three of its nine exports (`syncPowerParts`, `syncTechniqueParts`, `syncItemProperties`) have no external consumer, and `syncTechniqueParts` is a pure alias.

**Recommendation.** Keep the concept, rewrite the mechanics: (a) never delete — mark refs `orphaned`; (b) fingerprint the same normalized value on both sides; (c) exclude `syncedAt` from `changed`; (d) collect per-item results in `handleSyncAll`; (e) collapse the nine near-identical functions into one factory (C5); (f) add the tests in §8 *before* any of the above.

---

## 6. Search / filter correctness

| Aspect | Status |
|---|---|
| **Debounce** | **None anywhere.** `SearchInput` and `ListSearchToolbar` contain no `debounce` / `useDeferredValue` / `setTimeout`. All 14 list surfaces re-filter the full array per keystroke. Worst case `CodexFeatsTab.tsx:105-114`, which runs `checkFeatRequirements` per feat per keystroke under a character filter. |
| **Case** | Search is consistently lowercased. Filter *joins* are not — `skill-list.ts:141` and `:170` are case-sensitive; `findByIdOrNameValue:351` is case-sensitive. |
| **Whitespace** | `filterCodexEquipment:104` and `filterOfficialEnhancedRows:56` trim the query; the other eleven predicates do not, so a trailing space returns zero results. |
| **Diacritics** | Not handled anywhere. |
| **Empty state** | Correct and consistent: `UserLibraryEntityTabShell:177` and `OfficialEntityList:198-203` distinguish "no content at all" from "no match", and `OfficialEntityList` even re-checks `cardData.length` to pick the right message. `CodexBrowseListShell:116` collapses both into one `isEmpty` — the codex tabs cannot tell "codex is empty" from "your filters match nothing". |
| **Filter persistence** | Only the character-filter id persists (`character-filter-persistence.ts`, one shared `localStorage` key across Codex feats/skills and all library tabs, with a legacy-key migration at `:15-19`). Search text, categories, energy/TP caps and rarity reset on every tab switch — the tabs are unmounted by the `activeTab &&` conditionals in `codex/page.tsx:136-158` and `library/page.tsx:283-296`. |
| **AND/OR** | Documented and correct where it matters. `applyPowerTechniqueFilters:207-220` is AND across dimensions; `rowMatchesCategories:117` is OR within categories (matches the JSDoc at `:194`). `TagFilter` supports both via `tagMode` (`feat-list.ts:149-155`). One asymmetry: `rowMatchesCategories:116` returns `false` for a row with **no** categories when any category is selected, while `rowMatchesEnergy:161` also returns `false` for a null energy — both are defensible but undocumented, and mean a power whose parts are all `mechanic: true` (so `derivePartCategories:75` skips them) is invisible under any category filter. |
| **Sort stability** | `sortByColumn:79` uses `[...arr].sort()`, which is stable in every engine Next 16 targets. `compareSortValues:68` uses `localeCompare(…, { numeric: true })`. Two tabs bypass it with hand-rolled switches (`CodexPartsTab.tsx:154`, `CodexPropertiesTab.tsx:113`) that return `0` for unknown columns — clicking an unhandled header silently does nothing. |
| **Taxonomy fidelity** | Categories are derived from `codex_parts.category` at runtime (`derivePartCategories`) rather than hardcoded — correct, and it means the filter follows the game data. Two synthetic additions are hardcoded: `DAMAGE_CATEGORY = 'Damage'` (`power-technique-categories.ts:7`) and the `ARMOR_COLUMN_PROPERTY_NAMES` exclusion. Rarity ordering comes from `GAME_RULES` via `maxRarityForCharacterLevel` — correct. |
| **Character-scoped filters** | `applyArmamentFilters:87-93` applies the ability requirement and the armament-TP cap **unconditionally** whenever a character is selected, with no toggle — unlike `affordableCurrencyOnly` and `rarityAccessibleOnly`, which are opt-in. Selecting a character therefore silently hides armaments the player may legitimately want to browse, and `countActiveArmamentFilters:112` counts the character itself as one filter without explaining which gates it turned on. |

---

## 7. Dead code

Genuinely unreachable code is small. The waste in this layer is duplication, not dead weight.

### Unreachable (delete)

| Symbol | Location | LOC | Evidence |
|---|---|---|---|
| `formatFeatTagsForDb` | `lib/codex/feat-tags.ts:20-26` | 8 | Zero references repo-wide (only its own declaration). Superseded by the `normalize_feat_tags()` RPC noted in the file header. |
| `EquipmentItem` type alias | `types/codex.ts:251` (+ re-exports `hooks/codex-types.ts:29`, `hooks/index.ts`) | 3 | Only re-export lines; never consumed. |
| `syncTechniqueParts` | `lib/library-sync.ts:260-267` | 8 | Verbatim `return syncPowerParts(...)`. |
| `toDbRowSpecies` | `lib/library-columnar.ts:585-587` | 4 | `return toDbRow(obj)`. |
| `baseItemName` | `app/(main)/library/LibraryEnhancedTab.tsx:20-22` | 3 | `return base.name`. |
| `formatOfficialCreatureType` | `lib/library/official-creature-list.ts:67-69` | 3 | Pass-through to `formatListCellLabel`. |
| Redundant `my`-mode ladder | `app/(main)/codex/page.tsx:147-159` | ~13 | 8 of 9 branches render the identical `<CodexMyCodexEmpty />`. |
| Per-tab `codexMode === 'my'` guards | 7 codex tabs (e.g. `CodexFeatsTab.tsx:118-120`) | ~28 | Same three lines ×7; belongs in the shell. |
| **Total unreachable** | | **~70** | |

### Exported but no external production consumer (tighten to module-private; not removable LOC)

Twenty values. Test-only external use is marked `(T)`.

`equipmentCurrency (T)` · `getLimitedUsesNotice (T)` · `DEFAULT_STATE_DURATION_LABEL` · `LIBRARY_CHARACTER_FILTER_KEY (T)` · `readPersistedLibraryCharacterFilterId (T)` · `buildEmpoweredPowerDocument (T)` · `buildEmpoweredTechniqueDocument (T)` · `deriveEmpoweredTechniquePartChips (T)` · `formatEnhancedUsesLabel` · `getEmpoweredTechniqueTotals` · `partPayloadToPartData` · `DAMAGE_CATEGORY` · `normalizeActionTypeFilterKey (T)` · `getPowerTechniqueBudgetColumns` · `getItemColumns (T)` · `derivePowerTechniqueBudgetFacts (T)` · `syncPowerParts` · `syncTechniqueParts` · `syncItemProperties` · `computeChangedFields`

Plus 16 exported-but-internal *types*: `FeatFilterOptions`, `FilterFeatsOptions`, `FeatRestrictionNoticeOpts`, `LimitedUseEntity`, `SkillFilterOptions`, `ArmamentFilterProfile`, `ArmamentFilterableRow`, `ArmamentKindChromeLabels`, `PartCategorySource`, `PartCategoryDbRow`, `TechniqueColumnDisplay`, `PowerColumnDisplay`, `PowerTechniqueBudgetFacts`, `PowerTechniqueBudgetDisplay`, `SyncIssueCode`, `SyncIssue`. (Several are legitimately public because they appear in exported signatures — `SyncResult`, `SyncIssue`, `ArmamentFilterableRow`, `PartCategoryDbRow`, `FeatFilterOptions`, `SkillFilterOptions`, `PowerTechniqueBudgetDisplay` — but the rest are noise.)

### Superseded from the legacy-creator era

No fully orphaned builders remain — `library-selectable-builders.ts` and `library-columnar.ts` both have live consumers. But `library-selectable-builders.ts:366-521` (`getItemColumns` / `getModalGridColumns` / `getListHeaderColumns`, ~155 LOC) is a *parallel* column system to `lib/library/official-*-list.ts` (cluster C6) — the surviving half of the split between the legacy modal path and the current list path. That is the closest thing to legacy debt here, and it is causing a visible inconsistency (different column labels for the same entity in modal vs list).

**Note on method:** an earlier PowerShell pass reported ~35 dead exports. That was wrong — PowerShell's `-Include`/`Select-String -Path` treat `[type]` in the App Router directory names as a character class, so every `src/app/api/**/[type]/**` file was skipped. The numbers above come from a ripgrep re-run. Anyone repeating this scan should use `rg`.

---

## 8. Tests

### Present (22 files, 132 tests)

| Area | File | Tests |
|---|---|---|
| Columnar round-trip | `lib/library-columnar.test.ts` | 20 — attack-mode derivation, promoted-column vs payload precedence, image-ref parity, payload isolation. The strongest suite in the layer. |
| Selectable builders | `lib/library-selectable-builders.test.ts` | 10 |
| Armament filters | `lib/library/armament-filters.test.ts` | 8 |
| Power/technique filters | `lib/library/power-technique-filters.test.ts` | 8 |
| Skill list | `lib/codex/skill-list.test.ts` | 8 |
| Feat restriction notice | `lib/codex/feat-restriction-notice.test.ts` | 7 |
| Categories | `lib/library/power-technique-categories.test.ts` | 6 |
| Equipment list | `lib/codex/equipment-list.test.ts` | 5 |
| Official item list | `lib/library/official-item-list.test.ts` | 4 |
| Source scope | `lib/library/source-scope.test.ts` | 4 |
| Empowered display | `lib/library/empowered-technique-display.test.ts` | 3 |
| Character filter persistence | `lib/library/character-filter-persistence.test.ts` | 3 |
| Feat list | `lib/codex/feat-list.test.ts` | 2 |
| Type shape | `lib/codex-payload.test.ts`, `lib/library-types.test.ts` | 4 |

### Gaps, ranked by risk

1. **`lib/library-sync.ts` — 550 LOC, zero tests, and it is the only code in the app that deletes user content.** Needed: a renamed codex part must **not** drop a name-only saved ref; `dropMissingRefs` round-trip; fingerprint convergence after `dedupeSavedParts` collapses duplicates (P2-25 would have been caught); `changed` must be `false` for an unchanged row (P2-22); empowered nested-part handling (P1-6); `handleSyncAll` partial-failure reporting.
2. **`useCreatorSave` name-collision — zero tests.** A test asserting "saving a new power whose name matches an existing one does not PATCH the existing row" would have caught P0-1 on day one. Add: edit-then-rename must PATCH, not POST.
3. **Library GET error handling — zero tests.** Assert a Supabase error surfaces as `500`, not `200 []` (P0-2). The two existing route tests (`api/user/library/[type]/route.test.ts`) mock the columnar helpers and never exercise the error path.
4. **Reference resolution — zero unit tests** for `findByIdOrName`, `findByIdOrNameValue`, `findInLibrary`, `findTraitByIdOrName`. Table-drive: leading/trailing whitespace, mixed case, `"s377"` vs `377` vs `"377"`, NFC vs NFD (`Fëanor`), numeric-string ids, and a rename scenario. Pin the *intended* semantics so the nine implementations can be collapsed safely.
5. **`/api/codex` normalizers.** `codex-payload.test.ts` only asserts the key set of a hand-written object literal — it never touches `fetchCodexFromClient`. Test `toStrArray` / `toNumArray` / `toNum` / `toAdulthoodLifespan` against realistic Postgres shapes (CSV text, `null`, `text[]`, int vs numeric), and assert the produced payload actually satisfies a Zod `CodexPayload` schema (which would have caught P1-7).
6. **`filterOfficialPowerRows` / `filterOfficialTechniqueRows` / `filterOfficialCreatureRows` / `filterOfficialEnhancedRows` — untested.** Only the item variant has a suite. Cover the searched-field set per entity and the empty-search passthrough.
7. **`rowToItem` × `bodyToColumnar` idempotency.** The existing suite covers each direction once; the sync path does read → modify → write → read, and nothing asserts that a no-op round trip is byte-stable.
8. **`applyArmamentFilters` with `properties`-only rows** — the `resolveRowAbilityRequirement` fallback branch (`armament-filters.ts:70`) has no test and no production caller (P2-12).
9. **Pagination guard.** Once P1-3 is fixed, assert that a truncated result set raises rather than silently returning a short list.

---

## 9. Suggested order of work

1. **P0-1** (creator save by id) and **P0-2** (surface read errors) — small, isolated, and each prevents permanent data loss.
2. **P1-5 / P1-6** with the §8-1 tests written first — stop `sanitize*ForSync` from deleting refs.
3. **P1-7** — generate Supabase types, parameterise the clients, Zod-parse `/api/codex`. Unblocks honest typing everywhere downstream.
4. **P1-3** — pagination guards before content grows.
5. **C5 → C3 → C4** — mechanical lib-only consolidation, fully unit-testable (~485 LOC).
6. **C1** — the big one (~1,300 LOC); needs a full `BUILD_VALIDATION` pass on every list surface.
7. **C2**, **C6**, then the P2/P3 list.
