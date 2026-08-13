# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-734
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-732, TASK-716, TASK-726, TASK-725, TASK-728, TASK-722, TASK-721, TASK-724, TASK-723, TASK-720, TASK-729, TASK-731…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-733** sheet Innate Energy/Powers tips. **TASK-714** MixedSpeciesModal source type. **TASK-718** BUILD_VALIDATION archive. **TASK-719** archive ID collisions.

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

- id: TASK-718
  title: Archive BUILD_VALIDATION suites that cannot stay in the 322KB hot file
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    BUILD_VALIDATION.md is ~322KB / 45 suites / 320 tests with no archive file. Create
    archive/BUILD_VALIDATION_ARCHIVE.md and move verified or long-superseded suites out of
    the hot file. Keep suites still cited by Pending owner QA in the hot file.
  acceptance_criteria:
    - archive/BUILD_VALIDATION_ARCHIVE.md exists with a pointer from BUILD_VALIDATION.md.
    - Hot file shrinks; Pending owner QA linked suites remain in the hot file.
    - DEVELOPER_TASK_QUEUE build-validation index links still resolve.
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete tests — move them.

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

- id: TASK-733
  title: Sheet LibraryPowersPanel — Innate Energy / Innate Powers InfoTippys
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  related_tasks:
    - TASK-726
  related_files:
    - src/components/character-sheet/library-powers-panel.tsx
    - public/tooltip-text.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/entity-library-powers-techniques.tsx
    - src/components/shared/section-header.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    TASK-726 wired innateEnergyHelp / innatePowersHelp on guided creator chrome. The
    character sheet Powers tab (LibraryPowersPanel) still has no (i) on Innate Energy or
    Innate Powers, and the summary blurb says energy costs may go "up to your innate
    energy" (pool vs Innate Threshold mixup). Reuse the TASK-726 global tips; do not
    invent a second copy string.
  acceptance_criteria:
    - Innate Energy SummaryItem uses labelAccessory + innateEnergyHelp (same GAME_RULES copy as creator).
    - Stale "up to your innate energy" sentence is removed or replaced so Threshold vs pool is not confused.
    - Innate Powers list heading has an InfoTippy with innatePowersHelp; extend SectionHeader / PowersListSection (GuidedSectionTitle titleAddon pattern) — no second header fork.
    - FEATURE_INDEX sheet Library note; DEV-V-009 T041; typecheck/lint pass.
  notes: |
    Filed from TASK-726 /audit. SummaryItem already has labelAccessory. SectionHeader has
    no titleAddon today — add a slot on the existing shared header, do not create a new
    shared/ui file. Threshold / Pools SummaryItems do not need their own tips unless copy
    is unclear without them.

