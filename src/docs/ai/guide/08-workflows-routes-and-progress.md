> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Workflows, Routes & Progress

## Pages / Routes

- `(main)/characters`, `(main)/characters/[id]`
- `(main)/characters/new` — Simple vs Advanced chooser
- `(main)/characters/new/guided` — Guided ("Simple") creator
- `(main)/characters/new/advanced` — Classic 9-step creator
- `(main)/library` — user items (powers, techniques, armaments, creatures)
- `(main)/codex` — browse all content
- `(main)/power-creator`, `(main)/technique-creator`, `(main)/item-creator`, `(main)/creature-creator`
- `(main)/encounters`, `(main)/crafting`, `(main)/my-account`, `(main)/rules`, `(main)/privacy`, `(main)/terms`, `(main)/resources`
- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `(auth)/forgot-username`

## Recording Progress

| What | Where |
|------|-------|
| Open tasks | `src/docs/ai/ACTIVE_TASKS.md` |
| Task process | `src/docs/ai/AI_TASK_QUEUE.md` |
| Done archive | `src/docs/ai/archive/TASK_QUEUE_DONE.md` |
| Changelog | `src/docs/ai/AI_CHANGELOG.md` |
| Raw feedback | `src/docs/ALL_FEEDBACK_CLEAN.md` |
| Game rules | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions |
| **Current remediation status** | `src/docs/ai/REMEDIATION_STATUS_2026-06.md` — current completion/open-gap truth and execution sequencing for deferred work. |
| Historical audits & task backup | `src/docs/ai/archive/HISTORY_INDEX.md` — June 2026 audits, full queue backup, older plans |
| Codebase audit (historical) | `src/docs/ai/archive/CODEBASE_AUDIT_2026-02-13.md` — 98-finding audit with 6-phase fix plan |
| Unification audit (historical) | `src/docs/ai/archive/UNIFICATION_AUDIT_2026-02-20.md` — shared logic, creators, libraries, allocation, centralized sources of truth |
| Modal unification audit (historical) | `src/docs/ai/archive/MODAL_UNIFICATION_AUDIT_2026-02-20.md` — list modals (add-X, load, selection): logic, styles, EmptyState/LoadingState, FilterSection, alignment with Codex/Library. See TASK-264. |
| **Performance & edge usage** | `src/docs/PERFORMANCE_AND_EDGE.md` — Vercel CDN/edge requests, proxy matcher, cache headers, prefetch, polling; checklist for new public APIs and hooks. |
| **Mobile UX** | `src/docs/MOBILE_UX.md` — breakpoints, touch targets, full-screen modals, dense-layout strategy (side-scroll vs collapse). When adding a new page or modal, follow MOBILE_UX.md and the Agent checklist there. |
| **User experience goals** | `src/docs/human/USER_EXPERIENCE_GOALS.md` — human reference; update when completing UX tasks |

## Mobile

- **Modals:** Use `fullScreenOnMobile` on `Modal` for selection, add-X, load, recovery, level-up, settings, and other large dialogs so they render full-screen on viewports &lt; 768px.
- **Dense layouts:** Prefer **side-scroll** between section panels on mobile; use **Collapsible** when sections are few or content is lighter. See MOBILE_UX.md.
- **New/edited UI:** Check the Agent checklist in MOBILE_UX.md (breakpoints, touch targets ≥44px, list/table patterns).

## Creating New Tasks

Use `src/docs/ai/AI_REQUEST_TEMPLATE.md` format. Add to `ACTIVE_TASKS.md` with next TASK-### ID.
Create tasks when: audits reveal issues; implementation uncovers follow-up work; complex work needs phase breakdown.
Set `priority`, `status: not-started`, `related_files`, and clear `acceptance_criteria`.

## Scripts

- `node scripts/extract_feedback.js` — Convert raw feedback → tasks
- `node scripts/triage_tasks.js` — Infer related_files for tasks (--apply to update)
- `node scripts/session_submit.js "feedback..."` — Append feedback, extract, triage
- `npm run tasks:validate` — Strict reconcile + doc/path/related_files checks (CI)
- `node scripts/reconcile_tasks.js --strict --strict-since=2026-07-15` — TASK-### ↔ commits (baseline allowlist for legacy)
