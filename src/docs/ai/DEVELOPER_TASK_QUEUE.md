# Developer Task Queue

What **you** need to do that AI cannot (Dashboard, prod validation, decisions). For implementation work see [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md).

**QA / owner:** Run **Build validation** suites in [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md) — one test per row, report PASS/FAIL/SKIP.

**Agents:** When you finish a user-facing task (`done` or `partial`), add granular tests to `BUILD_VALIDATION.md` and index the suite below. See [`AGENT_GUIDE.md`](AGENT_GUIDE.md).

**Last updated:** 2026-06-13

---

## Required actions (Dashboard / one-off)

| ID | Task | What to do | Why AI can't |
|----|------|------------|--------------|
| **DEV-001** | [TASK-353](AI_TASK_QUEUE.md) — HIBP | Supabase Dashboard → **Authentication** → Password → enable **Leaked password protection**. Project: `RealmsRPG-Test` (`lbqhiwudvifmkjtkccdg`). [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) | Dashboard-only |

---

## Build validation index

Each suite is a **category** of step-by-step tests. Full steps live in [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md). Do not run cramped multi-behavior checklists — use individual **DEV-V-###-T###** tests.

| Suite | Category | Related task(s) | Tests | Status |
|-------|----------|-----------------|-------|--------|
| **DEV-V-001** | Character creator step guards | TASK-356 | T001–T015 (15) | Ready — [open suite](BUILD_VALIDATION.md#dev-v-001--character-creator-step-guards) |
| DEV-V-002 | Campaign & rolls security | TASK-329 | — | Planned (legacy DEV-T-002) |
| DEV-V-003 | Admin role change safety | TASK-330 | — | Planned |
| DEV-V-004 | Storage & account security | TASK-326, TASK-331 | — | Planned |
| DEV-V-005 | RLS / DB migrations | TASK-354, username RLS | — | Planned |
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
