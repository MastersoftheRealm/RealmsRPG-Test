# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-630
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-628, session Menace dedupe, TASK-623, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** TASK-628 done (armor Abl. Req. + Crit + columns). TASK-629 filed (GLR fact registry — Architect). TASK-626 done (empowered nested power part chips).

---

- id: TASK-629
  title: Enforceable GLR required-facts registry per entity type
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/docs/ai/CHIP_UNIFICATION_PLAN.md
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/lib/detail-option/compact-facts.ts
    - src/lib/library/official-item-list.ts
    - src/docs/GAME_RULES.md
  description: |
    Policy exists (column OR self-describing chip; compact-facts grammar) but each GLR list
    configures columns independently — no typed registry of required quick-ref facts per entity
    type, and no CI/check that Library/Codex/sheet/add-modal surfaces satisfy it. Gaps rediscovered
    (e.g. armor ability req / Critical Range increase before TASK-628).
  acceptance_criteria:
    - Architect ADR or owner ack for a single required-facts map (entity → facts; column vs chip placement).
    - Shared module consumed by Library/Official/sheet/add-modal builders (or validated against them).
    - Automated check (vitest or tasks:validate) fails when a required fact is missing from both columns and expanded chips.
    - Document SoT in constitution map / FEATURE_INDEX; retire stale CHIP_UNIFICATION example table drift.
  notes: |
    Architect-class (new shared contract). Pause for stronger model / owner ack before implement.
    Related: TASK-437 audit, TASK-454/461 compact-facts, CHIP_UNIFICATION_PLAN § Metadata visibility.

---

- id: TASK-627
  title: Official powers payload — strip redundant auto-mechanic parts (codex data)
  priority: low
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  assignee: owner
  related_files:
    - sql/
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    ~12/43 official_powers duplicate auto-mechanic parts in payload.parts when promoted columns exist.
    Read-path dedupe fixes display; optional data cleanup removes redundancy (owner approve before apply).
  acceptance_criteria:
    - Audit query lists affected rows with overlap counts.
    - Proposed SQL in sql/; preview Menace + Fog Cloud before/after.
    - Owner approves apply; post-migration counts in AI_CHANGELOG.
  notes: |
    Codex policy audit → propose → approve → apply.

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
