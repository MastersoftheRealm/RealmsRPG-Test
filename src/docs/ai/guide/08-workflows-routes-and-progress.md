> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Workflows, Routes & Progress

## Pages / Routes

- `(main)/characters`, `(detail)/characters/[id]`
- `(main)/characters/new` — Guided / Custom / Legacy chooser
- `(main)/characters/new/guided` — Guided ("Simple") creator
- `(main)/characters/new/advanced` — Classic 9-step creator
- `(main)/library` — user items (powers, techniques, armaments, creatures)
- `(main)/codex` — browse all content
- `(main)/power-creator`, `(main)/technique-creator`, `(main)/item-creator`, `(main)/creature-creator`
- `(main)/encounters`, `(main)/crafting`, `(main)/my-account`, `(main)/rules`, `(main)/privacy`, `(main)/terms`, `(main)/resources`
- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`

## Recording Progress

The record is the ClickUp task and the PR. Status moves are in `.cursor/rules/realms-tasks.mdc`. Do not write the files in this table. They are history.

| What | Where |
|------|-------|
| Open tasks (history) | `src/docs/ai/archive/ACTIVE_TASKS.md` |
| Task process (retired) | `src/docs/ai/archive/AI_TASK_QUEUE.md` |
| Done archive (history) | ClickUp / git history (repo `TASK_QUEUE_DONE` removed) |
| Changelog (history) | Git history / ClickUp (repo changelog archive removed) |
| Raw feedback (history) | ClickUp comments / Drive (repo archive removed) |
| Game rules | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions |
| **Remediation status (history)** | `src/docs/ai/archive/REMEDIATION_STATUS_2026-08.md` (Aug 2026 snapshot). June: `archive/REMEDIATION_STATUS_2026-06.md`. Current status: ClickUp. |
| Historical audits & task backup | `src/docs/ai/archive/HISTORY_INDEX.md` — Aug/July/June 2026 audits, full queue backup, older plans |
| Codebase audit (historical) | Aug 2026 audit report removed from repo; older: `CODEBASE_AUDIT_2026-02-13.md` |
| Unification audit (historical) | `src/docs/ai/archive/UNIFICATION_AUDIT_2026-02-20.md` — shared logic, creators, libraries, allocation, centralized sources of truth |
| Modal unification audit (historical) | `src/docs/ai/archive/MODAL_UNIFICATION_AUDIT_2026-02-20.md` — list modals (add-X, load, selection): logic, styles, EmptyState/LoadingState, FilterSection, alignment with Codex/Library. See TASK-264. |
| **Performance & edge usage** | `src/docs/PERFORMANCE_AND_EDGE.md` — Vercel CDN/edge requests, proxy matcher, cache headers, prefetch, polling; checklist for new public APIs and hooks. Web Analytics ops: `DEPLOYMENT_AND_SECRETS_SUPABASE.md` Step 3b. |
| **Responsive UX** | `src/docs/MOBILE_UX.md` (ADR-0023) — six-width contracts, tiered touch targets, full-screen modals, dense-layout strategy. When adding a new page or modal, follow MOBILE_UX.md and the Agent checklist there. |
| **User experience goals** | `src/docs/human/USER_EXPERIENCE_GOALS.md` — human reference; update when completing UX tasks |

## Mobile

- **Modals:** Use `fullScreenOnMobile` on `Modal` for selection, add-X, load, recovery, level-up, settings, and other large dialogs so they render full-screen on viewports &lt; 768px.
- **Dense layouts:** Prefer **side-scroll** between section panels on mobile; use **Collapsible** when sections are few or content is lighter. See MOBILE_UX.md.
- **New/edited UI:** Check the Agent checklist in MOBILE_UX.md (six widths, touch *tier*, C1–C6, list/table patterns).

## Creating New Tasks

File new tasks in **ClickUp** via Clickup Manager (or directly on Kadin's orders). Do not append `ACTIVE_TASKS.md` or `AI_TASK_QUEUE.md` (archived under `src/docs/ai/archive/`).
Create tasks when: audits reveal issues; implementation uncovers follow-up work; complex work needs phase breakdown.
Set `priority`, `status: not-started`, `related_files`, and clear `acceptance_criteria`.

## Scripts

- `node scripts/extract_feedback.js` — Convert raw feedback → tasks
- `node scripts/triage_tasks.js` — Infer related_files for tasks (--apply to update)
- (removed 2026-08) `scripts/session_submit.js` — deleted as dead tooling; run `extract_feedback.js` then `triage_tasks.js` directly
- `npm run tasks:validate` — Doc/path/related_files checks + local strict reconcile (`--allow-uncommitted-done`; CI omits that flag)
- `node scripts/reconcile_tasks.js` — fails on duplicate `- id:` in `archive/ACTIVE_TASKS.md`, `archive/WAITING_TASKS.md`, and any live `archive/TASK_QUEUE_DONE*.md` still present (not dated snapshots). Commit-subject gate is retired.
