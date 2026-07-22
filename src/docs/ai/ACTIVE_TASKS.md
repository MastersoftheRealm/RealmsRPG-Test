# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-620
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-618, 616, 615, 611, 610, 608, 607, 606, 604, 603, 602, 601, 600, 599, 598, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 3 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** TASK-618 done (USM + CombatantCard splits). Quality-audit wave continues TASK-619. TASK-615 done (Vercel Web Analytics + CSP/docs; Dashboard Enable = DEV-006). TASK-615 done (TASK-610 facade remainder). /debt TASK-601–606 done. Quality audit TASK-607–613 done ([archive report](archive/QUALITY_GLOBAL_AUDIT_2026-07-20.md); renumbered after ID collision with debt). TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

---

- id: TASK-619
  title: Split remaining admin codex tab god files under ~500 LOC
  priority: medium
  status: not-started
  created_at: 2026-07-22
  created_by: agent
  parent_task: TASK-609
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/admin-feat-edit-modal.tsx
    - src/app/(main)/admin/codex/admin-part-edit-modal.tsx
  description: |
    Quality-audit follow-up after TASK-617: split large admin codex list-tab modals
    (species/properties/traits/feats/parts edit shells) into facade + co-located modules.
  acceptance_criteria:
    - Each touched tab facade <= ~500 LOC; co-located private extracts.
    - Admin codex list + modal edit/save/copy flows unchanged.
    - npm run build passes.
  notes: |
    Targets still >500 LOC after TASK-609/617. Optional later: consolidate duplicate TabId unions.

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
