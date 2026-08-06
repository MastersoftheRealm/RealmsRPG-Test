# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-683
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-680, TASK-679, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 5 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** TASK-680 done (armaments character filter + add). TASK-681 cross-tab character filter persistence (feats key still separate; Library PT+armaments share key).

---

- id: TASK-681
  title: Persist character filter across Library + Codex tabs
  created_at: 2026-08-06
  created_by: agent
  priority: medium
  status: not-started
  parent_task: TASK-676
  related_files:
    - src/lib/library/character-filter-persistence.ts
    - src/components/shared/filters/character-filter.tsx
    - src/components/shared/filters/power-technique-filters.tsx
    - src/components/shared/filters/armament-filters.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/library/page.tsx
  description: |
    When the user picks a character under Filter by character on one Library or Codex tab,
    switching tabs (powers → techniques → feats → armaments, My ↔ Realms where applicable)
    should keep the same character selected. Library tabs share
    `character-filter-persistence.ts`; Codex feats still uses a separate key.
  acceptance_criteria:
    - Single shared persistence key + helper (`lib/library/character-filter-persistence.ts`) used by CharacterFilter consumers.
    - Library all relevant tabs + Codex feats read/write the same character id.
    - Clearing character on one tab clears globally; localStorage survives refresh.
    - No duplicate useCharacters / localStorage logic per tab.
  notes: |
    Owner cleanup 2026-08-06. Persistence helper landed in TASK-680 cleanup; remaining: wire Codex feats to same key.

---

- id: TASK-675
  title: Wire PowerTechniqueFilters compact into USM add-power/technique
  created_at: 2026-08-06
  created_by: agent
  priority: medium
  status: not-started
  parent_task: TASK-673
  related_files:
    - src/components/shared/filters/power-technique-filters.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/lib/library/power-technique-filters.ts
    - src/lib/library-selectable-builders.ts
  description: |
    After TASK-673 library filters, reuse `PowerTechniqueFilters` with `variant="compact"`
    (and shared apply helpers) in UnifiedSelectionModal add-power / add-technique flows
    so selection modals match Library browse filters (category, energy, action/reaction;
    power-only innate threshold + eligible). Do not fork a parallel filter panel.
  acceptance_criteria:
    - Add-power and add-technique USM surfaces use shared PowerTechniqueFilters compact variant.
    - Filter apply delegates to applyPowerTechniqueFilters / innate-eligibility — no local eligibility fork.
    - Mobile: FilterSection compact toolbar patterns; npm run build + targeted tests pass.
  notes: |
    Filed from TASK-673 audit follow-up. Guided creator L1/L2 already use innate-eligibility domain;
    this task is USM chrome only unless a shared hook is extracted while wiring.
    TASK-676 added character/TP filters to the shared panel — USM should inherit those when wired.

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
