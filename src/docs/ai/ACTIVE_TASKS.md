# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-781
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-780, TASK-774, TASK-773, TASK-771, TASK-770, TASK-762, TASK-753, TASK-764, TASK-408, TASK-752, TASK-763, TASK-761, TASK-757, TASK-756, TASK-759, TASK-758, TASK-760, TASK-733, TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 5 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Owner 2026-08-15 picked **TASK-780 A** (expanded Feat Levels chips; pending-qa T048). **778/779** still open (Skills filters; trait type chip). **775 still Proposed**. 3A pending-qa. **3C** queued. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415.

---

- id: TASK-775
  title: Codex per-collection fetch + CodexBrowseListShell virtualization
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/docs/ai/ADR/0015-wave-3b-fetch-contracts.md
    - src/docs/ai/ADR/0005-codex-browse-list-shell.md
    - src/app/api/codex/route.ts
    - src/hooks/use-codex.ts
    - src/lib/api-client.ts
    - src/components/shared/codex-browse-list-shell.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/hooks/use-path-recommendation-index.ts
  description: |
    Report 07 P1-3 / P2+: Codex browse downloads the full /api/codex payload (shared ['codex'] key)
    and mounts every filtered row. Keep GET /api/codex (full) for admin/creators/useGameRules.
    Optional ?collection= plus per-hook query keys. Virtualize CodexBrowseListShell — do not rebuild
    it or fold into OfficialEntityList (ADR-0005). Path filter (TASK-751–753) stays.
  acceptance_criteria:
    - GET /api/codex?collection=<payload key> returns that slice; omitted param still returns full.
    - useCodex* browse hooks use ['codex', collection]; useCodexFull keeps ['codex'].
    - CodexBrowseListShell virtualizes row children (@tanstack/react-virtual unless owner prefers page size).
    - Path filter still works (archetypes slice, not full payload).
    - Tests: typecheck, lint, hook/route tests, npm run build.
    - User-facing: BUILD_VALIDATION (Codex browse) + pending-qa.
  notes: |
    Wave 3B optional (after 773/774 unless owner says start here). Collection query is API-contract
    (ADR-0015). Virtualization-only can ship first if owner wants a no-API slice. New dependency
    @tanstack/react-virtual needs the same ack (alternative: paginate).

---

- id: TASK-776
  title: Campaign character GET vitest (encounter scope + enrichment)
  created_at: 2026-08-15
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    - src/app/api/characters/[id]/route.test.ts
    - src/lib/character-view-enrichment-server.ts
    - src/hooks/use-campaigns.cache.test.ts
  description: |
    TASK-773 AC is true in the campaign character route (encounter returns HP/EN/AP only;
    full RM GET adds libraryForView + enrichment), but that route has no auth/IDOR/payload
    vitest. Character GET already covers owner-omit / other-user-include. Add a focused
    route test so encounter vs full view cannot drift.
  acceptance_criteria:
    - Vitest for GET /api/campaigns/[id]/characters/[userId]/[characterId].
    - ?scope=encounter JSON has no libraryForView and no enrichment.
    - Full RM GET includes both; non-RM full GET stays 403; unauthenticated 401.
    - Do not reopen TASK-761 query keys or TASK-762 combat wiring.
    - Tests: typecheck, lint, targeted vitest.
  notes: |
    Optional later from TASK-773 audit. Pre-existing coverage hole listed in
    DEVELOPER_TASK_QUEUE (campaigns character view route). Copy the character [id]
    route.test mock style. Not user-facing; no BUILD_VALIDATION suite.

---

- id: TASK-777
  title: Shared Codex row mappers for /api/codex and view enrichment
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/api/codex/route.ts
    - src/lib/character-view-enrichment-server.ts
    - src/lib/codex/feat-ability.ts
    - src/lib/game/character-legality.ts
    - src/types/codex.ts
  description: |
    TASK-773 shipped compact mapFeat/mapSkill/mapSpecies/mapTrait/mapPart/mapProperty/
    mapEquipment plus local toStrArray/toNum helpers in character-view-enrichment-server.
    GET /api/codex has a fuller parallel mapper. Extract one lib/codex row-map module so
    a missed field cannot blank an RM/other-user sheet row while Codex browse shows it.
  acceptance_criteria:
    - One mapper module under src/lib/codex/ used by GET /api/codex and
      getCharacterViewEnrichment. Delete the local map* / toStrArray trio from both
      call sites (keep route-only fields like version/admin lock in the route).
    - Reuse normalizeFeatAbilities and mapCodexBaseSkillToId; do not fork them.
    - Sheet enrichment fields are a superset of what useCharacterSheetDerived reads.
    - Tests: typecheck, lint, vitest on the mapper + existing enrichment/codex tests,
      npm run build.
    - Not user-facing unless a mapping bug is found; then pending-qa + BV note.
  notes: |
    Owner asked to file this fork-collapse (773 cleanup). Do not mix with TASK-775
    collection/virtualize. New file under existing lib/codex/ — not a new shared/ui
    or API contract. No ADR unless the mapper becomes a second payload shape.

---

- id: TASK-778
  title: Compact sheet Skills All/Proficient + Sub-Skills toggle
  created_at: 2026-08-15
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/lib/character/sheet-skills-display.ts
    - src/components/shared/segmented-control.tsx
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Sheet Skills All vs Proficient uses the same bulky SegmentedControl chrome as
    SourceFilter (All / Realms / My Library). Owner wants a smaller, uninvasive
    pair of controls: All/Proficient plus a show/hide sub-skills toggle labeled
    Sub-Skills (not "Show sub-skills"). Filter logic in sheet-skills-display stays.
  acceptance_criteria:
    - Skills toolbar is visually lighter than SourceFilter; not a FilterSection panel.
    - All / Proficient still filters via existing SkillProficiencyFilter.
    - Sub-skills toggle label is "Sub-Skills"; checked = show, unchecked = hide.
    - Desktop chrome stays compact (MOBILE_UX: do not inflate sheet filters to 44px
      on md+). Touch targets remain ≥44px below md.
    - Prefer extending SegmentedControl with a compact size, or ChipSelect — do not
      add a new shared filter component.
    - Update FEATURE_INDEX + DEV-V-009 T032 copy (Show sub-skills → Sub-Skills).
    - Tests: typecheck, lint, npm run build. User-facing: pending-qa.
  notes: |
    Follow-up to TASK-584 (do not reopen). Owner 2026-08-15. Architect pause only
    if a new shared/ui file is proposed.

---

- id: TASK-779
  title: Sheet trait type chip expanded-only
  created_at: 2026-08-15
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/library-feat-rows.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/grid-list-row-collapsed.tsx
    - src/components/shared/grid-list-row-expanded.tsx
    - src/lib/chip/descriptor-chip-variants.ts
  description: |
    Traits in the sheet Feats/Traits list show kind twice when expanded
    (Characteristic in the collapsed name and again as an expanded DescriptorChip).
    Owner: type is only needed in the expanded view.
  acceptance_criteria:
    - Collapsed trait rows do not show Ancestry / Characteristic / Flaw in the header.
    - Expanded trait rows show kind once as a DescriptorChip (not ExpandableChip).
    - Species kind stays omitted (current mapTraitRows skip).
    - Do not change path-filter showBadgesInName name chips.
    - Do not globally hide compact GLR badges (state-feat Archetype/Character badges
      and Codex path chips stay).
    - Tests: typecheck, lint, npm run build. User-facing: pending-qa + DEV-V-009 note.
  notes: |
    TASK-415 leftover. Compact GLR paints badges on the name and, unless
    showBadgesInName, again in the expanded body. Fix at mapTraitRows (drop header
    badges; expanded-only DescriptorChip) rather than changing GridListRow defaults.
