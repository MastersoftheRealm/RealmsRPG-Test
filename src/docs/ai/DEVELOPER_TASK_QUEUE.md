# Developer Task Queue

What **you** need to do that AI cannot (Dashboard, prod validation, decisions). For implementation work see [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md).

**QA / owner:** Run **Build validation** suites in [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md) — one test per row, report PASS/FAIL/SKIP.

**Agents:** When you finish a user-facing task (`done` or `partial`), add granular tests to `BUILD_VALIDATION.md` and index the suite below. See [`AGENT_GUIDE.md`](AGENT_GUIDE.md).

**Last updated:** 2026-06-30

---

## Human developer tasks (not for AI agents)

| ID | Task | Assignee | What to do |
|----|------|----------|------------|
| **DEV-376** | [TASK-376](AI_TASK_QUEUE.md) — DB cleanup | **Done** 2026-06-30 | Dropped `ui_tooltips` + `user_profiles.show_tooltips` via Supabase MCP (`drop_legacy_ui_tooltips`). Repo SQL: `sql/drop-legacy-ui-tooltips-2026-06.sql`. App code no longer references `show_tooltips`. |
| **DEV-004** | [TASK-396](AI_TASK_QUEUE.md) — Guided creator seed SQL | **Done** 2026-06-30 | Applied via Supabase MCP migration `guided_creator_schema_seed` on project `lbqhiwudvifmkjtkccdg`. Verified: Berserker id=1 has recommended abilities + 2 loadouts; 8 starter species flagged. Repo SQL: `sql/guided-creator-schema-seed.sql`. |

---

## Required actions (Dashboard / one-off)

| ID | Task | What to do | Why AI can't |
|----|------|------------|--------------|
| **DEV-001** | [TASK-353](AI_TASK_QUEUE.md) — HIBP | Supabase Dashboard → **Authentication** → Password → enable **Leaked password protection**. Project: `RealmsRPG-Test` (`lbqhiwudvifmkjtkccdg`). [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) | Dashboard-only |
| **DEV-002** | [TASK-383](AI_TASK_QUEUE.md) — UI Verify CI bootstrap | One-time setup so the `UI Verify` workflow is a real gate: (1) Add repo **Actions secrets** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. (2) **Seed Linux visual baselines**: run the `visual-a11y` job once (or locally via the Playwright Docker image `mcr.microsoft.com/playwright`) with `npx playwright test --update-snapshots`, then commit the generated `tests/visual/*-snapshots/*-linux.png`. (3) In **Settings → Branches**, add `UI Verify / static-gates` and `UI Verify / visual-a11y` to required status checks. | Repo settings + secrets + committing OS-specific baselines from a Linux runner |
| **DEV-003** | [TASK-385](AI_TASK_QUEUE.md) — CI test user (optional) | (1) Run `npm run e2e:provision` locally with `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` set (uses `SUPABASE_SERVICE_ROLE_KEY`). (2) Add repo **Actions secrets**: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, optional `E2E_TEST_CHARACTER_ID` / `E2E_TEST_CAMPAIGN_ID` (defaults in `tests/visual/e2e-seed-manifest.json`). (3) On first CI run with secrets, commit Linux auth baselines from `tests/visual/auth-screenshots.pw.ts-snapshots/*-linux.png` (same flow as DEV-002). | Account creation + secret storage + OS-specific baselines |
| **DEV-004** | [TASK-396](AI_TASK_QUEUE.md) — Guided creator seed | **Done** 2026-06-30 via Supabase MCP (`guided_creator_schema_seed`). Re-apply only if resetting a fresh DB. |

---

## Build validation index

Each suite is a **category** of step-by-step tests. Full steps live in [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md). Do not run cramped multi-behavior checklists — use individual **DEV-V-###-T###** tests.

| Suite | Category | Related task(s) | Tests | Status |
|-------|----------|-----------------|-------|--------|
| **DEV-V-001** | Character creator step guards | TASK-356 | T001–T015 (15) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-001--character-creator-step-guards) |
| **DEV-V-008** | Archetype path completion | TASK-366–374 | T001–T012 (12) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-008--archetype-path-completion-task-366374) |
| **DEV-V-009** | Character sheet refactor | TASK-317, TASK-348, TASK-365, TASK-375, TASK-318, TASK-349 | T001–T006 (6) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-009--character-sheet-refactor-task-317-task-348-task-365-task-375) |
| **DEV-V-005** | RLS / DB migrations | TASK-352, TASK-327, TASK-354 | T001–T003 (3) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-005--rls-policy-consolidation-task-352-task-327) |
| **DEV-V-010** | Feat/trait custom name + note | TASK-377 | T001–T004 (4) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-010--feattrait-custom-name--note-task-377) |
| **DEV-V-011** | UI verification safety net | TASK-383, TASK-385 | T001–T006 (6) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-011--ui-verification-safety-net-task-383) |
| **DEV-V-012** | Landing page rebuild | TASK-387 | T001–T006 (6) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387) |
| **DEV-V-013** | Guided Simple character creator | TASK-394–403 | T001–T005 (5) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-013--guided-simple-character-creator-task-394403) |
| DEV-V-002 | Campaign & rolls security | TASK-329 | — | Planned (legacy DEV-T-002) |
| DEV-V-003 | Admin role change safety | TASK-330 | — | Planned |
| DEV-V-004 | Storage & account security | TASK-326, TASK-331 | — | Planned |
| DEV-V-006 | Resources PDF | TASK-269 | — | Planned |
| DEV-V-007 | Auth UI (Google only) | TASK-361 | — | Planned |

**How to report:** For each test, copy the **Report** line from `BUILD_VALIDATION.md` and mark PASS/FAIL/SKIP with notes (browser, account, screenshot if FAIL).

---

## Legacy smoke tests (being replaced)

These combined checklists are **deprecated** — use **DEV-V-###** suites instead. Kept briefly for reference until split.

<details>
<summary>DEV-T-002 — Campaign & rolls (use DEV-V-002 when split)</summary>

**Where:** `/campaigns` · **Needs:** owner + member accounts optional  
Multi-step checklist — see TASK-329 notes. Split into DEV-V-002 on next touch.

</details>

<details>
<summary>DEV-T-003 — Admin roles (use DEV-V-003 when split)</summary>

**Where:** `/admin/users` · **Needs:** admin account

</details>

<details>
<summary>DEV-T-004 — Storage & account (use DEV-V-004 when split)</summary>

**Where:** character portrait, `/my-account`

</details>

<details>
<summary>DEV-T-005 — RLS (use DEV-V-005 when split)</summary>

**Where:** `/crafting`, `/library`, campaigns, Supabase console

</details>

<details>
<summary>DEV-T-006 — Resources PDF (use DEV-V-006 when split)</summary>

**Where:** `/resources`, prod PDF URL

</details>

<details>
<summary>DEV-T-007 — Auth UI (use DEV-V-007 when split)</summary>

**Where:** `/login`, `/register` — Google only, no Apple

</details>

---

## Decisions (optional)

| ID | Topic | Status / recommendation |
|----|-------|-------------------------|
| **DEV-Q01** | Apple sign-in | **Resolved:** hidden on login/register until OAuth is implemented. |
| **DEV-Q02** | Username enumeration | **Resolved:** `usernames` SELECT restricted to own row (SQL applied 2026-06-13). |
| **DEV-Q03** | TASK-313 hook merge | **Resolved:** Option B — single scoped `use-enhanced-items.ts`. |

---

## Workflow cheat sheet

| AI task status | Your job |
|----------------|----------|
| `done` | Run the linked **DEV-V-###** suite in `BUILD_VALIDATION.md`; report each test. |
| `partial` | Run tests for `completed_work` only; read `remaining_work` in `AI_TASK_QUEUE.md`. |
| `blocked` | Often points here (DEV-001, etc.). |

When a suite is fully verified: note in the task’s `notes` or mark tests PASS in your QA log.
