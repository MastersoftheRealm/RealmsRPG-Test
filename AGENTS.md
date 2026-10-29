# RealmsRPG — Agent Instructions

Next.js, React, Tailwind, Supabase, Vercel. No Prisma. Game runner = **RM** (Realm Master), never "GM". Repo `MastersoftheRealm/RealmsRPG-Test`, branch **`master`**. Never push `master`. Never merge.

This file is already in the prompt. Do not re-read it. Kickoffs point at the workflow. Do not paste the playbook.

## Before coding

1. The ClickUp task: title, acceptance criteria, latest comments. ClickUp is the only work queue.
2. Search `FEATURE_INDEX.md` if you might add a component, hook, store, or service.

That is the list. Do not open the Drive playbook, `DECISIONS.md`, `ARCHITECTURE_CONSTITUTION.md`, `ACTIVE_TASKS.md`, `AI_TASK_QUEUE.md`, `WAITING_TASKS.md`, `AI_CHANGELOG.md`, or `AGENT_GUIDE.md` before you code.

## One source per fact

Every fact lives in exactly one authoritative file; other docs **link** to it instead of restating. Game-rule numbers and formulas are referenced by their `core_rules` key (see `src/docs/ai/ARCHITECTURE_CONSTITUTION.md` **Source of truth** for which doc owns which topic), never retyped in code or prose. Any PR that changes behavior must **update or delete** the old doc text in the same PR so nothing stale remains.

## Deferred code areas

Do not copy patterns from paths listed in root [`DEFERRED.md`](DEFERRED.md); use them only for bug fixes in those areas. Remove an entry from `DEFERRED.md` when the area is reworked.

## On demand

Read a doc when the diff touches that topic. Search, do not load the whole file.

| Topic | Read |
|-------|------|
| Layout | `src/docs/MOBILE_UX.md` (mobile and accessibility rules attach when a `.tsx` file is in context) |
| Game math or a missing written rule | `src/docs/GAME_RULES.md`. Hold if the rule is not written. Do not invent a formula. |
| Settled product ruling | Search `src/docs/ai/DECISIONS.md` for the topic |
| PR review (before Human OK) | `src/docs/ai/PR_REVIEWER_BRIEF.md` |
| PR description template | `.github/PULL_REQUEST_TEMPLATE.md` |
| Pre-merge writer checklist | `src/docs/ai/PR_CHECKLIST.md` (link only; do not duplicate) |
| Schema or SQL | `src/docs/SUPABASE_SCHEMA.md`. Codex writes: `realms-codex-data` rule. **New `public` tables:** every `CREATE TABLE` in `sql/` must, in the **same file**, enable RLS, add policies, and `GRANT` explicitly — `SELECT, INSERT, UPDATE, DELETE` to `authenticated` and `service_role`; `SELECT` to `anon` only if the table is public-read. Template: `sql/_TEMPLATE_new_table.sql`. |
| New shared UI, store, API contract, or migration strategy | `src/docs/ai/ARCHITECTURE_CONSTITUTION.md` |
| What already exists | `FEATURE_INDEX.md` and the barrels |

## Order

The status order is `.cursor/rules/realms-tasks.mdc`. It is already in the prompt. In prose say Bob (`95261690`; James Owenby). Collin is `44381886`. Agents do not mark a task **complete**.

Model slugs: `.cursor/rules/realms-model-routing.mdc`. Never a slug ending in `-fast`. Do not start Claude or GPT.

**Workflow (repo):** ClickUp status order — `.cursor/rules/realms-tasks.mdc`. PR review checklist — `src/docs/ai/PR_REVIEWER_BRIEF.md`. PR body — [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Full authority map (including Drive vs repo): [`src/docs/ai/ARCHITECTURE_CONSTITUTION.md`](src/docs/ai/ARCHITECTURE_CONSTITUTION.md) (**Source of truth**). Session start follows this file and `realms-tasks.mdc` (Kadin, 2026-10-11), not the full playbook up front.
