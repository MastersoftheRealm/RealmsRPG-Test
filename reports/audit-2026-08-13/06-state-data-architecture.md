# 06 — Client-Side State & Data Architecture Audit

**Repo:** `RealmsRPG-Test` · **Date:** 2026-08-13 · **Mode:** read-only, code-verified (docs under `src/docs/**` were not used as evidence)
**Stack confirmed from `package.json`:** next 16.2.12 · react 19.2.3 · @tanstack/react-query ^5.90.16 · zustand ^5.0.9 · @supabase/ssr ^0.8.0 · zod ^4.3.5 · vitest ^4.1.6

---

## 0. Executive summary

The app is a **100% client-fetched SPA wearing an App Router costume**. There is not a single Server Component that reads data: `src/app/layout.tsx` mounts `QueryProvider` → `AuthProvider` and every page below it is `'use client'`. There is no `dehydrate`/`HydrationBoundary`/`prefetchQuery` anywhere in `src/`. All server access funnels through 29 route handlers plus 5 server-action files, and the browser reaches them via `fetch` wrappers in `src/lib/api-client.ts`.

Within the client there are **three competing state systems** and the boundaries between them are not enforced:

1. **TanStack Query** — 34 `useQuery` + 18 `useMutation` declarations. Used correctly for codex, official library, user library, campaigns, encounters, crafting, enhanced items, profile.
2. **Zustand** — 3 stores. Two are large persisted creator drafts (legacy + guided, coexisting as expected). `auth-store` mirrors Supabase session state.
3. **Ad-hoc `useState` + `useEffect` fetch** — this is where the damage is. The single most important entity in the product (the character sheet) is loaded and written through this path, **in parallel with** a fully-built `useCharacter`/`useSaveCharacter` Query pair that other call sites use. They do not share a cache and the API PATCH is a shallow top-level merge, so the two paths can silently overwrite each other.

There are **zero `AbortController`s** in the codebase and **zero cancellation guards** on the three server-data effects that matter most.

Store subscription hygiene is poor: **44 no-selector subscriptions vs 6 with selectors**.

---

## 1. Store inventory

| Store | LOC | Holds server data? | Persisted? | `migrate`? | Consumers (files) |
|---|---:|---|---|---|---:|
| `src/stores/auth-store.ts` | 41 | **Yes** — mirrors the Supabase `user` object (`AuthUser`), plus `loading` / `initialized` / `error` | No | n/a | **12** |
| `src/stores/character-creator-store.ts` (legacy "Advanced") | 578 | Partly — `draft.archetype` embeds a codex archetype snapshot incl. `path_data` (`:304-319`) | **Yes** — `character-creator-storage`, `version: 2` (`:554-556`) | **Yes, but destructive** (`:557-567`) | **16** |
| `src/stores/guided-creator-store.ts` (guided) | 605 | No — pure id-based draft | **Yes** — `guided-creator-storage`, `version: 11` (`:379-381`) | **Yes**, 10 incremental steps + a `merge` backfill (`:387-601`) | **18** |

`src/stores/index.ts:7-8` exports `useAuthStore` and `useCharacterCreatorStore` only. `useGuidedCreatorStore` is **not** in the barrel, so 18 files import it by deep path while `protected-route.tsx:11` imports from `@/stores` — two conventions in the same tree.

### Non-Zustand client state that behaves like a store

| Module | Mechanism | Notes |
|---|---|---|
| `src/components/rolls/roll-context.tsx` | React context + `localStorage` (`realms-roll-log`) | Lazy `useState` initializer reads storage during render (`:86-98`); write effect on every `rolls` change (`:101-106`). No version field → schema drift risk on `RollEntry`. |
| `src/lib/guest-encounter-storage.ts` | raw `localStorage` | Guest encounters; migrated on `SIGNED_IN` from `use-auth.ts:66`. |
| `src/lib/game/creator-cache.ts` | raw `localStorage` + `timestamp` TTL | Shared by 5 creator workspaces. |
| `src/lib/onboarding-preferences.ts` | raw `localStorage` | 4 keys. |
| `src/lib/library/character-filter-persistence.ts` | raw `localStorage` | Has a legacy-key migration (`:15-18`) — the only raw-storage module that does. |
| `src/lib/encounter/character-resource-sync.ts:16-17` | **module-level `Map`s** outside React | `pendingTimers` + `lastLocalResourceEditAt`, keyed by character id. Timers outlive unmount and sign-out. |
| `src/app/(main)/characters/[id]/use-character-sheet-page-data.ts:49-52` | `useState` | **The character sheet's copy of the character.** See P0-3. |

### Store design notes

- **Derived/duplicated state.** `guided-creator-store.ts:186` keeps `armaments` as a derived mirror of `loadoutWeapons + loadoutArmor`, recomputed inside `updateDraft` (`:355-362`) and documented as "kept in sync for legacy callers". This is duplicated state persisted to disk; it should be a selector, not a field.
- **Immutability.** No accidental mutation in the reducers themselves — every action spreads. One exception in the migration path: `guided-creator-store.ts:521-528` mutates the persisted `skills` object in place (`skills[String(id)] = 0` where `skills = legacy.skills ?? {}`).
- **Action granularity.** The legacy store has 18 actions with real domain semantics (`setArchetypePath`, `reselectArchetype`, cascade resets via `downstreamDraftReset()`). The guided store has exactly one write action, `updateDraft(partial)`, so all invariants live in the 14 consuming components instead of the store.
- **`getCharacter()` lives inside the store** (`character-creator-store.ts:427-551`, ~125 lines): pure derivation + codex lookups + proficiency calculation, taking 4 DB arrays as arguments. It is a pure function wearing a store action; it belongs in `src/lib/`, like the guided equivalent `buildGuidedCharacterPayload` in `src/lib/guided-creator/build-character.ts`.

---

## 2. Data-fetching pattern census

| Pattern | Count | Representative files |
|---|---:|---|
| **RSC data fetching** (server Supabase client inside a `page.tsx`/`layout.tsx`) | **0** | — |
| SSR prefetch / `dehydrate` / `HydrationBoundary` / per-request `QueryClient` | **0** | — (none needed today, because 0 RSC fetches) |
| Route handlers (`src/app/api/**/route.ts`, non-test) | **29** | `api/characters/[id]/route.ts`, `api/codex/route.ts`, `api/user/library/[type]/route.ts` |
| Server Actions (`'use server'`) | **5** | `(auth)/actions.ts`, `(main)/campaigns/actions.ts`, `(main)/admin/codex/actions.ts` |
| `useQuery` declarations | **34** across 17 files | `use-codex.ts` (12), `use-campaigns.ts` (4), `use-characters.ts` (2) |
| `useMutation` declarations | **18** across 6 files | `use-enhanced-items.ts` (5), `use-characters.ts` (4), `use-encounters.ts` (3) |
| Browser Supabase client imports (`@/lib/supabase/client`) | **8** files | `use-auth.ts`, `use-campaign-rolls.ts`, `use-my-account-page.ts`, `(auth)/login|register|forgot-password|reset-password` |
| Server Supabase client imports (`@/lib/supabase/server`) | **45** files | all under `src/app/api/**`, `src/app/**/actions.ts`, `src/lib/*-server.ts` |
| Supabase Realtime `postgres_changes` channels | **3** — all with `removeChannel` cleanup | `use-campaign-rolls.ts:42`, `use-character-sheet-page-data.ts:186`, `use-combat-linked-character-sync.ts:168` |
| Direct client-side table access (`supabase.from(...)` in a component/hook) | **1** | `use-my-account-page.ts:108` (`user_profiles.upsert`) |
| Ad-hoc `useEffect` → `fetch` → `useState` for **server data** | **6** sites — **3 without any cancellation** | ✗ `use-character-sheet-page-data.ts:144`, ✗ `campaigns/[id]/view/[userId]/[characterId]/page.tsx:99`, ✗ `use-combat-linked-character-sync.ts:32`; ✓ `admin-image-edit-modal.tsx:57`, ✓ `image-upload-modal.tsx:182`, ✓ `reset-password/page.tsx:46` |
| Writes that bypass the Query cache entirely | **6** sites | `reveal-step.tsx:183,191`, `finalize-step.tsx:12`, `use-character-sheet-page-data.ts:253`, `use-character-sheet-page-ui.ts:87,104`, `character-resource-sync.ts:161` |
| `AbortController` / `signal:` | **0** | — |
| Polling (`setInterval`) | **1** (90 s, visibility-gated — correctly implemented) | `use-combat-linked-character-sync.ts:126` |
| Zustand store subscriptions **without** a selector | **44** | see §4 |
| Zustand store subscriptions **with** a selector | **6** | `character-preview-panel.tsx:50-51`, `use-creator-path-data.ts:15` |
| `'use client'` files | 461 | — |

**Not found (good):** browser client used in server code, server client used in client code, request-per-keystroke, missing dependency arrays, refetch loops.

---

## 3. Findings

### P0 — user data loss / auth / crash

---

#### P0-1 · `migrate` on the legacy creator store throws the user's in-progress character away

`src/stores/character-creator-store.ts:557-567`

```ts
migrate: (persistedState, version) => {
  if (version < CREATOR_STORE_SCHEMA_VERSION) {
    return { currentStep: 'archetype', completedSteps: [], stepLayer: {}, draft: cloneInitialDraft() };
  }
  return persistedState as ...;
},
```

**Why it matters.** The store is currently `version: 2` (`:164`). The next time anyone changes the draft shape and bumps to `3`, every user with a half-built Advanced character loses it on their next page load, silently and irrecoverably. There is no `merge` fallback either (contrast `guided-creator-store.ts:559-601`), so the alternative — *not* bumping — ships `undefined` for every newly-added draft field into `getCharacter()` at `:427`. Both branches are broken; the store is a landmine that detonates on the next schema change. This is a guest-friendly creator (`advanced/page.tsx:5` — "login required only for saving"), so the localStorage draft *is* the user's only copy.

**Fix.** Port the guided store's pattern verbatim: incremental `if (version < N) { ...backfill... }` blocks, plus a `merge(persisted, current)` that starts from `cloneInitialDraft()` and layers the persisted draft on top so unknown/absent fields self-heal without a version bump.

---

#### P0-2 · Character-sheet autosave debounce is reset on every render and can be starved indefinitely

`src/app/(main)/characters/[id]/use-character-sheet-page-data.ts:248-260` + `src/hooks/use-auto-save.ts:74-161`

The sheet passes **inline arrow functions**:

```ts
// use-character-sheet-page-data.ts:248
const { hasUnsavedChanges, saveNow } = useAutoSave({
  data: character,
  onSave: async (data) => { ... },      // new identity every render
  onSaveError: () => { ... },           // new identity every render
});
```

`performSave` is `useCallback(..., [onSave, onSaveStart, onSaveComplete, onSaveError])` (`use-auto-save.ts:109`), so it gets a new identity every render. The debounce effect depends on it (`use-auto-save.ts:161`: `[data, delay, enabled, performSave]`), so **every render** runs `clearTimeout(timeoutRef.current)` and schedules a fresh `setTimeout(..., 2000)` (`:149-154`).

**Why it matters.** Whenever the sheet re-renders more often than once per 2 s, the save never fires. The sheet has many re-render sources: the realtime `postgres_changes` handler (`:182-210`), ~18 concurrent `useQuery` observers settling, `RollProvider` state, and HP/EN steppers. The only backstop is the `beforeunload` handler at `use-auto-save.ts:197-207`, which shows a browser prompt but **does not save**. Result: silently lost sheet edits.

Two additional costs on the same path: `JSON.stringify(character)` runs twice per invocation (`:90`, `:104`, `:135`) on a full character document, now once per render instead of once per change.

**Fix.** Inside `useAutoSave`, hold the callbacks in a ref updated by a separate effect and make the debounce effect depend only on `[data, delay, enabled]`. (Belt and braces: wrap `onSave`/`onSaveError` in `useCallback` at the call site.) Add a `saveNow()` in a `pagehide`/`visibilitychange` handler.

---

#### P0-3 · Two disconnected copies of the character + a shallow-merge PATCH ⇒ lost updates

| Path | Read | Write |
|---|---|---|
| **Sheet (legacy)** | `useState` + `getCharacter()` in an effect — `use-character-sheet-page-data.ts:49`, `:151` | raw `saveCharacter()` service — `:253`, `use-character-sheet-page-ui.ts:87`, `:104`, `character-resource-sync.ts:161` |
| **Everything else (Query)** | `useCharacter()` → `['characters','detail',id]` — `use-characters.ts:49`; consumed by `use-add-to-character-from-library.tsx:46`, `CodexFeatsTab.tsx:93`, `CodexSkillsTab.tsx:72`, `armament-filters.tsx:75`, `power-technique-filters.tsx:82` | `useSaveCharacter()` mutation — `use-characters.ts:60`, invalidates detail + list |

Neither side invalidates the other. The sheet's writes **never** touch `['characters','detail',id]`, so the Query cache serves data that is stale from the moment the user edits the sheet.

Then `src/app/api/characters/[id]/route.ts:146-147`:

```ts
const currentData = (existing.data as Record<string, unknown>) ?? {};
const mergedData = { ...currentData, ...cleanedData };
```

Top-level shallow merge — and `cleanForSave` (`src/lib/data-enrichment/clean-for-save.ts:14-64`) emits ~45 top-level keys including `powers`, `techniques`, `equipment`, `proficiencies`. So the sheet's autosave writes its **entire** snapshot.

**Concrete loss scenarios:**
- `use-add-to-character-from-library.tsx:113` PATCHes `{ powers, techniques, proficiencies }` built from the possibly-stale Query copy → clobbers newer sheet edits.
- Sheet open in two tabs / on phone + desktop: the realtime handler at `use-character-sheet-page-data.ts:195-204` merges **only** HP/EN/AP (`mergeResourceUpdatesIntoCharacter`). Every other remote change is invisible, and the next autosave from the stale tab overwrites it.

**Fix.** Make `useCharacter`/`useSaveCharacter` the single source of truth for the sheet. Keep only genuinely local UI state in `useState`; drive the document from the Query cache with `setQueryData` for optimistic edits and let the mutation's `onSuccess` invalidate. If a full rewrite is too large now, the minimum viable patch is: after every sheet `saveCharacter`, call `queryClient.setQueryData(characterKeys.detail(id), ...)`, and switch the sheet's read to `useCharacter`.

---

### P1 — stale/incorrect data, races, refetch behaviour

---

#### P1-1 · Character load effect has no cancellation and races itself on every cold load

`src/app/(main)/characters/[id]/use-character-sheet-page-data.ts:144-166`

```ts
useEffect(() => {
  async function loadCharacter() {
    if (authLoading) return;
    ... const data = await getCharacter(id); setCharacter(data.character); ...
  }
  loadCharacter();
}, [id, authLoading]);
```

No `cancelled` flag, no `AbortController` (there are none in the repo). `authLoading` flips `true → false` during a normal cold load, so the effect re-runs while the first request may still be in flight; whichever response lands last wins. Navigating between two character ids does the same. Compare with three effects in the same repo that *do* get this right (`admin-image-edit-modal.tsx:59`, `image-upload-modal.tsx:185`, `reset-password/page.tsx:47`).

**Fix.** Deleting this effect in favour of `useCharacter(id)` (P0-3) fixes it for free. Otherwise add a `let cancelled = false` guard plus a request-id ref.

Same shape, same missing guard: `src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx:99-119`.

---

#### P1-2 · `useAuth` initial-session race — the comment describes a guard that does not exist

`src/hooks/use-auth.ts:62-85`

```ts
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  setUser(toAuthUser(session?.user ?? null)); setInitialized(true); ...
});

// Get initial session (only sets state if onAuthStateChange hasn't fired yet)   <-- untrue
supabase.auth.getUser().then(({ data: { user: u } }) => {
  if (mountedRef.current) { setUser(toAuthUser(u)); setInitialized(true); }
});
```

There is no ordering guard. `getUser()` resolves on its own schedule; if it lands after a `SIGNED_OUT` event it repopulates `user` with a signed-out-stale identity, and if it lands after `SIGNED_IN` on a slow network it can write an older value. `mountedRef` only covers unmount.

**Fix.** Track `let listenerFired = false` in the effect closure, set it in the listener, and drop the `getUser()` result if it is already `true`. (Also: `mountedRef.current = true` at `:49` is redundant — the ref is initialised `true` at `:45` and never reset except in cleanup, which makes StrictMode double-invoke correctness accidental rather than intentional.)

---

#### P1-3 · Query cache is not user-scoped and is never cleared on sign-in

`src/components/providers/query-provider.tsx:17` creates one `QueryClient` for the browser session. `src/app/(auth)/login/page.tsx:81` does `router.push(getRedirectPath())` — a **soft** navigation, so the cache survives the identity change. (`signOut` at `use-auth.ts:146` does a hard `window.location.href`, so sign-*out* is safe.)

Query keys are inconsistent about the user:

| Keyed by user | Not keyed by user |
|---|---|
| `use-encounters.ts:41` `[...encounterKeys.list(), user?.id ?? 'guest']` | `use-characters.ts:23` `['characters','list']` |
| `use-user-library.ts:52` `[\`user-${type}\`, userId]` | `use-campaigns.ts:15` `['campaigns','list']` |
| `use-profile.ts:24` `['user-profile', userId]` | `use-crafting.ts:25` `['crafting','list']` |
| `use-admin.ts:17` `['admin', user?.uid]` | `use-characters.ts:26` `['characters','detail',id]` |

**Why it matters.** A guest browses `/characters` (query disabled → nothing cached) or `/campaigns` (`useCampaignsFull` at `use-campaigns.ts:31` has **no** `enabled` gate, so it runs for guests and caches a 401 error), signs in, and is soft-navigated back. With `staleTime: 60_000` (`query-provider.tsx:22`) the guest-era cache entry is served for up to a minute.

**Fix.** Two lines in `use-auth.ts`: on `SIGNED_IN` / `SIGNED_OUT` / `USER_UPDATED`, call `queryClient.clear()`. And make the four unscoped list keys include `userId` for defence in depth. Also add `enabled: !!user` to `useCampaignsFull`.

---

#### P1-4 · Creating a character never invalidates the character list

`src/components/guided-creator/steps/reveal-step.tsx:183` and `src/components/character-creator/steps/finalize-step.tsx:12` both call `createCharacter()` from `@/services/character-service` **directly**.

Meanwhile `useCreateCharacter` (`src/hooks/use-characters.ts:76-85`) exists, does exactly the right `invalidateQueries({ queryKey: characterKeys.lists() })`, is **not exported** from `src/hooks/index.ts:86-92`, and is **imported by zero files**.

**Why it matters.** Finish the guided creator → land on the sheet → click back to `/characters` → the new character is missing for up to `staleTime` (60 s). Same for the portrait follow-up write at `reveal-step.tsx:191`.

**Fix.** Export and use `useCreateCharacter` in both creators, or at minimum call `queryClient.invalidateQueries({ queryKey: characterKeys.all })` after a successful create.

---

#### P1-5 · A render-phase side effect schedules a database write

`src/app/(main)/characters/[id]/use-character-sheet-page-data.ts:216-246`

```ts
const [pathProfAppliedKey, setPathProfAppliedKey] = useState<string | null>(null);
if (character && codexArchetypes.length > 0) {          // <-- render body, not an effect
  ...
  if (profUpdate) { const next = { ...character, ...profUpdate }; setPathProfAppliedKey(...); setCharacter(next); }
}
```

Setting state during render is legal React when it is a guarded derived-state update, but here `setCharacter` feeds `useAutoSave` (`:248`), so a *render* schedules a PATCH to Supabase. Worse, the guard key is derived from the very values it writes (`${next.id}:${level}:${next.pow_prof}:${next.mart_prof}`), so any external change to `pow_prof`/`mart_prof` — including one arriving from the other write path in P0-3 — re-triggers the block.

**Fix.** Move to an explicit `useEffect` keyed on `[character?.id, character?.level, codexArchetypes]`, or better, compute it server-side on load in `rowToCharacter`.

The same render-phase-setState shape (harmless, no write) appears at `use-character-sheet-page-ui.ts:73-75` and `login/page.tsx:35-38`.

---

#### P1-6 · Persisted Zustand stores hydrate synchronously → SSR/client markup divergence

`src/stores/character-creator-store.ts:556` and `src/stores/guided-creator-store.ts:381` both use `createJSONStorage(() => localStorage)` with **no `skipHydration`**. With a synchronous storage, zustand's `persist` rehydrates during store creation (module evaluation), so the browser's *first* render already carries persisted state while the server-rendered HTML carries the initial state.

Directly observable at `src/app/(main)/characters/new/advanced/page.tsx:46-48`:

```ts
const visibleSteps = STEP_ORDER.filter((step) => !isCreatorStepSkipped(step, draft));
const stepIndex = visibleSteps.indexOf(currentStep) + 1;
// rendered as: `Step ${stepIndex} of ${totalSteps}` (:65)
```

Server emits "Step 1 of 9"; a returning user's client emits "Step 6 of 8".

The repo already has the right primitive and does not use it here: `src/hooks/use-is-client.ts:13` (`useSyncExternalStore`-based, SSR-safe).

**Fix.** `skipHydration: true` on both persist configs + `useEffect(() => { useXStore.persist.rehydrate(); }, [])` in the creator shells, or gate persisted-state-dependent output behind `useIsClient()`. Worth confirming against the browser console before/after.

---

#### P1-7 · `/api/codex` is an uncached full-database dump fetched on essentially every page

`src/app/api/codex/route.ts:65-79` issues **11 unfiltered `select('*')`** reads (`codex_feats`, `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, `codex_archetype_levels`, `codex_creature_feats`, `core_rules`) plus two `enrichRowsWithBankImageUrls` round trips (`:107-108`). Response headers: `private, max-age=0, must-revalidate` (`:448`); the client fetches with `cache: 'no-store'` (`src/lib/api-client.ts:97`).

Client-side it is at least deduped: all 12 hooks in `use-codex.ts` share `queryKey: ['codex']` and narrow with `select` — a genuinely good pattern. But `useGameRules` (`use-game-rules.ts:255-263`) registers the **same key with different options** (`staleTime: 10min` vs `5min`, `gcTime: 1h` vs `30min`, `retry: 1` vs `2`, no `refetchOnMount`). Which policy applies depends on which observer happens to mount first, so refetch timing is non-deterministic.

**Fix.** (a) Give `useGameRules` the same `DEFAULT_OPTIONS` as `use-codex.ts`, or move it into that file. (b) Give the codex route an ETag / `s-maxage` + `stale-while-revalidate` and invalidate on admin write (there is already a `['codex']` invalidation at `use-creator-save.ts:119`). (c) Split the payload — most pages need `coreRules` and one or two collections, not all 11 tables.

---

### P2 — maintainability, duplication, performance

---

#### P2-1 · 44 store subscriptions with no selector vs 6 with

Every `const { draft, updateDraft } = useGuidedCreatorStore()` re-renders on *any* store change. The hot path is the guided creator, where **14 components** subscribe to the whole store:

`guided-creator-shell.tsx:51,114` · `guided-health-energy-section.tsx:27` · `guided-portrait-upload.tsx:15` · `guided-step-layout.tsx:48` · `steps/abilities-step.tsx:34` · `steps/ancestry-step.tsx:99` · `steps/archetype-feats-step.tsx:57` · `steps/character-feat-step.tsx:40` · `steps/loadout-step.tsx:78` · `steps/path-step.tsx:67` · `steps/powers-techniques-step.tsx:75` · `steps/reveal-step.tsx:71` · `steps/skills-step.tsx:49` · `steps/species-step.tsx:36`

So one keystroke in the name field (`reveal-step.tsx:257` → `updateDraft`) re-renders all of them, and several run heavy `useMemo`s over the full codex (`reveal-step.tsx:73-85` alone subscribes to 13 queries).

Legacy creator, same problem, 15 files: `advanced/page.tsx:45` · `creator-tab-bar.tsx:34` · `steps/abilities-step.tsx:35` · `steps/ancestry/use-ancestry-step-state.ts:31` · `steps/archetype-step.tsx:60` · `steps/equipment-step.tsx:76` · `steps/feats-step.tsx:50` · `steps/finalize/health-energy-section.tsx:22` · `steps/finalize/identity-fields.tsx:8` · `steps/finalize/portrait-upload.tsx:8` · `steps/finalize/step-edit-link.tsx:7` · `steps/finalize-step.tsx:51` · `steps/powers-step.tsx:51` · `steps/skills-step.tsx:56` · `steps/species-step.tsx:43`

`useAuthStore()`, 12 files: `use-auth.ts:42` · `protected-route.tsx:22` · `use-campaigns.ts:23` · `use-user-library.ts:91,200,214` · `use-my-account-page.ts:27` · `LibraryPublicContent.tsx:74` · 5 creator pages.

The 6 that do it right: `character-preview-panel.tsx:50-51`, `guided-reveal-summary.tsx:51`, `use-guided-path-data.ts:19`, `use-creator-path-data.ts:15`, `characters/new/guided/page.tsx:31`.

**Fix.** Selector-per-value (`useGuidedCreatorStore((s) => s.draft.name)`), and pull actions out once via a stable `useShallow` selector or a separate non-reactive `getState()` accessor. Note that action identities are already stable, so `const updateDraft = useStore(s => s.updateDraft)` is free.

---

#### P2-2 · Two parallel library-merge hooks (legacy vs guided generations)

| | `src/hooks/use-load-modal-library.ts` | `src/hooks/add-library-item/use-add-library-item-data.ts` |
|---|---|---|
| LOC | 433 | 178 (+ 4 sibling modules) |
| Consumers | 6 standalone creators | 1 (`add-library-item-modal.tsx:68`) |
| Job | user library + official library + codex → `SelectableItem[]`, `_source` tagging, dedupe, empty-state copy | *identical job* |

`use-load-modal-library.ts:174-326` is a single 150-line `useMemo` with a **35-entry dependency array** and a 6-way `if (type === ...)` ladder; `emptyMessage`/`emptySubMessage` at `:368-410` are 40 lines of nested ternaries. Both hooks call the same `buildSelectableItem` from `@/lib/library-selectable-builders`, so the shaping is already unified — only the fetch/merge/copy layer is forked.

**Fix.** One `useLibraryCatalog(type, { scope, enabled })` hook returning `{ rows, isLoading, isError }`; move the copy tables into a `Record<type, {...}>` const; let both modals consume it.

---

#### P2-3 · `useAddLibraryItemData` fires 12 queries when it needs 2–3

`src/hooks/add-library-item/use-add-library-item-data.ts:31-42` unconditionally mounts `useUserPowers`, `useUserTechniques`, `useUserEmpoweredTechniques`, `useUserItems`, `useCodexEquipment`, `useCodexTechniqueParts`, `useCodexPowerParts`, `useCodexItemProperties`, and `useOfficialLibrary` × 4 — regardless of `itemType`. The sibling hook does gate these (`use-load-modal-library.ts:105-163` passes `enabled: needX && fetchEnabled`).

Mitigations that make this a P2 rather than P1: the modal is only mounted when open (`CharacterSheetModals.tsx:140`), the 4 codex hooks collapse to the shared `['codex']` key, and `useOfficialLibrary` has `staleTime: 5min`. Still 4 wasted network requests on the first open.

**Fix.** Copy the `enabled: needX` gating from `use-load-modal-library.ts`.

---

#### P2-4 · `useMergedSpecies` fabricates a fake `UseQueryResult`

`src/hooks/use-user-library.ts:166-191` hand-builds an object with 20 stubbed fields — `isStale: false`, `isFetched: true`, `fetchStatus: 'idle'`, `dataUpdatedAt: 0`, `failureCount: 0` — and casts it `as unknown as UseQueryResult<Species[], Error>`. Every one of those is a lie about the two underlying queries. Consumers that trust them (`use-character-sheet-page-data.ts:80`, `reveal-step.tsx:73`, `finalize-step.tsx:53`, `use-load-modal-library.ts`, `species-step.tsx`) get wrong refetch/staleness signals.

**Fix.** Return a plain `{ data, isLoading, isError, error, refetch }` object typed as its own interface, or use `useQueries` with a `combine` function (TanStack v5 supports this natively and returns a real result).

---

#### P2-5 · No generated Supabase types — `any` from every `.from()`

There is **no** `Database` type in the repo. `src/lib/supabase/client.ts:13`, `src/lib/supabase/server.ts:19,45`, `src/lib/supabase/middleware.ts:54` and `src/app/auth/callback/route.ts:42` all call the factories without the generic. Consequence: every query result is `any`, and every route re-invents a hand-written cast — `api/characters/[id]/route.ts:21` (`type CharRow`), `:24` (`as Record<string, unknown>`), `api/codex/route.ts:49` (`type Row = Record<string, unknown>`) and 8 more `as Row[]` casts in that file alone, ending in `as unknown as CodexPayload` at `:444`. A column rename in Supabase is a runtime failure, not a compile error.

**Fix.** `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`, then `createBrowserClient<Database>(...)` / `createServerClient<Database>(...)` in all four factories. Highest value-per-hour item in this report.

---

#### P2-6 · The only client-side table write in the app

`src/app/(main)/my-account/_components/use-my-account-page.ts:108-111`

```ts
const { error: profileError } = await supabase.from('user_profiles').upsert(
  { id: user.uid, photo_url: url, updated_at: new Date().toISOString() }, { onConflict: 'id' });
```

Every other write in the app goes through `/api/*` or a server action — including the sibling handler 30 lines up (`:78`, `apiUpload('/api/upload/profile-picture')`) which does the same conceptual thing. Correctness here rests entirely on an RLS policy on `user_profiles` that could not be verified from code.

**Fix.** Route it through the existing `/api/upload/profile-picture` handler (or a small `PATCH /api/user/profile`) so authorisation lives in one place.

---

#### P2-7 · Delete / merge candidates (dead or near-dead)

| Symbol | Location | Status |
|---|---|---|
| `useCreateCharacter` | `use-characters.ts:76-85` | **Dead** — 0 imports, not in the barrel. Should be *revived* (see P1-4), not deleted. |
| `useCampaignByInviteCode` | `use-campaigns.ts:46-53` | **Dead** — definition only. |
| `useInvalidateEncounters` | `use-encounters.ts:115-120` | **Dead** — definition only. |
| `useDeleteSpecies` | `use-user-library.ts:232` | **Dead** — definition only, not in the barrel. |
| `useDuplicateSpecies` | `use-user-library.ts:239` | **Dead** — definition only, not in the barrel. |
| `useCodexFull` | `use-codex.ts:31` | 1 consumer (`admin/codex/use-codex-spreadsheet.ts:35`). Keep. |
| `src/hooks/use-add-library-item-data.ts` | whole file (2 lines) | Pure re-export shim over `./add-library-item/use-add-library-item-data`; `hooks/index.ts:24` re-exports it again. Collapse. |
| `characterKeys.list()` / `.lists()` | `use-characters.ts:23-24` | Identical; `list()` adds nothing. Same duplication in `encounterKeys` (`use-encounters.ts:31-32`) and `craftingKeys` (`use-crafting.ts:25-26`). |
| `enhancedItemsKeys.list()` / `.lists()` | `use-enhanced-items.ts:41-42` | `list = lists`, verbatim. |
| `USER_LIBRARY_QUERY_KEYS` vs `USER_LIBRARY_KEY_MAP` | `use-creator-save.ts:19-26` vs `use-official-library.ts:33-40` vs `libraryQueryKey` (`use-user-library.ts:52`) | **Three** hand-maintained copies of the `type → 'user-<type>'` mapping. Merge into one exported `libraryQueryKey`/`libraryQueryKeyPrefix` pair. |
| `guided-creator-store` barrel gap | `stores/index.ts:7-8` | 18 files deep-import; add the export. |

---

#### P2-8 · Module-level timer map survives unmount and sign-out

`src/lib/encounter/character-resource-sync.ts:16-17` keeps `pendingTimers` and `lastLocalResourceEditAt` as module-level `Map`s. `scheduleCharacterResourceSync` (`:149-164`) queues a 400 ms `setTimeout` that fires `saveCharacter(...)` with `.catch(() => {})`. Nothing clears these on route change, unmount, or sign-out, and every failure is swallowed silently.

**Fix.** Flush pending timers on `pagehide`; clear both maps on `SIGNED_OUT`; log failures through `logClientError` instead of discarding them.

---

#### P2-9 · N+1 request fan-out on encounter open

`src/app/(main)/encounters/[id]/_components/combat/use-combat-linked-character-sync.ts:41-57` issues one `apiFetchOrNull` **per linked combatant** inside `Promise.all`, and this runs on encounter open (`:105`), every 90 s (`:126`), and on every tab focus (`:136`). A 6-player campaign encounter = 6 requests every 90 s per open tab. The visibility gating (`:134-147`) is well done; the fan-out is not.

**Fix.** One batch endpoint, e.g. `GET /api/campaigns/[id]/characters?ids=a,b,c&scope=encounter`.

---

### P3 — nits

- `src/hooks/use-creator-save.ts:131-134` — `setTimeout(..., 2000)` inside `executeSave` with no cleanup; fires `setSaveMessage(null)` + `onSaveSuccess?.()` after unmount.
- `src/app/(main)/campaigns/[id]/_components/use-campaign-detail-page.ts:64` — `setTimeout(() => setCopied(false), 2000)`, no cleanup.
- `src/stores/guided-creator-store.ts:521-539` — the `version < 3` block sits *after* `version < 11`; harmless today because the transforms are independent, but it reads as a bug and mutates the persisted `skills` object in place at `:525`.
- `src/hooks/use-auth.ts:49` — `mountedRef.current = true` is redundant (initialised `true` at `:45`).
- `src/hooks/use-profile.ts:31-57` and `:121-181` — two hooks over the same query key with different mapping; `useAccountProfile` recomputes `mapAccountProfile` on every render instead of using `select`.
- `src/hooks/use-user-library.ts:91` — `useUserLibrary` subscribes to the whole auth store just to read `user.uid`.
- `src/components/rolls/roll-context.tsx:86-98` — `localStorage` read in a `useState` lazy initializer runs on the server too; guarded by `typeof window === 'undefined'`, but this is another hydration-divergence source (server `[]`, client N rolls).
- `src/hooks/use-campaigns.ts:31-36` — `useCampaignsFull` has no `enabled` gate, so guests fire it and cache a 401.

---

## 4. Auth session flow on the client (scope item 6) — assessment

The flow is **structurally sound**; the defects are the two races above, not the design.

1. **Edge:** `src/lib/supabase/middleware.ts:34-101` (`updateSession`, called from `proxy.ts`) refreshes the token with `getUser()` (`:74`) — correct, not `getSession()`. It skips refresh during PKCE (`:37-39`), signs out on `refresh_token_not_found` (`:76-78`), and hard-gates `/my-account` + `/campaigns/*` at `:93-99` so protected HTML never reaches the client.
2. **Client:** `AuthProvider` (`auth-provider.tsx:18`) calls `useAuth()` once at the root; `useAuth` subscribes `onAuthStateChange` and unsubscribes in cleanup (`use-auth.ts:89`) — **no listener leak**.
3. **Server:** `src/lib/supabase/session.ts:26` uses `auth.getUser()`. The only `getSession()` in the whole repo is `reset-password/page.tsx:49`, on the client, purely to check whether a recovery link produced a session — an acceptable use.
4. **Admin flags are not client-trusted.** `useAdmin` (`use-admin.ts:16-24`) queries `/api/admin/check`; `src/lib/admin.ts:28` re-reads the role from `user_profiles` server-side on every admin route. Good.
5. **Hydration flash:** `ProtectedRoute` (`protected-route.tsx:32-39`) renders a spinner until `initialized && !loading`, so there is no protected-content flash — but every guarded page shows a spinner on first paint because auth is resolved entirely client-side. Cheap fix: pass the middleware-known user into the tree as a server-rendered prop and seed `auth-store` with it.

---

## 5. Recommended target architecture

One rule, three tiers:

### Tier 1 — RSC + server Supabase client: *identity and first paint*
- Root layout reads the user via `src/lib/supabase/session.ts` and passes it down; `auth-store` starts **initialized** instead of spinning. Kills the P3 hydration flash and the P1-2 race in one move.
- `/characters`, `/campaigns`, `/characters/[id]` become server components that `prefetchQuery` the list/detail into a per-request `QueryClient` and ship it through `HydrationBoundary`. The existing client hooks then hit a warm cache with no waterfall and no code changes at the leaves. (Requires a `getQueryClient()` helper — the app has none today.)
- Codex/core rules: the natural home is an RSC-cached fetch with `revalidateTag('codex')` fired from the admin write path, replacing the current `no-store` full dump (P1-7).

### Tier 2 — TanStack Query: *everything owned by the server*
Non-negotiable: **all** server data, read and write, goes through Query. Concretely that means retiring the `useState` + effect-fetch path for the character sheet (P0-3, P1-1) and routing every write through a mutation so invalidation is automatic (P1-4).

Conventions to standardise now:
- One `queryKeys.ts` module. Every user-scoped key carries `userId`. Delete the three duplicated `type → 'user-<type>'` maps.
- `queryClient.clear()` on every auth transition (P1-3).
- Per-domain `staleTime`, set once, not per call site: codex/official library `5–10 min`; user library `2 min`; characters/campaigns/encounters `30 s`. `refetchOnWindowFocus: false` globally is right for this app (long-lived sheets) — keep it, but pair it with realtime for anything collaborative, which is already the pattern in `use-campaign-rolls.ts`.
- Sheet edits: `setQueryData` for the optimistic write + a debounced mutation with `onError` rollback. Today there are optimistic updates with no rollback (`use-profile.ts:143-169`).

### Tier 3 — Zustand: *only state the server has never seen*
That is exactly two things: the **guided creator draft** and the **legacy creator draft** (until it is retired). Everything else in a Zustand store today either belongs in Query (`auth-store.user` is a projection of the Supabase session) or in `useState`.

Rules for the two stores that remain:
- Persist with `skipHydration: true` + explicit rehydrate (P1-6).
- **Never** wipe on migrate; incremental `if (version < N)` + a `merge` that backfills from the initial draft (P0-1). Add a Vitest case per version so migrations cannot silently regress — `guided-creator-store.test.ts` already exists and is the right place.
- No derived fields on disk (`draft.armaments` → selector).
- Selector-only subscriptions (P2-1).
- Pure derivation (`getCharacter`) moves out of the store into `src/lib/`, matching `build-character.ts`.

### Sequencing
1. **P0-1** migrate rewrite — 30 min, removes a scheduled outage.
2. **P0-2** `useAutoSave` callback refs — 30 min, stops silent edit loss.
3. **P1-3** `queryClient.clear()` on auth change + user-scoped keys — 1 h.
4. **P1-4** use `useCreateCharacter` — 30 min.
5. **P2-5** generate `Database` types — half a day, converts a whole class of runtime bugs into compile errors.
6. **P0-3 / P1-1 / P1-5** move the character sheet onto `useCharacter`/`useSaveCharacter` — the big one; do it as its own task with the sheet's `BUILD_VALIDATION` pass.
7. **P2-2** unify the two library-merge hooks; **P1-6** hydration; **P2-1** selectors.
