# RealmsRPG — Agent Instructions

You are working on RealmsRPG, a D&D Beyond–like TTRPG web app built with Next.js, React, Tailwind, **Supabase** (PostgreSQL, Auth, Storage), **Prisma**, and **Vercel**.

> **Stack:** Supabase (PostgreSQL, Auth, Storage), Prisma, Next.js, Vercel. No Firebase.

## Session Start

1. **Read** `src/docs/ai/AI_TASK_QUEUE.md` — current tasks and priorities.
2. **Read** `src/docs/ai/AGENT_GUIDE.md` — component locations, patterns, sources of truth.
3. **Check** `src/docs/ALL_FEEDBACK_CLEAN.md` — raw owner feedback (convert new entries to tasks if needed).
4. **When acting on owner feedback** (whether creating tasks or implementing directly): always append the raw feedback to `src/docs/ALL_FEEDBACK_CLEAN.md` under Raw Feedback Log (date, context, priority, feedback text). Do not skip logging when you implement on the spot.
5. **Reference when needed:** `src/docs/GAME_RULES.md`, `src/docs/ARCHITECTURE.md` (terminology, formulas, data flow).

## Core Principles

- **Learn once, use forever** — Reuse components (`GridListRow`, `SkillRow`, `ValueStepper`, `SectionHeader`, etc.). Consistent filters, sorting, and allocation across Library, Codex, Character Sheet, and Creators.
- **Unification over duplication** — Before adding a component, search for existing patterns. Use design tokens (`bg-surface`, `text-text-primary`, etc.) not raw `gray-*` outside auth.
- **Verify, don’t assume** — Docs may be stale. Inspect the codebase to confirm patterns and usage.

## Implementation

- Pick highest-priority `not-started` task from the queue.
- **Verify** all acceptance criteria are fully met before marking done.
- Verify `related_files` in the task match actual codebase paths (queue may have stale references).
- Update task status (`in-progress` → `done`), add notes with PR link.
- Append to `src/docs/ai/AI_CHANGELOG.md` on completion.
- Run `npm run build` before opening a PR.

## Creating New Tasks

Use `src/docs/ai/AI_REQUEST_TEMPLATE.md` format. Add to `AI_TASK_QUEUE.md` with next TASK-### ID. Create tasks when audits or implementation reveal additional work.

## Deployment & Secrets

See `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` — env vars, Vercel config, Supabase keys.
