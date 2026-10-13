## DEV-V-001 — Advanced character creator step guards

**Superseded 2026-09-02 (TASK-912).** The 9-step Legacy wizard at `/characters/new/advanced` was deleted. That URL **308s** to `/characters/new`. Do **not** run T001–T021 against a live tabbed wizard. Currency/save CI is Guided: `src/lib/guided-creator/equipment-currency.test.ts` + `character-save.test.ts` (`clampSavedCurrency`). Replacement QA: **DEV-V-013-T075** / **T094**.

**Related tasks:** TASK-356, TASK-717, TASK-804, **TASK-856**, **TASK-912**  
**Chooser:** `/characters/new` is Guided / Custom only (DEV-V-013-T001 / T075). Retired `/characters/new/advanced` redirects to the chooser.  
**Start URL (historical):** `/characters/new/advanced` (now a redirect)  

Historical T001–T021 assumed **Characters** → **Add Character** → **Legacy**. **All SKIP.** Use DEV-V-013-T075 / T094.

#### DEV-V-001-T001 — Choose a Path can be selected

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T002 — Forge Your Own can be selected

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T003 — Choose a Path is deselected when Forge Your Own is selected

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T004 — Forge Your Own is deselected when Choose a Path is selected

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T005 — Forge flow: confirm archetype advances to Species

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T006 — Choose a different archetype returns to selection

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T007 — Skills tab disabled before Ancestry is complete

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T008 — Skills tab unlocks after Species and Ancestry are complete

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T009 — Continue disabled while ability points remain unspent

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T010 — Continue enabled when all ability points are spent

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T011 — Continue disabled without required feats

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T012 — Continue enabled after required feats are added

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T013 — Changing archetype clears later-step selections

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T014 — Equipment step shows 200c starting budget

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T015 — Saved character currency matches purchases

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T016 — Advanced equipment / powers / finalize use LoadoutBudgetBar PointStatus

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T017 — Legacy label on the tabbed creator (TASK-748)

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T018 — Overspent Advanced kit saves at 0 Currency (TASK-739)

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T019 — Continue without signing in opens a local sheet (TASK-904)

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T020 — Legacy step rail shows a C1 overflow affordance (TASK-848)

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

#### DEV-V-001-T021 — Legacy feat and equipment Search + Filters share one row (TASK-856)

**Report** — [x] SKIP — Notes: TASK-912 deleted Legacy creator.

---

---

# Build Validation archive

Suites moved out of [`BUILD_VALIDATION.md`](../BUILD_VALIDATION.md) (TASK-718). **Do not delete** — this is still the step-by-step record.

**Stay in the hot file:** any suite cited by Pending owner QA in [`DEVELOPER_TASK_QUEUE.md`](../DEVELOPER_TASK_QUEUE.md). After the owner verifies (or waives) a row, that suite may move here.

Hot-file stubs keep the original `## DEV-V-###` headings so `#dev-v-…` bookmarks still resolve.

| Suite | Why archived |
| ----- | ------------ |
| [DEV-V-005](#dev-v-005--rls-policy-consolidation-task-352-task-327) | Shipped 2026-06; not in Pending owner QA (later RLS smoke is DEV-V-041 / DEV-V-042). |
| [DEV-V-010](#dev-v-010--feattrait-custom-name--note-task-377) | Shipped TASK-377; not in Pending owner QA. |
| [DEV-V-011](#dev-v-011--ui-verification-safety-net-task-383) | CI / Playwright (`verify:contrast`, lint, visual/a11y); not owner-run Pending QA. |
| [DEV-V-014](#dev-v-014--codex-payload--roll-timestamp-task-378) | Fully automated (`npm test`); not in Pending owner QA. |
| [DEV-V-015](#dev-v-015--library-api-typing-task-420) | Automated typing plus leftover smoke; not in Pending owner QA. |
| [DEV-V-022](#dev-v-022--characters-list-page-task-469) | Shipped TASK-469; not in Pending owner QA. |
| [DEV-V-031](#dev-v-031--api-route-smoke-task-613) | Automated (`npm run test:api`); not in Pending owner QA. |

---

## DEV-V-005 — RLS policy consolidation (TASK-352, TASK-327)

Manual QA after `sql/supabase-rls-consolidate-permissive-2026-06.sql`. **Needs:** two accounts (campaign owner + member), one campaign-visible character.

#### DEV-V-005-T001 — Campaign join and member read

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 — RLS / DB migrations |
| **Task** | TASK-352 |
| **Where** | `/campaigns` · invite link or code |
| **Steps** | 1. As member, join campaign via invite. 2. Confirm campaign appears in list. 3. Open campaign detail; confirm rolls and roster load. |
| **Expected** | Join succeeds; member can read campaign row via consolidated SELECT backed by `campaign_members` (single source of truth). |
| **Report** | DEV-V-005-T001: PASS / FAIL / SKIP — |

#### DEV-V-005-T002 — Campaign-shared character cross-read

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 |
| **Task** | TASK-352 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` or sheet link from campaign roster |
| **Steps** | 1. Add character to campaign with visibility **campaign**. 2. As another campaign member, open that character sheet. |
| **Expected** | Sheet loads (not 404); consolidated `characters_select_authenticated` allows read when on roster. |
| **Report** | DEV-V-005-T002: PASS / FAIL / SKIP — |

#### DEV-V-005-T003 — Admin role policies still editable

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-005 |
| **Task** | TASK-352 |
| **Where** | `/admin/roles` · **Needs:** admin account |
| **Steps** | 1. Open admin roles page. 2. Change a quota for a non-admin role. 3. Save and reload page. |
| **Expected** | Read works for all authenticated; admin INSERT/UPDATE/DELETE policies allow save without RLS error. |
| **Report** | DEV-V-005-T003: PASS / FAIL / SKIP — |

---
---

## DEV-V-010 — Feat/trait custom name + note (TASK-377)

Player rename + note on character sheet feats/traits. **Needs:** logged-in account with one character that has at least one feat and one species/ancestry trait. For T004 also a campaign with that character shared (visibility **campaign**) and a second member account.

#### DEV-V-010-T001 — Rename a feat (italic, codex name preserved)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 — Feat/trait custom name + note |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats |
| **Steps** | 1. Enter edit mode. 2. Expand a feat; click **Customize**. 3. Type a **Custom name** with spaces (e.g. `My Honed Strike`). 4. Save/reload. |
| **Expected** | Feat row title shows the custom name in *italics*; codex name still visible via hover/title; spaces are preserved in the input while typing. |
| **Report** | DEV-V-010-T001: PASS / FAIL / SKIP — |

#### DEV-V-010-T002 — Add a feat note (expanded-only, persists)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats |
| **Steps** | 1. Expand a feat; click **Customize**. 2. Enter a **Player note** (multi-word). 3. Save/reload; collapse and re-expand the row. |
| **Expected** | Note shows only in the expanded row; the Customize block is collapsed by default; note text persists after reload. |
| **Report** | DEV-V-010-T002: PASS / FAIL / SKIP — |

#### DEV-V-010-T003 — Trait customization + feat level-swap preserves data

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/characters/[id]` → Edit → Library → Feats/Traits |
| **Steps** | 1. Rename a species/ancestry trait and add a note via **Customize**; save/reload. 2. On a multi-level feat with a custom name + note, change its level with the stepper; save/reload. |
| **Expected** | Trait custom name (italic) + note persist via `traitCustomizations`; after the feat level-swap the custom name and note remain attached to the feat. |
| **Report** | DEV-V-010-T003: PASS / FAIL / SKIP — |

#### DEV-V-010-T004 — Read-only campaign view shows customizations

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-010 |
| **Task** | TASK-377 |
| **Where** | `/campaigns/[id]/view/[userId]/[characterId]` |
| **Steps** | 1. Share the customized character to a campaign. 2. As another campaign member, open the character view. 3. Expand customized feats/traits. |
| **Expected** | Custom names show in italics and notes appear in expanded rows; no edit controls (read-only); button reads **View customization**. |
| **Report** | DEV-V-010-T004: PASS / FAIL / SKIP — |

---
---

## DEV-V-011 — UI verification safety net (TASK-383)

These verify the automated design-system net itself. They are **command-line** checks (no app clicking) — run from the repo root. A production build must exist (`npm run build`) or a dev/prod server must be running for the Playwright checks.

#### DEV-V-011-T001 — Token contrast gate

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | Node installed |

**Steps**
1. Run `npm run verify:contrast`.

**Expected**
- Exits 0 with `Contrast check passed.` and "0 ... no new regressions".
- Editing a semantic token in `src/app/globals.css` to a low-contrast value and re-running makes it exit non-zero listing the failing pair.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T002 — Raw-color ESLint guardrail

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | — |

**Steps**
1. Run `npm run lint` (expect 0 errors).
2. Temporarily add `className="bg-blue-500"` to a non-exempt component (not under `(auth)/` or `components/ui/`) and re-run `npm run lint`.

**Expected**
- Step 1: 0 errors and 0 warnings (`npm run lint` uses `--max-warnings 0` — TASK-656).
- Step 2: a `realms/no-raw-color` **error** on that line. Revert the edit.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T003 — Styleguide gallery renders in both themes

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | `/dev/styleguide` |
| **Needs** | Dev/prod server running |

**Steps**
1. Open `/dev/styleguide`.
2. Click **Toggle theme** to switch light/dark.

**Expected**
- Every section renders (surfaces, text, borders, ramps, status, category, game tokens, buttons, forms, chips, alerts, cards, tabs, loading/empty, tooltip, modal).
- Both themes look intentional; no raw-white panels floating on the dark background.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T004 — Visual + a11y Playwright suite

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-383 |
| **Where** | Terminal, repo root |
| **Needs** | `npm run build` done (Playwright auto-starts `npm run start`); matching-OS baselines committed |

**Steps**
1. Run `npx playwright test` (or `npm run verify:visual` and `npm run verify:a11y`).

**Expected**
- All tests pass against committed baselines for the current OS.
- After an intentional UI change, the run fails with a diff; `npm run verify:visual:update` re-baselines and a re-run passes.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T005 — Authenticated visual baselines (TASK-385)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-385 |
| **Where** | Terminal, repo root |
| **Needs** | `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD`; run `npm run e2e:provision` once per environment |

**Steps**
1. Set E2E env vars (see `.env.example`).
2. Run `npm run verify:auth-visual`.

**Expected**
- 11 tests pass (1 setup + 10 screenshots: my-account, characters, campaigns, character-sheet, campaign-detail × light/dark).
- Without secrets, suite skips gracefully.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-011-T006 — Authenticated a11y ratchet (TASK-385)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-011 — UI verification safety net |
| **Related task** | TASK-385 |
| **Where** | Terminal, repo root |
| **Needs** | Same E2E credentials as T005 |

**Steps**
1. Run `npm run verify:auth-a11y`.

**Expected**
- No **new** violations vs `tests/visual/auth-a11y-baseline.json`.
- Pre-existing allowances on character sheet / my-account are documented in the baseline file.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---
---

## DEV-V-014 — Codex payload + roll timestamp (TASK-378)

Automated via `npm test` (`src/lib/codex-payload.test.ts`, `src/lib/roll-timestamp.test.ts`).

#### DEV-V-014-T001 — CodexPayload keys match GET /api/codex

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-014 |
| **Automated** | `npm test` — codex-payload.test.ts |

**Expected** — `CODEX_PAYLOAD_KEYS` matches every key on `CodexPayload`; all `useCodex*` selectors compile against typed slices.

#### DEV-V-014-T002 — Roll timestamp legacy + ISO compat

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-014 |
| **Automated** | `npm test` — roll-timestamp.test.ts |

**Expected** — `normalizeRollTimestamp` / `formatRollTimestamp` handle ISO strings, `{ seconds }` legacy objects, and Date instances; invalid strings format as `-`.

---
---

## DEV-V-015 — Library API typing (TASK-420)

Automated via `npm test` (`src/lib/library-types.test.ts`).

#### DEV-V-015-T001 — Library item types cover all collection keys

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-015 |
| **Automated** | `npm test` — library-types.test.ts |

**Expected** — `LIBRARY_ITEM_TYPES` lists all six library kinds; `LibraryItemByType` maps each kind to a typed interface with required id/docId/name fields.

#### DEV-V-015-T002 — Official library smoke (manual)

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-015 |
| **Manual** | Library → Realms Library tabs |

**Expected** — Powers/Techniques/Armaments load with grid rows; Creatures tab shows expandable `CreatureStatBlock` rows (parity with My Library); "Add to library" confirm succeeds for a logged-in user.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---
---

## DEV-V-022 — Characters list page (TASK-469)

Portrait cards match square crop; no search or ListHeader chrome; Add Character matches card geometry.

#### DEV-V-022-T001 — Portrait cards are square and not over-dense

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character that has a portrait |

**Steps**
1. Go to **Characters**.
2. Confirm each character card portrait area is **square** (1:1), matching how portraits are cropped on upload (not a tall 3:4 crop that cuts the sides).
3. On a wide desktop viewport, confirm the grid uses at most **3** columns (not 4 packed cards).

**Expected**
- Portrait display matches crop aspect; faces/art are not horizontally shortened by a tall frame + dense columns.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-022-T002 — No search or ListHeader on characters list

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Go to **Characters** with characters present.
2. Confirm there is **no** search field and **no** NAME / LEVEL / UPDATED list header bar.
3. Confirm character cards still open the sheet; Add Character, duplicate, and delete still work.

**Expected**
- Page is title + card grid only (plus empty state when none); list-row search/sort chrome is gone.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

#### DEV-V-022-T003 — Add Character card matches portrait + footer geometry

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-022 |
| **Related task** | TASK-469 |
| **Where** | `/characters` |
| **Needs** | Signed-in user with at least one character |

**Steps**
1. Go to **Characters** with characters present.
2. Compare **Add Character** to a character card in the same row.
3. Confirm Add Character has a square top slot (icon area) plus a footer band under it, and matches the row height of neighboring character cards (not a short square-only tile).

**Expected**
- Add Character shares the same portrait-slot + info-footer structure so the grid reads as one composition.

**Report** — `[ ] PASS` · `[ ] FAIL` · `[ ] SKIP` — Notes:

---
---

## DEV-V-031 — API route smoke (TASK-613)

Co-located vitest contract smoke for high-traffic API routes. First slice: `/api/characters` GET/POST auth, validation, happy path, and quota errors.

#### DEV-V-031-T001 — Characters API route smoke

| Field | Value |
|-------|-------|
| **Suite** | DEV-V-031 — API route smoke |
| **Related task** | TASK-613 |
| **Automated** | `npm run test:api` — `src/app/api/characters/route.test.ts` |

**Expected** — 8 vitest cases pass: GET 401/200/500; POST 401/415/400/200/403.

---
