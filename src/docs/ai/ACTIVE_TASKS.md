# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-746
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 5 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Wave 2 coding pass is open. TASK-741 (dirty-key PATCH, Architect) **done**. Next: TASK-742 (acked rules) → TASK-739. TASK-733 / 718 / 719 after those. Wave 3 after TASK-741 (now unblocked).

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

---

- id: TASK-739
  title: Clamp Advanced getCharacter currency at 0 on save
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/guided-creator/equipment-currency.ts
    - src/docs/ai/AUDIT_REMEDIATION_2026-08.md
  description: |
    Owner ack 2026-08-13: do after the Wave 2 funnel land. Guided save uses
    `clampSavedCurrency` so a character cannot start in debt. Advanced `getCharacter`
    still writes `draft.currency ?? CHARACTER_STARTING_CURRENCY` unclamped.
  acceptance_criteria:
    - Advanced create/save persists `Math.max(0, remaining)` (same floor as Guided).
    - Do not import `clampSavedCurrency` into the Advanced store if that creates a cycle
      (`equipment-currency.ts` already imports `CHARACTER_STARTING_CURRENCY` from the store) —
      inline the floor or move the helper to a leaf module.
    - Targeted test: negative draft currency saves as 0. Typecheck/lint pass.
  notes: |
    Guided Loadout keeps the signed remainder on the draft for the rail; only the
    persisted character is clamped. Match that split if Advanced ever shows overspend.

---



- id: TASK-742
  title: Wave 2 rules leftovers after 2026-08-13 owner acks
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/lib/calculators/part-training-points.ts
    - src/lib/calculators/item-calc.ts
    - src/lib/game/feat-requirements.ts
    - src/lib/game/calculations.ts
    - src/lib/game/creator-constants.ts
    - src/components/shared/creature-stat-block.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/AUDIT_REMEDIATION_2026-08.md
  description: |
    Owner acks recorded in GAME_RULES + tracker. Implement: TP comment/test alignment
    (per-part floor, already shipped); clamp item currency to rarity currencyMax (IP
    still picks rarity); feat check = lvl_req first else character level >= 2 * feat
    level; remove undocumented size modifier from calculateCreatureSpeed (rulebook has
    no size Speed add); N2 empowered EN dedupe; D4–D7 creature speed/evasion copies;
    tests T4–T10 of highest value.
  acceptance_criteria:
    - Comments/tests describe per-part TP floor; no ceil-at-end TP.
    - Item currency is clamped to the IP-derived rarity band max.
    - checkFeatRequirements enforces lvl_req then 2× feat level.
    - Creature Speed matches player Speed (no size add); stat-block uses shared helpers.
    - Empowered technique EN uses dedupeSavedParts like technique calc.
    - Typecheck/lint pass.
  notes: |
    Size table / core_rules.SIZES / GAME_RULES prose already applied 2026-08-13.
    Do not re-open −2 ability floor (docs+code already agree).

---

