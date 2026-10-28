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

The status order is `.cursor/rules/realms-tasks.mdc`. It is already in the prompt. In prose say Bob (`95261690`; James Owenby). Collin is `44381886`. Agents do not mark a task **complete**.

Model slugs: `.cursor/rules/realms-model-routing.mdc`. Never a slug ending in `-fast`. Do not start Claude or GPT.

**Drive vs repo:** [Realms Dev Workflow](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) and [Realms Web Decisions](https://docs.google.com/document/d/1tGebelYXZPegt4iZiycOjI3RBHD6N_QKZW6CI0ckxkg/edit) were updated **2026-10-28** (Editor bot) to point at `src/docs/ai/PR_REVIEWER_BRIEF.md` instead of duplicating review steps. The brief is the single written review process in the repo. When Drive and a repo copy conflict, **Drive wins** and the repo is corrected (Oct 5, 2026). Session start order follows this file and `realms-tasks.mdc` (Kadin, 2026-10-11), not “read the whole playbook first.”
