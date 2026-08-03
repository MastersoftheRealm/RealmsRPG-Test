# RealmsRPG — Agent Instructions

You are working on RealmsRPG, a D&D Beyond–like TTRPG web app built with Next.js, React, Tailwind, **Supabase** (PostgreSQL, Auth, Storage), and **Vercel**.

> **Stack:** Supabase + Next.js + Vercel. No Prisma; no Firebase.  
> **Data:** Supabase client (`.from()`, `.rpc()`); schema = `src/docs/SUPABASE_SCHEMA.md`; SQL in `sql/`.

## Session Start

1. Read **`src/docs/ai/ARCHITECTURE_CONSTITUTION.md`** (roles, DoD, non-negotiables).
2. Read **`src/docs/ai/ACTIVE_TASKS.md`** — pick work; skip `blocked` + human `assignee:`.
3. When implementing: search **`FEATURE_INDEX.md`** + barrels before building anything new.
4. Owner feedback → log in `ALL_FEEDBACK_CLEAN.md` and process per `realms-tasks.mdc`.

Do **not** load full historical queues, full `AGENT_GUIDE.md`, or archive audits at session start. Pull topic docs on demand.

## Roles

- **Implementer** (default): extend existing patterns only.
- **Architect** (rare): new shared UI, stores, API contracts, migrations → ADR in `src/docs/ai/ADR/` or owner ack.

## Source-of-Truth Map

| For… | Authority |
|------|-----------|
| Product / UX / selection grammar | `REALMS_PRODUCT_OVERVIEW.md` + `human/USER_EXPERIENCE_GOALS.md` |
| Exists already? | `FEATURE_INDEX.md` → `shared` / `ui` / `hooks` / `services` barrels |
| DB schema | `SUPABASE_SCHEMA.md` |
| Game formulas & terminology | `GAME_RULES.md` |
| GLR required facts (column vs chip) | `lib/glr/required-facts-registry.ts` (ADR-0009) |
| Deep component patterns | `AGENT_GUIDE.md` hub → `guide/` appendices (on demand) |
| Design tokens | `DESIGN_SYSTEM.md` — prefer `*-fg` tokens |
| Mobile | `MOBILE_UX.md` |
| Accessibility | `ACCESSIBILITY.md` |
| Open tasks | `ACTIVE_TASKS.md` · waiting `WAITING_TASKS.md` · process `AI_TASK_QUEUE.md` · human `DEVELOPER_TASK_QUEUE.md` |
| Audit remediation status | `REMEDIATION_STATUS_2026-08.md` (June snapshot: `REMEDIATION_STATUS_2026-06.md`) |
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
- Mobile + a11y on every UI change (`MOBILE_UX.md`, `ACCESSIBILITY.md`).
- Prefer theme-aware `*-fg` status/archetype tokens over numbered ramp + ad-hoc `dark:`.

## Definition of Done (summary)

Build + targeted tests + all implementable AC met + no new parallel pattern + update `ACTIVE_TASKS` (move `done` to archive with `verification_status`) + changelog. User-facing work: `pending-qa` until owner runs `BUILD_VALIDATION` (see `DEVELOPER_TASK_QUEUE`). Incomplete → `partial` + follow-ups. Never mark `done` early.

## Migrations (one policy)

Prefer **Supabase MCP `apply_migration`** when available; else **Dashboard SQL Editor**. Always keep SQL in `sql/` and update `SUPABASE_SCHEMA.md`. **Codex data:** audit → propose → owner approve → apply. See `realms-codex-data.mdc`.

## Creating tasks

Template: `AI_REQUEST_TEMPLATE.md` → add to `ACTIVE_TASKS.md`.
