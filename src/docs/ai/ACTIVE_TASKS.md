# Active AI Tasks

**Hot path only** â€” agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-673
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) ? Pending owner QA (recent: TASK-672, TASK-654, TASK-641, TASK-640, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only â†’ `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive â€” do not re-list them here.

**Counts:** 4 agent-eligible Â· waiting/blocked in WAITING_TASKS Â· done in archive.

**Hot notes:** TASK-672 done (power AoE applyDuration — re-homed from remote mislabeled TASK-642; local TASK-642 remains email spoof). TASK-650/649 applied. TASK-657 hooks. TASK-655/656 CI gates — pending-qa.

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
  title: Deferred â€” enhanced-item images via Realms Image Library
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
    - Reuses RealmsImagePicker + bank â€” no parallel media system.
  notes: |
    Placeholder so the yes eventually decision is not rediscovered. Leave not-started until asked.

---

- id: TASK-642
  title: Fix profile email spoofing in createUserProfileAction
  priority: critical
  status: partial
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/(auth)/actions.ts
  description: |
    Audit finding H1: `createUserProfileAction` accepts a client-supplied `email` field and writes it
    to `user_profiles`, letting a malicious client spoof another email address. Always derive email
    server-side from the authenticated session user, never from request input.
  acceptance_criteria:
    - createUserProfileAction ignores any client-supplied `email` and sets it from `sessionUser.email` only.
    - Signup/profile-creation flow still works end-to-end (manual QA: sign up, profile shows correct email).
    - npm run build passes.
  completed_work: |
    - createUserProfileAction now derives email only from sessionUser.email (client email ignored).
    - npm run build passes (TASK-644 cleared shared build blocker).
  remaining_work: |
    - Manual signup QA (profile shows session email) — see DEV-008.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §4.2 H1.
    2026-08-03 merge: remote also used TASK-642 for power AoE — that work is archived as TASK-672.

---

- id: TASK-668
  title: Reconcile project docs with CODEBASE_AUDIT_2026-08-01 findings
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/docs/ai/archive/CODEBASE_AUDIT_2026-08-01.md
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    This audit was run without access to project docs, so some findings may already be tracked
    elsewhere under different names, and some existing docs are stale relative to what the audit found
    in live code. Cross-check each finding against FEATURE_INDEX/ARCHITECTURE_CONSTITUTION/
    BUILD_VALIDATION for accuracy and correct any doc claims the audit disproved (e.g. test-coverage
    claims, "single canonical implementation" claims where duplication was found).
  acceptance_criteria:
    - Doc claims contradicted by the audit are corrected or annotated as known debt with a linked TASK-###.
    - No duplicate tasks filed for items already tracked elsewhere (e.g. TASK-326/353 leaked-password
      protection — already covers audit D3, not re-filed here).
    - npm run tasks:validate-docs passes.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md (full report). Companion to TASK-642–667.

---
