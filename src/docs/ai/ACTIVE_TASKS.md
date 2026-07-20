# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-593
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-440, 430, 388, 582, 580, 578, 577, 576, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 16 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.


**Hot notes:** Sheet wave **TASK-583→587** (Temp Modifier Architect = 585 first; 583/584/587 parallel OK). Guided Path **TASK-579 / 581** still open. TASK-582 done (sheet polish). TASK-500 deferred. TASK-381: AdminArchetypes 6a–6c shipped (ready to close; species deferred). TASK-388 onboarding done.

---

# Character sheet / list overload + Temp Modifier (TASK-583–587) — owner feedback 2026-07-20
# Order: 585 (Architect ADR) → 586. Parallel OK: 583, 584, 587. TASK-582 done (quick wins).

- id: TASK-587
  title: Sheet Defense Score hover tip (Score pattern)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - public/tooltip-text.tsx
    - src/docs/GAME_RULES.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T035
  developer_test_plan: |
    Suite DEV-V-009 T035 — Defense Score hover tip (add steps when implementing).
  description: |
    Follow-up to TASK-582 abilities/defenses polish. On the character sheet Defenses row, each
    Defense Score value (the large number, not the roll chip and not the defense name) needs a short
    hover/focus tip explaining that the number is a Score and what a Defense Score is per GAME_RULES
    Score pattern (Score = Bonus + 10; Defense Score = 10 + Defense Bonus; passive target). Same tip
    copy for all six scores. Use WordHelpTip (or equivalent word-tied pattern) + export from
    tooltip-text.tsx — do not invent a parallel tip system. Keep copy simple/short; match GAME_RULES
    terminology (Score, Defense Score, Defense Bonus).
  acceptance_criteria:
    - Hovering/focusing any defense Score value shows the shared short tip.
    - Tip states it is a Score and defines Defense Score per core rules (Bonus + 10 pattern).
    - Same tip for all six; does not replace getDefenseHelp on the defense name.
    - Reusable export in tooltip-text.tsx; DEV-V-009-T035; build; changelog; pending-qa.
  notes: |
    Related: TASK-547 (name tips), TASK-582 (abilities/defenses layout).

- id: TASK-583
  title: Collapse Parts/Properties & Proficiencies sitewide + type tips
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/lib/chip/list-row-metadata.ts
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/library-selectable-builders.ts
    - public/tooltip-text.tsx
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T031
  developer_test_plan: |
    Suite DEV-V-009 T031 — Parts/Properties sections default collapsed + InfoTippy (add steps when implementing).
  description: |
    Everywhere Parts & Proficiencies / Properties & Proficiencies appear (sheet, Codex, library,
    selection modals, creature creator), those detailSections start collapsed with a shared chevron
    toggle. Add InfoTippy on the section label: parts/properties are the pieces that compose the
    Power/Technique/weapon/armor/shield; proficiency with each is required to use/wield/wear/perform
    with proficiency; each carries a TP amount — tailor copy per entity family using GAME_RULES
    verbiage. Do NOT collapse ordinary descriptor/quick-reference chips. Extend MetadataDetailSection
    / GridListRow — no forks.
  acceptance_criteria:
    - Parts/Properties & Proficiencies default collapsed on expand of entity row (all surfaces).
    - Chevron opens/closes; InfoTippy with type-appropriate copy.
    - Descriptor chips outside those sections remain visible by default.
    - DEV-V-009-T031; npm run build; changelog; archive pending-qa.

- id: TASK-584
  title: Skills sheet — catalog-all base skills + filters + edit chrome
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/hooks/use-codex.ts
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T032
  developer_test_plan: |
    Suite DEV-V-009 T032 — Skills catalog list + filters + − removes (add steps when implementing).
  description: |
    Skills list model: always show every Codex base skill (no Add Skill opt-in for base skills).
    Sub-skills: proficient ones always shown; unproficient sub-skills only if user added them (add/remove
    for visibility). Top filters: proficient-only vs include unproficient; toggle show sub-skills.
    Edit chrome: Add Skill near title fixed via new model; PointStatus no ugly wrap; pencil floating
    icon-only top-right (compact); steppers not stranded far right; remove per-skill X — decreasing
    with − enough clears skill value then proficiency (and sub-skill when applicable). Species locks stay.
  acceptance_criteria:
    - All base Codex skills listed by default; filters work as specified.
    - Sub-skill visibility rules match owner: prof always; unprof only if added.
    - No remove-X; − path removes value then prof/sub-skill per GAME_RULES allocation.
    - Header not cramped; DEV-V-009-T032; build; changelog; pending-qa.

- id: TASK-585
  title: Architect — Temp Modifier mode (persist, tint, dual affordance)
  created_at: 2026-07-20
  created_by: agent
  priority: critical
  status: not-started
  follow_up_tasks:
    - TASK-586
  related_files:
    - src/components/shared/edit-section-toggle.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/docs/ai/ADR/
    - src/docs/SUPABASE_SCHEMA.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T033
  developer_test_plan: |
    Suite DEV-V-009 T033 — Temp Modifier dual mode + persistence (add steps when implementing).
  description: |
    ARCHITECT (ADR required). Introduce "Temp Modifier" UI convenience (not a GAME_RULES term) beside
    pencil: Lucide PlusMinus / SlidersHorizontal family. Pencil = rules-compliant spend (no intentional
    overspend; red pencil for graceful illegal state). Temp Modifier = layered Bonus/Penalty on top of
    base values (does not rewrite armor/ability base); no resource spend UI; value tint gold (warning
    family like over-max HP/EN) when positive, danger when negative — tint the VALUE not the roll button.
    Persist on character (survive refresh/campaign view). Ability Temp Modifiers cascade to dependents
    except HP/EN/TP maxima unless toggled in Abilities adjust UI (default off). Migrate pattern for
    Speed/Evasion-style override pencils. Owner ack / ADR before new shared control + data shape.
  acceptance_criteria:
    - ADR + schema/docs for persisted temp modifiers.
    - Shared dual affordance pattern (pencil + Temp Modifier) without parallel forks.
    - Tint + cascade + HP/EN/TP toggle contract documented for TASK-586.
    - Owner ack if new shared/ui file; allowlist + generate-index as needed.
    - DEV-V-009-T033 scaffold or full; build; changelog.

- id: TASK-586
  title: Wire Temp Modifier v1 surfaces (header, abilities, defenses, skills)
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T034
  developer_test_plan: |
    Suite DEV-V-009 T034 — Temp Modifier on v1 sheet surfaces (add steps when implementing).
  description: |
    Depends on TASK-585. Wire Temp Modifier to: Speed, Evasion, Critical Range, Damage Reduction,
    Terminal; Abilities (+ HP/EN/TP max toggles); Defenses; Skills. Adjustments stack on top of
    computed/armor defaults (e.g. DR/crit range on top of armor, not editing armor). Pencil paths
    become rules-strict where applicable; existing override-via-pencil fields migrate to Temp Modifier.
  acceptance_criteria:
    - All v1 surfaces support Temp Modifier with tint + persistence.
    - Ability cascade + HP/EN/TP toggles behave per TASK-585 ADR.
    - Pencil cannot intentionally overspend pools.
    - DEV-V-009-T034; build; changelog; pending-qa.
  notes: |
    Depends on TASK-585.

---

# Guided Path / Archetype screen polish (TASK-579, 581) — owner feedback 2026-07-20
# Remaining: 579 (feats deep-dive); 581 after 578 (tooltip docs + Armament consolidate). TASK-578/580 done.

- id: TASK-579
  title: Guided Path feat options — uses as descriptor chips + restriction-notice cohesion
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/lib/detail-option/builders.ts
    - src/lib/detail-option/format-recovery.ts
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/guided-creator/guided-detail-option-list.tsx
    - src/components/guided-creator/guided-restriction-notice.tsx
    - src/lib/codex/feat-restriction-notice.ts
    - src/components/guided-creator/steps/archetype-feats-step.tsx
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T070
  developer_test_plan: |
    Suite DEV-V-013 T070 — Path feat deep-dive uses chips + notices (add steps when implementing).
  description: |
    In Path More details feat option rows, Uses/recovery chips (e.g. "Uses 1 / Full Recovery") must be
    non-expanding DescriptorChips — the label is self-explanatory; drop expandable restatement via
    usesFactChips / featToDetailOption (scope carefully if traits share the helper). Surface the same
    GuidedFeatRestrictionNotice / GuidedRestrictionNotice info-warning style used on later guided feat
    choice cards for state feats and meaningful restrictions — cohesive with archetype-feats-step; do
    not invent a parallel warning UI. Avoid duplicating uses chip and uses sentence when redundant.
  acceptance_criteria:
    - Feat uses chips do not expand when the label already states uses/recovery.
    - Path feat overview shows restriction/info notices consistent with archetype feats step cards.
    - No parallel warning component invented.
    - Add DEV-V-013-T070; npm run build; changelog + archive with pending-qa.
  notes: |
    Soft depends on TASK-577 only to keep Path wave ordered. Independent of TASK-581.
    Same modal as TASK-578 (done) — extend feat option rows carefully.

---

- id: TASK-581
  title: Document L1/guided vs global tooltip layers; consolidate Armament Proficiency tip
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  depends_on:
    - TASK-578
  related_files:
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - public/tooltip-text.tsx
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/character-sheet/library-section.tsx
  build_validation: |
    suite: n/a
  developer_test_plan: |
    Docs + copy consolidation; optional sheet Inventory Armament Proficiency tip smoke if wired.
  description: |
    After TASK-578 ships armamentProficiencyHelp: add a short scoping section to
    guide/04-floating-ui-tooltips.md covering global term tips (same everywhere — abilities, defenses,
    Armament Proficiency) vs guided/L1-simplified tips (shorter teaching copy for creator steps);
    naming convention examples (armamentProficiencyHelp vs guidedArchetypeAbilityHelp). Consolidate
    any duplicate Armament Proficiency strings onto the shared export. Optional low-risk stretch: wire
    the same export on character sheet Inventory Armament Proficiency label; otherwise document as
    follow-up and stop at export + path usage + docs.
  acceptance_criteria:
    - guide/04 documents L1/guided vs global tip layers with examples.
    - Armament Proficiency tip is a shared tooltip-text export used by Path More details (no leftover duplicates).
    - Optional sheet wire documented as done or explicit follow-up.
    - npm run build if UI touched; changelog; archive (verification_status n/a if docs-only, pending-qa if sheet wired).
  notes: |
    Depends on TASK-578 (armament export + Path wire). Do not invent a second Armament tip string.

---

- id: TASK-535
  title: Codex content pass - reclassify clear innate powers on archetype paths
  created_at: 2026-07-17
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-530
  related_files:
    - sql/codex-archetypes-enrich-*-applied.sql
    - src/docs/GAME_RULES.md
  description: |
    TASK-530 left innate-power reclassify empty when energy tags were unclear. Audit each
    path's Level 1 powers/techniques and move only clearly innate entries into the innate
    slot / guidance when GAME_RULES energy taxonomy supports it. No new kit items unless
    owner approves.
  acceptance_criteria:
    - Audit all 12 paths for powers that are unambiguously innate per GAME_RULES.
    - Propose mapping (path, power id, reason) before live UPDATE; owner approve then apply.
    - Paths with ambiguous energy stay unchanged; document skips in notes.
    - Changelog + sql/ when applied.
  notes: |
    Deferred from TASK-530 cleanup. Do not bulk-mutate without owner ack (codex data rule).

---

# TASK-440 done 2026-07-20 — Dense HUD Health/Energy (archive).
# TASK-480 automation backlog → TASK-588–592 (vitest extracts).

# TASK-430 done 2026-07-20 — React Compiler hook warnings cleared (archive; DEV-V-019 pending-qa).

---

# BUILD_VALIDATION automation backlog (from TASK-480) — extract pure helpers + vitest

- id: TASK-588
  title: Vitest — path change reset vs retain draft patch
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-480
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/lib/guided-creator/
  description: |
    DEV-V-001-T013 / DEV-V-013-T032. Extract the same-path vs new-path draft patch from
    PathStep.handleSelect into a pure helper under lib/guided-creator; unit-test retain vs clear.
  acceptance_criteria:
    - Pure helper used by path-step (no duplicated reset object in the component).
    - Vitest covers same-path retain and different-path invalidate (abilities/skills/feats/loadout/powers).
    - npm test green; changelog.

- id: TASK-589
  title: Vitest — technique load columns (DEV-V-016-T002)
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-480
  related_files:
    - src/lib/library-selectable-builders.ts
    - src/lib/library-selectable-builders.test.ts
  description: |
    Extend library-selectable-builders tests for technique header/column contract
    (Action, Energy, Attack, Training Pts) matching sheet add / creator Load.
  acceptance_criteria:
    - getListHeaderColumns('technique') + getItemColumns / buildSelectableItem assertions.
    - npm test green; update DEVELOPER_TASK_QUEUE matrix row #9 to CI.

- id: TASK-590
  title: Vitest — innate threshold filter / TP parity (DEV-V-013-T057)
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-480
  related_files:
    - src/lib/guided-creator/powers-techniques-l2.ts
    - src/lib/guided-creator/loadout-tp.ts
  description: |
    Cover innate catalog filter (energy ≤ threshold) and TP spend parity for innate vs regular
    via existing powers-techniques-l2 / loadout-tp helpers — no UI e2e.
  acceptance_criteria:
    - Vitest for threshold include/exclude and innate TP counting where helpers already exist.
    - npm test green; matrix row #6 → CI.

- id: TASK-591
  title: Vitest — ancestry pick task order (DEV-V-013-T061)
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-480
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/lib/guided-creator/
  description: |
    Extract ancestry PickTask list builder (characteristic → ancestry trait → optional flaw →
    bonus ancestry) from ancestry-step into lib; unit-test order and flaw-gated second trait.
  acceptance_criteria:
    - Pure builder used by ancestry-step.
    - Vitest asserts phase order and flaw → ancestry-trait-2 presence.
    - npm test green; matrix row #8 → CI.

- id: TASK-592
  title: Vitest — guided Continue advances one screen (DEV-V-013-T059)
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-480
  related_files:
    - src/stores/guided-creator-store.ts
  description: |
    Store nextSubStep / chapter entry already encodes “never jump to furthest.” Add focused
    vitest (or extract pure next-index helper) proving Continue advances one sub-step from
    chapter entry, not furthest completed.
  acceptance_criteria:
    - Automated coverage of one-screen advance vs furthest-jump regression.
    - Prefer pure helper extract if store is hard to unit-test; no Playwright required.
    - npm test green; matrix row #7 → CI.

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

- id: TASK-381
  title: BIG-01/02 phased decomposition of character-sheet and creator god files
  priority: medium
  status: partial
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
    Sheet + power/item + creature + AdminArchetypes (6a–6c) shells shipped. Species deferred.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/components/character-sheet/use-sheet-library-actions.ts
    - src/components/character-sheet/use-sheet-resource-actions.ts
    - src/components/character-sheet/use-sheet-feat-actions.ts
    - src/components/character-sheet/use-sheet-skill-identity-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/creature-creator-editor.tsx
    - src/app/(main)/creature-creator/use-creature-creator-workspace.ts
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/power-creator/use-power-creator-workspace.ts
    - src/app/(main)/power-creator/power-creator-editor.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/item-creator/use-item-creator-workspace.ts
    - src/app/(main)/item-creator/item-creator-editor.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/admin-archetype-path-form.ts
    - src/app/(main)/admin/codex/admin-archetype-path-rows.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor.tsx
    - src/app/(main)/admin/codex/use-admin-archetype-workspace.ts
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  completed_work: |
    Phase 2 (sheet): `use-character-sheet-actions.ts` is a thin facade composing
    `use-sheet-{library,resource,feat,skill-identity,auto-proficiencies}-actions`.
    Phase 1 (power/item editors): presentational section islands in `*-creator-editor.tsx`.
    Phase 3 (2026-07-20): workspace state/cost/save/load extracted to
    `use-power-creator-workspace.ts` + `use-item-creator-workspace.ts`; pages are bootstrap
    gate + CreatorPageShell wiring only (~265 / ~301 LOC). Load handlers typed via exported
    `PowerLibraryRecord` / `ItemLibraryRecord` (no `any`). DEV-V-018-T008 + rollback note.
    Phase 4 (2026-07-20): creature form body → `creature-creator-editor.tsx`. DEV-V-018-T009.
    Phase 5 (2026-07-20): creature state/stats/modals data → `use-creature-creator-workspace.ts`;
    page shell-only (~377 LOC) + editor (~815) + workspace (~1014). DEV-V-018-T010. Build/test green.
    Phase 6a (2026-07-20): AdminArchetypes pure form helpers → `admin-archetype-path-form.ts`
    (~297 LOC); `SelectedFeatRows` / `PathQuantityRow` → `admin-archetype-path-rows.tsx` (~76);
    tab ~1900 LOC (was ~2184). Uses shared `PathItemRecommendation`. DEV-V-008-T023.
    Phase 6b (2026-07-20): modal body → `admin-archetype-editor.tsx` (~1082 LOC); tab shell
    ~925 LOC (list + modal footer + option memos + save). DEV-V-008-T024.
    Phase 6c (2026-07-20): state/options/save → `use-admin-archetype-workspace.ts` (~869 LOC);
    tab shell-only (~175 LOC). DEV-V-008-T025.
  remaining_work: |
    Implementable AdminArchetypes + creator god-file phases complete. Technique/empowered
    already had editor islands. Species creator deferred from beginner funnel — no further
    TASK-381 phases unless owner reopens. Ready to archive as done + pending-qa after
    owner runs DEV-V-008 T023–T025 (and/or says close).
  follow_up_tasks:
    - TASK-430
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.
    2026-07-19 /debt (/global-audit): marked partial — sheet AC satisfied; do not rediscover
    sheet split. TASK-430 may clean domain hook warnings independently.
    2026-07-20: Phases 3–5 (power/item workspace, creature editor + workspace) — do not rediscover.
    2026-07-20: Phase 6a–6c AdminArchetypes helpers/rows/editor/workspace — do not rediscover.
    2026-07-20 /cleanup: dropped dead workspace return + private form helpers — do not rediscover.
    Rollback Phase 3: drop use-*-creator-workspace.ts and restore prior page bodies (DEV-V-018-T008).
    Rollback Phase 4: drop creature-creator-editor.tsx and restore page children (DEV-V-018-T009).
    Rollback Phase 5: drop use-creature-creator-workspace.ts and restore prior page body (DEV-V-018-T010).
    Rollback Phase 6a: inline form helpers + rows into AdminArchetypesTab; delete extracted modules
    (DEV-V-008-T023).
    Rollback Phase 6b: inline modal body into AdminArchetypesTab; delete admin-archetype-editor.tsx
    (DEV-V-008-T024).
    Rollback Phase 6c: inline workspace into AdminArchetypesTab; delete use-admin-archetype-workspace.ts
    (DEV-V-008-T025).

---

# TASK-388 done 2026-07-20 — Post-activation onboarding (archive).
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
