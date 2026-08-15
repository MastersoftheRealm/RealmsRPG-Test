# Developer Task Queue

What **you** need to do that AI cannot (Dashboard, prod validation, decisions). For implementation work see `[ACTIVE_TASKS.md](ACTIVE_TASKS.md)` (process: `[AI_TASK_QUEUE.md](AI_TASK_QUEUE.md)`).

**QA / owner:** Run **Build validation** suites in `[BUILD_VALIDATION.md](BUILD_VALIDATION.md)` — one test per row, report PASS/FAIL/SKIP.

**Agents:** When you finish a user-facing task (`done` or `partial`), add granular tests to `BUILD_VALIDATION.md` and index the suite below. See `[ARCHITECTURE_CONSTITUTION.md](ARCHITECTURE_CONSTITUTION.md)`.

**Last updated:** 2026-08-14

---

## API route auth/IDOR test coverage gap (TASK-658 / TASK-713)

Vitest auth/IDOR suites now cover **characters** (`route.test.ts`, `[id]/route.test.ts` incl. PATCH/DELETE), **campaigns** (`route.test.ts`, `[id]/route.test.ts`), **admin/users** (`route.test.ts`), **user library** (`[type]/route.test.ts`, `[type]/[id]/route.test.ts`), **enhanced items** (`route.test.ts`, `[id]/route.test.ts`), **encounters** (`route.test.ts`, `[id]/route.test.ts`), and **crafting** (`route.test.ts`, `[id]/route.test.ts`). TASK-713 added the user-owned resource slice. Intentionally deferred (follow-up vitest or DEV-V-002/003/004):

| Area | Routes without auth/IDOR vitest |
| ---- | ------------------------------- |
| Admin | `/api/admin/check`, `/api/admin/changelogs`, `/api/admin/role-policies`, `/api/admin/users/update-role` |
| Campaigns | `/api/campaigns/invite/[code]`, `/api/campaigns/[id]/rolls`, `/api/campaigns/[id]/characters/[userId]/[characterId]` |
| Images / uploads | `/api/images`, `/api/images/[id]`, `/api/images/[id]/replace`, `/api/images/[id]/usage`, `/api/upload/portrait`, `/api/upload/profile-picture` |
| Official / codex | `/api/codex`, `/api/official/[type]`, `/api/official/enhanced-items` |

---

## Automated vs human BUILD_VALIDATION coverage (TASK-480)

`BUILD_VALIDATION.md` stays the **owner smoke catalog**. CI covers extractable logic + visual/a11y nets; it does not replace full suite sign-off.

| Layer | What runs in CI / `npm test` | Keep human-only |
| ----- | ---------------------------- | --------------- |
| **Vitest** | Pure helpers for high-churn guided/library/sheet (loadout, eligibility, selectable builders, inventory merge, codex payload, etc.) | Live save/reload, multi-account, auth SMTP |
| **Playwright** | `verify:visual` / `verify:a11y` / `verify:shell-creators-audit` (CI) + optional creator/loadout/chip audits | Pixel polish judgment, tooltip feel, touch ergonomics beyond baselines |
| **Owner DEV-V** | Full step suites after user-facing ships (`pending-qa`) | Admin authoring, RLS/campaign multi-identity, Dashboard secrets (DEV-001+) |

**Top 10 automation candidates (2026-07-20 audit)** — rows 1–9 are CI; row 10 human UI smoke:

| # | Test | Status |
| - | ---- | ------ |
| 1 | DEV-V-016-T001 — Power load columns/facts | **CI** — `library-selectable-builders.test.ts` |
| 2 | DEV-V-016-T003 — Mixed armament load columns | **CI** — same (`buildSelectableItem` type + Damage/Armor/Block; headers name/type/stat) |
| 3 | DEV-V-016-T006 / DEV-V-009-T022 — Builder → map → inventory stack | **CI** — builders + `map-selection.test.ts` + `merge-equipment-inventory.test.ts` |
| 4 | DEV-V-013-T052 — Equipment L2 quantity-first | **CI** — `guided-equipment-l2.test.ts` (qty / budget / clear) |
| 5 | DEV-V-001-T013 / DEV-V-013-T032 — Path change reset vs retain | **CI** — `path-selection-draft.test.ts` (TASK-588; T032 path same/new; T013 Advanced manual) |
| 6 | DEV-V-013-T057 — Innate threshold / TP parity | **CI** — `powers-techniques-l2.test.ts` (TASK-590; threshold filter + shared TP; soft warn / L1 chips manual) |
| 7 | DEV-V-013-T059 — Continue advances one screen | **CI** — `guided-substep-nav.test.ts` (TASK-592; one-step next + intent predicate; UI landing still human) |
| 8 | DEV-V-013-T061 — Ancestry task order | **CI** — `ancestry-pick-tasks.test.ts` (TASK-591; characteristic → ancestry → flaw; flaw → trait-2) |
| 9 | DEV-V-016-T002 — Technique load columns | **CI** — `library-selectable-builders.test.ts` (TASK-589; Action/Energy/Attack/Training Pts) |
| 10 | DEV-V-009-T006 — Add library modal type parity | Human UI smoke (partial CI via builders); no TASK |
| 11 | DEV-V-039-T001 — Feat Tags section label + order | **CI** — `feat-list.test.ts` (section order + Tags label); Codex expand manual in DEV-V-039-T001 |

**Already automated (pre-TASK-480):** DEV-V-014 (`codex-payload` + roll timestamp); large guided unit suite under `src/lib/guided-creator/*.test.ts`; Playwright visual/a11y + guided audits.

---

## Human developer tasks (not for AI agents)


| ID          | Task                                                  | Assignee            | What to do                                                                                                                                                                                                                                     |
| ----------- | ----------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEV-376** | [TASK-376](archive/TASK_QUEUE_DONE.md) — DB cleanup              | **Done** 2026-06-30 | Dropped `ui_tooltips` + `user_profiles.show_tooltips` via Supabase MCP (`drop_legacy_ui_tooltips`). Repo SQL: `sql/drop-legacy-ui-tooltips-2026-06.sql`. App code no longer references `show_tooltips`.                                        |
| **DEV-004** | [TASK-396](archive/TASK_QUEUE_DONE.md) — Guided creator seed SQL | **Done** 2026-06-30 | Applied via Supabase MCP migration `guided_creator_schema_seed` on project `lbqhiwudvifmkjtkccdg`. Verified: Berserker id=1 has recommended abilities + 2 loadouts; 8 starter species flagged. Repo SQL: `sql/guided-creator-schema-seed.sql`. |


---



## Required actions (Dashboard / one-off)


| ID          | Task                                                  | What to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Why AI can't                                                                   |             |                   |                                                                                                                                                                                                                   |                            |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **DEV-001** | [TASK-353](WAITING_TASKS.md) — HIBP                    | Supabase Dashboard → **Authentication** → Password → enable **Leaked password protection**. Project: `RealmsRPG-Test` (`lbqhiwudvifmkjtkccdg`). [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)                                                                                                                                                                                                                                                                                                    | Dashboard-only                                                                 |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-002** | [TASK-383](archive/TASK_QUEUE_DONE.md) — UI Verify CI bootstrap  | **Done 2026-08-14:** Actions secrets `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` set. Linux styleguide baselines refreshed from CI actuals (TASK-744; 4px height drift). Required checks already on via branch protection (`Lint, contrast & static gates` / `Visual regression & accessibility`). | Repo settings + OS-specific baselines | | | | |
| **DEV-003** | [TASK-385](archive/TASK_QUEUE_DONE.md) — CI test user (optional) | **2026-08-13:** repo variable `E2E_OPTIONAL=1` is set so missing auth e2e fails closed as an acknowledged skip (not a false green). To actually run authenticated visual/a11y: (1) `npm run e2e:provision` with `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD`. (2) Add those as Actions secrets. (3) Commit Linux auth baselines. | Account creation + secret storage + OS-specific baselines |
| **DEV-004** | [TASK-396](archive/TASK_QUEUE_DONE.md) — Guided creator seed     | **Done** 2026-06-30 via Supabase MCP (`guided_creator_schema_seed`). Re-apply only if resetting a fresh DB.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-005** | Agent OS CI gates                                     | **Partial 2026-08-13:** `master` requires status checks `Lint, contrast & static gates`, `Visual regression & accessibility`, and `verify`. `enforce_admins` is off (you can still push). **Not** set: require a PR before merge. Optional follow-up if you want PR-only master. | Branch protection settings                                                     |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-006** | [TASK-615](archive/TASK_QUEUE_DONE.md) — Web Analytics | After merge/deploy: Vercel project → **Analytics** → **Enable** Web Analytics. Confirm production Network shows a same-origin `…/view` (or `/_vercel/insights/view`) after navigating. No env vars. Docs: `DEPLOYMENT_AND_SECRETS_SUPABASE.md` Step 3b.                                                                                                                                                                                                                                                                                                              | Dashboard Enable + live verify                                                 |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-007** | [TASK-649](archive/TASK_QUEUE_DONE.md) — Supabase least-privilege Phase 2 | **Done** 2026-08-03 — applied + `node scripts/verify-task-649.mjs` passed. Owner QA: **DEV-V-041 T001–T003** (Pending owner QA table). | Live DB apply + smoke QA | | | | |
| **DEV-008** | [TASK-642](archive/TASK_QUEUE_DONE.md) — signup email | Sign up a new account; confirm `user_profiles.email` matches the auth session email (client cannot spoof a different address). | Manual auth flow | | | | |
| **DEV-009** | Wave 1 commit + reconcile | **Done** 2026-08-01 — /cleanup landed all uncommitted Wave 1 work in 7 lane commits (`TASK-###` in each subject); `npm run tasks:validate` passes strict reconcile for TASK-643/644/647/651/653/654/665. | Git + CI gate | | | | |
| **DEV-010** | [TASK-655](archive/TASK_QUEUE_DONE.md) + [TASK-656](archive/TASK_QUEUE_DONE.md) — typecheck + zero-warning lint | **Done** 2026-08-01 — committed TASK-655/TASK-656; local `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` pass. Confirm CI `AI Task Verifier` + `UI Verify / static-gates` on push. | Git + CI gate | | | | |
| **DEV-011** | [TASK-669](archive/TASK_QUEUE_DONE.md) — Upstash Redis for rate limits | **Done 2026-08-13:** marketplace resource `upstash-kv-cordovan-notebook` (free) connected to `realms-rpg-test` (production + preview + development). Vercel injected `KV_REST_API_URL` + `KV_REST_API_TOKEN`. Production rebuilt (`dpl_FwVQRANEeah7RydyMXRkJ61HDr5D`, aliased to realmsrpg.com). Remaining: [TASK-645](archive/TASK_QUEUE_DONE.md) rate-limit smoke in Pending owner QA. | Was vendor billing; now live | | | | |
| **DEV-012** | [TASK-648](archive/TASK_QUEUE_DONE.md) + [TASK-652](archive/TASK_QUEUE_DONE.md) + [TASK-645](archive/TASK_QUEUE_DONE.md) — commit + reconcile | **Audit 2026-08-03:** batch archived `done` but **not on `HEAD`** — e.g. `HEAD` still returns raw `error.message` on `/api/images` GET; working tree fixes are correct. Prefer **three scoped commits** (648 = `api-error.ts` + audited routes + ARCHITECTURE docs only; 652 = admin validation + `lib/admin`; 645 = rate-limit + deps + env docs) — do not mix `official/enhanced-items` admin refactor into TASK-648. Run `npm run tasks:validate`; clean `.next` + `npm run build` before push. Optional `/cleanup TASK-648`: unify catch blocks to `logApiError`; crafting/encounters GET `{ error }` handling. | Git + CI gate | | | | |
| **DEV-013** | [TASK-745](archive/TASK_QUEUE_DONE.md) — Sentry DSN | **Done 2026-08-13:** marketplace resource `sentry-copper-canvas` (Developer $0) connected to production + preview. Vercel injected `NEXT_PUBLIC_SENTRY_DSN`. Production rebuilt so the DSN is in the client bundle. Remaining: confirm an event in Sentry (Pending owner QA). | Was new vendor project; now live | | | | |


---



## Build validation index

Each suite is a **category** of step-by-step tests. Full steps live in `[BUILD_VALIDATION.md](BUILD_VALIDATION.md)` or `[archive/BUILD_VALIDATION_ARCHIVE.md](archive/BUILD_VALIDATION_ARCHIVE.md)`. Do not run cramped multi-behavior checklists — use individual **DEV-V-###-T###** tests.


| Suite         | Category                                              | Related task(s)                                                                                                                                                          | Tests             | Status                                                                                                            |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **DEV-V-001** | Advanced character creator step guards                | TASK-356, TASK-717, TASK-748, TASK-739                                                                                                                                     | T001–T018 (18)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-001--advanced-character-creator-step-guards)                       |
| **DEV-V-008** | Archetype path completion                             | TASK-366–374, TASK-473, TASK-484, TASK-404, TASK-476, TASK-512, TASK-514–518, TASK-522, TASK-529, TASK-534, TASK-572, TASK-381, TASK-732                                                                     | T001–T026         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-008--archetype-path-completion-task-366374)                        |
| **DEV-V-009** | Character sheet refactor                              | TASK-317, TASK-348, TASK-365, TASK-375, TASK-318, TASK-349, TASK-483, TASK-485, TASK-486, TASK-502, TASK-478, TASK-508–513, TASK-523, TASK-525, TASK-526, TASK-537, TASK-538, TASK-542, TASK-543, TASK-546, TASK-547, TASK-567, TASK-582, TASK-581, TASK-583, TASK-584, TASK-585, TASK-586, TASK-587, TASK-594, TASK-600, TASK-602, TASK-667, TASK-733, TASK-736, TASK-741, TASK-747, TASK-750, **TASK-761** | T001–T046         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-009--character-sheet-refactor-task-317-task-348-task-365-task-375-task-483-task-485-task-486-task-502-task-478) |
| **DEV-V-005** | RLS / DB migrations                                   | TASK-352, TASK-327, TASK-354                                                                                                                                             | T001–T003 (3)     | Archived — [open suite](BUILD_VALIDATION.md#dev-v-005--rls-policy-consolidation-task-352-task-327)                |
| **DEV-V-010** | Feat/trait custom name + note                         | TASK-377                                                                                                                                                                 | T001–T004 (4)     | Archived — [open suite](BUILD_VALIDATION.md#dev-v-010--feattrait-custom-name--note-task-377)                      |
| **DEV-V-011** | UI verification safety net                            | TASK-383, TASK-385                                                                                                                                                       | T001–T006 (6)     | Archived — [open suite](BUILD_VALIDATION.md#dev-v-011--ui-verification-safety-net-task-383)                       |
| **DEV-V-012** | Landing page rebuild                                  | TASK-387, TASK-519, **TASK-763**                                                                                                                                          | T001–T008 (8)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387)                                |
| **DEV-V-013** | Guided Simple character creator                       | TASK-394–403, TASK-406–407, TASK-419, TASK-422, TASK-424–429, TASK-432–436, TASK-441–443, TASK-446–448, TASK-451–453, TASK-454–462, TASK-444, TASK-463–468, TASK-470–472, TASK-487–490, TASK-503, TASK-520, TASK-514, TASK-524, TASK-527, TASK-528, TASK-530, TASK-544, TASK-545, TASK-547, TASK-548, TASK-565, TASK-566, TASK-573, TASK-577, TASK-578, TASK-579, TASK-580, TASK-638, TASK-640, TASK-641, TASK-670, TASK-711, TASK-706, TASK-707, TASK-730, TASK-720, TASK-729, TASK-726, TASK-716, TASK-732, TASK-734, **TASK-755**, **TASK-756**, **TASK-757**, **TASK-758**, **TASK-759**, **TASK-760**, **TASK-753** | T001–T087 (87) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-013--guided-simple-character-creator-task-394403)                  |
| **DEV-V-014** | Codex payload + roll timestamp                        | TASK-378                                                                                                                                                                 | T001+ (CI vitest) | Archived — [open suite](BUILD_VALIDATION.md#dev-v-014--codex-payload--roll-timestamp-task-378)                    |
| **DEV-V-015** | Library API typing                                    | TASK-420                                                                                                                                                                 | T001–T002         | Archived — [open suite](BUILD_VALIDATION.md#dev-v-015--library-api-typing-task-420)                               |
| **DEV-V-031** | API route smoke                                       | TASK-613                                                                                                                                                                 | T001 (CI vitest)  | Archived — [open suite](BUILD_VALIDATION.md#dev-v-031--api-route-smoke-task-613)                                  |
| **DEV-V-016** | Library add/load selection parity + GridListRow facts | TASK-379, TASK-437, TASK-475, TASK-536, TASK-541, TASK-564, TASK-574, TASK-480, TASK-675, TASK-691, TASK-712, TASK-723                                                                                         | T001–T019 (+ CI builders/inventory) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-016--library-addload-selection-parity-task-379)                    |
| **DEV-V-017** | Site copy modules                                     | TASK-390, TASK-615                                                                                                                                                       | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-017--site-copy-modules-task-390)                                   |
| **DEV-V-018** | CreatorPageShell parity                               | TASK-380, TASK-431, TASK-381, TASK-616, TASK-732, **TASK-764**, **TASK-408**                                                                                                                     | T001–T014 (14)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-018--creatorpageshell-parity-task-380--task-381--task-616)                             |
| **DEV-V-019** | React Compiler hook cleanup                           | TASK-430 / TASK-501                                                                                                                                                      | T001–T013 (13)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-019--react-compiler-hook-cleanup-task-430)                         |
| **DEV-V-020** | Sitewide copy compliance                              | TASK-439, TASK-440                                                                                                                                                       | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-020--sitewide-copy-compliance-task-439)                            |
| **DEV-V-021** | Stable expand toggle                                  | TASK-445, TASK-539                                                                                                                                                       | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-021--stable-expand-toggle-task-445)                                |
| **DEV-V-022** | Characters list page                                  | TASK-469                                                                                                                                                                 | T001–T003 (3)     | Archived — [open suite](BUILD_VALIDATION.md#dev-v-022--characters-list-page-task-469)                             |
| **DEV-V-023** | Admin Realms Image Library                            | TASK-493                                                                                                                                                                 | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-023--admin-realms-image-library-task-493)                          |
| **DEV-V-024** | Client error handling                                 | TASK-479, TASK-540                                                                                                                                                       | T001–T005 (5)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-024--client-error-handling-task-479)                               |
| **DEV-V-025** | ExpandableImage adoption                              | TASK-478                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-025--expandableimage-adoption-task-478)                            |
| **DEV-V-028** | Codex browse list shell                               | TASK-576                                                                                                                                                                 | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-028--codex-browse-list-shell-task-576)                            |
| **DEV-V-027** | Admin Official Enhanced list shell                    | TASK-575                                                                                                                                                                 | T001 (1)          | Ready — [open suite](BUILD_VALIDATION.md#dev-v-027--admin-official-enhanced-list-shell-task-575)                 |
| **DEV-V-035** | Realms Library redundant source badge                 | Session cleanup                                                                                                                                                          | T001 (1)          | Ready — [open suite](BUILD_VALIDATION.md#dev-v-035--realms-library-redundant-source-badge-session)              |
| **DEV-V-034** | GLR chrome + Parts chip grammar                       | TASK-622, TASK-630, **TASK-710**                                                                                                                                          | T001–T002 (2)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-034--glr-chrome--parts-chip-grammar-task-622)                    |
| **DEV-V-043** | Wave 5 page facade splits                             | TASK-666                                                                                                                                                                 | T001–T007 (7)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-043--wave-5-page-facade-splits-task-666)                         |
| **DEV-V-045** | Codex character filter UX                              | Session / TASK-681 / **TASK-722**                                                                                                                                         | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-045--codex-character-filter-ux-session)                            |
| **DEV-V-047** | Collapse-by-default creators + browse filters           | TASK-677                                                                                                                                                                 | T001–T002 (2)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-047--collapse-by-default-creators--browse-filters-task-677)         |
| **DEV-V-048** | Library search toolbar + Enhanced Items tab              | Session / **TASK-721**                                                                                                                                                     | T001–T002 (2)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-048--library-search-toolbar--enhanced-items-tab-session)            |
| **DEV-V-049** | Empowered cheaper-EN overlap + No Attack                 | TASK-683                                                                                                                                                                 | T001 (1)          | Ready — [open suite](BUILD_VALIDATION.md#dev-v-049--empowered-cheaper-en-overlap--no-attack-task-683)             |
| **DEV-V-050** | Guided creator L3 inline catalog lists                   | TASK-684 / TASK-685 / **TASK-727** / **TASK-724** / **TASK-728** / **TASK-716** / **TASK-756** / **TASK-758** / **TASK-759** / **TASK-753**                                                                   | T001–T005         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-050--guided-creator-l3-inline-catalog-lists-task-684)              |
| **DEV-V-046** | Library power/technique categories + filters          | TASK-673 / TASK-676 / TASK-679 / TASK-680 / TASK-731 / **TASK-725** / TASK-746                                                                                               | T001–T008         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-046--library-powertechnique-categories--filters-task-673--task-676) |
| **DEV-V-051** | Guided funnel entry, trusted create, feat choice        | **TASK-738** / **TASK-754**                                                                                                                                               | T001–T010 (10)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-051--guided-funnel-entry-trusted-create-feat-choice-task-738--task-754) |
| **DEV-V-052** | Archetype Path list filter                              | **TASK-751** / **TASK-752** / **TASK-753**                                                                                                                                | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-052--archetype-path-list-filter-task-751--task-752) |
| DEV-V-002     | Campaign & rolls security                             | TASK-329                                                                                                                                                                 | —                 | Planned (legacy DEV-T-002)                                                                                        |
| DEV-V-003     | Admin role change safety                              | TASK-330                                                                                                                                                                 | —                 | Planned                                                                                                           |
| DEV-V-004     | Storage & account security                            | TASK-326, TASK-331                                                                                                                                                       | —                 | Planned                                                                                                           |
| DEV-V-006     | Resources PDF                                         | TASK-269                                                                                                                                                                 | —                 | Planned                                                                                                           |
| DEV-V-007     | Auth UI (Google only)                                 | TASK-361                                                                                                                                                                 | —                 | Planned                                                                                                           |


**How to report:** For each test, copy the **Report** line from `BUILD_VALIDATION.md` and mark PASS/FAIL/SKIP with notes (browser, account, screenshot if FAIL).

When a suite PASSes for an archived task, update that task’s `verification_status` to `verified` in `archive/TASK_QUEUE_DONE.md` and remove its row from **Pending owner QA** below. On FAIL → `verification_status: failed` and file a follow-up in `ACTIVE_TASKS.md`.

---

## Pending owner QA (implementation done)

Archived tasks waiting on owner manual validation. Implementation is complete (`status: done`); product sign-off is not.

| Task | Suite / tests | What to verify |
| ---- | ------------- | -------------- |
| **TASK-753** | DEV-V-013 **T012** + DEV-V-050 **T001** + DEV-V-052 **T006** | Path See more on feats / powers / loadout: Filters expanded; Archetype Path last and auto-selected to every player-visible path of the draft type; union + path-name chips. Custom inline catalogs have the control with no auto-select. Sheet Add Feat / Add Skill / Add Power (not Empowered) have the same last control; Add Feat keeps family ranks. Desktop + ~360px. |
| **TASK-764** | DEV-V-018 **T012 / T013** | Creator collapsible headers stay compact when expanded (no empty summary line); Power Attack dropdown has no second Attack label. Desktop + ~360px. |
| **TASK-408** | DEV-V-018 **T014** | Power creator InfoTippys on Description, Action Type, Reaction, Attack, Area, Duration, Parts, Mechanics, Damage, Energy, Innate, TP, Load, Reset; copy matches owner draft. Desktop + ~360px. |
| **TASK-763** | DEV-V-012 **T001 / T002 / T003 / T008** + DEV-V-020 **T001** | Guest home: **Create Character** (not Start Playing) → `/characters/new`. How-it-works: Create a character / Find a table (Discord link) / Start playing; no Archetype Path jargon. Zero-character signed-in still gets the guest CTA. Desktop + ~360px. |
| **TASK-751** | DEV-V-052 **T001** | Codex + Admin Feats: **Archetype Path** filter is last in the grid; lists player-visible paths grouped by type; multi-select is a union; matching rows chip only the selected paths that recommend them; level/category filters still apply and feat family ranks stay; empty copy names the path filter; an admin path recommendation edit shows up without reseeding anything. Desktop + ~360px. |
| **TASK-752** | DEV-V-052 **T002–T005** | Codex/Admin Skills, Library Powers (incl. innate bag), Library Techniques, Codex Equipment + Library weapons/armor/shields: same shared filter last in the panel; union + name chips while filtering; empty copy names the path filter. Desktop + ~360px. |
| **TASK-761** | DEV-V-009 **T046** | Campaign RM view: player sheet loads once via React Query, returning to a cached character shows no spinner flash, two roster characters never cross data, a player hitting the URL gets the RM-only error (no cached RM sheet), private/bad ids still show the error card. |
| **TASK-757** | DEV-V-013 **T087** | Power path with no weapon recs: Equipment is first/main Loadout screen, bottom-right See weapons opens capped weapon L2, pick persists to Your Hero/save; no Power armor or duplicate hatch on Martial/Powered-Martial/Custom. Desktop + ~360px. |
| **TASK-756** | DEV-V-013 **T086** (+ T043 / T056 / T076) + DEV-V-050 **T001** step 6 / **T003** | Powered-Martial walks innate → powers → techniques; Power skips techniques; Martial skips innate/powers. No Show Innate+Powers filter. Shared TP. Innate Energy bar only on the innate screen. Desktop + ~360px. |
| **TASK-759** | DEV-V-013 **T012 / T070** + DEV-V-050 **T001** | Creator L2/L3 and Codex/Admin State Feats filters show a link-blue (i) with the exact shared Quick Action / Enter State / 1-minute / multiple-state teaching sentence used on feat notices. Desktop + ~360px. |
| **TASK-758** | DEV-V-013 **T012** + DEV-V-050 **T001** | Guided archetype/character feat L2 and L3 omit Req. Level headers/cells while `lvl_req` >1 remains hidden. Codex/Admin feat lists still show Req. Level. Desktop + ~360px. |
| **TASK-760** | DEV-V-013 **T034 / T035 / T036** | AbilityScoreGrid display + Customize: all tiles have uniform height/alignment; Primary/Secondary and hybrid Power/Martial pills straddle the top edge without shifting highlighted content or wrapping into ability names. Desktop six-column + ~360px two-column, light + dark; compare Your Hero summary. |
| **TASK-733** | DEV-V-009 **T041** | Sheet Powers: Innate Energy and Innate Powers each have accessible `(i)` help with the creator’s global rules copy; no stale pool-as-per-power-cap blurb. Collapse/title help stay independently operable. Desktop + ~360px. |
| **TASK-755** | DEV-V-013 **T015 / T080 / T082** | Your Hero power/technique chips and allocator: Energy is **EN** or spelled **Energy**, never **EP**. Desktop labels Health/Energy; HP/EN below md. Desktop + ~360px. |
| **TASK-754** | DEV-V-051 **T009–T010** | Guided + Legacy legal create succeeds (no 500 / missing-column toast). Error copy: 400 lists legality rules; 500 is “Could not create… try again” without My Characters/duplicate; duplicate hint only after a lost response. Desktop + ~360px. |
| **TASK-750** | DEV-V-009 **T045** | Same tab: sheet notes persist across a Library add-to-character; both survive a sheet reload. Dirty notes must not revert on window focus. Two-tab live edits are T044. Desktop + ~360px. |
| **TASK-747** | DEV-V-009 **T044** | Two tabs: dirty notes in A + feats/inventory in B — A shows B's keys without reload and keeps unsaved notes. HP echo window does not block notes from B. Desktop + ~360px. |
| **TASK-746** | DEV-V-046 **T004 / T008** | Library add-to-character still persists the row. Two tabs: notes (or inventory) in the sheet + a library add both survive reload. Desktop + ~360px. |
| **TASK-739** | DEV-V-001 **T015 / T018** | Legacy Equipment: a non-overspent kit saves remainder `200 − spent`. An overspent kit (path Add all recommended over 200c) **saves** (no “start in debt” 400) and sheet currency is **0**. Desktop + ~360px. |
| **TASK-748** | DEV-V-001 **T017** | Chooser third card is **Legacy**; `/characters/new/advanced` heading has a **Legacy** chip, step line says Legacy creator, back link to chooser; tab title Legacy Character Creator. Desktop + ~360px. |
| **TASK-741** | DEV-V-009 **T043** | Two tabs: notes/inventory in A + HP in B both survive reload. Stale `updatedAt` PATCH is 409, not a silent full-document restore. Settings visibility still saves. |
| **TASK-745** | n/a (Sentry) | After using production, confirm an error or session appears in Sentry project `sentry-copper-canvas` (org Masters of the Realm). App no-ops without DSN; DSN is now on Vercel production + preview. |
| **TASK-734** | DEV-V-013 **T085** | Path/species card: Tab to **See more…**, Enter/Space expands without selecting; card itself still selects. Desktop + ~360px. |
| **TASK-735** | DEV-V-041 **T004** | Logged-out public sheet loads; private 404s; owner still opens private. GET uses visibility **column**. |
| **TASK-736** | DEV-V-009 **T042** | Sheet edit autosaves after ~2s despite re-renders; failed PATCH retries when network returns; hiding the tab does not drop a dirty edit. |
| **TASK-737** | n/a (auth/query) | After sign-in from a guest session, `/campaigns` / `/characters` show the signed-in lists (not a guest 401 cache). Sign-out still hard-navigates to login. |
| **TASK-738** | DEV-V-051 **T001–T008** | Guided entry paints the Path step without waiting on the session (guest still needs login to save). **T003:** a save whose response is lost, then retried — including after a reload — leaves exactly one character. **T004:** an Advanced level-1 save is still accepted — a 400 "not a legal level 1 build" there is a FAIL, report the `details`. Recommended abilities save what step 4 displayed; character feat starts at **0 / 1** with nothing pre-picked. **T008:** when curated cards all fail requirements, the empty state says they do not qualify and **See more** still works. |
| **TASK-714** | DEV-V-013 **T081** (source chrome) | Mixed species modal: All / Public species / My species still filters; dual-select confirm unchanged. |
| **TASK-732** | DEV-V-013 **T084** + DEV-V-008 **T026** + DEV-V-018 **T011** | Path More details + preview feats + sheet/Codex path recs + species-creator skills show **names**, not raw UUIDs (`docId` matches). Desktop + ~360px. |
| **TASK-716** | DEV-V-013 **T044** + DEV-V-050 **T001** step 3 (+ TASK-701 surfaces) | Weapon Range never shows `0` / bare level ints: L1 See more chips `Range 8 Spaces` / `Range 16 Spaces` (melee omits Range); L3/Library/sheet columns Melee or `8 spaces` / `16 spaces`. Advanced Equipment weapon catalog same. Desktop + ~360px. |
| **TASK-726** | DEV-V-013 **T083** | Powers: Innate Energy pill has (i) (Pools × Threshold, combined energy of innate powers); Innate Powers heading has (i) (no Energy spend; ≤ Threshold). Same Innate Energy tip on L2 footer + L3. Link-blue, not TP green. Desktop + ~360px. |
| **TASK-725** | DEV-V-046 **T007** | Library Powers filters: number fields match dropdown height/radius; Codex Feats Max Required Level + (i) does not gap the label; Guided section titles with (i) stay one line. Desktop + ~360px tap. |
| **TASK-728** | DEV-V-050 **T005** | Custom L3: clicking a catalog row does not jump that row out from under the cursor (Selected card may appear above). Empty selected state is not a large blank hole. Repeat feats / loadout / powers; gear 0→1 qty. Desktop + ~360px. |
| **TASK-722** | DEV-V-045 **T001–T003** | Filter by character starts collapsed with (i) on the header (Feats, Skills, Library Powers). Codex Skills: character pick shares persistence; Known / Not known / sub-skills whose base I have; Ability/Base Skill/Skill Type still show with no character. |
| **TASK-721** | DEV-V-048 **T001–T002** (+ DEV-V-047 **T002**, DEV-V-016 **T016**) | Codex / Library (Official + My) / Admin Codex + Images: Search + Filters on one row (Filters right of search); Sync/Create after Filters not in the Filters slot; ~360px wrap; USM/L3 unchanged |
| **TASK-724** | DEV-V-050 **T004** (+ T001 step 5, T002 step 3) | Guided Loadout gear L2/L3: Category header + taxonomy cells (Adventuring/Tools/…); weapon/armor still have no type-as-category column. Desktop headers + ~360px. |
| **TASK-723** | DEV-V-016 **T008** | Codex + Admin Equipment: Category / Currency / Rarity headers (no Cost, Damage, Dmg. Red.); Currency is a plain number (no “c”, not highlighted). Expand weapon → damage chip; armor → Damage Reduction chip. Codex Filters: min/max currency; with a character, rarity-this-level and within-currency are off by default. |
| **TASK-720** | DEV-V-013 **T081** (+ T008 hug, T078 step 4) | Ancestry: size track hugs few pills; mixed overview shows both parent cards (art/desc/More details) + Change species via MixedSpeciesModal without leaving Ancestry. Desktop + ~360px. |
| **TASK-727** | DEV-V-050 **T003** (+ T001 step 6) | Custom L3 innate catalog stays populated when Innate Energy is full; selecting another innate swaps last-selected until the pick fits; threshold-ineligible still hidden; TP still blocks. Path L2 See more innate modal same swap. Desktop + ~360px. |
| **TASK-730** | DEV-V-013 **T080** | Your Hero Loadout: weapon chip shows name (official or My Library), not a raw id; armor unchanged; gear still omitted. Power/technique chips show names (not UUIDs); unresolved may be “Unknown power/technique” |
| **TASK-731** | DEV-V-046 **T006** (+ T004/T005 icon names) | Realms Library + Filter by character: dual-action rows show BookPlus (add to library) vs UserPlus (add to character), not two Plus glyphs. Light + dark. My Library shows only UserPlus. |
| **TASK-707** | DEV-V-013 **T050** | Default InfoTippy is link-blue; Training Points pill **i** is TP green (`text-tp-text`); on-chip **i** matches chip text. Light + dark; touch targets unchanged. |
| **TASK-729** | DEV-V-013 **T082** (+ **T015** step 4) | Your Hero Auto-allocate ticks Health/Energy PointStatus remaining to 0; (i) names highest Energy-cost Power/Technique; desktop labels Health/Energy (HP/EN below md / sheet inline). Advanced Finalize same pool+tip. |
| **TASK-706** | DEV-V-013 **T057** step 1 + DEV-V-050 **T001** step 6 (+ DEV-V-009 **T032** step 4) | Powers Innate Energy + Training Points share one LoadoutBudgetBar row and match Skills / Ability Points PointStatus size (not a smaller sibling). L2 innate footer same. Desktop + ~360px wrap. Sheet spend Skill Points / Ability Points pills match that inline size. |
| **TASK-712** | DEV-V-016 **T019** | Creature Select Powers/Techniques/Inventory: All/Realms/My scopes catalogs; public wins on id collision; armament picker hides already-selected `docId`s; empowered tab does not list duplicate `docId`s. Guided keep-selected unchanged. |
| **TASK-711** | DEV-V-013 **T019** step 3 | Ancestry overview granted traits are read-only compact cards (name + preview + See more; no select chrome). Species More details catalogs stay GLR. Desktop + ~360px. |
| **TASK-709** | DEV-V-050 **T001** (esp. steps 1–6, 8–9) + DEV-V-016 **T018** | Custom L3 feats/loadout/powers columns+expand match Codex/Official (modulo ADR-0012 allowlist); Path L2 SourceFilter defaults Realms; no guided-only Details chips |
| **TASK-705** | DEV-V-050 **T001** steps 3–4, 8 + DEV-V-013 **T052** step 5 | Loadout L3 SourceFilter defaults All and scopes catalog; Create Armament hatch opens `/item-creator` in a new tab (weapons/armor, not gear); path L2 SourceFilter defaults Realms |
| **TASK-703** | DEV-V-050 **T001** steps 1–6, 9 | Required facts appear in columns or expand chips (not missing/duplicated): feat Codex columns, Official P/T columns, armament property sections |
| **TASK-710** | DEV-V-034 **T001** + DEV-V-050 **T001** step 5 | GLR expanded surface-alt continues through + / edit / delete / qty; action icons header-centered at shared size; hover through stepper; + still does not overlay description |
| **TASK-702** | DEV-V-034 **T001** + DEV-V-050 **T001** step 5 (+ expand spot-check) | GLR right chrome: expand a selectable (+) row — description fully readable (no + overlay); gear quantity ListHeader bar full-width + titles align; hover extends through qty/right-slot; remove-X / energy slots still correct |
| **TASK-699** | DEV-V-050 **T001** step 9 + `/dev/styleguide` | Descriptor + expandable + pill chips in entity rows share readable inline size (`text-sm`, `px-2.5 py-1`); filter toolbar pills stay smaller `sm`; GLR expanded rows do not overflow badly |
| **TASK-708** | DEV-V-050 **T002** step 4 | Guided/custom Powers L2/L3 Energy column matches Official Realms Library for the same power id (no false `0` when Library shows positive EN). Spot-check a columnar power with damage scalars + a martial technique. |
| **TASK-701** | DEV-V-050 **T001–T002** + DEV-V-009 **T017** | Weapon/shield Range: Melee when no Range property (never `0`); ranged shows `8 spaces` / `16 spaces` from properties (not raw level ints). Spot-check guided L2/L3, Library Official armaments, sheet weapon/shield library rows. Remaining callers (L1 chips, Advanced catalog, attack-ability) → TASK-716. |
| **TASK-700** | DEV-V-050 **T001** step 7 | Guided L3 Selected panel: even horizontal cushion from card border; balanced top/bottom padding; qty/remove slots still align with headers |
| **TASK-698** | DEV-V-046 **T003** step 7 | Library/Codex filter dropdowns (SelectFilter/ChipSelect): chevron inset from right edge; muted weight (not heavy native arrow); h-11 preserved |
| **TASK-697** | DEV-V-013 **T076** step 5 (+ T030) | Ancestry: Continue from Species / chapter rail lands on stable species overview (heritage + size); no flash-then-jump to first pick; second Continue enters first pick in order (Custom + Guided) |
| **TASK-692** | DEV-V-050 **T001** step 6 + DEV-V-016 **T017** | Guided L3 Powers/Techniques: **one** shared Filters panel above innate/regular lists; Category/Max EN/etc. narrow lists; no sheet Character filter; innate-scope SelectFilter + max-EN / innate threshold / TP gates unchanged |
| **TASK-695** | DEV-V-013 **T077–T078** | Layer-nav expand (See all species, Create Species, See more) = hatch outline+subtle fill, not solid primary; footer Continue stays sole primary blue |
| **TASK-694** | DEV-V-050 **T002** | Preview strip/panel: path/type once in subtitle (no duplicate chip); ability chips hidden until Abilities selection/completion; only pow_abil/mart_abil highlighted |
| **TASK-693** | DEV-V-013 **T079** | Custom chooser: Restart lands on Path L3 custom archetype face (not Guided L1); Guided entry: Restart lands on Path L1; progress cleared |
| **TASK-691** | DEV-V-016 **T018** | Guided Powers/Techniques L2/L3: Official Library columns (powers TP is totalCost, not a dense column); path-name chips while filtering + max-EN / innate gates unchanged |
| **TASK-675** | DEV-V-016 **T017** | Sheet Add Power/Technique (+ Advanced creator): Filters panel shows shared PowerTechniqueFilters compact; list applies Library filter helpers; guided L3 inline matches (TASK-692) |
| **TASK-690** | DEV-V-050 **T001–T002** | L3 regression audit close: preview strip, Power armor skip, equipment Codex columns, powers Energy kind |
| **TASK-689** | DEV-V-050 **T002** | Power (path or custom): Loadout never shows armor phase even if path `armorStep: required` |
| **TASK-688** | DEV-V-050 **T001–T002** | Equipment L3/L2: Rarity/Range/DR/Abl.Req/Crit+ headers match Library; gear qty stepper not clipped |
| **TASK-687** | DEV-V-050 **T002** | Martial techniques Energy column + max-EN filter use techniques derive path (not powers) |
| **TASK-686** | DEV-V-050 **T002** | ~~Preview strip: all six abilities (+/0/−) + custom Power/Martial/Powered-Martial chip~~ — superseded by TASK-694 preview AC |
| **TASK-685** | DEV-V-050 **T001** | L3 feedback: hide unmet feats; custom loadout always shows weapons (Power-only skips armor); gear qty stepper replaces +; powers innate scope + max EN filter |
| **TASK-684** | DEV-V-050 **T001** | Guided creator (Full Customize / no path): archetype feats, character feat, loadout (weapon/armor/gear), powers/techniques render filtered catalog inline (no modal); path-based (L1) flow unchanged |
| **TASK-683** | DEV-V-049 **T001** | Empowered creator: Weapon Attack uses cheaper Add Weapon (technique ~2.5 EN); No Weapon/Attack adds No Attack; Unarmed adds nothing |
| **TASK-681** | DEV-V-045 **T002** | Library ↔ Codex: character filter persists across powers/techniques/armaments/feats/skills tabs; clear on one tab clears all; survives refresh |
| **TASK-680** | DEV-V-046 **T005** | Library Weapons/Armor/Shields (My + Realms): filter by character → ability/proficiency (+ optional currency) → + on rows → confirm adds to sheet equipment; + hidden when already owned |
| **Session** | DEV-V-048 **T001** (+ DEV-V-016 **T016**) | My Library search spans to Filters then Sync; **Enhanced Items** tab before Creatures; Enhanced Items full-width search |
| **TASK-679** | DEV-V-046 **T004** | Library Powers/Techniques (My + Realms): filter by character → + on rows → confirm adds to character sheet; + hidden when already owned; admin public-library has no add-to-character |
| **TASK-677** | DEV-V-047 **T001–T002** | Power creator + Codex Feats: all CollapsibleSection / FilterSection panels start collapsed; summaries visible; Filters toggle on the search row / expand works |
| **TASK-674** | DEV-V-034 **T001** | My Library Powers/Techniques/Items: headers align with row values on rows **with and without** “Needs sync” badge (empty sync spacer reserved). |
| **TASK-667** | DEV-V-009 **T040** | Sheet modals (recovery, level-up, add library item, feats, edit archetype/species) + Library tabs via context; campaign RM view still read-only |
| **TASK-666** | DEV-V-043 **T001–T007** | Wave 5 facade smoke: combat encounter play; my-account cards; campaign detail; character sheet load/edit; crafting tool session; Edit Species modal; admin core-rules category tabs — no blank flash / behavior change vs pre-split |
| **TASK-650** | DEV-V-042 **T001** (`node scripts/verify-task-650.mjs`) + optional **T002** browser | T001 automated: advisor parity + owner/member/stranger RLS smoke — PASS 2026-08-03. T002: owner/member campaign UI + invite join unchanged. |
| **TASK-672** | DEV-V-044 **T001** | Power Creator: Sphere + Apply duration + Focus/Sustain — save/reload; Library Energy matches creator. (Re-homed from remote TASK-642 ID collision.) |
| **TASK-649** | DEV-V-041 **T001–T003** (+ `node scripts/verify-task-649.mjs`) | Logged out: codex + Realms Library + item art URLs work. Guest public character sheet loads; private sheet 404. Signed in: own sheet, campaign roster, admin codex save unchanged. |
| **TASK-645** | Rate-limit smoke | **Redis live 2026-08-13 (DEV-011).** Local without KV env: join + admin role-policy PATCH still succeed under normal use. Production: rapid join attempts (5+/min per user) return 429 + `Retry-After`; admin role-policy PATCH bursts return 429 at strict limit; limits persist across cold serverless instances. |
| **TASK-647** | Codex debug gate smoke | Production (or prod-like): `GET /api/codex?debug=1` as non-admin returns generic error without `debug.message`/`debug.code`. Dev or admin still gets debug payload. |
| **TASK-651** | Public image GET smoke | Unauthenticated: public image URLs still render; private/non-existent images 404. No regression on admin image upload/replace. |
| **TASK-644** | Armor DR parity smoke | Same armor item shows identical DR on character sheet, library list, guided creator, and advanced creator (flat scalar + property-based DR item). |
| **TASK-643** | Creature builder / admin rules smoke | Admin `featPointsPerLevel` change affects creature feat budget totals (level bonus = `(level−1)×featPointsPerLevel`, base 4 not 1.5). Spot-check L1/L3 creature in creator or Codex stat block. |
| **TASK-654** | Campaign character sheet smoke | RM views roster member's sheet — library-derived powers/techniques/equipment/feats render (not empty). Campaign-visibility character: fellow member sees populated `libraryForView`. Non-member gets 403 on campaign character API. Owner self-view unchanged. |
| **TASK-640** | DEV-V-013 **T075–T077** | Chooser Legacy card; Custom deep catalogs per step; layer-nav placement (T077 expand hatch superseded by TASK-695 — not footer primary) |
| **TASK-641** | DEV-V-013 **T078** | Species L2: all species + Mixed Species card + Create Species (`GuidedLayerNav`, not footer); guided mixed Ancestry flow |
| **TASK-670** | DEV-V-013 **T079** | Mixed species skill picks: guided cards + Advanced/sheet picker rows show skill descriptions (truncated / See more) |
| **TASK-638** | DEV-V-013 **T072–T074** (+ T001 update) | Chooser Custom → guided Path L3; L1 **Custom Archetype** hatch; L3 type/ability Continue + **View archetype paths** back to L1 |
| **Session** | DEV-V-040 **T001** | Creature levels: creator select + summary, Library/Realms stat blocks, Add Combatant picker, Codex creature-feat Req. Lvl show ¼/½/¾ (not 0.25/0.5) |
| **TASK-678** | DEV-V-040 **T002** | Library Creatures: sort Level ascending ¼ → ½ → 1 (not ½ before ¼); descending reverses |
| **Session** | DEV-V-039 **T001** | Codex Feats expand: **TAGS** label on single-tag feats (e.g. Abundant Harvest → Craft); Tags section last after skill/ability/feat levels |
| **Session** | DEV-V-045 **T001** | Codex Feats filters: **Filter by character** in filters panel; disabled level/ability filters when active; inline show-unqualified; no qualification banner |
| **TASK-676** | DEV-V-046 **T001–T003** | Power/technique filters: character locks + available TP, Max TP, Damage category, PM innate 6→8, layout align |
| **TASK-673** | DEV-V-046 **T001–T002** | Library/Admin powers & techniques: Category column + FilterSection (category, energy, action/reaction; powers: innate threshold + eligible) |
| **TASK-630** | DEV-V-034 **T002** | Library Creatures: same row gap as Powers; headers align with Level/Size/… columns (rowChrome); Realms Creatures same tight spacing |
| **TASK-628** | DEV-V-033 **T002** | Library Armor tab: Abl. Req. + Crit + columns; Critical Range +1 not duplicated as property chip |
| **TASK-626** | DEV-V-038 **T001** | Library Realms + My empowered techniques expand: Parts & Proficiencies shows power + technique chips; load/add USM empowered rows show same chips |
| **Session** | DEV-V-037 **T001** | Realms Library → Powers → Menace expand: one `Duration (Minute)`, one `Sphere of Effect` (5 unique part chips); optional Fog Cloud spot-check |
| **Session** | DEV-V-035 **T001** | Realms Library: expanded powers/techniques/armaments/creatures show no redundant **Realms** descriptor chip; admin Enhanced badge unchanged |
| **TASK-623** | DEV-V-036 **T001** | Power Creator: add fire + ice + lightning 1d6 rows — sidebar/total EN sums each row (e.g. 12 EN for three 1d6 elemental); save/reload and Library energy match |
| **TASK-624** | DEV-V-034 **T001** (+ Codex/Admin smoke) | Codex browse: no empty action column; Admin Codex edit/duplicate/delete under `rowChrome` |
| **TASK-622** | DEV-V-034 **T001** | Library GLR: edit/delete outside shared hover + headers aligned; Parts chips `TP: N` (no `(0)`); Techniques expand has no redundant Total TP |
| **Session** | DEV-V-013 **T067** | Guided creator subsection titles: display font, shared scale on Path / Archetype Feats / Abilities / Reveal; smaller than step title |
| **TASK-621** | DEV-V-033 **T001** | Library → Realms + My: Weapons / Armor / Shields tabs (not single Armaments); type-specific columns; admin Armaments uses segmented kind picker |
| **TASK-620** | DEV-V-032 **T001** | Realms Library → Creatures: full `CreatureStatBlock` rows (expand, roll, add-to-library); My Library unchanged; admin public-library Creatures stays compact grid |
| **TASK-615** | DEV-V-017 **T005** (+ DEV-006) | /privacy Cookies and Analytics copy; after deploy, Enable Web Analytics in Vercel Dashboard and confirm …/view beacon |
| **TASK-616** | DEV-V-018 **T008** | Power + item creators: editor sections + workspace cost/part modules after co-located split — save/load/reset, part/property add, EN/TP/IP chrome unchanged |
| **TASK-611** | DEV-V-009 **T002 / T011 / T013 / T031** (+ creature Library/stat-block smoke) | Shared hot-module split: character sheet Library expand/collapse + Energy spend rows; GridListRow parts/properties collapse; creature `CreatureStatBlock` nested lists still render — no behavior change vs pre-split |
| **TASK-615** | DEV-V-018 **T009 / T010** + DEV-V-013 smoke | TASK-610 facade remainder: creature workspace persistence extract + guided powers/techniques selection hook — same routes as TASK-610; no behavior change |
| **TASK-610** | DEV-V-018 **T009 / T010** + DEV-V-016 **T002** + DEV-V-013 smoke | Creator splits: `/creature-creator` (traits/loadout sections + workspace libs), `/empowered-technique-creator` (editor sections + cost/part modules), Advanced `/characters/new/advanced` ancestry step, Guided powers/techniques L1 — no behavior change vs pre-split |
| **TASK-608** | DEV-V-030 **T001 / T002** | Combat + skill encounter play: add combatant/participant, round/roll chrome, AddCombatantModal still works after facade split |
| **TASK-607** | DEV-V-019 **T011** (+ smoke) | Crafting session `/crafting/<id>`: load, change quantity/options (requirements update), enter roll, Complete Crafting; no blank flash |
| **TASK-606** | DEV-V-001 **T014 / T016** | Advanced equipment/powers/finalize: Currency + Training Points (+ Energy on finalize) via LoadoutBudgetBar → PointStatus; no CreatorResourceBar / dual L1 chrome |
| **TASK-604** | DEV-V-025 **T004** | CreatureStatBlock Weapons Attack: melee→STR, Finesse→AGI, ranged→ACU, Thrown→STR (+ martial prof); matches sheet helper |
| **TASK-603** | DEV-V-026 **T005 / T010** | Advanced finalize + Guided reveal share CreatorPortraitUpload (crop + bank pick); save-time portrait upload/errors via getErrorMessage |
| **TASK-602** | DEV-V-009 **T039** | Recovery modal: Full/Partial, 2/4/6h, Auto/Manual use SegmentedControl; preview + CTA still work; fullScreenOnMobile |
| **TASK-601** | DEV-V-016 **T002 / T004 / T005** | Technique / empowered / species creators: Load from Library (columns + restore), save/reset/auth chrome unchanged after workspace extract |
| **TASK-600** | DEV-V-009 **T038** (+ T034) | Header Speed/Evasion: Temp Modifier only — no pencil / permanent base edit; Abilities/Skills still dual mode |
| **TASK-599** | DEV-V-001 **T002** + DEV-V-008 **T008** | Forge type cards (Advanced + sheet Edit Archetype forge) share fantasy Power / Martial / Powered-Martial descriptions; creature ArchetypeSelector matches titles/descriptions (icons may differ) |
| **TASK-598** | Smoke (Advanced create + sheet) | Advanced: equipment → powers (path Layer-1 auto-merge + USM source merge + innate toggle) → finalize; sheet play/edit Library powers/inventory still work after splits |
| **TASK-596** | DEV-V-001 **T014–T015** | Advanced Equipment: 200c starting budget display; spend/add/remove/path recommend still match remainder (budget chrome now LoadoutBudgetBar — see TASK-606) |
| **TASK-594** | DEV-V-009 **T037** + DEV-V-008 **T008** | Sheet Edit Species: SelectionCard species grid + TraitSection ancestry; skill migration + mixed flaw scoping; Edit Archetype path groups SelectionCard + forge AbilityPickButton parity |
| **TASK-597** | Smoke (campaign RM view) | Open campaign → player character view: sheet sections match owner display (temp mods / library tabs); no edit chrome; rolls/log still work |
| **TASK-584** | DEV-V-009 **T032** | Skills catalog-all base skills; Proficient/All + Show sub-skills filters; − clears value→prof (subs remove); no Add Skill / per-row X; pencil top-right |
| **TASK-587** | DEV-V-009 **T035** | Defense Score value tip (`defenseScoreHelp`); name tips unchanged; roll chips still work |
| **TASK-586** | DEV-V-009 **T033–T034** | Temp Modifier on header LargeStatBlocks (Speed/Evasion/DR/crit) + Health `Terminal: X` + dual mode on Abilities (+ defenses + resource-maxima toggle) / Skills; tint + persist + cascade; pencil spend locks (Speed/Evasion pencil removed — see TASK-600) |
| **TASK-430** | DEV-V-019 **T001–T007, T009–T013** | React Compiler hook cleanup batches 1–7: remount/bootstrap, crafting FSM, sheet tour offer, admin queries, USM reopen; sitewide those three react-hooks rules at 0 |
| **TASK-440** | DEV-V-020 **T004** | Library Creatures + compact CombatantCard + Creature Creator quickStats: Health / Energy (not HP / EN) |
| **TASK-388** | DEV-V-029 **T001–T004** | Play-together after first save; optional sheet tour (Skip / Don't show again); level-up highlight cards (ability = scroll + edit mode) + My Account tutorials toggle; sheet tour retake in character settings; tour card above roll-log FAB |
| **TASK-583** | DEV-V-009 **T031** | Parts/Properties & Proficiencies default collapsed + section InfoTippy (family copy); descriptor chips stay open |
| **TASK-582** | DEV-V-009 **T028–T030** | Abilities/Defenses label parity; roll log die max/min badges dark contrast; desktop pencil icon-hugging |
| **TASK-581** | DEV-V-009 **T036** | Inventory Armament Proficiency label tip (`armamentProficiencyHelp`, same as Path More details) |
| **TASK-580** | DEV-V-013 **T071** | Training Points InfoTippy: shorter shared-budget copy (weapons/armor/Powers/Techniques); remaining gates affordability; no formula lecture |
| **TASK-579** | DEV-V-013 **T070** | Path More details feats: Uses DescriptorChips (non-expanding); state/restriction notices match Archetype Feats cards; no uses chip + uses sentence dup |
| **TASK-578** | DEV-V-013 **T069** | Path More details: no preview hint/Proficiency; Path Abilities tip; Weapons & Armor + live Armament Proficiency; compact recommended ability cards |
| **TASK-577** | DEV-V-013 **T068** | Path L1: title Choose your Archetype Path + tip; Foundation subtitle; stronger section headers; example-rich path-type tips; ability chips slightly larger, Primary slight blue |
| **TASK-576** | DEV-V-028 **T001–T004** | CodexBrowseListShell: Skills peers + Admin Images + Codex Archetypes chrome; Admin Archetypes path rows stay exceptional |
| **TASK-575** | DEV-V-027 **T001** | Admin Official Enhanced: OfficialEnhancedList chrome + New beside search; create/edit/delete modal unchanged |
| **TASK-530** | DEV-V-013 **T064** | Guided path content smoke: Berserker/Assassin/Sorcerer/Wardsmith - feat groups (character vs archetype), recommended abilities soft-default (primary 3 / secondary >=2 / spread), skills <=3, readable desc/notes; Wardsmith Power Prof starts at 2 |
| **TASK-493** | DEV-V-023 **T001–T006** | Admin `/admin/images` upload, rename/retag, replace, delete with usage warning, search/filter |
| **TASK-494** | Schema smoke | Migration `realms_image_entity_columns` **applied 2026-07-16** (owner-approved, via Supabase MCP); confirm species/equipment/power cards still resolve art via cache or bank |
| **TASK-495** | DEV-V-026 **T001–T002** (with 496) | Shared RealmsImagePicker now reachable via admin/creator wiring — verify guest browse/select + admin upload-into-bank |
| **TASK-496** | DEV-V-026 **T001–T002** | Admin species/equipment + creators use RealmsImageField/Picker; no legacy codex-art upload |
| **TASK-497** | DEV-V-026 **T002–T003** | user_* image_id parity; add-to-library preserves bank image_id; non-admin pick-only |
| **TASK-498** | DEV-V-026 **T004** | Legacy entity art cataloged into `/admin/images`; guided species cards still resolve |
| **TASK-499** | DEV-V-026 **T005–T006** | Portrait + profile bank pick (species\|creature) alongside custom upload |
| **TASK-531** | DEV-V-026 **T007** | Soft theme matte behind transparent art (cropper, thumbs, enlarge; not pure black/white) |
| **TASK-532** | DEV-V-026 **T008** | Equipment/armament GLR thumbs (Codex/Admin/Library) via resolveListRowThumbnail — same pattern as species |
| **TASK-533** | DEV-V-026 **T009** | Sitewide art-capable GLR thumbs (Library/Official/modals + sheet library + creator selected lists); skip non-art entities |
| **TASK-405** | DEV-V-026 **T001** (+ guided species art) | Choice-card art pipeline superseded by Image Library epic; smoke admin + guided art |
| **TASK-479** | DEV-V-024 **T001–T003** | Account profile-load Alert + Retry on failure; library delete/sync/add toasts; convention in ARCHITECTURE.md |
| **TASK-501** | DEV-V-019 **T008** | Power/martial create → opposite Library tab hidden by default; edit eye-toggle unhides |
| **TASK-475** | DEV-V-016 **T011** | My Library Enhanced — shared list chrome; no Sync/Duplicate; edit → crafting; delete still works |
| **TASK-478** | DEV-V-009 **T012** + DEV-V-025 **T001–T003** | Sheet portrait expand vs edit-upload; creature/campaign/account ExpandableImage |
| **TASK-508** | DEV-V-009 **T014** | Auto-proficiency over-cap toast; no ToastProvider render console error |
| **TASK-509** | DEV-V-009 **T015** | Single equipped armor toggle; guided/advanced create starter equip flags |
| **TASK-510** | DEV-V-009 **T013** | Library subsection collapse; inline chevron beside title (no circle); empty closed; + Add expands section |
| **TASK-511** | DEV-V-009 **T016** | Archetype empty shields/armor hidden; milestone edit-only; range/unarmed polish |
| **TASK-512** | DEV-V-008 **T015** | Sheet header DR + Critical Range when armored |
| **TASK-522** | DEV-V-008 **T015** | Header DR/crit cards match Speed/Evasion size+color; DR from enriched equipped armor |
| **TASK-513** | DEV-V-009 **T011** | Techniques collapsed row has no TP column (Energy spend + expanded part TP only) |
| **TASK-519** | DEV-V-012 **T007** | Mid-width window: no header overhang / empty strip / bottom horizontal scrollbar |
| **TASK-515** | DEV-V-008 **T016** | Admin L1 Skills: base-only (`base_skill_id` null only; `0` = sub), max 3; legacy warn on edit/save |
| **TASK-516** | DEV-V-008 **T017** | Admin L1 Armaments: separate weapons/shields vs armor pickers; single storage list |
| **TASK-514** | DEV-V-008 **T018** + DEV-V-013 **T060** | Admin feat guidance groups (character vs archetype audience); guided steps filter by audience |
| **TASK-517** | DEV-V-008 **T019** | No path-recommended species; starters (`is_starter`) only |
| **TASK-518** | DEV-V-008 **T018–T019** | Admin ↔ guided path parity audit after 514–517 |
| **TASK-520** / **TASK-592** | DEV-V-013 **T059** | Guided Continue only advances one screen (no jump to furthest); CI via `guided-substep-nav.test.ts` |
| **TASK-523** | DEV-V-009 **T017** | Weapons table: more space between Range/Attack/Damage; property bullets wrap under Name |
| **TASK-524** | DEV-V-013 **T061** | Ancestry picks: characteristic → ancestry trait → optional flaw (not flaw right after characteristic) |
| **TASK-525** | DEV-V-009 **T018** | Library card title matches Skills/Archetype; subsection headers `text-base` (`lg`) + modest title margin |
| **TASK-526** | DEV-V-009 **T019** | Collapsed library subsections stack tightly (no leftover gap under closed headers) |
| **TASK-527** | DEV-V-013 **T062** | Guided Loadout entry does not skip Weapons/Armor onto Equipment (cold catalog race) |
| **TASK-528** | DEV-V-013 **T063** | Guided Path step grouped Power / Powered-Martial / Martial with section-title InfoTippy |
| **TASK-529** | DEV-V-008 **T020** | Admin add/edit modals wide (`size="full"` / max-w-6xl); full-screen on mobile |
| **TASK-534** | DEV-V-008 **T021** | Admin archetype modal: expandable selected feats + cleaner qty/group layout |
| **TASK-536** | DEV-V-016 **T012** | Mobile GLR names fill space beside X/+ (no empty desktop-column squeeze) |
| **TASK-537** | DEV-V-009 **T020** | Inventory Currency / Armament Proficiency stack on mobile; TabSummarySection solid fills (no gradient) |
| **TASK-538** | DEV-V-009 **T021** | Sheet mobile side-scroll panels share header gutters + gap between panels |
| **TASK-539** | DEV-V-021 **T004** | Chip/GLR body tap toggles expand (header, mobile summary, expanded body; chips/Options excluded) |
| **TASK-540** | DEV-V-024 **T004–T005** | Auth: valid emails not labeled invalid; SMTP/send failures use send-failure copy; register trim/paste |
| **TASK-541** | DEV-V-016 **T013** | Mobile selection modals: Add Selected / Load / Cancel sticky at bottom (no scroll to reach) |
| **TASK-542** | DEV-V-009 **T022–T023** | Inventory Add equipment works (library + custom + stack); roll log bonus chip readable in dark mode |
| **TASK-543** | DEV-V-009 **T024** | Skills edit Value stepper `+` fully visible in narrow desktop Skills panel (not clipped) |
| **TASK-544** | DEV-V-013 **T018 / T020 / T034 / T035** | Guided path cards + More details + ability pills use Primary/Secondary Ability; no Power/Martial type tag in path deep-dive |
| **TASK-545** | DEV-V-013 **T018 / T020 / T034 / T035** | Correct Primary/Secondary UX vs Archetype Ability: hybrids = two Primaries; grid Power/Martial; GAME_RULES restored |
| **TASK-546** | DEV-V-009 **T025** | Sheet: no duplicate traits / part chips / feat or power rows (guided + library) |
| **TASK-547** | DEV-V-009 **T026** + DEV-V-013 **T065** | Ability/defense name word-tied tooltips on sheet + guided Abilities (no Info icon) |
| **TASK-567** | DEV-V-009 **T027** | Add Proficiency modal on UnifiedSelectionModal (search/list/footer + option levels) |
| **TASK-583** | DEV-V-009 **T031** | Parts/Properties sections default collapsed + family InfoTippy; descriptor chips stay open |
| **TASK-582** | DEV-V-009 **T028–T030** | Abilities/Defenses name size parity; roll log die badges dark mode; EditSectionToggle desktop compact |
| **TASK-581** | DEV-V-009 **T036** | Inventory Armament Proficiency InfoTippy; shared `armamentProficiencyHelp` |
| **TASK-572** | DEV-V-008 **T022** | AdminSpecies trait Add on UnifiedSelectionModal; AdminTraits choice options stay inline editor chrome |
| **TASK-381** | DEV-V-008 **T023–T025** (+ DEV-V-018 T008–T010) | AdminArchetypes Phase 6a–6c helpers/editor/workspace; creator workspace/editor parity suites |
| **TASK-573** | DEV-V-013 **T057** | Guided innate: soft Continue warn (no hard block); innate TP spend + TP title chip parity |
| **TASK-548** | DEV-V-013 **T066** | Guided Skills: Ability chip on each row + Skill Bonus hover/tap formula tip |
| **TASK-564** | DEV-V-016 **T014** | Add/selection modals: list-first Search+Filters toolbar; source/filters collapsed by default |
| **TASK-574** | DEV-V-016 **T015** | Add-modal: ≤1-line header help (or none); no footer white strip; Add selected? on dismiss with picks |
| **TASK-565** | DEV-V-013 **T012** | Guided feats See more opens add modal (not in-step full-catalog cards) |
| **TASK-461** | DEV-V-013 **T048** | Compact-fact grammar sitewide (cards/GLR/descriptor tips); soft styleguide residuals closed |
| **TASK-566** | DEV-V-013 **T067** (+ T065/T026 tip copy) | Guided Skills row layout (no chip/chevron overlap); Abilities mobile full names + 2-col tiles; ability/defense tips name once |

_Add rows when archiving user-facing work with `verification_status: pending-qa`. Remove when `verified` or `failed`._

---



## Legacy smoke tests (being replaced)

These combined checklists are **deprecated** — use **DEV-V-###** suites instead. Kept briefly for reference until split.

DEV-T-002 — Campaign & rolls (use DEV-V-002 when split)

**Where:** `/campaigns` · **Needs:** owner + member accounts optional  
Multi-step checklist — see TASK-329 notes. Split into DEV-V-002 on next touch.



DEV-T-003 — Admin roles (use DEV-V-003 when split)

**Where:** `/admin/users` · **Needs:** admin account



DEV-T-004 — Storage & account (use DEV-V-004 when split)

**Where:** character portrait, `/my-account`



DEV-T-006 — Resources PDF (use DEV-V-006 when split)

**Where:** `/resources`, prod PDF URL



DEV-T-007 — Auth UI (use DEV-V-007 when split)

**Where:** `/login`, `/register` — Google only, no Apple



---



## Decisions (optional)


| ID          | Topic                | Status / recommendation                                                          |
| ----------- | -------------------- | -------------------------------------------------------------------------------- |
| **DEV-Q01** | Apple sign-in        | **Resolved:** hidden on login/register until OAuth is implemented.               |
| **DEV-Q02** | Username enumeration | **Resolved:** `usernames` SELECT restricted to own row (SQL applied 2026-06-13). |
| **DEV-Q03** | TASK-313 hook merge  | **Resolved:** Option B — single scoped `use-enhanced-items.ts`.                  |


---



## Workflow cheat sheet


| AI task status | Your job                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| `done`         | Run the linked **DEV-V-###** suite in `BUILD_VALIDATION.md`; report each test.    |
| `partial`      | Run tests for `completed_work` only; read `remaining_work` in `AI_TASK_QUEUE.md`. |
| `blocked`      | Often points here (DEV-001, etc.).                                                |


When a suite is fully verified: note in the task’s `notes` or mark tests PASS in your QA log.
