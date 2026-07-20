# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-593
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-584, 587, 586, 583, 581, 582, 580, 578, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 2 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.


**Hot notes:** Sheet wave **TASK-584–587** done (pending-qa). Automation: TASK-588–592 done (CI). TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

---

# Character sheet / list overload + Temp Modifier (TASK-584–587) — owner feedback 2026-07-20
# All done 2026-07-20 (archive; pending-qa). TASK-582/583 also done.

# TASK-584 done 2026-07-20 — Skills catalog-all + filters + − path (archive; pending-qa T032).
# TASK-587 done 2026-07-20 — Sheet Defense Score hover tip (archive; pending-qa T035).
# TASK-583 done 2026-07-20 — Parts/Properties & Proficiencies default collapsed + tips (archive).
# TASK-585 done 2026-07-20 — Temp Modifier Architect ADR + shared dual affordance (archive).
# TASK-586 done 2026-07-20 — Temp Modifier v1 sheet surfaces wired (archive; pending-qa T033/T034).

---

# Guided Path / Archetype screen polish — TASK-578/579/580/581 done (archive).

# TASK-579 done 2026-07-20 — Path feat uses chips + restriction notices (archive).
# TASK-535 done 2026-07-20 — Path Level-1 innate power reclassify (archive).
# TASK-581 done 2026-07-20 — tooltip layers docs + Armament tip sheet wire (archive).

# TASK-440 done 2026-07-20 — Dense HUD Health/Energy (archive).
# TASK-480 automation backlog → TASK-588–592 done (vitest extracts; CI matrix rows 1–9).

# TASK-430 done 2026-07-20 — React Compiler hook warnings cleared (archive; DEV-V-019 pending-qa).

---

# BUILD_VALIDATION automation backlog (from TASK-480) — extract pure helpers + vitest

# TASK-588 done 2026-07-20 — path change reset vs retain draft patch (archive).
# TASK-589 done 2026-07-20 — technique load columns vitest (archive).
# TASK-590 done 2026-07-20 — innate threshold / TP parity vitest (archive).
# TASK-591 done 2026-07-20 — ancestry pick task order vitest (archive).
# TASK-592 done 2026-07-20 — guided Continue one-screen advance vitest (archive).

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

# TASK-381 done 2026-07-20 — God-file decomposition phases (archive; pending-qa DEV-V-008 T023–T025 / DEV-V-018 T008–T010).
# TASK-388 done 2026-07-20 — Post-activation onboarding (archive; pending-qa).
# TASK-480 done 2026-07-20 — BUILD_VALIDATION automation growth (archive; CI coverage note in DEVELOPER_TASK_QUEUE).

---

# Realms Image Library epic (TASK-491–500)
# TASK-491–499 done. TASK-500 deferred.

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

# Admin archetype path ↔ guided creator parity (TASK-514–518) — DONE 2026-07-17 (archive).
# Owner decisions locked: feat audience field; armaments UI-only split; DROP recommended species;
# skills max 3 warn-not-block. Content pass TASK-521/530 done. TASK-391 superseded (archived).

---

# TASK-569 done 2026-07-20 — PartChip alias deleted (archive).
# TASK-570 done 2026-07-20 — guided parseItemRef → parseIdQuantityStrings (archive).

---

# TASK-571 done 2026-07-20 — AddCombatantModal documented as reusable non-USM session picker (archive).
# TASK-572 done 2026-07-20 — AdminSpecies trait picker → USM; AdminTraits choice list = editor chrome (archive).

# TASK-403 done 2026-07-20 — Guided Phase 8 admin starter + path JSON (archive; residual → TASK-572).
# TASK-575 done 2026-07-20 — Admin Official Enhanced → OfficialEnhancedList / OfficialEntityList (archive).
