# RealmsRPG — Agent Instructions

You are working on RealmsRPG, a D&D Beyond–like TTRPG web app built with Next.js, React, Tailwind, **Supabase** (PostgreSQL, Auth, Storage), **Prisma**, and **Vercel**.

> **Stack:** Supabase (PostgreSQL, Auth, Storage), Prisma, Next.js, Vercel. No Firebase.

## Session Start

1. **Read** `src/docs/ai/AI_TASK_QUEUE.md` — focus on `not-started` / `in-progress` tasks; skip `done`.
2. **Read** `src/docs/ai/AGENT_GUIDE.md` — component locations, patterns, sources of truth.
3. **When owner gives feedback:** Log it in `src/docs/ALL_FEEDBACK_CLEAN.md` (Raw Feedback Log) and process per `.cursor/rules/realms-tasks.mdc` (extract, cross-ref queue, add tasks or implement).
4. **Reference when needed:** `GAME_RULES.md`, `ARCHITECTURE.md` (formulas, data flow); `USER_EXPERIENCE_GOALS.md` for UX/onboarding/copy.

## Core Principles

- **Learn once, use forever** — Reuse components (`GridListRow`, `SkillRow`, `ValueStepper`, `SectionHeader`, etc.). Consistent filters, sorting, and allocation across Library, Codex, Character Sheet, and Creators.
- **Unification over duplication** — Before adding a component, search for existing patterns. Use design tokens (`bg-surface`, `text-text-primary`, etc.) not raw `gray-*` outside auth.
- **Verify, don’t assume** — Docs may be stale. Inspect the codebase to confirm patterns and usage.
- **Consider mobile on every UI change** — See `src/docs/MOBILE_UX.md` and `.cursor/rules/realms-mobile.mdc`. New pages, modals, and dense sections must follow breakpoints, full-screen modals on small viewports (`fullScreenOnMobile`), and touch targets (≥44px).
- **Accessibility & contrast** — See `src/docs/ACCESSIBILITY.md` and `.cursor/rules/realms-accessibility.mdc`. Use semantic tokens and status colors that pass WCAG 2.1 AA in **both light and dark mode** (e.g. `text-success-700` not `text-success-600` for body text; `text-power-dark` / `text-martial-dark` for archetype body text). Every form control needs a label or `aria-label`; heading levels must not skip (h1 → h2 → h3). Modals need a title or `titleA11y`.

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
