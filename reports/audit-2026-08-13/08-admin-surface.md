# Admin Surface — Independent Engineering Audit

**Date:** 2026-08-13
**Scope:** `src/app/(main)/admin/**` (73 files, 14,129 LOC; `admin/codex` alone is 43 files / 10,783 LOC), `src/app/(main)/admin/codex/actions.ts`, `src/components/codex/**` + `src/lib/codex/**` as used by admin, and `src/app/api/admin/**` + `src/app/api/images/**` cross-checked only for privilege parity.
**Method:** Read-only. Every file in scope read in full. Findings verified in code, not docs. No build, no SQL, no writes outside this report.

---

## 0. Executive summary

Privilege enforcement is the strongest part of this surface and is **not** a finding: `admin/layout.tsx` redirects server-side, all four server actions call `requireAdmin()` as their first statement, and every `/api/admin/*` and `/api/images/*` mutation re-checks the session and role independently. A non-admin cannot write codex or user data through any path I found.

The danger here is not access control. It is that **an authorized admin performing a normal, correct-looking action silently destroys official content**, and there is no validation layer, no optimistic locking, and no test coverage to stop it. Three separate paths do this today:

1. Saving any feat through the admin modal NULLs `codex_feats.mart_prof_req`, because the write allowlist includes a column the read API never returns.
2. The spreadsheet's `id` column is a free-text input included in global find/replace, and Save-all writes each row keyed on the client-supplied id — so one entity can overwrite another, at scale, behind a confirm that only reports a row count.
3. Saving an archetype deletes all of its progression levels before re-inserting them, non-transactionally, and an empty levels array wipes them permanently.

Layered on that: `collection` is a TypeScript-only union handed straight to a **service-role** Supabase client with no runtime allowlist; a changelog write failure inverts a successful save into a reported failure (causing duplicate creates on retry); and there are **zero tests** anywhere under `src/app/(main)/admin/`.

Counts: **4 P0**, **12 P1**, **11 P2**, **3 P3**. Duplication clusters total ~1,210 LOC of removable copy-paste.

---

## 1. Server action inventory

`src/app/(main)/admin/codex/actions.ts` is the **only** `'use server'` module in the admin surface (verified by grep across `src/`: the other four are auth and campaigns). It exports exactly four actions; all other admin writes go through REST routes under `/api/admin/*`, `/api/images/*`, `/api/official/*`.

| Action | file:line | Auth check? | Role check? | Zod? | Destructive? | Audit trail? |
|---|---|---|---|---|---|---|
| `createCodexDoc` | `actions.ts:243` | ✅ `requireAdmin()` is first statement (`:249`) | ✅ `isAdmin()` (`:37`) | ❌ **none** | Insert only, but retry-on-error duplicates (F-05) | ✅ `recordCodexChange` (`:276`, `:287`) — but a throw here reports a successful insert as failed |
| `updateCodexDoc` | `actions.ts:305` | ✅ (`:311`) | ✅ | ❌ **none** | ⚠️ Blind update keyed on client-supplied `id`, **no optimistic lock** (`:324`) | ✅ (`:326`, `:342`) — same throw-inverts-result defect |
| `deleteCodexDoc` | `actions.ts:360` | ✅ (`:365`) | ✅ | ❌ **none** | ✅ **Hard delete**, no referential check, no undo UI (`:370`) | ⚠️ Only if the row existed (`:373`); a changelog throw reports failure *after* the row is gone |
| `saveArchetypeWithPath` | `actions.ts:437` | ✅ (`:441`) | ✅ | ❌ **none** | ✅ **`DELETE` all levels then re-insert, non-transactional** (`:478`–`:502`); `upsert` blind-overwrites (`:475`) | ✅ Full before/after snapshot (`:507`) |

**Failing rows / cross-cutting gaps:**

- **Zod: 0 of 4.** No action validates its arguments at runtime. Server actions receive arbitrary serialized input; the `CodexCollection` union, `SaveArchetypeWithPathInput`, and every `Record<string, unknown>` payload are erased at compile time.
- **`collection` is unvalidated and reaches a service-role client.** `getTableName()` (`actions.ts:182-184`) returns the raw string; `getSupabaseAdmin()` (`:186-188`) is `createServiceRoleClient()`, which bypasses RLS entirely (`src/lib/supabase/server.ts:42-46`). See F-03.
- **Optimistic locking: 0 of 4.** `updateCodexDoc` reads `before` (`:315`) purely for the changelog, then issues an unconditional `.update().eq('id', id)`.
- **Confirmation/preview: none server-side.** All confirmation is client-side two-click or a row-count modal.

**API parity cross-check (no duplication of the API auditor's work):** I found **no privilege mismatch**. `POST/PATCH/DELETE /api/images/*` each do `getSession()` then `isAdmin()` before any work (`api/images/route.ts:102-108`, `api/images/[id]/route.ts:45-51`, `:115-121`, `[id]/replace/route.ts:29-35`, `[id]/usage/route.ts:19-25`). `/api/admin/role-policies` and `/api/admin/users/update-role` use `requireAdminSession()` (`role-policies/route.ts:32`, `:55`; `update-role/route.ts:26`). The UI's assumption that these are admin-only is correct.

One structural note for the API auditor: `GET /api/codex` is deliberately public/anon (`api/codex/route.ts:462-466`), and the admin Codex editor reads through it. That is correct for RLS, but it means **the admin spreadsheet and modals edit a hand-written projection, not the table** — which is the root cause of F-01.

---

## 2. P0 — destroys official content

### F-01 (P0) Every feat save through the admin modal NULLs `codex_feats.mart_prof_req`

`mart_prof_req` is a real column (`sql/archive/supabase-codex-tables-columnar.sql:40`; `src/docs/SUPABASE_SCHEMA.md:40`; present in `scripts/seed-data/feats.csv` and `codex_csv/Realms Codex Test - Feats.csv` headers) and has a display label (`src/lib/utils/string.ts:57`).

The chain:

1. `src/app/api/codex/route.ts:118-145` builds the feat projection. It maps `mart_abil_req` (`:134`) and `pow_prof_req` (`:141`) but **never `mart_prof_req`**. `src/types/codex.ts:101` declares it optional, so TypeScript is silent.
2. `admin-feat-form.ts:86` — `mart_prof_req: toOptNum(ext.mart_prof_req)` — reads a key that is never present, so it is always `undefined`.
3. `admin-feat-edit-modal-fields.tsx:441-453` renders an editable "Martial Prof Req" box that therefore **always displays blank**, even for feats that have a value.
4. `admin-feat-form.ts:136` — `mart_prof_req: form.mart_prof_req ?? undefined` — emits the key with value `undefined`.
5. `actions.ts:113` allowlists `martProfReq`, so the key is **not** dropped.
6. `toColumnValue` (`actions.ts:105-110`) maps `undefined → null`.
7. `actions.ts:324` writes `mart_prof_req: null`.

React Flight encodes `undefined` as `$undefined` and preserves the object key across the server-action boundary, so the property arrives intact and the column is set to NULL. Even setting that aside, the deterministic half is bad enough: **the field is unreadable and unauthorable in the editor**, so an admin can neither see nor preserve an existing value, and any interaction with the box wipes it.

Only feats are affected — I traced all nine collections and this is the one place where the write allowlist is a strict superset of the read projection (`codex_species`' extra `aveHgtCm`/`aveWgtKg` entries are never emitted by the form, so they are inert). The spreadsheet is safe for this field precisely *because* the API omits it, so the key never appears in `rowDataWithoutId`.

**Fix:** add `mart_prof_req: toNum(r.mart_prof_req)` to the feat projection in `api/codex/route.ts`. Then close the class: `COLUMNAR_FIELDS` and the `/api/codex` projection are two independently-maintained lists over the same columns, and any future write-without-read divergence reproduces this exactly. Replace both with one per-collection Zod schema that owns the field list in both directions, and add the round-trip test in §8.

### F-02 (P0) Spreadsheet `id` is editable and find/replace can rewrite it across every row

- `codex-spreadsheet-table.tsx:204-219` renders `id` as an ordinary text `<input>` — it is excluded from `NUMERIC_COLUMNS` and `BOOLEAN_COLUMNS`, so it falls through to the generic editable branch. Nothing marks it read-only.
- `use-codex-spreadsheet.ts:56-57` seeds `columns` with `'id'`; `:160` sets `colsToSearch = findLimitToColumn ? [findLimitToColumn] : columns`. **Global replace therefore rewrites ids.**
- `use-codex-spreadsheet.ts:231-242` then keys the write on the *mutated* value: `updateCodexDoc(collection, id, rowDataWithoutId(row))`.

Concretely: an admin uses Replace-all to change a value like `"1"` → `"2"` across all columns. Every row whose new id collides with an existing entity has that entity **overwritten with the wrong content**, while the source row is left untouched — two identical entities, one destroyed. Rows whose new id does not exist fail loudly with `'Document not found'`, which masks the ones that succeeded.

The only gate is `CodexSpreadsheetView.tsx:67-98`, a modal that reports `Save 250 updated row(s)?` — no diff, no preview of which cells changed, no indication that ids are in the change set. Its own body text says "You cannot undo after saving."

**Fix, in order of value:** (a) render `id` read-only in the grid; (b) drop `'id'` from `colsToSearch`; (c) capture `originalId` per row at load and key `updateCodexDoc` on it so an id edit can never retarget a different row; (d) make the Save-all modal show a per-column changed-cell count.

### F-03 (P0) Unvalidated table name reaches a service-role client

All four actions do `supabase.from(getTableName(collection))` where `getTableName` returns the argument verbatim (`actions.ts:182-184`) and `getSupabaseAdmin()` is `createServiceRoleClient()` (`:186-188`, `src/lib/supabase/server.ts:42-46` — RLS bypassed). `CodexCollection` (`actions.ts:10-20`) is a compile-time union only.

Precondition: an authenticated admin session (server actions do enforce same-origin, and `requireAdmin()` runs first). But within that boundary there is no allowlist at all, so `deleteCodexDoc('user_profiles', '<uuid>')` or `updateCodexDoc('role_policies', 'admin', {...})` are reachable — and the same hole is what any XSS or caller bug riding an admin session would reach. `COLUMNAR_COLLECTIONS` (`:22-32`) exists but is only used to pick a code path, never to authorize the table.

**Fix:** one line at the top of each action, after `requireAdmin()`:
```ts
const CODEX_COLLECTIONS = new Set<CodexCollection>([...COLUMNAR_COLLECTIONS, 'core_rules']);
if (!CODEX_COLLECTIONS.has(collection)) throw new Error('Unknown collection');
```

### F-04 (P0) Archetype save deletes all progression levels before re-inserting, non-transactionally

`actions.ts:478-502`:

```ts
const { error: clearLevelsError } = await supabase
  .from('codex_archetype_levels').delete().eq('archetype_id', id);   // :478
...
if (cleanLevels.length > 0) {                                        // :499
  await supabase.from('codex_archetype_levels').insert(cleanLevels);
}
```

Three failure modes, none confirmed and none recoverable from the UI:

1. **Insert fails after delete** → the archetype is left with zero levels 2–20 while `saveAdminArchetype` shows `'Operation failed'` (`admin-archetype-workspace-save.ts:291`). The admin reasonably assumes nothing changed.
2. **Empty levels array wipes everything.** `admin-archetype-workspace-save.ts:222-223` computes `finalLevels = levelsOverride || structuredPathData?.levels || []`. `levelsOverride` is set from the Advanced Path JSON field (`:159-163`), and `[]` is truthy — so pasting `{"levels": []}` deletes the entire progression with no warning.
3. **Silent row loss.** `:126-129` filters out any level payload with `Object.keys(row).length <= 1`, so a level row the admin merely emptied disappears from the table rather than persisting as an empty level.

The `beforeSnapshot` written to `codex_change_logs` (`:507-514`) means the data is *manually* recoverable by an engineer reading JSON out of the changelog table — there is no restore UI (see F-14).

**Fix:** move the whole save into a Postgres function called via `rpc()` so the delete+insert is one transaction; or diff-and-upsert instead of delete-all. Separately, refuse to persist an empty `levels` array when the archetype currently has levels unless the admin explicitly confirms.

---

## 3. P1 — data integrity, silent failure, concurrency

### F-05 (P1) A changelog write failure inverts a successful save — and retrying creates a duplicate

`recordCodexChange` **throws** on insert error (`src/lib/codex-changelog.ts:57-59`). It is called *after* the DB write in all four actions, inside the same `try`, so the outer catch (`actions.ts:300-302`, `:355-357`, `:387-389`, `:519-521`) converts a completed write into `{ success: false, error }`.

Consequences, worst first:

- `createCodexDoc`: the row is inserted, the admin sees an error toast (`AdminFeatsTab.tsx:169`), the modal stays open, they click Save again → `allocateLowestUnusedNumericId` picks a **new** id → **two copies of the same official entity**.
- `deleteCodexDoc`: the row is already gone but the UI reports failure and does not refetch.
- `updateCodexDoc`: cascades into F-15 below.

The correct pattern already exists in this codebase — `api/admin/users/update-role/route.ts:92-101` writes its audit row best-effort and explicitly comments *"never blocks the role change."*

**Fix:** wrap `recordCodexChange` in try/catch + `logApiError`, or write it in the same transaction as the mutation.

### F-06 (P1) `copyRow` shifts row indices while `dirty` is a Set of indices

`use-codex-spreadsheet.ts:37` — `dirty: Set<number>` of **array indices**. `copyRow` (`:145-150`) splices a new row in at `rowIndex + 1`, shifting every subsequent row down one, then adds `rowIndex + 1` to the set without remapping the existing entries.

So: edit row 5, copy row 2, save. Index 5 now points at what used to be row 4 (unmodified) — it gets written; the actual edit at index 6 is never saved. A silent wrong-row write plus a silently dropped edit. `<tr key={rowIndex}>` (`codex-spreadsheet-table.tsx:118`) compounds this by reusing keys across the splice.

**Fix:** key `dirty` (and the React `key`) by a stable per-row uid assigned at load, not by array position.

### F-07 (P1) No optimistic locking anywhere — two admins silently overwrite each other

`updateCodexDoc` (`actions.ts:315-324`) fetches `before` for the changelog then issues an unconditional `.update(dbPayload).eq('id', id)`. `saveArchetypeWithPath` uses `upsert` (`:475`). Every tab holds a form snapshot from page load and posts the whole payload back.

Two admins editing the same feat: the second save wins completely, including fields the second admin never looked at. Nothing detects it, the first admin is never told, and `codex_change_logs` records it as a legitimate edit — so it is not even obvious in the changelog that a conflict occurred.

Non-columnar writes already stamp `updated_at` (`:337`); columnar writes do not.

**Fix:** carry `updated_at` on all codex tables, send the loaded value with the update, add `.eq('updated_at', expected)`, and treat a 0-row result as a conflict the UI surfaces ("This feat changed since you opened it").

### F-08 (P1) Core Rules editor silently discards unsaved edits when you switch tabs

`admin/core-rules/page.tsx:39-55` re-seeds `editData` from `rules` whenever `categoryId` changes and unconditionally calls `setDirty(false)` (`:50`). There is no guard on `onTabChange` (`:131`).

Edit the Combat rules, click Progression, click back — your changes are gone, and the "Unsaved changes" indicator (`:155`) disappears with them. This is core game-rule data that "takes effect for all users after you save" (the page's own description, `:123`).

**Fix:** block the tab change while `dirty` (confirm dialog), or keep per-category drafts in a `Record<CategoryId, unknown>` and only re-seed a category the first time it is opened.

### F-09 (P1) Opening and saving a "General" armament property silently reclassifies it as "Armor"

`normalizePropertyType` (`admin-property-form.ts:41-47`) returns `'Armor'` for anything that is not armor/shield/weapon, and it runs on **load** (`propertyToFormState:54`). The edit modal offers only three options (`admin-property-edit-modal.tsx:110-112`). `propertyFormToSavePayload:75` then writes whatever the form holds.

That General properties exist is confirmed by the codebase itself: `savedPropertyFromPayload:88-92` explicitly accepts `'general'`, `AdminPropertiesTab.tsx:86` sorts with `a.type || 'general'`, and the tab's own type filter derives its options from live data (`:61-66`) so a General value would show up there. `src/lib/calculators/item-calc.ts:144` has `isGeneralProperty()`.

Net effect: open a General property to fix a typo in its description, hit Save, and its type is now Armor — changing which armaments it can be applied to for every player.

**Fix:** include `General` in the select and make `normalizePropertyType` pass through any known value, only defaulting on genuinely unknown input.

### F-10 (P1) "Edit" on an official Enhanced Item creates a duplicate instead of updating

`AdminPublicEnhancedItemsTab.tsx:47-52` sets `editTarget` and opens the modal, but `onSave` (`:89-93`) always calls `useCreateOfficialEnhancedItem`, which unconditionally `POST`s (`src/hooks/use-enhanced-items.ts:86-98`) and the route unconditionally `insert`s (`api/official/enhanced-items/route.ts:135`). A working `PATCH` handler exists at `:172-225` and **nothing in the app calls it**; `UpdateOfficialEnhancedItemInput` is exported from `hooks/index.ts:81` with no corresponding hook.

Worse, the modal never seeds the two required selects from `initial` (`:118-119` both start as `''`), so Edit opens with base item and power blank and the admin must reselect them from memory.

**Fix:** add `useUpdateOfficialEnhancedItem` calling `PATCH ?id=`, branch on `initial`, and seed `selectedItemId`/`selectedPowerId` from `initial.base_item_id` / `initial.power_id`.

### F-11 (P1) Enhanced Item save is a silent no-op with no disabled state (double-submit)

`AdminPublicEnhancedItemsTab.tsx:131` — `if (!power || !item || !name.trim()) return;` — and the Save button at `:252` has no `disabled`, no `isLoading`, no error surfacing. Clicking Save with an incomplete form does nothing at all with no feedback; clicking twice on a complete form fires two inserts. Every other admin modal in the codebase gets this right (`disabled={saving || !form.name.trim()}` — `admin-feat-edit-modal.tsx:185`, `AdminSkillsTab.tsx:416`, `admin-trait-edit-modal.tsx:85`, etc.).

### F-12 (P1) `saveArchetypeWithPath` has no server-side validation of any field

`actions.ts:437-473` writes `payload.name`, `payload.type`, the four proficiency numbers, and 20 CSV string columns straight through. The only `name` check lives on the client (`admin-archetype-workspace-save.ts:73`). `type` is typed `'power' | 'martial' | 'powered-martial'` at compile time only — and `api/codex/route.ts:20-24` **silently coerces anything unrecognized to `'martial'`**, so a bad value doesn't error, it just makes the archetype the wrong category for every player. `entry.level` is only checked for `>= 2` and finiteness (`:482`), with no upper bound and no duplicate-level check.

**Fix:** a Zod schema on the input, with `z.enum` for `type`, `z.string().min(1)` for `name`, `z.number().int().min(2).max(20)` for level, and a uniqueness refinement on the levels array.

### F-13 (P1) No referential-integrity check on any codex delete

`deleteCodexDoc` (`actions.ts:360-390`) removes the row and stops. Nothing checks inbound references, which across this schema are plain id strings in TEXT columns:

- `codex_feats.skill_req` → deleted skill
- `codex_traits.option_trait_ids` → deleted option trait
- `codex_archetypes.level1_feats` / `level1_guidance_groups` and `codex_archetype_levels.*` → deleted feat/power/technique/armament
- `codex_feats.base_feat_id` → deleted base feat, orphaning its level 2+ children (`AdminFeatsTab.tsx:348` relies on this link to decide whether "Add level" is offered)

The archetype editor already contains exactly the resolver needed — `getUnknownSelectionsForLevel`, run on **save** to block dangling references (`admin-archetype-workspace-save.ts:75-88`). It is simply never run on **delete**. The image library shows the pattern done right: `getRealmsImageUsage` before delete, with the referencing entities listed in the confirm dialog (`admin-image-delete-modal.tsx:81-96`).

**Fix:** a pre-delete usage report per entity type, surfaced in a real confirm modal.

### F-14 (P1) Destructive deletes are gated by an untimed two-click toggle, with no undo

Nine tabs use the same pattern: `handleDelete`/`handleInlineDelete` set `deleteConfirm`/`pendingDeleteId` on the first call and delete on the second (`AdminFeatsTab.tsx:204-233`, `AdminSkillsTab.tsx:239-268`, `AdminSpeciesTab.tsx:130-159`, `AdminTraitsTab.tsx:149-178`, `AdminPartsTab.tsx:219-247`, `AdminPropertiesTab.tsx:163-192`, `AdminEquipmentTab.tsx:156-185`, `AdminCreatureFeatsTab.tsx:131-160`, `use-admin-archetype-workspace.ts:174-207`). The armed state has no timeout and no reset on blur, so a stray second click deletes. The modal variant just relabels the button "Click again to confirm delete" without naming the entity.

There is also **no undo**: `codex_change_logs` holds the full `before_data` (`codex-changelog.ts:47-55`) and the changelog page renders it as read-only JSON (`admin/changelogs/page.tsx:216-220`) — restoring requires an engineer with DB access. The page header also states "Each entity keeps the newest 10 entries" (`:117`), so the safety net is bounded.

**Fix:** use `ConfirmActionModal`, which this codebase already uses for the *less* destructive role change (`admin/users/page.tsx:220-260`), and add a "Restore this version" action to the changelog detail modal — the data is already there.

### F-15 (P1) Core Rules save falls through to create on *any* update error

`admin/core-rules/page.tsx:76-82`:

```ts
const result = await updateCodexDoc('core_rules', categoryId, editData);
if (!result.success) {
  const createResult = await createCodexDoc('core_rules', categoryId, editData);
  if (!createResult.success) throw new Error(createResult.error || 'Failed to save');
}
```

`updateCodexDoc` returns `{success:false}` for *every* failure — not found, permission, DB error, and F-05's changelog throw. Combined with F-05: the update lands, the changelog throws, the fallback create returns `Document ${docId} already exists` (`actions.ts:265`), and the admin is told "Failed to save" for a save that succeeded. The intended upsert should key on the specific `'Document not found'` case.

### F-16 (P1) `performSaveAll` leaves the grid inconsistent after a partial failure

`use-codex-spreadsheet.ts:244-255`: if *any* row errors, `dirty` is not cleared for the rows that **did** save and `queryClient.invalidateQueries` is never called. The grid keeps showing pre-save values for rows already written to the DB, still flagged dirty; clicking Save again rewrites them. With F-02 in play, this makes a partially-applied mass edit very hard to reason about.

**Fix:** clear `dirty` per row as each save resolves, and always invalidate at the end regardless of errors.

---

## 4. Concurrency (audit item 4) — summary

| Question | Answer |
|---|---|
| Two admins editing the same entity | **Last-write-wins, silent.** F-07. |
| Optimistic locking / `updated_at` check | **None.** Columnar updates don't even stamp `updated_at`; non-columnar do (`actions.ts:337`) but never compare it. |
| Stale form data overwriting newer values | **Yes.** Every tab posts a full payload built from a load-time snapshot; `admin/users/page.tsx:89-93` and `admin/roles/page.tsx:61-64` additionally copy server data into local state only when `dataUpdatedAt` changes, so a background refetch can silently replace in-progress local edits on the roles page. |
| Id-allocation races | Partially handled: `createCodexDoc:262-268` retries up to 3× on collision. But the client-side `generateNextNumericId` (`codex-spreadsheet-helpers.ts:42-48`) computes `max+1` from **loaded rows only**, so two admins adding rows concurrently both propose the same id and rely on that retry loop. |
| Archetype level replace | **Not atomic.** F-04. |

---

## 5. Image / asset management (audit item 5)

This is the best-engineered part of the admin surface. Recording what is correct so no one "fixes" it:

- **Upload validation:** admin gate, per-user+IP rate limit, `file.type` prefix check, 5 MB cap, and — importantly — **magic-byte validation** plus server-side MIME detection, with the extension derived from the detected MIME rather than the filename (`api/images/route.ts:135-152`, `[id]/replace/route.ts:57-79`).
- **Path construction:** `realms-images.ts:125-128` builds `library/{uuid}.{ext}` with the extension stripped of everything outside `[a-z0-9]`, and the id is a server-generated `randomUUID()` (`route.ts:151`). **No traversal, no collision, no client-controlled path component.**
- **Create is transactional-ish:** storage upload → row insert → categories, with compensating deletes on each failure (`route.ts:179-189`).
- **Usage check before delete:** `getRealmsImageUsage` on modal open (`admin-image-edit-modal.tsx:57-76`) and again on Delete click (`:155-168`), with the referencing entities enumerated in the confirm dialog (`admin-image-delete-modal.tsx:81-96`).
- **Delete doesn't break referencing entities:** `clearRealmsImageRefs` nulls every reference *before* removing storage and the row, and aborts if any ref fails to clear (`api/images/[id]/route.ts:135-143`).
- **Replace updates everywhere:** cache-busted public URL + `syncRealmsImageCacheUrls` (`[id]/replace/route.ts:102-120`).

Remaining gaps:

- **(P2) No dimension or aspect validation** — only byte size. A 12000×12000 valid PNG under 5 MB is accepted and will be served to players.
- **(P2) Orphan storage objects are accepted by design and never reconciled.** `api/images/[id]/route.ts:148-151` continues past a storage-remove failure with the comment *"orphan file is preferable to stuck refs"* — correct call, but there is no sweeper and no way to list orphans.
- **(P3) Object URL leak:** `admin-image-edit-modal.tsx:107-109` revokes `localPreview` only when replacing it, never on unmount/close.
- **(P3) Discarding a cropped-but-unsaved upload is silent** — `onClose` (`:205`) drops `pendingBlob` with no warning.

---

## 6. UX for the team (audit item 6)

| Concern | Status |
|---|---|
| Unsaved-changes protection | **None anywhere in admin.** Grep for `beforeunload`/`useUnsavedChanges` across `src/` returns exactly one file, `hooks/use-auto-save.ts`, unused here. Every `closeModal` discards silently — including the feat modal, which *tracks* per-level dirty state (`admin-feat-edit-modal.tsx:59`, displayed at `:226-230`) and still throws it away on Cancel. Plus F-08. |
| Does a failed save look like a success? | Mostly no — errors surface via `showToast` / `Alert`. But F-05 and F-15 produce the **inverse** (a successful save reported as a failure), which is arguably worse because it drives duplicate creates. |
| Silent no-ops | `handleSave` in 6 tabs opens with `if (!form.name.trim()) return;` — harmless because the button is disabled — except `AdminPublicEnhancedItemsTab.tsx:131`, where the button is **not** disabled (F-11). |
| Double-submit | Guarded by `disabled={saving \|\| ...}` in all codex modals; **not** guarded in the Enhanced Item modal (F-11). |
| Bulk editing ergonomics | Find/replace has whole-cell and limit-to-column options (good), but **no match count and no preview** before applying, and the Save-all confirm reports only a row count. Combined with F-02 this is the single riskiest control in the product. |
| Keyboard / tab order in large modals | Passable, with two defects: (a) ~91 hand-rolled `<label className="block …">` elements in admin are **not associated** with their control — see F-17; (b) `codex-spreadsheet-table.tsx:73-83` makes `<th>` interactive with `tabIndex={0}` + `onClick` + Enter/Space, but without `role="button"`, so screen readers announce a column header, not a control (`aria-sort` is set correctly, which mitigates). |
| Mobile | Handled: `fullScreenOnMobile` on every large modal, 44px touch targets with `md:` overrides, and an explicit "works best on desktop" banner on the spreadsheet (`CodexSpreadsheetView.tsx:44-46`). |
| Maintainability of the big editors | See §7. |

### F-17 (P2) ~91 unlabeled form controls, when the shared `Input` already solves it

`src/components/ui/input.tsx:19-34` accepts a `label` prop and wires `htmlFor`/`id` via `useId()`. The admin editors ignore it and hand-roll `<label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>` as a **sibling** of `<Input>`, which associates nothing. 91 occurrences: `admin-feat-edit-modal-fields.tsx` (17), `admin-species-edit-modal.tsx` (11), `admin-property-edit-modal.tsx` (10), `AdminSkillsTab.tsx` (9), `admin-archetype-editor-meta.tsx` (9), `admin-part-edit-modal.tsx` (7), `admin-trait-edit-modal.tsx` (7), `AdminPublicEnhancedItemsTab.tsx` (6), `AdminEquipmentTab.tsx` (5), `AdminCreatureFeatsTab.tsx` (5), `admin-part-edit-modal-options.tsx` (3), `admin-feat-edit-modal.tsx` (1), `admin-archetype-editor-guided.tsx` (1).

Core Rules is worse: `core-rules-field-editors.tsx:1-9` (`FieldRow`) renders a bare `<label>` in a flex row with the control in a sibling `<div>`, and `NumInput` (`:11-23`) has no `id` and no `aria-label` at all. **293 `FieldRow`/`NumInput` call sites across 12 core-rules editor files** — so essentially every game-rule number input is unlabeled.

**Fix:** pass `label="Name *"` to `<Input>` instead of the sibling `<label>`; give `FieldRow` a `useId()` and thread it to `NumInput`/`TextInput` as `id` + `htmlFor`. Mechanical, ~1 hour, closes an entire `jsx-a11y` category.

---

## 7. Code quality & duplication (audit item 7)

### The four named files

| File | LOC | Size justified? | What to extract |
|---|---|---|---|
| `admin-feat-edit-modal-fields.tsx` | 559 | **No** — one flat JSX return, zero sub-components | The paired-array requirement editors at `:214-288` (ability) and `:289-363` (skill) are **the same widget twice** (~150 LOC) → one `<PairedRequirementEditor options values onChange>` used twice, **~90 LOC saved**. Then split into `FeatIdentityFields` / `FeatRequirementFields` / `FeatNumericFields` (`:394-470`) / `FeatTagsField` (`:471-538`). Target: ~120 LOC shell + 4 files. |
| `admin-archetype-editor-level1.tsx` | 525 | **Mostly** — genuine domain complexity, and the two guidance-group sections at `:216-354` are already correctly data-driven over an array | The weapons/shields block (`:375-405`) and armor block (`:406-436`) are the same 30 lines twice, and the equipment block (`:439-499`) is a third variant → one `<PathItemQuantityPicker>` used 3×, **~70 LOC saved**. |
| `AdminSkillsTab.tsx` | 489 | **No** — and it is the odd one out | It is the only tab that **never got the TASK-609/619 extraction**: five siblings have `admin-*-form.ts` + `admin-*-edit-modal.tsx`, this one still inlines a 90-line modal (`:399-486`) and its form state (`:64-74`). Six near-identical `<div><label/><Textarea/></div>` blocks at `:433-456` collapse to a map. Extracting `admin-skill-form.ts` + `admin-skill-edit-modal.tsx` drops the tab to **~200 LOC**. |
| `actions.ts` | 522 | **Mostly** — it is the entire write layer | The key-mapping layer at `:74-180` (`snakeToCamel`, `columnarSourceKeyToCamel`, `camelToSnake`, `toColumnValue`, `COLUMNAR_FIELDS`, `toColumnarPayload`, `toDbPayload`) is **107 lines of bidirectional string munging** that exists only because callers send inconsistent key casing — `speciesFormToSavePayload` alone mixes `species_traits` and `imageId` in one object (`admin-species-form.ts:125-142`). Replacing it with per-collection Zod schemas that output DB column names directly deletes all 107 lines **and** closes F-01, F-03, and F-12 at once. |

### Duplication clusters

**Cluster A — per-entity CRUD tab scaffolding. ~1,250 LOC → ~180. Net saving ≈ 1,000 LOC (29% of the 3,486 LOC across the 9 tabs + archetype workspace).**

Nine tabs (`AdminFeatsTab` 402, `AdminSkillsTab` 489, `AdminSpeciesTab` 341, `AdminTraitsTab` 315, `AdminPartsTab` 418, `AdminPropertiesTab` 378, `AdminEquipmentTab` 382, `AdminCreatureFeatsTab` 320, `AdminArchetypesTab` 182 + `use-admin-archetype-workspace` 259) each repeat, near-verbatim:

- the same 7 `useState` declarations — `modalOpen`, `editing`, `saving`, `deleteConfirm`, `pendingDeleteId`, `copySourceName`, `form`
- `openAdd` / `openDuplicate` / `openEdit` / `closeModal` (~30 LOC)
- the `handleSave` success/error branch with `invalidateQueries` → `refetchQueries` → `closeModal` (~12 LOC)
- `handleDelete` (~14 LOC) and `handleInlineDelete` (~15 LOC) — **9 byte-identical copies**, confirmed by grep
- the `rightSlot` "Remove? / Yes / No" + Edit/Duplicate/Delete `IconButton` block (~40 LOC) — **9 copies**
- the modal footer with "Click again to confirm delete" + Cancel + Save (~20 LOC) — **10 copies**

≈135–150 LOC per tab. Proposed abstraction:

```ts
// useAdminCodexEntity.ts  (~110 LOC, replaces ~1,000)
function useAdminCodexEntity<TEntity, TForm>(opts: {
  collection: CodexCollection;
  queryKeys: QueryKey[];
  emptyForm: TForm;
  toForm: (e: TEntity) => TForm;
  toPayload: (f: TForm) => Record<string, unknown>;
  copyName: (e: TEntity) => string;
}): { form, setForm, editing, saving, modalOpen, deleteConfirm, pendingDeleteId,
      openAdd, openDuplicate, openEdit, closeModal, save, requestDelete, inlineDelete }
```
plus `<AdminCodexRowActions>` (~40 LOC, replaces 9 × 40) and `<AdminCodexEditModalShell>` (~30 LOC, replaces 10 × 20). This is also the cheapest way to fix F-13 and F-14 **once** instead of nine times.

**Cluster B — form serializer modules. 641 LOC, ~120 removable.**
`admin-feat-form.ts` (146), `admin-species-form.ts` (143), `admin-part-form.ts` (189), `admin-property-form.ts` (110), `admin-trait-form.ts` (53) all follow the same `EMPTY_X_FORM` / `xToFormState` / `xFormToSavePayload` triple. `rawOptNum` is **byte-identical** in `admin-part-form.ts:104-106` and `admin-property-form.ts:37-39`; `toOptNum` in `admin-feat-form.ts:62-66` and `AdminCreatureFeatsTab.tsx:78-82` is the same function again. `COPY_NAME_SUFFIX = ' copy'` is declared **10 times** (`admin-feat-form.ts:8`, `admin-part-form.ts:7`, `admin-property-form.ts:7`, `admin-species-form.ts:7`, `admin-trait-form.ts:7`, `admin-archetype-path-form.ts:26`, `use-codex-spreadsheet.ts:27`, `AdminSkillsTab.tsx:29`, `AdminEquipmentTab.tsx:30`, `AdminCreatureFeatsTab.tsx:17`). A shared `codex-form-utils.ts` (`toOptNum`, `trimOrUndefined`, `csvToArray`/`arrayToCsv`, `COPY_NAME_SUFFIX`) is worth more than its 120 LOC: this exact drift is what produced F-09 and F-20.

**Cluster C — option-slot handling. ~90 LOC removable.**
`op_1`/`op_2`/`op_3` are spelled out longhand in `admin-part-form.ts:112-132` and `:143-163`, in `AdminPartsTab.readOptionsFromForm`/`writeOptionsToForm` (`:68-96`), and the option-chip renderer at `AdminPartsTab.tsx:313-346` is the same 11-line block three times. `admin-property-form.ts` repeats the shape for `op_1` only. Model as `options: {desc, en, tp}[]` with one map/serialize pair.

**Cluster D — inline `Modal` footers.** Ten copies of the same delete/cancel/save footer, already listed in Cluster A.

**Total identified: ~1,210 LOC removable across A–C.**

### Dead code

I grepped every export in the admin surface that looked like a candidate — `isCodexBaseSkill`, `toLeveledFeatLike`, `isFeatOrientedGuidanceGroup`, `labelForAbility`, `armamentTypeOf`, `toastLevel1SkillWarnings`, `isFiniteNumberString`, `TRAIT_PICKER_TITLES`, `normalizeIds`, `savedPartFromPayload`, `optionSlotCountFromPropertyForm`, `baseEnToPercent`/`percentToBaseEn`/`optionEnToPercent`/`percentToOptionEn`, `guidedAbilitiesFromPath`, `guidedEquipmentMetaFromPath`, `makeLevelRow`, `newFeatGuidanceGroup`, `guidanceGroupsFromPathData`. **All are used.** No unused exports found — don't spend time here.

One near-miss worth noting: `isCodexBaseSkill` exists twice with different semantics — `admin-archetype-path-form.ts:119` (`base_skill_id == null`) and `src/lib/character/sheet-skills-display.ts:37`. The admin copy is deliberately stricter (`base_skill_id === 0` is an any-base sub-skill, not a base skill) and is documented as such at `:116-118`. Intentional, but a name collision worth renaming.

---

## 8. Tests (audit item 8)

**There are zero test files under `src/app/(main)/admin/`.** Verified by full enumeration of `*.test.ts(x)` / `*.spec.ts(x)` across `src/`. Nothing tests `actions.ts`, the spreadsheet, or any admin component.

Adjacent coverage that exists:

| File | Covers |
|---|---|
| `src/app/api/admin/users/route.test.ts` | `GET /api/admin/users` only — 401 / 403 / 200 / 429. **No test for `PATCH update-role`**, including its last-admin guard. |
| `src/lib/codex/{feat,skill,equipment}-list.test.ts`, `feat-restriction-notice.test.ts` | Pure filter/format helpers the tabs render with. |
| `src/lib/realms-images.test.ts` | Category parsing / path helpers. |
| `src/lib/game/path-validation.test.ts`, `archetype-edit.test.ts`, `level1-loadouts-field.test.ts` | Used by the archetype save path, but not the save path itself. |
| `src/lib/codex-payload.test.ts` | Codex payload shape. |

### Highest-value missing tests, in priority order

1. **Role enforcement on every server action** (`actions.ts`). For each of the four exports: `getSession` → no user, and `isAdmin` → false. Assert the action rejects **and that no Supabase client was constructed**. Nothing currently prevents someone from moving a `supabase.from(...)` call above `requireAdmin()`.
2. **Collection allowlist** (F-03). `deleteCodexDoc('user_profiles' as never, 'x')` must reject. Fails today — that is the point.
3. **Spreadsheet safety** (`use-codex-spreadsheet.ts`) — three cases: `doFindReplace` never mutates the `id` column (F-02); `copyRow` preserves which *rows* are dirty after the splice (F-06); `performSaveAll` clears dirty only for rows that succeeded and always invalidates (F-16).
4. **Archetype level replace is atomic** (F-04) — an insert failure after the delete must leave the existing levels intact, and `levels: []` must not wipe a populated progression. This test is what forces the transaction fix.
5. **Changelog failure must not invert the result** (F-05) — mock `recordCodexChange` to throw and assert `createCodexDoc` still returns `{ success: true, id }`.
6. **Column round-trip, table-driven per collection** (F-01) — feed the real `/api/codex` projection keys for each collection through `toColumnarPayload` → `toDbPayload` and assert the output column set equals the expected DB column set, with **no field silently dropped and no field silently NULLed**. This one test catches `mart_prof_req`, would have caught `base_skill_id → base_skill` and `ave_height → ave_hgt_cm`, and catches the next column rename.
7. **`normalizePropertyType('General') === 'General'`** (F-09) — a 3-line test for a live data-corruption bug.
8. **`PATCH /api/admin/users/update-role`** — non-admin → 403; demoting the last admin → 409; a failing audit insert must **not** block the role change (the correct behaviour the codex actions should copy).

---

## 9. Full findings index

| ID | Sev | Location | Summary |
|---|---|---|---|
| F-01 | **P0** | `api/codex/route.ts:118-145` + `admin-feat-form.ts:86,136` + `actions.ts:113,105-110` | Every feat save NULLs `mart_prof_req`; the field is invisible in the editor |
| F-02 | **P0** | `codex-spreadsheet-table.tsx:204-219`; `use-codex-spreadsheet.ts:57,160,238-242` | Editable `id` + global find/replace + id-keyed write = mass overwrite of official entities |
| F-03 | **P0** | `actions.ts:182-188` (used `:251,274,313,324,367,370`) | Unvalidated table name reaches a service-role (RLS-bypassing) client |
| F-04 | **P0** | `actions.ts:478-502`; `admin-archetype-workspace-save.ts:159-163,222-223` | Non-transactional delete-all-then-insert of archetype levels; empty array wipes progression |
| F-05 | P1 | `codex-changelog.ts:57-59`; `actions.ts:300,355,387,519` | Changelog throw inverts a successful write → duplicate creates on retry |
| F-06 | P1 | `use-codex-spreadsheet.ts:37,145-150` | `copyRow` shifts indices; index-keyed `dirty` set saves the wrong rows |
| F-07 | P1 | `actions.ts:315-324,475` | No optimistic locking; silent last-write-wins between admins |
| F-08 | P1 | `admin/core-rules/page.tsx:39-55,131` | Switching Core Rules tabs silently discards unsaved edits |
| F-09 | P1 | `admin-property-form.ts:41-47,54`; `admin-property-edit-modal.tsx:110-112` | Saving a "General" property silently reclassifies it as "Armor" |
| F-10 | P1 | `AdminPublicEnhancedItemsTab.tsx:47-52,89-93,118-119`; `use-enhanced-items.ts:86-98` | Edit on an official Enhanced Item creates a duplicate; unused `PATCH` handler exists |
| F-11 | P1 | `AdminPublicEnhancedItemsTab.tsx:131,252` | Silent no-op save with no disabled state → double-submit |
| F-12 | P1 | `actions.ts:437-473,482` | Zero runtime validation on archetype payload; bad `type` silently becomes `'martial'` for players |
| F-13 | P1 | `actions.ts:360-390` | No referential-integrity check on delete; resolver already exists but only runs on save |
| F-14 | P1 | 9 tabs (`AdminFeatsTab.tsx:204-233` et al.); `admin/changelogs/page.tsx:216-220` | Untimed two-click delete confirm; no restore path despite full before-snapshots |
| F-15 | P1 | `admin/core-rules/page.tsx:76-82` | Update falls through to create on *any* error, masking succeeded saves |
| F-16 | P1 | `use-codex-spreadsheet.ts:244-255` | Partial save-all failure leaves stale grid + re-writable dirty rows |
| F-17 | P2 | 13 admin files (91 labels); `core-rules-field-editors.tsx:1-23` (293 call sites) | Unassociated labels / unlabeled inputs; `Input` already supports `label` |
| F-18 | P2 | Cluster A | ~1,000 LOC of duplicated CRUD scaffolding across 9 tabs |
| F-19 | P2 | Clusters B + C | ~210 LOC of duplicated serializers and option-slot handling; 10 copies of `COPY_NAME_SUFFIX` |
| F-20 | P2 | `admin-species-form.ts:117` | `adulthood_lifespan` silently drops **both** values when only one is filled |
| F-21 | P2 | `admin-feat-edit-modal-fields.tsx:90,127,516`; `admin-species-form.ts:128`; `AdminEquipmentTab.tsx:343` | Free-text vocabularies (categories, tags, species type) with no normalization → phantom filter values |
| F-22 | P2 | `admin-feat-edit-modal-fields.tsx:245-251` | Sparse-array writes when DB `ability_req`/`abil_req_val` lengths already differ → `", 5"` |
| F-23 | P2 | 11 sites (`admin-feat-edit-modal-fields.tsx` ×8, `AdminCreatureFeatsTab.tsx` ×3) | `parseInt(v,10) ?? undefined` — `??` can never fire on `NaN` |
| F-24 | P2 | `admin-species-form.ts:118-119` | `parseInt` truncates decimal height/weight silently |
| F-25 | P2 | `codex-spreadsheet-table.tsx:73-83` | Interactive `<th>` without `role="button"` |
| F-26 | P2 | `api/images/route.ts:135-152` | No image dimension/aspect validation (size only) |
| F-27 | P2 | `api/images/[id]/route.ts:148-151` | Orphan storage objects accepted by design, never reconciled |
| F-28 | P2 | `actions.ts:297-298,352-353,384-385,516-517` | `revalidatePath` is inert — all codex reads go through TanStack Query → `/api/codex` (`private, max-age=0`) |
| F-29 | P2 | `use-codex-spreadsheet.ts:228-243` | One server-action round-trip per dirty row; each create does a full-table `select('id')` (`actions.ts:53-72`) |
| F-30 | P3 | `admin-image-edit-modal.tsx:107-109,205` | `localPreview` object URL never revoked on unmount; unsaved crop discarded silently |
| F-31 | P3 | `codex-spreadsheet-table.tsx:118` | `<tr key={rowIndex}>` with splice-based row insert |
| F-32 | P3 | `admin-archetype-path-form.ts:119` vs `lib/character/sheet-skills-display.ts:37` | Two `isCodexBaseSkill` with intentionally different semantics; rename one |

---

## 10. Suggested sequencing

1. **F-01** — one-line projection fix, stops ongoing data loss today.
2. **F-03** — one-line allowlist per action.
3. **F-02** — make `id` read-only + exclude from find/replace (small); then `originalId` keying.
4. **F-05** — make the changelog write best-effort, copying `update-role/route.ts:92-101`.
5. **F-04** — move the archetype save into a transactional RPC.
6. **F-09, F-10, F-11, F-08, F-16** — small, independent, each a live bug.
7. **Tests 1, 2, 6** from §8 — lock the above down before refactoring.
8. **F-18/F-19** — the generic entity hook, which is also the cheapest way to land F-13 and F-14 once instead of nine times.
9. **F-12 + `actions.ts` §7** — per-collection Zod schemas replacing the 107-line key-mapping layer.
