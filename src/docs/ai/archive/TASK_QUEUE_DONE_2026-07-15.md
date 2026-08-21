# Done tasks snapshot — 2026-07-15

Moved out of the session-start hot path during the AI workflow overhaul.
Canonical append-only done list: [`TASK_QUEUE_DONE.md`](TASK_QUEUE_DONE.md).

**Count:** 79 tasks.

---

- id: TASK-473
  title: Admin path — recommended innate powers + eligibility validation
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-471
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T013
  developer_test_plan: |
    Suite DEV-V-008 T013 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/codex/route.ts
    - src/types/codex.ts
    - src/types/archetype.ts
    - src/lib/game/archetype-display.ts
    - src/lib/game/archetype-path.ts
    - src/lib/game/innate-eligibility.ts
    - src/lib/game/innate-eligibility.test.ts
    - src/lib/game/path-validation.ts
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
    - sql/codex-archetypes-level1-innate-powers-proposed.sql
  description: |
    Paths must author recommended powers and recommended innate powers separately. Admin path
    creation enforces full innate eligibility (REALMS Appendix G / §5.11): Energy ≤ Innate
    Threshold; Basic/Reaction only; no healing/energy-gain parts; combined recommended innate
    Energy costs fit Innate Energy (Threshold × Pools from calculateArchetypeProgression — L1
    Power 16 / Powered-Martial 6). Do NOT use getInnateEnergyMax / ARCHETYPE_CONFIGS.innateEnergy
    (those values are mislabeled as threshold for Power). Propose schema field
    (prefer level1_innate_powers TEXT parallel to level1_powers, or path_data JSON) in sql/
    before any live DB write per realms-codex-data rules.
  acceptance_criteria:
    - Admin path UI can set recommended innate powers distinct from recommended powers.
    - Publish/save validation blocks any recommended innate that fails Appendix G eligibility
      (Energy > Innate Threshold, non–Basic/Reaction action type, healing/energy-gain parts)
      and warns/blocks when recommended innate Energy sum exceeds Innate Energy (progression).
    - Path parse/display exposes innate recommendations to guided creator (types + archetype-display).
    - Propose SQL/schema in sql/ for owner review before apply; update SUPABASE_SCHEMA / REALMS
      Appendix C with the chosen field name; no live codex writes without owner approve.
    - npm run build.
  notes: |
    Owner 2026-07-15: “other eligibility rules enforced on admin path creation (another task).”
    Can start in parallel with TASK-470/463; TASK-471 consumes the field (empty-state OK until
    seeded). Spec audit 2026-07-15: eligibility ≠ energy-only; Innate Energy ≠ getInnateEnergyMax.
    Implemented 2026-07-15: repo code + SQL. **Applied** on RealmsRPG-Test 2026-07-15 (owner
    approved) — `level1_innate_powers` TEXT live. Seed recommended innates via admin when ready.

- id: TASK-472
  title: Guided innate powers — threshold gate + fully use Innate Energy
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-471
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T057
  developer_test_plan: |
    Suite DEV-V-013 T057 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/shared/point-status.tsx
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/docs/GAME_RULES.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    On the innate powers portion of the guided power step: each pick must have Energy ≤ Innate
    Threshold; the user must select a set that fully spends Innate Energy (sum of innate Energy
    costs = Innate Energy). Budget source of truth: calculateArchetypeProgression(...).innateEnergy
    (Threshold × Pools — L1 Power 16 / PM 6), matching the character sheet — NOT
    getInnateEnergyMax / ARCHETYPE_CONFIGS.innateEnergy (Power currently returns 8 = threshold).
    Prefer fixing or deprecating getInnateEnergyMax if touched. Reuse sheet remaining helpers +
    PointStatus. Persist innate flags into build-character (powers: { id, innate }).
  acceptance_criteria:
    - Cannot select an innate candidate with Energy > Innate Threshold for archetype at L1.
    - Continue blocked until remaining Innate Energy is 0 (fully used) — intentional override of
      §5.8 optional Continue for the innate track only; regular powers stay optional.
    - Visible Innate Energy spent/remaining uses shared PointStatus (not a fork of
      LoadoutBudgetBar Currency — TP remains on regular powers only).
    - Budget math uses progression innateEnergy (16 Power / 6 PM at L1), not getInnateEnergyMax.
    - Optional: fix/deprecate misleading getInnateEnergyMax / constants.innateEnergy mislabel.
    - build-character writes innate: true on innate picks; sheet-compatible.
    - DEV-V-013 tests; update REALMS §5.8; npm run build.
  notes: |
    Depends on TASK-471 UI split. Sheet reference: library-section innate PointStatus + add
    innate-power modal filter. Martial techniques step: N/A (no innate). Spec audit 2026-07-15.
    Done 2026-07-15: progression innateEnergy (16/6); threshold gate; Continue until remaining 0;
    PointStatus Innate Energy; build-character innate:true; getInnateEnergyMax deprecated.
    Audit 2026-07-15: innate L1/L2 title budget = Energy; exclusive soft-seed vs regular; headings h3.

- id: TASK-471
  title: Guided powers — separate innate vs regular L1 lists
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-470
  follow_up_tasks:
    - TASK-472
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T056
  developer_test_plan: |
    Suite DEV-V-013 T056 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
    - src/types/archetype.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Power users (Power / Powered-Martial): split the powers step into distinct curated L1 lists —
    path recommended innate powers vs path recommended (regular) powers — not one mixed grid.
    Techniques step stays techniques-only (no innate). Reuse GuidedChoiceCard + TASK-470 chip
    anatomy; regular powers keep shared Training Points via LoadoutBudgetBar; innate list UX
    completes in TASK-472. Draft store must track innate picks separately (prefer innatePowerIds
    or powerIds + innate flags — today only powerIds/techniqueIds).
  acceptance_criteria:
    - Power archetype steps show two clear L1 sections/lists: Innate Powers and Powers (copy per
      GAME_RULES / REALMS glossary).
    - L1 cards come from path recommended innate vs recommended powers (graceful empty if
      TASK-473 field unset).
    - Store shape explicitly separates innate vs regular picks before TASK-472.
    - Techniques step unchanged except TASK-470/463 parity.
    - Soft (after TASK-463): L2 See more for innate vs regular opens the correct modal list;
      L2 picks promote onto the correct L1 list per TASK-458 pattern — do not block L1 dual-list
      ship on this.
    - Update REALMS §5.8 (innate vs regular; powered-martial clarity); FEATURE_INDEX; DEV-V-013;
      npm run build.
  notes: |
    After TASK-470. Soft-depends on TASK-473 for authored content. L1 split may run ∥ TASK-463;
    innate modal + L2 promote soft-after 463. Mirror sheet grammar; do not fork new card
    components. Spec audit 2026-07-15.
    Done 2026-07-15: dual L1 Innate Powers + Powers; innatePowerIds store (schema v6);
    soft L2 innate modal; graceful empty until TASK-473 seeds.
    Audit 2026-07-15: exclusive innate↔regular seed + reconcile; Energy title chips on innate cards.

- id: TASK-470
  title: Guided powers/techniques L1 — Loadout card + desc-chip parity
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-463
    - TASK-471
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T054
  developer_test_plan: |
    Suite DEV-V-013 T054 — see BUILD_VALIDATION.md
  related_files:
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Shore up guided technique and power L1 cards to work like Loadout weapons/armor
    (equipment-phase-stats disclosure anatomy): title-adjacent budget chips (Training Points),
    mechanic facts as desc chips behind See more…, same GuidedChoiceCard /
    GuidedEquipmentFactChips / DescriptorChipWithTip patterns.
    Desc chips: Action Type value-only (“Quick Action”, not “Action Type Quick Action”) via
    actionTypeFactChip / chip helper — do NOT blindly change formatActionTypeFact if GLR/ListHeader
    cells still need a labeled fact string; document chip vs column in GAME_RULES / AGENT_GUIDE.
  acceptance_criteria:
    - Power/technique GuidedChoiceCards match weapon/armor disclosure anatomy: titleMeta budgets;
      mechanic chips (incl. Action Type) in expandedExtra / See more — not title-adjacent Action
      Type; nothing under the disclosure row.
    - Desc chips for Action Type show capitalized value only (“Quick Action”, “Basic Reaction”);
      ListHeader / column cells may keep “Action Type” as the column label; update GAME_RULES
      mechanic-labels table + AGENT_GUIDE to distinguish chip vs column.
    - Training Points remain title-adjacent / LoadoutBudgetBar (TASK-456 — verify no regression).
    - Energy may appear as a compact fact chip or tagline — no parallel formatters outside
      compact-facts / power-technique-display.
    - Unit tests in compact-facts.test.ts for chip helper; DEV-V-013; npm run build.
  notes: |
    Foundation for TASK-463 (same fact language in modal) and TASK-471 (innate cards reuse).
    Today power-technique-display puts Action Type + TP in titleChips with no See more expand —
    that is the gap vs TASK-457 equipment. TP accounting itself is done (TASK-456).
    Spec audit 2026-07-15: chip vs column Action Type clarified.
    Done 2026-07-15: titleChips=TP only; detailChips=Action Type value-only + Energy;
    formatActionTypeValue + actionTypeFactChip; GAME_RULES/AGENT_GUIDE chip-vs-column.
    Audit 2026-07-15: confirmed anatomy; innate track uses Energy title budget (472).

- id: TASK-469
  title: Characters list — square portraits, drop search/ListHeader
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-022
    tests:
      - DEV-V-022-T001
      - DEV-V-022-T002
      - DEV-V-022-T003
  developer_test_plan: |
    Suite DEV-V-022 T001–T003 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/characters/page.tsx
    - src/components/character/character-card.tsx
  description: |
    Characters page portraits were shown in aspect-[3/4] inside a dense 4-col grid while
    portrait crop is square (aspect=1), so images looked horizontally cropped. ListHeader
    and search are list-row chrome that do not fit a card grid; most users do not search
    their own characters.
  acceptance_criteria:
    - CharacterCard portrait uses 1:1 (aspect-square) matching ImageUploadModal crop.
    - Grid maxes at 3 columns (not 4); AddCharacterCard / skeletons match portrait+footer geometry.
    - No SearchInput, ListHeader, or sort/filter on /characters.
    - Card names are h2 under page h1; muted text uses dark contrast; action labels include name.
    - DEV-V-022; npm run build.
  notes: |
    Owner feedback 2026-07-15. Audit pass fixed AddCharacterCard height parity, heading
    hierarchy, muted contrast, unique aria-labels, focus rings, Image sizes/onError.

- id: TASK-468
  title: ValueStepper sleek neutral style sitewide
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T053
  developer_test_plan: |
    Suite DEV-V-013 T053 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/value-stepper.tsx
    - src/components/shared/quantity-selector.tsx
    - src/app/globals.css
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Prefer sleeker/cleaner steppers like skill bonus controls (surface/neutral, rounded
    not red/green circles). Update shared ValueStepper (+ QuantitySelector alignment)
    and DESIGN_SYSTEM; keep ≥44px touch targets and soft health/energy tints only.
  acceptance_criteria:
    - Default ValueStepper / DecrementButton / IncrementButton use neutral btn-stepper.
    - QuantitySelector matches the sleek look; red/green danger/success CSS deprecated.
    - DESIGN_SYSTEM documents the preference; npm run build.
  notes: |
    Parallel with TASK-464–466. SkillRow table variant already used this look inline;
    ValueStepper now matches so creators/sheet share one system.

- id: TASK-467
  title: UnifiedSelectionModal in-row quantity-first
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-468
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T052
  developer_test_plan: |
    Suite DEV-V-013 T052 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/quantity-selector.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
  description: |
    Equipment See more options add modal: quantity steppers must live in the GridListRow
    (`- n +`), not push the row aside. Prefer quantity-first — increasing from 0 selects;
    decreasing to 0 deselects — without forking a guided-only modal.
  acceptance_criteria:
    - showQuantity uses in-row QuantitySelector on every row (qty 0 allowed).
    - No side-column ValueStepper that shoves GridListRow.
    - + from 0 selects; − to 0 deselects; confirm still attaches quantities.
    - DEV-V-013-T052; npm run build.
  notes: |
    After TASK-468 preferred for visual consistency; can ship with QuantitySelector even if
    ValueStepper lands same session. Extends shared modal carefully.

- id: TASK-466
  title: Equipment L1 Quantity adjacent + density
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T051
  developer_test_plan: |
    Suite DEV-V-013 T051 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
  description: |
    Equipment phase cards: reduce excess vertical space; keep Quantity label adjacent to
    the quantity steppers (not justify-between across the card width).
  acceptance_criteria:
    - Quantity label + stepper sit in one tight inline group above See more.
    - Still ≥44px touch targets; item-specific a11y names preserved.
    - DEV-V-013-T051; npm run build.
  notes: |
    Parallel with TASK-464/465/468.

- id: TASK-465
  title: InfoTippy inside chips and PointStatus labels
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T050
  developer_test_plan: |
    Suite DEV-V-013 T050 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/descriptor-chip-with-tip.tsx
    - src/components/shared/point-status.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Place contextual InfoTippy triggers inside the chip / resource label they explain
    (DescriptorChipWithTip, Training Points PointStatus), not as detached siblings.
  acceptance_criteria:
    - DescriptorChipWithTip renders the i inside DescriptorChip when description exists.
    - LoadoutBudgetBar TP tip uses PointStatus.labelAccessory inside the pill.
    - Docs note inside-placement preference; a11y labels preserved; npm run build.
  notes: |
    Parallel with TASK-464. Recommendation: inside (Fitts / association / density).

- id: TASK-464
  title: Compact-facts polish — Ability Requirement, Damage, suppress redundancies
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-465
    - TASK-466
    - TASK-467
    - TASK-468
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T049
  developer_test_plan: |
    Suite DEV-V-013 T049 — see BUILD_VALIDATION.md
  related_files:
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Owner Loadout fact-chip polish: Ability chips as `Strength Requirement 1+`; capitalize
    Damage; suppress redundant mechanic property chips (Weapon Damage, DR property, Armor
    Base, …); L1 named property chips are name-only (no TP on those desc chips). Armor gets
    ability requirement chips like weapons.
  acceptance_criteria:
    - formatAbilityRequirementFact → `Abilityname Requirement X+` with prefix stripping.
    - formatDamageFact ends with capitalized Damage.
    - MECHANIC_PROPERTY_NAMES / isMechanicPropertyName suppress calculation-only and
      already-represented properties; namedPropertyDescriptorChips default includeCost false.
    - Armor detailChips include ability requirement when present.
    - GAME_RULES / AGENT_GUIDE / REALMS document the rule; unit tests + DEV-V-013-T049;
      npm run build.
  notes: |
    Foundation for TASK-465–468. No parallel formatters. Codices: no live DB writes.

- id: TASK-463
  title: Guided powers/techniques L2 — UnifiedSelectionModal + energy filter
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-470
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T055
  developer_test_plan: |
    Suite DEV-V-013 T055 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-powers-techniques-browse-panel.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/loadout-tp.ts
    - src/lib/detail-option/combat-builder.ts
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/game/calculations.ts
    - src/components/shared/unified-selection-modal.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    REALMS §3.1 / §5.8: See more options must open a Layer 2 modal (GridListRow +
    UnifiedSelectionModal), not dump the official library as in-step cards (current
    GuidedPowersTechniquesBrowsePanel / empty-path fallback). Mirror guided equipment L2
    (guided-equipment-l2-modal + LoadoutBudgetBar). Filter official powers/techniques so
    Energy cost ≤ theoretical max Energy at L1 (health-energy pool all-to-energy + archetype
    ability via calculateMaxEnergy); if draft abilities unavailable, fallback filter Energy > 20
    out. Innate See more / threshold-filtered modal is out of scope until TASK-471 (regular
    powers/techniques only here). Prefer TASK-470 chip grammar first.
  acceptance_criteria:
    - See more options for powers and techniques opens UnifiedSelectionModal with GridListRow —
      never mounts the full official catalog as GuidedChoiceCards on the step.
    - Stop mounting GuidedPowersTechniquesBrowsePanel; delete or quarantine as dead code.
    - Empty path recommendations still offer modal browse, not an inline card dump.
    - Non-innate catalog: Energy ≤ theoretical L1 max Energy (calculateMaxEnergy with full L1
      HP/EN pool of 18 allocated to Energy + archetype ability from draft); fallback exclude
      Energy > 20 when calc inputs missing. Document helper next to power-technique-display /
      calculations.
    - Martial → techniques only; Power → powers only.
    - Innate modal deferred to TASK-471 (do not implement innate See more in this task).
    - Same fact language as L1 cards (TASK-470 Action Type value-only chips, Training Points,
      Energy) via compact-facts / combat-builder; LoadoutBudgetBar TP gating; L2→L1 promotion
      (TASK-458).
    - fullScreenOnMobile on modal; update REALMS §5.8 (replace in-step panel wording);
      FEATURE_INDEX; DEV-V-013; npm run build.
  notes: |
    Updated 2026-07-15 from owner Powers/Techniques feedback (modal + energy filter). Spec audit
    same day: removed hard follow_up TASK-471 (L1 dual lists may run ∥ this task); innate modal
    deferred; browse panel removal is AC. Prefer calculateMaxEnergy(18, ...) over hard-cap —
    function and GAME_RULES L1 pool of 18 already exist.
    Done 2026-07-15: GuidedPowersTechniquesL2Modal; deleted browse panel; Energy ≤
    calculateMaxEnergy(18,…) with >20 fallback.
    Audit 2026-07-15: confirmed modal-only L2; dead browse copy removed from site-copy.

- id: TASK-462
  title: Guided Your Hero reveal — cherry-on-top finalize overhaul
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T015
      - DEV-V-013-T045
  developer_test_plan: |
    Suite DEV-V-013 T015, T045 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/guided-creator/guided-health-energy-section.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Overhaul guided Meet your hero (reveal) into a fulfilling big-reveal: max useful
    build info, min clutter. Hero header owns clickable portrait + name; identity and
    Health/Energy sit near the top; Your Build drops edit hooks and redundant Type /
    archetype-ability cards; powers section title is Powers, Techniques, or both;
    species average placeholders on age/height/weight; appearance + description fields.
  acceptance_criteria:
    - Hero band: click portrait to upload/change; name editable in-header (not only lower form).
    - Identity (demographics + appearance + description) and Health/Energy appear above Your Build.
    - Your Build has no Edit jump links; no Type card; no standalone Power/Martial ability cards.
    - Powers section title is Powers, Techniques, or Powers & Techniques based on picks.
    - Age/height/weight placeholders show species adulthood–lifespan and average cm/kg when known.
    - Appearance and general description save onto character (appearance + description).
    - Health/Energy copy is quieter (less explanatory noise).
    - DEV-V-013-T015 / T045 updated; build passes.
  notes: |
    Product overview §5.10. Owner feedback 2026-07-15. Revisit prior steps via chapter rail only.
    Implemented 2026-07-15; npm run build green.

- id: TASK-454
  title: Shared compact fact grammar — semantic chips, tooltips, capitalization
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-457
    - TASK-461
  related_files:
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/lib/detail-option/builders.ts
    - src/lib/detail-option/combat-builder.ts
    - src/lib/detail-option/equipment-builder.ts
    - src/lib/chip/list-row-metadata.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/components/shared/descriptor-chip-with-tip.tsx
    - src/components/shared/grid-list-row-types.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/GAME_RULES.md
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Establish one typed compact-fact presentation grammar for cards and GridListRow before
    changing guided Loadout. Today equipment owns one-off labels such as “Handedness Two-handed,”
    “Damage X,” and “Strength attack,” while property descriptions can become expandable chips.
    Define shared builders that turn structured mechanics into clean, self-describing descriptor
    chips when a labeled column is unavailable, and document when a dense GLR should keep columns.
  acceptance_criteria:
    - Document the column-versus-chip rule: keep labeled columns in dense comparison views; when
      compacting a fact into a chip, use natural self-describing language rather than “Header: value.”
    - Shared typed formatters/builders cover at least Ability Requirement, handedness, damage/type,
      weapon Ability, Range, Spaces, Action Type, Currency, and Training Points; feature components
      do not recreate these strings.
    - Canonical weapon examples are “Ability Requirement X+,” “Two-handed,” “XdY Type damage,”
      “Strength Weapon,” “Agility Weapon” for Finesse, and “Acuity Weapon” for ranged non-Finesse.
    - Rules terms and values are capitalized from structured data (for example Range, Spaces,
      Basic Reaction) without title-casing ordinary prose.
    - Non-mechanic properties render as non-expanding descriptor chips (for example “Graze”) with
      a small accessible InfoTippy trigger when a description exists; hover, focus, and touch help
      follow the existing Floating UI standard.
    - Card anatomy guidance states that supporting content belongs before the See more / See less /
      More details disclosure controls; do not append orphan facts or controls below that boundary.
    - Unit tests lock formatter output and fallback behavior; npm run build passes.
  notes: |
    Foundation shipped 2026-07-15: `compact-facts.ts` + `DescriptorChipWithTip`; equipment-phase-stats
    and detail-option/list-row metadata consume formatters. Guided card layout / disclosure polish
    remains TASK-457; sitewide rollout TASK-461. Build validation: DEV-V-013-T040.
  build_validation: DEV-V-013-T040
  developer_test_plan: DEV-V-013

- id: TASK-455
  title: Guided card regressions — No Flaw height and Archetype Ability pill collision
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T009
      - DEV-V-013-T034
      - DEV-V-013-T035
  developer_test_plan: |
    T009 selected No Flaw keeps peer footprint (action-row + compact min-height);
    T034/T035 short single-line Archetype/Secondary pills with full aria-label, no name overlap.
  related_files:
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-choice-styles.ts
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
  description: |
    Reproduce and fix two reported regressions even though TASK-452 and the prior No Flaw patch
    claimed them resolved: selected No Flaw loses normal peer-card height, and the Archetype Ability
    pill wraps into or overlaps the Ability name. Fix shared card/grid geometry, not one screen only.
  acceptance_criteria:
    - Selected and unselected No Flaw retain the same minimum card footprint as peer Flaw cards;
      selection, expansion, and absence of a long description do not collapse the card.
    - Archetype Ability / Secondary Ability pills never overlap the Ability name or neighboring
      tiles at ~360px, tablet, or desktop; wrapping cannot increase the pill into the name region.
    - Full accessible names remain available if visible copy is shortened or truncated.
    - Touch targets remain at least 44×44px and semantic design tokens pass light/dark contrast.
    - Add regression coverage to DEV-V-013 and run npm run build.
  evidence: |
    Root causes: (1) expanded short cards dropped empty action-row while peers kept min-h-11, so
    No Flaw alone on a row shrank despite cardCollapsed; (2) TASK-452 wrap on “Archetype Ability”
    grew the straddling pill into the tile name. Fixes: showActionRow mirrors keepBodyFloor;
    compact cardCollapsed bumped; pills use short single-line Archetype/Secondary + aria-label
    + highlight pt-3. npm run build pass.
  notes: |
    Can run in parallel with TASK-454 and TASK-459. Verify the current report; do not close this
    solely from old TASK-452 evidence.

- id: TASK-456
  title: Guided Loadout budgets — optional picks, Currency and Training Points
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-454
  follow_up_tasks:
    - TASK-457
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/guided-creator/equipment-phase-nav.ts
    - src/lib/guided-creator/loadout-tp.ts
    - public/tooltip-text.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
  description: |
    Make weapon, armor, and Equipment selections optional while exposing the real constraints that
    still apply when users choose items. Training Points must be visible beside Currency throughout
    Loadout and on powers/techniques so Layer 1 users can understand and avoid overspending.
  acceptance_criteria:
    - A user may continue through weapon, armor, and Equipment phases with zero selections; optional
      picks do not bypass validation of selections that do exist.
    - Loadout shows shared PointStatus-style Currency and Training Points total/spent/remaining
      consistently on every phase, with clear InfoTippy help for Training Points.
    - Weapons and armor expose their Training Points cost beside Currency using TASK-454 semantics.
    - Powers/techniques show the applicable Training Points budget and per-choice cost, prevent
      overspending, and explain why a choice is unavailable; no mandatory pick is invented.
    - Budget calculations use existing rules-aware TP/currency helpers and reclaim budget when a
      selection is removed or replaced; L1 and L2 use the same totals.
    - Reconcile REALMS §5.7 / §5.8 and GAME_RULES: remove “Training Points stay in Layer 2” and
      “included in your path” claims where they conflict with visible constrained selection.
    - Add DEV-V-013 tests for zero-pick continuation and cross-phase Currency/TP accounting;
      npm run build passes.
  notes: |
    2026-07-15: Done. Optional phase completion; Currency+TP PointStatus L1/L2; weapon/armor TP chips;
    powers/techniques shared TP + soft affordable seed (no mandatory pick). TASK-444 still owns L2 browse UI.
  build_validation: DEV-V-013-T041, DEV-V-013-T042
  developer_test_plan: DEV-V-013

- id: TASK-457
  title: Guided weapon and armor cards — disclosure-safe fact layout
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-456
  follow_up_tasks:
    - TASK-458
    - TASK-460
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/docs/ai/AGENT_GUIDE.md
  description: |
    Rebuild guided weapon/armor card facts on the shared TASK-454 grammar. Collapsed cards should
    not expose expandable property chips or leave content below disclosure controls. Currency and
    Training Points are compact title-adjacent metadata; See more owns the remaining mechanic facts.
  acceptance_criteria:
    - Collapsed weapon/armor cards show name plus consistent title-adjacent Currency and Training
      Points descriptors; no expandable chips appear in the collapsed card body.
    - See more reveals only mechanically useful non-expanding facts using canonical labels:
      Ability Requirement, handedness, damage/type, and Strength/Agility/Acuity Weapon.
    - Finesse is represented by “Agility Weapon” rather than a duplicate Finesse mechanic chip;
      ranged non-Finesse uses “Acuity Weapon”; ordinary melee uses “Strength Weapon.”
    - Other named properties appear as descriptor chips with an accessible tooltip info trigger,
      not “Property: description” text and not click-to-expand chips.
    - No facts, chips, or controls render underneath See more / See less / More details; selected,
      expanded, and long-content cards maintain stable geometry.
    - Remove guided-only string construction superseded by TASK-454; update the phased spec and
      AGENT_GUIDE examples.
    - Verify at ~360px and desktop in light/dark; add DEV-V-013 tests; npm run build passes.
  evidence: |
    titleChips (Currency/TP) via GuidedChoiceCard titleMeta; detailChips (mechanics + named props)
    in expandedExtra with DescriptorChipWithTip; no children chips under disclosure; gear quantity
    moved to beforeDisclosure. Removed formatDamageFactLine; unit tests lock split. DEV-V-013-T044.
  notes: |
    First production pilot for shared compact-fact grammar; TASK-461 rolls the pattern out sitewide.
  build_validation: DEV-V-013-T044
  developer_test_plan: DEV-V-013

- id: TASK-458
  title: Guided catalog picks — return selected items as visible cards
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-457
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T043
      - DEV-V-013-T046
  developer_test_plan: |
    Suite DEV-V-013 T043, T046 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/lib/guided-creator/equipment-phase-candidates.ts
    - src/lib/guided-creator/equipment-phase-candidates.test.ts
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/powers-techniques-l1-candidates.test.ts
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/stores/guided-creator-store.ts
  description: |
    Ensure a selection made through See more options remains understandable after returning to
    recommendations. A non-path weapon, armor, power, or technique must be promoted into the current
    card grid as a selected card instead of disappearing into hidden draft state.
  acceptance_criteria:
    - Selecting a non-path weapon or armor in L2 immediately adds a selected card to the current L1
      grid; closing/reopening the modal and navigating Back/Continue preserves it.
    - After TASK-444 provides powers/techniques L2, selected non-path powers/techniques use the same
      promotion behavior and shared card facts.
    - Path recommendations may use one subtle descriptor when differentiation is necessary, but
      avoid reintroducing noisy “Path pick” badges; selected state remains the primary signal.
    - Candidate merging is ID-stable, deduplicated, and does not drop resolvable selected rows during
      async library loading; stale unresolved refs still prune safely.
    - Removing a promoted selection updates cards and Currency/Training Points immediately.
    - Add DEV-V-013 tests for equipment and powers/techniques L2 → selected-card return;
      npm run build passes.
  evidence: |
    Equipment: getPhaseL1Candidates already merges selectedIds; unit tests cover dedupe + wrong-phase skip.
    Powers/techniques: getPowersTechniquesL1Ids promotes resolvable non-path selected IDs onto L1
    (flat grid or Your other section); subtle Path DescriptorChip only when mixed flat grid.
    DEV-V-013-T043/T046; unit tests; npm run build.
  notes: |
    Equipment already merges selected IDs in getPhaseL1Candidates; treat this as verification plus
    regression hardening. Powers/techniques portion depends on TASK-444.

- id: TASK-459
  title: Guided chapter terminology — Loadout chapter and Equipment screen
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T002, DEV-V-013-T004, DEV-V-013-T013, DEV-V-013-T024, DEV-V-013-T026, DEV-V-013-T039
  developer_test_plan: DEV-V-013
  related_files:
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/stores/guided-creator-store.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Make the chapter name “Loadout” because it includes weapons, armor, Equipment, powers, and
    techniques. Rename the current Adventuring Gear/Gear phase to “Equipment” everywhere users see
    it, while preserving accurate internal types until a safe mechanical rename is warranted.
  acceptance_criteria:
    - Chapter rail, headings, review/reveal, help, and completion copy consistently use “Loadout.”
    - The gear phase and its add modal consistently use “Equipment”; no user-facing “Adventuring
      Gear” or ambiguous bare “Gear” remains in the guided flow.
    - Weapons, Armor, Equipment, Powers, and Techniques are framed as Loadout sub-steps without
      duplicate chapter/page titles.
    - Copy follows GAME_RULES capitalization and contains no new em dashes.
    - Update product/spec docs and DEV-V-013 copy checks; npm run build passes.
  notes: |
    2026-07-15: Done. User-facing copy only; internal chapter id `equipment` and phase id `gear` kept.
    Chapter titles flow from GUIDED_CREATOR_COPY.chapters via GUIDED_CHAPTERS. DEV-V-013-T039 added.

- id: TASK-460
  title: Guided Equipment screen — card copy, quantity, and add-modal polish
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-458
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T024
      - DEV-V-013-T047
  developer_test_plan: |
    Suite DEV-V-013 T024, T047 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/value-stepper.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/MOBILE_UX.md
  description: |
    Polish the renamed Equipment phase after the shared card/disclosure work. Remove repeated
    description-as-“Use” chips, normalize Currency/Training Points placement, and redesign quantity
    selection in both cards and the add modal so quantity is shown once with clear shared controls.
  acceptance_criteria:
    - Equipment card description appears once; no generated “Use [repeated description]” chip.
    - Currency and Training Points occupy the same title-adjacent location used by weapon/armor
      cards; no cost chip is stranded below the disclosure area.
    - Selected quantity is displayed once per item. The visible stepper label is “Quantity”; the
      control retains an item-specific accessible name without duplicating visible text.
    - Audit and improve the L2 add-modal quantity composition using shared ValueStepper/control
      patterns: clear grouping, ≥44×44px targets, no cramped or duplicate count, and immediate totals.
    - The selection modal uses Modal with fullScreenOnMobile and sticky/scroll behavior at <768px;
      verify at ~360px, tablet, and desktop in light/dark.
    - “Add all recommended Equipment” and individual quantities still respect Currency/Training
      Points and do not create duplicate rows.
    - Add DEV-V-013 tests and run npm run build.
  evidence: |
    L1 Quantity group aria-label + visible Quantity (aria-hidden) + ValueStepper item-specific
    decrement/increment titles; L2 UnifiedSelectionModal uses ValueStepper + initialQuantities from
    draft; Equipment titleChips Currency via buildEquipmentPhaseCardStats (no Use chips); unit test
    locks no Use; DEV-V-013-T024/T047; npm run build.
  notes: |
    Start after TASK-458 because both tasks edit the L1 phase and L2 modal; coordinate final copy
    with TASK-459.

- id: TASK-452
  title: AbilityScoreGrid — mobile labels, Archetype Ability pill, edit layout
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T035
      - DEV-V-013-T036
      - DEV-V-013-T037
  developer_test_plan: |
    DEV-V-013-T035 short ability labels + no pill spill at ~360px; T036 edit steppers fit;
    T037 path change resets ability scores.
  related_files:
    - src/components/shared/ability-score-grid.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/creator/ability-score-editor.tsx
  description: |
    Owner mobile feedback + guided-creator audit: on ~360px, Intelligence (longest full name)
    is crammed in AbilityScoreGrid 3-col tiles (`grid-cols-3`, full `info.name` + tracking-wider,
    unused shortName INT). Non-hybrid path highlight pill uses whitespace-nowrap "Archetype Ability"
    which spills outside the tile. Customize/edit mode packs 44px ± steppers into the same ~75px
    cells. Same grid is reused on abilities display, customize, and reveal summary — fix once in
    AbilityScoreGrid (do not fork guided layouts).
  acceptance_criteria:
    - At ~360px width, all six ability labels fit their tiles without overflow or ugliness
      (prefer shortName below sm, or wrap/smaller type; Charisma must also fit).
    - Archetype Ability / Secondary Ability / Power / Martial pills do not spill into neighbors
      (shorter copy, wrap, or truncate with accessible name; hybrid short labels remain OK).
    - Edit mode at ~360px: ± controls remain ≥44px and do not collide (stack, 2-col, or list layout
      below sm — not forced into 3-col with horizontal 44px steppers).
    - Reveal summary and abilities step both look correct after the shared fix.
    - npm run build passes; add BUILD_VALIDATION checks under DEV-V-013 (or sheet suite if shared).
  evidence: |
    Display: shortName below sm + tile aria-label. Pills: wrap (no whitespace-nowrap), max-w-full,
    title/aria-label Secondary Recommended Ability; primary-subtle-fg contrast.
    Edit: 1/2/3/6 col breakpoints + horizontal row tiles on phone.
    Compliance extras: path change resets abilities; detail InfoTippy size=icon; restored
    resolveDistinctSecondaryAbility export.
  notes: |
    Audit + compliance pass 2026-07-15. Follow-up footer hints = TASK-453 (open).

- id: TASK-453
  title: Guided creator — mobile completion hints + residual density polish
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T038
  developer_test_plan: |
    DEV-V-013-T038 — completion hints visible above Back/Continue at ~360px; mid-footer on sm+.
  related_files:
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-step-layout.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
  description: |
    From guided-creator mobile audit (after TASK-452): GuidedStepFooter hides completionHint below
    sm (`hidden sm:flex`), so phones lose points-left / selection-count / progress that skills,
    ancestry, feats, and loadout put in the footer. Also residual Low/Med density notes: dense skill
    rows with long path chips, nested ability-card padding if still tight after 452, equipment fact
    chip density, species vitals 2-col wrap. Prefer surfacing hints in-step on mobile or adapting
    the footer so progress is visible without crowding Back/Continue.
  acceptance_criteria:
    - On viewports < sm, users still see relevant completion/progress (points left, pick counts,
      etc.) either in the footer or as an in-step banner/status — not silent.
    - Skills/ancestry/feats/loadout verified at ~360px: progress visible; no new horizontal overflow.
    - Optional residual density polish from audit notes only if still painful after TASK-452.
    - npm run build; BUILD_VALIDATION entries for footer/in-step hints on mobile.
  evidence: |
    GuidedStepFooter: single completionHint mount; phone stacks via flex order, sm+ mid-bar;
    aria-live=polite. GuidedStepLayout pb-32 when hint present. Character feat N/1 hint.
    Light density: abilities card p-4 sm:p-5; path skill chip max-w truncate. Skills PointStatus
    already in-step.
  notes: |
    Owner UX choice: stack above Back/Continue. Sanity 2026-07-15 fixed dual-mount of same React node.

- id: TASK-451
  title: Guided creator — retain picks, skills L2 browse, secondary ability pill
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T010
      - DEV-V-013-T032
      - DEV-V-013-T033
      - DEV-V-013-T034
  developer_test_plan: |
    DEV-V-013-T032 retain picks on Back; T033 Browse all Skills below recommendations;
    T034 Secondary Ability pill; T010 browse modal still works from new placement.
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
  description: |
    Owner feedback: (1) going back must not forget traits/feats/skills/etc.;
    clear only when an upstream choice invalidates them (e.g. new path/species);
    (2) Skills Browse all Skills is Layer 2 below recommended cards, not attached to the list;
    (3) Secondary Ability gets a clear grid pill like Archetype Ability.
  acceptance_criteria:
    - Back / chapter navigation preserves ancestry, skills, feats, abilities unless path or species changes.
    - Changing path clears dependent skills/feats/loadout/powers; same-path re-select keeps them.
    - Skills: recommended cards then GuidedLayerNav Browse all Skills (not footer of skill list).
    - Abilities grid shows Secondary Ability pill when path has a distinct secondary_ability.
  evidence: |
    Ancestry trait-1 re-select preserves trait-2; abilities effect skips overwrite when mode recommended/custom;
    path change invalidates downstream + resets ability scores; skills L2 via GuidedLayerNav;
    AbilityScoreGrid secondaryAbility + resolveDistinctSecondaryAbility (abilities step + reveal).
  notes: |
    Owner 2026-07-15 guided creator feedback; logged in ALL_FEEDBACK_CLEAN.md.
    Mobile pill overflow / AbilityScoreGrid density = TASK-452 (done); footer hints = TASK-453 (done).
    Audit 2026-07-15: restored corrupted ALL_FEEDBACK encoding; subtle-fg secondary pill token.

- id: TASK-448
  title: Guided creator — detail Select/Close + chapter-jump first screen
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T027
      - DEV-V-013-T028
      - DEV-V-013-T029
      - DEV-V-013-T030
      - DEV-V-013-T031
  developer_test_plan: |
    DEV-V-013-T027/T028 Close|Select on species and path More details; T029 Foundation rail → Path;
    T030 Ancestry rail → species overview; T031 footer Back stays sequential.
  related_files:
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/guided-species-detail-modal.tsx
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/stores/guided-creator-store.ts
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Owner feedback: species/path More details footers Close (left) + Select (right);
    chapter rail jumps to first sub-screen of target; footer Back stays sequential.
  acceptance_criteria:
    - Species and path detail modals show Close left, Select right; Select applies entity and closes.
    - Chapter rail to Foundation lands on path (not species).
    - Chapter rail to Ancestry lands on species overview (not mid flaw/trait).
    - Footer Back from next chapter still lands on last sequential ancestry/equipment screen.
  evidence: |
    GuidedEntityDetailModal onSelect footer; store navigationIntent first|sequential + entryNonce;
    ancestry/loadout apply first-screen landing on jump.
  notes: |
    Owner 2026-07-15 guided creator feedback; implemented directly.
    Audit 2026-07-15: REALMS §3.1 updated (More details open ≠ select; footer Select OK);
    Select closes via modal onClose; T023 aligned after phase-strip removal (TASK-447).

- id: TASK-447
  title: Guided equipment — drop phase bar, PointStatus Currency, card chips + cost fix
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T026
  developer_test_plan: |
    DEV-V-013-T004 updated; T026 PointStatus + property chips + no progress bar.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-currency.ts
  description: |
    Remove equipment phase SegmentedControl; show Currency via PointStatus like skills/abilities;
    spell Currency fully in L1/L2; remove Path pick badges; fix cost chip 0 bug (costs.totalCurrency);
    cards show image/title/description + named property chips with hover tips.
  acceptance_criteria:
    - No weapon/armor/gear progress strip; Next/Back + footer fraction only.
    - PointStatus label Currency with total/spent on every equipment phase.
    - No Path pick badge on path cards.
    - Currency chip shows real unit cost (not 0 when costs.totalCurrency set).
    - Weapons/armor: description + named property chips; hover tip when property has description.
    - L1/L2 copy does not use "c" for Currency.
  evidence: |
    Deleted guided-equipment-phase-progress; PointStatus in phase layout; resolveItemUnitCost
    reads costs.totalCurrency; cardChips + InfoTippy hover; GAME_RULES L1/L2 abbreviation note.
  notes: |
    Owner 2026-07-15 — agree L1/L2 should spell game terms; dense L3 may abbreviate.

- id: TASK-446
  title: Guided equipment L1 — card-first simplify + orphan selection fix
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T025
  developer_test_plan: |
    DEV-V-013-T004 (path picks, no summary chrome); T025 card-first + orphan prune.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/lib/guided-creator/equipment-phase-candidates.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/resolve-loadout-items.ts
  description: |
    Align equipment L1 with feats/path: drop “Your selection” summary chips; quieter phase
    copy + currency; collapsed cards show few tags (damage/handedness/cost) with depth under
    More details; See more options for catalog. Fix selection/grid desync by always showing
    path L1 picks (no ability eligibility filter on L1), merging selected catalog rows into
    the grid, and pruning unresolved draft refs.
  acceptance_criteria:
    - No “Your selection” summary strip on weapon/armor/gear L1.
    - Collapsed weapon/armor cards show a small quiet tag set; More details has full fact chips.
    - Currency is a quiet secondary line; phase descriptions are short.
    - Path pool cards always appear on L1; selected items stay visible even if outside pool.
    - Unresolved draft weapon/armor/gear ids are cleared when library lookup loads.
  evidence: |
    Removed guided-equipment-phase-selection; getPhaseL1Candidates no L2 eligibility on path
    rows + selectedId merge; pruneUnresolvedLoadoutRefs in loadout-step; quiet tags in
    equipment-phase-stats; See more options label.
    Cleanup 2026-07-15: dead selectedSummary/emptySelection/phaseLockedHint copy removed;
    L1 uses PhaseL1RankContext only; equipment More details exception documented in
    FEATURE_INDEX / AGENT_GUIDE / REALMS §5.7 / GUIDED_SPEC.
  notes: |
    Owner 2026-07-15 — equipment felt glitchy/cluttered vs other guided steps.

- id: TASK-445
  title: Stable expand toggle — expand without moving the click target (sitewide)
  created_at: 2026-07-15
  created_by: owner
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-021
    tests:
      - DEV-V-021-T001
      - DEV-V-021-T002
      - DEV-V-021-T003
  developer_test_plan: |
    Suite DEV-V-021 T001–T003 — see BUILD_VALIDATION.md
  related_files:
    - src/components/ui/expandable-chip.tsx
    - src/lib/chip/expandable-chip-shell.ts
    - src/lib/chip/measure-stable-expand-width.ts
    - src/components/shared/summary-chip-list.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/part-chip.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/creator/collapsible-section.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/MOBILE_UX.md
    - src/app/dev/styleguide/page.tsx
  description: |
    Sitewide UX rule: click-to-expand controls must keep the toggle under the pointer so a
    second click closes without mouse travel. Expandable chips in wrap groups often jump when
    `fullWidthWhenExpanded` forces a new flex-wrap row. Fix ExpandableChip / ChipGroup first,
    document the standard for GridListRow, cards, and other expand-in-place UI, then audit
    offenders. Prefer growing content and pushing siblings while the opened control’s origin
    (especially vertical) stays put.
  acceptance_criteria:
    - Document “stable expand toggle” in AGENT_GUIDE (and brief MOBILE_UX note): opened
      control’s click target does not shift under the cursor; siblings may move.
    - ExpandableChip in ChipGroup / SummaryChipList / part lists: expand then immediately
      re-click same screen position collapses (styleguide + one production surface proof).
    - fullWidthWhenExpanded (or replacement pattern) no longer relocates the expanded chip’s
      header to a different wrap row solely due to width:100%.
    - GridListRow / guided card inline expand verified or fixed to the same rule.
    - Styleguide demo of wrap chips expanding without pointer jump.
    - npm run build; build-validation tests for chip + at least one row expander.
  evidence: |
    Chips: measured remaining-row width from collapsed left edge; no shell w-full; equal
    padding; header truncate; ChipGroup hosts. GuidedChoiceCard: Read more/less above body.
    CollapsibleSection: items-start + fixed meta line. Docs cite accordion/Fitts best practice.
    DEV-V-021 T001–T003. Build passes.  notes: |
    Owner feedback 2026-07-15. Best practice = spatial stability for disclosure toggles
    (same family as accordion headers staying put while panels open below).

- id: TASK-444
  title: Guided powers/techniques — visible confirm + Layer 2 browse (§3.1 / §5.8)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  follow_up_tasks:
    - TASK-458
    - TASK-461
    - TASK-463
    - TASK-470
    - TASK-471
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-powers-techniques-browse-panel.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Align guided powers/techniques with Layer 1 choice principle (§3.1): user should see and
    own path recommendations (cards + toggle/confirm), not silent auto-select of every ID.
    Add catalog Layer 2 via GuidedLayerNav + browse (feat/loadout parity) with GridListRow /
    UnifiedSelectionModal as appropriate. REALMS §5.8 gap from 2026-07-15 vision reconcile.
  acceptance_criteria:
    - Path recommendations shown as selectable GuidedChoiceCards; selection state is explicit.
    - No silent select-all on mount that the user cannot see as their choice (pre-check OK if visible).
    - GuidedLayerNav “See more options” opens filtered browse; “Back to recommendations” returns to L1.
    - Martial → techniques only; Power → powers only; naming per existing copy.
    - npm run build; DEV-V-013 test(s) for powers L1 confirm + L2 expand/collapse.
  notes: |
    2026-07-15: Done. Feats-style in-step L2 (`GuidedPowersTechniquesBrowsePanel` + GuidedLayerNav);
    soft-seed affordable path picks with visible card state; TP gating reused from TASK-456.
    Promoting non-path L2 picks into L1 cards = TASK-458.
    2026-07-15 follow-up wave: owner wants equipment-parity cards (TASK-470), true modal L2 +
    energy filter (TASK-463 updated), innate vs powers split (TASK-471-473). Interim card browse
    is superseded by TASK-463 — do not extend the browse panel.
  build_validation: DEV-V-013-T043
  developer_test_plan: DEV-V-013
  evidence: |
    L1 GuidedChoiceCards + See more options / Back to recommendations; Martial techniques-only /
    Power powers-only; DEV-V-013-T043; npm run build.

- id: TASK-441
  title: Guided ancestry traits — shared limited-uses notice (like feats)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T021
  developer_test_plan: |
    DEV-V-013-T021 — Ancestry trait cards with uses_per_rec show uses notice when selected/expanded (same shell as feats).
  related_files:
    - src/lib/codex/feat-restriction-notice.ts
    - src/components/guided-creator/guided-restriction-notice.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
  description: |
    Traits with limited uses must show recovery notice on guided choice cards when selected/expanded,
    sharing code with feat restriction notices (no parallel copy/UI).
  acceptance_criteria:
    - Ancestry GuidedChoiceCards use GuidedTraitRestrictionNotice / getLimitedUsesNotice shared with feats.
    - Selecting a limited-use trait expands and shows uses-per-recovery copy.
    - npm run build passes.
  evidence: |
    getLimitedUsesNotice shared; GuidedRestrictionNotice shell; trait wiring on ancestry-step;
    unit tests for feat/trait wording parity.

- id: TASK-442
  title: Guided equipment — remove quick kits (FE + admin; DB migration proposed)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-422
  completed_work: |
    - Removed GuidedLoadoutKitPresets UI and auto-apply first kit.
    - Admin no longer authors kit JSON; shared gear renamed recommended adventuring gear.
    - Path deep-dive kit catalog section removed (gear items only).
    - Draft loadoutId cleared on picks; reveal summary no longer kit-titled.
    - Applied sql/guided-remove-loadout-kits-proposed.sql on RealmsRPG-Test (Berserker kits cleared;
      flat level1_armaments/equipment retained). Pool no longer reads kits.
  remaining_work: |
    None for kit removal. Path content seeding for non-Berserker paths = TASK-423.
  follow_up_tasks:
    - TASK-423
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T022
  developer_test_plan: |
    DEV-V-013-T004 updated (no kits); DEV-V-013-T022 — admin has no kit JSON field.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/guided-remove-loadout-kits-proposed.sql
  description: |
    Remove all quick-kit frontend and backend authoring. Users pick weapons/armor individually.
    Live DB kits flattened via owner-approved SQL.
  acceptance_criteria:
    - No Quick kits UI on guided loadout.
    - Admin cannot author kits; saves do not create new kits.
    - Owner-approved SQL flattens kits into level1_armaments/equipment and strips kit arrays.
  evidence: |
    Live DB: 0 rows with level1_loadouts after UPDATE; Berserker armaments/equipment CSV intact.
    Audit 2026-07-15: Removed loadoutId draft field; pool API flat-only; deleted loadoutKitToDetailOption;
    Playwright loadout audit no longer expects Quick kits; FEATURE_INDEX / REALMS / GUIDED_SPEC /
    AGENT_GUIDE / GAME_RULES / SUPABASE_SCHEMA / seed SQL comments updated; serialize never writes kits;
    berserker kit SQL marked superseded.

- id: TASK-443
  title: Guided equipment — phase visibility + weapon/armor/gear card remodel
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T013
      - DEV-V-013-T023
      - DEV-V-013-T024
  developer_test_plan: |
    DEV-V-013-T004/T013 updated; T023 phase skip numbering; T024 gear add-all + quantity.
  related_files:
    - src/lib/guided-creator/equipment-phase-nav.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-choice-card.tsx
  description: |
    Skip weapon/armor phases when path has no options; renumber SegmentedControl dynamically.
    Weapon/armor cards: fact chips + More details → expandable property chips; currency on all phases.
    Gear: Add all recommended + per-item quantity; L2 browse retained.
  acceptance_criteria:
    - Visible phases only; labels 1..N for present phases (no phantom Armor/Weapons).
    - Weapon/armor chips cover ability req, handedness, damage/type, properties, cost.
    - More details expands to ExpandableChips with descriptions.
    - Currency remaining shown on weapon, armor, and gear phases.
    - Gear has Add all recommended + quantity steppers without requiring L2.
  evidence: |
    resolveEquipmentPhaseVisibility; GuidedEquipmentFactChips; currency on phase layout;
    addAllRecommendedEquipment + setItemQuantityInGuidedDraft.

- id: TASK-432
  title: Guided choice-card deep-dive — Phase 1 foundation (affordance + modal shell)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T016
  developer_test_plan: |
    DEV-V-013-T016 — Path + Species More details opens modal without selecting; card click still selects.
  follow_up_tasks:
    - TASK-433
    - TASK-434
    - TASK-435
  evidence: |
    GuidedChoiceCard onDetails (stopPropagation); GuidedEntityDetailModal shell (fullScreenOnMobile,
    CollapsibleSection + InfoTippy tip slot); wired path + species with description overview + demo
    option section; docs/naming in REALMS §5.0.1, AGENT_GUIDE, FEATURE_INDEX, guided-creator-copy.
    Audit 2026-07-15: detail lookup uses full lists (not LayerNav-filtered); modal remount key per
    entity; Modal sticky shrink-0 header/footer + description contrast + close padding; DRY
    guided-entity-detail-shell helpers; DEV-V-013-T016 tightened.
  description: |
    Owner feedback 2026-07-15 (“Layer 2 Cards”): progressive disclosure on choice cards needs an
    explicit path from Layer 1 card → information modal for that entity — opened only via a
    “More details” control, never by selecting the card. Opening More details must not select;
    footer Select on path/species (TASK-448) is a later add. Inline See more / expandedExtra stay as
    light in-card disclosure.

    IMPORTANT naming (document in REALMS + AGENT_GUIDE):
    - Catalog Layer 2 = GuidedLayerNav “See more options” / browse / UnifiedSelectionModal (existing).
    - Choice-card deep-dive = “More details” on a GuidedChoiceCard → GuidedEntityDetailModal (this epic).
    Do not reuse “See more” wording that opens catalog L2; prefer “More details” / “View details”.

    Phase 1 ships the shared primitives only (no species/path content yet):
    1) GuidedChoiceCard optional details affordance (link/button; stopPropagation; ≥44px; aria-label).
    2) Shared GuidedEntityDetailModal shell: Modal + fullScreenOnMobile, sticky header/footer,
       scrollable body, title/description slots, overview slot, CollapsibleSection list slot,
       semantic tokens, readable type, not overwhelming.
    3) Product/docs: § progressive disclosure on cards in REALMS_PRODUCT_OVERVIEW; FEATURE_INDEX +
       AGENT_GUIDE pointers; copy keys in guided-creator-copy.
  related_files:
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/ui/modal.tsx
    - src/components/creator/collapsible-section.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/MOBILE_UX.md
    - src/docs/ACCESSIBILITY.md
  acceptance_criteria:
    - GuidedChoiceCard accepts optional onDetails / detailsLabel; clicking it does not call onSelect.
    - Selecting the card body still selects; Read more still expands in-card only.
    - GuidedEntityDetailModal uses Modal fullScreenOnMobile; sticky header/footer; accessible name.
    - Shell renders overview + N collapsible sections with placeholder/demo content in isolation
      (Story-less: temporary wire on one path or species card behind a feature flag OR unit/visual
      smoke in guided only — prefer wiring both steps with empty sections deferred to 433/434).
    - Docs clarify deep-dive vs catalog Layer 2; copy keys exist; contrast + touch-target checklists pass.
    - npm run build passes; no regression to existing choice-card select/expand behavior.
  notes: |
    Epic sequencing: 432 foundation → 433 species content → 434 path content → 435 shared
    GridListRow option presets + remodel of legacy overview surfaces reused from advanced creator.
    Prefer remodel-in-place of shared primitives over forking parallel “guided-only” row components.
    Reference SpeciesRevealPanel + home/guided visual language; avoid copying dense species-modal UX as-is.

- id: TASK-433
  title: Guided choice-card deep-dive — Phase 2 species detail modal
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T017
  developer_test_plan: |
    DEV-V-013-T017 — Species More details: overview parity + trait/characteristic/flaw catalogs; selection independent.
  follow_up_tasks:
    - TASK-434
    - TASK-435
  evidence: |
    GuidedSpeciesDetailModal + GuidedTraitOptionList (GridListRow); SpeciesRevealPanel readOnlyDetail /
    hideChoiceTeaser; pick-count InfoTippy copy in tooltip-text; empty sections omitted; DEV-V-013-T017.
    Audit 2026-07-15: overview renders while traits load; known-trait resolve (no phantoms); truncated
    description columns; single itemCount on sections; granted trait uses/recovery displayed.
  description: |
    Wire species GuidedChoiceCards to GuidedEntityDetailModal. Overview in the modal mirrors the
    guided species overview experience (SpeciesRevealPanel / ancestry species overview): hero art,
    vitals (language, avg height/weight, size/type, adulthood/lifespan as available), full description
    — clean sections, readable type, not overwhelming. Size picker / draft mutation stay on the
    post-select overview step (modal is read-only preview unless product later opts in).

    Below overview: CollapsibleSections for trait options, characteristic options, flaw options.
    Section headers use InfoTippy tooltips explaining how many of each the player picks during
    species/ancestry creation (copy in tooltip-text.tsx). Expanding a section lists options as
    elongated expandable rows (prefer GridListRow / existing SpeciesTraitCard patterns remodeled
    for clarity — full remodel of row chrome can land in TASK-435 if needed; Phase 2 must be usable).
  related_files:
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/species-trait-card.tsx
    - src/components/shared/grid-list-row.tsx
    - public/tooltip-text.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - Species cards show “More details”; opens modal; does not change selection.
    - Overview content parity with post-select species overview fields (description + vitals + art).
    - Expandable sections: traits / characteristics / flaws with pick-count tooltips.
    - Option rows expandable with truncated descriptions; uses / key facts visible when available.
    - Modal closes cleanly; keyboard/focus + fullScreenOnMobile OK; WCAG contrast tokens.
    - npm run build; add DEV-V-013 tests for species deep-dive open/close + selection independence.
  notes: |
    Depends on TASK-432. Do not block on perfect GridListRow column presets — TASK-435 unifies.
    Extract shared overview blocks from SpeciesRevealPanel where it reduces duplication.

- id: TASK-434
  title: Guided choice-card deep-dive — Phase 3 path detail modal
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T018
  developer_test_plan: |
    DEV-V-013-T018 — Path More details: overview + feat/weapon/armor/loadout/power|technique catalogs; selection independent.
  follow_up_tasks:
    - TASK-435
  evidence: |
    GuidedPathDetailModal + GuidedPathDetailOverview + GuidedDetailOptionList (GridListRow); feats split by
    char_feat; equipment via buildEquipmentLookup/catalog-rows; unarmed when recommendUnarmedProwess;
    martial→techniques, power/powered-martial→powers; path-step wired; copy + tooltip-text tips;
    DEV-V-013-T018; npm run build.
    Audit 2026-07-15: overview-while-loading catalogs; omit power/tech/feat phantoms; feat id|name resolve;
    martial ability labeling (no Secondary mislabel); expandable property chips via useItemProperties;
    shield stats not forced through weapon damage; skill id phantoms omitted; T018 tightened.
  description: |
    Wire path GuidedChoiceCards to GuidedEntityDetailModal. Overview: full description, proficiency,
    primary/secondary recommended abilities, recommended skills — well separated, readable.
    CollapsibleSections for path catalog slices that exist on the path (omit empty):
    archetype feat options, character feat options, weapon options (incl. unarmed prowess when
    flagged), armor options, equipment loadout(s), technique options, power options.
    Expanding a section lists related items as elongated expandable rows / GridListRow with
    truncated descriptions and domain stats (uses; energy/range/damage; handedness/range/damage/type;
    DR / crit / ability req; property chips with existing expand-chip behavior).
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/lib/game/archetype-path.ts
    - src/types/archetype.ts
    - src/components/shared/grid-list-row.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-catalog-rows.ts
    - public/tooltip-text.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - Path cards show “More details”; opens modal; does not change path selection.
    - Overview shows description + proficiency + recommended abilities/skills when data exists.
    - Only non-empty option sections appear; each expands to a usable list with truncated copy + stats.
    - Unarmed prowess appears only when path recommends it (same rule as equipment L1).
    - Property chips / expand-for-more parity with guided list UX (reuse shared chips).
    - npm run build; DEV-V-013 tests for path deep-dive + selection independence.
  notes: |
    Depends on TASK-432; ideally after TASK-433 so species proves the shell. Reuse path_data parsers
    and equipment-catalog-rows / feat helpers — remodel presentation, don’t invent parallel data paths.

- id: TASK-435
  title: Guided choice-card deep-dive — Phase 4 shared option rows + remodel legacy surfaces
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T019
  developer_test_plan: |
    DEV-V-013-T019 — Shared DetailOptionList on species/path deep-dives + SpeciesRevealPanel granted + species-modal trait sections.
  evidence: |
    DetailOptionList + lib/detail-option builders (trait/feat/equipment/loadout/power/technique + property
    chips); GuidedTraitOptionList + GuidedDetailOptionList thin wrappers; SpeciesRevealPanel granted
    traits remodeled; advanced species-modal TraitSection → DetailOptionList; AGENT_GUIDE/FEATURE_INDEX/
    REALMS; DEV-V-013-T019; npm run build.
    Audit 2026-07-15: extracted equipmentRefToDetailOption / combat builders from path modal; FEATURE_INDEX
    triad wording; species-modal !found dimming + choice-option uses; stable list keys.
  description: |
    After species + path deep-dives work end-to-end, unify the elongated option lists and remodel
    any reused advanced-creator / modal code so presentation matches the home + guided product
    rework (clarity, progressive disclosure, semantic tokens, GridListRow + chip expand patterns).
    Goal: one shared “detail option row” toolkit for traits, feats, weapons, armor, powers,
    techniques — column stats appropriate per entity; used inside GuidedEntityDetailModal and
    adopted where SpeciesRevealPanel / species-modal / add-modals still look legacy when showing
    the same entities.
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/species-trait-card.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Shared builders/presets for detail-modal option rows (traits/feats/weapons/armor/powers/techs).
    - Species + path deep-dive modals consume the shared presets (no one-off row markup left).
    - At least one legacy surface (species-modal and/or SpeciesRevealPanel lists) remodeled to the
      same visual/interaction language — audit before/after; no behavior regression.
    - AGENT_GUIDE + FEATURE_INDEX document when to use deep-dive modal vs catalog L2 vs Read more.
    - npm run build; extend DEV-V-013; spot-check light + dark contrast.
  notes: |
    Depends on TASK-433 + TASK-434. Do not expand scope to all choice-card kinds (feats, loadouts)
    unless leftover capacity — file follow-up TASK-### for additional entity deep-dives.

- id: TASK-436
  title: Guided deep-dive polish — path overview, tip bodies, labeled fact chips
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-434
  follow_up_tasks:
    - TASK-437
    - TASK-438
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T020
  developer_test_plan: |
    DEV-V-013-T020 — Path overview polish + tip bodies + Name/Description-only option lists.
  related_files:
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/shared/detail-option-list.tsx
    - src/lib/detail-option/
    - src/lib/constants/copy/guided-creator-copy.ts
    - public/tooltip-text.tsx
  description: |
    Owner polish after TASK-432–435: hide irrelevant path proficiency lines; Archetype Ability
    labels (Powered-Martial: Archetype Power Ability + Archetype Martial Ability, both primary;
    Power paths may show Secondary Recommended Ability); Recommended Abilities (not scores);
    expandable Recommended Skills chips; Path Options preamble above catalogs; title-less
    InfoTippy tips; Name+Description option lists with self-describing expanded fact chips.
  acceptance_criteria:
    - Martial path More details does not show Power Proficiency 0 (or any unused proficiency).
    - Path abilities: Archetype Ability; Powered-Martial dual Power/Martial Archetype Abilities;
      Power secondary recommended when present.
    - Recommended Skills use SummaryChipList with descriptions.
    - Path Options title + intro above catalogs (notes-only paths still show Path Options).
    - Deep-dive tips have no redundant titles.
    - DetailOptionList catalogs hide column headers; facts are labeled chips (no Stats column API).
    - npm run build; DEV-V-013-T020.
  evidence: |
    Audit 2026-07-15 closed gaps: abilities recommendedHint (Abilities not scores); removed dead
    Stats/uses/items copy + statsColumnLabel; Path Options for notes-only; labeled Use chips for
    gear; tip Action Type wording; species detail capitalize Traits/Flaw; title-less tips restored;
    showColumnHeaders=false on guided + species-modal; T020 updated for Powered-Martial.

- id: TASK-437
  title: Sitewide GridListRow — labeled fact chips when columns are omitted
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-436
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T007
      - DEV-V-016-T008
      - DEV-V-016-T009
      - DEV-V-016-T010
  developer_test_plan: |
    DEV-V-016-T007 — Sheet Add Power columns + Range chip.
    DEV-V-016-T008 — Codex Equipment Damage / Dmg. Red. + Weight chip.
    DEV-V-016-T009 — Creator powers/techniques omitted fact chips.
    DEV-V-016-T010 — Creature creator Duration + armament fact chips.
  related_files:
    - src/lib/library-selectable-builders.ts
    - src/lib/chip/list-row-metadata.ts
    - src/hooks/add-library-item/build-empowered-selectable-item.ts
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/detail-option/equipment-builder.ts
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Universal policy: if information would normally sit under a ListHeader column (Damage,
    Range, Damage Reduction, Action Type, Energy, Uses, Duration, handedness, crit, requirements,
    etc.), then either keep that column with a header OR show a self-describing expanded chip that
    includes both the label and the value (e.g. Damage Reduction 2). Do not drop a column and leave
    only an unlabeled or ambiguous chip.

    Owner lock (2026-07-15): **Dense browse lists keep column headers when space allows**; labeled
    chips for omitted-column facts apply primarily to **deep-dive / progressive-disclosure** lists
    (`DetailOptionList`). Audit order: Library → Codex → character sheet library → add modals.
  acceptance_criteria:
    - Policy documented (AGENT_GUIDE + FEATURE_INDEX) with browse-vs-deep-dive distinction.
    - Audit inventory of GridListRow consumers with column-vs-chip gaps.
    - Fix priority surfaces in order: Library, Codex, sheet library, add-library-item (and peers).
    - npm run build; add or extend DEV-V tests for touched surfaces.
  evidence: |
    Phase 1: Library/Official/sheet column-complete; add/load powers Energy/Duration/Area/Damage +
    Range chip; Codex Equipment Damage/Dmg. Red.; deep-dive Handedness/Block; docs.
    Phase 2 re-audit (owner asked sitewide): closed creator powers Area + empowered Duration/Area
    chips; technique Action column; creature-creator Duration + armament Damage/Range/DR chips;
    Admin Equipment parity; equipment-step Range chip; sheet `Cost Nc` badge.
    DEV-V-016-T007–T010; npm run build passed after both phases.
  notes: |
    Guided deep-dive already compliant (TASK-436). Do not strip columns from dense browse UIs.

- id: TASK-438
  title: Agent user-facing copy guide — game terms capitalization + preferred vocabulary
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-436
  follow_up_tasks:
    - TASK-439
  related_files:
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - AGENTS.md
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Refine existing GAME_RULES Terminology (do not invent a parallel doc): soft prefer/avoid
    vocabulary, Score = Bonus + 10, Bonus not modifier, capitalize game terms in game-term context,
    no em dash in new UI copy (hyphens fine). Point AGENT_GUIDE + AGENTS.md at that section.
    Soft guide only — do not over-constrain agent writing.
  acceptance_criteria:
    - GAME_RULES Terminology expanded with prefer/avoid + writing notes; Score/Bonus clarified.
    - AGENT_GUIDE + AGENTS.md point agents there for user-facing strings.
    - Light guided copy fixes for obvious drift (e.g. Customize Abilities not scores).
    - Changelog note.
  evidence: |
    GAME_RULES Terminology expanded; AGENT_GUIDE/AGENTS pointers; Customize Abilities copy fix;
    Powered-Martial Archetype Power/Martial Ability labels (guided overview). Em dash ban
    (not hyphen ban) documented. Historical full-site rewrite deferred → **TASK-439**.
  notes: |
    Owner: expand what exists; whitelist/blacklist soft; Score = Bonus+10; avoid Spell/AC/Race/Class/
    Check/Save/DC/modifier; do not extremely limit agents.
    Scope clarification 2026-07-15: TASK-438 = guide + light guided fixes only. Sitewide scan/
    rewrite of existing user-facing strings is TASK-439 (was never run under 438).

- id: TASK-439
  title: Sitewide user-facing copy audit — Realms terms + em dash + AI-artifact hygiene
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-438
  follow_up_tasks:
    - TASK-440
  related_files:
    - src/docs/GAME_RULES.md
    - src/lib/constants/copy/
    - public/tooltip-text.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/components/character-creator/
    - src/components/guided-creator/
  description: |
    Follow-up to TASK-438 (guide only). Scan and fix existing user-facing product strings so they
    respect GAME_RULES Terminology: capitalize game terms in game-term context; prefer/avoid
    vocabulary (Abilities not Ability Scores UI label; Bonus not modifier; Difficulty Score not DC;
    Skill Roll not Check/Save; Archetype Path not Class; Species not Race; Power not Spell; no AC;
    Health/Energy vs inventing mana/HP jargon where Realms terms apply); remove em dashes (`—`)
    from UI/marketing/tooltip copy (hyphens fine); tone down stock AI phrasing where it reads fake.

    Soft guide, not a muzzle: ordinary English stays OK when not naming a rules concept. Do not
    rewrite in-world flavor that intentionally uses fiction words. Do not rewrite the rules book
    extract wholesale unless a UI string cites it wrongly.

    Phased (inventory → fix → next phase):
    1) Inventory: `src/lib/constants/copy/*` + `public/tooltip-text.tsx` (em dash + avoid-term hits).
    2) Guided + advanced character creator copy + tips (highest product traffic).
    3) Marketing/legal surfaces (landing, about, rules, resources, auth, nav, footer, privacy, terms).
    4) In-app UI not yet in copy modules (sheet, library, campaigns, creators, encounters) — grep
       hardcoded user strings; migrate or fix in place per TASK-390 patterns when practical.
    5) Spot-check capitalisation of Species/Feat/Skill/Power etc. in the strings touched.

    Baseline known debt (2026-07-15 spot check): em dashes still present across copy modules
    (guided-creator-copy ~27) and tooltip-text; full banned-term scan not completed.
  acceptance_criteria:
    - Phase 1 inventory checked in (counts + file list of em dash / prefer-avoid hits) in task evidence.
    - Phases 2–3 copy modules + tooltip-text cleaned of em dashes and clear prefer/avoid violations
      (or explicit keep-exceptions noted).
    - Phase 4: either fixed high-traffic hardcoded strings or follow-up TASK-### filed with remaining
      surface list (do not boil the ocean in one PR if sheet/creators explode scope).
    - AGENT_GUIDE note that new copy must follow GAME_RULES Terminology (already present; keep true).
    - npm run build; add a small DEV-V suite or checklist for sample pages (landing + guided path +
      one sheet string if touched).
  evidence: |
    Phase 1 inventory (2026-07-15):
    - Em dash in *user string literals*: guided-creator-copy.ts = 22; marketing *-copy.ts* + tooltip-text
      = 0 (hits were file-header / developer comments only).
    - Prefer/avoid in copy+tooltip: no Ability Scores/DC/Class/Race/Spell/Check hits; Base HP → fixed.
    Keep-exceptions: developer comments; empty-field placeholder glyph `—`; dense creature/encounter
    HUD label HP (allowed abbr per GAME_RULES).
    Phases 2–3: guided-creator-copy em dashes removed; Base Health/Energy; Ability Bonuses/Points;
    Power/Martial Ability labels; marketing modules already clean of user-facing em dashes/banned terms.
    Phase 4 high-traffic: advanced creator step strings; roll-log aria Bonus; CodexFeatsTab; admin
    Abilities/Health labels; encounters meta; crafting Difficulty Score Bonus; power-creator mechanics
    copy. Residuals → TASK-440.
    Audit follow-up (2026-07-15, post-"done"): closed misses (ability-effect-blurbs, format-recovery,
    path-validation messages, sheet path/edit-archetype copy, expandable-image placeholder, styleguide
    labels, AdminPartsTab ±%, creature-creator "Damage Modifiers" → Resistances/Weaknesses/Immunities).
    Re-scan: 0 Ability Scores / Difficulty Class / Skill Check / Saving Throw / Armor Class /
    Damage Modifiers in UI tree; remaining em dashes are comments or `—` placeholders only.
  build_validation: |
    suite: DEV-V-020
    tests:
      - DEV-V-020-T001
      - DEV-V-020-T002
      - DEV-V-020-T003
  developer_test_plan: |
    Suite DEV-V-020 T001–T003 — landing + guided chooser + roll-log Bonus aria; see BUILD_VALIDATION.md
  notes: |
    Distinct from TASK-390 (copy module migration — done). Distinct from TASK-437 (GridListRow facts).
    Owner asked 2026-07-15 whether 438 included sitewide audit — it did not; this task owns that work.

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
