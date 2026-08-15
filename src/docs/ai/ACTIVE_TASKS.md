# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-765
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-753, TASK-764, TASK-408, TASK-752, TASK-763, TASK-761, TASK-757, TASK-756, TASK-759, TASK-758, TASK-760, TASK-733, TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 2 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Owner 2026-08-14 **TASK-764 + TASK-408 done** (creator section headers drop empty expanded summary line — titles/padding restored; power creator Attack label + InfoTippys). Power creator **layers TASK-410–414 stay deferred**. Owner 2026-08-14 **TASK-763 done** (home how-it-works). **TASK-751–753 done** (ADR-0014 path filter on Feats + Codex/Library + creator L2/add-X). **TASK-718 done** (BUILD_VALIDATION archive for uncited suites). **Next:** TASK-762 (combat `?scope=encounter` Query — Architect, pause once). TASK-719 last. Wave 3 still waits for the owner (includes report 07 P2-5 RM-view enrichment waterfall).

---

---

- id: TASK-719
  title: Disambiguate duplicate archive IDs TASK-615 and TASK-284
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/archive/TASK_QUEUE_DONE.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Archive has two distinct done blocks each for TASK-615 (facade shrink vs Web Analytics)
    and TASK-284 (role-based admin vs mixed-species list dedupe). Not copy-paste dupes —
    ID collisions. Re-id one of each (new TASK-###) and retarget DEVELOPER_TASK_QUEUE /
    BUILD_VALIDATION citations so reconcile and pending-QA rows are unique.
  acceptance_criteria:
    - Each `- id: TASK-615` / `TASK-284` in the done archive refers to one piece of work.
    - The other block has a new unique TASK-###; DTQ pending-QA and DEV-006/DEV-V-018 links match.
    - `npm run tasks:validate` strict reconcile still passes for both IDs (commit subjects).
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete either block. Re-id needs a commit
    subject containing the new ID if strict-since covers completed_at.

---

---

- id: TASK-762
  title: Combat linked-character ?scope=encounter fetches are a Query
  created_at: 2026-08-14
  created_by: agent
  priority: low
  status: not-started
  related_tasks:
    - TASK-761
    - TASK-750
  related_files:
    - src/app/(main)/encounters/[id]/_components/combat/use-combat-linked-character-sync.ts
    - src/app/(main)/encounters/[id]/_components/combat/use-combat-roster-actions.ts
    - src/components/shared/add-combatant-modal.tsx
    - src/hooks/use-campaigns.ts
    - src/services/campaign-service.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Report 06 P1-1 leftover after TASK-761. The RM sheet load is Query; combat still
    batch-fetches `?scope=encounter` (minimal HP/EN/AP payload) with uncancelled
    Promise.all + apiFetchOrNull in use-combat-linked-character-sync, plus the same
    URL in roster-actions and AddCombatantModal. That route is not the RM view GET
    (no libraryForView; members allowed; private visibility skipped).
  acceptance_criteria:
    - Linked-character resource sync reads through React Query (campaign + encounter
      scoped key, or a documented variant). No parallel uncancelled useEffect fetch
      for that payload. Query cancel/unmount covers in-flight requests.
    - Do not reuse useCampaignCharacterView / the full RM-view GET for this payload.
    - AddCombatantModal and roster-actions use the same fetcher (no third copy of the
      URL string). Existing 90s visibility-gated poll and realtime merge stay.
    - Typecheck/lint. FEATURE_INDEX. One DEV-V test (combat linked HP sync).
  notes: |
    Filed from TASK-761 /cleanup. Architect — new query key for encounter-scoped
    character resources; pause once before implementing. Low; after TASK-751–753
    unless the owner re-prioritizes. Wave 3 report 07 P2-5 (RM view 14 enrichment
    queries) is a different finding — do not fold it in.

---
