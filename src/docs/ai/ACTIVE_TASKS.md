# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-701
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-700, TASK-698, TASK-697, TASK-692, TASK-695, TASK-694…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-700** done pending-qa. **TASK-699** filed (DescriptorChip size). TASK-698 done pending-qa. TASK-697 done pending-qa. TASK-692 done pending-qa. TASK-695/694/693 done pending-qa. TASK-686–690 pending-qa. **TASK-691** + **TASK-675** done pending-qa.

---

- id: TASK-699
  title: Sitewide DescriptorChip slightly larger / more readable
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-415
  related_files:
    - src/components/ui/chip.tsx
    - src/lib/chip/descriptor-chip-variants.ts
    - src/docs/DESIGN_SYSTEM.md
  description: |
    DescriptorChips feel slightly too small (padding + font) sitewide — only a nudge, but
    metadata is harder to read than it should be. Adjust the shared DescriptorChip default /
    `sm` size token so call sites inherit the bump; screenshot Library/Codex expanded rows and
    guided fact chips before/after. Keep ExpandableChip and filter pills distinct.
  acceptance_criteria:
    - Shared DescriptorChip default (or `sm` token used by DescriptorChip) is slightly larger / more readable; no per-page one-offs.
    - ExpandableChip / filter Chip roles unchanged unless they incorrectly share the same undersized token.
    - Contrast still passes; dense GLR rows do not overflow or wrap badly from the bump.
    - DESIGN_SYSTEM / CHIP docs note the size intent; screenshot-verify a representative surface.
    - Build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. DescriptorChip currently defaults `size="sm"` → `text-xs` / `py-0.5`. Prefer
    a modest token bump over forcing every call site to `md`.

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
