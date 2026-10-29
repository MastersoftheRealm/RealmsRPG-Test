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
| Open work | **ClickUp** (`.cursor/rules/realms-tasks.mdc`) |
| Done / changelog (history) | ClickUp comments and git history |
| Raw feedback (history) | ClickUp comments / Drive |
| Game rules | `src/docs/GAME_RULES.md` — terminology, formulas, display conventions |
| Codebase audits (history) | git history (repo audit snapshots removed) |
| **Performance & edge usage** | `src/docs/PERFORMANCE_AND_EDGE.md` — Vercel CDN/edge requests, proxy matcher, cache headers, prefetch, polling; checklist for new public APIs and hooks. Web Analytics ops: `DEPLOYMENT_AND_SECRETS_SUPABASE.md` Step 3b. |
| **Responsive UX** | `src/docs/MOBILE_UX.md` (ADR-0023) — six-width contracts, tiered touch targets, full-screen modals, dense-layout strategy. When adding a new page or modal, follow MOBILE_UX.md and the Agent checklist there. |
| **User experience goals** | `src/docs/human/USER_EXPERIENCE_GOALS.md` — human reference; update when completing UX tasks |

## Mobile

- **Modals:** Use `fullScreenOnMobile` on `Modal` for selection, add-X, load, recovery, level-up, settings, and other large dialogs so they render full-screen on viewports &lt; 768px.
- **Dense layouts:** Prefer **side-scroll** between section panels on mobile; use **Collapsible** when sections are few or content is lighter. See MOBILE_UX.md.
- **New/edited UI:** Check the Agent checklist in MOBILE_UX.md (six widths, touch *tier*, C1–C6, list/table patterns).

## Creating New Tasks

File new tasks in **ClickUp** via Clickup Manager (or directly on Kadin's orders). Do not recreate repo task-queue markdown files.
Create tasks when: audits reveal issues; implementation uncovers follow-up work; complex work needs phase breakdown.
Set `priority`, `status: not-started`, `related_files`, and clear `acceptance_criteria`.

## Scripts

- `npm run tasks:validate` — Doc/path checks (`tasks:validate-docs`, index, shared/ui allowlist)
