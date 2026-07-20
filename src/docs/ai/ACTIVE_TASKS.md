# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-608
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-600, 599, 598, 596, 594, 597, 584, 587, 586, 583, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 9 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Quality pseudo `/global-audit` → TASK-601–607 ([archive report](archive/QUALITY_GLOBAL_AUDIT_2026-07-20.md)). Prior `/global-audit` TASK-593–599 done. TASK-600 Speed/Evasion Temp-only done. TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

---

- id: TASK-601
  title: Split crafting [id] page under ~500 LOC facade
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/app/(main)/crafting/[id]/page.tsx
    - src/services/crafting-service.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Crafting session page is the largest TSX hotspot (~2009 LOC). Follow TASK-598 pattern:
    extract co-located panels/hooks/helpers; keep a thin page facade under ~500 LOC; no behavior
    change; no parallel crafting UI system.
  acceptance_criteria:
    - `crafting/[id]/page.tsx` facade ≤ ~500 LOC (prefer net move of presentation/helpers out).
    - Named exports / routes unchanged; FEATURE_INDEX updated if paths move.
    - `npm run build` passes; smoke crafting session load/roll/save if touched.
    - No new shared/ui barrel symbols unless Architect path.
  notes: Largest single play-loop readability win (quality audit 2026-07-20).

---

- id: TASK-602
  title: Split combat + skill encounter views under ~500 LOC
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx
    - src/services/encounter-service.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Encounter play views are ~1246 / ~1435 LOC. Extract co-located combatant lists, round chrome,
    roll panels, and helpers so each facade lands near ~500 LOC (TASK-598 style). Preserve
    AddCombatantModal + shared roll patterns; do not fork selection shells.
  acceptance_criteria:
    - CombatEncounterView and SkillEncounterView facades each ≤ ~500 LOC (or justified partial with follow-up).
    - Behavior parity for combat/skill encounter play loops.
    - FEATURE_INDEX updated if module paths change; `npm run build` passes.
  notes: Share combat/skill helpers only when identical — no premature mega-abstraction.

---

- id: TASK-603
  title: Split admin codex / core-rules hot files under ~500 LOC
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor.tsx
    - src/app/(main)/admin/codex/use-admin-archetype-workspace.ts
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/core-rules/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Admin codex/core-rules editors remain multi-file god zones (Feats ~1235, archetype editor ~1101,
    workspace hook ~930, Parts ~882, core-rules page ~981). Slice into co-located modules using
    existing CodexBrowseListShell / spreadsheet patterns; no parallel admin list chrome.
  acceptance_criteria:
    - Each listed hotspot reduced toward ≤ ~500 LOC facade (ship first slice + follow-ups if needed).
    - Reuse CodexBrowseListShell / existing admin patterns — no new list shell.
    - FEATURE_INDEX + build green; no live codex data mutations in this task.
  notes: Prefer Feats + archetype workspace first (largest).

---

- id: TASK-604
  title: Split remaining creator hot files under ~500 LOC
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/creature-creator/use-creature-creator-workspace.ts
    - src/app/(main)/creature-creator/creature-creator-editor.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    After TASK-598 sheet/Advanced splits, remaining creator surfaces still exceed ~800 LOC
    (creature workspace/editor, species page, empowered technique page, guided powers-techniques,
    Advanced ancestry-step). Continue facade + co-located module pattern; extend existing
    guided/creator libs rather than forking.
  acceptance_criteria:
    - Listed files moved toward ≤ ~500 LOC facades (partial OK with concrete follow_up_tasks).
    - No new parallel creator selection/modal systems; barrels stay honest.
    - Targeted vitest where logic extracts to `lib/`; `npm run build` passes.
  notes: Ancestry-step — extract UI panels first (`ancestry-pick-tasks` already shared).

---

- id: TASK-605
  title: Split shared + data-enrichment hot modules (co-located)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/components/shared/grid-list-row.tsx
    - src/lib/data-enrichment.ts
    - src/components/shared/index.ts
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Shared hotspots (~1179 / ~1067 / ~1038 LOC) and `data-enrichment.ts` (~987) need co-located
    extracts without growing the public shared API. Prefer internal modules imported by the
    existing facade; pause for Architect/ADR if new barrel exports or allowlist entries are required.
  acceptance_criteria:
    - Facades for the three shared files + enrichment lib each ≤ ~500 LOC (or partial + follow-ups).
    - No new parallel GridListRow / library section chrome; consumers keep existing imports.
    - If new shared public exports: ADR + allowlist update + `tasks:validate-shared-ui`.
    - `npm run build` + relevant vitest (e.g. grid-list-row-chrome) pass.
  notes: Default Implementer path = private co-located files (Architect if new barrel API).

---

- id: TASK-606
  title: Docs corpus hygiene — changelog rotation + archive index honesty
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/archive/AI_CHANGELOG_ARCHIVE.md
    - src/docs/ai/archive/HISTORY_INDEX.md
    - src/docs/ai/archive/QUALITY_GLOBAL_AUDIT_2026-07-20.md
    - src/docs/ai/ACTIVE_TASKS.md
  description: |
    Live AI_CHANGELOG is ~240KB; archive + docs tree are large. Rotate entries older than ~60 days
    into AI_CHANGELOG_ARCHIVE per `/debt` checklist; ensure HISTORY_INDEX points at the quality
    audit; scrub any live-sounding claims in hot-path docs that lag code (no theater-only rewrites).
  acceptance_criteria:
    - Entries older than ~60 days moved from AI_CHANGELOG.md → archive/AI_CHANGELOG_ARCHIVE.md.
    - Live changelog remains the recent working set; HISTORY_INDEX lists QUALITY_GLOBAL_AUDIT_2026-07-20.
    - No deletion of historical audit dumps without owner ack.
    - `npm run tasks:validate-docs` (or full `tasks:validate`) passes.
  notes: First slice debt-safe under `/debt docs-only`. HISTORY_INDEX already lists the quality audit.

---

- id: TASK-607
  title: API route automated smoke + critical-path coverage slice
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/api/characters/route.ts
    - src/lib/api-client.ts
    - src/lib/api-client.test.ts
    - vitest.config.ts
  description: |
    Coverage shape is strong for domain `lib/` (~63 vitest files) and Playwright visual/a11y, but
    `src/app/api/**` has no co-located route tests (29 routes). Add a thin automated slice:
    Zod/auth/error contract smoke for 1–2 high-traffic routes (start with characters) and/or one
    non-visual critical-path Playwright beyond screenshot ratchets — without standing up a second
    test framework.
  acceptance_criteria:
    - At least one API route has automated tests (vitest) covering happy + auth/validation failure paths.
    - Document how to run the slice in task evidence / BUILD_VALIDATION or package script note.
    - Prefer existing vitest + Playwright configs; no new parallel harness.
    - `npm test` (or targeted vitest) green for new files.
  notes: Ship first slice + follow-ups — do not block on full API matrix.

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
