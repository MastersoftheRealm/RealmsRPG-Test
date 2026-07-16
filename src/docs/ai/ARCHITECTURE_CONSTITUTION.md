# Architecture Constitution

**Always-loadable agent core** (~2 pages). Deep detail lives in on-demand docs — do not re-read `AGENT_GUIDE.md` or its `guide/` appendices every session.

## Roles

| Role | When | Constraint |
|------|------|------------|
| **Implementer** (default) | Almost all tasks | Extend existing patterns only. No new shared component/store/API contract without Architect path. |
| **Architect** (rare) | New shared component, zustand store, API contract, migration strategy, or parallel pattern | Require ADR in `src/docs/ai/ADR/` **or** explicit owner ack in chat / `DEVELOPER_TASK_QUEUE.md`. Prefer deleting parallel systems over documenting them forever. |

## Session start (mandatory reads)

1. **This file** (`ARCHITECTURE_CONSTITUTION.md`)
2. **`ACTIVE_TASKS.md`** — open tasks only (skip `blocked` + human `assignee:`)
3. When implementing: **`FEATURE_INDEX.md`** + barrel greps (`shared/index.ts`, `ui/index.ts`, `hooks/index.ts`, `services/index.ts`)

Do **not** load full `AI_TASK_QUEUE.md`, full `AGENT_GUIDE.md` / `guide/` appendices, or archive history at session start. Pull topic docs on demand via the SoT map in `AGENTS.md`.

## Source of truth (one authority per topic)

| Topic | Authority |
|-------|-----------|
| Product / UX intent | `REALMS_PRODUCT_OVERVIEW.md` + `human/USER_EXPERIENCE_GOALS.md` |
| Exists already? | `FEATURE_INDEX.md` → barrels |
| Schema | `SUPABASE_SCHEMA.md` |
| Game terms / formulas | `GAME_RULES.md` |
| Shared UI patterns | `AGENT_GUIDE.md` hub → `guide/` appendices (on demand) + `realms-unification.mdc` |
| Tokens / contrast | `DESIGN_SYSTEM.md` + `ACCESSIBILITY.md` — prefer `*-fg` theme-aware tokens |
| Mobile | `MOBILE_UX.md` |
| Design constraints | `DESIGN_INTENT.md` + `// DESIGN_INTENT:` comments |
| Architecture decisions | `ADR/` |

## Non-negotiables

- **Search before build** — never fork a parallel `Library*Tab` / load hook / upload path / parser.
- **Stack** — Next.js App Router, Supabase (no Prisma), Vercel. SQL in `sql/`; schema docs in `SUPABASE_SCHEMA.md`.
- **Migrations (one policy):** Prefer Supabase MCP `apply_migration` when available; else Dashboard SQL Editor. Always keep idempotent SQL in `sql/`. **Codex data** (`codex_*` / `core_rules`): audit → propose SQL → **owner approve** → apply (MCP or Dashboard). See `realms-codex-data.mdc`.
- **Uploads** — client multipart via `apiUpload` from `@/lib/api-client` (not raw `fetch` to `/api/upload/*`).
- **Parsers** — domain parsers in `src/lib/game/` (e.g. `archetype-path.ts`); no admin-local forks.
- **UI gates** — keep `realms/no-raw-color`, contrast, visual/a11y Playwright. Prefer `text-success-fg` / `text-danger-fg` / `text-warning-fg` / `text-power-fg` / `text-martial-fg` over numbered ramp + ad-hoc `dark:`.
- **Mobile** — `fullScreenOnMobile` on large modals; ≥44px touch targets.

## Definition of Done

A task may be `done` only when **all** acceptance criteria are met **and**:

1. `npm run build` passes (and targeted tests if the area has them)
2. No new parallel pattern introduced (or Architect ADR + owner ack)
3. `ACTIVE_TASKS.md` updated (`done` → move block to `archive/TASK_QUEUE_DONE.md`; bump status fields)
4. `AI_CHANGELOG.md` entry appended
5. User-facing work: `BUILD_VALIDATION.md` tests + `developer_test_plan` when required

If any AC remains open → **`partial`** with `completed_work` / `remaining_work` / `follow_up_tasks`. Never mark `done` to “finish later.” Prefer follow-up tasks over audit-after-done rediscovery.

## Human review gates (stop and ask / DEV queue)

Require owner review before merging:

- New files under `src/components/shared/` or `src/components/ui/` (**CI:** `npm run tasks:validate-shared-ui` — update `scripts/shared-ui-allowlist.json` + ADR)
- New zustand stores or new state-management approach
- API contract changes (request/response shapes clients depend on)
- Live codex `UPDATE`/`INSERT`/`DELETE`

## Anti-debt

- Prefer **delete** the weaker of two parallel systems.
- Cleanup sprints beat eternal “compat layer” docs (`ACTIVE_TASKS` TASK-481 cadence).
- When consolidating, ship a first slice + precise follow-ups in `ACTIVE_TASKS.md` — not aspirational prose only.
- Blocked / human-owned work lives in `WAITING_TASKS.md` (not the session hot path).

## On-demand deep refs

- Patterns / components / gotchas → `AGENT_GUIDE.md` hub → `guide/` appendices
- Feature map → `FEATURE_INDEX.md` + generated `FEATURE_INDEX_BARRELS.generated.md`
- PR failure-mode checklist → `PR_CHECKLIST.md`
- Task process → `AI_TASK_QUEUE.md` (process only; tasks live in `ACTIVE_TASKS.md` / `WAITING_TASKS.md`)
