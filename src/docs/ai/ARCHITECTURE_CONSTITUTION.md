# Architecture Constitution

On demand. Do not load this file up front. PR Reviewer grades using `src/docs/ai/PR_REVIEWER_BRIEF.md`; it is not a second QA pass.

## Roles

| Role | When | Constraint |
|------|------|------------|
| **Implementer** (default) | Almost all tasks | Extend existing patterns only. No new shared component/store/API contract without Architect path. |
| **Architect** (rare) | New shared component, zustand store, API contract, migration strategy, or parallel pattern | Require ADR in `src/docs/ai/ADR/` **or** explicit owner ack in chat / ClickUp. Prefer deleting parallel systems over documenting them forever. |

## Session start

Read the ClickUp task. Search `FEATURE_INDEX.md` if you might add a pattern. That is the list. Root `AGENTS.md` is already in the prompt.

This file, the Drive playbook, and `DECISIONS.md` are on demand. Open this file for Architect-class work or a constraint the short rules do not name. Lighter session start: `AGENTS.md` (Kadin, 2026-10-11).

Do not read `ACTIVE_TASKS.md`, `AI_TASK_QUEUE.md`, `WAITING_TASKS.md`, `AI_CHANGELOG.md`, `AGENT_GUIDE.md`, or archives before coding.

## Source of truth (one authority per topic)

| Topic | Authority |
|-------|-----------|
| Process / workflow | ClickUp status order: `.cursor/rules/realms-tasks.mdc`. PR review checklist: `src/docs/ai/PR_REVIEWER_BRIEF.md` (single written process in repo). [Realms Dev Workflow](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) points to the brief (Drive updated **2026-10-28**, Editor bot). **Drive wins** on conflict; fix the repo copy. |
| Settled decisions | [Realms Web Decisions](https://docs.google.com/document/d/1tGebelYXZPegt4iZiycOjI3RBHD6N_QKZW6CI0ckxkg/edit) → repo `DECISIONS.md` (**Drive wins**; fix repo on conflict) |
| Work queue | **ClickUp only**. Writes use `CLICKUP_API_TOKEN` in `.env.local` (API v2), not the ClickUp plugin. |
| Product / UX intent | `REALMS_PRODUCT_OVERVIEW.md` + `human/USER_EXPERIENCE_GOALS.md` |
| Exists already? | `FEATURE_INDEX.md` → barrels |
| Schema | `SUPABASE_SCHEMA.md` |
| Game terms / formulas | `GAME_RULES.md` (if it conflicts with Drive Alpha on core text or math, Drive wins by default — ask Kadin before changing either side, since some entries may be test rules) |
| Shared UI patterns | `AGENT_GUIDE.md` hub → `guide/` appendices (on demand) + `realms-unification.mdc` |
| Tokens / contrast | `DESIGN_SYSTEM.md` + `ACCESSIBILITY.md` — prefer `*-fg` theme-aware tokens |
| Responsive / mobile | `MOBILE_UX.md` (ADR-0023 — six-width contracts, tiered touch targets) |
| Accessibility | `ACCESSIBILITY.md` — **WCAG 2.2 AA** everywhere |
| Design constraints | `DESIGN_INTENT.md` + `// DESIGN_INTENT:` comments |
| Architecture decisions | `ADR/` |

## Non-negotiables

- **Search before build** — never fork a parallel `Library*Tab` / load hook / upload path / parser.
- **Stack** — Next.js App Router, Supabase (no Prisma), Vercel. SQL in `sql/`; schema docs in `SUPABASE_SCHEMA.md`.
- **Lib layers** — `lib/game` + `lib/calculators` are neutral domain math (no imports from `lib/library` or `lib/guided-creator`). UI/creator layers import downward. See ADR-0010.
- **Migrations (one policy):** No production writes without **Kadin explicit OK** and a fresh backup. Prefer Supabase MCP `apply_migration` on non-production when available; else Dashboard SQL Editor. Always keep idempotent SQL in `sql/`. **Codex data** (`codex_*` / `core_rules`): audit → propose SQL → **Kadin explicit OK** → apply on the approved environment. See `guide/07-database-operations.md` and `realms-codex-data.mdc`.
- **Uploads** — client multipart via `apiUpload` from `@/lib/api-client` (not raw `fetch` to `/api/upload/*`).
- **Client errors** — API/Supabase boundary convention in `ARCHITECTURE.md` § Client error handling: `apiFetch` throws; check Supabase `{ error }`; no silent `catch` on user actions.
- **API error responses** — Route Handlers return `{ error: string }` on failure (4xx/5xx). Log raw Supabase/Postgres/storage errors server-side via `logApiError` / `apiErrorResponse` (`@/lib/api-error`); never expose `.message`, `.details`, or stack traces to clients in production. Optional `hint` / `debug` fields only when `?debug=1` (admin/non-prod) or `NODE_ENV=development`. Success payloads vary by route; errors do not.
- **Parsers** — domain parsers in `src/lib/game/` (e.g. `archetype-path.ts`); no admin-local forks.
- **UI gates** — keep `realms/no-raw-color`, contrast, visual/a11y Playwright. Prefer `text-success-fg` / `text-danger-fg` / `text-warning-fg` / `text-power-fg` / `text-martial-fg` over numbered ramp + ad-hoc `dark:`.
- **Mobile** — `fullScreenOnMobile` on large modals; ≥44px touch targets.
- **Accessibility** — **WCAG 2.2 AA** everywhere. Labels, contrast, modals, touch tiers per `MOBILE_UX.md`.
- **Git** — Status order, PR Reviewer, Human OK, merge, and testing: `.cursor/rules/realms-tasks.mdc`. Never push `master`. Never squash. Agents do not merge.

## Definition of Done

Acceptance criteria are met, and:

1. The regression test for the repro passes locally. CI runs typecheck, the full unit suite, and the production build. Do not run those locally as well.
2. No new parallel pattern (or an ADR plus owner ack). Prefer deleting a weaker fork over leaving a compat layer.
3. ClickUp id in the branch and the PR. A comment on the task says what changed and how to test. Do not update `ACTIVE_TASKS.md` or put `TASK-###` in the commit subject.
4. One task, one branch, one PR.
5. No `AI_CHANGELOG.md` entry. The PR and the ClickUp comment are the note.
6. User-facing work: QA steps on the ClickUp comment. Add a `BUILD_VALIDATION.md` test only when that suite does not already cover the check.
7. New shared UI: allowlist + ADR, then `npm run tasks:validate-shared-ui`. Barrel changes: `npm run tasks:generate-index`.
8. Every fixed bug has a regression test from its repro when feasible.

If an acceptance criterion is still open, say so on the ClickUp task. Do not mark the task complete.

### QA

User-facing work moves to ClickUp **testing** with the QA comment. That comment is the pending-QA record. Do not also set legacy `verification_status` fields in removed repo queue files.

## Human review gates (stop and ask / DEV queue)

After a passing PR Reviewer verdict, require **Human OK** (Kadin or Collin, usually Kadin) before merging:

- New files under `src/components/patterns/` or `src/components/ui/` (**CI:** `npm run tasks:validate-shared-ui` — update `scripts/shared-ui-allowlist.json` + ADR)
- New zustand stores or new state-management approach
- API contract changes (request/response shapes clients depend on)
- Live codex `UPDATE`/`INSERT`/`DELETE`

**High-risk PRs** (classification, Web Manager second pass, and Kadin plain-language summary): `src/docs/ai/PR_REVIEWER_BRIEF.md` **Risk classification** (single list). Live database apply still needs **Kadin explicit OK** and a fresh backup.

**PR review process:** The review process is written once in `src/docs/ai/PR_REVIEWER_BRIEF.md`; [Realms Dev Workflow §4](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) and [Realms Web Decisions](https://docs.google.com/document/d/1tGebelYXZPegt4iZiycOjI3RBHD6N_QKZW6CI0ckxkg/edit) point to it and do not duplicate it (Drive updated **2026-10-28**, Editor bot). **Drive vs repo (Oct 5, 2026):** when a Drive doc and its repo copy conflict, **Drive wins** and the repo copy is corrected—including Dev Workflow or Decisions vs the brief. Drive **core rulebook text** wins over `GAME_RULES.md` when they conflict (ask Kadin).

**Model escalation:** Before implementing Architect-class or irreversible-data work, pause once and flag that a stronger model may be safer — see `.cursor/rules/realms-tasks.mdc` (narrow triggers; do not stall routine Implementer tasks).

## Anti-debt

- Prefer **delete** the weaker of two parallel systems.
- Prefer **extend** existing shared/ui/hook/lib (`FEATURE_INDEX` + barrels) over new parallel helpers/modals/parsers.
- Cleanup must **remove** clutter and prove feedback/AC in code — not grow docs theater. Prefer **net remove** on cleanup/debt diffs.
- When consolidating, ship a first slice + precise follow-ups — not aspirational prose only.
- A hold that exists only in `WAITING_TASKS.md` stays there until it is on the ClickUp task. Do not load that file to start work.
- **Before merge:** PR Reviewer verdict per `src/docs/ai/PR_REVIEWER_BRIEF.md`. `/cleanup` only for an in-scope gap from REQUEST CHANGES. `/global-audit` and `/debt` are unused on a task.

## On-demand deep refs

- Patterns / components / gotchas → `AGENT_GUIDE.md` hub → `guide/` appendices
- Feature map → `FEATURE_INDEX.md` + generated `FEATURE_INDEX_BARRELS.generated.md`
- PR failure-mode checklist → `PR_CHECKLIST.md` (includes PR Reviewer pointer)
- Slash commands → `.cursor/commands/cleanup.md`. Retired: `/audit` (superseded by PR Reviewer), stubs `src/docs/ai/archive/global-audit.md`, `archive/debt.md` (not live commands).
- Task record → the ClickUp task, the branch, and the PR. Not `AI_TASK_QUEUE.md`.
