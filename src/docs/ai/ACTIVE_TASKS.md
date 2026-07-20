# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-600
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-598, 596, 594, 597, 584, 587, 586, 583, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 3 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Audit multitask: TASK-593–598 done. Remaining from `/global-audit`: TASK-599. TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

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

# Sheet / creator debt follow-ups (from `/global-audit` 2026-07-20)

- id: TASK-599
  title: Single source of truth for archetype-category marketing copy
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/creator/archetype-selector.tsx
    - src/lib/constants/copy
  description: |
    `ARCHETYPE_INFO` (Power / Powered-Martial / Martial titles+descriptions) is triplicated
    with divergent copy between sheet edit-archetype and Advanced archetype-step (plus
    emoji variant in creator/archetype-selector). Consolidate into one copy module after
    owner picks canonical wording.
  acceptance_criteria:
    - One module exports archetype category title/description (selector may keep icons).
    - Sheet + Advanced + creature/creator selectors consume it.
    - Owner-approved copy strings (no silent rewrite of product voice).
  notes: |
    Needs owner ack on which descriptions win before implementing.
