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
| Schema or SQL | `src/docs/SUPABASE_SCHEMA.md`. Codex writes: `realms-codex-data` rule |
| New shared UI, store, API contract, or migration strategy | `src/docs/ai/ARCHITECTURE_CONSTITUTION.md` |
| What already exists | `FEATURE_INDEX.md` and the barrels |

## Write

- Branch `bug|feat/<clickUpId>-short-slug` from current `origin/master`. One task, one branch, one PR.
- Put the ClickUp id in the branch and the PR. Comment the task with what changed and how to test. Move status when Kadin has told you to write to ClickUp.
- Add a regression test from the repro and run that test. CI runs typecheck, the full unit suite, and the build.
- User-facing work: QA steps on the ClickUp comment. Add a `BUILD_VALIDATION.md` row only when that suite does not already cover the check.

## Do not write

- `AI_CHANGELOG.md`. History stays. New per-bug entries are not required. Do not start another log.
- `ACTIVE_TASKS.md`, `AI_TASK_QUEUE.md`, and `TASK-###` in commit subjects. ClickUp, the PR, and the task comment are the record.
- A hold that exists only in `WAITING_TASKS.md`. Leave it. New holds go on the ClickUp task.
- Doc nits. They are not a second pass.

## Check

- `/audit` before merge, on a different model than the implementer. Read the diff and the rules that diff touches. Do not re-read the constitution.
- A miss on a cross-system or layout interaction steps up once. Do not redo that bug on the same model. The re-audit checks only the failed point.
- `/cleanup` only for an in-scope behavior or code gap from that audit.
- `/global-audit` and `/debt` are unused on a task.

Model slugs: `.cursor/rules/realms-model-routing.mdc`. Never a slug ending in `-fast`. Do not start Claude or GPT.

Drive still says to read the playbook first and to run `npm run build` plus `npm run tasks:validate` before a PR. Kadin changed that on 2026-10-11. The Google Doc was not edited.
