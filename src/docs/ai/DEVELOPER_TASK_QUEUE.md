# Developer Task Queue

What **you** need to do that AI cannot (Dashboard, prod validation, decisions). For implementation work see `[ACTIVE_TASKS.md](ACTIVE_TASKS.md)` (process: `[AI_TASK_QUEUE.md](AI_TASK_QUEUE.md)`).

**QA / owner:** Run **Build validation** suites in `[BUILD_VALIDATION.md](BUILD_VALIDATION.md)` — one test per row, report PASS/FAIL/SKIP.

**Agents:** When you finish a user-facing task (`done` or `partial`), add granular tests to `BUILD_VALIDATION.md` and index the suite below. See `[ARCHITECTURE_CONSTITUTION.md](ARCHITECTURE_CONSTITUTION.md)`.

**Last updated:** 2026-07-20

---

## Automated vs human BUILD_VALIDATION coverage (TASK-480)

`BUILD_VALIDATION.md` stays the **owner smoke catalog**. CI covers extractable logic + visual/a11y nets; it does not replace full suite sign-off.

| Layer | What runs in CI / `npm test` | Keep human-only |
| ----- | ---------------------------- | --------------- |
| **Vitest** | Pure helpers for high-churn guided/library/sheet (loadout, eligibility, selectable builders, inventory merge, codex payload, etc.) | Live save/reload, multi-account, auth SMTP |
| **Playwright** | `verify:visual` / `verify:a11y` + optional creator/loadout/chip audits | Pixel polish judgment, tooltip feel, touch ergonomics beyond baselines |
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

**Already automated (pre-TASK-480):** DEV-V-014 (`codex-payload` + roll timestamp); large guided unit suite under `src/lib/guided-creator/*.test.ts`; Playwright visual/a11y + guided audits.

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
| **DEV-V-008** | Archetype path completion                             | TASK-366–374, TASK-473, TASK-484, TASK-404, TASK-476, TASK-512, TASK-514–518, TASK-522, TASK-529, TASK-534, TASK-572, TASK-381                                                                     | T001–T025         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-008--archetype-path-completion-task-366374)                        |
| **DEV-V-009** | Character sheet refactor                              | TASK-317, TASK-348, TASK-365, TASK-375, TASK-318, TASK-349, TASK-483, TASK-485, TASK-486, TASK-502, TASK-478, TASK-508–513, TASK-523, TASK-525, TASK-526, TASK-537, TASK-538, TASK-542, TASK-543, TASK-546, TASK-547, TASK-567, TASK-582, TASK-581, TASK-583, TASK-584, TASK-585, TASK-586, TASK-587, TASK-594, TASK-600, TASK-602                                              | T001–T039 (39)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-009--character-sheet-refactor-task-317-task-348-task-365-task-375-task-483-task-485-task-486-task-502-task-478) |
| **DEV-V-005** | RLS / DB migrations                                   | TASK-352, TASK-327, TASK-354                                                                                                                                             | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-005--rls-policy-consolidation-task-352-task-327)                   |
| **DEV-V-010** | Feat/trait custom name + note                         | TASK-377                                                                                                                                                                 | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-010--feattrait-custom-name--note-task-377)                         |
| **DEV-V-011** | UI verification safety net                            | TASK-383, TASK-385                                                                                                                                                       | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-011--ui-verification-safety-net-task-383)                          |
| **DEV-V-012** | Landing page rebuild                                  | TASK-387, TASK-519                                                                                                                                                       | T001–T007 (7)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387)                                |
| **DEV-V-013** | Guided Simple character creator                       | TASK-394–403, TASK-406–407, TASK-419, TASK-422, TASK-424–429, TASK-432–436, TASK-441–443, TASK-446–448, TASK-451–453, TASK-454–462, TASK-444, TASK-463–468, TASK-470–472, TASK-487–490, TASK-503, TASK-520, TASK-514, TASK-524, TASK-527, TASK-528, TASK-530, TASK-544, TASK-545, TASK-547, TASK-548, TASK-565, TASK-566, TASK-573, TASK-577, TASK-578, TASK-579, TASK-580 | T001–T071 (72) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-013--guided-simple-character-creator-task-394403)                  |
| **DEV-V-014** | Codex payload + roll timestamp                        | TASK-378                                                                                                                                                                 | T001+ (CI vitest) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-014--codex-payload--roll-timestamp-task-378)                       |
| **DEV-V-015** | Library API typing                                    | TASK-420                                                                                                                                                                 | T001–T002         | Ready — [open suite](BUILD_VALIDATION.md#dev-v-015--library-api-typing-task-420)                                  |
| **DEV-V-016** | Library add/load selection parity + GridListRow facts | TASK-379, TASK-437, TASK-475, TASK-536, TASK-541, TASK-564, TASK-574, TASK-480                                                                                         | T001–T015 (+ CI builders/inventory) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-016--library-addload-selection-parity-task-379)                    |
| **DEV-V-017** | Site copy modules                                     | TASK-390                                                                                                                                                                 | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-017--site-copy-modules-task-390)                                   |
| **DEV-V-018** | CreatorPageShell parity                               | TASK-380, TASK-431, TASK-381                                                                                                                                              | T001–T010 (10)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-018--creatorpageshell-parity-task-380)                             |
| **DEV-V-019** | React Compiler hook cleanup                           | TASK-430 / TASK-501                                                                                                                                                      | T001–T013 (13)    | Ready — [open suite](BUILD_VALIDATION.md#dev-v-019--react-compiler-hook-cleanup-task-430)                         |
| **DEV-V-020** | Sitewide copy compliance                              | TASK-439, TASK-440                                                                                                                                                       | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-020--sitewide-copy-compliance-task-439)                            |
| **DEV-V-021** | Stable expand toggle                                  | TASK-445, TASK-539                                                                                                                                                       | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-021--stable-expand-toggle-task-445)                                |
| **DEV-V-022** | Characters list page                                  | TASK-469                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-022--characters-list-page-task-469)                                |
| **DEV-V-023** | Admin Realms Image Library                            | TASK-493                                                                                                                                                                 | T001–T006 (6)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-023--admin-realms-image-library-task-493)                          |
| **DEV-V-024** | Client error handling                                 | TASK-479, TASK-540                                                                                                                                                       | T001–T005 (5)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-024--client-error-handling-task-479)                               |
| **DEV-V-025** | ExpandableImage adoption                              | TASK-478                                                                                                                                                                 | T001–T003 (3)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-025--expandableimage-adoption-task-478)                            |
| **DEV-V-028** | Codex browse list shell                               | TASK-576                                                                                                                                                                 | T001–T004 (4)     | Ready — [open suite](BUILD_VALIDATION.md#dev-v-028--codex-browse-list-shell-task-576)                            |
| **DEV-V-027** | Admin Official Enhanced list shell                    | TASK-575                                                                                                                                                                 | T001 (1)          | Ready — [open suite](BUILD_VALIDATION.md#dev-v-027--admin-official-enhanced-list-shell-task-575)                 |
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
| **TASK-586** | DEV-V-009 **T033–T034** | Temp Modifier on header LargeStatBlocks + dual mode on Abilities (+ defenses + resource-maxima toggle) / Skills; tint + persist + cascade; pencil spend locks (Speed/Evasion pencil removed — see TASK-600) |
| **TASK-430** | DEV-V-019 **T001–T007, T009–T013** | React Compiler hook cleanup batches 1–7: remount/bootstrap, crafting FSM, sheet tour offer, admin queries, USM reopen; sitewide those three react-hooks rules at 0 |
| **TASK-440** | DEV-V-020 **T004** | Library Creatures + compact CombatantCard + Creature Creator quickStats: Health / Energy (not HP / EN) |
| **TASK-388** | DEV-V-029 **T001–T003** | Play-together after first save; optional sheet tour (Skip / Don't show again); level-up highlight cards (ability = scroll + edit mode) + My Account tutorials toggle |
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
