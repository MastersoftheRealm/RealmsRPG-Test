# RealmsRPG — Agent Instructions

Next.js, React, Tailwind, Supabase, Vercel. No Prisma. Game runner = **RM** (Realm Master), never "GM". Repo `MastersoftheRealm/RealmsRPG-Test`, branch **`master`**. Never push `master`. Never merge.

This file is already in the prompt. Do not re-read it. Kickoffs point at the workflow. Do not paste the playbook.

## Before coding

1. The ClickUp task: title, acceptance criteria, latest comments. ClickUp is the only work queue.
2. Search `FEATURE_INDEX.md` if you might add a component, hook, store, or service.

That is the list. Do not open the Drive playbook, `DECISIONS.md`, `ARCHITECTURE_CONSTITUTION.md`, `ACTIVE_TASKS.md`, `AI_TASK_QUEUE.md`, `WAITING_TASKS.md`, `AI_CHANGELOG.md`, or `AGENT_GUIDE.md` before you code.

## On demand

Read a doc when the diff touches that topic. Search, do not load the whole file.

| Topic | Read |
|-------|------|
| Layout | `src/docs/MOBILE_UX.md` (mobile and accessibility rules attach when a `.tsx` file is in context) |
| Game math or a missing written rule | `src/docs/GAME_RULES.md`. Hold if the rule is not written. Do not invent a formula. |
| Settled product ruling | Search `src/docs/ai/DECISIONS.md` for the topic |
| PR review (before Human OK) | `src/docs/ai/PR_REVIEWER_BRIEF.md` |
| Schema or SQL | `src/docs/SUPABASE_SCHEMA.md`. Codex writes: `realms-codex-data` rule. **New `public` tables:** every `CREATE TABLE` in `sql/` must, in the **same file**, enable RLS, add policies, and `GRANT` explicitly — `SELECT, INSERT, UPDATE, DELETE` to `authenticated` and `service_role`; `SELECT` to `anon` only if the table is public-read. Template: `sql/_TEMPLATE_new_table.sql`. |
| New shared UI, store, API contract, or migration strategy | `src/docs/ai/ARCHITECTURE_CONSTITUTION.md` |
| What already exists | `FEATURE_INDEX.md` and the barrels |

## Order

The status order is `.cursor/rules/realms-tasks.mdc`. It is already in the prompt. Do not restate it. In prose say Bob (`95261690`). Collin is `44381886`. Agents do not mark a task **complete**.

Model slugs: `.cursor/rules/realms-model-routing.mdc`. Never a slug ending in `-fast`. Do not start Claude or GPT.

Drive still says to read the playbook first and to run `npm run build` plus `npm run tasks:validate` before a PR. Kadin approved a different order on 2026-10-11 and will update Drive himself. The Google Doc was not edited.
