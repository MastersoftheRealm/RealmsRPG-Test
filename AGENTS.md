# RealmsRPG — Agent Instructions

You are working on RealmsRPG, a D&D Beyond–like TTRPG web app built with Next.js, React, Tailwind, **Supabase** (PostgreSQL, Auth, Storage), and **Vercel**.

> **Stack:** Supabase (PostgreSQL, Auth, Storage), Next.js, Vercel. No Prisma; no Firebase.
> **Data access:** Supabase server client only (`.from()`, `.rpc()`); schema reference `src/docs/SUPABASE_SCHEMA.md`; migrations = SQL only.

## Session Start

1. **Read** `src/docs/ai/AI_TASK_QUEUE.md` — focus on `not-started` / `in-progress` tasks; skip `done`.
2. **Read** `src/docs/ai/AGENT_GUIDE.md` — component locations, patterns, sources of truth.
3. **When owner gives feedback:** Log it in `src/docs/ALL_FEEDBACK_CLEAN.md` (Raw Feedback Log) and process per `.cursor/rules/realms-tasks.mdc` (extract, cross-ref queue, add tasks or implement).
4. **Reference when needed:** see the Source-of-Truth Map below.

## Source-of-Truth Map (read the right doc first)

Check the canonical source for the topic instead of trusting scattered/stale docs. Each topic has **one** authority:

| For… | Read (authority) |
|------|------------------|
| **Does this already exist?** (features, components, hooks, services) | `src/docs/ai/FEATURE_INDEX.md` → then `src/components/shared/index.ts`, `src/hooks/index.ts` |
| DB tables / columns | `src/docs/SUPABASE_SCHEMA.md` (only) |
| Game formulas, terminology, caps, display | `src/docs/GAME_RULES.md` |
| Data flow, enrichment, hooks/services | `src/docs/ARCHITECTURE.md` |
| Shared UI components & usage | `.cursor/rules/realms-unification.mdc` + `src/components/shared/index.ts` |
| Design tokens / colors | `src/docs/DESIGN_SYSTEM.md` |
| Mobile patterns | `src/docs/MOBILE_UX.md` |
| Accessibility / contrast | `src/docs/ACCESSIBILITY.md` |
| Open tasks / task history | `src/docs/ai/AI_TASK_QUEUE.md` / `src/docs/ai/archive/TASK_QUEUE_DONE.md` |
| Current audit & known issues | `src/docs/ai/FULL_AUDIT_2026-06.md` |
| Deploy / secrets | `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` |
| Owner feedback log | `src/docs/ALL_FEEDBACK_CLEAN.md` |

> Rules in `.cursor/rules/` are terse pointers into these authorities — they don't duplicate the full content. If a rule and an authority disagree, trust the authority and fix the rule.

## Core Principles

- **Search before you build (anti-re-implementation)** — Before writing a new component, hook, service, API route, or util, confirm it doesn't already exist: check `src/docs/ai/FEATURE_INDEX.md`, then grep `src/components/shared/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`, and `src/lib/`. Many features here were accidentally rebuilt by agents who didn't know they existed.
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
