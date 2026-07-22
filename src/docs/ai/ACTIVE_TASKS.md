# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-615
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-611, 610, 608, 607, 606, 604, 603, 602, 601, 600, 599, 598, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 3 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** `/debt` TASK-601–606 done; filed TASK-614 (LoadoutBudgetBar → shared, Architect). Quality audit TASK-607–613 done ([archive report](archive/QUALITY_GLOBAL_AUDIT_2026-07-20.md); renumbered after ID collision with debt). TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

---

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Storage SELECT policies scoped; enable HIBP leaked-password check in Supabase Auth.
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Storage SELECT policies scoped so buckets aren't broadly listable (read-by-key still works).
    - Leaked-password protection enabled in Supabase Auth.
    - SQL/migration documented; advisors re-checked.
  completed_work: |
    - Storage SELECT hardening applied live (MCP).
  remaining_work: |
    - Enable HIBP in Supabase Auth (DEV-001).
  follow_up_tasks:
    - TASK-353
  notes: "2026-06-13. See DEVELOPER_TASK_QUEUE."

---

- id: TASK-500
  title: Deferred — enhanced-item images via Realms Image Library
  created_at: 2026-07-16
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-491
  related_files:
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Owner: enhanced items get images eventually, not now. When scheduled, add category tag and/or
    picker filter + image_id on enhanced-item rows using the same bank patterns as TASK-491+.
  acceptance_criteria:
    - Not in MVP Image Library ship; reopen when owner prioritizes.
    - Reuses RealmsImagePicker + bank — no parallel media system.
  notes: |
    Placeholder so the yes eventually decision is not rediscovered. Leave not-started until asked.

---

- id: TASK-614
  title: Move LoadoutBudgetBar into shared (Architect)
  created_at: 2026-07-21
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-606
  related_files:
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/components/shared/index.ts
    - src/components/shared/point-status.tsx
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    After TASK-606, Advanced imports `LoadoutBudgetBar` from `guided-creator/` while Guided uses
    the same chrome. Leave it in place for now; later migrate the file into `shared/` so both
    creators (and any post–Advanced-phase-out surfaces) import from the shared barrel.
  acceptance_criteria:
    - `LoadoutBudgetBar` lives under `src/components/shared/` and is exported from the shared barrel.
    - Guided + Advanced call sites import from `@/components/shared` (no `guided-creator` path).
    - ADR (or owner ack) + `scripts/shared-ui-allowlist.json` updated; `npm run tasks:validate-shared-ui` passes.
    - FEATURE_INDEX + guide/04 path notes updated; `npm run build` passes; no behavior change.
  notes: |
    From TASK-606 /cleanup follow-up. Architect path — new shared UI file. Do not start until
    prioritized; current cross-folder import is intentional interim.

---
