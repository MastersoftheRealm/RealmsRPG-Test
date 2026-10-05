# RealmsRPG — Agent Instructions

You are working on RealmsRPG, a D&D Beyond–like TTRPG web app built with Next.js, React, Tailwind, **Supabase** (PostgreSQL, Auth, Storage), and **Vercel**.

> **Stack:** Supabase + Next.js + Vercel. No Prisma; no Firebase.  
> **Data:** Supabase client (`.from()`, `.rpc()`); schema = `src/docs/SUPABASE_SCHEMA.md`; SQL in `sql/`.
> **Product:** realmsrpg.com (Realms TTRPG). Game runner = **Realm Master (RM)** — never "GM".
> **Repo:** `MastersoftheRealm/RealmsRPG-Test` (canonical branch **`master`**). Hosting: Vercel. DB: Supabase. Tracker: ClickUp.

## Session Start

1. Read the **[Realms Dev Workflow & Agent Rules](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit)** (process playbook — Drive SoT).
2. Read **`src/docs/ai/DECISIONS.md`** (repo copy of the Drive decisions file; Drive wins on conflict).
3. Read **`src/docs/ai/ARCHITECTURE_CONSTITUTION.md`** (roles, DoD, coding constraints).
4. Pick work from **ClickUp** (the only work queue). `ACTIVE_TASKS.md` / TASK-### are optional engineering notes, not the work picker.
5. When implementing: search **`FEATURE_INDEX.md`** + barrels before building anything new.
6. Owner feedback → log in `ALL_FEEDBACK_CLEAN.md` and process per `realms-tasks.mdc`.

**AI policy:** Follow the ClickUp wiki page **[Using AI at Realms](https://app.clickup.com/8631005/v/dc/8cqwdmc-517)** — no art, creative names, lore, or flavor text; technical work only.

Do **not** load full historical queues, full `AGENT_GUIDE.md`, or archive audits at session start. Pull topic docs on demand.

## Git Rules

- **Never push directly to `master`.** Every change goes through a PR.
- **Never merge PRs.** Collin merges normally; Kadin may bypass-merge per the workflow doc.
- Branch naming: `bug|feat/<clickUpId>-short-slug`.
- Before opening a PR: `npm run build` + `npm run tasks:validate`.

## Roles

- **Implementer** (default): extend existing patterns only.
- **Architect** (rare): new shared UI, stores, API contracts, migrations → ADR in `src/docs/ai/ADR/` or owner ack.

## Source-of-Truth Map

| For… | Authority |
|------|-----------|
| Process / workflow | [Realms Dev Workflow & Agent Rules](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) (Drive SoT) |
| Settled product/QA decisions | [Realms Web Decisions](https://docs.google.com/document/d/1tGebelYXZPegt4iZiycOjI3RBHD6N_QKZW6CI0ckxkg/edit) (Drive SoT) → repo copy `src/docs/ai/DECISIONS.md` |
| AI creative policy | ClickUp wiki [Using AI at Realms](https://app.clickup.com/8631005/v/dc/8cqwdmc-517) |
| Work queue | **ClickUp only** — `ACTIVE_TASKS.md` / TASK-### are optional engineering notes |
| Product / UX / selection grammar | `REALMS_PRODUCT_OVERVIEW.md` + `human/USER_EXPERIENCE_GOALS.md` |
| Exists already? | `FEATURE_INDEX.md` → `patterns` / `ui` / `hooks` / `services` barrels |
| DB schema | `SUPABASE_SCHEMA.md` |
| Game formulas & terminology | `GAME_RULES.md` |
| GLR required facts (column vs chip) | `lib/glr/glr-fact-catalog.ts` + `glr-density.ts` + `resolve-glr-fact-layout.ts` (ADR-0016; supersedes ADR-0009) |
| Deep component patterns | `AGENT_GUIDE.md` hub → `guide/` appendices (on demand) |
| Design tokens | `DESIGN_SYSTEM.md` — prefer `*-fg` tokens |
| Responsive / mobile | `MOBILE_UX.md` (ADR-0023) |
| Accessibility | `ACCESSIBILITY.md` — **WCAG 2.2 AA** everywhere |
| Open tasks (optional notes) | `ACTIVE_TASKS.md` · waiting `WAITING_TASKS.md` · process `AI_TASK_QUEUE.md` · human `DEVELOPER_TASK_QUEUE.md` |
| Audit remediation status | `REMEDIATION_STATUS_2026-08.md` (June snapshot: `REMEDIATION_STATUS_2026-06.md`) |
| **Sitewide audit (2026-08-13) + fix program** | `AUDIT_REMEDIATION_2026-08.md` → findings in `reports/audit-2026-08-13/` |
| Design constraints | `DESIGN_INTENT.md` |
| ADRs | `src/docs/ai/ADR/` |
| PR failure-mode checklist | `src/docs/ai/PR_CHECKLIST.md` (incl. owner commands) |
| Owner commands | `/audit` → `/cleanup` (session); `/global-audit` → `/debt` (repo) — `.cursor/commands/` |
| Barrel inventory (generated) | `FEATURE_INDEX_BARRELS.generated.md` (`npm run tasks:generate-index`) |
| QA steps | `BUILD_VALIDATION.md` |
| Deploy / secrets | `DEPLOYMENT_AND_SECRETS_SUPABASE.md` |
| Feedback log | `ALL_FEEDBACK_CLEAN.md` |
| History (not session-start) | `archive/HISTORY_INDEX.md` |

Rules under `.cursor/rules/` are terse pointers. If a rule and an authority disagree, trust the authority and fix the rule.

## Core Principles

- Search before you build (anti-re-implementation).
- Unification over duplication; delete parallel systems when consolidating.
- Verify in code — docs can lag.
- Responsive + a11y on every UI change (`MOBILE_UX.md` / ADR-0023, `ACCESSIBILITY.md`).
- Prefer theme-aware `*-fg` status/archetype tokens over numbered ramp + ad-hoc `dark:`.
- **WCAG 2.2 AA** on all UI work.
- Terminology: **RM** (Realm Master), never "GM".

## Definition of Done (summary)

Build + targeted tests + all implementable AC met + no new parallel pattern + changelog. Every fixed bug adds a regression test from its repro when feasible. Link the ClickUp task ID in the PR. Optionally update `ACTIVE_TASKS` / archive engineering notes if used. Do **not** commit per task. User-facing work: `pending-qa` until owner or QA Tester runs validation (see `DEVELOPER_TASK_QUEUE`). Incomplete → `partial` + follow-ups. Never mark `done` early.

## Migrations (one policy)

Prefer **Supabase MCP `apply_migration`** when available; else **Dashboard SQL Editor**. Always keep SQL in `sql/` and update `SUPABASE_SCHEMA.md`. **Codex data:** audit → propose → owner approve → apply. See `realms-codex-data.mdc`.
