# AI Task Queue (Active Only)

**Last slimmed:** 2026-06-26 (TASK-382). Full history: [`archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md`](archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md) and [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md).

**Next task ID:** TASK-432

**Agent rules:** Skip `blocked` tasks and any task with `assignee:` set to a human (e.g. TASK-353, **TASK-414**). Skip human-only tasks (TASK-353 → `DEVELOPER_TASK_QUEUE.md` DEV-001). Pick highest-priority `not-started` or continue `partial`. **Do not start TASK-408–413** until TASK-414 spec is `done` (owner approval).

---

- id: TASK-430
  title: React Compiler hook warnings — exhaustive-deps / set-state-in-effect / preserve-manual-memoization
  created_at: 2026-07-13
  created_by: agent
  priority: low
  status: partial
  parent_task: TASK-321

  description: |
    Follow-up from TASK-321. After clearing unused-vars / no-explicit-any / raw-color errors, remaining
    ESLint noise is React Compiler hook rules (~171): set-state-in-effect (58), exhaustive-deps (104),
    preserve-manual-memoization (9). eslint.config.mjs intentionally keeps these as warnings so lint
    stays actionable without blocking. Fix in small, behavior-preserving batches with DEV-V where UI syncs.
  related_files:
    - eslint.config.mjs
    - src/app/(main)/library/page.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/hooks/use-creator-save.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(auth)/login/page.tsx
  acceptance_criteria:
    - Material reduction in react-hooks/* warnings without cascading re-render regressions.
    - Prefer removing unnecessary effects over blanket eslint-disable.
    - exhaustive-deps changes must not alter intentional mount-only / stable-ref patterns.
    - npm run build + lint pass; no new errors.
  build_validation: DEV-V-019
  developer_test_plan: |
    Run DEV-V-019-T001–T005 in BUILD_VALIDATION.md (choice-card, login, admin feat remount, library clamp, edit-archetype remount).
  completed_work: |
    Batch 1 (2026-07-15): 168 → 158 hook warnings (−10).
    - guided-choice-card: derive inactive overflow; sync expand via render when selected changes.
    - species-creator: module TRAIT_LIMITS; drop unnecessary form/traitLimits deps.
    - AdminArchetypesTab: hoist toLeveledFeatLike.
    - AdminFeatsTab: remount edit modal with key={sessionKey}; seed drafts in useState; remove reset effects.
    - login: derive auth query error (no setState-in-effect); dismiss URL message on new attempt (parity with old setError(null)).
    - empowered getPayload: add missing isReaction dep.
    - Audit follow-up: DEV-V-019 T001–T003; drop unused skillIdToName on AdminFeatEditModal.
    Batch 2 (2026-07-15): 158 → 138 hook warnings (−20).
    - library page: derive mode from auth/?view=; clamp Enhanced tab without effects.
    - guided/advanced ancestry+equipment + guided skills: stable empty fallbacks for hook deps.
    - library-section: memoize tabs; derive active tab / edit-mode sync without effects.
    - EditArchetypeModal: remount-on-open key (CharacterSheetModals); remove reset effect.
    - useCreatorSave: add queryClient + setShowPublishConfirm deps.
    - DEV-V-019 T004–T005.
  remaining_work: |
    - ~138 left: set-state-in-effect 48, exhaustive-deps 81, preserve-manual-memoization 9.
    - High-blast next: character-sheet actions (45), advanced skills/powers steps, encounter views,
      creator cache/?edit hydrations (prefer lazy init / remount keys where safe).
  notes: |
    Do not mass-disable. High-blast files: character sheet, encounter views, guided reveal.
    Keep status partial until warning count is materially flattened or owner closes residual as intentional.

- id: TASK-429
  title: Guided feat steps — Layer 2 browse (GuidedLayerNav)
  created_at: 2026-07-11
  created_by: agent
  priority: high
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T012
  developer_test_plan: |
    DEV-V-013-T012 — Archetype + character feat See more → L2 browse; Back to recommendations.
  related_files:
    - src/components/guided-creator/guided-feats-browse-panel.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/lib/guided-creator/feat-selection.ts
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Add Layer 2 to guided archetype feats and character feat steps per REALMS §3 / §5.6.
    Use abilities/species grammar: GuidedLayerNav below content expands to in-step filtered
    ranked browse (not a modal); same slot collapses with Back to recommendations. L2 hides
    unmet requirements by default; path recommendations pinned; selection uses capped swap.
  acceptance_criteria:
    - Both feat steps show GuidedLayerNav "See more…" below L1 cards.
    - Expand replaces L1 with browse panel (search, category/ability filters, eligible feats).
    - Collapse returns to L1 groups without clearing selections.
    - Selections update live with swap-at-cap; Continue still requires exact max.
  notes: |
    Owner ask 2026-07-11 — Layer 2 like abilities go-deeper / go-back, not grey-out lock.
  implemented_by: agent
  evidence: |
    GuidedFeatsBrowsePanel + feat-selection helpers; wired both feat steps; unit tests for swap helper.

---

- id: TASK-428
  title: Guided archetype feats — swap selection like ancestry
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T011
  developer_test_plan: |
    DEV-V-013-T011 — At-cap archetype feat cards stay interactive; pick another swaps (no grey-out).
  related_files:
    - src/components/guided-creator/steps/archetype-feats-step.tsx
  description: |
    Archetype feat GuidedChoiceCards grey out and block selection once maxFeats is filled,
    unlike ancestry trait picks which replace the current choice. Align to ancestry-style swap:
    under cap add; at cap selecting a new card replaces the most recent pick; selected cards
    remain toggleable to deselect. No opacity/disabled lock on unselected cards.
  acceptance_criteria:
    - At max archetype feats, unselected cards are full opacity and clickable.
    - Clicking an unselected card at capacity swaps it in (replaces last selected); count stays at max.
    - Clicking a selected card still deselects; Continue requires count === maxFeats.
    - Character feat step already replaces — no regression.
  notes: |
    Owner feedback 2026-07-11 — selection grammar unity with ancestry traits.
  implemented_by: agent
  evidence: |
    Removed atCap grey-out; selectFeat adds under cap, swaps (drop last + add) at cap, toggles off when selected.

---

- id: TASK-427
  title: Add modals — browse when selection budget exhausted
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T010
  developer_test_plan: |
    DEV-V-013-T010 — Browse all skills with 0 points: readable rows, selectable + warning, Add blocked until points freed.
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    When maxSelections is 0 (e.g. all skill points spent), UnifiedSelectionModal greys out every
    row (opacity-50), making browse/read hard. Soften capacity: keep rows readable and selectable;
    show a warning that budget is exhausted; block Add Selected until under the limit.
  acceptance_criteria:
    - With 0 skill points remaining, Browse all skills rows are full opacity and expandable.
    - User can select skills; warning explains need to free points; Add Selected stays disabled while over limit.
    - Same soft-limit behavior for any UnifiedSelectionModal with maxSelections (including max 0).
  notes: |
    Owner feedback 2026-07-11 — guided skills add modal; pattern applies to all add modals.
  implemented_by: agent
  evidence: |
    Soft maxSelections in UnifiedSelectionModal; skill copy via selectionLimitMessage; advanced Add Skill opens at 0 pts.

---

- id: TASK-426
  title: Guided ancestry — Skip no flaw as choice card
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T009
  developer_test_plan: |
    DEV-V-013-T009 — Flaw step Skip card matches GuidedChoiceCard grid; select + Next pick advances.
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Optional flaw step showed Skip as a small secondary Button under the card grid — visually
    mismatched and easy to miss under the footer. Render Skip as a GuidedChoiceCard peer in the
    same compact grid; selecting records explicit decline (selectedFlawId ''); Continue advances.
  acceptance_criteria:
    - Skip is a GuidedChoiceCard in the flaw options grid with title + description.
    - Selecting Skip selects the card (check); Next pick leaves ancestry without bonus trait.
    - No separate secondary Skip button below the grid.
  notes: |
    Owner feedback 2026-07-11 — screenshot audit `.guided-flaw-audit/`.

---

- id: TASK-425
  title: SegmentedControl idle segments — clearer borders (species size)
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T008
  developer_test_plan: |
    DEV-V-013-T008 — Species overview size SegmentedControl idle borders visible before selection.
  related_files:
    - src/components/shared/segmented-control.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
  description: |
    Guided species overview size picker (SegmentedControl) had no visible distinction between
    unselected options until one was selected. Strengthen shared SegmentedControl idle/track
    styling site-wide so segments read as distinct choices (borders + surface) while keeping
    primary selected state.
  acceptance_criteria:
    - Idle segments have visible border and surface fill distinct from the track.
    - Track has an outer border; selected segment remains primary-button fill.
    - Species overview multi-size picker and Library/SourceFilter still use SegmentedControl.
  notes: |
    Owner feedback 2026-07-11 — size buttons unclear until selected; fix universal component.

---

- id: TASK-424
  title: Guided equipment phased sub-flow (weapon → armor → gear)
  created_at: 2026-07-06
  created_by: agent
  priority: high
  status: done
  build_validation: DEV-V-013-T004, DEV-V-013-T006, DEV-V-013-T013
  developer_test_plan: |
    DEV-V-013-T004 — Berserker quick kits + phased weapon L1 cards.
    DEV-V-013-T006 — See more opens Layer 2 modal with TP bar.
    DEV-V-013-T013 — Weapon → armor → gear phase walk + progress chips.
  completed_work: |
    Phase 0: GUIDED_EQUIPMENT_PHASED_SPEC.md; FEATURE_INDEX.
    Phase 1: weapon-attack-ability.ts (+ thrown fix, sheet refactor); equipment-eligibility.ts;
    equipment-phase-stats.ts; equipment-currency.ts; unit tests.
    Phase 2: GuidedDraft schema v5; build-character currency + armor/shields; loadoutDraftFromSelection split;
    archetype armorStep/sharedEquipment types.
    Phase 3: equipment-phase-nav.ts; guided-equipment-phase-progress/layout; loadout-step phased router
    (SegmentedControl, in-step footer nav, L2 See more); armorStep parse; armaments sync.
    Phase 4–6: guided-equipment-l1-phase.tsx (unified weapon/armor/gear L1 GuidedChoiceCard);
    guided-equipment-l2-modal.tsx + guided-equipment-l2.ts (UnifiedSelectionModal, PointStatus);
    use-guided-equipment-catalog.ts hook; equipment-catalog-rows.ts; equipment-phase-candidates.ts.
    Phase 7: guided-loadout-kit-presets.tsx (quick kit GuidedChoiceCard); removed customize panel + loadout section.
    Phase 8: admin armorStep select + shared path gear; level1_loadouts object wrapper (kits + metadata);
    parseLevel1LoadoutsField / serializeLevel1LoadoutsField; archetype-display loadouts column parity.
    Final: guided-equipment-phase-selection.tsx; guided-equipment-l2-grid.ts; resolveRefUnitCost helper.
    Phase 10 (2026-07-13): DEV-V-013-T013 + expanded Playwright audit; fixed kit apply to split armor
    nested in armaments[] via library lookup (blocked Continue to gear); re-split when catalog loads.
  remaining_work: |
    Path loadout content for remaining paths stays owner-gated (TASK-423).
  follow_up_tasks:
    - TASK-423
  notes: |
    Parent TASK-422. Spec in src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md.
    Agent UI/libs complete; owner seed for 11 paths + Berserker kit cleanup = TASK-423.
  description: |
    Replace guided loadout kit picker + monolithic mix-and-match with three in-step phases per
    REALMS §5.7 and GUIDED_EQUIPMENT_PHASED_SPEC.md. Layer 1 GuidedChoiceCard per phase; Layer 2
    UnifiedSelectionModal with full filtered Common library. Reuse PointStatus, equipment-currency,
    weapon-attack-ability, equipment-eligibility libs. Kits = quick presets. armorStep path metadata.
  related_files:
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/guided-equipment-phase-progress.tsx
    - src/components/guided-creator/guided-loadout-kit-presets.tsx
    - src/lib/guided-creator/equipment-eligibility.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-currency.ts
    - src/lib/guided-creator/resolve-loadout-items.ts
    - src/lib/game/weapon-attack-ability.ts
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/types/archetype.ts
    - src/components/shared/unified-selection-modal.tsx
    - tests/visual/guided-loadout-audit.pw.ts
  acceptance_criteria:
    - Three phases (weapon/shield, armor, gear) with progress chips; armor skippable via armorStep.
    - Layer 1 choice cards; Layer 2 per-phase UnifiedSelectionModal (full filtered eligible catalog).
    - L2 filters: ability met, armamentMax per item, Common rarity, gear ≤50c; weapon ranking by path + archetype ability.
    - Currency persists on draft after weapon/armor spend; shared components only (no CreatorResourceBar).
    - Kits pre-fill all phases; Berserker pilot end-to-end; npm run build passes.
  notes: |
    Parent TASK-422. Spec in src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md (human/ path cursorignored).
    Phases 0–1 libs first; UI phases 3–7; content TASK-423 owner-gated.

---

- id: TASK-422
  title: Guided equipment step — loadout UX rework (§5.7)
  created_at: 2026-07-05
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-13
  build_validation: DEV-V-013-T004, DEV-V-013-T006, DEV-V-013-T007, DEV-V-013-T013
  developer_test_plan: |
    DEV-V-013-T004 — Berserker phased loadout + quick kits.
    DEV-V-013-T006 — See more opens Layer 2 modal with TP bar (Confirm applies).
    DEV-V-013-T007 — Admin path save rejects loadout exceeding TP budget.
    DEV-V-013-T013 — Weapon → armor → gear phase walk.
  description: |
    Replace minimal guided loadout cards with REALMS §5.7 equipment UX. Superseded UI path
    completed via TASK-424 (phased weapon → armor → gear). Path content seeding remains TASK-423.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/guided-equipment-l2-grid.ts
    - src/components/guided-creator/guided-loadout-kit-presets.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/guided-creator/resolve-loadout-items.ts
    - src/lib/game/path-validation.ts
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - Phased equipment flow (weapon/armor/gear) with quick kits and Layer 2 UnifiedSelectionModal.
    - Reveal/saved character show resolved item names.
    - Admin validatePathDataForPublish rejects loadout TP over martial budget.
    - Path content for remaining archetypes tracked on TASK-423 (owner).
  completed_work: |
    Phases 1–3 (2026-07-05): item resolution, sections/unarmed, customize + admin TP.
    Superseded by TASK-424 phased L1/L2 (customize panel removed Phase 7).
    2026-07-13 audit: marked done — UI AC delivered by TASK-424; seed leftover = TASK-423 only.
  remaining_work: |
    None for agent UI. Owner seed: TASK-423.
  follow_up_tasks:
    - TASK-423
  notes: |
    Owner review 2026-07-05: TASK-401 shipped minimal cards; product vision in REALMS §5.7 not met.
    Live DB: 1/12 paths have loadouts (Berserker only); Monk has unarmed flag but no loadouts.
    2026-07-13: Closed as done — do not chase deleted GuidedLoadoutCustomizePanel / section UI.

---

- id: TASK-423
  title: Guided loadout path content — seed kits for 11 paths + Berserker fixes
  created_at: 2026-07-05
  created_by: agent
  priority: medium
  status: not-started
  assignee: owner
  description: |
    Author level1_loadouts JSON for remaining 11 archetype paths; apply proposed Berserker kit
    title/item alignment and shared path gear (bandages/potions). Requires owner review before
    live codex UPDATE (see sql/guided-berserker-loadout-fixes-proposed.sql).
  related_files:
    - sql/guided-berserker-loadout-fixes-proposed.sql
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - All 12 paths have at least one valid level1_loadout kit within TP budget.
    - Berserker kit titles match item contents; shared level1_equipment included in kits.
    - DEV-V-013-T004 passes with corrected kit names.
  notes: |
    Follow-up from TASK-422 partial. Codex writes require owner approval per realms-codex-data.mdc.

---

- id: TASK-419
  title: Guided skills step — Layer 1 presentation (§5.5)
  created_at: 2026-07-03
  created_by: agent
  priority: high
  status: done
  description: |
    Replace SkillsAllocationPage embed in guided creator with guided-native skill list: labeled centered point budget,
    simplified rows (bonus ±, X remove), path skill chips in PathHelpCard, browse-all link instead of floating Add Skill.
  related_files:
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - No spreadsheet table / prof column in guided skills step.
    - Single labeled skill-point display centered above list; footer shows remaining/complete text only.
    - Path skills toggled via SkillSourceChip in path help card.
    - Advanced creator SkillsAllocationPage unchanged.
    - npm run build passes.
  build_validation: DEV-V-013-T014
  developer_test_plan: |
    DEV-V-013-T014 — Guided skills Layer 1 (path chips + budget + browse).
  notes: |
    2026-07-03: Owner feedback on skills step UX mismatch vs other guided steps. npm run build pass.

---

- id: TASK-321
  title: Reduce ESLint warnings (batch by rule)
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~324 ESLint warnings dominated by `@typescript-eslint/no-unused-vars`,
    `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Address in batches by rule.
  related_files:
    - (repo-wide)
  acceptance_criteria:
    - Warning count materially reduced; no new errors introduced.
    - `react-hooks/exhaustive-deps` fixes do not change runtime behavior.
    - `npm run build` passes.
  completed_work: |
    - Batch 1 lint fix; 0 errors.
    - Batch 2 (TASK-350): lib/hooks no-unused-vars; character sheet page destructuring; ESLint 393→339 warnings.
    - Batch 3–4 (2026-07-13): cleared all unused-vars (141→0); fixed 4 lint errors (raw color tokens,
      InfoTippy Floating UI refs disables); removed dead PROPERTY_IDS re-export (batch-3 gap);
      fixed agent gaps (login dead `ready` state, official-entity-list canAdd(row)→canAdd());
      cleared admin no-explicit-any (40); a11y aria-sort; unused eslint-disable; dynamic img disables.
      Baseline before: 360 warnings / 4 errors → after: ~171 warnings / 0 errors (react-hooks only).
  remaining_work: |
    - React Compiler hook warnings deferred to TASK-430 (eslint.config keeps them as warn on purpose).
  follow_up_tasks:
    - TASK-430
  notes: "2026-07-13 DONE for unused-vars/any/errors scope. Hook residuals → TASK-430."

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

- id: TASK-346
  title: "Systemic token & console cleanup (batch by rule)"
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  completed_at: 2026-07-13
  description: |
    Repo-wide batch cleanup: status colors -600 → -700 in light mode; replace stray gray-*/neutral-* outside auth;
    remove leftover client debug console.*. Do in small, rule-scoped batches with build between.
  related_files:
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/shared/roll-button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/button.tsx
    - src/app/(main)/my-account/page.tsx
    - eslint-rules/raw-color-backlog.mjs
  acceptance_criteria:
    - Status/secondary text passes WCAG AA tokens in both modes; no stray gray-*/neutral- utilities outside auth (theme `--color-neutral-*` ramps OK).
    - No leftover client debug `console.log`/`debug`; diagnostic `console.error` in error boundaries / route error UI / OAuth failure handlers allowed.
    - `realms/no-raw-color` reports 0 violators outside auth + `components/ui` exemptions; `RAW_COLOR_BACKLOG` empty.
    - npm run build + lint pass.
  completed_work: |
    - Batch 1–2: footer/roll-button/console purge; status -600→-700; home/item-creator neutrals.
    - Batch 3–4: emptied TSX backlog allowlist; semantic tokens across admin/codex/creators/sheet/shared.
    - Audit 2026-07-13: globals.css tab/stepper/search/skeleton/shimmer/glow → semantic tokens; Button
      primary/danger `text-text-on-dark`; AGENT_GUIDE exceptions corrected; AC clarified for diagnostic consoles.
  remaining_work: |
    (none for token migration)
  notes: |
    2026-07-13 done. Auth gray + ui primitive exemptions remain by design. Server/API console.error unchanged
    (out of scope). Optional follow-up: shared client logger if product wants structured error reporting.

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  assignee: human
  notes: "**Human-only — AI skip.** DEVELOPER_TASK_QUEUE DEV-001."

- id: TASK-376
  title: Retire DB tooltips — full migration to Collin Tippy + tooltip-text.tsx
  priority: high
  status: done
  created_at: 2026-06-25
  created_by: owner
  description: |
    Contextual help uses `InfoTippy` + `public/tooltip-text.tsx` (Floating UI engine — see TASK-392).
    Historical Tippy.js stack retired.
  related_files:
    - public/tooltip-text.tsx
    - src/components/shared/info-tippy.tsx
  acceptance_criteria:
    - All contextual help uses Tippy + `public/tooltip-text.tsx`
    - Legacy DB tooltip stack removed; build passes
  notes: |
    Completed 2026-06-29: InfoTippy shared component, full creator + campaigns + navbar migration,
    legacy stack removed (useTooltipByKey, ContextHelpTooltip, HelpTooltip, admin/API routes, user toggle).
    Copy centralized in public/tooltip-text.tsx. Engine migrated to Floating UI in TASK-392 (2026-06-30).
    DB cleanup DEV-376 done 2026-06-30: dropped ui_tooltips + show_tooltips (sql/drop-legacy-ui-tooltips-2026-06.sql).

- id: TASK-378
  title: HYG-01 codex typing hardening + legacy payload compatibility gates
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Replace `fetchCodex`'s `any`-based response typing with a canonical typed payload, preserving
    compatibility adapters for historical data shapes (roll/campaign displays).
  related_files:
    - src/lib/api-client.ts
    - src/hooks/use-codex.ts
    - src/hooks/use-game-data.ts
    - src/hooks/use-game-rules.ts
    - src/components/character-sheet/roll-log.tsx
    - src/types/campaign-roll.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  acceptance_criteria:
    - `fetchCodex` returns a strongly typed payload (no broad `Record<string, any[]>`).
    - All `useCodex*`/rules consumers compile without `any` fallback leakage.
    - Roll timestamp compatibility remains safe for ISO + legacy `{ seconds }` payloads.
    - `photoURL` semantics documented as active auth/profile alias.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation suite added/indexed for codex + roll-log compatibility checks.
  follow_up_tasks:
    - TASK-420
    - TASK-421
  notes: |
    Planned from remediation close-out. Compatibility-first phases required.
    DONE 2026-07-03: `CodexPayload` in `src/types/codex.ts`; typed `fetchCodex` + server route; entity types moved from hooks/codex-types; roll timestamp util extracted; character sheet uses CodexFeat/CodexSkill; vitest shape + timestamp tests; build pass.
    Follow-ups: TASK-420 done (library API typing); TASK-421 (enhanced items typing). Creator load `any` handlers → TASK-381.

- id: TASK-379
  title: DUP-05/08 unify library selection pipelines and make LoadFromLibraryModal a thin wrapper
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  completed_at: 2026-07-13
  description: |
    Unify add/load library selection pipelines into one builder+normalizer path; refactor
    `LoadFromLibraryModal` into a thin wrapper over `UnifiedSelectionModal`.
  related_files:
    - src/hooks/use-load-modal-library.ts
    - src/hooks/add-library-item/
    - src/lib/library-selectable-builders.ts
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Single shared pipeline for selectable-item shaping used by add + load flows.
    - `LoadFromLibraryModal` is wrapper-level composition, not a parallel list implementation.
    - No behavior regressions in powers/techniques/items/creatures/species load-add flows.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation coverage added for add/load parity per creator type.
  build_validation: DEV-V-016-T001–T006
  developer_test_plan: |
    Run DEV-V-016 in BUILD_VALIDATION.md (power/technique/item/empowered/species+creature load + sheet add parity).
  notes: |
    Deferred from remediation waves. Requires QA-first execution.
    2026-07-13: Done — LoadFromLibraryModal → UnifiedSelectionModal (confirmLabel Load, max 1);
    add+load share library-selectable-builders + normalize-public (weaponName); technique Action
    column on load matches add; DEV-V-016 added. Build/test/lint pass.
    2026-07-13 audit: Empowered load uses buildEmpoweredPowerSelectableItem + EMPOWERED columns;
    wired public-library error; deleted dead add-library-item adapters; L2 grid double-apply fixed;
    AGENT_GUIDE API corrected; AddLibraryItemModal flexLayout.
    2026-07-13 follow-up: type-gated fetches in useLoadModalLibrary; species TraitListModal →
    UnifiedSelectionModal; flexLayout default true on UnifiedSelectionModal.

- id: TASK-380
  title: DUP-11 + collapsible consolidation with CreatorPageShell rollout
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  completed_at: 2026-07-14
  description: |
    Introduce shared creator-page shell scaffolding and consolidate collapsible patterns after parity tests exist.
  related_files:
    - src/components/creator/CreatorPageShell.tsx
    - src/components/creator/CreatorLayout.tsx
    - src/components/creator/collapsible-section.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Shared CreatorPageShell removes duplicated auth/load/save scaffolding.
    - Collapsible usage consolidated to supported patterns.
    - Creator page behavior equivalent across all six routes.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Dedicated creator parity validation suite added before merge.
  build_validation: DEV-V-018
  developer_test_plan: |
    Run DEV-V-018-T001–T006 in BUILD_VALIDATION.md (six creators + mobile shell).
  notes: |
    2026-07-14: Done — CreatorPageShell on all six standalone creators; CollapsibleSection is the only
    collapse pattern (ui/Collapsible already gone). Species Load remains ungated; creature keeps
    reset confirm + over-budget save. CreatorLayout retained as inner layout primitive.
    2026-07-14 audit: Fixed creature Suspense/?edit; LoginPrompt save|load reason; species + empowered
    contentType; ungated Load toolbar labels; lg-only sticky sidebar. Remaining → TASK-431.
    2026-07-01: Owner — Phase 1b prerequisite for standalone guided creators (REALMS §5.11).

- id: TASK-431
  title: Creator chrome follow-ups — a11y, load-hook parity, empowered copy/errors
  created_at: 2026-07-14
  created_by: agent
  priority: medium
  status: done
  parent_task: TASK-380

  description: |
    Follow-ups from CreatorPageShell (TASK-380) audits. Shell chrome/auth/publish wiring is green
    across all six creators; remaining work is CollapsibleSection a11y, heading hierarchy,
    species/creature load-hook convergence, and a few empowered/species parity nits.
  related_files:
    - src/components/creator/collapsible-section.tsx
    - src/components/creator/CreatorPageShell.tsx
    - src/hooks/use-load-modal-library.ts
    - src/lib/library/creator-load-selectables.ts
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/docs/ai/AGENT_GUIDE.md
  acceptance_criteria:
    - CollapsibleSection: no nested interactive controls inside a role=button / expand header; move rightSlot/Remove outside the disclosure control (or equivalent pattern); fix misleading comment that claims nesting is OK.
    - Section titles use heading level that does not skip (h1 PageHeader → h2 sections), or an equivalent a11y-compliant pattern documented in AGENT_GUIDE.
    - Species and/or creature load lists use an extended useLoadModalLibrary (or dedicated shared hook) with SourceFilter parity — no bespoke fetch/shape duplication beyond entity-specific columns/handleLoad.
    - Empowered publish override copy says "empowered technique" (not "technique") when replacing an existing public item.
    - Empowered dual-load errors identify which dataset(s) failed (power parts / technique parts) and surface both messages when both fail; retry still refetches both.
    - Optional: shell `loading` gate (or documented intentional skip) for species skills/traits and creature critical codex deps — align with power/tech/item or document "show UI immediately" in AGENT_GUIDE.
    - Optional: consistent load-success toast (or explicit none) across all six creators (today: power/technique yes; item/empowered/species no; creature only on ?edit= path).
    - npm run build + lint pass; update DEV-V-018 or add targeted tests if UI changes.
  notes: |
    From TASK-380 audits 2026-07-14 (initial + second-pass sanity).
    Already fixed outside this task: creature Suspense/?edit; LoginPrompt save|load reason;
    species/empowered contentType; ungated Load toolbar labels; lg-only sticky sidebar.
    Intentional / not in scope: species ungated Load + stickySidebar=false; creature resetConfirm +
    over-budget save; crafting on CreatorLayout without shell; GuidedCreatorPageShell separate.
    Second-pass confirmed healthy: shell onSave/onLoad/publish wiring, no double Load modal,
    showPublicPrivate + returnPath/contentType on all six, TraitListModal/extraModals, rarity sidebar,
    RollProvider inside Suspense, no leftover page-level LoginPrompt/CreatorSaveToolbar.
    2026-07-14: Done — CollapsibleSection a11y (dedicated expand button, h2 titles); useLoadModalLibrary
    extended for species/creature + prefetch; creator-load-selectables shared builders; shell loading
    gates + load-success toast parity; empowered publish/dual-error copy; DEV-V-018-T007.
  build_validation: DEV-V-018
  developer_test_plan: |
    Run DEV-V-018-T001–T007 in BUILD_VALIDATION.md (chrome + load-hook/Collapsible a11y).

- id: TASK-381
  title: BIG-01/02 phased decomposition of character-sheet and creator god files
  priority: medium
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/*-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.
    2026-07-01: Owner — start with power-creator and item-creator pages first; species/creature deferred from beginner funnel.

- id: TASK-382
  title: Docs compaction pass (active queue slimming + stale-reference pruning)
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Keep active docs lean: move historical audits and done task blocks out of agent line-of-sight;
    prune stale references in active guidance docs.
  related_files:
    - src/docs/ai/AI_TASK_QUEUE.md
    - src/docs/ai/archive/
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - AGENTS.md
    - .cursorignore
  acceptance_criteria:
    - `AI_TASK_QUEUE.md` contains only active/pending work; history in archive.
    - Active docs contain no stale route/component references unless marked historical.
    - Archive pointers explicit; `.cursorignore` excludes archive from indexing.
    - `npm run build` passes.
  notes: |
    DONE 2026-06-26: Slimmed queue to 10 active entries; moved June audits + root CODEBASE_AUDIT to
    `ai/archive/`; human onboarding/reference to `src/docs/human/`; added HISTORY_INDEX.md + .cursorignore.

- id: TASK-383
  title: "UI unification — Phase 0a: automated visual + a11y + contrast safety net"
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Stand up an automated verification net BEFORE the design-system token re-architecture
    (Phase 0+) so style/theme regressions are caught without manual visual QA. Plan:
    `.cursor/plans/ui_unification_audit_4aa98a2a.plan.md`.
  completed_work: |
    - `scripts/check-contrast.mjs`: WCAG-AA contrast check of every semantic fg/bg token pair in
      BOTH themes, with a 0-failure ratchet baseline (`scripts/contrast-baseline.json`).
    - `/dev/styleguide`: auth-free, data-free gallery of every primitive + token swatch (the
      canonical surface for visual review; captured in both themes at 3 breakpoints).
    - Playwright + `@axe-core/playwright`: `tests/visual/` — full-page screenshot baselines (54)
      across mobile/tablet/desktop x light/dark for deterministic routes, plus axe-core a11y scans
      with a ratchet baseline (`tests/visual/a11y-baseline.json`).
    - ESLint `realms/no-raw-color` guardrail (`eslint-rules/`): hard error banning raw Tailwind
      palette / bare white-black / arbitrary hex in class strings; exempts auth shell + UI
      primitives; 64-file migration backlog ratchet (`raw-color-backlog.mjs`) shrinks per phase.
    - `npm run verify` (contrast + lint + visual + a11y) and `.github/workflows/ui-verify.yml`
      hard-blocking CI gates.
  follow_up_tasks:
    - TASK-384
    - TASK-385
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T001
      - DEV-V-011-T002
      - DEV-V-011-T003
      - DEV-V-011-T004
  developer_test_plan: |
    Suite DEV-V-011 T001–T004 — see BUILD_VALIDATION.md. Human steps (CI secrets, Linux baseline
    seeding, branch protection) in DEVELOPER_TASK_QUEUE DEV-002.
  related_files:
    - scripts/check-contrast.mjs
    - scripts/contrast-baseline.json
    - scripts/list-raw-color-backlog.mjs
    - src/app/dev/styleguide/page.tsx
    - playwright.config.ts
    - tests/visual/
    - eslint-rules/no-raw-color.mjs
    - eslint-rules/raw-color-backlog.mjs
    - eslint.config.mjs
    - .github/workflows/ui-verify.yml
    - package.json
  notes: |
    DONE 2026-06-26. Visual baselines committed are Windows (local/agent self-review). Linux CI
    baselines + Supabase CI secrets + branch-protection required-checks = DEV-002 (one-time).

- id: TASK-384
  title: "Resolve a11y violations surfaced by the new axe baseline"
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    The Phase 0a axe scan recorded a ratchet baseline of pre-existing violations. Drive these to
    zero and shrink `tests/visual/a11y-baseline.json`. Highest-leverage first.
  completed_work: |
    - Toast region: `role="region"` so `aria-label` is valid with `aria-live`.
    - TabNavigation: `disabled` instead of prohibited `aria-disabled` on tabs; `associatePanels` prop for demos.
    - Form error text → `text-danger-fg` (Input/Select/Textarea/Checkbox).
    - Privacy inline links: persistent underline (`link-in-text-block`).
    - Styleguide: token swatches on correct surfaces; tab panels wired; toast trigger; PointStatus contrast.
    - `tab-nav-trigger-active` → semantic tokens (no primary ramp `dark:`).
    - `tests/visual/a11y-baseline.json` emptied — zero allowed violations.
  related_files:
    - src/components/layout/header.tsx
    - src/app/(main)/library/
    - src/app/(main)/privacy/page.tsx
    - tests/visual/a11y-baseline.json
  acceptance_criteria:
    - Fix the near-global `aria-prohibited-attr` (appears on nearly every page — likely one shared
      nav/header/skip-link/toggle element); remove its keys from the a11y baseline.
    - Fix `/library` dark-mode `color-contrast` and `/privacy` `link-in-text-block`.
    - `npm run verify:a11y` passes; baseline entries deleted (not re-added).
    - `npm run build` passes.
  notes: |
    DONE 2026-06-27. `npm run verify:a11y` passes with empty baseline (30/30 routes, both themes).

- id: TASK-385
  title: "Authenticated-surface visual + a11y baselines (test session)"
  priority: low
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Extend the safety net to auth-gated, data-bearing surfaces (character sheet, `/my-account`,
    campaign detail/combat) once a deterministic test session + seed data exist.
  completed_work: |
    - `scripts/provision-e2e-baseline.js` + `tests/visual/e2e-seed-manifest.json` — deterministic user/character/campaign seed.
    - `auth.setup.ts` + `playwright.auth.config.ts` — storageState login (login once, reuse session).
    - Visual baselines: my-account, characters, campaigns, character-sheet, campaign-detail × light/dark (10 snapshots).
    - `auth-a11y.pw.ts` + ratchet baseline; masks for portraits + roll logs.
    - `npm run e2e:provision`, `verify:auth-visual`, `verify:auth-a11y` (+ update variants).
    - CI optional step when `E2E_TEST_*` secrets present (`.github/workflows/ui-verify.yml`).
  remaining_work: |
    - Human DEV-003: add `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (+ optional IDs) to GitHub Actions secrets; seed Linux auth baselines on first CI run (same as DEV-002).
    - Follow-up: fix character-sheet axe allowances (`aria-valid-attr-value`, `scrollable-region-focusable`) and my-account dark `color-contrast`.
  related_files:
    - tests/visual/
    - playwright.auth.config.ts
    - scripts/provision-e2e-baseline.js
  acceptance_criteria:
    - Playwright storageState login flow using a CI test user (DEV-002/DEV-003).
    - Deterministic seed (or masked dynamic regions) so screenshots don't churn.
    - Baselines for character sheet, /my-account, campaign detail in both themes.
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T005
      - DEV-V-011-T006
  notes: |
    DONE 2026-06-27. Test user `e2e-visual-baseline@realmsrpg.test` provisioned in dev Supabase. Windows baselines committed. Auth a11y ratchet has 5 pre-existing allowances on character sheet + my-account dark.

- id: TASK-386
  title: "MVP: guided three-layer character creator pilot (archetype preview + feats L1)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  completed_work: |
    Full 9-step three-layer creator rework: GuidedChoiceShell on all path steps, per-step layer state + getStepCompletion, path-default archetype with build previews, species recommended_species L1, ancestry checklist, abilities suggested array + blurbs, skills L1 hide sub-skills, feats/equipment/powers guidance groups + weapon-then-armor + confirm loadout, finalize character reveal + edit jump-backs + identity fields, CreatorResourceBar, martial→skip powers tab, admin validatePathDataForPublish on save. Visual UX sweep (Playwright audit, footer/tab/InfoTippy fixes). Supabase: level1_recommended_species + level1_guidance_groups columns; Berserker reference path seeded. TASK-376 InfoTippy migration done. `npm run build` + `npm run verify:creator-audit` pass.
  remaining_work: |
    Optional follow-up: admin UI builder for guidance_groups (Advanced Path JSON + ChipSelect for recommended_species work today). Seed guidance groups for remaining paths (Warrior, Monk, power paths) as content work.
  follow_up_tasks:
    - TASK-391
  build_validation: |
    suite: DEV-V-001
    tests:
      - DEV-V-001-T001
      - DEV-V-001-T011
    automated: npm run verify:creator-audit
  developer_test_plan: |
    DEV-V-001 manual path/forge guards + npm run verify:creator-audit for step screenshots.
  description: |
    Character-creator implementation slice of the Product Experience Redesign
    (`src/docs/REALMS_PRODUCT_OVERVIEW.md`, Appendix E). Establishes Layer 1
    (guided) default + "see all" escape on the feats step; archetype preview cards.
    Landing rebuild is TASK-387; post-activation flow is TASK-388.
    Prefer simplification/restructuring over new features (Section 8).
    Tooltip copy: `public/tooltip-text.tsx` + `InfoTippy` (TASK-376 done).
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/lib/game/archetype-path.ts
    - public/tooltip-text.tsx
  acceptance_criteria:
    - Archetype step: path cards show build preview (counts + one-line goal); Path default, "Forge Your Own" secondary/L3.
    - Feats step (pilot): Layer 1 grouped recommended feats with why-copy; "See all feats" → existing L3 browser; "Back to recommendations" returns to L1.
    - Global: `level1.notes` surfaced via enhanced `PathHelpCard` on every path step.
    - Content: one fully authored reference martial path in admin; completable in L1 without opening full lists.
    - `npm run build` passes; MOBILE_UX + ACCESSIBILITY rules followed.
  notes: |
    Refactor behind `creationMode === 'path'`. GuidedChoiceShell built and used on abilities/skills; feats/equipment/powers use layer expand + path groups. 2026-06-29: comprehensive rework shipped (see completed_work).
    Tooltip copy: add to `public/tooltip-text.tsx` and use `InfoTippy` (TASK-376 done).

- id: TASK-387
  title: "Landing page full redesign (modern TTRPG startup)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  description: |
    Scrap and rebuild `home-page.tsx` per REALMS_PRODUCT_OVERVIEW Section 4 —
    not a copy-only patch. Single primary CTA (Start Playing → /characters/new),
    research-backed scroll structure, remove OnboardingTour and Codex/Library CTAs.
    Mid-page secondary CTAs: custom power, weapons/armor (→ creators; Layer 1 entry
    when those creators support it). Discord tertiary. Design system compliant.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/app/(main)/home-page.tsx
    - src/components/shared/onboarding-tour.tsx
    - src/lib/constants/site-copy.ts
  acceptance_criteria:
    - Remove OnboardingTour trigger and welcome-banner tour link from home.
    - Remove Browse Codex / Browse Library as landing CTAs (nav only).
    - One primary hero CTA: Start Playing → /characters/new.
    - Uniqueness block with visual proof (screenshots/art), not abstract copy only.
    - Below fold: Create a Custom Power + Create Weapons & Armor sections with links to creators.
    - Join Discord in closing/footer section.
    - Mobile-first (~360px); semantic tokens; `npm run build` passes.
  completed_work: |
    Rebuilt `home-page.tsx` from scratch as a composition shell over new section
    components in `src/components/landing/` (HeroSection, UniquenessSection,
    HowItWorksSection, SecondaryDiscoverySection, CommunitySection + MarketingButton
    helpers + barrel). AIDA scroll story per Section 4.
    - Removed: OnboardingTour trigger + "Take a quick tour", logged-in welcome
      link-farm, review carousel, equal-weight feature cards. No Codex/Library CTAs.
    - Single dominant primary CTA "Start Playing" -> /characters/new (hero) repeated
      once mid-page in How-it-works. Low-weight "#how-it-works" explorer anchor for
      researching visitors (owner: proceed with research best practice, I.4).
    - Conditional hero: returning users with >=1 character get continue-focused hero
      (Continue your adventure -> /characters) via useCharacters.
    - Secondary discovery: Create a Custom Power -> /power-creator, Create Weapons &
      Armor -> /item-creator (outline/subordinate). Community: Join Discord tertiary.
    - Copy centralized in `LANDING_COPY` (site-copy.ts). Semantic tokens, dark mode,
      44px targets, h1->h2->h3 hierarchy. `npm run build` passes; lint clean.
  remaining_work: |
    (None — licensed character/item art integrated 2026-06-28: Faust hero, Human-Greyscale
    / gnome / Shroom-Shot uniqueness, gnome + Shroom-Shot secondary discovery.)
    Power/item secondary CTAs still link to Layer 3 creators until Phase 3.
  follow_up_tasks: []
  build_validation: DEV-V-012
  developer_test_plan: BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387
  notes: |
    Can ship before or in parallel with TASK-386. OnboardingTour component file kept
    in `src/components/shared/` for TASK-388 to repurpose (no longer imported by home).

- id: TASK-388
  title: "Post-activation onboarding (play together, sheet tour, level-up milestones)"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: not-started
  description: |
    Section 11 of REALMS_PRODUCT_OVERVIEW.md. After first character save, guide users
    toward playing together (Discord, campaign invite). Optional post-save sheet tour.
    Contextual level-up tutorials for milestones (first level-up, first ability point,
    etc.) — delta-only, skippable, global tutorials on/off preference.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-sheet/
    - src/components/shared/onboarding-tour.tsx
  acceptance_criteria:
    - After first character save: dismissible play-together prompt (Discord + start campaign).
    - Optional sheet tour offered once post-save (Skip + Don't show again); not on home page.
    - First level-up shows contextual guide for fields that changed only.
    - First ability-point level (e.g. level 3) shows where to allocate on sheet.
    - User can disable all tutorials (setting or preference flag).
    - Milestone flags stored (profile or character JSON); no repeat on subsequent level-ups of same type.
    - `npm run build` passes.
  notes: |
    Replaces pre-creation home OnboardingTour with post-activation guidance.
    Prefer InfoTippy/highlight chains over modal-heavy tours.

- id: TASK-389
  title: "Landing visual assets — replace uniqueness placeholder panels"
  created_at: 2026-06-28
  created_by: agent
  priority: medium
  status: done
  description: |
    Follow-up to TASK-387. The rebuilt landing uniqueness block (Section 4 "visual
    proof") currently renders layout-stable placeholder panels (`VisualPanel` in
    `src/components/landing/uniqueness-section.tsx`). Replace with real product
    screenshots / species art / power examples so the differentiators show the
    product in use rather than illustrative placeholders.
  related_files:
    - src/components/landing/uniqueness-section.tsx
    - public/images/
  acceptance_criteria:
    - Each uniqueness card shows a real screenshot or art asset (creator UI, species
      art, power example) at the existing 16:10 panel aspect (no layout shift).
    - Assets optimized (next/image, sized); mobile + dark mode verified.
    - `npm run build` passes.
  notes: |
    Completed 2026-06-28: owner supplied Faust, gnome, Shroom-Shot, Human-Greyscale;
    integrated via LandingArtFrame + hero split layout (banner removed).

- id: TASK-390
  title: "Migrate editable static copy to per-page constants modules"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: done
  description: |
    Owner wants all user-editable marketing/UI strings in `src/lib/constants/copy/`
    — one module per page or area for easy editing while viewing a route.
  related_files:
    - src/lib/constants/copy/
    - src/lib/constants/site-copy.ts
    - src/lib/constants/skills.ts
    - public/tooltip-text.tsx
    - src/components/layout/footer.tsx
    - src/components/layout/header.tsx
    - src/components/about/
    - src/app/(main)/about/page.tsx
    - src/app/(main)/rules/page.tsx
    - src/app/(main)/resources/page.tsx
    - src/app/(main)/privacy/page.tsx
    - src/app/(main)/terms/page.tsx
    - tests/visual/site-copy-audit.pw.ts
  acceptance_criteria:
    - `src/lib/constants/copy/` holds per-page modules; `site-copy.ts` re-exports (backward compatible).
    - Each major route with owner-editable prose has a dedicated `*-copy.ts` file documented in `site-copy.ts` header table.
    - No duplicate hardcoded motto/Discord URL outside copy modules (except tooltip-text.tsx per TASK-376).
    - Pages import copy from constants; no marketing string changes required in JSX for migrated sections.
    - `npm run build` passes.
  build_validation: DEV-V-017
  developer_test_plan: |
    Run DEV-V-017-T001–T006 in BUILD_VALIDATION.md (About, nav, rules, resources, privacy, terms).
    Optional screenshot audit: `npx playwright test -c playwright.site-copy-audit.config.ts` → `.site-copy-audit/`.
  notes: |
    2026-07-14: Done — About carousel → structured `ABOUT_CAROUSEL_SLIDES` + `AboutSlideBodyView`;
    `nav-copy`, `rules-copy`, `resources-copy`; footer/landing/auth/guided already migrated.
    Audit pass: fixed root-layout motto AC3 gap; creator-note punctuation; SEO meta from copy;
    `privacy-copy` + `terms-copy`; shared `SITE_CONTACT_EMAIL` / `ROOT_META_DESCRIPTION`;
    auth headline derives from `REALMS_MOTTO`. Playwright audit 4/4 PASS (screenshots in `.site-copy-audit/`).
    Rules Google Docs iframe may be blank in headless/third-party frames — “Open in new tab” still works.
    Tooltips stay in `public/tooltip-text.tsx`; game mechanics stay in `skills.ts`.

- id: TASK-391
  title: "Admin path builder — guidance_groups UI + seed remaining paths"
  created_at: 2026-06-29
  created_by: agent
  priority: medium
  status: not-started
  description: |
    Character creator Layer 1 uses `level1_guidance_groups` (JSONB) and `level1_recommended_species`
    (TEXT) on `codex_archetypes`. Berserker reference path seeded; admin can edit via Advanced Path JSON
    and recommended-species ChipSelect today. Add a structured admin UI for guidance group authoring
    and optionally seed Warrior/Monk/power paths with grouped recommendations.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/codex-archetypes-creator-layer1-extensions.sql
    - src/lib/constants/creator-layer-governance.ts
  acceptance_criteria:
    - Admin can add/edit/remove guidance groups without raw JSON (title, why, feat/power/armament picks per group).
    - Layer 1 governance caps enforced in UI (max 3 groups, 7 items, 120-char why).
    - Optional: at least one additional martial path seeded with guidance groups in Supabase.
    - npm run build passes.

- id: TASK-392
  title: Migrate InfoTippy from Tippy.js to Floating UI (React 19)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Replace archived `@tippyjs/react` / `tippy.js` with `@floating-ui/react` in `InfoTippy`.
    Removes React 19 `element.ref` console warning and unmaintained dependency. Keep same
    public API (`content`, `label`, `placement`, `size`, `children`, `allowHTML` compat).
  related_files:
    - src/components/shared/info-tippy.tsx
    - package.json
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
  acceptance_criteria:
    - InfoTippy uses Floating UI; no `@tippyjs/react` or `tippy.js` in dependencies.
    - Hover (desktop), focus, touch-hold (~400ms), portal to body, flip/shift, max-width 320px preserved.
    - Interactive JSX tooltips allow pointer entry (safePolygon).
    - All existing InfoTippy call sites work without changes.
    - npm run build passes.
  notes: |
    2026-06-30: Implemented. Removed tippy packages; added @floating-ui/react.
    Integration audit 2026-06-30: no @tippyjs/react imports remain; dead tooltip Zod schemas removed;
    agent docs/rules updated; InfoTippyProps exported from shared barrel.
    DEV-376 2026-06-30: Supabase MCP migration drop_legacy_ui_tooltips applied; app code no longer references show_tooltips.

- id: TASK-393
  title: Guided Simple Creator — docs & product model (REALMS §5.0)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Document two-creator model, chapter backbone, starter-species rule, recommended abilities/loadouts data needs, and future avatar slot in REALMS_PRODUCT_OVERVIEW.md.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Section 5.0 records Simple vs Advanced, entry chooser, chapters, and data fields.
  notes: |
    2026-06-30: Implemented as part of guided creator build.

- id: TASK-394
  title: Guided Simple Creator — Phase 0 entry chooser & routes
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Simple vs Advanced chooser at /characters/new; Advanced at /characters/new/advanced; guided at /characters/new/guided; guided-creator-store scaffold.
  related_files:
    - src/app/(main)/characters/new/page.tsx
    - src/app/(main)/characters/new/advanced/page.tsx
    - src/app/(main)/characters/new/guided/page.tsx
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - New Character navigates to chooser; both routes load; stores are separate.
    - npm run build passes.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T001
  notes: |
    2026-06-30: Landing-cohesive chooser with CreatorFunnelHero.

- id: TASK-395
  title: Guided Simple Creator — Phase 1 shell (rail, preview, footer)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    GuidedCreatorShell with chapter rail, CharacterPreviewPanel, GuidedStepFooter, and step routing for all chapters.
  related_files:
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/components/guided-creator/character-preview-panel.tsx
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-creator-page-shell.tsx
  acceptance_criteria:
    - Chapter rail matches GUIDED_CHAPTERS; preview updates from draft; sticky footer on all steps.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T002
  notes: |
    2026-06-30: Visual language matches landing (CreatorFunnelHero, rounded-card surfaces).

- id: TASK-396
  title: Guided Simple Creator — schema fields & seed SQL
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Add codex_species.is_starter, codex_archetypes.level1_recommended_abilities, level1_loadouts; SQL seed for Berserker + starter species; update SUPABASE_SCHEMA.md.
  related_files:
    - sql/guided-creator-schema-seed.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/api/codex/route.ts
  acceptance_criteria:
    - SQL file documents migration + seed; schema doc updated; API maps new fields into path_data.
    - Human runs SQL in Supabase (DEV-004).
  notes: |
    2026-06-30: Seed SQL applied via Supabase MCP migration `guided_creator_schema_seed` (DEV-004 done). 8 starter species + Berserker verified in DB.

- id: TASK-397
  title: Guided Simple Creator — Phase 2 Foundation (path + species)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Shared GuidedChoiceCard for path/species; starter-species filter with expand-to-all; Powered-Martial paths behind expand affordance.
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/guided-choice-card.tsx
  acceptance_criteria:
    - Path and species use same card format; starter filter works when is_starter seeded; hybrid paths expandable.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T003
  notes: |
    2026-06-30: Species path-ambiguous (no per-path recommended species).

- id: TASK-398
  title: Guided Simple Creator — Phase 3 Ancestry micro-flow
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    One-pick-at-a-time full-width cards for species-trait options, ancestry trait, characteristic, optional flaw + bonus trait; draft-state completion validation.
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
  acceptance_criteria:
    - Continue disabled until required ancestry picks complete; optional flaw skippable.
  notes: |
    2026-06-30: Mixed species deferred.

- id: TASK-399
  title: Guided Simple Creator — Phase 4 Abilities
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Apply path recommended_abilities or customize via AbilityScoreEditor; in-context ability blurbs.
  related_files:
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - Use recommended one-click apply; customize mode enforces point spend.
  notes: |
    2026-06-30: resolveGuidedRecommendedAbilities from path_data.

- id: TASK-400
  title: Guided Simple Creator — Phase 4 Your Archetype (skills + feats)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Skills (species locked + path toggleable), archetype feats via guidance groups, character feat step; ordered after abilities.
  related_files:
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
  acceptance_criteria:
    - Sub-step order enforced in store; guidance groups drive feat selection when present.
  notes: |
    2026-06-30: Chapter 4 sub-steps skills → archetype-feats → character-feat.

- id: TASK-401
  title: Guided Simple Creator — Phase 5 Equipment + Powers/Techniques
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Loadout cards from level1_loadouts (fallback to path armaments); single Powers or Techniques step by archetype type.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/game/archetype-path.ts
  acceptance_criteria:
    - Loadout step selects kit; powers/techniques step title varies by martial vs power archetype.
  notes: |
    2026-06-30: parseLoadouts supports object-shaped armament entries in JSON.

- id: TASK-402
  title: Guided Simple Creator — Phase 6 Your Hero (reveal + save)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Reveal step with name, HP/EN allocation, save character, login prompt for guests, post-save play-together modal.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - buildGuidedCharacterPayload + createCharacter; guest sees login modal; post-save Discord/campaign prompt.
  follow_up_tasks:
    - TASK-406
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T005
  notes: |
    2026-06-30: Marketing CTAs in modals match landing patterns. Reveal UX completed in TASK-406.

- id: TASK-403
  title: Guided Simple Creator — Phase 8 admin & species starter flag
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: partial
  description: |
    Admin species is_starter checkbox; admin archetype JSON fields for level1_recommended_abilities and level1_loadouts; save via saveArchetypeWithPath.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - isStarter persists on species; guided JSON fields editable and saved to DB columns.
  completed_work: |
    - isStarter checkbox wired in AdminSpeciesTab (openAdd/openEdit/save).
    - Guided JSON textareas for recommended abilities + loadouts in AdminArchetypesTab.
    - saveArchetypeWithPath persists level1_recommended_abilities and level1_loadouts.
  remaining_work: |
    - Plan Phase 8 also called for replacing the archetype edit modal with a full admin-only archetype creator (structured loadout builder, not raw JSON).
    - Species trait-option editing improvements beyond existing AdminSpeciesTab pickers (if needed for guided ancestry QA).
  follow_up_tasks:
    - TASK-404
  notes: |
    2026-06-30: JSON fields sufficient for prototype; full archetype creator UI deferred to TASK-404.

- id: TASK-404
  title: Guided creator — admin archetype creator + reveal portrait upload
  created_at: 2026-06-30
  created_by: agent
  priority: medium
  status: not-started
  description: |
    Close remaining plan gaps: structured admin loadout/abilities builder (replace raw JSON in AdminArchetypesTab). Portrait upload on guided reveal delivered in TASK-406.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/components/guided-creator/steps/reveal-step.tsx
  acceptance_criteria:
    - Admin can author loadouts without hand-editing JSON.
  notes: |
    Follow-up from TASK-403 partial. Guided reveal portrait upload moved to TASK-406.

- id: TASK-407
  title: Guided creator — skills step full allocation (§5.5 Option B)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Replace guided skills toggles with full skill-point allocation: species locked (free), path skills toggleable, decline frees points for curated free picks + Add Skill catalog. Store skills as Record<id, value>; save with correct skill_val.
  related_files:
    - src/components/guided-creator/steps/skills-step.tsx
    - src/lib/guided-creator/build-skills.ts
    - src/lib/guided-creator/curated-skills.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/character-preview-panel.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - GuidedSkillsPanel (not SkillsAllocationPage) with species/path locking, sub-skills hidden, defense hidden.
    - 3 L1 skill points (+ species "Any" extra) must be fully spent to continue.
    - Declining path skill frees 1 point; curated picks surface ability-aligned base skills.
    - Save payload uses skill_val from allocations (not hardcoded 1).
    - Reveal summary and preview show skill names/count from skills record + species.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T014
  notes: |
    2026-06-30: Owner chose Option B — full allocation per REALMS §5.5. Store schema v3 (skillIds → skills). npm run build pass.
    2026-07-13 audit: AC updated for GuidedSkillsPanel (TASK-419); build_validation rewired from wrong T003 → T014.

- id: TASK-406
  title: Guided creator — Your Hero reveal redesign (§5.10)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Redesign guided reveal/finalize step to match REALMS §5.10: hero reveal moment, full build summary with names and edit jump-backs, identity fields, portrait upload, smart HP/EN allocation, reveal-first layout.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/guided-creator/guided-health-energy-section.tsx
    - src/components/guided-creator/guided-step-edit-link.tsx
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - Full overview shows names (skills, traits, feats, loadout, powers/techniques) not counts.
    - Edit links jump back to prior guided sub-steps.
    - Identity block: name, optional age/height/weight/appearance, portrait upload.
    - HP/EN auto-applies on enter + auto-allocate button tied to highest power/technique cost.
    - Reveal layout feels like a finale (hero band, no duplicate preview strip).
    - Save + guest login + portrait upload on save still work.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T015
      - DEV-V-013-T005
  notes: |
    2026-06-30: Owner feedback — guided reveal was worst finalize step; redesign in stages.
    2026-06-30: Hero band, GuidedRevealSummary (names + edit links), identity block, portrait upload, smart HP/EN auto-allocate, shell hides strip on reveal. npm run build pass.
    2026-07-13 audit: build_validation rewired from T004 (loadout) → T015 reveal + T005 save.

- id: TASK-405
  title: Choice-card art — codex image_url fields + admin upload
  created_at: 2026-06-30
  created_by: owner
  priority: high
  status: partial
  description: |
    Species (and later equipment, powers, techniques) use hero art on GuidedChoiceCard as a primary selling point (REALMS §5.0.3). UI resolves image_url from records with typed SVG placeholders until art exists. Add codex columns, Storage upload, admin pickers, and seed real species art for starters.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-choice-image.ts
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/components/shared/codex-art-upload-field.tsx
    - src/app/api/upload/codex-art/route.ts
    - src/lib/codex-art.ts
    - sql/codex-art-species-image-url.sql
    - public/images/placeholder-*-card.svg
  acceptance_criteria:
    - codex_species.image_url (TEXT, nullable) + documented in SUPABASE_SCHEMA.md; migration applied.
    - Admin species editor: upload or URL for card art; preview matches guided hero layout.
    - Guided species step shows real art when image_url set; placeholders otherwise.
    - Plan documented for powers/techniques/loadout image_url (column or JSON) as follow-up sub-task or phase 2.
  completed_work: |
    Phase 1 (2026-07-01): codex_species.image_url + codex-art bucket (migration applied). Admin species editor CodexArtUploadField (crop + upload). /api/upload/codex-art (isAdmin + service role). REALMS §5.0.3 coverage matrix (species/creature high, weapon some, armor/shield/power/technique low; no skills/feats/traits).
  remaining_work: |
    Seed starter species art. Phase 2 image_url columns + admin upload on creatures, powers, techniques. Equipment uses art bank only (no codex_equipment.image_url).     Follow-on TASK-417 for bank + user-library parity.
  follow_up_tasks:
    - TASK-417
  notes: |
    2026-06-30: Product owner — species art is main marketing hook on cards. Prototype placeholders + GuidedChoiceCard hero layout landed first.
    2026-07-01: Phase 1 species pipeline shipped; guided UI already reads image_url.
    2026-07-01: official_items.image_url + armament admin upload (weapon/armor/shield). REALMS §5.0.3 expanded with three-layer image model (official / bank / user upload).

- id: TASK-417
  title: Art bank + user-library image_url parity + copy-on-add
  created_at: 2026-07-01
  created_by: owner
  priority: medium
  status: not-started
  description: |
    Long-term card-art model (REALMS §5.0.3): (1) curated art bank all users pick from when creating custom species/armaments/powers/techniques/equipment; (2) privileged roles (developer, admin) may upload custom art tied to user-owned rows; (3) official items with image_url keep art when copied to personal library — user_* tables mirror official/codex image_url column shape.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/SUPABASE_SCHEMA.md
    - src/lib/library-columnar.ts
    - src/lib/codex-art.ts
    - src/components/shared/codex-art-upload-field.tsx
    - src/components/guided-creator/guided-choice-image.ts
    - src/app/api/upload/codex-art/route.ts
    - src/app/api/user/library/[type]/route.ts
    - src/app/api/official/[type]/route.ts
  acceptance_criteria:
    - art_bank catalog (table or manifest) with categories: species, weapon, armor, shield, equipment, power, technique; admin CRUD; public read.
    - Shared ArtBankPicker (or extend CodexArtUploadField) in species/item/power/technique creators — all users can pick bank image.
    - image_url columns on user_powers, user_techniques, user_items, user_creatures, user_species (migrations + library-columnar + API).
    - Add official/public item to user library copies image_url to new user row.
    - /api/upload/user-creation-art (or equivalent) for developer+admin; writes user-creations bucket; sets user_* image_url.
    - Creators and GuidedChoiceCard resolve image_url identically for official and user rows.
  notes: |
    2026-07-01: Owner direction — three-layer model documented in REALMS §5.0.3. Depends on TASK-405 phase 2 for full official coverage. codex_equipment stays bank-only (no per-row image).

- id: TASK-408
  title: Power creator InfoTippy — tooltip draft to tooltip-text.tsx
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Migrate owner draft copy from POWER_CREATOR_TOOLTIPS_DRAFT.md into public/tooltip-text.tsx and wire InfoTippy on advanced power creator sections (Description, Action Type, Reaction, Weapon, Area, Duration, Parts, Mechanics, Damage, Energy, Innate, TP, Load, Reset). Phase 1b / prerequisite for guided power creator.
  related_files:
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
    - public/tooltip-text.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - All draft field tooltips exist in tooltip-text.tsx (owner-editable strings).
    - InfoTippy on each major advanced power-creator section header or label.
    - Guided L1 placeholder exports added for Power character, Powered-Martial, innate intent, category (strings only; wiring in TASK-411).
    - npm run build and lint pass.
  notes: |
    **Blocked until TASK-414 done** (2026-07-01 owner: no creator L1 work until exact guided spec locked). Optional early win: advanced (L3) tooltips only — unblocks if owner explicitly requests before TASK-414.

- id: TASK-409
  title: Standalone creator Phase 1b — CreatorPageShell + power/item god-file split (TASK-380/381)
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Execute engineering prerequisites before large guided power-creator UI: TASK-380 CreatorPageShell for shared auth/load/save; TASK-381 phase 1 extracting power-creator and item-creator page shells + section islands with parity tests.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/components/creator/
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - CreatorPageShell adopted by power-creator and item-creator routes (minimum).
    - Power-creator page decomposed into shell + section components without save/load/cost regressions.
    - Parity validation suite indexed in DEVELOPER_TASK_QUEUE / BUILD_VALIDATION.
    - npm run build passes.
  notes: |
    Blocks TASK-410–412. Species/creature creators out of scope for this phase.
    **Blocked until TASK-414 done** (2026-07-01 owner gate).

- id: TASK-410
  title: Power creator guided — entry chooser + route shell
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Add /power-creator entry chooser (Guided vs Advanced) and /power-creator/guided route shell reusing guided-creator chrome (GuidedStepLayout, footer, preview slot). Advanced remains current builder at /power-creator/advanced or equivalent. No wizard steps yet — navigation scaffold only.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/power-creator/guided/page.tsx
    - src/components/guided-creator/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - /power-creator shows Guided vs Advanced choice before entering either flow.
    - /power-creator/guided renders step shell with placeholder step 1.
    - Advanced route loads existing power creator unchanged.
    - Mobile fullScreenOnMobile patterns where modals added.
    - npm run build passes.
  notes: |
    Mirror characters/new chooser pattern. Owner feedback required on labels (Guided/Advanced placeholders).
    **Blocked until TASK-414 done.**

- id: TASK-411
  title: Power creator guided — audience, innate, and category steps
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Implement guided power wizard steps 1–3 (REALMS §5.11): (1) audience — pick saved character OR generic Power vs Powered-Martial + level; (2) innate intent toggle with InfoTippy and constraint preview; (3) power category cards mapped to codex part categories (Offense, Defense, Utility, Control, etc.). Store in guided-power-creator-store or equivalent; preserve handoff shape for advanced editor.
  related_files:
    - src/app/(main)/power-creator/guided/
    - src/components/guided-creator/
    - public/tooltip-text.tsx
    - src/docs/GAME_RULES.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
  acceptance_criteria:
    - Character picker loads user characters when logged in; guest can pick archetype + level.
    - Innate threshold shown from GAME_RULES (L1: 8 Power, 6 Powered-Martial).
    - Category step uses GuidedChoiceCard; max one primary category per screen.
    - InfoTippy on archetype, innate, and category decisions.
    - Owner review checkpoint before TASK-412.
  notes: |
    Depends on TASK-408 (tooltips) and TASK-410 (shell). Iterative owner feedback expected.
    **Blocked until TASK-414 done** — implement only from locked spec, not §5.11 draft.

- id: TASK-412
  title: Power creator guided — delivery, damage, templates, save, advanced handoff
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Complete guided power wizard steps 4–7: delivery (melee/ranged/area), damage yes/no + presets, template pick from official_powers (curated per category — e.g. Fireball, Icebolt, Healing Incantation, Protective Ward, Charm Creature, Fog Cloud) or start blank, name/description + live preview, save to My Library or open Advanced with state handoff. Reuse existing calculators and useCreatorSave.
  related_files:
    - src/app/(main)/power-creator/guided/
    - src/hooks/useOfficialLibrary.ts
    - src/lib/calculators/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - At least 4 official_powers loadable as templates by category.
    - Innate filter hides/disables templates above threshold when innate selected.
    - Save works for logged-in users; guest login prompt at save.
    - Customize in Advanced opens advanced builder with guided state applied.
    - New user can complete flow without seeing part option levels.
    - npm run build passes.
  notes: |
    Templates from existing official_powers table (31 rows); no new DB table for MVP. Owner curates template set.
    **Blocked until TASK-414 done.**

- id: TASK-413
  title: Landing secondary CTAs → power creator guided entry
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Update SecondaryDiscoverySection power CTA to /power-creator (chooser) or /power-creator/guided once TASK-410 ships. Item CTA waits for item guided. Aligns with REALMS §5.11 conversion fix.
  related_files:
    - src/components/landing/secondary-discovery-section.tsx
    - src/lib/constants/site-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Create a Custom Power lands on guided entry or chooser, not raw L3 advanced scroll.
    - Item CTA unchanged or clearly marked until item guided exists.
    - npm run build passes.
  notes: |
    Blocked until TASK-410. Item guided follow-up task after TASK-412 validates power pattern.
    **Blocked until TASK-414 done** (do not change landing CTA until guided entry exists).

- id: TASK-415
  title: Chip taxonomy & metadata display unification
  priority: high
  status: done
  created_at: 2026-07-02
  created_by: owner
  description: |
    Unify expandable vs descriptor chips into two roles with distinct visuals; fix expandable
    rounded-rectangle shape (no pill clipping); enforce metadata visibility rule for GridListRow
    items; remove redundant collapsed/expanded metadata. Plan: `src/docs/ai/CHIP_UNIFICATION_PLAN.md`.
  related_files:
    - src/docs/ai/CHIP_UNIFICATION_PLAN.md
    - src/components/ui/chip.tsx
    - src/components/ui/expandable-chip.tsx
    - src/lib/chip/expandable-chip-props.ts
    - src/lib/chip/expandable-chip-shell.ts
    - src/components/shared/grid-list-chip.tsx
    - src/lib/chip/part-data.ts
    - src/lib/chip/chip-options-panel.tsx
    - src/lib/chip/index.ts
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/species-trait-card.tsx
    - src/lib/codex/feat-list.ts
    - src/components/character-sheet/library-feat-rows.ts
    - src/components/character-sheet/library-entity-rows.ts
    - src/app/dev/styleguide/page.tsx
  acceptance_criteria:
    - Two chip roles documented and implemented — ExpandableChip (interactive) + DescriptorChip (opaque, non-expandable)
    - Expandable chips use rounded-lg/rectangle geometry; expanded state does not clip label text (styleguide proof)
    - GridListRow BADGE_COLORS inline spans replaced with DescriptorChip
    - PartChip + ExpandableGridListChip + ui ExpandableChip merged into one ui ExpandableChip
    - Redundant metadata removed (feat category column vs chip; trait category bar vs floating text)
    - Metadata audit table in CHIP_UNIFICATION_PLAN.md completed for feats, traits, powers, techniques, weapons, armor
    - Styleguide shows expandable vs descriptor side-by-side; npm run build passes
  completed_work: |
    Phase A (2026-07-02): chip `shape` variant; `descriptor` variant + DescriptorChip; shared expandableChipShellClass;
    GridListRow badges/total cost → DescriptorChip; descriptor routing for tags/metadata; styleguide + docs.
    Phase B (2026-07-02): merged ExpandableChip, PartChip, GridListRow chips into single `ui/ExpandableChip`;
    `expandable-chip-props.ts` adapters; deleted `expandable-grid-list-chip.tsx`. Build passes.
    Phase B audit (2026-07-02): `GridListChip` wrapper; `PartData` + `ChipOptionsPanel` in `lib/chip/`; `PartChipList` → ExpandableChip; styleguide GridListRow patterns. Build passes.
    Phase C (2026-07-02): feat category redundancy removed; SpeciesTraitCard/HubListRow/ItemCard → DescriptorChip; encounters/crafting badgeVariant. Build passes.
    Phase C audit (2026-07-03): `descriptor-chip-variants.ts`; global metadata migration (creator, sheet, guided, admin, creature/item/power creators). Build passes.
    Phase D (2026-07-03): `list-row-metadata.ts`; raw requirements divs → descriptor detailSections (powers/techniques/armor); range/damage in add-library + creator modals; feat Type hidden in creator tabs. Build passes.
    Phase D audit (2026-07-03): `part-chips-from-display.ts`; creature stat block, load-library modal, creature creator, library/official lists; weapon/shield/equipment detailSections; empowered range metadata. Build passes.
    Phase E (2026-07-03): `ChipData.kind`; removed `category: 'tag'` + `PartChipDetails`; `chip-data-helpers.ts`; feat modals → `buildFeatDetailSections`; styleguide expanded rows + `chip-unification.pw.ts` baselines. Build passes.
    Phase E audit (2026-07-03): explicit `descriptorChipData` on codex parts/equipment, add-skill abilities, admin species skills; `buildUsesRecoveryDetailSections`; VSEA-004 closed. Build passes.
  remaining_work: |
    None — TASK-415 complete. Expandable chips (options, leveled feats, traits with descriptions) correctly omit explicit `kind`.
  notes: |
    Owner feedback 2026-07-02. Phase 2.2 unified token maps; this task completes semantic/UX chip unification.
    Implement in sub-phases A–E per CHIP_UNIFICATION_PLAN.md (primitives → merge → descriptors → metadata audit → cleanup).

- id: TASK-416
  title: Feat tag unification — taxonomy cleanup + untagged feats
  priority: medium
  status: done
  created_at: 2026-07-03
  created_by: owner
  description: |
    Reduce duplicate/noisy feat tags in codex_feats; normalize on admin save; tag feats missing tags.
    SQL migrations in sql/feat-tags-unification-phase*.sql; rules in src/docs/FEAT_TAGS.md.
  related_files:
    - sql/feat-tags-unification-phase1.sql
    - sql/feat-tags-unification-phase2.sql
    - sql/feat-tags-unification-phase3-proposed.sql
    - scripts/sync-feat-tags-csv.js
    - src/docs/FEAT_TAGS.md
    - src/lib/codex/feat-tags.ts
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/codex/feat-list.ts
  acceptance_criteria:
    - Phase 1–2 SQL applied; unique tags materially reduced (349 → ~277 achieved)
    - Admin feat save normalizes tags via `normalize_feat_tags` RPC
    - Phase 3 proposed tags for all untagged feats; owner approves before DB apply
    - Seed CSV parity documented or exported after approved apply
  completed_work: |
    Phase 1–2 (2026-07-03): SQL functions + live DB apply — 277 unique tags.
    Phase 3 prep (2026-07-03): `feat-tags.ts`, admin save RPC normalization, phase3-proposed.sql (50 feats), FEAT_TAGS.md.
    Phase 3 apply (2026-07-03): 50 feats tagged; 0 untagged; 291 unique tags. `feats.csv` synced via `scripts/sync-feat-tags-csv.js` (538 tag column updates).
    Phase 4 (TASK-418, 2026-07-03): singleton merges — 172 unique tags. See `feat-tags-unification-phase4.sql`.
  remaining_work: |
    None — feat tag unification complete (phases 1–4).
  notes: |
    Owner approved phases 3–4 apply 2026-07-03. Codex data workflow: realms-codex-data.mdc.

- id: TASK-418
  title: Feat tag unification — Phase 4 singleton merges
  priority: medium
  status: done
  created_at: 2026-07-03
  created_by: owner
  parent_task: TASK-416
  description: |
    Merge singleton/low-count tags into canonical families; fix phase 1–2 over-drops (Focus, Movement).
  related_files:
    - sql/feat-tags-unification-phase4.sql
    - src/docs/FEAT_TAGS.md
  acceptance_criteria:
    - map_feat_tag_phase3 + updated normalize_feat_tags deployed
    - Unique tags reduced materially; zero untagged feats
    - feats.csv synced
  completed_work: |
    Applied 2026-07-03: 291 → 172 unique tags; 122 → 14 singletons; ~128 feats re-normalized.
    Fixed Focus/Movement drops; remapped Carry/Luck/Solo/Environment/Wall/Water instead of NULL.
  notes: |
    Owner approved 2026-07-03. Remaining 14 singletons intentional (skills, Focus, Interchangeable, etc.).

- id: TASK-414
  title: Power creator Layer 1 — owner spec lock (design before build)
  priority: high
  status: not-started
  assignee: owner
  created_at: 2026-07-01
  created_by: owner
  description: |
    Owner completes POWER_CREATOR_LAYER1_SPEC.md with exact step order, screen copy, template list, character/innate rules, and L1/L2/L3 boundaries. No agent implementation of guided power creator (TASK-408–413) until this task is marked done with owner approval.
  related_files:
    - src/docs/human/POWER_CREATOR_LAYER1_SPEC.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Every wizard step documented per Appendix A template (purpose, L1 UI, completion rules, tooltips).
    - Open questions in spec resolved or explicitly deferred with owner decision.
    - Template powers chosen from official_powers with IDs and category mapping.
    - Character vs guest flow, innate filtering, and advanced handoff behavior specified.
    - Owner marks spec status APPROVED at top of POWER_CREATOR_LAYER1_SPEC.md.
    - REALMS §5.11 updated to reference locked spec (agent may assist after approval).
  notes: |
    Human-owned design task. Agents may help draft or facilitate review but must not implement TASK-410+ until done.
    2026-07-01: Owner — no perfect L1 vision yet; spec must be exact before build.

- id: TASK-420
  title: HYG-02 library API typing hardening (official + user fetch)
  priority: high
  status: done
  created_at: 2026-07-04
  created_by: agent
  parent_task: TASK-378
  build_validation: DEV-V-015
  developer_test_plan: Automated via npm test (library-types.test.ts); smoke Library + Realms Library tabs + add-to-library confirm.
  description: |
    Replace `fetchOfficialLibrary` / loose `Record<string, unknown>[]` returns with canonical library
    item types shared by user and official APIs. Align `library-service.ts`, `use-official-library`,
    and official list helpers with `UserPower`/`UserTechnique`/etc. shapes from columnar rowToItem.
  related_files:
    - src/types/library.ts
    - src/services/library-service.ts
    - src/hooks/use-user-library.ts
    - src/hooks/use-official-library.ts
    - src/lib/library/official-power-list.ts
    - src/lib/library/official-technique-list.ts
    - src/lib/library/official-item-list.ts
    - src/lib/library/official-creature-list.ts
    - src/docs/DATA_HANDLING.md
  acceptance_criteria:
    - `fetchOfficialLibrary(type)` returns typed array per library kind (no `Record<string, unknown>[]`).
    - `useOfficialLibrary` and `useAddOfficialToLibrary` use shared library types.
    - Entity types live in `src/types/library.ts`; hooks re-export for backward compatibility.
    - `npm run build`, `npm test`, and `npm run lint` pass.
  notes: |
    Follow-up to TASK-378. Complements TASK-379 (pipeline unification) — typing first, unification second.
    DONE 2026-07-04: `src/types/library.ts` canonical shapes; typed `fetchOfficialLibrary`/`useOfficialLibrary`/`useAddOfficialToLibrary`; official list helpers + entity lists; removed `Record<string, unknown>` casts across library consumers (creators, crafting, character creator, guided creator, creature stat block); `library-types.test.ts`; build + test pass.

- id: TASK-421
  title: HYG-03 enhanced items payload typing
  priority: medium
  status: done
  created_at: 2026-07-04
  created_by: agent
  completed_at: 2026-07-13
  parent_task: TASK-378
  description: |
    Replace `Record<string, any>` on `OfficialEnhancedItem.payload` and create mutation bodies with
    a typed crafting payload interface aligned with `UserEnhancedItem` and `/api/official/enhanced-items`.
  related_files:
    - src/hooks/use-enhanced-items.ts
    - src/types/crafting.ts
    - src/types/crafting-enhanced-items.test.ts
    - src/services/enhanced-items-service.ts
    - src/app/api/official/enhanced-items/route.ts
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
  acceptance_criteria:
    - No `@typescript-eslint/no-explicit-any` on enhanced-items hook/service.
    - Payload type documents known fields; unknown extensions via `Record<string, unknown>` index if needed.
    - `npm run build` and `npm test` pass.
  notes: |
    Smaller scope than TASK-420. Creator `handleLoad*(item: any)` deferred to TASK-381 god-file split.
    2026-07-13: Done — `OfficialEnhancedItemPayload` + create/patch inputs in `crafting.ts`; hook uses
    typed bodies (no `any`/eslint-disable); admin tab shares `CreateOfficialEnhancedItemInput`;
    vitest shape coverage; FEATURE_INDEX updated.
    2026-07-13 audit: scope overloads on create/update; null payload normalized on official fetch;
    AGENT_GUIDE types note. Known pre-existing: admin "edit" still POSTs create (PATCH is name/uses/payload only).

---
