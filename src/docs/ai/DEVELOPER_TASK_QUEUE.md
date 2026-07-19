# Developer Task Queue

What **you** need to do that AI cannot (Dashboard, prod validation, decisions). For implementation work see `[ACTIVE_TASKS.md](ACTIVE_TASKS.md)` (process: `[AI_TASK_QUEUE.md](AI_TASK_QUEUE.md)`).

**QA / owner:** Run **Build validation** suites in `[BUILD_VALIDATION.md](BUILD_VALIDATION.md)` — one test per row, report PASS/FAIL/SKIP.

**Agents:** When you finish a user-facing task (`done` or `partial`), add granular tests to `BUILD_VALIDATION.md` and index the suite below. See `[ARCHITECTURE_CONSTITUTION.md](ARCHITECTURE_CONSTITUTION.md)`.

**Last updated:** 2026-07-15

---



## Human developer tasks (not for AI agents)


| ID          | Task                                                  | Assignee            | What to do                                                                                                                                                                                                                                     |
| ----------- | ----------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEV-376** | [TASK-376](ACTIVE_TASKS.md) — DB cleanup              | **Done** 2026-06-30 | Dropped `ui_tooltips` + `user_profiles.show_tooltips` via Supabase MCP (`drop_legacy_ui_tooltips`). Repo SQL: `sql/drop-legacy-ui-tooltips-2026-06.sql`. App code no longer references `show_tooltips`.                                        |
| **DEV-004** | [TASK-396](ACTIVE_TASKS.md) — Guided creator seed SQL | **Done** 2026-06-30 | Applied via Supabase MCP migration `guided_creator_schema_seed` on project `lbqhiwudvifmkjtkccdg`. Verified: Berserker id=1 has recommended abilities + 2 loadouts; 8 starter species flagged. Repo SQL: `sql/guided-creator-schema-seed.sql`. |


---



## Required actions (Dashboard / one-off)


| ID          | Task                                                  | What to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Why AI can't                                                                   |             |                   |                                                                                                                                                                                                                   |                            |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **DEV-001** | [TASK-353](ACTIVE_TASKS.md) — HIBP                    | Supabase Dashboard → **Authentication** → Password → enable **Leaked password protection**. Project: `RealmsRPG-Test` (`lbqhiwudvifmkjtkccdg`). [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)                                                                                                                                                                                                                                                                                                    | Dashboard-only                                                                 |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-002** | [TASK-383](ACTIVE_TASKS.md) — UI Verify CI bootstrap  | One-time setup so the `UI Verify` workflow is a real gate: (1) Add repo **Actions secrets** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. (2) **Seed Linux visual baselines**: run the `visual-a11y` job once (or locally via the Playwright Docker image `mcr.microsoft.com/playwright`) with `npx playwright test --update-snapshots`, then commit the generated `tests/visual/*-snapshots/*-linux.png`. (3) In **Settings → Branches**, add `UI Verify / static-gates` and `UI Verify / visual-a11y` to required status checks. | Repo settings + secrets + committing OS-specific baselines from a Linux runner |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-003** | [TASK-385](ACTIVE_TASKS.md) — CI test user (optional) | (1) Run `npm run e2e:provision` locally with `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` set (uses `SUPABASE_SERVICE_ROLE_KEY`). (2) Add repo **Actions secrets**: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, optional `E2E_TEST_CHARACTER_ID` / `E2E_TEST_CAMPAIGN_ID` (defaults in `tests/visual/e2e-seed-manifest.json`). (3) On first CI run with secrets, commit Linux auth baselines from `tests/visual/auth-screenshots.pw.ts-snapshots/*-linux.png` (same flow as DEV-002).                                                                                          | Account creation + secret storage + OS-specific baselines                      |             |                   |                                                                                                                                                                                                                   |                            |
| **DEV-004** | [TASK-396](ACTIVE_TASKS.md) — Guided creator seed     | **Done** 2026-06-30 via Supabase MCP (`guided_creator_schema_seed`). Re-apply only if resetting a fresh DB.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                |             |                   |                                                                                                                                                                                                                   |                            |
|             |                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                                                                | **DEV-005** | Agent OS CI gates | In **Settings → Branches**, require `AI Task Verifier / verify` (strict reconcile + doc/path validators) alongside UI Verify checks. Confirm Actions has full git history (`fetch-depth: 0` already in workflow). | Branch protection settings |


---



## Build validation index

Each suite is a **category** of step-by-step tests. Full steps live in `[BUILD_VALIDATION.md](BUILD_VALIDATION.md)`. Do not run cramped multi-behavior checklists — use individual **DEV-V-###-T###** tests.


| Suite         | Category                                              | Related task(s)                                                                                                                                                          | Tests             | Status                                                                                                            |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **DEV-V-001** | Character creator step guards                         | TASK-356                                                                                                                                                                 | T001–T015 (15)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-001--character-creator-step-guards)                                |
| **DEV-V-008** | Archetype path completion                             | TASK-366–374, TASK-473, TASK-484, TASK-404, TASK-476, TASK-512, TASK-514–518, TASK-522, TASK-529, TASK-534                                                                              | T001–T021         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-008--archetype-path-completion-task-366374)                        |
| **DEV-V-009** | Character sheet refactor                              | TASK-317, TASK-348, TASK-365, TASK-375, TASK-318, TASK-349, TASK-483, TASK-485, TASK-486, TASK-502, TASK-478, TASK-508–513, TASK-523, TASK-525, TASK-526, TASK-537, TASK-538, TASK-542, TASK-543, TASK-545                                              | T001–T025 (25)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-009--character-sheet-refactor-task-317-task-348-task-365-task-375-task-483-task-485-task-486-task-502-task-478) |
| **DEV-V-005** | RLS / DB migrations                                   | TASK-352, TASK-327, TASK-354                                                                                                                                             | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-005--rls-policy-consolidation-task-352-task-327)                   |
| **DEV-V-010** | Feat/trait custom name + note                         | TASK-377                                                                                                                                                                 | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-010--feattrait-custom-name--note-task-377)                         |
| **DEV-V-011** | UI verification safety net                            | TASK-383, TASK-385                                                                                                                                                       | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-011--ui-verification-safety-net-task-383)                          |
| **DEV-V-012** | Landing page rebuild                                  | TASK-387, TASK-519                                                                                                                                                       | T001–T007 (7)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387)                                |
| **DEV-V-013** | Guided Simple character creator                       | TASK-394–403, TASK-406–407, TASK-419, TASK-422, TASK-424–429, TASK-432–436, TASK-441–443, TASK-446–448, TASK-451–453, TASK-454–462, TASK-444, TASK-463–468, TASK-470–472, TASK-487–490, TASK-503, TASK-520, TASK-514, TASK-524, TASK-527, TASK-528, TASK-530, TASK-544 | T001–T064 (64)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-013--guided-simple-character-creator-task-394403)                  |
| **DEV-V-014** | Codex payload + roll timestamp                        | TASK-378                                                                                                                                                                 | T001+ (automated) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-014--codex-payload--roll-timestamp-task-378)                       |
| **DEV-V-015** | Library API typing                                    | TASK-420                                                                                                                                                                 | T001–T002         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-015--library-api-typing-task-420)                                  |
| **DEV-V-016** | Library add/load selection parity + GridListRow facts | TASK-379, TASK-437, TASK-475, TASK-536, TASK-541                                                                                                                         | T001–T013 (13)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-016--library-addload-selection-parity-task-379)                    |
| **DEV-V-017** | Site copy modules                                     | TASK-390                                                                                                                                                                 | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-017--site-copy-modules-task-390)                                   |
| **DEV-V-018** | CreatorPageShell parity                               | TASK-380, TASK-431                                                                                                                                                       | T001–T007 (7)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-018--creatorpageshell-parity-task-380)                             |
| **DEV-V-019** | React Compiler hook cleanup                           | TASK-430 / TASK-501                                                                                                                                                      | T001–T010 (10)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-019--react-compiler-hook-cleanup-task-430)                         |
| **DEV-V-020** | Sitewide copy compliance                              | TASK-439                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-020--sitewide-copy-compliance-task-439)                            |
| **DEV-V-021** | Stable expand toggle                                  | TASK-445, TASK-539                                                                                                                                                       | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-021--stable-expand-toggle-task-445)                                |
| **DEV-V-022** | Characters list page                                  | TASK-469                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-022--characters-list-page-task-469)                                |
| **DEV-V-023** | Admin Realms Image Library                            | TASK-493                                                                                                                                                                 | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-023--admin-realms-image-library-task-493)                          |
| **DEV-V-024** | Client error handling                                 | TASK-479, TASK-540                                                                                                                                                       | T001–T005 (5)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-024--client-error-handling-task-479)                               |
| **DEV-V-025** | ExpandableImage adoption                              | TASK-478                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-025--expandableimage-adoption-task-478)                            |
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
| **TASK-520** | DEV-V-013 **T059** | Guided Continue only advances one screen (no jump to furthest progress) |
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
| **TASK-545** | DEV-V-009 **T025** | Sheet: no duplicate traits / part chips / feat or power rows (guided + library) |

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



DEV-T-005 — RLS (use DEV-V-005 when split)

**Where:** `/crafting`, `/library`, campaigns, Supabase console



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
