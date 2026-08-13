# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-715
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-707, TASK-706, TASK-712, TASK-711, TASK-709…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-714** open (MixedSpeciesModal source type). TASK-713 done (API IDOR vitest). TASK-707/706/712/711/709 pending-qa.

---

- id: TASK-714
  title: MixedSpeciesModal — drop local SourceFilterValue, use shared alias
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_tasks:
    - TASK-712
    - TASK-605
    - TASK-641
  related_files:
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/components/shared/filters/source-filter.tsx
    - src/lib/library/source-scope.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    MixedSpeciesModal declares a local `SourceFilterValue = 'all' | 'public' | 'my'` and a
    hand-rolled SegmentedControl with All / Public species / My species. TASK-712 made
    `SourceFilterValue` an alias of `LibrarySourceScope`. Delete the local type and import
    the shared alias. Prefer `SourceFilter` for All / Realms Library / My Library chrome
    unless species-specific labels ("Public species" / "My species") are kept on purpose —
    in that case still type the control with the shared union. Do not alias Advanced
    `species-step`'s local union (it includes `'make'`). Dual-select UX stays MixedSpeciesModal
    (not USM).
  acceptance_criteria:
    - Local `type SourceFilterValue` in MixedSpeciesModal is deleted; source state uses the shared `SourceFilterValue` / `LibrarySourceScope` alias.
    - Source chrome is either shared `SourceFilter` or SegmentedControl typed with that alias (no second union).
    - Mixed dual-select confirm flow unchanged; not migrated to USM.
    - Advanced species-step `'make'` source stays a local wider union.
    - FEATURE_INDEX MixedSpeciesModal note; build/typecheck/lint pass.
  notes: |
    TASK-712 cleanup follow-up. Labels today differ from SourceFilter ("Public species" vs
    "Realms Library") — pick shared chrome unless owner wants the species wording.

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
